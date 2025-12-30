package dev.mainul35.cms.event;

import dev.mainul35.cms.sdk.event.EventContext;
import dev.mainul35.cms.sdk.event.EventHandler;
import dev.mainul35.cms.sdk.event.EventResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.lang.reflect.Method;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Central registry for event handlers.
 *
 * This registry:
 * 1. Auto-discovers @EventHandler annotated methods from Spring beans
 * 2. Allows plugins to register handlers at runtime
 * 3. Routes events to appropriate handlers based on componentId and eventType
 * 4. Supports handler chaining with priority ordering
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class EventHandlerRegistry {

    private final ApplicationContext applicationContext;

    /**
     * Registry key format: "pluginId:componentId:eventType"
     * Value: List of handler entries sorted by priority (descending)
     */
    private final Map<String, List<HandlerEntry>> handlers = new ConcurrentHashMap<>();

    /**
     * Handler entry containing metadata and the executable
     */
    public record HandlerEntry(
            String pluginId,
            String componentId,
            String eventType,
            String description,
            int priority,
            boolean async,
            boolean continueOnSuccess,
            boolean continueOnError,
            Object beanInstance,
            Method method
    ) implements Comparable<HandlerEntry> {
        @Override
        public int compareTo(HandlerEntry other) {
            // Higher priority first
            return Integer.compare(other.priority, this.priority);
        }
    }

    /**
     * Initialize the registry and discover handlers from Spring beans
     */
    @PostConstruct
    public void initialize() {
        log.info("Initializing EventHandlerRegistry...");
        discoverHandlers();
        log.info("EventHandlerRegistry initialized with {} handler groups", handlers.size());
    }

    /**
     * Discover @EventHandler annotated methods from all Spring beans
     */
    private void discoverHandlers() {
        String[] beanNames = applicationContext.getBeanDefinitionNames();

        for (String beanName : beanNames) {
            try {
                Object bean = applicationContext.getBean(beanName);
                Class<?> beanClass = bean.getClass();

                // Check all methods for @EventHandler annotation
                for (Method method : beanClass.getDeclaredMethods()) {
                    EventHandler annotation = method.getAnnotation(EventHandler.class);
                    if (annotation != null) {
                        registerHandler(bean, method, annotation, null);
                    }
                }
            } catch (Exception e) {
                // Skip beans that can't be inspected
                log.trace("Skipping bean {} for event handler discovery: {}", beanName, e.getMessage());
            }
        }
    }

    /**
     * Register an event handler from a plugin
     *
     * @param beanInstance The bean containing the handler method
     * @param method       The handler method
     * @param annotation   The @EventHandler annotation
     * @param pluginId     The plugin ID (null for core handlers)
     */
    public void registerHandler(Object beanInstance, Method method, EventHandler annotation, String pluginId) {
        // Validate method signature
        validateHandlerMethod(method);

        HandlerEntry entry = new HandlerEntry(
                pluginId,
                annotation.componentId(),
                annotation.eventType(),
                annotation.description(),
                annotation.priority(),
                annotation.async(),
                annotation.continueOnSuccess(),
                annotation.continueOnError(),
                beanInstance,
                method
        );

        // Build registry key
        String key = buildKey(pluginId, annotation.componentId(), annotation.eventType());

        handlers.computeIfAbsent(key, k -> Collections.synchronizedList(new ArrayList<>()))
                .add(entry);

        // Sort by priority
        handlers.get(key).sort(Comparator.naturalOrder());

        log.info("Registered event handler: {} -> {}.{}() [priority={}]",
                key, beanInstance.getClass().getSimpleName(), method.getName(), annotation.priority());
    }

    /**
     * Register a handler programmatically (without annotation)
     */
    public void registerHandler(
            String pluginId,
            String componentId,
            String eventType,
            Object beanInstance,
            String methodName,
            int priority
    ) {
        try {
            Method method = beanInstance.getClass().getMethod(methodName, EventContext.class);
            HandlerEntry entry = new HandlerEntry(
                    pluginId,
                    componentId,
                    eventType,
                    "",
                    priority,
                    false,
                    true,
                    false,
                    beanInstance,
                    method
            );

            String key = buildKey(pluginId, componentId, eventType);
            handlers.computeIfAbsent(key, k -> Collections.synchronizedList(new ArrayList<>()))
                    .add(entry);
            handlers.get(key).sort(Comparator.naturalOrder());

            log.info("Registered event handler programmatically: {}", key);
        } catch (NoSuchMethodException e) {
            throw new IllegalArgumentException("Handler method not found: " + methodName, e);
        }
    }

    /**
     * Unregister all handlers for a plugin
     */
    public void unregisterPlugin(String pluginId) {
        handlers.entrySet().removeIf(entry -> {
            entry.getValue().removeIf(handler -> Objects.equals(handler.pluginId(), pluginId));
            return entry.getValue().isEmpty();
        });
        log.info("Unregistered all handlers for plugin: {}", pluginId);
    }

    /**
     * Get handlers for a specific event
     *
     * Resolution order:
     * 1. Plugin-specific handler (pluginId:componentId:eventType)
     * 2. Plugin wildcard event handler (pluginId:componentId:*)
     * 3. Plugin wildcard component handler (pluginId:*:eventType)
     * 4. Core handler (null:componentId:eventType)
     * 5. Core wildcard handlers
     */
    public List<HandlerEntry> getHandlers(String pluginId, String componentId, String eventType) {
        List<HandlerEntry> result = new ArrayList<>();

        // Try in order of specificity
        List<String> keysToTry = Arrays.asList(
                buildKey(pluginId, componentId, eventType),   // Most specific
                buildKey(pluginId, componentId, "*"),         // Plugin component wildcard
                buildKey(pluginId, "*", eventType),           // Plugin event wildcard
                buildKey(null, componentId, eventType),       // Core handler
                buildKey(null, componentId, "*"),             // Core component wildcard
                buildKey(null, "*", eventType),               // Core event wildcard
                buildKey(null, "*", "*")                      // Global wildcard
        );

        for (String key : keysToTry) {
            List<HandlerEntry> found = handlers.get(key);
            if (found != null) {
                result.addAll(found);
            }
        }

        // Sort by priority (higher first)
        result.sort(Comparator.naturalOrder());

        return result;
    }

    /**
     * Execute handlers for an event
     *
     * @return Aggregated result from all handlers
     */
    public EventResult executeHandlers(String pluginId, String componentId, String eventType, EventContext context) {
        List<HandlerEntry> handlerList = getHandlers(pluginId, componentId, eventType);

        if (handlerList.isEmpty()) {
            log.debug("No handlers found for event: {}:{}:{}", pluginId, componentId, eventType);
            return EventResult.success().withMessage("No handlers registered").build();
        }

        log.debug("Executing {} handler(s) for event: {}:{}:{}", handlerList.size(), pluginId, componentId, eventType);

        List<EventResult> results = new ArrayList<>();
        boolean shouldContinue = true;

        for (HandlerEntry handler : handlerList) {
            if (!shouldContinue) {
                break;
            }

            try {
                EventResult result;

                if (handler.async()) {
                    // Execute async handlers in background
                    CompletableFuture.runAsync(() -> {
                        try {
                            invokeHandler(handler, context);
                        } catch (Exception e) {
                            log.error("Async handler error: {}", e.getMessage(), e);
                        }
                    });
                    result = EventResult.success().withMessage("Handler queued for async execution").build();
                } else {
                    result = invokeHandler(handler, context);
                }

                results.add(result);

                // Check if we should continue
                if (result.isSuccess()) {
                    shouldContinue = handler.continueOnSuccess();
                } else {
                    shouldContinue = handler.continueOnError();
                }

            } catch (Exception e) {
                log.error("Handler execution error: {}", e.getMessage(), e);
                results.add(EventResult.failure(e.getMessage()).build());
                shouldContinue = handler.continueOnError();
            }
        }

        return aggregateResults(results);
    }

    /**
     * Invoke a single handler
     */
    private EventResult invokeHandler(HandlerEntry handler, EventContext context) throws Exception {
        handler.method().setAccessible(true);
        Object result = handler.method().invoke(handler.beanInstance(), context);

        if (result instanceof EventResult eventResult) {
            return eventResult;
        } else if (result instanceof CompletableFuture<?> future) {
            // Handle async methods
            Object futureResult = future.get();
            if (futureResult instanceof EventResult eventResult) {
                return eventResult;
            }
        }

        // Default success if method returns something else
        return EventResult.success().build();
    }

    /**
     * Aggregate multiple results into a single result
     */
    private EventResult aggregateResults(List<EventResult> results) {
        if (results.isEmpty()) {
            return EventResult.success().build();
        }

        if (results.size() == 1) {
            return results.get(0);
        }

        // Check for any failures
        boolean hasFailure = results.stream().anyMatch(EventResult::isFailure);
        boolean hasSuccess = results.stream().anyMatch(EventResult::isSuccess);

        EventResult.Builder builder;
        if (hasFailure && hasSuccess) {
            builder = EventResult.partial("Some handlers failed");
        } else if (hasFailure) {
            builder = EventResult.failure("Handler(s) failed");
        } else {
            builder = EventResult.success();
        }

        // Aggregate data from all results
        for (EventResult result : results) {
            if (result.getData() != null) {
                builder.withData(result.getData());
            }
            if (result.getErrors() != null) {
                result.getErrors().forEach(builder::withError);
            }
            if (result.getPropUpdates() != null) {
                builder.updateProps(result.getPropUpdates());
            }
            if (result.getStyleUpdates() != null) {
                builder.updateStyles(result.getStyleUpdates());
            }
            if (result.getFrontendCommands() != null) {
                result.getFrontendCommands().forEach(builder::addCommand);
            }
            if (result.getBroadcastEvents() != null) {
                result.getBroadcastEvents().forEach((k, v) -> {
                    if (v instanceof Map) {
                        builder.broadcast(k, (Map<String, Object>) v);
                    }
                });
            }
        }

        return builder.build();
    }

    /**
     * Validate handler method signature
     */
    private void validateHandlerMethod(Method method) {
        Class<?>[] paramTypes = method.getParameterTypes();
        if (paramTypes.length != 1 || !EventContext.class.isAssignableFrom(paramTypes[0])) {
            throw new IllegalArgumentException(
                    "Event handler method must accept a single EventContext parameter: " + method);
        }

        Class<?> returnType = method.getReturnType();
        if (!EventResult.class.isAssignableFrom(returnType) &&
                !CompletableFuture.class.isAssignableFrom(returnType) &&
                !void.class.equals(returnType)) {
            throw new IllegalArgumentException(
                    "Event handler method must return EventResult, CompletableFuture<EventResult>, or void: " + method);
        }
    }

    /**
     * Build a registry key
     */
    private String buildKey(String pluginId, String componentId, String eventType) {
        return String.format("%s:%s:%s",
                pluginId != null ? pluginId : "*",
                componentId,
                eventType);
    }

    /**
     * Get all registered handler keys (for debugging)
     */
    public Set<String> getRegisteredKeys() {
        return handlers.keySet();
    }

    /**
     * Get handler count
     */
    public int getHandlerCount() {
        return handlers.values().stream().mapToInt(List::size).sum();
    }
}

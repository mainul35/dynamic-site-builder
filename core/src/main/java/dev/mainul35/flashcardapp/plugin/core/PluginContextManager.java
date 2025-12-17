package dev.mainul35.flashcardapp.plugin.core;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Manages Spring ApplicationContexts for each plugin.
 * Each plugin gets its own isolated Spring context that can have its own beans,
 * while still having access to the parent application context for shared services.
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class PluginContextManager {

    private final ApplicationContext mainApplicationContext;

    /**
     * Map of plugin ID to plugin-specific ApplicationContext
     */
    private final Map<String, ConfigurableApplicationContext> pluginContexts = new ConcurrentHashMap<>();

    /**
     * Create a new Spring ApplicationContext for a plugin
     *
     * @param pluginId      Unique plugin identifier
     * @param classLoader   Plugin's ClassLoader
     * @param basePackages  Base packages to scan for components
     * @return The created ApplicationContext
     */
    public ConfigurableApplicationContext createPluginContext(
            String pluginId,
            ClassLoader classLoader,
            String... basePackages) {

        log.info("Creating Spring ApplicationContext for plugin: {}", pluginId);

        // Check if context already exists
        if (pluginContexts.containsKey(pluginId)) {
            log.warn("ApplicationContext already exists for plugin: {}", pluginId);
            return pluginContexts.get(pluginId);
        }

        try {
            // Create a new AnnotationConfigApplicationContext with custom ClassLoader
            AnnotationConfigApplicationContext context = new AnnotationConfigApplicationContext();

            // Set the parent context (gives access to main app's beans)
            context.setParent(mainApplicationContext);

            // Set the plugin's ClassLoader
            context.setClassLoader(classLoader);

            // Register base packages for component scanning
            if (basePackages != null && basePackages.length > 0) {
                context.scan(basePackages);
            }

            // Register the plugin ID as a bean property
            context.getBeanFactory().registerSingleton("pluginId", pluginId);

            // Refresh the context to initialize all beans
            context.refresh();

            // Store the context
            pluginContexts.put(pluginId, context);

            log.info("Successfully created ApplicationContext for plugin: {}", pluginId);
            return context;

        } catch (Exception e) {
            log.error("Failed to create ApplicationContext for plugin: {}", pluginId, e);
            throw new RuntimeException("Failed to create plugin context for: " + pluginId, e);
        }
    }

    /**
     * Get the ApplicationContext for a plugin
     *
     * @param pluginId Unique plugin identifier
     * @return The plugin's ApplicationContext, or null if not found
     */
    public ConfigurableApplicationContext getPluginContext(String pluginId) {
        return pluginContexts.get(pluginId);
    }

    /**
     * Check if a plugin has an active ApplicationContext
     *
     * @param pluginId Unique plugin identifier
     * @return true if context exists and is active
     */
    public boolean hasPluginContext(String pluginId) {
        ConfigurableApplicationContext context = pluginContexts.get(pluginId);
        return context != null && context.isActive();
    }

    /**
     * Close and remove the ApplicationContext for a plugin
     *
     * @param pluginId Unique plugin identifier
     */
    public void destroyPluginContext(String pluginId) {
        log.info("Destroying ApplicationContext for plugin: {}", pluginId);

        ConfigurableApplicationContext context = pluginContexts.remove(pluginId);

        if (context != null) {
            try {
                // Close the context (will call destroy methods on all beans)
                context.close();
                log.info("Successfully destroyed ApplicationContext for plugin: {}", pluginId);
            } catch (Exception e) {
                log.error("Error destroying ApplicationContext for plugin: {}", pluginId, e);
            }
        } else {
            log.warn("No ApplicationContext found for plugin: {}", pluginId);
        }
    }

    /**
     * Get a bean from a plugin's ApplicationContext
     *
     * @param pluginId  Unique plugin identifier
     * @param beanClass Bean class
     * @param <T>       Bean type
     * @return The bean instance, or null if not found
     */
    public <T> T getPluginBean(String pluginId, Class<T> beanClass) {
        ConfigurableApplicationContext context = pluginContexts.get(pluginId);
        if (context != null && context.isActive()) {
            try {
                return context.getBean(beanClass);
            } catch (Exception e) {
                log.error("Failed to get bean {} from plugin context: {}", beanClass.getName(), pluginId, e);
                return null;
            }
        }
        return null;
    }

    /**
     * Get a bean by name from a plugin's ApplicationContext
     *
     * @param pluginId Unique plugin identifier
     * @param beanName Bean name
     * @return The bean instance, or null if not found
     */
    public Object getPluginBean(String pluginId, String beanName) {
        ConfigurableApplicationContext context = pluginContexts.get(pluginId);
        if (context != null && context.isActive()) {
            try {
                return context.getBean(beanName);
            } catch (Exception e) {
                log.error("Failed to get bean {} from plugin context: {}", beanName, pluginId, e);
                return null;
            }
        }
        return null;
    }

    /**
     * Get all active plugin contexts
     *
     * @return Map of plugin ID to ApplicationContext
     */
    public Map<String, ConfigurableApplicationContext> getAllPluginContexts() {
        return new ConcurrentHashMap<>(pluginContexts);
    }

    /**
     * Destroy all plugin contexts (used during shutdown)
     */
    public void destroyAllPluginContexts() {
        log.info("Destroying all plugin ApplicationContexts");
        pluginContexts.keySet().forEach(this::destroyPluginContext);
    }
}

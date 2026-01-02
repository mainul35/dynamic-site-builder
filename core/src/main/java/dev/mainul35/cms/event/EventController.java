package dev.mainul35.cms.event;

import dev.mainul35.cms.sdk.event.EventResult;
import dev.mainul35.cms.security.filter.JwtAuthenticationFilter.JwtUserPrincipal;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationContext;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;

/**
 * REST Controller for invoking backend event handlers.
 *
 * This endpoint is called by the frontend event system when:
 * 1. A component triggers an event with CALL_API action
 * 2. A component has backend event handlers registered
 *
 * Endpoint: POST /api/events/invoke
 */
@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(originPatterns = "*") // Configure appropriately for production
public class EventController {

    private final EventHandlerRegistry eventHandlerRegistry;
    private final ApplicationContext applicationContext;
    private final EventBroadcastService eventBroadcastService;

    /**
     * Request body for event invocation
     */
    public record EventInvokeRequest(
            // Component info
            String instanceId,
            String componentId,
            String pluginId,

            // Event info
            String eventType,
            long timestamp,

            // Data
            Map<String, Object> props,
            Map<String, String> styles,
            Map<String, Object> eventData,

            // Page context
            Long pageId,
            String pageName,

            // Source
            String source
    ) {}

    /**
     * Response for event invocation
     */
    public record EventInvokeResponse(
            String status,
            String message,
            Map<String, Object> data,
            Map<String, String> errors,
            Map<String, Object> propUpdates,
            Map<String, String> styleUpdates,
            Map<String, Object> commands,
            Map<String, Object> broadcast
    ) {
        public static EventInvokeResponse fromResult(EventResult result) {
            return new EventInvokeResponse(
                    result.getStatus().name().toLowerCase(),
                    result.getMessage(),
                    result.getData(),
                    result.getErrors(),
                    result.getPropUpdates(),
                    result.getStyleUpdates(),
                    result.getFrontendCommands(),
                    result.getBroadcastEvents()
            );
        }
    }

    /**
     * Invoke backend event handlers
     *
     * POST /api/events/invoke
     */
    @PostMapping("/invoke")
    public ResponseEntity<EventInvokeResponse> invokeEvent(
            @RequestBody EventInvokeRequest request,
            HttpServletRequest httpRequest
    ) {
        log.info("Event invocation: {}:{} on component {}",
                request.pluginId(), request.eventType(), request.componentId());

        try {
            // Extract user/session info from security context
            boolean isAuthenticated = false;
            Set<String> userRoles = Set.of();
            String userId = null;

            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.isAuthenticated() &&
                    authentication.getPrincipal() instanceof JwtUserPrincipal principal) {
                isAuthenticated = true;
                userRoles = principal.roles();
                // Convert Long userId to String for the context
                userId = principal.userId() != null ? principal.userId().toString() : null;
                log.debug("Event from authenticated user: {} (ID: {})", principal.email(), userId);
            }

            // Build event context
            DefaultEventContext context = DefaultEventContext.builder()
                    .instanceId(request.instanceId())
                    .componentId(request.componentId())
                    .pluginId(request.pluginId())
                    .eventType(request.eventType())
                    .timestamp(request.timestamp() > 0 ? request.timestamp() : System.currentTimeMillis())
                    .props(request.props() != null ? request.props() : Map.of())
                    .styles(request.styles() != null ? request.styles() : Map.of())
                    .eventData(request.eventData() != null ? request.eventData() : Map.of())
                    .pageId(request.pageId())
                    .pageName(request.pageName())
                    .source(request.source() != null ? request.source() : "unknown")
                    .headers(extractHeaders(httpRequest))
                    .clientIp(getClientIp(httpRequest))
                    .authenticated(isAuthenticated)
                    .userId(userId)
                    .userRoles(userRoles)
                    .applicationContext(applicationContext)
                    .build();

            // Execute handlers
            EventResult result = eventHandlerRegistry.executeHandlers(
                    request.pluginId(),
                    request.componentId(),
                    request.eventType(),
                    context
            );

            // Handle broadcast events via WebSocket
            if (result.getBroadcastEvents() != null && !result.getBroadcastEvents().isEmpty()) {
                eventBroadcastService.broadcastEvents(
                        request.pluginId(),
                        request.componentId(),
                        request.instanceId(),
                        request.pageId(),
                        result.getBroadcastEvents()
                );
            }

            return ResponseEntity.ok(EventInvokeResponse.fromResult(result));

        } catch (Exception e) {
            log.error("Event invocation failed: {}", e.getMessage(), e);
            EventResult errorResult = EventResult.failure("Event handler error: " + e.getMessage()).build();
            return ResponseEntity.internalServerError()
                    .body(EventInvokeResponse.fromResult(errorResult));
        }
    }

    /**
     * Get registered event handlers (for debugging/admin)
     *
     * GET /api/events/handlers
     */
    @GetMapping("/handlers")
    public ResponseEntity<Map<String, Object>> getHandlers() {
        Map<String, Object> info = new HashMap<>();
        info.put("registeredKeys", eventHandlerRegistry.getRegisteredKeys());
        info.put("totalHandlers", eventHandlerRegistry.getHandlerCount());
        return ResponseEntity.ok(info);
    }

    /**
     * Extract relevant headers from request
     */
    private Map<String, String> extractHeaders(HttpServletRequest request) {
        Map<String, String> headers = new HashMap<>();
        // Only include safe headers
        String[] safeHeaders = {"user-agent", "accept-language", "content-type", "origin", "referer"};
        for (String header : safeHeaders) {
            String value = request.getHeader(header);
            if (value != null) {
                headers.put(header, value);
            }
        }
        return headers;
    }

    /**
     * Get client IP address
     */
    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}

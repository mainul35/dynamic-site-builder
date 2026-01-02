package dev.mainul35.cms.event;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;

/**
 * Service for broadcasting events via WebSocket to connected clients.
 *
 * Topics:
 * - /topic/events - All broadcast events
 * - /topic/events/{pluginId} - Events for a specific plugin
 * - /topic/events/{pluginId}/{componentId} - Events for a specific component
 * - /topic/page/{pageId} - Events for a specific page
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class EventBroadcastService {

    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Broadcast event message DTO
     */
    public record BroadcastMessage(
            String eventType,
            String pluginId,
            String componentId,
            String instanceId,
            Long pageId,
            Map<String, Object> data,
            long timestamp
    ) {}

    /**
     * Broadcast events from an event result to all relevant topics.
     *
     * @param pluginId The plugin that triggered the event
     * @param componentId The component that triggered the event
     * @param instanceId The component instance ID
     * @param pageId The page ID (optional)
     * @param broadcastEvents Map of event type to event data
     */
    public void broadcastEvents(
            String pluginId,
            String componentId,
            String instanceId,
            Long pageId,
            Map<String, Object> broadcastEvents
    ) {
        if (broadcastEvents == null || broadcastEvents.isEmpty()) {
            return;
        }

        long timestamp = Instant.now().toEpochMilli();

        for (Map.Entry<String, Object> entry : broadcastEvents.entrySet()) {
            String eventType = entry.getKey();
            Object eventData = entry.getValue();

            // Convert event data to Map if it isn't already
            @SuppressWarnings("unchecked")
            Map<String, Object> data = eventData instanceof Map
                    ? (Map<String, Object>) eventData
                    : Map.of("value", eventData);

            BroadcastMessage message = new BroadcastMessage(
                    eventType,
                    pluginId,
                    componentId,
                    instanceId,
                    pageId,
                    data,
                    timestamp
            );

            // Broadcast to general events topic
            messagingTemplate.convertAndSend("/topic/events", message);
            log.debug("Broadcast event to /topic/events: {}", eventType);

            // Broadcast to plugin-specific topic
            if (pluginId != null) {
                messagingTemplate.convertAndSend("/topic/events/" + pluginId, message);
                log.debug("Broadcast event to /topic/events/{}: {}", pluginId, eventType);

                // Broadcast to component-specific topic
                if (componentId != null) {
                    messagingTemplate.convertAndSend(
                            "/topic/events/" + pluginId + "/" + componentId,
                            message
                    );
                    log.debug("Broadcast event to /topic/events/{}/{}: {}",
                            pluginId, componentId, eventType);
                }
            }

            // Broadcast to page-specific topic
            if (pageId != null) {
                messagingTemplate.convertAndSend("/topic/page/" + pageId, message);
                log.debug("Broadcast event to /topic/page/{}: {}", pageId, eventType);
            }
        }

        log.info("Broadcast {} event(s) for component {}/{}",
                broadcastEvents.size(), pluginId, componentId);
    }

    /**
     * Send a direct message to a specific user (by session).
     * Useful for user-specific notifications.
     *
     * @param sessionId The user's WebSocket session ID
     * @param destination The destination path (without /user prefix)
     * @param payload The message payload
     */
    public void sendToUser(String sessionId, String destination, Object payload) {
        messagingTemplate.convertAndSendToUser(sessionId, destination, payload);
        log.debug("Sent direct message to session {}: {}", sessionId, destination);
    }

    /**
     * Broadcast a page update notification.
     * Called when a page's content changes (save, component update, etc.)
     *
     * @param pageId The page ID
     * @param updateType The type of update (e.g., "save", "component_added", "component_removed")
     * @param data Additional data about the update
     */
    public void broadcastPageUpdate(Long pageId, String updateType, Map<String, Object> data) {
        if (pageId == null) {
            return;
        }

        PageUpdateMessage message = new PageUpdateMessage(
                "page_update",
                updateType,
                pageId,
                data != null ? data : Map.of(),
                Instant.now().toEpochMilli()
        );

        String destination = "/topic/page/" + pageId;
        messagingTemplate.convertAndSend(destination, message);
        log.info("Broadcast page update to /topic/page/{}: {}", pageId, updateType);
    }

    /**
     * Page update message DTO
     */
    public record PageUpdateMessage(
            String type,
            String updateType,
            Long pageId,
            Map<String, Object> data,
            long timestamp
    ) {}
}

package dev.mainul35.cms.event;

import dev.mainul35.cms.sdk.event.EventContext;
import lombok.Builder;
import lombok.Getter;
import org.springframework.context.ApplicationContext;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * Default implementation of EventContext.
 */
@Getter
@Builder
public class DefaultEventContext implements EventContext {

    // Component info
    private final String instanceId;
    private final String componentId;
    private final String pluginId;

    // Event info
    private final String eventType;
    private final long timestamp;
    @Builder.Default
    private final String eventId = UUID.randomUUID().toString();

    // Data
    private final Map<String, Object> props;
    private final Map<String, String> styles;
    private final Map<String, Object> eventData;

    // Page context
    private final Long pageId;
    private final String pageName;

    // User context
    private final String userId;
    private final String sessionId;
    private final Map<String, Object> sessionAttributes;
    private final boolean authenticated;
    private final java.util.Set<String> userRoles;

    // Request context
    private final String source;
    private final Map<String, String> headers;
    private final String clientIp;

    // Spring context for bean access
    private final ApplicationContext applicationContext;

    @Override
    public <T> T getProp(String name, Class<T> type) {
        if (props == null) return null;
        Object value = props.get(name);
        if (value == null) return null;
        return type.cast(value);
    }

    @Override
    public <T> T getProp(String name, Class<T> type, T defaultValue) {
        T value = getProp(name, type);
        return value != null ? value : defaultValue;
    }

    @Override
    public boolean hasProp(String name) {
        return props != null && props.containsKey(name);
    }

    @Override
    public String getStyle(String name) {
        return styles != null ? styles.get(name) : null;
    }

    @Override
    public <T> T getEventData(String key, Class<T> type) {
        if (eventData == null) return null;
        Object value = eventData.get(key);
        if (value == null) return null;
        return type.cast(value);
    }

    @Override
    public <T> T getEventData(String key, Class<T> type, T defaultValue) {
        T value = getEventData(key, type);
        return value != null ? value : defaultValue;
    }

    @Override
    public Optional<Long> getPageId() {
        return Optional.ofNullable(pageId);
    }

    @Override
    public Optional<String> getPageName() {
        return Optional.ofNullable(pageName);
    }

    @Override
    public Optional<String> getUserId() {
        return Optional.ofNullable(userId);
    }

    @Override
    public Optional<String> getSessionId() {
        return Optional.ofNullable(sessionId);
    }

    @Override
    public <T> Optional<T> getSessionAttribute(String key, Class<T> type) {
        if (sessionAttributes == null) return Optional.empty();
        Object value = sessionAttributes.get(key);
        if (value == null) return Optional.empty();
        return Optional.of(type.cast(value));
    }

    @Override
    public boolean isAuthenticated() {
        return authenticated;
    }

    @Override
    public boolean hasRole(String role) {
        return userRoles != null && userRoles.contains(role);
    }

    @Override
    public Optional<String> getClientIp() {
        return Optional.ofNullable(clientIp);
    }

    @Override
    public <T> T getBean(Class<T> beanClass) {
        if (applicationContext == null) {
            throw new IllegalStateException("ApplicationContext not available");
        }
        return applicationContext.getBean(beanClass);
    }

    @Override
    public <T> T getBean(String name, Class<T> beanClass) {
        if (applicationContext == null) {
            throw new IllegalStateException("ApplicationContext not available");
        }
        return applicationContext.getBean(name, beanClass);
    }
}

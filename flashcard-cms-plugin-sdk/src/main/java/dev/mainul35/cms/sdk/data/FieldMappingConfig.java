package dev.mainul35.cms.sdk.data;

/**
 * Configuration for mapping a field from API response to component prop.
 * Supports JSON path syntax for extracting nested values.
 */
public class FieldMappingConfig {

    /**
     * JSON path to extract value (e.g., "data.items", "response.user.name", "items[0].title")
     */
    private String path;

    /**
     * Optional transformation to apply: "uppercase", "lowercase", "date", "currency", etc.
     */
    private String transform;

    /**
     * Default value if path not found or value is null
     */
    private Object fallback;

    public FieldMappingConfig() {}

    public FieldMappingConfig(String path) {
        this.path = path;
    }

    public FieldMappingConfig(String path, String transform) {
        this.path = path;
        this.transform = transform;
    }

    public FieldMappingConfig(String path, String transform, Object fallback) {
        this.path = path;
        this.transform = transform;
        this.fallback = fallback;
    }

    // Builder pattern
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private final FieldMappingConfig config = new FieldMappingConfig();

        public Builder path(String path) {
            config.path = path;
            return this;
        }

        public Builder transform(String transform) {
            config.transform = transform;
            return this;
        }

        public Builder fallback(Object fallback) {
            config.fallback = fallback;
            return this;
        }

        public FieldMappingConfig build() {
            return config;
        }
    }

    // Getters and setters
    public String getPath() {
        return path;
    }

    public void setPath(String path) {
        this.path = path;
    }

    public String getTransform() {
        return transform;
    }

    public void setTransform(String transform) {
        this.transform = transform;
    }

    public Object getFallback() {
        return fallback;
    }

    public void setFallback(Object fallback) {
        this.fallback = fallback;
    }

    @Override
    public String toString() {
        return "FieldMappingConfig{" +
                "path='" + path + '\'' +
                ", transform='" + transform + '\'' +
                ", fallback=" + fallback +
                '}';
    }
}

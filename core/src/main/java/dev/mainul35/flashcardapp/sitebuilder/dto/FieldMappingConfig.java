package dev.mainul35.flashcardapp.sitebuilder.dto;

/**
 * Configuration for mapping a field from API response to component prop.
 */
public class FieldMappingConfig {

    private String path;       // JSON path (e.g., "data.items", "response.user.name")
    private String transform;  // Optional: "uppercase", "lowercase", "date", etc.
    private Object fallback;   // Default value if path not found

    public FieldMappingConfig() {}

    public FieldMappingConfig(String path) {
        this.path = path;
    }

    // Getters and setters
    public String getPath() { return path; }
    public void setPath(String path) { this.path = path; }

    public String getTransform() { return transform; }
    public void setTransform(String transform) { this.transform = transform; }

    public Object getFallback() { return fallback; }
    public void setFallback(Object fallback) { this.fallback = fallback; }
}

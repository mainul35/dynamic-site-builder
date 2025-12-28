package dev.mainul35.cms.sdk.data;

import java.util.Map;

/**
 * Configuration for a data source.
 * This is a DTO - contains configuration only, no logic.
 */
public class DataSourceConfig {

    /**
     * Type of data source (API, STATIC, CONTEXT, DATABASE)
     */
    private DataSourceType type;

    /**
     * API endpoint URL (for API type).
     * Can be absolute or relative to gateway URL.
     */
    private String endpoint;

    /**
     * HTTP method for API calls (GET or POST)
     */
    private String method;

    /**
     * Custom headers for API calls
     */
    private Map<String, String> headers;

    /**
     * Field mapping to transform API response to expected structure
     */
    private Map<String, FieldMappingConfig> fieldMapping;

    /**
     * Cache key for caching responses
     */
    private String cacheKey;

    /**
     * Cache TTL in milliseconds
     */
    private Long cacheTtlMs;

    /**
     * Static data (for STATIC type)
     */
    private Object staticData;

    /**
     * Context key (for CONTEXT type)
     */
    private String contextKey;

    /**
     * Database query or named query (for DATABASE type)
     */
    private String query;

    /**
     * Request body for POST requests
     */
    private Object requestBody;

    public DataSourceConfig() {}

    // Builder pattern
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private final DataSourceConfig config = new DataSourceConfig();

        public Builder type(DataSourceType type) {
            config.type = type;
            return this;
        }

        public Builder endpoint(String endpoint) {
            config.endpoint = endpoint;
            return this;
        }

        public Builder method(String method) {
            config.method = method;
            return this;
        }

        public Builder headers(Map<String, String> headers) {
            config.headers = headers;
            return this;
        }

        public Builder fieldMapping(Map<String, FieldMappingConfig> fieldMapping) {
            config.fieldMapping = fieldMapping;
            return this;
        }

        public Builder cacheKey(String cacheKey) {
            config.cacheKey = cacheKey;
            return this;
        }

        public Builder cacheTtlMs(Long cacheTtlMs) {
            config.cacheTtlMs = cacheTtlMs;
            return this;
        }

        public Builder staticData(Object staticData) {
            config.staticData = staticData;
            return this;
        }

        public Builder contextKey(String contextKey) {
            config.contextKey = contextKey;
            return this;
        }

        public Builder query(String query) {
            config.query = query;
            return this;
        }

        public Builder requestBody(Object requestBody) {
            config.requestBody = requestBody;
            return this;
        }

        public DataSourceConfig build() {
            return config;
        }
    }

    // Getters and setters
    public DataSourceType getType() {
        return type;
    }

    public void setType(DataSourceType type) {
        this.type = type;
    }

    public String getEndpoint() {
        return endpoint;
    }

    public void setEndpoint(String endpoint) {
        this.endpoint = endpoint;
    }

    public String getMethod() {
        return method;
    }

    public void setMethod(String method) {
        this.method = method;
    }

    public Map<String, String> getHeaders() {
        return headers;
    }

    public void setHeaders(Map<String, String> headers) {
        this.headers = headers;
    }

    public Map<String, FieldMappingConfig> getFieldMapping() {
        return fieldMapping;
    }

    public void setFieldMapping(Map<String, FieldMappingConfig> fieldMapping) {
        this.fieldMapping = fieldMapping;
    }

    public String getCacheKey() {
        return cacheKey;
    }

    public void setCacheKey(String cacheKey) {
        this.cacheKey = cacheKey;
    }

    public Long getCacheTtlMs() {
        return cacheTtlMs;
    }

    public void setCacheTtlMs(Long cacheTtlMs) {
        this.cacheTtlMs = cacheTtlMs;
    }

    public Object getStaticData() {
        return staticData;
    }

    public void setStaticData(Object staticData) {
        this.staticData = staticData;
    }

    public String getContextKey() {
        return contextKey;
    }

    public void setContextKey(String contextKey) {
        this.contextKey = contextKey;
    }

    public String getQuery() {
        return query;
    }

    public void setQuery(String query) {
        this.query = query;
    }

    public Object getRequestBody() {
        return requestBody;
    }

    public void setRequestBody(Object requestBody) {
        this.requestBody = requestBody;
    }

    @Override
    public String toString() {
        return "DataSourceConfig{" +
                "type=" + type +
                ", endpoint='" + endpoint + '\'' +
                ", method='" + method + '\'' +
                ", cacheKey='" + cacheKey + '\'' +
                '}';
    }
}

package dev.mainul35.cms.sdk.data;

import java.util.HashMap;
import java.util.Map;

/**
 * Response object containing aggregated page data.
 * Contains data from all configured data sources for a page.
 */
public class PageData {

    /**
     * Data from each data source.
     * Key = data source name, Value = fetched data
     */
    private Map<String, Object> data;

    /**
     * Errors from failed data source fetches.
     * Key = data source name, Value = error message
     */
    private Map<String, String> errors;

    /**
     * Total time taken to fetch all data sources (in milliseconds)
     */
    private long fetchTimeMs;

    /**
     * Page metadata (title, description, etc.)
     */
    private PageMeta pageMeta;

    public PageData() {
        this.data = new HashMap<>();
        this.errors = new HashMap<>();
    }

    // Builder pattern
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private final PageData pageData = new PageData();

        public Builder data(Map<String, Object> data) {
            pageData.data = data != null ? data : new HashMap<>();
            return this;
        }

        public Builder addData(String key, Object value) {
            if (pageData.data == null) {
                pageData.data = new HashMap<>();
            }
            pageData.data.put(key, value);
            return this;
        }

        public Builder errors(Map<String, String> errors) {
            pageData.errors = errors != null ? errors : new HashMap<>();
            return this;
        }

        public Builder addError(String key, String error) {
            if (pageData.errors == null) {
                pageData.errors = new HashMap<>();
            }
            pageData.errors.put(key, error);
            return this;
        }

        public Builder fetchTimeMs(long fetchTimeMs) {
            pageData.fetchTimeMs = fetchTimeMs;
            return this;
        }

        public Builder pageMeta(PageMeta pageMeta) {
            pageData.pageMeta = pageMeta;
            return this;
        }

        public PageData build() {
            return pageData;
        }
    }

    /**
     * Check if all data sources were fetched successfully
     */
    public boolean isSuccess() {
        return errors == null || errors.isEmpty();
    }

    /**
     * Check if a specific data source was fetched successfully
     */
    public boolean hasData(String key) {
        return data != null && data.containsKey(key);
    }

    /**
     * Check if a specific data source had an error
     */
    public boolean hasError(String key) {
        return errors != null && errors.containsKey(key);
    }

    /**
     * Get data for a specific data source (returns null if not found or error)
     */
    @SuppressWarnings("unchecked")
    public <T> T getData(String key) {
        return data != null ? (T) data.get(key) : null;
    }

    // Getters and setters
    public Map<String, Object> getData() {
        return data;
    }

    public void setData(Map<String, Object> data) {
        this.data = data;
    }

    public Map<String, String> getErrors() {
        return errors;
    }

    public void setErrors(Map<String, String> errors) {
        this.errors = errors;
    }

    public long getFetchTimeMs() {
        return fetchTimeMs;
    }

    public void setFetchTimeMs(long fetchTimeMs) {
        this.fetchTimeMs = fetchTimeMs;
    }

    public PageMeta getPageMeta() {
        return pageMeta;
    }

    public void setPageMeta(PageMeta pageMeta) {
        this.pageMeta = pageMeta;
    }

    @Override
    public String toString() {
        return "PageData{" +
                "dataKeys=" + (data != null ? data.keySet() : "null") +
                ", errorKeys=" + (errors != null ? errors.keySet() : "null") +
                ", fetchTimeMs=" + fetchTimeMs +
                ", success=" + isSuccess() +
                '}';
    }

    /**
     * Page metadata
     */
    public static class PageMeta {
        private String title;
        private String description;
        private String path;
        private Long pageId;

        public PageMeta() {}

        public PageMeta(String title, String description) {
            this.title = title;
            this.description = description;
        }

        public String getTitle() {
            return title;
        }

        public void setTitle(String title) {
            this.title = title;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }

        public String getPath() {
            return path;
        }

        public void setPath(String path) {
            this.path = path;
        }

        public Long getPageId() {
            return pageId;
        }

        public void setPageId(Long pageId) {
            this.pageId = pageId;
        }
    }
}

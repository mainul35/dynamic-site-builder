package dev.mainul35.flashcardapp.sitebuilder.dto;

import java.util.Map;

/**
 * Response object containing aggregated page data.
 */
public class PageData {

    private Map<String, Object> data;    // Key = data source name, Value = fetched data
    private Map<String, String> errors;  // Key = data source name, Value = error message
    private long fetchTimeMs;
    private PageMeta pageMeta;

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private final PageData pageData = new PageData();

        public Builder data(Map<String, Object> data) {
            pageData.data = data;
            return this;
        }

        public Builder errors(Map<String, String> errors) {
            pageData.errors = errors;
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

    // Getters
    public Map<String, Object> getData() { return data; }
    public Map<String, String> getErrors() { return errors; }
    public long getFetchTimeMs() { return fetchTimeMs; }
    public PageMeta getPageMeta() { return pageMeta; }

    // Setters
    public void setData(Map<String, Object> data) { this.data = data; }
    public void setErrors(Map<String, String> errors) { this.errors = errors; }
    public void setFetchTimeMs(long fetchTimeMs) { this.fetchTimeMs = fetchTimeMs; }
    public void setPageMeta(PageMeta pageMeta) { this.pageMeta = pageMeta; }

    /**
     * Page metadata included in response
     */
    public static class PageMeta {
        private Long pageId;
        private String pageName;
        private String title;
        private String description;
        private String path;

        public Long getPageId() { return pageId; }
        public void setPageId(Long pageId) { this.pageId = pageId; }

        public String getPageName() { return pageName; }
        public void setPageName(String pageName) { this.pageName = pageName; }

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }

        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }

        public String getPath() { return path; }
        public void setPath(String path) { this.path = path; }
    }
}

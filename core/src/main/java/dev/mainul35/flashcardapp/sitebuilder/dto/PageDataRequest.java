package dev.mainul35.flashcardapp.sitebuilder.dto;

import java.util.Map;

/**
 * Request object for fetching page data.
 */
public class PageDataRequest {

    private Long pageId;
    private String pageName;
    private Map<String, DataSourceConfig> dataSources;
    private Map<String, String> requestParams;
    private UserContext userContext;

    // Builder pattern
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private final PageDataRequest request = new PageDataRequest();

        public Builder pageId(Long pageId) {
            request.pageId = pageId;
            return this;
        }

        public Builder pageName(String pageName) {
            request.pageName = pageName;
            return this;
        }

        public Builder dataSources(Map<String, DataSourceConfig> dataSources) {
            request.dataSources = dataSources;
            return this;
        }

        public Builder requestParams(Map<String, String> requestParams) {
            request.requestParams = requestParams;
            return this;
        }

        public Builder userContext(UserContext userContext) {
            request.userContext = userContext;
            return this;
        }

        public PageDataRequest build() {
            return request;
        }
    }

    // Getters
    public Long getPageId() { return pageId; }
    public String getPageName() { return pageName; }
    public Map<String, DataSourceConfig> getDataSources() { return dataSources; }
    public Map<String, String> getRequestParams() { return requestParams; }
    public UserContext getUserContext() { return userContext; }

    // Setters
    public void setPageId(Long pageId) { this.pageId = pageId; }
    public void setPageName(String pageName) { this.pageName = pageName; }
    public void setDataSources(Map<String, DataSourceConfig> dataSources) { this.dataSources = dataSources; }
    public void setRequestParams(Map<String, String> requestParams) { this.requestParams = requestParams; }
    public void setUserContext(UserContext userContext) { this.userContext = userContext; }
}

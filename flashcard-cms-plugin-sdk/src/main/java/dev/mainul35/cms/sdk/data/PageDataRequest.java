package dev.mainul35.cms.sdk.data;

import java.util.Map;

/**
 * Request object for fetching page data.
 * Contains all information needed to resolve data for a page.
 */
public class PageDataRequest {

    /**
     * Page ID (from database)
     */
    private Long pageId;

    /**
     * Page name (alternative to pageId)
     */
    private String pageName;

    /**
     * Data sources configured for the page
     */
    private Map<String, DataSourceConfig> dataSources;

    /**
     * Request parameters (query params, path variables, etc.)
     */
    private Map<String, String> requestParams;

    /**
     * User context (from authentication)
     */
    private UserContext userContext;

    /**
     * Locale for internationalization
     */
    private String locale;

    /**
     * Whether to force refresh (bypass cache)
     */
    private boolean forceRefresh;

    public PageDataRequest() {}

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

        public Builder locale(String locale) {
            request.locale = locale;
            return this;
        }

        public Builder forceRefresh(boolean forceRefresh) {
            request.forceRefresh = forceRefresh;
            return this;
        }

        public PageDataRequest build() {
            return request;
        }
    }

    // Getters and setters
    public Long getPageId() {
        return pageId;
    }

    public void setPageId(Long pageId) {
        this.pageId = pageId;
    }

    public String getPageName() {
        return pageName;
    }

    public void setPageName(String pageName) {
        this.pageName = pageName;
    }

    public Map<String, DataSourceConfig> getDataSources() {
        return dataSources;
    }

    public void setDataSources(Map<String, DataSourceConfig> dataSources) {
        this.dataSources = dataSources;
    }

    public Map<String, String> getRequestParams() {
        return requestParams;
    }

    public void setRequestParams(Map<String, String> requestParams) {
        this.requestParams = requestParams;
    }

    public UserContext getUserContext() {
        return userContext;
    }

    public void setUserContext(UserContext userContext) {
        this.userContext = userContext;
    }

    public String getLocale() {
        return locale;
    }

    public void setLocale(String locale) {
        this.locale = locale;
    }

    public boolean isForceRefresh() {
        return forceRefresh;
    }

    public void setForceRefresh(boolean forceRefresh) {
        this.forceRefresh = forceRefresh;
    }

    @Override
    public String toString() {
        return "PageDataRequest{" +
                "pageId=" + pageId +
                ", pageName='" + pageName + '\'' +
                ", locale='" + locale + '\'' +
                ", forceRefresh=" + forceRefresh +
                '}';
    }
}

package dev.mainul35.cms.sdk.data;

import java.util.Map;

/**
 * Interface for page data providers.
 * Implementations are in the core application and site runtime.
 *
 * This interface defines the contract for fetching aggregated page data.
 */
public interface PageDataProvider {

    /**
     * Get the unique identifier for this provider.
     *
     * @return Provider ID
     */
    String getProviderId();

    /**
     * Fetch all data for a page (used during SSR/initial load).
     * Aggregates data from all configured data sources.
     *
     * @param request The page data request containing page ID and params
     * @return Aggregated data from all configured data sources
     */
    PageData getPageData(PageDataRequest request);

    /**
     * Fetch data from a specific data source.
     * Used for client-side refresh of individual data sources.
     *
     * @param dataSourceKey The key identifying the data source
     * @param params Query parameters for the fetch
     * @return Result containing data or error
     */
    DataSourceResult fetchDataSource(String dataSourceKey, Map<String, Object> params);

    /**
     * Fetch multiple data sources at once.
     * More efficient than calling fetchDataSource multiple times.
     *
     * @param dataSourceKeys Keys of data sources to fetch
     * @param params Query parameters for the fetches
     * @return PageData containing results for each requested data source
     */
    default PageData fetchDataSources(String[] dataSourceKeys, Map<String, Object> params) {
        PageData.Builder builder = PageData.builder();
        long startTime = System.currentTimeMillis();

        for (String key : dataSourceKeys) {
            DataSourceResult result = fetchDataSource(key, params);
            if (result.isError()) {
                builder.addError(key, result.getErrorMessage());
            } else {
                builder.addData(key, result.getData());
            }
        }

        return builder.fetchTimeMs(System.currentTimeMillis() - startTime).build();
    }

    /**
     * Invalidate cache for a specific data source.
     *
     * @param dataSourceKey The data source key to invalidate
     */
    default void invalidateCache(String dataSourceKey) {
        // Default implementation does nothing
    }

    /**
     * Invalidate all cache entries.
     */
    default void invalidateAllCache() {
        // Default implementation does nothing
    }

    /**
     * Check if a data source exists for the given page.
     *
     * @param pageId The page ID
     * @param dataSourceKey The data source key
     * @return true if the data source exists
     */
    default boolean hasDataSource(Long pageId, String dataSourceKey) {
        return false;
    }
}

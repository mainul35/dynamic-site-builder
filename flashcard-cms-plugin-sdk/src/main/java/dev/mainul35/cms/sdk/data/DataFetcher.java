package dev.mainul35.cms.sdk.data;

import java.util.Map;

/**
 * Interface for fetching data from various sources (API, DB, etc.).
 * Implementations handle the actual HTTP/DB calls.
 *
 * This interface is defined in the SDK but implemented in:
 * - Core application (for Site Designer)
 * - Site Runtime (for exported sites)
 */
public interface DataFetcher {

    /**
     * Fetch data based on the configuration.
     *
     * @param config Data source configuration
     * @param params Runtime parameters (pagination, filters, etc.)
     * @return The fetched data (could be a Map, List, or primitive)
     */
    Object fetch(DataSourceConfig config, Map<String, String> params);

    /**
     * Check if this fetcher supports the given data source type.
     *
     * @param type The data source type to check
     * @return true if this fetcher can handle the given type
     */
    boolean supports(DataSourceType type);

    /**
     * Get the priority of this fetcher (higher = more preferred).
     * Used when multiple fetchers support the same type.
     *
     * @return Priority value (default is 0)
     */
    default int getPriority() {
        return 0;
    }

    /**
     * Get a unique identifier for this fetcher.
     *
     * @return Fetcher ID
     */
    default String getFetcherId() {
        return getClass().getSimpleName();
    }
}

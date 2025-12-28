package dev.mainul35.flashcardapp.sitebuilder.service;

import dev.mainul35.flashcardapp.sitebuilder.dto.DataSourceConfig;

import java.util.Map;

/**
 * Interface for fetching data from various sources (API, DB, etc.).
 * Implementations handle the actual HTTP/DB calls.
 */
public interface DataFetcher {

    /**
     * Fetch data based on the configuration.
     * @param config Data source configuration
     * @param params Runtime parameters (pagination, filters, etc.)
     * @return The fetched data (could be a Map, List, or primitive)
     */
    Object fetch(DataSourceConfig config, Map<String, String> params);

    /**
     * Check if this fetcher supports the given data source type.
     */
    boolean supports(DataSourceConfig.DataSourceType type);
}

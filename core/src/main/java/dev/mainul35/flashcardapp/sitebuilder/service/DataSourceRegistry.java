package dev.mainul35.flashcardapp.sitebuilder.service;

import dev.mainul35.flashcardapp.sitebuilder.dto.DataSourceConfig;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

/**
 * Registry of data fetchers. Selects appropriate fetcher based on data source type.
 * Uses Strategy pattern to handle different data source types.
 */
@Component
@Slf4j
public class DataSourceRegistry {

    private final List<DataFetcher> fetchers;

    public DataSourceRegistry(List<DataFetcher> fetchers) {
        this.fetchers = fetchers;
        log.info("DataSourceRegistry initialized with {} fetchers", fetchers.size());
    }

    /**
     * Find a fetcher that supports the given data source type.
     */
    public DataFetcher getFetcher(DataSourceConfig.DataSourceType type) {
        return fetchers.stream()
                .filter(f -> f.supports(type))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException(
                        "No data fetcher found for type: " + type));
    }

    /**
     * Fetch data using the appropriate fetcher.
     */
    public Object fetch(DataSourceConfig config, Map<String, String> params) {
        DataFetcher fetcher = getFetcher(config.getType());
        return fetcher.fetch(config, params);
    }

    /**
     * Check if a fetcher exists for the given type.
     */
    public boolean hasFetcher(DataSourceConfig.DataSourceType type) {
        return fetchers.stream().anyMatch(f -> f.supports(type));
    }

    /**
     * Get all registered fetcher types.
     */
    public List<DataSourceConfig.DataSourceType> getSupportedTypes() {
        return fetchers.stream()
                .flatMap(f -> java.util.Arrays.stream(DataSourceConfig.DataSourceType.values())
                        .filter(f::supports))
                .distinct()
                .toList();
    }
}

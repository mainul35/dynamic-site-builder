package dev.mainul35.flashcardapp.sitebuilder.service;

import dev.mainul35.flashcardapp.sitebuilder.dto.*;
import dev.mainul35.flashcardapp.sitebuilder.entity.PageDefinition;
import dev.mainul35.flashcardapp.sitebuilder.repository.PageDefinitionRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * Service for fetching and aggregating page data from configured data sources.
 * Handles API calls, field mapping, caching, and error handling.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PageDataService {

    private final PageDefinitionRepository pageDefinitionRepository;
    private final ObjectMapper objectMapper;

    private final RestTemplate restTemplate = new RestTemplate();

    // Simple in-memory cache (in production, use Redis or similar)
    private final Map<String, CachedData> cache = new ConcurrentHashMap<>();
    private static final long CACHE_TTL_MS = 60_000; // 1 minute default

    /**
     * Get all data for a page by aggregating all configured data sources.
     */
    public PageData getPageData(PageDataRequest request) {
        long startTime = System.currentTimeMillis();

        PageDefinition page = pageDefinitionRepository.findById(request.getPageId())
                .orElseThrow(() -> new RuntimeException("Page not found: " + request.getPageId()));

        return fetchPageData(page, request.getRequestParams(), startTime);
    }

    /**
     * Get all data for a page by name/slug.
     */
    public PageData getPageDataByName(PageDataRequest request) {
        long startTime = System.currentTimeMillis();

        PageDefinition page = pageDefinitionRepository.findByPageName(request.getPageName())
                .orElseThrow(() -> new RuntimeException("Page not found: " + request.getPageName()));

        return fetchPageData(page, request.getRequestParams(), startTime);
    }

    /**
     * Internal method to fetch page data.
     */
    private PageData fetchPageData(PageDefinition page, Map<String, String> params, long startTime) {
        // Parse data sources from page definition
        Map<String, DataSourceConfig> dataSources = parseDataSources(page);

        if (dataSources.isEmpty()) {
            return PageData.builder()
                    .data(Map.of())
                    .errors(Map.of())
                    .pageMeta(createPageMeta(page))
                    .fetchTimeMs(System.currentTimeMillis() - startTime)
                    .build();
        }

        // Fetch all data sources in parallel
        Map<String, Object> aggregatedData = new ConcurrentHashMap<>();
        Map<String, String> errors = new ConcurrentHashMap<>();

        List<CompletableFuture<Void>> futures = dataSources.entrySet().stream()
                .map(entry -> CompletableFuture.runAsync(() -> {
                    String key = entry.getKey();
                    DataSourceConfig config = entry.getValue();
                    try {
                        Object data = fetchFromDataSource(config, params != null ? params : Map.of());
                        aggregatedData.put(key, data);
                    } catch (Exception e) {
                        log.error("Failed to fetch data source '{}': {}", key, e.getMessage());
                        errors.put(key, e.getMessage());
                    }
                }))
                .collect(Collectors.toList());

        // Wait for all fetches to complete
        CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();

        return PageData.builder()
                .data(aggregatedData)
                .errors(errors)
                .pageMeta(createPageMeta(page))
                .fetchTimeMs(System.currentTimeMillis() - startTime)
                .build();
    }

    /**
     * Fetch a single data source by key.
     */
    public DataSourceResult fetchDataSource(Long pageId, String dataSourceKey, Map<String, String> params) {
        PageDefinition page = pageDefinitionRepository.findById(pageId)
                .orElseThrow(() -> new RuntimeException("Page not found: " + pageId));

        Map<String, DataSourceConfig> dataSources = parseDataSources(page);
        DataSourceConfig config = dataSources.get(dataSourceKey);

        if (config == null) {
            return DataSourceResult.error(404, "Data source not found: " + dataSourceKey);
        }

        try {
            Object data = fetchFromDataSource(config, params);
            return DataSourceResult.success(data);
        } catch (Exception e) {
            log.error("Failed to fetch data source '{}': {}", dataSourceKey, e.getMessage());
            return DataSourceResult.error(500, e.getMessage());
        }
    }

    /**
     * Fetch multiple data sources by keys.
     */
    public PageData fetchDataSourcesBatch(Long pageId, String[] keys, Map<String, String> params) {
        long startTime = System.currentTimeMillis();

        PageDefinition page = pageDefinitionRepository.findById(pageId)
                .orElseThrow(() -> new RuntimeException("Page not found: " + pageId));

        Map<String, DataSourceConfig> allDataSources = parseDataSources(page);
        Map<String, Object> aggregatedData = new ConcurrentHashMap<>();
        Map<String, String> errors = new ConcurrentHashMap<>();

        List<CompletableFuture<Void>> futures = Arrays.stream(keys)
                .filter(allDataSources::containsKey)
                .map(key -> CompletableFuture.runAsync(() -> {
                    DataSourceConfig config = allDataSources.get(key);
                    try {
                        Object data = fetchFromDataSource(config, params != null ? params : Map.of());
                        aggregatedData.put(key, data);
                    } catch (Exception e) {
                        errors.put(key, e.getMessage());
                    }
                }))
                .collect(Collectors.toList());

        CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();

        return PageData.builder()
                .data(aggregatedData)
                .errors(errors)
                .pageMeta(createPageMeta(page))
                .fetchTimeMs(System.currentTimeMillis() - startTime)
                .build();
    }

    /**
     * Test a data source configuration.
     */
    public DataSourceResult testDataSource(DataSourceConfig config) {
        try {
            Object data = fetchFromDataSource(config, Map.of());
            return DataSourceResult.success(data);
        } catch (Exception e) {
            log.error("Failed to test data source: {}", e.getMessage());
            return DataSourceResult.error(500, e.getMessage());
        }
    }

    /**
     * Fetch data from a configured data source (API, context, or static).
     */
    private Object fetchFromDataSource(DataSourceConfig config, Map<String, String> params) {
        // Check cache first
        if (config.getCacheKey() != null) {
            CachedData cached = cache.get(config.getCacheKey());
            if (cached != null && !cached.isExpired()) {
                log.debug("Cache hit for key: {}", config.getCacheKey());
                return cached.getData();
            }
        }

        Object result;

        switch (config.getType()) {
            case API:
                result = fetchFromApi(config, params);
                break;
            case STATIC:
                result = config.getStaticData();
                break;
            case CONTEXT:
                // Context data is passed from request params
                result = params.get(config.getContextKey());
                break;
            default:
                throw new IllegalArgumentException("Unknown data source type: " + config.getType());
        }

        // Apply field mapping if configured
        if (config.getFieldMapping() != null && result != null) {
            result = applyFieldMapping(result, config.getFieldMapping());
        }

        // Cache the result if caching is enabled
        if (config.getCacheKey() != null && result != null) {
            long ttl = config.getCacheTtlMs() != null ? config.getCacheTtlMs() : CACHE_TTL_MS;
            cache.put(config.getCacheKey(), new CachedData(result, ttl));
        }

        return result;
    }

    /**
     * Fetch data from an API endpoint.
     */
    private Object fetchFromApi(DataSourceConfig config, Map<String, String> params) {
        String url = config.getEndpoint();

        // Build URL with query params
        UriComponentsBuilder builder = UriComponentsBuilder.fromUriString(url);
        if (params != null) {
            params.forEach(builder::queryParam);
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        // Add any configured headers
        if (config.getHeaders() != null) {
            config.getHeaders().forEach(headers::add);
        }

        HttpEntity<String> entity = new HttpEntity<>(headers);
        HttpMethod method = "POST".equalsIgnoreCase(config.getMethod())
                ? HttpMethod.POST
                : HttpMethod.GET;

        log.debug("Fetching from API: {} {}", method, builder.toUriString());

        ResponseEntity<String> response = restTemplate.exchange(
                builder.toUriString(),
                method,
                entity,
                String.class
        );

        // Parse JSON response
        try {
            return objectMapper.readValue(response.getBody(), Object.class);
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse API response: " + e.getMessage(), e);
        }
    }

    /**
     * Apply field mapping to transform API response to expected structure.
     * Supports JSON path syntax (e.g., "data.items", "response.user.name")
     */
    private Object applyFieldMapping(Object data, Map<String, FieldMappingConfig> fieldMapping) {
        if (fieldMapping == null || fieldMapping.isEmpty()) {
            return data;
        }

        try {
            JsonNode rootNode = objectMapper.valueToTree(data);
            Map<String, Object> mappedResult = new HashMap<>();

            for (Map.Entry<String, FieldMappingConfig> entry : fieldMapping.entrySet()) {
                String targetField = entry.getKey();
                FieldMappingConfig mappingConfig = entry.getValue();

                Object value = extractValueByPath(rootNode, mappingConfig.getPath());

                // Apply transform if specified
                if (value != null && mappingConfig.getTransform() != null) {
                    value = applyTransform(value, mappingConfig.getTransform());
                }

                // Use fallback if value is null
                if (value == null && mappingConfig.getFallback() != null) {
                    value = mappingConfig.getFallback();
                }

                mappedResult.put(targetField, value);
            }

            return mappedResult;
        } catch (Exception e) {
            log.warn("Failed to apply field mapping: {}", e.getMessage());
            return data; // Return original data on mapping failure
        }
    }

    /**
     * Extract a value from JSON using dot-notation path.
     */
    private Object extractValueByPath(JsonNode node, String path) {
        if (path == null || path.isEmpty()) {
            return objectMapper.convertValue(node, Object.class);
        }

        String[] parts = path.split("\\.");
        JsonNode current = node;

        for (String part : parts) {
            if (current == null || current.isMissingNode()) {
                return null;
            }

            // Handle array index notation (e.g., "items[0]")
            if (part.contains("[")) {
                int bracketStart = part.indexOf('[');
                int bracketEnd = part.indexOf(']');
                String fieldName = part.substring(0, bracketStart);
                int index = Integer.parseInt(part.substring(bracketStart + 1, bracketEnd));

                current = current.get(fieldName);
                if (current != null && current.isArray()) {
                    current = current.get(index);
                }
            } else {
                current = current.get(part);
            }
        }

        if (current == null || current.isMissingNode()) {
            return null;
        }

        return objectMapper.convertValue(current, Object.class);
    }

    /**
     * Apply a transformation to a value.
     */
    private Object applyTransform(Object value, String transform) {
        if (value == null) return null;

        switch (transform.toLowerCase()) {
            case "uppercase":
                return value.toString().toUpperCase();
            case "lowercase":
                return value.toString().toLowerCase();
            case "trim":
                return value.toString().trim();
            case "number":
                return Double.parseDouble(value.toString());
            case "integer":
                return Integer.parseInt(value.toString());
            case "boolean":
                return Boolean.parseBoolean(value.toString());
            case "string":
                return value.toString();
            default:
                return value;
        }
    }

    /**
     * Parse data sources from page definition JSON.
     */
    private Map<String, DataSourceConfig> parseDataSources(PageDefinition page) {
        try {
            String dataSourcesJson = page.getDataSources();
            if (dataSourcesJson == null || dataSourcesJson.isEmpty()) {
                return Map.of();
            }
            return objectMapper.readValue(
                    dataSourcesJson,
                    new TypeReference<Map<String, DataSourceConfig>>() {}
            );
        } catch (Exception e) {
            log.error("Failed to parse data sources: {}", e.getMessage());
            return Map.of();
        }
    }

    /**
     * Create page metadata from page definition.
     */
    private PageData.PageMeta createPageMeta(PageDefinition page) {
        PageData.PageMeta meta = new PageData.PageMeta();
        meta.setPageId(page.getId());
        meta.setPageName(page.getPageName());
        meta.setTitle(page.getTitle());
        meta.setDescription(page.getDescription());
        meta.setPath(page.getPath());
        return meta;
    }

    /**
     * Clear the cache.
     */
    public void clearCache() {
        cache.clear();
        log.info("Page data cache cleared");
    }

    /**
     * Clear a specific cache entry.
     */
    public void clearCache(String cacheKey) {
        cache.remove(cacheKey);
        log.info("Cache entry cleared: {}", cacheKey);
    }

    /**
     * Simple cache entry with TTL.
     */
    private static class CachedData {
        private final Object data;
        private final long expiresAt;

        CachedData(Object data, long ttlMs) {
            this.data = data;
            this.expiresAt = System.currentTimeMillis() + ttlMs;
        }

        Object getData() { return data; }
        boolean isExpired() { return System.currentTimeMillis() > expiresAt; }
    }
}

package dev.mainul35.cms.sitebuilder.controller;

import dev.mainul35.cms.sitebuilder.dto.DataSourceConfig;
import dev.mainul35.cms.sitebuilder.dto.DataSourceResult;
import dev.mainul35.cms.sitebuilder.dto.PageData;
import dev.mainul35.cms.sitebuilder.dto.PageDataRequest;
import dev.mainul35.cms.sitebuilder.service.PageDataService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Controller for fetching aggregated page data for dynamic components.
 * Supports both full-page data fetching (for SSR) and individual data source refresh.
 */
@RestController
@RequestMapping("/api/pages")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class PageDataController {

    private final PageDataService pageDataService;

    /**
     * Get all data for a page (used during SSR/initial load)
     * Aggregates data from all configured data sources for the page.
     *
     * @param pageId The page ID
     * @param params Optional query parameters (e.g., user context, filters)
     * @return PageData containing all aggregated data sources
     */
    @GetMapping("/{pageId}/data")
    public ResponseEntity<PageData> getPageData(
            @PathVariable Long pageId,
            @RequestParam(required = false) Map<String, String> params) {

        log.debug("Fetching all data for page: {}", pageId);

        PageDataRequest request = PageDataRequest.builder()
                .pageId(pageId)
                .requestParams(params != null ? params : Map.of())
                .build();

        PageData pageData = pageDataService.getPageData(request);
        return ResponseEntity.ok(pageData);
    }

    /**
     * Get page data by page name (slug)
     * Alternative to getting by ID, useful for SEO-friendly URLs.
     *
     * @param pageName The page name/slug
     * @param params Optional query parameters
     * @return PageData containing all aggregated data sources
     */
    @GetMapping("/name/{pageName}/data")
    public ResponseEntity<PageData> getPageDataByName(
            @PathVariable String pageName,
            @RequestParam(required = false) Map<String, String> params) {

        log.debug("Fetching all data for page by name: {}", pageName);

        PageDataRequest request = PageDataRequest.builder()
                .pageName(pageName)
                .requestParams(params != null ? params : Map.of())
                .build();

        PageData pageData = pageDataService.getPageDataByName(request);
        return ResponseEntity.ok(pageData);
    }

    /**
     * Get specific data source (used for client-side refresh)
     * Fetches data from a single configured data source.
     *
     * @param pageId The page ID
     * @param dataSourceKey The data source key (e.g., "products", "user")
     * @param params Optional query parameters (e.g., pagination, filters)
     * @return DataSourceResult containing the fetched data
     */
    @GetMapping("/{pageId}/data/{dataSourceKey}")
    public ResponseEntity<DataSourceResult> getDataSource(
            @PathVariable Long pageId,
            @PathVariable String dataSourceKey,
            @RequestParam(required = false) Map<String, String> params) {

        log.debug("Fetching data source '{}' for page: {}", dataSourceKey, pageId);

        DataSourceResult result = pageDataService.fetchDataSource(
                pageId,
                dataSourceKey,
                params != null ? params : Map.of()
        );

        if (result.isError()) {
            return ResponseEntity.status(result.getStatusCode()).body(result);
        }
        return ResponseEntity.ok(result);
    }

    /**
     * Refresh multiple data sources at once
     * Useful when multiple components need to refresh simultaneously.
     *
     * @param pageId The page ID
     * @param dataSourceKeys Comma-separated list of data source keys
     * @param params Optional query parameters
     * @return PageData containing only the requested data sources
     */
    @GetMapping("/{pageId}/data/batch")
    public ResponseEntity<PageData> getDataSourcesBatch(
            @PathVariable Long pageId,
            @RequestParam("keys") String dataSourceKeys,
            @RequestParam(required = false) Map<String, String> params) {

        log.debug("Batch fetching data sources '{}' for page: {}", dataSourceKeys, pageId);

        String[] keys = dataSourceKeys.split(",");
        PageData pageData = pageDataService.fetchDataSourcesBatch(pageId, keys, params);
        return ResponseEntity.ok(pageData);
    }

    /**
     * Validate a data source configuration
     * Tests if the data source can be fetched successfully.
     *
     * @param config The data source configuration to test
     * @return DataSourceResult with test results
     */
    @PostMapping("/data/validate")
    public ResponseEntity<DataSourceResult> validateDataSource(
            @RequestBody DataSourceConfig config) {

        log.debug("Validating data source configuration: {}", config.getEndpoint());

        DataSourceResult result = pageDataService.testDataSource(config);
        return ResponseEntity.ok(result);
    }
}

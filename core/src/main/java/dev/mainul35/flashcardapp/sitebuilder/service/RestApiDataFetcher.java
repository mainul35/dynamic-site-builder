package dev.mainul35.flashcardapp.sitebuilder.service;

import dev.mainul35.flashcardapp.sitebuilder.dto.DataSourceConfig;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.Map;

/**
 * Implementation of DataFetcher for REST API data sources.
 * Makes actual HTTP calls to fetch data.
 */
@Component
@Slf4j
public class RestApiDataFetcher implements DataFetcher {

    private final RestTemplate restTemplate;

    public RestApiDataFetcher() {
        this.restTemplate = new RestTemplate();
    }

    @Override
    public boolean supports(DataSourceConfig.DataSourceType type) {
        return type == DataSourceConfig.DataSourceType.API;
    }

    @Override
    public Object fetch(DataSourceConfig config, Map<String, String> params) {
        String url = config.getEndpoint();

        if (url == null || url.isEmpty()) {
            throw new IllegalArgumentException("API endpoint is required");
        }

        // Build URL with query params
        UriComponentsBuilder builder = UriComponentsBuilder.fromUriString(url);
        if (params != null) {
            params.forEach(builder::queryParam);
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        if (config.getHeaders() != null) {
            config.getHeaders().forEach(headers::add);
        }

        HttpEntity<String> entity = new HttpEntity<>(headers);
        HttpMethod method = "POST".equalsIgnoreCase(config.getMethod())
                ? HttpMethod.POST
                : HttpMethod.GET;

        log.debug("Fetching from API: {} {}", method, builder.toUriString());

        ResponseEntity<Object> response = restTemplate.exchange(
                builder.toUriString(),
                method,
                entity,
                Object.class
        );

        return response.getBody();
    }
}

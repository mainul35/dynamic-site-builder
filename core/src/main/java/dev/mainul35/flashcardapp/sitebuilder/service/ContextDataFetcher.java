package dev.mainul35.flashcardapp.sitebuilder.service;

import dev.mainul35.flashcardapp.sitebuilder.dto.DataSourceConfig;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Implementation of DataFetcher for context-based data sources.
 * Retrieves data from the request context (user info, session data, etc.).
 */
@Component
@Slf4j
public class ContextDataFetcher implements DataFetcher {

    @Override
    public boolean supports(DataSourceConfig.DataSourceType type) {
        return type == DataSourceConfig.DataSourceType.CONTEXT;
    }

    @Override
    public Object fetch(DataSourceConfig config, Map<String, String> params) {
        String contextKey = config.getContextKey();

        if (contextKey == null || contextKey.isEmpty()) {
            log.warn("Context key is not specified");
            return null;
        }

        log.debug("Fetching context data for key: {}", contextKey);

        // Context data comes from request params
        if (params != null && params.containsKey(contextKey)) {
            return params.get(contextKey);
        }

        log.debug("No context data found for key: {}", contextKey);
        return null;
    }
}

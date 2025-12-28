package dev.mainul35.flashcardapp.sitebuilder.service;

import dev.mainul35.flashcardapp.sitebuilder.dto.DataSourceConfig;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Implementation of DataFetcher for static data sources.
 * Returns the static data configured in the data source.
 */
@Component
@Slf4j
public class StaticDataFetcher implements DataFetcher {

    @Override
    public boolean supports(DataSourceConfig.DataSourceType type) {
        return type == DataSourceConfig.DataSourceType.STATIC;
    }

    @Override
    public Object fetch(DataSourceConfig config, Map<String, String> params) {
        log.debug("Returning static data");
        return config.getStaticData();
    }
}

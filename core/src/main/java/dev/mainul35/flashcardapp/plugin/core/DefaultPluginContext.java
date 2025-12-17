package dev.mainul35.flashcardapp.plugin.core;

import dev.mainul35.cms.sdk.PluginContext;
import lombok.Builder;
import lombok.Data;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationContext;

import java.nio.file.Path;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Default implementation of PluginContext
 */
@Data
@Builder
public class DefaultPluginContext implements PluginContext {

    private String pluginId;
    private String version;
    private Path dataDirectory;
    private Path configDirectory;
    private ClassLoader pluginClassLoader;
    private ApplicationContext applicationContext;
    private ApplicationContext platformContext;
    private boolean active;

    @Builder.Default
    private Map<String, String> configMap = new ConcurrentHashMap<>();

    @Override
    public Logger getLogger() {
        return LoggerFactory.getLogger("plugin." + pluginId);
    }

    @Override
    public String getConfig(String key) {
        return configMap.get(key);
    }

    @Override
    public String getConfig(String key, String defaultValue) {
        return configMap.getOrDefault(key, defaultValue);
    }

    @Override
    public void setConfig(String key, String value) {
        configMap.put(key, value);
    }
}

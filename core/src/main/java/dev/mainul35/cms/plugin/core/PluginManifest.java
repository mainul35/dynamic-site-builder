package dev.mainul35.cms.plugin.core;

import lombok.Data;

import java.io.File;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.jar.JarEntry;
import java.util.jar.JarFile;

import org.yaml.snakeyaml.Yaml;

/**
 * Represents a plugin manifest (plugin.yml)
 */
@Data
public class PluginManifest {
    private String pluginId;
    private String pluginName;
    private String version;
    private String author;
    private String description;
    private String mainClass;
    private String pluginType;

    // Spring configuration
    private List<String> componentScanPackages = new ArrayList<>();
    private List<String> entityPackages = new ArrayList<>();
    private String apiBasePath;

    // Dependencies
    private List<String> dependencies = new ArrayList<>();

    /**
     * Load plugin manifest from JAR file
     */
    @SuppressWarnings("unchecked")
    public static PluginManifest loadFromJar(File jarFile) throws Exception {
        try (JarFile jar = new JarFile(jarFile)) {
            JarEntry entry = jar.getJarEntry("plugin.yml");
            if (entry == null) {
                throw new RuntimeException("plugin.yml not found in JAR: " + jarFile.getName());
            }

            try (InputStream is = jar.getInputStream(entry)) {
                Yaml yaml = new Yaml();
                Map<String, Object> data = yaml.load(is);

                PluginManifest manifest = new PluginManifest();
                manifest.setPluginId((String) data.get("plugin-id"));
                manifest.setPluginName((String) data.get("plugin-name"));
                manifest.setVersion((String) data.get("version"));
                manifest.setAuthor((String) data.get("author"));
                manifest.setDescription((String) data.get("description"));
                manifest.setMainClass((String) data.get("main-class"));
                manifest.setPluginType((String) data.get("plugin-type"));

                // Parse Spring configuration
                Map<String, Object> springConfig = (Map<String, Object>) data.get("spring");
                if (springConfig != null) {
                    // Parse component scan packages
                    Object componentScan = springConfig.get("component-scan");
                    if (componentScan instanceof List) {
                        manifest.setComponentScanPackages(new ArrayList<>((List<String>) componentScan));
                    } else if (componentScan instanceof String) {
                        manifest.setComponentScanPackages(Collections.singletonList((String) componentScan));
                    }

                    // Parse entity packages
                    Object entities = springConfig.get("entities");
                    if (entities instanceof List) {
                        manifest.setEntityPackages(new ArrayList<>((List<String>) entities));
                    } else if (entities instanceof String) {
                        manifest.setEntityPackages(Collections.singletonList((String) entities));
                    }
                }

                // Parse API base path
                manifest.setApiBasePath((String) data.get("api"));

                // Parse dependencies
                Object deps = data.get("dependencies");
                if (deps instanceof List) {
                    manifest.setDependencies(new ArrayList<>((List<String>) deps));
                } else if (deps instanceof String) {
                    manifest.setDependencies(Collections.singletonList((String) deps));
                }

                return manifest;
            }
        }
    }

    /**
     * Check if this plugin has Spring components to register
     */
    public boolean hasSpringComponents() {
        return !componentScanPackages.isEmpty();
    }

    /**
     * Check if this plugin has JPA entities
     */
    public boolean hasEntities() {
        return !entityPackages.isEmpty();
    }
}

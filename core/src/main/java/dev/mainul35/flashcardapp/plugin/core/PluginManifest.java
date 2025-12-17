package dev.mainul35.flashcardapp.plugin.core;

import lombok.Data;

import java.io.File;
import java.io.InputStream;
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

    /**
     * Load plugin manifest from JAR file
     */
    public static PluginManifest loadFromJar(File jarFile) throws Exception {
        try (JarFile jar = new JarFile(jarFile)) {
            JarEntry entry = jar.getJarEntry("plugin.yml");
            if (entry == null) {
                throw new RuntimeException("plugin.yml not found in JAR: " + jarFile.getName());
            }

            try (InputStream is = jar.getInputStream(entry)) {
                Yaml yaml = new Yaml();
                java.util.Map<String, Object> data = yaml.load(is);

                PluginManifest manifest = new PluginManifest();
                manifest.setPluginId((String) data.get("plugin-id"));
                manifest.setPluginName((String) data.get("plugin-name"));
                manifest.setVersion((String) data.get("version"));
                manifest.setAuthor((String) data.get("author"));
                manifest.setDescription((String) data.get("description"));
                manifest.setMainClass((String) data.get("main-class"));
                manifest.setPluginType((String) data.get("plugin-type"));

                return manifest;
            }
        }
    }
}

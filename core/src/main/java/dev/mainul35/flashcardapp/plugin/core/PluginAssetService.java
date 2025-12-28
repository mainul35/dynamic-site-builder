package dev.mainul35.flashcardapp.plugin.core;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Service for serving frontend assets bundled within plugin JARs.
 *
 * Each plugin can include a frontend bundle (JS, CSS, images) in its JAR
 * under a specific directory (e.g., "frontend/"). This service retrieves
 * those assets at runtime so the main frontend can dynamically load plugin UIs.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class PluginAssetService {

    private final PluginManager pluginManager;

    /**
     * Default path prefix within plugin JARs where frontend assets are stored.
     */
    private static final String DEFAULT_FRONTEND_PATH = "frontend/";

    /**
     * Cache for MIME type mappings
     */
    private static final Map<String, String> MIME_TYPES = new ConcurrentHashMap<>();

    static {
        // JavaScript
        MIME_TYPES.put("js", "application/javascript");
        MIME_TYPES.put("mjs", "application/javascript");

        // CSS
        MIME_TYPES.put("css", "text/css");

        // HTML
        MIME_TYPES.put("html", "text/html");
        MIME_TYPES.put("htm", "text/html");

        // Images
        MIME_TYPES.put("png", "image/png");
        MIME_TYPES.put("jpg", "image/jpeg");
        MIME_TYPES.put("jpeg", "image/jpeg");
        MIME_TYPES.put("gif", "image/gif");
        MIME_TYPES.put("svg", "image/svg+xml");
        MIME_TYPES.put("ico", "image/x-icon");
        MIME_TYPES.put("webp", "image/webp");

        // Fonts
        MIME_TYPES.put("woff", "font/woff");
        MIME_TYPES.put("woff2", "font/woff2");
        MIME_TYPES.put("ttf", "font/ttf");
        MIME_TYPES.put("eot", "application/vnd.ms-fontobject");
        MIME_TYPES.put("otf", "font/otf");

        // JSON
        MIME_TYPES.put("json", "application/json");

        // Source Maps
        MIME_TYPES.put("map", "application/json");
    }

    /**
     * Get the ClassLoader for a specific plugin.
     *
     * @param pluginId The plugin ID
     * @return Optional containing the PluginClassLoader if found
     */
    public Optional<PluginClassLoader> getPluginClassLoader(String pluginId) {
        PluginClassLoader classLoader = pluginManager.getPluginClassLoader(pluginId);
        if (classLoader == null) {
            log.debug("Plugin classloader not found: {}", pluginId);
            return Optional.empty();
        }
        return Optional.of(classLoader);
    }

    /**
     * Get an asset from a plugin JAR as bytes.
     *
     * @param pluginId The plugin ID
     * @param assetPath The path to the asset within the frontend directory
     * @return Optional containing the asset bytes if found
     */
    public Optional<byte[]> getAssetBytes(String pluginId, String assetPath) {
        return getPluginClassLoader(pluginId)
                .map(classLoader -> {
                    String fullPath = DEFAULT_FRONTEND_PATH + normalizeAssetPath(assetPath);
                    byte[] bytes = classLoader.getPluginResourceBytes(fullPath);
                    if (bytes.length == 0) {
                        log.debug("Asset not found: {} in plugin: {}", fullPath, pluginId);
                        return null;
                    }
                    log.debug("Loaded asset: {} ({} bytes) from plugin: {}",
                            fullPath, bytes.length, pluginId);
                    return bytes;
                });
    }

    /**
     * Get an asset from a plugin JAR as an InputStream.
     *
     * @param pluginId The plugin ID
     * @param assetPath The path to the asset within the frontend directory
     * @return Optional containing the InputStream if found
     */
    public Optional<InputStream> getAssetStream(String pluginId, String assetPath) {
        return getPluginClassLoader(pluginId)
                .map(classLoader -> {
                    String fullPath = DEFAULT_FRONTEND_PATH + normalizeAssetPath(assetPath);
                    InputStream stream = classLoader.getPluginResourceAsStream(fullPath);
                    if (stream == null) {
                        log.debug("Asset stream not found: {} in plugin: {}", fullPath, pluginId);
                    }
                    return stream;
                });
    }

    /**
     * Check if an asset exists in a plugin JAR.
     *
     * @param pluginId The plugin ID
     * @param assetPath The path to the asset
     * @return true if the asset exists
     */
    public boolean hasAsset(String pluginId, String assetPath) {
        return getPluginClassLoader(pluginId)
                .map(classLoader -> {
                    String fullPath = DEFAULT_FRONTEND_PATH + normalizeAssetPath(assetPath);
                    return classLoader.hasPluginResource(fullPath);
                })
                .orElse(false);
    }

    /**
     * Get the main bundle.js for a plugin.
     * This is the primary entry point for the plugin's frontend code.
     *
     * @param pluginId The plugin ID
     * @return Optional containing the bundle bytes if found
     */
    public Optional<byte[]> getMainBundle(String pluginId) {
        // Try common bundle names
        String[] bundleNames = {"bundle.js", "index.js", pluginId + ".js"};

        for (String bundleName : bundleNames) {
            Optional<byte[]> bundle = getAssetBytes(pluginId, bundleName);
            if (bundle.isPresent() && bundle.get().length > 0) {
                return bundle;
            }
        }

        return Optional.empty();
    }

    /**
     * Get the main CSS bundle for a plugin.
     *
     * @param pluginId The plugin ID
     * @return Optional containing the CSS bytes if found
     */
    public Optional<byte[]> getMainStyles(String pluginId) {
        // Try common style names
        String[] styleNames = {"bundle.css", "styles.css", "index.css", pluginId + ".css"};

        for (String styleName : styleNames) {
            Optional<byte[]> styles = getAssetBytes(pluginId, styleName);
            if (styles.isPresent() && styles.get().length > 0) {
                return styles;
            }
        }

        return Optional.empty();
    }

    /**
     * Get the MIME type for a file based on its extension.
     *
     * @param filename The filename or path
     * @return The MIME type, or "application/octet-stream" as default
     */
    public String getMimeType(String filename) {
        int lastDot = filename.lastIndexOf('.');
        if (lastDot == -1) {
            return "application/octet-stream";
        }

        String extension = filename.substring(lastDot + 1).toLowerCase();
        return MIME_TYPES.getOrDefault(extension, "application/octet-stream");
    }

    /**
     * Normalize an asset path by removing leading slashes and preventing
     * directory traversal attacks.
     *
     * @param path The raw asset path
     * @return The normalized path
     */
    private String normalizeAssetPath(String path) {
        if (path == null || path.isEmpty()) {
            return "";
        }

        // Remove leading slashes
        String normalized = path;
        while (normalized.startsWith("/")) {
            normalized = normalized.substring(1);
        }

        // Prevent directory traversal
        normalized = normalized.replace("..", "");
        normalized = normalized.replace("\\", "/");

        // Remove any double slashes
        while (normalized.contains("//")) {
            normalized = normalized.replace("//", "/");
        }

        return normalized;
    }
}

package dev.mainul35.cms.plugin.controller;

import dev.mainul35.cms.plugin.core.PluginAssetService;
import dev.mainul35.cms.plugin.core.PluginManager;
import dev.mainul35.cms.plugin.entity.Plugin;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.Optional;

/**
 * Controller for serving frontend assets from plugin JARs.
 *
 * This controller exposes plugin frontend bundles via HTTP endpoints,
 * allowing the main frontend to dynamically load plugin UIs at runtime.
 *
 * Endpoints:
 * - GET /api/plugins/{pluginId}/assets/{*assetPath} - Serve any asset from plugin JAR
 * - GET /api/plugins/{pluginId}/bundle.js - Serve main JavaScript bundle
 * - GET /api/plugins/{pluginId}/bundle.css - Serve main CSS bundle
 */
@RestController
@RequestMapping("/api/plugins")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(originPatterns = "*") // Allow frontend to load assets from any origin
public class PluginAssetController {

    private final PluginAssetService pluginAssetService;
    private final PluginManager pluginManager;

    /**
     * Whether to enable production caching (long-lived cache with versioned URLs)
     */
    @Value("${app.plugin.assets.cache.enabled:false}")
    private boolean cacheEnabled;

    /**
     * Cache duration in seconds for production (default: 1 year for immutable assets)
     */
    @Value("${app.plugin.assets.cache.max-age:31536000}")
    private long cacheMaxAge;

    /**
     * Get appropriate cache control based on environment.
     * In production with versioned URLs, assets can be cached for a long time.
     * In development, always revalidate to see changes immediately.
     */
    private CacheControl getCacheControl() {
        if (cacheEnabled) {
            // Production: Long-lived cache for versioned assets
            // Assets are immutable - when plugin version changes, URL changes
            return CacheControl.maxAge(Duration.ofSeconds(cacheMaxAge))
                    .cachePublic();
        } else {
            // Development: No caching, always revalidate
            return CacheControl.noCache().mustRevalidate();
        }
    }

    /**
     * Generate ETag based on plugin version for cache validation.
     * When plugin is updated, version changes and ETag changes,
     * invalidating cached assets.
     */
    private String generateETag(String pluginId) {
        return pluginManager.getPlugin(pluginId)
                .map(Plugin::getVersion)
                .map(version -> "\"" + pluginId + "-" + version + "\"")
                .orElse(null);
    }

    /**
     * Serve the main JavaScript bundle for a plugin.
     *
     * @param pluginId The plugin ID
     * @return The JavaScript bundle content
     */
    @GetMapping("/{pluginId}/bundle.js")
    public ResponseEntity<byte[]> getMainBundle(@PathVariable String pluginId) {
        log.info("Fetching main bundle for plugin: {}", pluginId);

        Optional<byte[]> bundle = pluginAssetService.getMainBundle(pluginId);

        if (bundle.isEmpty() || bundle.get().length == 0) {
            log.warn("Main bundle not found for plugin: {}", pluginId);
            return ResponseEntity.notFound().build();
        }

        byte[] bundleBytes = bundle.get();
        // Log bundle size and a hash for debugging hot-reload issues
        int hash = java.util.Arrays.hashCode(bundleBytes);
        log.info("Serving bundle for plugin {}: {} bytes, hash={}", pluginId, bundleBytes.length, hash);

        var responseBuilder = ResponseEntity.ok()
                .cacheControl(getCacheControl())
                .header(HttpHeaders.CONTENT_TYPE, "application/javascript; charset=utf-8");

        // Add ETag for cache validation
        String etag = generateETag(pluginId);
        if (etag != null) {
            responseBuilder.eTag(etag);
        }

        return responseBuilder.body(bundleBytes);
    }

    /**
     * Serve versioned JavaScript bundle for a plugin.
     * URL pattern: /api/plugins/{pluginId}/v/{version}/bundle.js
     * This enables aggressive caching since version is in the URL.
     *
     * @param pluginId The plugin ID
     * @param version The plugin version
     * @return The JavaScript bundle content
     */
    @GetMapping("/{pluginId}/v/{version}/bundle.js")
    public ResponseEntity<byte[]> getVersionedBundle(
            @PathVariable String pluginId,
            @PathVariable String version) {
        log.debug("Fetching versioned bundle for plugin: {} v{}", pluginId, version);

        // Verify version matches (optional, for security)
        Optional<Plugin> plugin = pluginManager.getPlugin(pluginId);
        if (plugin.isPresent() && !plugin.get().getVersion().equals(version)) {
            log.warn("Version mismatch for plugin {}: requested {} but installed {}",
                    pluginId, version, plugin.get().getVersion());
            // Still serve the current version, but log the mismatch
        }

        Optional<byte[]> bundle = pluginAssetService.getMainBundle(pluginId);

        if (bundle.isEmpty() || bundle.get().length == 0) {
            log.warn("Main bundle not found for plugin: {}", pluginId);
            return ResponseEntity.notFound().build();
        }

        // Versioned URLs can be cached aggressively (immutable)
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(Duration.ofDays(365)).cachePublic())
                .header(HttpHeaders.CONTENT_TYPE, "application/javascript; charset=utf-8")
                .eTag("\"" + pluginId + "-" + version + "\"")
                .body(bundle.get());
    }

    /**
     * Serve the main CSS bundle for a plugin.
     *
     * @param pluginId The plugin ID
     * @return The CSS bundle content
     */
    @GetMapping("/{pluginId}/bundle.css")
    public ResponseEntity<byte[]> getMainStyles(@PathVariable String pluginId) {
        log.debug("Fetching main styles for plugin: {}", pluginId);

        Optional<byte[]> styles = pluginAssetService.getMainStyles(pluginId);

        if (styles.isEmpty() || styles.get().length == 0) {
            log.warn("Main styles not found for plugin: {}", pluginId);
            return ResponseEntity.notFound().build();
        }

        var responseBuilder = ResponseEntity.ok()
                .cacheControl(getCacheControl())
                .header(HttpHeaders.CONTENT_TYPE, "text/css; charset=utf-8");

        // Add ETag for cache validation
        String etag = generateETag(pluginId);
        if (etag != null) {
            responseBuilder.eTag(etag);
        }

        return responseBuilder.body(styles.get());
    }

    /**
     * Serve versioned CSS bundle for a plugin.
     * URL pattern: /api/plugins/{pluginId}/v/{version}/bundle.css
     *
     * @param pluginId The plugin ID
     * @param version The plugin version
     * @return The CSS bundle content
     */
    @GetMapping("/{pluginId}/v/{version}/bundle.css")
    public ResponseEntity<byte[]> getVersionedStyles(
            @PathVariable String pluginId,
            @PathVariable String version) {
        log.debug("Fetching versioned styles for plugin: {} v{}", pluginId, version);

        Optional<byte[]> styles = pluginAssetService.getMainStyles(pluginId);

        if (styles.isEmpty() || styles.get().length == 0) {
            log.warn("Main styles not found for plugin: {}", pluginId);
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(Duration.ofDays(365)).cachePublic())
                .header(HttpHeaders.CONTENT_TYPE, "text/css; charset=utf-8")
                .eTag("\"" + pluginId + "-" + version + "-css\"")
                .body(styles.get());
    }

    /**
     * Serve any asset from a plugin JAR.
     * The asset path is relative to the plugin's frontend/ directory.
     *
     * Example: /api/plugins/auth-component-plugin/assets/images/logo.png
     *          -> Loads frontend/images/logo.png from the plugin JAR
     *
     * @param pluginId The plugin ID
     * @param assetPath The path to the asset (supports nested paths)
     * @return The asset content with appropriate Content-Type
     */
    @GetMapping("/{pluginId}/assets/**")
    public ResponseEntity<byte[]> getAsset(
            @PathVariable String pluginId,
            jakarta.servlet.http.HttpServletRequest request) {

        // Extract the asset path from the URL
        String fullPath = request.getRequestURI();
        String prefix = "/api/plugins/" + pluginId + "/assets/";
        String assetPath = fullPath.substring(fullPath.indexOf(prefix) + prefix.length());

        log.debug("Fetching asset: {} for plugin: {}", assetPath, pluginId);

        // Validate asset path to prevent directory traversal
        if (assetPath.contains("..") || assetPath.startsWith("/")) {
            log.warn("Invalid asset path (potential traversal attack): {}", assetPath);
            return ResponseEntity.badRequest().build();
        }

        Optional<byte[]> asset = pluginAssetService.getAssetBytes(pluginId, assetPath);

        if (asset.isEmpty() || asset.get().length == 0) {
            log.debug("Asset not found: {} in plugin: {}", assetPath, pluginId);
            return ResponseEntity.notFound().build();
        }

        String mimeType = pluginAssetService.getMimeType(assetPath);

        var responseBuilder = ResponseEntity.ok()
                .cacheControl(getCacheControl())
                .header(HttpHeaders.CONTENT_TYPE, mimeType);

        // Add ETag for cache validation
        String etag = generateETag(pluginId);
        if (etag != null) {
            responseBuilder.eTag(etag);
        }

        return responseBuilder.body(asset.get());
    }

    /**
     * Serve versioned assets from a plugin JAR.
     * URL pattern: /api/plugins/{pluginId}/v/{version}/assets/**
     * Enables aggressive caching for production.
     */
    @GetMapping("/{pluginId}/v/{version}/assets/**")
    public ResponseEntity<byte[]> getVersionedAsset(
            @PathVariable String pluginId,
            @PathVariable String version,
            jakarta.servlet.http.HttpServletRequest request) {

        // Extract the asset path from the URL
        String fullPath = request.getRequestURI();
        String prefix = "/api/plugins/" + pluginId + "/v/" + version + "/assets/";
        String assetPath = fullPath.substring(fullPath.indexOf(prefix) + prefix.length());

        log.debug("Fetching versioned asset: {} for plugin: {} v{}", assetPath, pluginId, version);

        // Validate asset path to prevent directory traversal
        if (assetPath.contains("..") || assetPath.startsWith("/")) {
            log.warn("Invalid asset path (potential traversal attack): {}", assetPath);
            return ResponseEntity.badRequest().build();
        }

        Optional<byte[]> asset = pluginAssetService.getAssetBytes(pluginId, assetPath);

        if (asset.isEmpty() || asset.get().length == 0) {
            log.debug("Asset not found: {} in plugin: {}", assetPath, pluginId);
            return ResponseEntity.notFound().build();
        }

        String mimeType = pluginAssetService.getMimeType(assetPath);

        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(Duration.ofDays(365)).cachePublic())
                .header(HttpHeaders.CONTENT_TYPE, mimeType)
                .eTag("\"" + pluginId + "-" + version + "-" + assetPath.hashCode() + "\"")
                .body(asset.get());
    }

    /**
     * Check if a plugin has frontend assets available.
     * Useful for the frontend to determine if it should attempt to load plugin UI.
     *
     * @param pluginId The plugin ID
     * @return 200 OK if bundle exists, 404 if not
     */
    @GetMapping("/{pluginId}/has-frontend")
    public ResponseEntity<PluginFrontendInfo> hasFrontend(@PathVariable String pluginId) {
        boolean hasBundle = pluginAssetService.hasAsset(pluginId, "bundle.js")
                || pluginAssetService.hasAsset(pluginId, "index.js")
                || pluginAssetService.hasAsset(pluginId, pluginId + ".js");

        boolean hasStyles = pluginAssetService.hasAsset(pluginId, "bundle.css")
                || pluginAssetService.hasAsset(pluginId, "styles.css")
                || pluginAssetService.hasAsset(pluginId, "index.css");

        if (!hasBundle) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new PluginFrontendInfo(pluginId, false, false));
        }

        return ResponseEntity.ok(new PluginFrontendInfo(pluginId, true, hasStyles));
    }

    /**
     * DTO for plugin frontend availability info
     */
    public record PluginFrontendInfo(
            String pluginId,
            boolean hasBundleJs,
            boolean hasBundleCss
    ) {}
}

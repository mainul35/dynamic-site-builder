package dev.mainul35.cms.plugin.controller;

import dev.mainul35.cms.plugin.core.PluginAssetService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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

    /**
     * Cache control for static assets - disabled during development
     * TODO: Enable caching in production with versioned URLs
     */
    private static final CacheControl ASSET_CACHE_CONTROL =
            CacheControl.noCache().mustRevalidate();

    /**
     * Serve the main JavaScript bundle for a plugin.
     *
     * @param pluginId The plugin ID
     * @return The JavaScript bundle content
     */
    @GetMapping("/{pluginId}/bundle.js")
    public ResponseEntity<byte[]> getMainBundle(@PathVariable String pluginId) {
        log.debug("Fetching main bundle for plugin: {}", pluginId);

        Optional<byte[]> bundle = pluginAssetService.getMainBundle(pluginId);

        if (bundle.isEmpty() || bundle.get().length == 0) {
            log.warn("Main bundle not found for plugin: {}", pluginId);
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok()
                .cacheControl(ASSET_CACHE_CONTROL)
                .header(HttpHeaders.CONTENT_TYPE, "application/javascript; charset=utf-8")
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

        return ResponseEntity.ok()
                .cacheControl(ASSET_CACHE_CONTROL)
                .header(HttpHeaders.CONTENT_TYPE, "text/css; charset=utf-8")
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

        return ResponseEntity.ok()
                .cacheControl(ASSET_CACHE_CONTROL)
                .header(HttpHeaders.CONTENT_TYPE, mimeType)
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

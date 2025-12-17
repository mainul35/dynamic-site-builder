package dev.mainul35.flashcardapp.sitebuilder.controller;

import dev.mainul35.cms.sdk.component.ComponentManifest;
import dev.mainul35.flashcardapp.plugin.core.PluginManager;
import dev.mainul35.flashcardapp.sitebuilder.entity.ComponentRegistryEntry;
import dev.mainul35.flashcardapp.sitebuilder.service.ComponentRegistryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * REST controller for component registry operations.
 * Provides endpoints for browsing, searching, and accessing UI components.
 */
@RestController
@RequestMapping("/api/components")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class ComponentRegistryController {

    private final ComponentRegistryService componentRegistryService;
    private final PluginManager pluginManager;

    @org.springframework.beans.factory.annotation.Value("${app.plugin.directory:plugins}")
    private String pluginDirectory;

    /**
     * Get all registered components
     *
     * @return List of all active components
     */
    @GetMapping
    public ResponseEntity<List<ComponentRegistryEntry>> getAllComponents() {
        try {
            log.debug("Fetching all components");
            List<ComponentRegistryEntry> components = componentRegistryService.getAllComponents();
            return ResponseEntity.ok(components);
        } catch (Exception e) {
            log.error("Error fetching components", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get components by category
     *
     * @param category Component category (ui, layout, form, widget)
     * @return List of components in the category
     */
    @GetMapping("/category/{category}")
    public ResponseEntity<List<ComponentRegistryEntry>> getComponentsByCategory(@PathVariable String category) {
        try {
            log.debug("Fetching components for category: {}", category);
            List<ComponentRegistryEntry> components = componentRegistryService.getComponentsByCategory(category);
            return ResponseEntity.ok(components);
        } catch (Exception e) {
            log.error("Error fetching components by category: {}", category, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get all available categories
     *
     * @return List of category names
     */
    @GetMapping("/categories")
    public ResponseEntity<List<String>> getCategories() {
        try {
            List<String> categories = componentRegistryService.getCategories();
            return ResponseEntity.ok(categories);
        } catch (Exception e) {
            log.error("Error fetching categories", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get a specific component
     *
     * @param pluginId Plugin identifier
     * @param componentId Component identifier
     * @return Component registry entry
     */
    @GetMapping("/{pluginId}/{componentId}")
    public ResponseEntity<ComponentRegistryEntry> getComponent(
            @PathVariable String pluginId,
            @PathVariable String componentId) {
        try {
            log.debug("Fetching component: {} from plugin: {}", componentId, pluginId);
            return componentRegistryService.getComponent(pluginId, componentId)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            log.error("Error fetching component: {} from plugin: {}", componentId, pluginId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get component manifest
     *
     * @param pluginId Plugin identifier
     * @param componentId Component identifier
     * @return Component manifest with full configuration
     */
    @GetMapping("/{pluginId}/{componentId}/manifest")
    public ResponseEntity<ComponentManifest> getComponentManifest(
            @PathVariable String pluginId,
            @PathVariable String componentId) {
        try {
            log.debug("Fetching manifest for component: {} from plugin: {}", componentId, pluginId);
            return componentRegistryService.getComponentManifest(pluginId, componentId)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            log.error("Error fetching manifest for component: {} from plugin: {}", componentId, pluginId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get components from a specific plugin
     *
     * @param pluginId Plugin identifier
     * @return List of components from the plugin
     */
    @GetMapping("/plugin/{pluginId}")
    public ResponseEntity<List<ComponentRegistryEntry>> getPluginComponents(@PathVariable String pluginId) {
        try {
            log.debug("Fetching components from plugin: {}", pluginId);
            List<ComponentRegistryEntry> components = componentRegistryService.getPluginComponents(pluginId);
            return ResponseEntity.ok(components);
        } catch (Exception e) {
            log.error("Error fetching components from plugin: {}", pluginId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Search components by name
     *
     * @param query Search query
     * @return List of matching components
     */
    @GetMapping("/search")
    public ResponseEntity<List<ComponentRegistryEntry>> searchComponents(@RequestParam String query) {
        try {
            log.debug("Searching components with query: {}", query);
            List<ComponentRegistryEntry> components = componentRegistryService.getAllComponents();

            // Simple filter by component name (case-insensitive)
            List<ComponentRegistryEntry> filtered = components.stream()
                    .filter(c -> c.getComponentName().toLowerCase().contains(query.toLowerCase()))
                    .toList();

            return ResponseEntity.ok(filtered);
        } catch (Exception e) {
            log.error("Error searching components with query: {}", query, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Component bundle endpoint (placeholder for future implementation)
     * This will serve the actual React component JavaScript bundle
     *
     * @param pluginId Plugin identifier
     * @param componentId Component identifier
     * @return Component bundle as JavaScript
     */
    @GetMapping("/{pluginId}/{componentId}/bundle.js")
    public ResponseEntity<String> getComponentBundle(
            @PathVariable String pluginId,
            @PathVariable String componentId) {
        try {
            log.debug("Fetching bundle for component: {} from plugin: {}", componentId, pluginId);

            // TODO: Implement actual bundle loading from plugin resources
            // For now, return a placeholder
            return ResponseEntity.ok("// Component bundle for " + pluginId + "/" + componentId + "\n" +
                    "// This will be implemented when plugins are loaded\n" +
                    "export default function Component(props) { return null; }");
        } catch (Exception e) {
            log.error("Error fetching bundle for component: {} from plugin: {}", componentId, pluginId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Debug endpoint to check plugin loading status
     */
    @GetMapping("/debug/status")
    public ResponseEntity<Map<String, Object>> getDebugStatus() {
        Map<String, Object> status = new HashMap<>();

        // Check plugin directory
        File pluginDir = new File(pluginDirectory);
        status.put("pluginDirPath", pluginDir.getAbsolutePath());
        status.put("pluginDirExists", pluginDir.exists());
        status.put("pluginDirIsDirectory", pluginDir.isDirectory());

        // List JAR files
        if (pluginDir.exists() && pluginDir.isDirectory()) {
            File[] jarFiles = pluginDir.listFiles((dir, name) -> name.endsWith(".jar"));
            status.put("jarFilesCount", jarFiles != null ? jarFiles.length : 0);
            if (jarFiles != null) {
                status.put("jarFiles", java.util.Arrays.stream(jarFiles).map(File::getName).toList());
            }
        }

        // Check loaded plugins
        status.put("loadedPluginsCount", pluginManager.getAllPlugins().size());
        status.put("activatedPluginsCount", pluginManager.getActivatedPlugins().size());
        status.put("loadedPlugins", pluginManager.getAllPlugins().stream()
                .map(p -> Map.of("id", p.getPluginId(), "name", p.getPluginName(), "status", p.getStatus()))
                .toList());

        // Check registered components
        status.put("registeredComponentsCount", componentRegistryService.getAllComponents().size());

        return ResponseEntity.ok(status);
    }
}

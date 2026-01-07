package dev.mainul35.cms.sitebuilder.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import dev.mainul35.cms.plugin.core.PluginManager;
import dev.mainul35.cms.sdk.component.ComponentManifest;
import dev.mainul35.cms.sitebuilder.entity.ComponentRegistryEntry;
import dev.mainul35.cms.sitebuilder.service.ComponentRegistryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;

/**
 * Admin controller for component registry management.
 * Provides endpoints for registering, activating, deactivating, and deleting components.
 * Only accessible by administrators.
 */
@RestController
@RequestMapping("/api/admin/components")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('ADMIN')")
public class ComponentAdminController {

    private final ComponentRegistryService componentRegistryService;
    private final PluginManager pluginManager;
    private final ObjectMapper objectMapper;

    /**
     * Get all components including inactive ones.
     */
    @GetMapping
    public ResponseEntity<List<ComponentRegistryEntry>> getAllComponents() {
        log.debug("Admin fetching all components (including inactive)");
        return ResponseEntity.ok(componentRegistryService.getAllComponentsIncludingInactive());
    }

    /**
     * Register a component from manifest JSON.
     */
    @PostMapping("/register")
    public ResponseEntity<?> registerComponent(@RequestBody ComponentManifest manifest) {
        try {
            log.info("Admin registering component: {} from plugin: {}",
                    manifest.getComponentId(), manifest.getPluginId());

            // Validate required fields
            if (manifest.getComponentId() == null || manifest.getComponentId().isBlank()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "componentId is required"));
            }
            if (manifest.getPluginId() == null || manifest.getPluginId().isBlank()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "pluginId is required"));
            }
            if (manifest.getDisplayName() == null || manifest.getDisplayName().isBlank()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "displayName is required"));
            }
            if (manifest.getCategory() == null || manifest.getCategory().isBlank()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "category is required"));
            }

            ComponentRegistryEntry entry = componentRegistryService.registerComponent(manifest);
            return ResponseEntity.status(HttpStatus.CREATED).body(entry);
        } catch (Exception e) {
            log.error("Failed to register component", e);
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Failed to register component: " + e.getMessage()));
        }
    }

    /**
     * Upload a plugin JAR file and register its components.
     */
    @PostMapping("/upload")
    public ResponseEntity<?> uploadPlugin(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "No file provided"));
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || !originalFilename.endsWith(".jar")) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "File must be a JAR file"));
        }

        Path tempFile = null;
        try {
            // Save to temporary file
            tempFile = Files.createTempFile("plugin-upload-", ".jar");
            file.transferTo(tempFile.toFile());

            log.info("Admin uploading plugin JAR: {}", originalFilename);

            // Install and activate the plugin
            File jarFile = tempFile.toFile();
            var plugin = pluginManager.installAndActivatePlugin(jarFile);

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of(
                            "message", "Plugin uploaded and activated successfully",
                            "filename", originalFilename,
                            "pluginId", plugin.getPluginId(),
                            "version", plugin.getVersion()
                    ));
        } catch (Exception e) {
            log.error("Failed to upload plugin: {}", originalFilename, e);
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Failed to upload plugin: " + e.getMessage()));
        } finally {
            // Clean up temp file
            if (tempFile != null) {
                try {
                    Files.deleteIfExists(tempFile);
                } catch (IOException e) {
                    log.warn("Failed to delete temp file: {}", tempFile, e);
                }
            }
        }
    }

    /**
     * Activate a component.
     */
    @PatchMapping("/{pluginId}/{componentId}/activate")
    public ResponseEntity<?> activateComponent(
            @PathVariable String pluginId,
            @PathVariable String componentId) {
        try {
            log.info("Admin activating component: {} from plugin: {}", componentId, pluginId);
            componentRegistryService.activateComponent(pluginId, componentId);

            return componentRegistryService.getComponent(pluginId, componentId)
                    .map(entry -> ResponseEntity.ok(Map.of(
                            "message", "Component activated successfully",
                            "component", entry
                    )))
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            log.error("Failed to activate component: {} from plugin: {}", componentId, pluginId, e);
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Failed to activate component: " + e.getMessage()));
        }
    }

    /**
     * Deactivate a component.
     * Returns list of pages that use this component.
     */
    @PatchMapping("/{pluginId}/{componentId}/deactivate")
    public ResponseEntity<?> deactivateComponent(
            @PathVariable String pluginId,
            @PathVariable String componentId) {
        try {
            log.info("Admin deactivating component: {} from plugin: {}", componentId, pluginId);

            // Find pages using this component before deactivating
            List<Map<String, Object>> affectedPages =
                    componentRegistryService.findPagesUsingComponent(pluginId, componentId);

            // Deactivate the component
            componentRegistryService.deactivateComponent(pluginId, componentId);

            return ResponseEntity.ok(Map.of(
                    "message", "Component deactivated successfully",
                    "affectedPages", affectedPages,
                    "affectedPagesCount", affectedPages.size()
            ));
        } catch (Exception e) {
            log.error("Failed to deactivate component: {} from plugin: {}", componentId, pluginId, e);
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Failed to deactivate component: " + e.getMessage()));
        }
    }

    /**
     * Delete a component permanently.
     */
    @DeleteMapping("/{pluginId}/{componentId}")
    public ResponseEntity<?> deleteComponent(
            @PathVariable String pluginId,
            @PathVariable String componentId) {
        try {
            log.info("Admin deleting component: {} from plugin: {}", componentId, pluginId);

            // Check if component exists
            if (!componentRegistryService.isComponentRegistered(pluginId, componentId)) {
                return ResponseEntity.notFound().build();
            }

            // Find pages using this component
            List<Map<String, Object>> affectedPages =
                    componentRegistryService.findPagesUsingComponent(pluginId, componentId);

            if (!affectedPages.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of(
                                "error", "Cannot delete component that is used by pages",
                                "affectedPages", affectedPages,
                                "affectedPagesCount", affectedPages.size()
                        ));
            }

            componentRegistryService.unregisterComponent(pluginId, componentId);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            log.error("Failed to delete component: {} from plugin: {}", componentId, pluginId, e);
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Failed to delete component: " + e.getMessage()));
        }
    }

    /**
     * Get pages using a specific component.
     */
    @GetMapping("/{pluginId}/{componentId}/usage")
    public ResponseEntity<?> getComponentUsage(
            @PathVariable String pluginId,
            @PathVariable String componentId) {
        try {
            log.debug("Admin checking usage for component: {} from plugin: {}", componentId, pluginId);

            List<Map<String, Object>> pages =
                    componentRegistryService.findPagesUsingComponent(pluginId, componentId);

            return ResponseEntity.ok(Map.of(
                    "pluginId", pluginId,
                    "componentId", componentId,
                    "pages", pages,
                    "usageCount", pages.size()
            ));
        } catch (Exception e) {
            log.error("Failed to get component usage: {} from plugin: {}", componentId, pluginId, e);
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Failed to get component usage: " + e.getMessage()));
        }
    }
}
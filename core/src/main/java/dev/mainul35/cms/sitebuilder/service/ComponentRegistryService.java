package dev.mainul35.cms.sitebuilder.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.mainul35.cms.sdk.component.ComponentManifest;
import dev.mainul35.cms.sitebuilder.entity.ComponentRegistryEntry;
import dev.mainul35.cms.sitebuilder.repository.ComponentRegistryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Service for managing the component registry.
 * Handles registration, lookup, and lifecycle of UI component plugins.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ComponentRegistryService {

    private final ComponentRegistryRepository componentRegistryRepository;
    private final ObjectMapper objectMapper;

    /**
     * Register a UI component from a plugin
     */
    @Transactional
    public ComponentRegistryEntry registerComponent(ComponentManifest manifest) {
        log.info("Registering component: {} from plugin: {}", manifest.getComponentId(), manifest.getPluginId());

        // Check if component already exists
        Optional<ComponentRegistryEntry> existing = componentRegistryRepository
                .findByPluginIdAndComponentId(manifest.getPluginId(), manifest.getComponentId());

        ComponentRegistryEntry entry;
        if (existing.isPresent()) {
            log.info("Component already exists, updating: {}", manifest.getComponentId());
            entry = existing.get();
        } else {
            entry = new ComponentRegistryEntry();
            entry.setPluginId(manifest.getPluginId());
            entry.setComponentId(manifest.getComponentId());
        }

        // Update component data
        entry.setComponentName(manifest.getDisplayName());
        entry.setCategory(manifest.getCategory());
        entry.setIcon(manifest.getIcon());
        entry.setReactBundlePath(manifest.getReactComponentPath());
        entry.setIsActive(true);

        // Serialize manifest to JSON
        try {
            String manifestJson = objectMapper.writeValueAsString(manifest);
            entry.setComponentManifest(manifestJson);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize component manifest", e);
            throw new RuntimeException("Failed to serialize component manifest", e);
        }

        ComponentRegistryEntry saved = componentRegistryRepository.save(entry);
        log.info("Component registered successfully: {}", manifest.getComponentId());
        return saved;
    }

    /**
     * Get all registered components
     */
    public List<ComponentRegistryEntry> getAllComponents() {
        return componentRegistryRepository.findByIsActiveTrue();
    }

    /**
     * Get components by category
     */
    public List<ComponentRegistryEntry> getComponentsByCategory(String category) {
        return componentRegistryRepository.findByCategoryAndIsActiveTrue(category);
    }

    /**
     * Get a specific component
     */
    public Optional<ComponentRegistryEntry> getComponent(String pluginId, String componentId) {
        return componentRegistryRepository.findByPluginIdAndComponentId(pluginId, componentId);
    }

    /**
     * Get component manifest
     */
    public Optional<ComponentManifest> getComponentManifest(String pluginId, String componentId) {
        return getComponent(pluginId, componentId)
                .map(entry -> {
                    try {
                        return objectMapper.readValue(entry.getComponentManifest(), ComponentManifest.class);
                    } catch (JsonProcessingException e) {
                        log.error("Failed to deserialize component manifest", e);
                        return null;
                    }
                });
    }

    /**
     * Get all components from a specific plugin
     */
    public List<ComponentRegistryEntry> getPluginComponents(String pluginId) {
        return componentRegistryRepository.findByPluginId(pluginId);
    }

    /**
     * Deactivate a component
     */
    @Transactional
    public void deactivateComponent(String pluginId, String componentId) {
        log.info("Deactivating component: {} from plugin: {}", componentId, pluginId);
        componentRegistryRepository.findByPluginIdAndComponentId(pluginId, componentId)
                .ifPresent(entry -> {
                    entry.setIsActive(false);
                    componentRegistryRepository.save(entry);
                });
    }

    /**
     * Activate a component
     */
    @Transactional
    public void activateComponent(String pluginId, String componentId) {
        log.info("Activating component: {} from plugin: {}", componentId, pluginId);
        componentRegistryRepository.findByPluginIdAndComponentId(pluginId, componentId)
                .ifPresent(entry -> {
                    entry.setIsActive(true);
                    componentRegistryRepository.save(entry);
                });
    }

    /**
     * Unregister all components from a plugin
     */
    @Transactional
    public void unregisterPluginComponents(String pluginId) {
        log.info("Unregistering all components from plugin: {}", pluginId);
        componentRegistryRepository.deleteByPluginId(pluginId);
    }

    /**
     * Unregister a specific component
     */
    @Transactional
    public void unregisterComponent(String pluginId, String componentId) {
        log.info("Unregistering component: {} from plugin: {}", componentId, pluginId);
        componentRegistryRepository.deleteByPluginIdAndComponentId(pluginId, componentId);
    }

    /**
     * Check if a component is registered
     */
    public boolean isComponentRegistered(String pluginId, String componentId) {
        return componentRegistryRepository.existsByPluginIdAndComponentId(pluginId, componentId);
    }

    /**
     * Get component categories
     */
    public List<String> getCategories() {
        return List.of("ui", "layout", "form", "widget", "navbar", "data");
    }

    /**
     * Register multiple components from a single plugin
     * Useful for plugins that provide multiple component variants
     */
    @Transactional
    public List<ComponentRegistryEntry> registerComponents(List<ComponentManifest> manifests) {
        log.info("Registering {} components", manifests.size());
        return manifests.stream()
                .map(this::registerComponent)
                .toList();
    }
}

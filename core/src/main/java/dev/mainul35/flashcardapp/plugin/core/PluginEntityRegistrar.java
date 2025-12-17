package dev.mainul35.flashcardapp.plugin.core;

import jakarta.persistence.EntityManagerFactory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Manages dynamic registration of JPA entities from plugins.
 * Allows plugins to register their entity classes at runtime.
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class PluginEntityRegistrar {

    private final EntityManagerFactory entityManagerFactory;

    /**
     * Map of plugin ID to list of registered entity classes
     */
    private final Map<String, List<Class<?>>> pluginEntities = new ConcurrentHashMap<>();

    /**
     * Register entity classes for a plugin
     *
     * @param pluginId       Unique plugin identifier
     * @param entityClasses  List of entity classes to register
     */
    public void registerEntities(String pluginId, List<Class<?>> entityClasses) {
        log.info("Registering {} entities for plugin: {}", entityClasses.size(), pluginId);

        // Store the entity classes
        pluginEntities.put(pluginId, new ArrayList<>(entityClasses));

        // TODO: Phase 1 - Basic structure only
        // Future implementation will:
        // 1. Dynamically add entities to Hibernate MetadataImplementor
        // 2. Update entity mapping configuration
        // 3. Trigger schema update for new entities
        // 4. Handle entity relationships and dependencies

        // Note: Dynamic entity registration with Hibernate is complex and requires
        // careful handling of the SessionFactory. This is a placeholder for Phase 1.
        // A full implementation would require:
        // - Access to Hibernate's SessionFactory
        // - Ability to add entities to existing configuration
        // - Proper handling of entity lifecycle

        log.debug("Entity registration placeholder executed for plugin: {}", pluginId);
    }

    /**
     * Register a single entity class for a plugin
     *
     * @param pluginId     Unique plugin identifier
     * @param entityClass  Entity class to register
     */
    public void registerEntity(String pluginId, Class<?> entityClass) {
        log.info("Registering entity {} for plugin: {}", entityClass.getName(), pluginId);

        List<Class<?>> entities = pluginEntities.computeIfAbsent(pluginId, k -> new ArrayList<>());
        entities.add(entityClass);

        // TODO: Implement dynamic entity registration (Phase 2)
    }

    /**
     * Unregister all entities for a plugin
     *
     * @param pluginId Unique plugin identifier
     */
    public void unregisterEntities(String pluginId) {
        log.info("Unregistering entities for plugin: {}", pluginId);

        List<Class<?>> entities = pluginEntities.remove(pluginId);

        if (entities != null && !entities.isEmpty()) {
            log.info("Unregistered {} entities for plugin: {}", entities.size(), pluginId);

            // TODO: Phase 1 - Basic structure only
            // Future implementation will:
            // 1. Remove entities from Hibernate configuration
            // 2. Clear entity caches
            // 3. Handle entity relationship cleanup
        } else {
            log.warn("No entities found for plugin: {}", pluginId);
        }
    }

    /**
     * Get all registered entities for a plugin
     *
     * @param pluginId Unique plugin identifier
     * @return List of entity classes
     */
    public List<Class<?>> getPluginEntities(String pluginId) {
        return new ArrayList<>(pluginEntities.getOrDefault(pluginId, new ArrayList<>()));
    }

    /**
     * Get all registered plugin IDs
     *
     * @return Set of plugin IDs that have registered entities
     */
    public Set<String> getRegisteredPluginIds() {
        return pluginEntities.keySet();
    }

    /**
     * Check if a plugin has registered entities
     *
     * @param pluginId Unique plugin identifier
     * @return true if plugin has registered entities
     */
    public boolean hasRegisteredEntities(String pluginId) {
        List<Class<?>> entities = pluginEntities.get(pluginId);
        return entities != null && !entities.isEmpty();
    }

    /**
     * Get total count of registered entities across all plugins
     *
     * @return Total entity count
     */
    public int getTotalEntityCount() {
        return pluginEntities.values().stream()
                .mapToInt(List::size)
                .sum();
    }

    /**
     * Scan a package for entity classes and register them
     *
     * @param pluginId     Unique plugin identifier
     * @param packageName  Package to scan
     * @param classLoader  ClassLoader to use for scanning
     */
    public void scanAndRegisterEntities(String pluginId, String packageName, ClassLoader classLoader) {
        log.info("Scanning package {} for entities in plugin: {}", packageName, pluginId);

        // TODO: Phase 1 - Placeholder
        // Future implementation will:
        // 1. Scan the package for classes annotated with @Entity
        // 2. Load each entity class using the provided ClassLoader
        // 3. Register all found entities

        log.warn("Entity package scanning not yet implemented - placeholder for Phase 2");
    }
}

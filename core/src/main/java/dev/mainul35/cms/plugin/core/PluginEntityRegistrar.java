package dev.mainul35.cms.plugin.core;

import jakarta.persistence.Entity;
import jakarta.persistence.EntityManagerFactory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.core.io.support.ResourcePatternResolver;
import org.springframework.core.type.classreading.CachingMetadataReaderFactory;
import org.springframework.core.type.classreading.MetadataReader;
import org.springframework.core.type.classreading.MetadataReaderFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.ClassUtils;

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
     * Register entity classes for a plugin.
     *
     * Note: Dynamic entity registration at runtime is limited in JPA/Hibernate.
     * Entities should be declared in the plugin manifest and loaded at startup.
     * This method tracks registered entities and can trigger schema validation.
     *
     * For full dynamic entity support, plugins should:
     * 1. Declare entities in plugin.yml under spring.entities
     * 2. Use @EntityScan in the plugin configuration
     * 3. Ensure entities are on the classpath before EntityManagerFactory creation
     *
     * @param pluginId       Unique plugin identifier
     * @param entityClasses  List of entity classes to register
     */
    public void registerEntities(String pluginId, List<Class<?>> entityClasses) {
        log.info("Registering {} entities for plugin: {}", entityClasses.size(), pluginId);

        // Store the entity classes for tracking
        pluginEntities.put(pluginId, new ArrayList<>(entityClasses));

        // Log entity details for debugging
        for (Class<?> entityClass : entityClasses) {
            Entity entityAnnotation = entityClass.getAnnotation(Entity.class);
            String entityName = entityAnnotation != null && !entityAnnotation.name().isEmpty()
                    ? entityAnnotation.name()
                    : entityClass.getSimpleName();
            log.info("  - Entity: {} (class: {})", entityName, entityClass.getName());
        }

        // Validate that entities are managed by the EntityManagerFactory
        validateEntityRegistration(pluginId, entityClasses);

        log.info("Entity registration complete for plugin: {}", pluginId);
    }

    /**
     * Validate that entity classes are properly registered with JPA.
     * Logs warnings for entities that are not managed.
     */
    private void validateEntityRegistration(String pluginId, List<Class<?>> entityClasses) {
        var metamodel = entityManagerFactory.getMetamodel();

        for (Class<?> entityClass : entityClasses) {
            try {
                // Check if entity is managed by JPA
                metamodel.entity(entityClass);
                log.debug("Entity {} is managed by JPA", entityClass.getSimpleName());
            } catch (IllegalArgumentException e) {
                // Entity is not in the metamodel - this means it wasn't scanned at startup
                log.warn("Entity {} from plugin {} is NOT managed by JPA. " +
                        "This entity may not work correctly. Ensure it's included in @EntityScan " +
                        "or plugin JAR is on classpath before application startup.",
                        entityClass.getSimpleName(), pluginId);
            }
        }
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

        // Validate this entity is managed
        validateEntityRegistration(pluginId, List.of(entityClass));
    }

    /**
     * Unregister all entities for a plugin.
     *
     * Note: This removes entities from tracking but does NOT remove them from
     * the JPA metamodel at runtime (which is not supported by standard JPA).
     * The entities will remain in the EntityManagerFactory until restart.
     *
     * @param pluginId Unique plugin identifier
     */
    public void unregisterEntities(String pluginId) {
        log.info("Unregistering entities for plugin: {}", pluginId);

        List<Class<?>> entities = pluginEntities.remove(pluginId);

        if (entities != null && !entities.isEmpty()) {
            log.info("Removed {} entity class(es) from tracking for plugin: {}", entities.size(), pluginId);
            for (Class<?> entityClass : entities) {
                log.debug("  - Removed: {}", entityClass.getSimpleName());
            }
            // Note: Entity classes remain in JPA metamodel until application restart
            // This is a JPA/Hibernate limitation for dynamic entity management
        } else {
            log.debug("No entities registered for plugin: {}", pluginId);
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

        try {
            // Convert package name to resource path pattern
            String packageSearchPath = ResourcePatternResolver.CLASSPATH_ALL_URL_PREFIX +
                    ClassUtils.convertClassNameToResourcePath(packageName) + "/**/*.class";

            ResourcePatternResolver resolver = new PathMatchingResourcePatternResolver(classLoader);
            MetadataReaderFactory metadataReaderFactory = new CachingMetadataReaderFactory(resolver);
            Resource[] resources = resolver.getResources(packageSearchPath);

            List<Class<?>> entityClasses = new ArrayList<>();

            for (Resource resource : resources) {
                if (resource.isReadable()) {
                    try {
                        MetadataReader metadataReader = metadataReaderFactory.getMetadataReader(resource);
                        String className = metadataReader.getClassMetadata().getClassName();

                        // Load the class using the plugin's ClassLoader
                        Class<?> clazz = classLoader.loadClass(className);

                        // Check if it's an entity
                        if (clazz.isAnnotationPresent(Entity.class)) {
                            entityClasses.add(clazz);
                            log.debug("Found entity class: {}", className);
                        }
                    } catch (Exception e) {
                        log.debug("Could not read class from resource: {}", resource.getFilename(), e);
                    }
                }
            }

            if (!entityClasses.isEmpty()) {
                registerEntities(pluginId, entityClasses);
                log.info("Registered {} entity class(es) for plugin: {}", entityClasses.size(), pluginId);
            } else {
                log.info("No entity classes found in package {} for plugin: {}", packageName, pluginId);
            }

        } catch (Exception e) {
            log.error("Failed to scan package {} for entities in plugin: {}", packageName, pluginId, e);
        }
    }
}

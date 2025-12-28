package dev.mainul35.flashcardapp.sitebuilder.repository;

import dev.mainul35.flashcardapp.sitebuilder.entity.ComponentRegistryEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for component registry operations.
 */
@Repository
public interface ComponentRegistryRepository extends JpaRepository<ComponentRegistryEntry, Long> {

    /**
     * Find component by plugin ID and component ID
     */
    Optional<ComponentRegistryEntry> findByPluginIdAndComponentId(String pluginId, String componentId);

    /**
     * Find all components from a specific plugin
     */
    List<ComponentRegistryEntry> findByPluginId(String pluginId);

    /**
     * Find all components in a category
     */
    List<ComponentRegistryEntry> findByCategory(String category);

    /**
     * Find all active components
     */
    List<ComponentRegistryEntry> findByIsActiveTrue();

    /**
     * Find all active components in a category
     */
    List<ComponentRegistryEntry> findByCategoryAndIsActiveTrue(String category);

    /**
     * Check if a component exists
     */
    boolean existsByPluginIdAndComponentId(String pluginId, String componentId);

    /**
     * Delete all components from a plugin
     */
    void deleteByPluginId(String pluginId);

    /**
     * Delete a specific component by plugin ID and component ID
     */
    void deleteByPluginIdAndComponentId(String pluginId, String componentId);
}

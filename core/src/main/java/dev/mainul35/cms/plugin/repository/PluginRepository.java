package dev.mainul35.cms.plugin.repository;

import dev.mainul35.cms.plugin.entity.Plugin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository interface for Plugin entity operations.
 */
@Repository
public interface PluginRepository extends JpaRepository<Plugin, Long> {

    /**
     * Find a plugin by its unique plugin ID
     */
    Optional<Plugin> findByPluginId(String pluginId);

    /**
     * Find all plugins with a specific status
     */
    List<Plugin> findByStatus(String status);

    /**
     * Find all activated plugins
     */
    default List<Plugin> findAllActivated() {
        return findByStatus("activated");
    }

    /**
     * Find all bundled plugins
     */
    List<Plugin> findByIsBundled(Boolean isBundled);

    /**
     * Find all plugins of a specific type
     */
    List<Plugin> findByPluginType(String pluginType);

    /**
     * Check if a plugin with the given ID exists
     */
    boolean existsByPluginId(String pluginId);

    /**
     * Delete a plugin by its plugin ID
     */
    void deleteByPluginId(String pluginId);
}

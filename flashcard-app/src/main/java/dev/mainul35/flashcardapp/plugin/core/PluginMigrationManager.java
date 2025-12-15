package dev.mainul35.flashcardapp.plugin.core;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.flywaydb.core.Flyway;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Manages Flyway database migrations for each plugin.
 * Each plugin can have its own migration scripts that are executed independently.
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class PluginMigrationManager {

    private final DataSource dataSource;

    /**
     * Map of plugin ID to Flyway instance
     */
    private final Map<String, Flyway> pluginFlywayInstances = new ConcurrentHashMap<>();

    /**
     * Run migrations for a plugin
     *
     * @param pluginId         Unique plugin identifier
     * @param migrationLocation Migration scripts location (e.g., "classpath:db/migration/course")
     * @param classLoader      Plugin's ClassLoader for loading migration scripts
     * @return Number of migrations applied
     */
    public int runMigrations(String pluginId, String migrationLocation, ClassLoader classLoader) {
        log.info("Running migrations for plugin: {} from location: {}", pluginId, migrationLocation);

        try {
            // Create or get existing Flyway instance for this plugin
            Flyway flyway = getOrCreateFlywayInstance(pluginId, migrationLocation, classLoader);

            // Run migrations
            int migrationsApplied = flyway.migrate().migrationsExecuted;

            log.info("Applied {} migrations for plugin: {}", migrationsApplied, pluginId);
            return migrationsApplied;

        } catch (Exception e) {
            log.error("Failed to run migrations for plugin: {}", pluginId, e);
            throw new RuntimeException("Migration failed for plugin: " + pluginId, e);
        }
    }

    /**
     * Get or create a Flyway instance for a plugin
     *
     * @param pluginId         Unique plugin identifier
     * @param migrationLocation Migration scripts location
     * @param classLoader      Plugin's ClassLoader
     * @return Flyway instance
     */
    private Flyway getOrCreateFlywayInstance(String pluginId, String migrationLocation, ClassLoader classLoader) {
        return pluginFlywayInstances.computeIfAbsent(pluginId, id -> {
            log.debug("Creating Flyway instance for plugin: {}", pluginId);

            // Configure Flyway for this plugin
            return Flyway.configure(classLoader)
                    .dataSource(dataSource)
                    .locations(migrationLocation)
                    // Use plugin-specific schema history table
                    .table("plugin_schema_history_" + sanitizePluginId(pluginId))
                    // Set baseline version for existing databases
                    .baselineOnMigrate(true)
                    .baselineVersion("0")
                    // Validate migrations on migrate
                    .validateOnMigrate(true)
                    // Allow mixing transactional and non-transactional statements
                    .mixed(true)
                    // Set plugin-specific placeholder for use in SQL scripts
                    .placeholders(Map.of("pluginId", pluginId))
                    .load();
        });
    }

    /**
     * Validate migrations for a plugin
     *
     * @param pluginId Unique plugin identifier
     * @return true if migrations are valid
     */
    public boolean validateMigrations(String pluginId) {
        log.info("Validating migrations for plugin: {}", pluginId);

        try {
            Flyway flyway = pluginFlywayInstances.get(pluginId);
            if (flyway != null) {
                flyway.validate();
                log.info("Migrations validated successfully for plugin: {}", pluginId);
                return true;
            } else {
                log.warn("No Flyway instance found for plugin: {}", pluginId);
                return false;
            }
        } catch (Exception e) {
            log.error("Migration validation failed for plugin: {}", pluginId, e);
            return false;
        }
    }

    /**
     * Get migration info for a plugin
     *
     * @param pluginId Unique plugin identifier
     * @return Migration info details
     */
    public String getMigrationInfo(String pluginId) {
        Flyway flyway = pluginFlywayInstances.get(pluginId);
        if (flyway != null) {
            var info = flyway.info();
            if (info != null && info.all().length > 0) {
                StringBuilder sb = new StringBuilder();
                sb.append("Migration info for plugin: ").append(pluginId).append("\n");
                for (var migration : info.all()) {
                    sb.append("  - Version: ").append(migration.getVersion())
                      .append(", Description: ").append(migration.getDescription())
                      .append(", State: ").append(migration.getState())
                      .append("\n");
                }
                return sb.toString();
            }
        }
        return "No migration info available for plugin: " + pluginId;
    }

    /**
     * Baseline a plugin's migration history
     * Useful when installing a plugin on an existing database
     *
     * @param pluginId         Unique plugin identifier
     * @param migrationLocation Migration scripts location
     * @param classLoader      Plugin's ClassLoader
     */
    public void baseline(String pluginId, String migrationLocation, ClassLoader classLoader) {
        log.info("Setting baseline for plugin: {}", pluginId);

        try {
            Flyway flyway = getOrCreateFlywayInstance(pluginId, migrationLocation, classLoader);
            flyway.baseline();
            log.info("Baseline set successfully for plugin: {}", pluginId);
        } catch (Exception e) {
            log.error("Failed to set baseline for plugin: {}", pluginId, e);
            throw new RuntimeException("Baseline failed for plugin: " + pluginId, e);
        }
    }

    /**
     * Clean (drop all objects) for a plugin's schema
     * WARNING: This is destructive and should only be used in development!
     *
     * @param pluginId Unique plugin identifier
     */
    public void clean(String pluginId) {
        log.warn("DESTRUCTIVE: Cleaning database for plugin: {}", pluginId);

        Flyway flyway = pluginFlywayInstances.get(pluginId);
        if (flyway != null) {
            try {
                flyway.clean();
                log.warn("Database cleaned for plugin: {}", pluginId);
            } catch (Exception e) {
                log.error("Failed to clean database for plugin: {}", pluginId, e);
                throw new RuntimeException("Clean failed for plugin: " + pluginId, e);
            }
        } else {
            log.warn("No Flyway instance found for plugin: {}", pluginId);
        }
    }

    /**
     * Remove Flyway instance for a plugin (cleanup on uninstall)
     *
     * @param pluginId Unique plugin identifier
     */
    public void removeFlywayInstance(String pluginId) {
        log.info("Removing Flyway instance for plugin: {}", pluginId);
        pluginFlywayInstances.remove(pluginId);
    }

    /**
     * Sanitize plugin ID for use in table names
     * Replaces hyphens with underscores and ensures lowercase
     *
     * @param pluginId Plugin identifier
     * @return Sanitized plugin ID
     */
    private String sanitizePluginId(String pluginId) {
        return pluginId.toLowerCase().replace("-", "_");
    }

    /**
     * Get all plugin IDs with Flyway instances
     *
     * @return Set of plugin IDs
     */
    public java.util.Set<String> getPluginIdsWithMigrations() {
        return pluginFlywayInstances.keySet();
    }
}

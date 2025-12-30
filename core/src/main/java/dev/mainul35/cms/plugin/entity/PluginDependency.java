package dev.mainul35.cms.plugin.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Plugin dependency entity representing dependencies between plugins.
 * A plugin can depend on other plugins to function properly.
 */
@Entity
@Table(name = "cms_plugin_dependencies")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PluginDependency {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * The plugin that has this dependency
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plugin_id", nullable = false)
    @JsonIgnore
    private Plugin plugin;

    /**
     * The plugin ID that this plugin depends on
     */
    @Column(name = "depends_on_plugin_id", nullable = false, length = 100)
    private String dependsOnPluginId;

    /**
     * Minimum version of the dependency required (e.g., "1.0.0")
     */
    @Column(name = "min_version", length = 50)
    private String minVersion;

    /**
     * Maximum version of the dependency supported (e.g., "2.0.0")
     */
    @Column(name = "max_version", length = 50)
    private String maxVersion;

    /**
     * Whether this dependency is required or optional
     */
    @Column(name = "is_required", nullable = false)
    private Boolean isRequired = true;

    /**
     * When this dependency was recorded
     */
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * Constructor for easy creation
     */
    public PluginDependency(Plugin plugin, String dependsOnPluginId, String minVersion, String maxVersion, Boolean isRequired) {
        this.plugin = plugin;
        this.dependsOnPluginId = dependsOnPluginId;
        this.minVersion = minVersion;
        this.maxVersion = maxVersion;
        this.isRequired = isRequired;
    }

    /**
     * Check if the dependency is satisfied by the given version
     */
    public boolean isSatisfiedBy(String version) {
        // Simple version checking - can be enhanced with proper semver
        if (minVersion != null && version.compareTo(minVersion) < 0) {
            return false;
        }
        if (maxVersion != null && version.compareTo(maxVersion) > 0) {
            return false;
        }
        return true;
    }
}

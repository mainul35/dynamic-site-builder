package dev.mainul35.flashcardapp.plugin.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Plugin entity representing an installed plugin in the CMS platform.
 * Plugins can be bundled (shipped with the app) or third-party (installed via marketplace).
 */
@Entity
@Table(name = "cms_plugins")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Plugin {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Unique identifier for the plugin (e.g., "course-plugin", "flashcard-plugin")
     */
    @Column(name = "plugin_id", nullable = false, unique = true, length = 100)
    private String pluginId;

    /**
     * Human-readable name (e.g., "Course Management Plugin")
     */
    @Column(name = "plugin_name", nullable = false, length = 200)
    private String pluginName;

    /**
     * Plugin version (e.g., "1.0.0", "2.1.3")
     */
    @Column(nullable = false, length = 50)
    private String version;

    /**
     * Description of what the plugin does
     */
    @Column(columnDefinition = "TEXT")
    private String description;

    /**
     * Plugin author/developer
     */
    @Column(length = 200)
    private String author;

    /**
     * Fully qualified class name of the main plugin class
     * (e.g., "dev.mainul35.plugins.course.CoursePlugin")
     */
    @Column(name = "main_class", length = 500)
    private String mainClass;

    /**
     * Plugin type: "feature", "theme", "extension", etc.
     */
    @Column(name = "plugin_type", length = 50)
    private String pluginType = "feature";

    /**
     * Plugin status: "installed", "activated", "deactivated", "error"
     */
    @Column(nullable = false, length = 50)
    private String status = "installed";

    /**
     * Whether this is a bundled plugin (shipped with the app)
     */
    @Column(name = "is_bundled", nullable = false)
    private Boolean isBundled = false;

    /**
     * Path to the plugin JAR file (null for bundled plugins)
     */
    @Column(name = "jar_path", length = 1000)
    private String jarPath;

    /**
     * Plugin configuration data (JSON format)
     */
    @Column(name = "config_data", columnDefinition = "TEXT")
    private String configData;

    /**
     * When the plugin was installed
     */
    @CreationTimestamp
    @Column(name = "installed_at", nullable = false, updatable = false)
    private LocalDateTime installedAt;

    /**
     * When the plugin was last activated
     */
    @Column(name = "activated_at")
    private LocalDateTime activatedAt;

    /**
     * Last update timestamp
     */
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /**
     * Plugin dependencies
     */
    @OneToMany(mappedBy = "plugin", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PluginDependency> dependencies = new ArrayList<>();

    /**
     * Check if plugin is currently active
     */
    public boolean isActive() {
        return "activated".equals(status);
    }

    /**
     * Activate the plugin
     */
    public void activate() {
        this.status = "activated";
        this.activatedAt = LocalDateTime.now();
    }

    /**
     * Deactivate the plugin
     */
    public void deactivate() {
        this.status = "deactivated";
    }

    /**
     * Mark plugin as having an error
     */
    public void setError() {
        this.status = "error";
    }
}

package dev.mainul35.cms.sitebuilder.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

/**
 * Entity representing a registered UI component from a plugin.
 * Stored in the cms_component_registry table.
 */
@Entity
@Table(name = "cms_component_registry")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ComponentRegistryEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "plugin_id", nullable = false, length = 100)
    private String pluginId;

    @Column(name = "component_id", nullable = false, length = 100)
    private String componentId;

    @Column(name = "component_name", nullable = false, length = 200)
    private String componentName;

    @Column(name = "category", nullable = false, length = 50)
    private String category;

    @Column(name = "icon", length = 100)
    private String icon;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "component_manifest", nullable = false, columnDefinition = "JSON")
    private String componentManifest; // JSON string of ComponentManifest

    @Column(name = "react_bundle_path", length = 500)
    private String reactBundlePath;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "registered_at", nullable = false, updatable = false)
    private LocalDateTime registeredAt;
}

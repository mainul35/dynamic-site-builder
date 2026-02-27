package dev.mainul35.cms.sdk.component;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * Component manifest containing all metadata for a UI component plugin.
 * This data is registered in the component registry and used by the visual builder.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComponentManifest {

    /**
     * Unique component identifier
     */
    private String componentId;

    /**
     * Display name for the component palette
     */
    private String displayName;

    /**
     * Component category (ui, layout, form, widget)
     */
    private String category;

    /**
     * Icon identifier
     */
    private String icon;

    /**
     * Component description
     */
    private String description;

    /**
     * Default properties for the component
     */
    private Map<String, Object> defaultProps;

    /**
     * Default CSS styles for the component
     */
    private Map<String, String> defaultStyles;

    /**
     * Path to React component in plugin resources
     */
    private String reactComponentPath;

    /**
     * Path to preview component (optional)
     */
    private String previewComponentPath;

    /**
     * List of configurable properties
     */
    private List<PropDefinition> configurableProps;

    /**
     * List of configurable CSS properties
     */
    private List<StyleDefinition> configurableStyles;

    /**
     * Size constraints
     */
    private SizeConstraints sizeConstraints;

    /**
     * Plugin ID that provides this component
     */
    private String pluginId;

    /**
     * Plugin version
     */
    private String pluginVersion;

    /**
     * Whether component can have child components.
     * @deprecated Use {@link ComponentCapabilities#isCanHaveChildren()} via {@link #capabilities} instead.
     */
    private boolean canHaveChildren;

    /**
     * Allowed child component types (empty means all)
     */
    private List<String> allowedChildTypes;

    /**
     * Component capabilities that drive behavior in the visual builder.
     * Defines container support, data binding, resizing, and more.
     */
    private ComponentCapabilities capabilities;

    // ===== Export Template Fields =====

    /**
     * HTML template for static export.
     * Uses mustache-style placeholders: {{propName}}, {{styles.cssProperty}}
     * Special placeholders: {{children}} for nested content, {{styleString}} for inline styles
     * Example: "<hr style=\"{{styleString}}\" />"
     */
    private String staticExportTemplate;

    /**
     * Thymeleaf template for server-side export.
     * Uses Thymeleaf syntax: th:text, th:style, th:each, etc.
     * Example: "<hr th:style=\"${styleString}\" />"
     */
    private String thymeleafExportTemplate;

    /**
     * Whether this component has custom export handling.
     * If true, the export services will use the provided templates.
     * If false, falls back to generic export logic.
     */
    private boolean hasCustomExport;

    /**
     * Export template metadata containing additional export configuration.
     * Can include: wrapperTag, cssClasses, dataAttributes, etc.
     */
    private Map<String, Object> exportMetadata;
}

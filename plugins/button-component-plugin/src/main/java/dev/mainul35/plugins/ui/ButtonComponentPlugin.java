package dev.mainul35.plugins.ui;

import dev.mainul35.cms.sdk.Plugin;
import dev.mainul35.cms.sdk.PluginContext;
import dev.mainul35.cms.sdk.UIComponentPlugin;
import dev.mainul35.cms.sdk.annotation.UIComponent;
import dev.mainul35.cms.sdk.component.*;
import dev.mainul35.cms.sdk.component.ComponentCapabilities;
import lombok.extern.slf4j.Slf4j;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Button Component Plugin
 * Provides a customizable button component for the visual site builder
 */
@Slf4j
@UIComponent(
    componentId = "button",
    displayName = "Button",
    category = "ui",
    icon = "Button",
    resizable = true,
    defaultWidth = "150px",
    defaultHeight = "40px",
    minWidth = "80px",
    maxWidth = "500px",
    minHeight = "30px",
    maxHeight = "80px"
)
public class ButtonComponentPlugin implements UIComponentPlugin {

    private PluginContext context;
    private ComponentManifest manifest;

    @Override
    public void onLoad(PluginContext context) throws Exception {
        this.context = context;
        log.info("Loading Button Component Plugin");

        // Build component manifest
        this.manifest = buildComponentManifest();

        log.info("Button Component Plugin loaded successfully");
    }

    @Override
    public void onActivate(PluginContext context) throws Exception {
        log.info("Activating Button Component Plugin");
        // Plugin is now active and ready to use
    }

    @Override
    public void onDeactivate(PluginContext context) throws Exception {
        log.info("Deactivating Button Component Plugin");
        // Cleanup any active resources
    }

    @Override
    public void onUninstall(PluginContext context) throws Exception {
        log.info("Uninstalling Button Component Plugin");
        // Final cleanup
    }

    @Override
    public ComponentManifest getComponentManifest() {
        return manifest;
    }

    @Override
    public String getReactComponentPath() {
        return "/components/Button.jsx";
    }

    @Override
    public byte[] getComponentThumbnail() {
        // Return null for now - can be implemented later with actual image
        return null;
    }

    @Override
    public ValidationResult validateProps(Map<String, Object> props) {
        List<String> errors = new ArrayList<>();

        // Validate text prop
        if (props.containsKey("text")) {
            Object text = props.get("text");
            if (text != null && text.toString().length() > 100) {
                errors.add("Button text must not exceed 100 characters");
            }
        }

        // Validate variant prop
        if (props.containsKey("variant")) {
            String variant = props.get("variant").toString();
            if (!List.of("primary", "secondary", "success", "danger", "warning").contains(variant)) {
                errors.add("Invalid variant. Must be one of: primary, secondary, success, danger, warning");
            }
        }

        // Validate size prop
        if (props.containsKey("size")) {
            String size = props.get("size").toString();
            if (!List.of("small", "medium", "large").contains(size)) {
                errors.add("Invalid size. Must be one of: small, medium, large");
            }
        }

        return ValidationResult.builder()
                .isValid(errors.isEmpty())
                .errors(errors)
                .build();
    }

    /**
     * Build the complete component manifest
     */
    private ComponentManifest buildComponentManifest() {
        return ComponentManifest.builder()
                .componentId("button")
                .displayName("Button")
                .category("ui")
                .icon("🔘")
                .description("Interactive button component with multiple variants and sizes")
                .pluginId("button-component-plugin")
                .pluginVersion("1.0.0")
                .reactComponentPath("/components/Button.jsx")
                .defaultProps(buildDefaultProps())
                .defaultStyles(buildDefaultStyles())
                .configurableProps(buildConfigurableProps())
                .configurableStyles(buildConfigurableStyles())
                .sizeConstraints(buildSizeConstraints())
                .canHaveChildren(false)
                .capabilities(ComponentCapabilities.builder()
                        .canHaveChildren(false)
                        .isContainer(false)
                        .hasDataSource(false)
                        .autoHeight(false)
                        .isResizable(true)
                        .supportsTemplateBindings(true)
                        .build())
                .build();
    }

    /**
     * Default props
     */
    private Map<String, Object> buildDefaultProps() {
        Map<String, Object> props = new HashMap<>();
        props.put("text", "Click Me");
        props.put("variant", "primary");
        props.put("size", "medium");
        props.put("disabled", false);
        props.put("fullWidth", false);
        return props;
    }

    /**
     * Default styles
     */
    private Map<String, String> buildDefaultStyles() {
        Map<String, String> styles = new HashMap<>();
        styles.put("borderRadius", "6px");
        styles.put("fontWeight", "500");
        styles.put("cursor", "pointer");
        styles.put("transition", "all 0.2s");
        return styles;
    }

    /**
     * Configurable properties
     */
    private List<PropDefinition> buildConfigurableProps() {
        List<PropDefinition> props = new ArrayList<>();

        // Text property
        props.add(PropDefinition.builder()
                .name("text")
                .type(PropDefinition.PropType.STRING)
                .label("Button Text")
                .defaultValue("Click Me")
                .required(true)
                .helpText("The text displayed on the button")
                .build());

        // Variant property
        props.add(PropDefinition.builder()
                .name("variant")
                .type(PropDefinition.PropType.SELECT)
                .label("Variant")
                .defaultValue("primary")
                .options(List.of("primary", "secondary", "success", "danger", "warning"))
                .helpText("Button color variant")
                .build());

        // Size property
        props.add(PropDefinition.builder()
                .name("size")
                .type(PropDefinition.PropType.SELECT)
                .label("Size")
                .defaultValue("medium")
                .options(List.of("small", "medium", "large"))
                .helpText("Button size")
                .build());

        // Disabled property
        props.add(PropDefinition.builder()
                .name("disabled")
                .type(PropDefinition.PropType.BOOLEAN)
                .label("Disabled")
                .defaultValue(false)
                .helpText("Disable the button")
                .build());

        // Full width property
        props.add(PropDefinition.builder()
                .name("fullWidth")
                .type(PropDefinition.PropType.BOOLEAN)
                .label("Full Width")
                .defaultValue(false)
                .helpText("Make button full width")
                .build());

        return props;
    }

    /**
     * Configurable styles
     */
    private List<StyleDefinition> buildConfigurableStyles() {
        List<StyleDefinition> styles = new ArrayList<>();

        // Border radius
        styles.add(StyleDefinition.builder()
                .property("borderRadius")
                .type(StyleDefinition.StyleType.SIZE)
                .label("Border Radius")
                .defaultValue("6px")
                .allowedUnits(List.of("px", "rem", "%"))
                .category("border")
                .build());

        // Font weight
        styles.add(StyleDefinition.builder()
                .property("fontWeight")
                .type(StyleDefinition.StyleType.SELECT)
                .label("Font Weight")
                .defaultValue("500")
                .options(List.of("400", "500", "600", "700"))
                .category("text")
                .build());

        return styles;
    }

    /**
     * Size constraints
     */
    private SizeConstraints buildSizeConstraints() {
        return SizeConstraints.builder()
                .resizable(true)
                .defaultWidth("150px")
                .defaultHeight("40px")
                .minWidth("80px")
                .maxWidth("500px")
                .minHeight("30px")
                .maxHeight("80px")
                .widthLocked(false)
                .heightLocked(false)
                .maintainAspectRatio(false)
                .build();
    }

    @Override
    public String getPluginId() {
        return "button-component-plugin";
    }

    @Override
    public String getName() {
        return "Button Component";
    }

    @Override
    public String getVersion() {
        return "1.0.0";
    }

    @Override
    public String getDescription() {
        return "A customizable button component for the visual site builder";
    }
}

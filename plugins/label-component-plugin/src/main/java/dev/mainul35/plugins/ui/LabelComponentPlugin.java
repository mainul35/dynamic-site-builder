package dev.mainul35.plugins.ui;

import dev.mainul35.cms.sdk.Plugin;
import dev.mainul35.cms.sdk.PluginContext;
import dev.mainul35.cms.sdk.UIComponentPlugin;
import dev.mainul35.cms.sdk.annotation.UIComponent;
import dev.mainul35.cms.sdk.component.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Label Component Plugin
 * Provides a text label component for displaying static or dynamic text
 */
@UIComponent(
    componentId = "label",
    displayName = "Label",
    category = "ui",
    icon = "T",
    resizable = true,
    defaultWidth = "200px",
    defaultHeight = "auto",
    minWidth = "50px",
    maxWidth = "100%",
    minHeight = "20px",
    maxHeight = "500px"
)
public class LabelComponentPlugin implements UIComponentPlugin {

    private static final Logger log = LoggerFactory.getLogger(LabelComponentPlugin.class);

    private PluginContext context;
    private ComponentManifest manifest;

    @Override
    public void onLoad(PluginContext context) throws Exception {
        this.context = context;
        log.info("Loading Label Component Plugin");

        // Build component manifest
        this.manifest = buildComponentManifest();

        log.info("Label Component Plugin loaded successfully");
    }

    @Override
    public void onActivate(PluginContext context) throws Exception {
        log.info("Activating Label Component Plugin");
    }

    @Override
    public void onDeactivate(PluginContext context) throws Exception {
        log.info("Deactivating Label Component Plugin");
    }

    @Override
    public void onUninstall(PluginContext context) throws Exception {
        log.info("Uninstalling Label Component Plugin");
    }

    @Override
    public ComponentManifest getComponentManifest() {
        return manifest;
    }

    @Override
    public String getReactComponentPath() {
        return "/components/Label.jsx";
    }

    @Override
    public byte[] getComponentThumbnail() {
        return null;
    }

    @Override
    public ValidationResult validateProps(Map<String, Object> props) {
        List<String> errors = new ArrayList<>();

        // Validate text prop
        if (props.containsKey("text")) {
            Object text = props.get("text");
            if (text != null && text.toString().length() > 5000) {
                errors.add("Label text must not exceed 5000 characters");
            }
        }

        // Validate variant prop
        if (props.containsKey("variant")) {
            String variant = props.get("variant").toString();
            if (!List.of("h1", "h2", "h3", "h4", "h5", "h6", "p", "span", "caption").contains(variant)) {
                errors.add("Invalid variant. Must be one of: h1, h2, h3, h4, h5, h6, p, span, caption");
            }
        }

        // Validate textAlign prop
        if (props.containsKey("textAlign")) {
            String textAlign = props.get("textAlign").toString();
            if (!List.of("left", "center", "right", "justify").contains(textAlign)) {
                errors.add("Invalid textAlign. Must be one of: left, center, right, justify");
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
                .componentId("label")
                .displayName("Label")
                .category("ui")
                .icon("T")
                .description("Text label component for displaying headings, paragraphs, or any text content")
                .pluginId("label-component-plugin")
                .pluginVersion("1.0.0")
                .reactComponentPath("/components/Label.jsx")
                .defaultProps(buildDefaultProps())
                .defaultStyles(buildDefaultStyles())
                .configurableProps(buildConfigurableProps())
                .configurableStyles(buildConfigurableStyles())
                .sizeConstraints(buildSizeConstraints())
                .canHaveChildren(false)
                .build();
    }

    /**
     * Default props
     */
    private Map<String, Object> buildDefaultProps() {
        Map<String, Object> props = new HashMap<>();
        props.put("text", "Label Text");
        props.put("variant", "p");
        props.put("textAlign", "left");
        props.put("truncate", false);
        props.put("maxLines", 0); // 0 means no limit
        return props;
    }

    /**
     * Default styles
     * Note: fontSize, fontWeight, and lineHeight are intentionally omitted
     * so that the variant (h1-h6, p, etc.) can control these properties
     */
    private Map<String, String> buildDefaultStyles() {
        Map<String, String> styles = new HashMap<>();
        styles.put("color", "#333333");
        styles.put("margin", "0");
        styles.put("padding", "0");
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
                .label("Text Content")
                .defaultValue("Label Text")
                .required(true)
                .helpText("The text to display")
                .build());

        // Variant property (HTML element type)
        props.add(PropDefinition.builder()
                .name("variant")
                .type(PropDefinition.PropType.SELECT)
                .label("Variant")
                .defaultValue("p")
                .options(List.of("h1", "h2", "h3", "h4", "h5", "h6", "p", "span", "caption"))
                .helpText("HTML element type for semantic meaning")
                .build());

        // Text align property
        props.add(PropDefinition.builder()
                .name("textAlign")
                .type(PropDefinition.PropType.SELECT)
                .label("Text Align")
                .defaultValue("left")
                .options(List.of("left", "center", "right", "justify"))
                .helpText("Text alignment within the label")
                .build());

        // Truncate property
        props.add(PropDefinition.builder()
                .name("truncate")
                .type(PropDefinition.PropType.BOOLEAN)
                .label("Truncate")
                .defaultValue(false)
                .helpText("Truncate text with ellipsis if it overflows")
                .build());

        // Max lines property
        props.add(PropDefinition.builder()
                .name("maxLines")
                .type(PropDefinition.PropType.NUMBER)
                .label("Max Lines")
                .defaultValue(0)
                .helpText("Maximum number of lines to display (0 for unlimited)")
                .build());

        return props;
    }

    /**
     * Configurable styles
     */
    private List<StyleDefinition> buildConfigurableStyles() {
        List<StyleDefinition> styles = new ArrayList<>();

        // Font size
        styles.add(StyleDefinition.builder()
                .property("fontSize")
                .type(StyleDefinition.StyleType.SIZE)
                .label("Font Size")
                .defaultValue("16px")
                .allowedUnits(List.of("px", "rem", "em", "%"))
                .category("text")
                .build());

        // Font weight
        styles.add(StyleDefinition.builder()
                .property("fontWeight")
                .type(StyleDefinition.StyleType.SELECT)
                .label("Font Weight")
                .defaultValue("400")
                .options(List.of("300", "400", "500", "600", "700", "800"))
                .category("text")
                .build());

        // Color
        styles.add(StyleDefinition.builder()
                .property("color")
                .type(StyleDefinition.StyleType.COLOR)
                .label("Text Color")
                .defaultValue("#333333")
                .category("text")
                .build());

        // Line height
        styles.add(StyleDefinition.builder()
                .property("lineHeight")
                .type(StyleDefinition.StyleType.SIZE)
                .label("Line Height")
                .defaultValue("1.5")
                .allowedUnits(List.of("", "px", "em", "%"))
                .category("text")
                .build());

        // Letter spacing
        styles.add(StyleDefinition.builder()
                .property("letterSpacing")
                .type(StyleDefinition.StyleType.SIZE)
                .label("Letter Spacing")
                .defaultValue("0")
                .allowedUnits(List.of("px", "em"))
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
                .defaultWidth("200px")
                .defaultHeight("auto")
                .minWidth("50px")
                .maxWidth("100%")
                .minHeight("20px")
                .maxHeight("500px")
                .widthLocked(false)
                .heightLocked(false)
                .maintainAspectRatio(false)
                .build();
    }

    @Override
    public String getPluginId() {
        return "label-component-plugin";
    }

    @Override
    public String getName() {
        return "Label Component";
    }

    @Override
    public String getVersion() {
        return "1.0.0";
    }

    @Override
    public String getDescription() {
        return "A text label component for displaying static or dynamic text";
    }
}

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
 * Textbox Component Plugin
 * Provides a text input component for forms and user input
 */
@Slf4j
@UIComponent(
    componentId = "textbox",
    displayName = "Textbox",
    category = "ui",
    icon = "I",
    resizable = true,
    defaultWidth = "250px",
    defaultHeight = "40px",
    minWidth = "100px",
    maxWidth = "100%",
    minHeight = "32px",
    maxHeight = "300px"
)
public class TextboxComponentPlugin implements UIComponentPlugin {

    private PluginContext context;
    private ComponentManifest manifest;

    @Override
    public void onLoad(PluginContext context) throws Exception {
        this.context = context;
        log.info("Loading Textbox Component Plugin");

        // Build component manifest
        this.manifest = buildComponentManifest();

        log.info("Textbox Component Plugin loaded successfully");
    }

    @Override
    public void onActivate(PluginContext context) throws Exception {
        log.info("Activating Textbox Component Plugin");
    }

    @Override
    public void onDeactivate(PluginContext context) throws Exception {
        log.info("Deactivating Textbox Component Plugin");
    }

    @Override
    public void onUninstall(PluginContext context) throws Exception {
        log.info("Uninstalling Textbox Component Plugin");
    }

    @Override
    public ComponentManifest getComponentManifest() {
        return manifest;
    }

    @Override
    public String getReactComponentPath() {
        return "/components/Textbox.jsx";
    }

    @Override
    public byte[] getComponentThumbnail() {
        return null;
    }

    @Override
    public ValidationResult validateProps(Map<String, Object> props) {
        List<String> errors = new ArrayList<>();

        // Validate placeholder prop
        if (props.containsKey("placeholder")) {
            Object placeholder = props.get("placeholder");
            if (placeholder != null && placeholder.toString().length() > 200) {
                errors.add("Placeholder text must not exceed 200 characters");
            }
        }

        // Validate type prop
        if (props.containsKey("type")) {
            String type = props.get("type").toString();
            if (!List.of("text", "password", "email", "number", "tel", "url", "search").contains(type)) {
                errors.add("Invalid type. Must be one of: text, password, email, number, tel, url, search");
            }
        }

        // Validate maxLength prop
        if (props.containsKey("maxLength")) {
            Object maxLength = props.get("maxLength");
            if (maxLength != null) {
                try {
                    int length = Integer.parseInt(maxLength.toString());
                    if (length < 0 || length > 10000) {
                        errors.add("maxLength must be between 0 and 10000");
                    }
                } catch (NumberFormatException e) {
                    errors.add("maxLength must be a valid number");
                }
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
                .componentId("textbox")
                .displayName("Textbox")
                .category("ui")
                .icon("I")
                .description("Text input component for single-line or multi-line user input")
                .pluginId("textbox-component-plugin")
                .pluginVersion("1.0.0")
                .reactComponentPath("/components/Textbox.jsx")
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
        props.put("placeholder", "Enter text...");
        props.put("type", "text");
        props.put("disabled", false);
        props.put("readOnly", false);
        props.put("required", false);
        props.put("multiline", false);
        props.put("rows", 3);
        props.put("maxLength", 0); // 0 means no limit
        props.put("name", "");
        props.put("label", "");
        props.put("showLabel", false);
        return props;
    }

    /**
     * Default styles
     * Note: Visual styles like border, backgroundColor, padding, and borderRadius
     * are intentionally omitted here because they are applied directly by the
     * TextboxRenderer to the input element. Including them here would cause
     * double-rendering (styles on wrapper + styles on input).
     */
    private Map<String, String> buildDefaultStyles() {
        Map<String, String> styles = new HashMap<>();
        // Only include styles that should apply to the wrapper, not the input itself
        return styles;
    }

    /**
     * Configurable properties
     */
    private List<PropDefinition> buildConfigurableProps() {
        List<PropDefinition> props = new ArrayList<>();

        // Label property
        props.add(PropDefinition.builder()
                .name("label")
                .type(PropDefinition.PropType.STRING)
                .label("Label")
                .defaultValue("")
                .helpText("Label text displayed above the input")
                .build());

        // Show label property
        props.add(PropDefinition.builder()
                .name("showLabel")
                .type(PropDefinition.PropType.BOOLEAN)
                .label("Show Label")
                .defaultValue(false)
                .helpText("Show the label above the input")
                .build());

        // Placeholder property
        props.add(PropDefinition.builder()
                .name("placeholder")
                .type(PropDefinition.PropType.STRING)
                .label("Placeholder")
                .defaultValue("Enter text...")
                .helpText("Placeholder text shown when input is empty")
                .build());

        // Type property
        props.add(PropDefinition.builder()
                .name("type")
                .type(PropDefinition.PropType.SELECT)
                .label("Input Type")
                .defaultValue("text")
                .options(List.of("text", "password", "email", "number", "tel", "url", "search"))
                .helpText("Type of input field")
                .build());

        // Multiline property
        props.add(PropDefinition.builder()
                .name("multiline")
                .type(PropDefinition.PropType.BOOLEAN)
                .label("Multiline")
                .defaultValue(false)
                .helpText("Enable multiline input (textarea)")
                .build());

        // Rows property (for multiline)
        props.add(PropDefinition.builder()
                .name("rows")
                .type(PropDefinition.PropType.NUMBER)
                .label("Rows")
                .defaultValue(3)
                .helpText("Number of visible rows (for multiline)")
                .build());

        // Disabled property
        props.add(PropDefinition.builder()
                .name("disabled")
                .type(PropDefinition.PropType.BOOLEAN)
                .label("Disabled")
                .defaultValue(false)
                .helpText("Disable the input field")
                .build());

        // Read only property
        props.add(PropDefinition.builder()
                .name("readOnly")
                .type(PropDefinition.PropType.BOOLEAN)
                .label("Read Only")
                .defaultValue(false)
                .helpText("Make the input read-only")
                .build());

        // Required property
        props.add(PropDefinition.builder()
                .name("required")
                .type(PropDefinition.PropType.BOOLEAN)
                .label("Required")
                .defaultValue(false)
                .helpText("Mark the input as required")
                .build());

        // Max length property
        props.add(PropDefinition.builder()
                .name("maxLength")
                .type(PropDefinition.PropType.NUMBER)
                .label("Max Length")
                .defaultValue(0)
                .helpText("Maximum number of characters (0 for unlimited)")
                .build());

        // Name property (for forms)
        props.add(PropDefinition.builder()
                .name("name")
                .type(PropDefinition.PropType.STRING)
                .label("Field Name")
                .defaultValue("")
                .helpText("Name attribute for form submission")
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
                .defaultValue("4px")
                .allowedUnits(List.of("px", "rem", "%"))
                .category("border")
                .build());

        // Border
        styles.add(StyleDefinition.builder()
                .property("border")
                .type(StyleDefinition.StyleType.BORDER)
                .label("Border")
                .defaultValue("1px solid #ccc")
                .category("border")
                .build());

        // Font size
        styles.add(StyleDefinition.builder()
                .property("fontSize")
                .type(StyleDefinition.StyleType.SIZE)
                .label("Font Size")
                .defaultValue("14px")
                .allowedUnits(List.of("px", "rem", "em"))
                .category("text")
                .build());

        // Background color
        styles.add(StyleDefinition.builder()
                .property("backgroundColor")
                .type(StyleDefinition.StyleType.COLOR)
                .label("Background Color")
                .defaultValue("#ffffff")
                .category("background")
                .build());

        // Text color
        styles.add(StyleDefinition.builder()
                .property("color")
                .type(StyleDefinition.StyleType.COLOR)
                .label("Text Color")
                .defaultValue("#333333")
                .category("text")
                .build());

        // Padding
        styles.add(StyleDefinition.builder()
                .property("padding")
                .type(StyleDefinition.StyleType.SIZE)
                .label("Padding")
                .defaultValue("8px 12px")
                .allowedUnits(List.of("px", "rem", "em"))
                .category("spacing")
                .build());

        return styles;
    }

    /**
     * Size constraints
     */
    private SizeConstraints buildSizeConstraints() {
        return SizeConstraints.builder()
                .resizable(true)
                .defaultWidth("250px")
                .defaultHeight("40px")
                .minWidth("100px")
                .maxWidth("100%")
                .minHeight("32px")
                .maxHeight("300px")
                .widthLocked(false)
                .heightLocked(false)
                .maintainAspectRatio(false)
                .build();
    }

    @Override
    public String getPluginId() {
        return "textbox-component-plugin";
    }

    @Override
    public String getName() {
        return "Textbox Component";
    }

    @Override
    public String getVersion() {
        return "1.0.0";
    }

    @Override
    public String getDescription() {
        return "A text input component for forms and user input";
    }
}

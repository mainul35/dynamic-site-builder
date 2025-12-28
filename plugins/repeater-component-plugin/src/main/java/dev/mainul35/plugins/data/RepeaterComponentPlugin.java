package dev.mainul35.plugins.data;

import dev.mainul35.cms.sdk.PluginContext;
import dev.mainul35.cms.sdk.UIComponentPlugin;
import dev.mainul35.cms.sdk.annotation.UIComponent;
import dev.mainul35.cms.sdk.component.*;
import lombok.extern.slf4j.Slf4j;

import java.util.*;

/**
 * Repeater Component Plugin
 * Iterates over data arrays and renders children for each item.
 * Supports template variable syntax {{item.field}} in child components.
 */
@Slf4j
@UIComponent(
    componentId = "Repeater",
    displayName = "Repeater",
    category = "data",
    icon = "\uD83D\uDD01",
    resizable = true,
    defaultWidth = "100%",
    defaultHeight = "auto"
)
public class RepeaterComponentPlugin implements UIComponentPlugin {

    private static final String PLUGIN_ID = "repeater-component-plugin";
    private static final String PLUGIN_VERSION = "1.0.0";

    private ComponentManifest manifest;

    @Override
    public void onLoad(PluginContext context) throws Exception {
        log.info("Loading Repeater Component Plugin");
        this.manifest = buildComponentManifest();
        log.info("Repeater Component Plugin loaded successfully");
    }

    @Override
    public void onActivate(PluginContext context) throws Exception {
        log.info("Activating Repeater Component Plugin");
    }

    @Override
    public void onDeactivate(PluginContext context) throws Exception {
        log.info("Deactivating Repeater Component Plugin");
    }

    @Override
    public void onUninstall(PluginContext context) throws Exception {
        log.info("Uninstalling Repeater Component Plugin");
    }

    @Override
    public ComponentManifest getComponentManifest() {
        return manifest;
    }

    @Override
    public String getReactComponentPath() {
        return "/renderers/RepeaterRenderer";
    }

    @Override
    public byte[] getComponentThumbnail() {
        return null;
    }

    @Override
    public ValidationResult validateProps(Map<String, Object> props) {
        List<String> errors = new ArrayList<>();

        // Validate dataPath is provided
        if (!props.containsKey("dataPath") || props.get("dataPath") == null) {
            errors.add("Data path is required");
        } else {
            String dataPath = props.get("dataPath").toString();
            if (dataPath.trim().isEmpty()) {
                errors.add("Data path cannot be empty");
            }
        }

        // Validate itemAlias is a valid identifier
        if (props.containsKey("itemAlias")) {
            String itemAlias = props.get("itemAlias").toString();
            if (!itemAlias.matches("^[a-zA-Z_][a-zA-Z0-9_]*$")) {
                errors.add("Item alias must be a valid identifier (start with letter or underscore)");
            }
        }

        return ValidationResult.builder()
                .isValid(errors.isEmpty())
                .errors(errors)
                .build();
    }

    private ComponentManifest buildComponentManifest() {
        return ComponentManifest.builder()
                .componentId("Repeater")
                .displayName("Repeater")
                .category("data")
                .icon("\uD83D\uDD01")
                .description("Iterate over array data and render children for each item. Use {{item.field}} syntax in child components.")
                .pluginId(PLUGIN_ID)
                .pluginVersion(PLUGIN_VERSION)
                .reactComponentPath("/renderers/RepeaterRenderer")
                .defaultProps(buildDefaultProps())
                .defaultStyles(buildDefaultStyles())
                .configurableProps(buildConfigurableProps())
                .configurableStyles(buildConfigurableStyles())
                .sizeConstraints(buildSizeConstraints())
                .canHaveChildren(true)
                .build();
    }

    private Map<String, Object> buildDefaultProps() {
        Map<String, Object> props = new HashMap<>();
        props.put("dataPath", "items");
        props.put("itemAlias", "item");
        props.put("indexAlias", "index");
        props.put("emptyMessage", "No items to display");
        props.put("layoutType", "flex-column");
        props.put("gap", "16px");
        return props;
    }

    private Map<String, String> buildDefaultStyles() {
        Map<String, String> styles = new HashMap<>();
        styles.put("display", "flex");
        styles.put("flexDirection", "column");
        styles.put("gap", "16px");
        styles.put("width", "100%");
        return styles;
    }

    private List<PropDefinition> buildConfigurableProps() {
        List<PropDefinition> props = new ArrayList<>();

        props.add(PropDefinition.builder()
                .name("dataPath")
                .type(PropDefinition.PropType.STRING)
                .label("Data Path")
                .defaultValue("items")
                .required(true)
                .helpText("Path to the array in the data source (e.g., 'items', 'data.products')")
                .build());

        props.add(PropDefinition.builder()
                .name("itemAlias")
                .type(PropDefinition.PropType.STRING)
                .label("Item Variable")
                .defaultValue("item")
                .required(false)
                .helpText("Variable name for current item (use {{item.field}} in children)")
                .build());

        props.add(PropDefinition.builder()
                .name("indexAlias")
                .type(PropDefinition.PropType.STRING)
                .label("Index Variable")
                .defaultValue("index")
                .required(false)
                .helpText("Variable name for current index")
                .build());

        props.add(PropDefinition.builder()
                .name("emptyMessage")
                .type(PropDefinition.PropType.STRING)
                .label("Empty Message")
                .defaultValue("No items to display")
                .required(false)
                .helpText("Message shown when data array is empty")
                .build());

        props.add(PropDefinition.builder()
                .name("layoutType")
                .type(PropDefinition.PropType.SELECT)
                .label("Layout Type")
                .defaultValue("flex-column")
                .options(List.of("flex-column", "flex-row", "flex-wrap", "grid-2col", "grid-3col", "grid-4col"))
                .helpText("How repeated items are arranged")
                .build());

        props.add(PropDefinition.builder()
                .name("gap")
                .type(PropDefinition.PropType.STRING)
                .label("Gap")
                .defaultValue("16px")
                .required(false)
                .helpText("Space between repeated items (e.g., 16px, 1rem)")
                .build());

        return props;
    }

    private List<StyleDefinition> buildConfigurableStyles() {
        List<StyleDefinition> styles = new ArrayList<>();

        styles.add(StyleDefinition.builder()
                .property("gap")
                .type(StyleDefinition.StyleType.SIZE)
                .label("Gap")
                .defaultValue("16px")
                .allowedUnits(List.of("px", "rem", "em"))
                .category("spacing")
                .build());

        styles.add(StyleDefinition.builder()
                .property("padding")
                .type(StyleDefinition.StyleType.SIZE)
                .label("Padding")
                .defaultValue("0")
                .allowedUnits(List.of("px", "rem", "em"))
                .category("spacing")
                .build());

        return styles;
    }

    private SizeConstraints buildSizeConstraints() {
        return SizeConstraints.builder()
                .resizable(true)
                .defaultWidth("100%")
                .defaultHeight("auto")
                .minWidth("100px")
                .maxWidth("100%")
                .widthLocked(false)
                .heightLocked(false)
                .build();
    }

    @Override
    public String getPluginId() {
        return PLUGIN_ID;
    }

    @Override
    public String getName() {
        return "Repeater Component";
    }

    @Override
    public String getVersion() {
        return PLUGIN_VERSION;
    }

    @Override
    public String getDescription() {
        return "Repeater component for iterating over data arrays and rendering children";
    }
}

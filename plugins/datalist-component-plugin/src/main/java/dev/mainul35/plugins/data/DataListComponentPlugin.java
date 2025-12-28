package dev.mainul35.plugins.data;

import dev.mainul35.cms.sdk.PluginContext;
import dev.mainul35.cms.sdk.UIComponentPlugin;
import dev.mainul35.cms.sdk.annotation.UIComponent;
import dev.mainul35.cms.sdk.component.*;
import lombok.extern.slf4j.Slf4j;

import java.util.*;

/**
 * DataList Component Plugin
 * Pre-styled list for displaying data as cards, table, list, or grid.
 * Automatically renders items from data source with configurable field mappings.
 */
@Slf4j
@UIComponent(
    componentId = "DataList",
    displayName = "Data List",
    category = "data",
    icon = "\uD83D\uDCCB",
    resizable = true,
    defaultWidth = "100%",
    defaultHeight = "auto"
)
public class DataListComponentPlugin implements UIComponentPlugin {

    private static final String PLUGIN_ID = "datalist-component-plugin";
    private static final String PLUGIN_VERSION = "1.0.0";

    private ComponentManifest manifest;

    @Override
    public void onLoad(PluginContext context) throws Exception {
        log.info("Loading DataList Component Plugin");
        this.manifest = buildComponentManifest();
        log.info("DataList Component Plugin loaded successfully");
    }

    @Override
    public void onActivate(PluginContext context) throws Exception {
        log.info("Activating DataList Component Plugin");
    }

    @Override
    public void onDeactivate(PluginContext context) throws Exception {
        log.info("Deactivating DataList Component Plugin");
    }

    @Override
    public void onUninstall(PluginContext context) throws Exception {
        log.info("Uninstalling DataList Component Plugin");
    }

    @Override
    public ComponentManifest getComponentManifest() {
        return manifest;
    }

    @Override
    public String getReactComponentPath() {
        return "/renderers/DataListRenderer";
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
        }

        // Validate pageSize is positive if pagination is enabled
        if (props.containsKey("pagination") && Boolean.TRUE.equals(props.get("pagination"))) {
            if (props.containsKey("pageSize")) {
                try {
                    int pageSize = Integer.parseInt(props.get("pageSize").toString());
                    if (pageSize <= 0) {
                        errors.add("Page size must be a positive number");
                    }
                } catch (NumberFormatException e) {
                    errors.add("Page size must be a valid number");
                }
            }
        }

        return ValidationResult.builder()
                .isValid(errors.isEmpty())
                .errors(errors)
                .build();
    }

    private ComponentManifest buildComponentManifest() {
        return ComponentManifest.builder()
                .componentId("DataList")
                .displayName("Data List")
                .category("data")
                .icon("\uD83D\uDCCB")
                .description("Pre-styled list for displaying data as cards, table, or list. Automatically renders items from data source.")
                .pluginId(PLUGIN_ID)
                .pluginVersion(PLUGIN_VERSION)
                .reactComponentPath("/renderers/DataListRenderer")
                .defaultProps(buildDefaultProps())
                .defaultStyles(buildDefaultStyles())
                .configurableProps(buildConfigurableProps())
                .configurableStyles(buildConfigurableStyles())
                .sizeConstraints(buildSizeConstraints())
                .canHaveChildren(false)
                .build();
    }

    private Map<String, Object> buildDefaultProps() {
        Map<String, Object> props = new HashMap<>();
        props.put("listStyle", "cards");
        props.put("itemAlias", "item");
        props.put("dataPath", "items");
        props.put("titleField", "title");
        props.put("descriptionField", "description");
        props.put("imageField", "image");
        props.put("pagination", false);
        props.put("pageSize", 10);
        props.put("columns", "[]");
        props.put("emptyMessage", "No items to display");
        return props;
    }

    private Map<String, String> buildDefaultStyles() {
        Map<String, String> styles = new HashMap<>();
        styles.put("gap", "24px");
        styles.put("width", "100%");
        return styles;
    }

    private List<PropDefinition> buildConfigurableProps() {
        List<PropDefinition> props = new ArrayList<>();

        props.add(PropDefinition.builder()
                .name("listStyle")
                .type(PropDefinition.PropType.SELECT)
                .label("List Style")
                .defaultValue("cards")
                .options(List.of("cards", "table", "list", "grid"))
                .helpText("Visual style for displaying data")
                .build());

        props.add(PropDefinition.builder()
                .name("dataPath")
                .type(PropDefinition.PropType.STRING)
                .label("Data Path")
                .defaultValue("items")
                .required(true)
                .helpText("Path to the array in the data source")
                .build());

        props.add(PropDefinition.builder()
                .name("titleField")
                .type(PropDefinition.PropType.STRING)
                .label("Title Field")
                .defaultValue("title")
                .helpText("Field name for item title")
                .build());

        props.add(PropDefinition.builder()
                .name("descriptionField")
                .type(PropDefinition.PropType.STRING)
                .label("Description Field")
                .defaultValue("description")
                .helpText("Field name for item description")
                .build());

        props.add(PropDefinition.builder()
                .name("imageField")
                .type(PropDefinition.PropType.STRING)
                .label("Image Field")
                .defaultValue("image")
                .helpText("Field name for item image URL")
                .build());

        props.add(PropDefinition.builder()
                .name("pagination")
                .type(PropDefinition.PropType.BOOLEAN)
                .label("Enable Pagination")
                .defaultValue(false)
                .helpText("Show pagination controls")
                .build());

        props.add(PropDefinition.builder()
                .name("pageSize")
                .type(PropDefinition.PropType.NUMBER)
                .label("Page Size")
                .defaultValue(10)
                .helpText("Items per page when pagination is enabled")
                .build());

        props.add(PropDefinition.builder()
                .name("columns")
                .type(PropDefinition.PropType.JSON)
                .label("Table Columns")
                .defaultValue("[]")
                .helpText("Column definitions for table style: [{\"field\": \"name\", \"header\": \"Name\"}]")
                .build());

        props.add(PropDefinition.builder()
                .name("emptyMessage")
                .type(PropDefinition.PropType.STRING)
                .label("Empty Message")
                .defaultValue("No items to display")
                .helpText("Message shown when data array is empty")
                .build());

        return props;
    }

    private List<StyleDefinition> buildConfigurableStyles() {
        List<StyleDefinition> styles = new ArrayList<>();

        styles.add(StyleDefinition.builder()
                .property("gap")
                .type(StyleDefinition.StyleType.SIZE)
                .label("Gap")
                .defaultValue("24px")
                .allowedUnits(List.of("px", "rem"))
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
                .minWidth("200px")
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
        return "DataList Component";
    }

    @Override
    public String getVersion() {
        return PLUGIN_VERSION;
    }

    @Override
    public String getDescription() {
        return "Pre-styled data list component for displaying data as cards, table, or list";
    }
}

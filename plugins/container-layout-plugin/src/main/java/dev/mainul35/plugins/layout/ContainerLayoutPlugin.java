package dev.mainul35.plugins.layout;

import dev.mainul35.cms.sdk.PluginContext;
import dev.mainul35.cms.sdk.UIComponentPlugin;
import dev.mainul35.cms.sdk.annotation.UIComponent;
import dev.mainul35.cms.sdk.component.*;
import dev.mainul35.cms.sdk.component.ComponentCapabilities;
import lombok.extern.slf4j.Slf4j;

import java.util.*;

/**
 * Container Layout Plugin
 * Provides a flexible container component that can hold child components
 */
@Slf4j
@UIComponent(
    componentId = "Container",
    displayName = "Container",
    category = "layout",
    icon = "📦",
    resizable = true,
    defaultWidth = "100%",
    defaultHeight = "auto"
)
public class ContainerLayoutPlugin implements UIComponentPlugin {

    // Constants for property names
    private static final String PROP_PADDING = "padding";
    private static final String PROP_MAX_WIDTH = "maxWidth";
    private static final String PROP_GAP = "gap";
    private static final String PROP_ALIGN_ITEMS = "alignItems";
    private static final String PROP_JUSTIFY_CONTENT = "justifyContent";

    // Constants for default values
    private static final String DEFAULT_LAYOUT = "flex-column";
    private static final String DEFAULT_GAP = "16px";
    private static final String DEFAULT_PADDING = "20px";
    private static final String DEFAULT_MAX_WIDTH = "1200px";
    private static final String DEFAULT_ALIGN_ITEMS = "stretch";
    private static final String DEFAULT_JUSTIFY_CONTENT = "flex-start";

    // Validation pattern for size values
    private static final String SIZE_PATTERN = "\\d+(px|rem|em|%)";

    private ComponentManifest manifest;

    @Override
    public void onLoad(PluginContext context) throws Exception {
        log.info("Loading Container Layout Plugin");
        this.manifest = buildComponentManifest();
        log.info("Container Layout Plugin loaded successfully");
    }

    @Override
    public void onActivate(PluginContext context) throws Exception {
        log.info("Activating Container Layout Plugin");
    }

    @Override
    public void onDeactivate(PluginContext context) throws Exception {
        log.info("Deactivating Container Layout Plugin");
    }

    @Override
    public void onUninstall(PluginContext context) throws Exception {
        log.info("Uninstalling Container Layout Plugin");
    }

    @Override
    public ComponentManifest getComponentManifest() {
        return manifest;
    }

    @Override
    public String getReactComponentPath() {
        return "/components/Container.jsx";
    }

    @Override
    public byte[] getComponentThumbnail() {
        return null;
    }

    @Override
    public ValidationResult validateProps(Map<String, Object> props) {
        List<String> errors = new ArrayList<>();

        // Validate padding
        if (props.containsKey(PROP_PADDING)) {
            String padding = props.get(PROP_PADDING).toString();
            if (!padding.matches(SIZE_PATTERN)) {
                errors.add("Invalid padding format. Use format like '20px' or '1rem'");
            }
        }

        // Validate max-width
        if (props.containsKey(PROP_MAX_WIDTH)) {
            String maxWidth = props.get(PROP_MAX_WIDTH).toString();
            if (!maxWidth.equals("none") && !maxWidth.matches(SIZE_PATTERN)) {
                errors.add("Invalid maxWidth format. Use 'none' or format like '1200px'");
            }
        }

        // Validate gap
        if (props.containsKey(PROP_GAP)) {
            String gap = props.get(PROP_GAP).toString();
            if (!gap.matches(SIZE_PATTERN)) {
                errors.add("Invalid gap format. Use format like '16px' or '1rem'");
            }
        }

        return ValidationResult.builder()
                .isValid(errors.isEmpty())
                .errors(errors)
                .build();
    }

    private ComponentManifest buildComponentManifest() {
        return ComponentManifest.builder()
                .componentId("Container")
                .displayName("Container")
                .category("layout")
                .icon("📦")
                .description("Flexible container layout that holds child components with various layout options")
                .pluginId("container-layout-plugin")
                .pluginVersion("1.0.0")
                .reactComponentPath("/components/Container.jsx")
                .defaultProps(buildDefaultProps())
                .defaultStyles(buildDefaultStyles())
                .configurableProps(buildConfigurableProps())
                .configurableStyles(buildConfigurableStyles())
                .sizeConstraints(buildSizeConstraints())
                .canHaveChildren(true)
                .capabilities(ComponentCapabilities.builder()
                        .canHaveChildren(true)
                        .isContainer(true)
                        .hasDataSource(false)
                        .autoHeight(true)
                        .isResizable(true)
                        .supportsTemplateBindings(true)
                        .build())
                .allowedChildTypes(null)
                .build();
    }

    private Map<String, Object> buildDefaultProps() {
        Map<String, Object> props = new HashMap<>();
        props.put("layoutType", DEFAULT_LAYOUT);
        props.put("layoutMode", DEFAULT_LAYOUT);
        props.put(PROP_GAP, DEFAULT_GAP);
        props.put(PROP_PADDING, DEFAULT_PADDING);
        props.put(PROP_MAX_WIDTH, DEFAULT_MAX_WIDTH);
        props.put("centerContent", true);
        props.put(PROP_ALIGN_ITEMS, DEFAULT_ALIGN_ITEMS);
        props.put(PROP_JUSTIFY_CONTENT, DEFAULT_JUSTIFY_CONTENT);
        props.put("allowOverflow", false);
        props.put("heightMode", "resizable");
        return props;
    }

    private Map<String, String> buildDefaultStyles() {
        Map<String, String> styles = new HashMap<>();
        styles.put("display", "flex");
        styles.put("flexDirection", "column");
        styles.put(PROP_GAP, DEFAULT_GAP);
        styles.put("backgroundColor", "#ffffff");
        styles.put("borderRadius", "8px");
        styles.put("boxShadow", "0 1px 3px rgba(0,0,0,0.1)");
        return styles;
    }

    private List<PropDefinition> buildConfigurableProps() {
        List<PropDefinition> props = new ArrayList<>();

        props.add(PropDefinition.builder()
                .name("layoutMode")
                .type(PropDefinition.PropType.SELECT)
                .label("Layout Mode")
                .defaultValue(DEFAULT_LAYOUT)
                .options(List.of(
                    DEFAULT_LAYOUT,
                    "flex-row",
                    "flex-wrap",
                    "grid-2col",
                    "grid-3col",
                    "grid-4col",
                    "grid-auto",
                    // Asymmetric 2-column layouts
                    "grid-20-80",
                    "grid-25-75",
                    "grid-33-67",
                    "grid-40-60",
                    "grid-60-40",
                    "grid-67-33",
                    "grid-75-25",
                    "grid-80-20"
                ))
                .required(true)
                .helpText("How child components are arranged")
                .build());

        props.add(PropDefinition.builder()
                .name(PROP_GAP)
                .type(PropDefinition.PropType.STRING)
                .label("Gap")
                .defaultValue(DEFAULT_GAP)
                .required(false)
                .helpText("Space between child components (e.g., 16px, 1rem)")
                .build());

        props.add(PropDefinition.builder()
                .name(PROP_PADDING)
                .type(PropDefinition.PropType.STRING)
                .label("Padding")
                .defaultValue(DEFAULT_PADDING)
                .required(false)
                .helpText("Inner padding of the container")
                .build());

        props.add(PropDefinition.builder()
                .name(PROP_MAX_WIDTH)
                .type(PropDefinition.PropType.STRING)
                .label("Max Width")
                .defaultValue(DEFAULT_MAX_WIDTH)
                .required(false)
                .helpText("Maximum width of the container (use \"none\" for no limit)")
                .build());

        props.add(PropDefinition.builder()
                .name("centerContent")
                .type(PropDefinition.PropType.BOOLEAN)
                .label("Center Content")
                .defaultValue(true)
                .helpText("Center the container horizontally on the page")
                .build());

        props.add(PropDefinition.builder()
                .name(PROP_ALIGN_ITEMS)
                .type(PropDefinition.PropType.SELECT)
                .label("Align Items")
                .defaultValue(DEFAULT_ALIGN_ITEMS)
                .options(List.of(DEFAULT_JUSTIFY_CONTENT, "center", "flex-end", DEFAULT_ALIGN_ITEMS, "baseline"))
                .helpText("Cross-axis alignment of children")
                .build());

        props.add(PropDefinition.builder()
                .name(PROP_JUSTIFY_CONTENT)
                .type(PropDefinition.PropType.SELECT)
                .label("Justify Content")
                .defaultValue(DEFAULT_JUSTIFY_CONTENT)
                .options(List.of(DEFAULT_JUSTIFY_CONTENT, "center", "flex-end", "space-between", "space-around", "space-evenly"))
                .helpText("Main-axis alignment of children")
                .build());

        props.add(PropDefinition.builder()
                .name("allowOverflow")
                .type(PropDefinition.PropType.BOOLEAN)
                .label("Allow Overflow")
                .defaultValue(false)
                .helpText("Allow content to overflow container")
                .build());

        props.add(PropDefinition.builder()
                .name("heightMode")
                .type(PropDefinition.PropType.SELECT)
                .label("Height Mode")
                .defaultValue("resizable")
                .options(List.of("fill", "resizable", "wrap"))
                .required(false)
                .helpText("Height behavior: fill (100% of parent), resizable (fixed pixel height), wrap (auto based on content)")
                .build());

        return props;
    }

    private List<StyleDefinition> buildConfigurableStyles() {
        List<StyleDefinition> styles = new ArrayList<>();

        styles.add(StyleDefinition.builder()
                .property(PROP_GAP)
                .type(StyleDefinition.StyleType.SIZE)
                .label("Gap Between Items")
                .defaultValue(DEFAULT_GAP)
                .allowedUnits(List.of("px", "rem", "em"))
                .category("spacing")
                .build());

        styles.add(StyleDefinition.builder()
                .property("backgroundColor")
                .type(StyleDefinition.StyleType.COLOR)
                .label("Background Color")
                .defaultValue("#ffffff")
                .category("appearance")
                .build());

        styles.add(StyleDefinition.builder()
                .property("borderRadius")
                .type(StyleDefinition.StyleType.SIZE)
                .label("Border Radius")
                .defaultValue("8px")
                .allowedUnits(List.of("px", "rem", "%"))
                .category("border")
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
                .minHeight("auto")
                .heightLocked(false)
                .build();
    }

    @Override
    public String getPluginId() {
        return "container-layout-plugin";
    }

    @Override
    public String getName() {
        return "Container Layout";
    }

    @Override
    public String getVersion() {
        return "1.0.0";
    }

    @Override
    public String getDescription() {
        return "A flexible container layout component that can hold child components";
    }
}

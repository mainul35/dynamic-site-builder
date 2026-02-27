package dev.mainul35.plugins.layout;

import dev.mainul35.cms.sdk.PluginContext;
import dev.mainul35.cms.sdk.UIComponentPlugin;
import dev.mainul35.cms.sdk.annotation.UIComponent;
import dev.mainul35.cms.sdk.component.*;
import dev.mainul35.cms.sdk.component.ComponentCapabilities;
import lombok.extern.slf4j.Slf4j;

import java.util.*;

/**
 * Scrollable Container Plugin
 * Provides a scrollable container component with configurable scroll behavior.
 *
 * Features:
 * - Configurable scroll direction (vertical, horizontal, both)
 * - Custom scrollbar styling
 * - Scroll snap support for carousels
 * - Fixed height/width options
 * - Hide scrollbar option
 * - Smooth scrolling
 */
@Slf4j
@UIComponent(
    componentId = "scrollable-container",
    displayName = "Scrollable Container",
    category = "layout",
    icon = "\uD83D\uDCDC",
    resizable = true,
    defaultWidth = "100%",
    defaultHeight = "400px",
    minHeight = "100px",
    maxHeight = "2000px"
)
public class ScrollableContainerPlugin implements UIComponentPlugin {

    private PluginContext context;
    private ComponentManifest manifest;

    @Override
    public void onLoad(PluginContext context) throws Exception {
        this.context = context;
        log.info("Loading Scrollable Container Plugin");
        this.manifest = buildComponentManifest();
        log.info("Scrollable Container Plugin loaded successfully");
    }

    @Override
    public void onActivate(PluginContext context) throws Exception {
        log.info("Activating Scrollable Container Plugin");
    }

    @Override
    public void onDeactivate(PluginContext context) throws Exception {
        log.info("Deactivating Scrollable Container Plugin");
    }

    @Override
    public void onUninstall(PluginContext context) throws Exception {
        log.info("Uninstalling Scrollable Container Plugin");
    }

    @Override
    public ComponentManifest getComponentManifest() {
        return manifest;
    }

    @Override
    public String getReactComponentPath() {
        return "/components/ScrollableContainer.jsx";
    }

    @Override
    public byte[] getComponentThumbnail() {
        return null;
    }

    @Override
    public ValidationResult validateProps(Map<String, Object> props) {
        List<String> errors = new ArrayList<>();

        // Validate scroll direction
        if (props.containsKey("scrollDirection")) {
            String direction = props.get("scrollDirection").toString();
            if (!List.of("vertical", "horizontal", "both").contains(direction)) {
                errors.add("Invalid scroll direction. Must be one of: vertical, horizontal, both");
            }
        }

        // Validate height if provided
        if (props.containsKey("height")) {
            String height = props.get("height").toString();
            if (!height.equals("auto") && !height.matches("\\d+(px|rem|em|vh|%)")) {
                errors.add("Invalid height format. Use 'auto' or format like '400px', '50vh'");
            }
        }

        // Validate width if provided
        if (props.containsKey("width")) {
            String width = props.get("width").toString();
            if (!width.equals("auto") && !width.equals("100%") && !width.matches("\\d+(px|rem|em|vw|%)")) {
                errors.add("Invalid width format. Use 'auto', '100%' or format like '600px', '50vw'");
            }
        }

        return ValidationResult.builder()
                .isValid(errors.isEmpty())
                .errors(errors)
                .build();
    }

    private ComponentManifest buildComponentManifest() {
        return ComponentManifest.builder()
                .componentId("scrollable-container")
                .displayName("Scrollable Container")
                .category("layout")
                .icon("\uD83D\uDCDC")
                .description("A container with scrollable content area. Supports vertical, horizontal, or both scroll directions with customizable scrollbar.")
                .pluginId("scrollable-container-plugin")
                .pluginVersion("1.0.0")
                .reactComponentPath("/components/ScrollableContainer.jsx")
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
                        .autoHeight(false)
                        .isResizable(true)
                        .supportsTemplateBindings(false)
                        .build())
                .allowedChildTypes(null) // Allow all child types
                .build();
    }

    private Map<String, Object> buildDefaultProps() {
        Map<String, Object> props = new HashMap<>();

        // Scroll behavior
        props.put("scrollDirection", "vertical");
        props.put("smoothScroll", true);
        props.put("hideScrollbar", false);
        props.put("scrollSnapType", "none");
        props.put("scrollSnapAlign", "start");

        // Dimensions
        props.put("height", "400px");
        props.put("width", "100%");
        props.put("maxHeight", "none");
        props.put("maxWidth", "none");

        // Layout for children
        props.put("layoutType", "flex-column");
        props.put("padding", "16px");
        props.put("gap", "16px");

        // Scrollbar styling
        props.put("scrollbarWidth", "thin");
        props.put("scrollbarColor", "#888888");
        props.put("scrollbarTrackColor", "#f1f1f1");

        return props;
    }

    private Map<String, String> buildDefaultStyles() {
        Map<String, String> styles = new HashMap<>();
        styles.put("backgroundColor", "#ffffff");
        styles.put("borderRadius", "8px");
        styles.put("border", "1px solid #e0e0e0");
        styles.put("boxShadow", "0 2px 4px rgba(0,0,0,0.05)");
        return styles;
    }

    private List<PropDefinition> buildConfigurableProps() {
        List<PropDefinition> props = new ArrayList<>();

        // Scroll Direction
        props.add(PropDefinition.builder()
                .name("scrollDirection")
                .type(PropDefinition.PropType.SELECT)
                .label("Scroll Direction")
                .defaultValue("vertical")
                .options(List.of("vertical", "horizontal", "both"))
                .required(true)
                .helpText("Direction in which content can be scrolled")
                .build());

        // Height
        props.add(PropDefinition.builder()
                .name("height")
                .type(PropDefinition.PropType.STRING)
                .label("Height")
                .defaultValue("400px")
                .required(false)
                .helpText("Container height (e.g., 400px, 50vh, auto)")
                .build());

        // Width
        props.add(PropDefinition.builder()
                .name("width")
                .type(PropDefinition.PropType.STRING)
                .label("Width")
                .defaultValue("100%")
                .required(false)
                .helpText("Container width (e.g., 100%, 600px, auto)")
                .build());

        // Max Height
        props.add(PropDefinition.builder()
                .name("maxHeight")
                .type(PropDefinition.PropType.STRING)
                .label("Max Height")
                .defaultValue("none")
                .required(false)
                .helpText("Maximum height (e.g., 600px, 80vh, none)")
                .build());

        // Layout Type
        props.add(PropDefinition.builder()
                .name("layoutType")
                .type(PropDefinition.PropType.SELECT)
                .label("Content Layout")
                .defaultValue("flex-column")
                .options(List.of(
                    "flex-column",
                    "flex-row",
                    "flex-wrap",
                    "grid-2col",
                    "grid-3col",
                    "grid-auto"
                ))
                .required(false)
                .helpText("How child components are arranged inside")
                .build());

        // Padding
        props.add(PropDefinition.builder()
                .name("padding")
                .type(PropDefinition.PropType.STRING)
                .label("Padding")
                .defaultValue("16px")
                .required(false)
                .helpText("Inner padding (e.g., 16px, 1rem)")
                .build());

        // Gap
        props.add(PropDefinition.builder()
                .name("gap")
                .type(PropDefinition.PropType.STRING)
                .label("Gap Between Items")
                .defaultValue("16px")
                .required(false)
                .helpText("Space between child components")
                .build());

        // Smooth Scroll
        props.add(PropDefinition.builder()
                .name("smoothScroll")
                .type(PropDefinition.PropType.BOOLEAN)
                .label("Smooth Scrolling")
                .defaultValue(true)
                .helpText("Enable smooth scrolling behavior")
                .build());

        // Hide Scrollbar
        props.add(PropDefinition.builder()
                .name("hideScrollbar")
                .type(PropDefinition.PropType.BOOLEAN)
                .label("Hide Scrollbar")
                .defaultValue(false)
                .helpText("Hide scrollbar while keeping scroll functionality")
                .build());

        // Scroll Snap Type
        props.add(PropDefinition.builder()
                .name("scrollSnapType")
                .type(PropDefinition.PropType.SELECT)
                .label("Scroll Snap")
                .defaultValue("none")
                .options(List.of("none", "mandatory", "proximity"))
                .required(false)
                .helpText("Snap behavior for carousel-like scrolling")
                .build());

        // Scroll Snap Align
        props.add(PropDefinition.builder()
                .name("scrollSnapAlign")
                .type(PropDefinition.PropType.SELECT)
                .label("Snap Alignment")
                .defaultValue("start")
                .options(List.of("start", "center", "end"))
                .required(false)
                .helpText("Where items snap to when scroll snap is enabled")
                .build());

        // Scrollbar Width
        props.add(PropDefinition.builder()
                .name("scrollbarWidth")
                .type(PropDefinition.PropType.SELECT)
                .label("Scrollbar Width")
                .defaultValue("thin")
                .options(List.of("auto", "thin", "none"))
                .required(false)
                .helpText("Width of the scrollbar (Firefox)")
                .build());

        // Scrollbar Color
        props.add(PropDefinition.builder()
                .name("scrollbarColor")
                .type(PropDefinition.PropType.COLOR)
                .label("Scrollbar Color")
                .defaultValue("#888888")
                .required(false)
                .helpText("Color of the scrollbar thumb")
                .build());

        // Scrollbar Track Color
        props.add(PropDefinition.builder()
                .name("scrollbarTrackColor")
                .type(PropDefinition.PropType.COLOR)
                .label("Scrollbar Track Color")
                .defaultValue("#f1f1f1")
                .required(false)
                .helpText("Color of the scrollbar track")
                .build());

        return props;
    }

    private List<StyleDefinition> buildConfigurableStyles() {
        List<StyleDefinition> styles = new ArrayList<>();

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

        styles.add(StyleDefinition.builder()
                .property("border")
                .type(StyleDefinition.StyleType.BORDER)
                .label("Border")
                .defaultValue("1px solid #e0e0e0")
                .category("border")
                .build());

        styles.add(StyleDefinition.builder()
                .property("boxShadow")
                .type(StyleDefinition.StyleType.SHADOW)
                .label("Box Shadow")
                .defaultValue("0 2px 4px rgba(0,0,0,0.05)")
                .category("effects")
                .build());

        return styles;
    }

    private SizeConstraints buildSizeConstraints() {
        return SizeConstraints.builder()
                .resizable(true)
                .defaultWidth("100%")
                .defaultHeight("400px")
                .minWidth("100px")
                .maxWidth("100%")
                .minHeight("100px")
                .maxHeight("2000px")
                .heightLocked(false)
                .widthLocked(false)
                .maintainAspectRatio(false)
                .build();
    }

    @Override
    public String getPluginId() {
        return "scrollable-container-plugin";
    }

    @Override
    public String getName() {
        return "Scrollable Container";
    }

    @Override
    public String getVersion() {
        return "1.0.0";
    }

    @Override
    public String getDescription() {
        return "A scrollable container component with customizable scroll behavior and styling";
    }
}

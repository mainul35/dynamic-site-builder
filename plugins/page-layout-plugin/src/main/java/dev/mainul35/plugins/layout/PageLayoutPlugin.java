package dev.mainul35.plugins.layout;

import dev.mainul35.cms.sdk.PluginContext;
import dev.mainul35.cms.sdk.UIComponentPlugin;
import dev.mainul35.cms.sdk.annotation.UIComponent;
import dev.mainul35.cms.sdk.component.*;
import dev.mainul35.cms.sdk.component.ComponentCapabilities;
import lombok.extern.slf4j.Slf4j;

import java.util.*;

/**
 * Page Layout Plugin
 *
 * Provides a structured page layout with 5 distinct regions:
 * - Header (top, full width)
 * - Footer (bottom, full width)
 * - Left Panel (left sidebar)
 * - Right Panel (right sidebar)
 * - Center/Main Content (center area)
 *
 * The layout intelligently expands regions when optional slots are empty:
 * - If no footer: center extends to bottom
 * - If no left panel: center extends to left edge
 * - If no right panel: center extends to right edge
 * - etc.
 *
 * Slot Assignment:
 * Child components are assigned to slots via their 'slot' prop:
 * - slot: "header" - places component in header region
 * - slot: "footer" - places component in footer region
 * - slot: "left" - places component in left panel
 * - slot: "right" - places component in right panel
 * - slot: "center" (or unspecified) - places component in center/main area
 */
@Slf4j
@UIComponent(
    componentId = "PageLayout",
    displayName = "Page Layout",
    category = "layout",
    icon = "📄",
    resizable = true,
    defaultWidth = "100%"
)
public class PageLayoutPlugin implements UIComponentPlugin {

    // Slot names for the 5 regions (used by frontend renderer)
    public static final String SLOT_HEADER = "header";
    public static final String SLOT_FOOTER = "footer";
    public static final String SLOT_LEFT = "left";
    public static final String SLOT_RIGHT = "right";
    public static final String SLOT_CENTER = "center";

    // Available slots for documentation/UI purposes
    public static final List<String> AVAILABLE_SLOTS = List.of(
        SLOT_HEADER, SLOT_FOOTER, SLOT_LEFT, SLOT_RIGHT, SLOT_CENTER
    );

    // Property names
    private static final String PROP_GAP = "gap";
    private static final String PROP_SIDEBAR_RATIO = "sidebarRatio";
    private static final String PROP_FULL_HEIGHT = "fullHeight";
    private static final String PROP_STICKY_HEADER = "stickyHeader";
    private static final String PROP_STICKY_FOOTER = "stickyFooter";
    private static final String PROP_HEADER_STICKY_MODE = "headerStickyMode";
    private static final String PROP_FOOTER_STICKY_MODE = "footerStickyMode";
    private static final String PROP_HEADER_MAX_HEIGHT = "headerMaxHeight";
    private static final String PROP_FOOTER_MAX_HEIGHT = "footerMaxHeight";

    // Default values
    private static final String DEFAULT_GAP = "4px";
    private static final String DEFAULT_STICKY_MODE = "none";

    private ComponentManifest manifest;

    @Override
    public void onLoad(PluginContext context) throws Exception {
        log.info("Loading Page Layout Plugin");
        this.manifest = buildComponentManifest();
        log.info("Page Layout Plugin loaded successfully");
    }

    @Override
    public void onActivate(PluginContext context) throws Exception {
        log.info("Activating Page Layout Plugin");
    }

    @Override
    public void onDeactivate(PluginContext context) throws Exception {
        log.info("Deactivating Page Layout Plugin");
    }

    @Override
    public void onUninstall(PluginContext context) throws Exception {
        log.info("Uninstalling Page Layout Plugin");
    }

    @Override
    public ComponentManifest getComponentManifest() {
        return manifest;
    }

    @Override
    public String getReactComponentPath() {
        return "/components/PageLayout.jsx";
    }

    @Override
    public byte[] getComponentThumbnail() {
        return null;
    }

    @Override
    public ValidationResult validateProps(Map<String, Object> props) {
        List<String> errors = new ArrayList<>();
        String sizePattern = "\\d+(px|rem|em|%|vh|vw)";

        // Validate gap property if provided
        if (props.containsKey(PROP_GAP)) {
            String value = props.get(PROP_GAP).toString();
            if (!value.matches(sizePattern)) {
                errors.add("Invalid gap format. Use format like '4px', '8px', or '1rem'");
            }
        }

        return ValidationResult.builder()
                .isValid(errors.isEmpty())
                .errors(errors)
                .build();
    }

    private ComponentManifest buildComponentManifest() {
        return ComponentManifest.builder()
                .componentId("PageLayout")
                .displayName("Page Layout")
                .category("layout")
                .icon("📄")
                .description("Structured page layout with header, footer, left/right panels, and center content. Empty regions are automatically hidden and adjacent regions expand to fill the space. Drag components into regions to populate them.")
                .pluginId("page-layout-plugin")
                .pluginVersion("1.0.0")
                .reactComponentPath("/components/PageLayout.jsx")
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
                .allowedChildTypes(null) // Accept any child types
                .build();
    }

    private Map<String, Object> buildDefaultProps() {
        Map<String, Object> props = new HashMap<>();
        props.put(PROP_GAP, DEFAULT_GAP);
        props.put(PROP_SIDEBAR_RATIO, "30-70");  // 30% left, 70% center
        props.put(PROP_FULL_HEIGHT, true);
        props.put(PROP_STICKY_HEADER, false);  // Legacy, kept for backward compatibility
        props.put(PROP_STICKY_FOOTER, false);  // Legacy, kept for backward compatibility
        props.put(PROP_HEADER_STICKY_MODE, DEFAULT_STICKY_MODE);  // 'none' | 'fixed' | 'sticky'
        props.put(PROP_FOOTER_STICKY_MODE, DEFAULT_STICKY_MODE);  // 'none' | 'fixed' | 'sticky'
        // Available slots - for UI reference
        props.put("availableSlots", AVAILABLE_SLOTS);
        return props;
    }

    private Map<String, String> buildDefaultStyles() {
        Map<String, String> styles = new HashMap<>();
        styles.put("display", "grid");
        styles.put("backgroundColor", "#f8f9fa");
        return styles;
    }

    private List<PropDefinition> buildConfigurableProps() {
        List<PropDefinition> props = new ArrayList<>();

        props.add(PropDefinition.builder()
                .name(PROP_GAP)
                .type(PropDefinition.PropType.STRING)
                .label("Gap Between Regions")
                .defaultValue(DEFAULT_GAP)
                .required(false)
                .helpText("Gap between layout regions (e.g., 0px, 4px, 8px)")
                .build());

        props.add(PropDefinition.builder()
                .name(PROP_SIDEBAR_RATIO)
                .type(PropDefinition.PropType.SELECT)
                .label("Sidebar/Content Ratio")
                .defaultValue("30-70")
                .options(List.of("30-70", "35-65", "40-60", "25-75", "20-80"))
                .required(false)
                .helpText("Width ratio between left sidebar and center content (left%-center%)")
                .build());

        props.add(PropDefinition.builder()
                .name(PROP_FULL_HEIGHT)
                .type(PropDefinition.PropType.BOOLEAN)
                .label("Full Viewport Height")
                .defaultValue(true)
                .helpText("Make the layout fill the entire viewport height in preview mode")
                .build());

        props.add(PropDefinition.builder()
                .name(PROP_STICKY_HEADER)
                .type(PropDefinition.PropType.BOOLEAN)
                .label("Sticky Header (Legacy)")
                .defaultValue(false)
                .helpText("Legacy option - use Header Sticky Mode instead for more control")
                .build());

        props.add(PropDefinition.builder()
                .name(PROP_STICKY_FOOTER)
                .type(PropDefinition.PropType.BOOLEAN)
                .label("Sticky Footer (Legacy)")
                .defaultValue(false)
                .helpText("Legacy option - use Footer Sticky Mode instead for more control")
                .build());

        props.add(PropDefinition.builder()
                .name(PROP_HEADER_STICKY_MODE)
                .type(PropDefinition.PropType.SELECT)
                .label("Header Sticky Mode")
                .defaultValue(DEFAULT_STICKY_MODE)
                .options(List.of("none", "fixed", "sticky"))
                .required(false)
                .helpText("none: scrolls with content | fixed: always visible at top | sticky: scrolls then sticks at top")
                .build());

        props.add(PropDefinition.builder()
                .name(PROP_FOOTER_STICKY_MODE)
                .type(PropDefinition.PropType.SELECT)
                .label("Footer Sticky Mode")
                .defaultValue(DEFAULT_STICKY_MODE)
                .options(List.of("none", "fixed", "sticky"))
                .required(false)
                .helpText("none: at end of content | fixed: always visible at bottom | sticky: sticks when scrolling up")
                .build());

        props.add(PropDefinition.builder()
                .name(PROP_HEADER_MAX_HEIGHT)
                .type(PropDefinition.PropType.NUMBER)
                .label("Header Max Height (px)")
                .required(false)
                .helpText("If set, header becomes scrollable when content exceeds this height")
                .build());

        props.add(PropDefinition.builder()
                .name(PROP_FOOTER_MAX_HEIGHT)
                .type(PropDefinition.PropType.NUMBER)
                .label("Footer Max Height (px)")
                .required(false)
                .helpText("If set, footer becomes scrollable when content exceeds this height")
                .build());

        return props;
    }

    private List<StyleDefinition> buildConfigurableStyles() {
        List<StyleDefinition> styles = new ArrayList<>();

        styles.add(StyleDefinition.builder()
                .property("backgroundColor")
                .type(StyleDefinition.StyleType.COLOR)
                .label("Background Color")
                .defaultValue("#f5f5f5")
                .category("appearance")
                .build());

        styles.add(StyleDefinition.builder()
                .property("headerBackground")
                .type(StyleDefinition.StyleType.COLOR)
                .label("Header Background")
                .defaultValue("#ffffff")
                .category("appearance")
                .build());

        styles.add(StyleDefinition.builder()
                .property("footerBackground")
                .type(StyleDefinition.StyleType.COLOR)
                .label("Footer Background")
                .defaultValue("#ffffff")
                .category("appearance")
                .build());

        styles.add(StyleDefinition.builder()
                .property("sidebarBackground")
                .type(StyleDefinition.StyleType.COLOR)
                .label("Sidebar Background")
                .defaultValue("#ffffff")
                .category("appearance")
                .build());

        styles.add(StyleDefinition.builder()
                .property("centerBackground")
                .type(StyleDefinition.StyleType.COLOR)
                .label("Center Background")
                .defaultValue("#ffffff")
                .category("appearance")
                .build());

        return styles;
    }

    private SizeConstraints buildSizeConstraints() {
        return SizeConstraints.builder()
                .resizable(true)
                .defaultWidth("100%")
                .defaultHeight("auto")
                .minWidth("320px")
                .maxWidth("100%")
                .minHeight("400px")
                .heightLocked(false)
                .build();
    }

    @Override
    public String getPluginId() {
        return "page-layout-plugin";
    }

    @Override
    public String getName() {
        return "Page Layout";
    }

    @Override
    public String getVersion() {
        return "1.0.0";
    }

    @Override
    public String getDescription() {
        return "A structured page layout component with header, footer, left/right panels, and center content regions";
    }
}

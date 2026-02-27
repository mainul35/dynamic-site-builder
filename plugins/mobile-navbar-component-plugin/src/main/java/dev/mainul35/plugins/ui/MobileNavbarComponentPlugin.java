package dev.mainul35.plugins.ui;

import dev.mainul35.cms.sdk.PluginContext;
import dev.mainul35.cms.sdk.UIComponentPlugin;
import dev.mainul35.cms.sdk.annotation.UIComponent;
import dev.mainul35.cms.sdk.component.*;
import dev.mainul35.cms.sdk.component.ComponentCapabilities;
import lombok.extern.slf4j.Slf4j;

import java.util.*;

/**
 * Mobile Navbar Component Plugin
 * Hamburger menu button on left + navigation items stacked vertically on right.
 *
 * Structure:
 * ┌──────────────────────────────────────────┐
 * │      │   Home                            │
 * │  ☰   │   About                           │
 * │      │   Contact                         │
 * └──────────────────────────────────────────┘
 *
 * When hamburger is clicked, dispatches 'mobile-navbar-toggle' event that
 * PageLayout listens to for toggling its sidebar overlay.
 */
@Slf4j
@UIComponent(
    componentId = "MobileNavbar",
    displayName = "Mobile Navbar",
    category = "navbar",
    icon = "\u2630",
    resizable = true,
    defaultWidth = "100%",
    defaultHeight = "auto",
    minWidth = "100%",
    maxWidth = "100%",
    minHeight = "40px",
    maxHeight = "200px"
)
public class MobileNavbarComponentPlugin implements UIComponentPlugin {

    private static final String PLUGIN_ID = "mobile-navbar-component-plugin";
    private static final String PLUGIN_VERSION = "1.0.0";
    private static final String CATEGORY = "navbar";

    private PluginContext context;
    private ComponentManifest manifest;

    @Override
    public void onLoad(PluginContext context) throws Exception {
        this.context = context;
        log.info("Loading Mobile Navbar Component Plugin");
        this.manifest = buildManifest();
        log.info("Mobile Navbar Component Plugin loaded successfully");
    }

    @Override
    public void onActivate(PluginContext context) throws Exception {
        log.info("Activating Mobile Navbar Component Plugin");
    }

    @Override
    public void onDeactivate(PluginContext context) throws Exception {
        log.info("Deactivating Mobile Navbar Component Plugin");
    }

    @Override
    public void onUninstall(PluginContext context) throws Exception {
        log.info("Uninstalling Mobile Navbar Component Plugin");
    }

    @Override
    public ComponentManifest getComponentManifest() {
        return manifest;
    }

    @Override
    public String getReactComponentPath() {
        return "/renderers/MobileNavbarRenderer";
    }

    @Override
    public byte[] getComponentThumbnail() {
        return null;
    }

    @Override
    public ValidationResult validateProps(Map<String, Object> props) {
        return ValidationResult.builder()
                .isValid(true)
                .errors(new ArrayList<>())
                .build();
    }

    private ComponentManifest buildManifest() {
        Map<String, Object> defaultProps = new HashMap<>();
        // Brand props (same as other navbars)
        defaultProps.put("brandText", "My Site");
        defaultProps.put("brandImageUrl", "");
        defaultProps.put("brandLink", "/");
        defaultProps.put("logoType", "text");
        defaultProps.put("logoHeight", "32px");
        defaultProps.put("logoWidth", "auto");
        // Navigation items
        defaultProps.put("navItems", getDefaultNavItems());

        Map<String, String> defaultStyles = new HashMap<>();
        defaultStyles.put("backgroundColor", "#ffffff");
        defaultStyles.put("textColor", "#333333");
        defaultStyles.put("accentColor", "#007bff");
        defaultStyles.put("menuIconColor", "#333333");
        defaultStyles.put("fontFamily", "inherit");
        defaultStyles.put("fontSize", "14px");
        defaultStyles.put("padding", "8px 16px");

        return ComponentManifest.builder()
                .componentId("MobileNavbar")
                .displayName("Mobile Navbar")
                .category(CATEGORY)
                .icon("\u2630")
                .description("Hamburger menu on left + nav items stacked on right. Clicking hamburger toggles PageLayout sidebar.")
                .pluginId(PLUGIN_ID)
                .pluginVersion(PLUGIN_VERSION)
                .reactComponentPath("/renderers/MobileNavbarRenderer")
                .defaultProps(defaultProps)
                .defaultStyles(defaultStyles)
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
                        .supportsTemplateBindings(false)
                        .build())
                .build();
    }

    private List<Map<String, Object>> getDefaultNavItems() {
        List<Map<String, Object>> items = new ArrayList<>();
        items.add(Map.of("label", "Home", "href", "/", "active", true));
        items.add(Map.of("label", "About", "href", "/about", "active", false));
        items.add(Map.of("label", "Services", "href", "/services", "active", false));
        items.add(Map.of("label", "Contact", "href", "/contact", "active", false));
        return items;
    }

    private List<PropDefinition> buildConfigurableProps() {
        List<PropDefinition> props = new ArrayList<>();

        // Brand props (same as other navbars)
        props.add(PropDefinition.builder()
                .name("brandText")
                .type(PropDefinition.PropType.STRING)
                .label("Brand Text")
                .defaultValue("My Site")
                .required(false)
                .helpText("Text displayed as the brand/logo")
                .build());

        props.add(PropDefinition.builder()
                .name("logoType")
                .type(PropDefinition.PropType.SELECT)
                .label("Logo Type")
                .defaultValue("text")
                .options(List.of("text", "image", "both"))
                .helpText("Display text only, image only, or both")
                .build());

        props.add(PropDefinition.builder()
                .name("brandImageUrl")
                .type(PropDefinition.PropType.URL)
                .label("Brand Logo URL")
                .defaultValue("")
                .required(false)
                .helpText("URL for the brand logo image")
                .build());

        props.add(PropDefinition.builder()
                .name("logoHeight")
                .type(PropDefinition.PropType.STRING)
                .label("Logo Height")
                .defaultValue("32px")
                .required(false)
                .helpText("Height of the logo image (e.g., 32px, 2rem)")
                .build());

        props.add(PropDefinition.builder()
                .name("logoWidth")
                .type(PropDefinition.PropType.STRING)
                .label("Logo Width")
                .defaultValue("auto")
                .required(false)
                .helpText("Width of the logo image (e.g., auto, 100px)")
                .build());

        props.add(PropDefinition.builder()
                .name("brandLink")
                .type(PropDefinition.PropType.URL)
                .label("Brand Link")
                .defaultValue("/")
                .required(false)
                .helpText("URL the brand/logo links to")
                .build());

        // Navigation items - same pattern as other navbars
        props.add(PropDefinition.builder()
                .name("navItems")
                .type(PropDefinition.PropType.JSON)
                .label("Navigation Items")
                .defaultValue("[]")
                .required(false)
                .helpText("Array of navigation items with label, href, and active properties")
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
                .category("colors")
                .build());

        styles.add(StyleDefinition.builder()
                .property("textColor")
                .type(StyleDefinition.StyleType.COLOR)
                .label("Text Color")
                .defaultValue("#333333")
                .category("colors")
                .build());

        styles.add(StyleDefinition.builder()
                .property("accentColor")
                .type(StyleDefinition.StyleType.COLOR)
                .label("Accent Color")
                .defaultValue("#007bff")
                .category("colors")
                .helpText("Color for active links")
                .build());

        styles.add(StyleDefinition.builder()
                .property("menuIconColor")
                .type(StyleDefinition.StyleType.COLOR)
                .label("Menu Icon Color")
                .defaultValue("#333333")
                .category("colors")
                .build());

        styles.add(StyleDefinition.builder()
                .property("padding")
                .type(StyleDefinition.StyleType.SPACING)
                .label("Padding")
                .defaultValue("8px 16px")
                .allowedUnits(List.of("px", "rem", "em"))
                .category("spacing")
                .build());

        styles.add(StyleDefinition.builder()
                .property("fontSize")
                .type(StyleDefinition.StyleType.SIZE)
                .label("Font Size")
                .defaultValue("14px")
                .allowedUnits(List.of("px", "rem", "em"))
                .category("typography")
                .build());

        return styles;
    }

    private SizeConstraints buildSizeConstraints() {
        return SizeConstraints.builder()
                .resizable(true)
                .defaultWidth("100%")
                .defaultHeight("auto")
                .minWidth("100%")
                .maxWidth("100%")
                .minHeight("40px")
                .maxHeight("200px")
                .widthLocked(true)
                .heightLocked(false)
                .maintainAspectRatio(false)
                .build();
    }

    @Override
    public String getPluginId() {
        return PLUGIN_ID;
    }

    @Override
    public String getName() {
        return "Mobile Navbar Component";
    }

    @Override
    public String getVersion() {
        return PLUGIN_VERSION;
    }

    @Override
    public String getDescription() {
        return "Hamburger menu + navigation items for mobile view";
    }
}

package dev.mainul35.plugins.ui;

import dev.mainul35.cms.sdk.PluginContext;
import dev.mainul35.cms.sdk.UIComponentPlugin;
import dev.mainul35.cms.sdk.annotation.UIComponent;
import dev.mainul35.cms.sdk.component.*;
import lombok.extern.slf4j.Slf4j;

import java.util.*;

/**
 * Navbar Component Plugin
 * Provides multiple navigation bar variants for the visual site builder.
 *
 * Variants included:
 * - NavbarDefault: Standard horizontal navbar
 * - NavbarCentered: Centered layout navbar
 * - NavbarMinimal: Clean minimal design
 * - NavbarDark: Dark theme navbar
 * - NavbarGlass: Glassmorphism style navbar
 * - NavbarSticky: Always visible sticky header
 * - SidebarNav: Vertical sidebar navigation
 * - TopHeaderBar: Utility bar for above main nav
 */
@Slf4j
@UIComponent(
    componentId = "NavbarDefault",
    displayName = "Default Navbar",
    category = "navbar",
    icon = "🧭",
    resizable = true,
    defaultWidth = "100%",
    defaultHeight = "60px",
    minWidth = "100%",
    maxWidth = "100%",
    minHeight = "40px",
    maxHeight = "120px"
)
public class NavbarComponentPlugin implements UIComponentPlugin {

    private static final String PLUGIN_ID = "navbar-component-plugin";
    private static final String PLUGIN_VERSION = "1.0.0";
    private static final String CATEGORY = "navbar";

    private PluginContext context;
    private List<ComponentManifest> manifests;

    @Override
    public void onLoad(PluginContext context) throws Exception {
        this.context = context;
        log.info("Loading Navbar Component Plugin");

        // Build all navbar variant manifests
        this.manifests = buildAllManifests();

        log.info("Navbar Component Plugin loaded successfully with {} variants", manifests.size());
    }

    @Override
    public void onActivate(PluginContext context) throws Exception {
        log.info("Activating Navbar Component Plugin");
    }

    @Override
    public void onDeactivate(PluginContext context) throws Exception {
        log.info("Deactivating Navbar Component Plugin");
    }

    @Override
    public void onUninstall(PluginContext context) throws Exception {
        log.info("Uninstalling Navbar Component Plugin");
    }

    @Override
    public ComponentManifest getComponentManifest() {
        // Return the primary manifest (NavbarDefault)
        return manifests.isEmpty() ? null : manifests.get(0);
    }

    /**
     * Returns all navbar variant manifests for registration.
     */
    @Override
    public List<ComponentManifest> getComponentManifests() {
        return manifests;
    }

    @Override
    public String getReactComponentPath() {
        return "/renderers/NavbarDefaultRenderer";
    }

    @Override
    public byte[] getComponentThumbnail() {
        return null;
    }

    @Override
    public ValidationResult validateProps(Map<String, Object> props) {
        List<String> errors = new ArrayList<>();

        // Validate brand text length
        if (props.containsKey("brandText")) {
            Object brandText = props.get("brandText");
            if (brandText != null && brandText.toString().length() > 50) {
                errors.add("Brand text must not exceed 50 characters");
            }
        }

        // Validate layout variant
        if (props.containsKey("layout")) {
            String layout = props.get("layout").toString();
            if (!List.of("default", "centered", "split", "minimal").contains(layout)) {
                errors.add("Invalid layout. Must be one of: default, centered, split, minimal");
            }
        }

        return ValidationResult.builder()
                .isValid(errors.isEmpty())
                .errors(errors)
                .build();
    }

    // ========== Manifest Builders ==========

    private List<ComponentManifest> buildAllManifests() {
        List<ComponentManifest> list = new ArrayList<>();
        list.add(buildNavbarDefaultManifest());
        list.add(buildNavbarCenteredManifest());
        list.add(buildNavbarMinimalManifest());
        list.add(buildNavbarDarkManifest());
        list.add(buildNavbarGlassManifest());
        list.add(buildNavbarStickyManifest());
        list.add(buildSidebarNavManifest());
        list.add(buildTopHeaderBarManifest());
        return list;
    }

    /**
     * NavbarDefault - Standard horizontal navbar with brand left, links right
     */
    private ComponentManifest buildNavbarDefaultManifest() {
        Map<String, Object> defaultProps = new HashMap<>();
        defaultProps.put("brandText", "My Site");
        defaultProps.put("brandImageUrl", "");
        defaultProps.put("brandLink", "/");
        defaultProps.put("logoType", "text");
        defaultProps.put("logoHeight", "32px");
        defaultProps.put("logoWidth", "auto");
        defaultProps.put("navItems", getDefaultNavItems());
        defaultProps.put("layout", "default");
        defaultProps.put("sticky", false);
        defaultProps.put("showMobileMenu", true);
        defaultProps.put("mobileBreakpoint", "768px");

        Map<String, String> defaultStyles = new HashMap<>();
        defaultStyles.put("backgroundColor", "#ffffff");
        defaultStyles.put("textColor", "#333333");
        defaultStyles.put("accentColor", "#007bff");
        defaultStyles.put("padding", "0 20px");
        defaultStyles.put("boxShadow", "0 2px 4px rgba(0,0,0,0.1)");
        defaultStyles.put("borderBottom", "1px solid #e0e0e0");
        defaultStyles.put("fontFamily", "inherit");
        defaultStyles.put("fontSize", "16px");

        return ComponentManifest.builder()
                .componentId("NavbarDefault")
                .displayName("Default Navbar")
                .category(CATEGORY)
                .icon("🧭")
                .description("Standard horizontal navbar with brand left and navigation links right")
                .pluginId(PLUGIN_ID)
                .pluginVersion(PLUGIN_VERSION)
                .reactComponentPath("/renderers/NavbarDefaultRenderer")
                .defaultProps(defaultProps)
                .defaultStyles(defaultStyles)
                .configurableProps(buildNavbarConfigurableProps())
                .configurableStyles(buildNavbarConfigurableStyles())
                .sizeConstraints(buildNavbarSizeConstraints())
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

    /**
     * NavbarCentered - Centered layout navbar
     */
    private ComponentManifest buildNavbarCenteredManifest() {
        Map<String, Object> defaultProps = new HashMap<>();
        defaultProps.put("brandText", "My Site");
        defaultProps.put("brandImageUrl", "");
        defaultProps.put("brandLink", "/");
        defaultProps.put("logoType", "text");
        defaultProps.put("logoHeight", "32px");
        defaultProps.put("logoWidth", "auto");
        defaultProps.put("navItems", getDefaultNavItems());
        defaultProps.put("layout", "centered");
        defaultProps.put("sticky", false);
        defaultProps.put("showMobileMenu", true);
        defaultProps.put("mobileBreakpoint", "768px");

        Map<String, String> defaultStyles = new HashMap<>();
        defaultStyles.put("backgroundColor", "#ffffff");
        defaultStyles.put("textColor", "#333333");
        defaultStyles.put("accentColor", "#007bff");
        defaultStyles.put("padding", "0 20px");
        defaultStyles.put("boxShadow", "0 1px 3px rgba(0,0,0,0.08)");
        defaultStyles.put("borderBottom", "1px solid #f0f0f0");
        defaultStyles.put("fontFamily", "inherit");
        defaultStyles.put("fontSize", "16px");

        return ComponentManifest.builder()
                .componentId("NavbarCentered")
                .displayName("Centered Navbar")
                .category(CATEGORY)
                .icon("◎")
                .description("Navbar with centered brand and navigation links")
                .pluginId(PLUGIN_ID)
                .pluginVersion(PLUGIN_VERSION)
                .reactComponentPath("/renderers/NavbarCenteredRenderer")
                .defaultProps(defaultProps)
                .defaultStyles(defaultStyles)
                .configurableProps(buildNavbarConfigurableProps())
                .configurableStyles(buildNavbarConfigurableStyles())
                .sizeConstraints(buildNavbarSizeConstraints())
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

    /**
     * NavbarMinimal - Clean minimal design
     */
    private ComponentManifest buildNavbarMinimalManifest() {
        Map<String, Object> defaultProps = new HashMap<>();
        defaultProps.put("brandText", "Brand");
        defaultProps.put("brandImageUrl", "");
        defaultProps.put("brandLink", "/");
        defaultProps.put("logoType", "text");
        defaultProps.put("logoHeight", "32px");
        defaultProps.put("logoWidth", "auto");
        defaultProps.put("navItems", getMinimalNavItems());
        defaultProps.put("layout", "minimal");
        defaultProps.put("sticky", false);
        defaultProps.put("showMobileMenu", true);
        defaultProps.put("mobileBreakpoint", "768px");

        Map<String, String> defaultStyles = new HashMap<>();
        defaultStyles.put("backgroundColor", "transparent");
        defaultStyles.put("textColor", "#333333");
        defaultStyles.put("accentColor", "#000000");
        defaultStyles.put("padding", "0 16px");
        defaultStyles.put("boxShadow", "none");
        defaultStyles.put("borderBottom", "none");
        defaultStyles.put("fontFamily", "inherit");
        defaultStyles.put("fontSize", "16px");

        return ComponentManifest.builder()
                .componentId("NavbarMinimal")
                .displayName("Minimal Navbar")
                .category(CATEGORY)
                .icon("▬")
                .description("Clean minimal navbar with no shadows or borders")
                .pluginId(PLUGIN_ID)
                .pluginVersion(PLUGIN_VERSION)
                .reactComponentPath("/renderers/NavbarMinimalRenderer")
                .defaultProps(defaultProps)
                .defaultStyles(defaultStyles)
                .configurableProps(buildNavbarConfigurableProps())
                .configurableStyles(buildNavbarConfigurableStyles())
                .sizeConstraints(buildNavbarSizeConstraints())
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

    /**
     * NavbarDark - Dark theme navbar
     */
    private ComponentManifest buildNavbarDarkManifest() {
        Map<String, Object> defaultProps = new HashMap<>();
        defaultProps.put("brandText", "My Site");
        defaultProps.put("brandImageUrl", "");
        defaultProps.put("brandLink", "/");
        defaultProps.put("logoType", "text");
        defaultProps.put("logoHeight", "32px");
        defaultProps.put("logoWidth", "auto");
        defaultProps.put("navItems", getDefaultNavItems());
        defaultProps.put("layout", "default");
        defaultProps.put("sticky", false);
        defaultProps.put("showMobileMenu", true);
        defaultProps.put("mobileBreakpoint", "768px");

        Map<String, String> defaultStyles = new HashMap<>();
        defaultStyles.put("backgroundColor", "#1a1a2e");
        defaultStyles.put("textColor", "#ffffff");
        defaultStyles.put("accentColor", "#4dabf7");
        defaultStyles.put("padding", "0 24px");
        defaultStyles.put("boxShadow", "0 2px 8px rgba(0,0,0,0.3)");
        defaultStyles.put("borderBottom", "none");
        defaultStyles.put("dropdownBg", "#16213e");
        defaultStyles.put("dropdownShadow", "0 4px 16px rgba(0,0,0,0.4)");
        defaultStyles.put("fontFamily", "inherit");
        defaultStyles.put("fontSize", "16px");

        return ComponentManifest.builder()
                .componentId("NavbarDark")
                .displayName("Dark Navbar")
                .category(CATEGORY)
                .icon("🌙")
                .description("Dark theme navbar with light text")
                .pluginId(PLUGIN_ID)
                .pluginVersion(PLUGIN_VERSION)
                .reactComponentPath("/renderers/NavbarDarkRenderer")
                .defaultProps(defaultProps)
                .defaultStyles(defaultStyles)
                .configurableProps(buildNavbarConfigurableProps())
                .configurableStyles(buildNavbarConfigurableStyles())
                .sizeConstraints(buildNavbarSizeConstraints())
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

    /**
     * NavbarGlass - Glassmorphism style navbar
     */
    private ComponentManifest buildNavbarGlassManifest() {
        Map<String, Object> defaultProps = new HashMap<>();
        defaultProps.put("brandText", "My Site");
        defaultProps.put("brandImageUrl", "");
        defaultProps.put("brandLink", "/");
        defaultProps.put("logoType", "text");
        defaultProps.put("logoHeight", "32px");
        defaultProps.put("logoWidth", "auto");
        defaultProps.put("navItems", getDefaultNavItems());
        defaultProps.put("layout", "default");
        defaultProps.put("sticky", true);
        defaultProps.put("showMobileMenu", true);
        defaultProps.put("mobileBreakpoint", "768px");

        Map<String, String> defaultStyles = new HashMap<>();
        defaultStyles.put("backgroundColor", "rgba(255, 255, 255, 0.8)");
        defaultStyles.put("textColor", "#333333");
        defaultStyles.put("accentColor", "#6366f1");
        defaultStyles.put("padding", "0 24px");
        defaultStyles.put("boxShadow", "0 4px 30px rgba(0, 0, 0, 0.1)");
        defaultStyles.put("borderBottom", "1px solid rgba(255, 255, 255, 0.3)");
        defaultStyles.put("backdropFilter", "blur(10px)");
        defaultStyles.put("WebkitBackdropFilter", "blur(10px)");
        defaultStyles.put("fontFamily", "inherit");
        defaultStyles.put("fontSize", "16px");

        return ComponentManifest.builder()
                .componentId("NavbarGlass")
                .displayName("Glass Navbar")
                .category(CATEGORY)
                .icon("💎")
                .description("Glassmorphism style navbar with blur effect")
                .pluginId(PLUGIN_ID)
                .pluginVersion(PLUGIN_VERSION)
                .reactComponentPath("/renderers/NavbarGlassRenderer")
                .defaultProps(defaultProps)
                .defaultStyles(defaultStyles)
                .configurableProps(buildNavbarConfigurableProps())
                .configurableStyles(buildNavbarConfigurableStyles())
                .sizeConstraints(buildNavbarSizeConstraints())
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

    /**
     * NavbarSticky - Always visible sticky header
     */
    private ComponentManifest buildNavbarStickyManifest() {
        Map<String, Object> defaultProps = new HashMap<>();
        defaultProps.put("brandText", "My Site");
        defaultProps.put("brandImageUrl", "");
        defaultProps.put("brandLink", "/");
        defaultProps.put("logoType", "text");
        defaultProps.put("logoHeight", "32px");
        defaultProps.put("logoWidth", "auto");
        defaultProps.put("navItems", getDefaultNavItems());
        defaultProps.put("layout", "default");
        defaultProps.put("sticky", true);
        defaultProps.put("showMobileMenu", true);
        defaultProps.put("mobileBreakpoint", "768px");

        Map<String, String> defaultStyles = new HashMap<>();
        defaultStyles.put("backgroundColor", "#ffffff");
        defaultStyles.put("textColor", "#333333");
        defaultStyles.put("accentColor", "#007bff");
        defaultStyles.put("padding", "0 20px");
        defaultStyles.put("boxShadow", "0 2px 10px rgba(0,0,0,0.15)");
        defaultStyles.put("borderBottom", "none");
        defaultStyles.put("fontFamily", "inherit");
        defaultStyles.put("fontSize", "16px");

        return ComponentManifest.builder()
                .componentId("NavbarSticky")
                .displayName("Sticky Navbar")
                .category(CATEGORY)
                .icon("📌")
                .description("Always visible navbar that sticks to the top when scrolling")
                .pluginId(PLUGIN_ID)
                .pluginVersion(PLUGIN_VERSION)
                .reactComponentPath("/renderers/NavbarStickyRenderer")
                .defaultProps(defaultProps)
                .defaultStyles(defaultStyles)
                .configurableProps(buildNavbarConfigurableProps())
                .configurableStyles(buildNavbarConfigurableStyles())
                .sizeConstraints(buildNavbarSizeConstraints())
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

    /**
     * SidebarNav - Vertical sidebar navigation
     */
    private ComponentManifest buildSidebarNavManifest() {
        Map<String, Object> defaultProps = new HashMap<>();
        defaultProps.put("brandText", "Menu");
        defaultProps.put("brandImageUrl", "");
        defaultProps.put("brandLink", "/");
        defaultProps.put("navItems", getSidebarNavItems());
        defaultProps.put("collapsed", false);
        defaultProps.put("collapsible", true);
        defaultProps.put("position", "left");
        defaultProps.put("showIcons", true);

        Map<String, String> defaultStyles = new HashMap<>();
        defaultStyles.put("backgroundColor", "#2c3e50");
        defaultStyles.put("textColor", "#ecf0f1");
        defaultStyles.put("accentColor", "#3498db");
        defaultStyles.put("width", "250px");
        defaultStyles.put("collapsedWidth", "60px");
        defaultStyles.put("padding", "20px 0");
        defaultStyles.put("boxShadow", "2px 0 10px rgba(0,0,0,0.1)");
        defaultStyles.put("fontFamily", "inherit");
        defaultStyles.put("fontSize", "14px");

        return ComponentManifest.builder()
                .componentId("SidebarNav")
                .displayName("Sidebar Navigation")
                .category(CATEGORY)
                .icon("📋")
                .description("Vertical sidebar navigation with collapsible option")
                .pluginId(PLUGIN_ID)
                .pluginVersion(PLUGIN_VERSION)
                .reactComponentPath("/renderers/SidebarNavRenderer")
                .defaultProps(defaultProps)
                .defaultStyles(defaultStyles)
                .configurableProps(buildSidebarConfigurableProps())
                .configurableStyles(buildSidebarConfigurableStyles())
                .sizeConstraints(buildSidebarSizeConstraints())
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

    /**
     * TopHeaderBar - Utility bar for above main navigation
     */
    private ComponentManifest buildTopHeaderBarManifest() {
        Map<String, Object> defaultProps = new HashMap<>();
        defaultProps.put("leftContent", "📧 contact@example.com");
        defaultProps.put("rightContent", "📞 +1 234 567 890");
        defaultProps.put("centerContent", "");
        defaultProps.put("showSocialLinks", true);
        defaultProps.put("socialLinks", getDefaultSocialLinks());

        Map<String, String> defaultStyles = new HashMap<>();
        defaultStyles.put("backgroundColor", "#f8f9fa");
        defaultStyles.put("textColor", "#666666");
        defaultStyles.put("accentColor", "#007bff");
        defaultStyles.put("padding", "8px 20px");
        defaultStyles.put("borderBottom", "1px solid #e9ecef");
        defaultStyles.put("fontFamily", "inherit");
        defaultStyles.put("fontSize", "13px");

        return ComponentManifest.builder()
                .componentId("TopHeaderBar")
                .displayName("Top Header Bar")
                .category(CATEGORY)
                .icon("📢")
                .description("Utility bar for contact info, social links above main navigation")
                .pluginId(PLUGIN_ID)
                .pluginVersion(PLUGIN_VERSION)
                .reactComponentPath("/renderers/TopHeaderBarRenderer")
                .defaultProps(defaultProps)
                .defaultStyles(defaultStyles)
                .configurableProps(buildTopHeaderConfigurableProps())
                .configurableStyles(buildTopHeaderConfigurableStyles())
                .sizeConstraints(buildTopHeaderSizeConstraints())
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

    // ========== Helper Methods for Default Values ==========

    private List<Map<String, Object>> getDefaultNavItems() {
        List<Map<String, Object>> items = new ArrayList<>();
        items.add(Map.of("label", "Home", "href", "/", "active", true));
        items.add(Map.of("label", "About", "href", "/about", "active", false));
        items.add(Map.of("label", "Services", "href", "#", "active", false, "children", List.of(
                Map.of("label", "Web Development", "href", "/services/web"),
                Map.of("label", "Mobile Apps", "href", "/services/mobile"),
                Map.of("label", "Consulting", "href", "/services/consulting")
        )));
        items.add(Map.of("label", "Contact", "href", "/contact", "active", false));
        return items;
    }

    private List<Map<String, Object>> getMinimalNavItems() {
        List<Map<String, Object>> items = new ArrayList<>();
        items.add(Map.of("label", "Home", "href", "/", "active", true));
        items.add(Map.of("label", "Work", "href", "/work", "active", false));
        items.add(Map.of("label", "Contact", "href", "/contact", "active", false));
        return items;
    }

    private List<Map<String, Object>> getSidebarNavItems() {
        List<Map<String, Object>> items = new ArrayList<>();
        items.add(Map.of("label", "Dashboard", "href", "/dashboard", "icon", "🏠", "active", true));
        items.add(Map.of("label", "Analytics", "href", "/analytics", "icon", "📊", "active", false));
        items.add(Map.of("label", "Projects", "href", "/projects", "icon", "📁", "active", false));
        items.add(Map.of("label", "Settings", "href", "/settings", "icon", "⚙️", "active", false));
        return items;
    }

    private List<Map<String, Object>> getDefaultSocialLinks() {
        List<Map<String, Object>> links = new ArrayList<>();
        links.add(Map.of("platform", "facebook", "url", "#", "icon", "📘"));
        links.add(Map.of("platform", "twitter", "url", "#", "icon", "🐦"));
        links.add(Map.of("platform", "linkedin", "url", "#", "icon", "💼"));
        return links;
    }

    // ========== Configurable Props Builders ==========

    private List<PropDefinition> buildNavbarConfigurableProps() {
        List<PropDefinition> props = new ArrayList<>();

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
                .label("Logo Image URL")
                .defaultValue("")
                .required(false)
                .helpText("URL for the brand logo image (required when Logo Type is 'image' or 'both')")
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

        props.add(PropDefinition.builder()
                .name("navItems")
                .type(PropDefinition.PropType.JSON)
                .label("Navigation Items")
                .defaultValue("[]")
                .required(false)
                .helpText("JSON array of navigation items with nested children support")
                .build());

        props.add(PropDefinition.builder()
                .name("layout")
                .type(PropDefinition.PropType.SELECT)
                .label("Layout")
                .defaultValue("default")
                .options(List.of("default", "centered", "split", "minimal"))
                .helpText("Navbar layout variant")
                .build());

        props.add(PropDefinition.builder()
                .name("sticky")
                .type(PropDefinition.PropType.BOOLEAN)
                .label("Sticky Header")
                .defaultValue(false)
                .helpText("Fix navbar to top of viewport when scrolling")
                .build());

        props.add(PropDefinition.builder()
                .name("showMobileMenu")
                .type(PropDefinition.PropType.BOOLEAN)
                .label("Show Mobile Menu")
                .defaultValue(true)
                .helpText("Show hamburger menu on mobile devices")
                .build());

        props.add(PropDefinition.builder()
                .name("mobileBreakpoint")
                .type(PropDefinition.PropType.SELECT)
                .label("Mobile Breakpoint")
                .defaultValue("768px")
                .options(List.of("576px", "768px", "992px", "1024px"))
                .helpText("Screen width below which mobile menu appears")
                .build());

        return props;
    }

    private List<PropDefinition> buildSidebarConfigurableProps() {
        List<PropDefinition> props = new ArrayList<>();

        props.add(PropDefinition.builder()
                .name("brandText")
                .type(PropDefinition.PropType.STRING)
                .label("Title Text")
                .defaultValue("Menu")
                .required(false)
                .helpText("Text displayed at the top of sidebar")
                .build());

        props.add(PropDefinition.builder()
                .name("navItems")
                .type(PropDefinition.PropType.JSON)
                .label("Navigation Items")
                .defaultValue("[]")
                .required(false)
                .helpText("JSON array of navigation items with icons")
                .build());

        props.add(PropDefinition.builder()
                .name("collapsed")
                .type(PropDefinition.PropType.BOOLEAN)
                .label("Start Collapsed")
                .defaultValue(false)
                .helpText("Start sidebar in collapsed state")
                .build());

        props.add(PropDefinition.builder()
                .name("collapsible")
                .type(PropDefinition.PropType.BOOLEAN)
                .label("Collapsible")
                .defaultValue(true)
                .helpText("Allow sidebar to be collapsed")
                .build());

        props.add(PropDefinition.builder()
                .name("position")
                .type(PropDefinition.PropType.SELECT)
                .label("Position")
                .defaultValue("left")
                .options(List.of("left", "right"))
                .helpText("Sidebar position")
                .build());

        props.add(PropDefinition.builder()
                .name("showIcons")
                .type(PropDefinition.PropType.BOOLEAN)
                .label("Show Icons")
                .defaultValue(true)
                .helpText("Display icons next to menu items")
                .build());

        return props;
    }

    private List<PropDefinition> buildTopHeaderConfigurableProps() {
        List<PropDefinition> props = new ArrayList<>();

        props.add(PropDefinition.builder()
                .name("leftContent")
                .type(PropDefinition.PropType.STRING)
                .label("Left Content")
                .defaultValue("📧 contact@example.com")
                .required(false)
                .helpText("Content for the left side (e.g., email)")
                .build());

        props.add(PropDefinition.builder()
                .name("rightContent")
                .type(PropDefinition.PropType.STRING)
                .label("Right Content")
                .defaultValue("📞 +1 234 567 890")
                .required(false)
                .helpText("Content for the right side (e.g., phone)")
                .build());

        props.add(PropDefinition.builder()
                .name("centerContent")
                .type(PropDefinition.PropType.STRING)
                .label("Center Content")
                .defaultValue("")
                .required(false)
                .helpText("Content for the center (e.g., announcement)")
                .build());

        props.add(PropDefinition.builder()
                .name("showSocialLinks")
                .type(PropDefinition.PropType.BOOLEAN)
                .label("Show Social Links")
                .defaultValue(true)
                .helpText("Display social media icons")
                .build());

        props.add(PropDefinition.builder()
                .name("socialLinks")
                .type(PropDefinition.PropType.JSON)
                .label("Social Links")
                .defaultValue("[]")
                .required(false)
                .helpText("JSON array of social media links")
                .build());

        return props;
    }

    // ========== Configurable Styles Builders ==========

    private List<StyleDefinition> buildNavbarConfigurableStyles() {
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
                .helpText("Color for active links and hover states")
                .build());

        styles.add(StyleDefinition.builder()
                .property("padding")
                .type(StyleDefinition.StyleType.SPACING)
                .label("Padding")
                .defaultValue("0 20px")
                .allowedUnits(List.of("px", "rem", "em"))
                .category("spacing")
                .build());

        styles.add(StyleDefinition.builder()
                .property("boxShadow")
                .type(StyleDefinition.StyleType.SHADOW)
                .label("Box Shadow")
                .defaultValue("0 2px 4px rgba(0,0,0,0.1)")
                .category("effects")
                .build());

        styles.add(StyleDefinition.builder()
                .property("borderBottom")
                .type(StyleDefinition.StyleType.BORDER)
                .label("Border Bottom")
                .defaultValue("1px solid #e0e0e0")
                .category("border")
                .build());

        styles.add(StyleDefinition.builder()
                .property("fontSize")
                .type(StyleDefinition.StyleType.SIZE)
                .label("Font Size")
                .defaultValue("16px")
                .allowedUnits(List.of("px", "rem", "em"))
                .category("text")
                .build());

        return styles;
    }

    private List<StyleDefinition> buildSidebarConfigurableStyles() {
        List<StyleDefinition> styles = new ArrayList<>();

        styles.add(StyleDefinition.builder()
                .property("backgroundColor")
                .type(StyleDefinition.StyleType.COLOR)
                .label("Background Color")
                .defaultValue("#2c3e50")
                .category("colors")
                .build());

        styles.add(StyleDefinition.builder()
                .property("textColor")
                .type(StyleDefinition.StyleType.COLOR)
                .label("Text Color")
                .defaultValue("#ecf0f1")
                .category("colors")
                .build());

        styles.add(StyleDefinition.builder()
                .property("accentColor")
                .type(StyleDefinition.StyleType.COLOR)
                .label("Accent Color")
                .defaultValue("#3498db")
                .category("colors")
                .build());

        styles.add(StyleDefinition.builder()
                .property("width")
                .type(StyleDefinition.StyleType.SIZE)
                .label("Width")
                .defaultValue("250px")
                .allowedUnits(List.of("px", "rem", "%"))
                .category("layout")
                .build());

        styles.add(StyleDefinition.builder()
                .property("collapsedWidth")
                .type(StyleDefinition.StyleType.SIZE)
                .label("Collapsed Width")
                .defaultValue("60px")
                .allowedUnits(List.of("px", "rem"))
                .category("layout")
                .build());

        return styles;
    }

    private List<StyleDefinition> buildTopHeaderConfigurableStyles() {
        List<StyleDefinition> styles = new ArrayList<>();

        styles.add(StyleDefinition.builder()
                .property("backgroundColor")
                .type(StyleDefinition.StyleType.COLOR)
                .label("Background Color")
                .defaultValue("#f8f9fa")
                .category("colors")
                .build());

        styles.add(StyleDefinition.builder()
                .property("textColor")
                .type(StyleDefinition.StyleType.COLOR)
                .label("Text Color")
                .defaultValue("#666666")
                .category("colors")
                .build());

        styles.add(StyleDefinition.builder()
                .property("accentColor")
                .type(StyleDefinition.StyleType.COLOR)
                .label("Link Color")
                .defaultValue("#007bff")
                .category("colors")
                .build());

        styles.add(StyleDefinition.builder()
                .property("padding")
                .type(StyleDefinition.StyleType.SPACING)
                .label("Padding")
                .defaultValue("8px 20px")
                .allowedUnits(List.of("px", "rem", "em"))
                .category("spacing")
                .build());

        styles.add(StyleDefinition.builder()
                .property("fontSize")
                .type(StyleDefinition.StyleType.SIZE)
                .label("Font Size")
                .defaultValue("13px")
                .allowedUnits(List.of("px", "rem", "em"))
                .category("text")
                .build());

        return styles;
    }

    // ========== Size Constraints Builders ==========

    private SizeConstraints buildNavbarSizeConstraints() {
        return SizeConstraints.builder()
                .resizable(true)
                .defaultWidth("100%")
                .defaultHeight("60px")
                .minWidth("100%")
                .maxWidth("100%")
                .minHeight("40px")
                .maxHeight("120px")
                .widthLocked(true)
                .heightLocked(false)
                .maintainAspectRatio(false)
                .build();
    }

    private SizeConstraints buildSidebarSizeConstraints() {
        return SizeConstraints.builder()
                .resizable(true)
                .defaultWidth("250px")
                .defaultHeight("100%")
                .minWidth("60px")
                .maxWidth("400px")
                .minHeight("100%")
                .maxHeight("100%")
                .widthLocked(false)
                .heightLocked(true)
                .maintainAspectRatio(false)
                .build();
    }

    private SizeConstraints buildTopHeaderSizeConstraints() {
        return SizeConstraints.builder()
                .resizable(true)
                .defaultWidth("100%")
                .defaultHeight("36px")
                .minWidth("100%")
                .maxWidth("100%")
                .minHeight("24px")
                .maxHeight("60px")
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
        return "Navbar Component";
    }

    @Override
    public String getVersion() {
        return PLUGIN_VERSION;
    }

    @Override
    public String getDescription() {
        return "Navigation bar components with multiple variants for the visual site builder";
    }
}

package dev.mainul35.flashcardapp.sitebuilder.service;

import dev.mainul35.cms.sdk.component.ComponentManifest;
import dev.mainul35.cms.sdk.component.PropDefinition;
import dev.mainul35.cms.sdk.component.SizeConstraints;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Initializes built-in navbar component variants on application startup.
 * These components use the navbar-component-plugin for rendering but are
 * registered as separate component entries in the registry.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class BuiltInNavbarComponentInitializer {

    private final ComponentRegistryService componentRegistryService;

    private static final String PLUGIN_ID = "navbar-component-plugin";
    private static final String CATEGORY = "navbar";

    @PostConstruct
    public void initializeNavbarComponents() {
        log.info("Initializing built-in navbar component variants...");

        List<ComponentManifest> navbarManifests = createNavbarManifests();

        for (ComponentManifest manifest : navbarManifests) {
            try {
                if (!componentRegistryService.isComponentRegistered(manifest.getPluginId(), manifest.getComponentId())) {
                    componentRegistryService.registerComponent(manifest);
                    log.info("Registered navbar component: {}", manifest.getComponentId());
                } else {
                    log.debug("Navbar component already registered: {}", manifest.getComponentId());
                }
            } catch (Exception e) {
                log.error("Failed to register navbar component: {}", manifest.getComponentId(), e);
            }
        }

        log.info("Navbar component initialization complete");
    }

    private List<ComponentManifest> createNavbarManifests() {
        return Arrays.asList(
                createNavbarCenteredManifest(),
                createNavbarMinimalManifest(),
                createNavbarDarkManifest(),
                createNavbarGlassManifest(),
                createNavbarStickyManifest(),
                createSidebarNavManifest(),
                createTopHeaderBarManifest()
        );
    }

    private List<PropDefinition> createNavbarConfigurableProps() {
        return Arrays.asList(
                PropDefinition.builder()
                        .name("brandText")
                        .type(PropDefinition.PropType.STRING)
                        .label("Brand Text")
                        .defaultValue("My Site")
                        .helpText("Text displayed as the brand/logo (leave empty to use image only)")
                        .build(),
                PropDefinition.builder()
                        .name("brandImageUrl")
                        .type(PropDefinition.PropType.URL)
                        .label("Brand Logo URL")
                        .defaultValue("")
                        .helpText("URL for the brand logo image")
                        .build(),
                PropDefinition.builder()
                        .name("brandLink")
                        .type(PropDefinition.PropType.URL)
                        .label("Brand Link")
                        .defaultValue("/")
                        .helpText("URL the brand/logo links to")
                        .build(),
                PropDefinition.builder()
                        .name("navItems")
                        .type(PropDefinition.PropType.JSON)
                        .label("Navigation Items")
                        .defaultValue("[]")
                        .helpText("JSON array of navigation items with nested children support")
                        .build(),
                PropDefinition.builder()
                        .name("sticky")
                        .type(PropDefinition.PropType.BOOLEAN)
                        .label("Sticky Header")
                        .defaultValue(false)
                        .helpText("Fix navbar to top of viewport when scrolling")
                        .build(),
                PropDefinition.builder()
                        .name("showMobileMenu")
                        .type(PropDefinition.PropType.BOOLEAN)
                        .label("Show Mobile Menu")
                        .defaultValue(true)
                        .helpText("Show hamburger menu on mobile devices")
                        .build()
        );
    }

    private SizeConstraints createNavbarSizeConstraints() {
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
                .build();
    }

    private Map<String, Object> createDefaultProps(String layout) {
        Map<String, Object> props = new HashMap<>();
        props.put("brandText", "My Site");
        props.put("brandImageUrl", "");
        props.put("brandLink", "/");
        props.put("layout", layout);
        props.put("sticky", false);
        props.put("showMobileMenu", true);
        props.put("mobileBreakpoint", "768px");
        props.put("navItems", Arrays.asList(
                Map.of("label", "Home", "href", "/", "active", true),
                Map.of("label", "About", "href", "/about", "active", false),
                Map.of("label", "Services", "href", "#", "active", false),
                Map.of("label", "Contact", "href", "/contact", "active", false)
        ));
        return props;
    }

    private Map<String, String> createDefaultStyles(String bgColor, String textColor, String accentColor) {
        Map<String, String> styles = new HashMap<>();
        styles.put("backgroundColor", bgColor);
        styles.put("textColor", textColor);
        styles.put("accentColor", accentColor);
        return styles;
    }

    private ComponentManifest createNavbarCenteredManifest() {
        return ComponentManifest.builder()
                .componentId("NavbarCentered")
                .displayName("Centered Navbar")
                .category(CATEGORY)
                .icon("◎")
                .description("Navbar with centered brand and navigation links")
                .defaultProps(createDefaultProps("centered"))
                .defaultStyles(createDefaultStyles("#ffffff", "#333333", "#007bff"))
                .reactComponentPath("/renderers/NavbarCenteredRenderer")
                .configurableProps(createNavbarConfigurableProps())
                .sizeConstraints(createNavbarSizeConstraints())
                .pluginId(PLUGIN_ID)
                .pluginVersion("1.0.0")
                .canHaveChildren(false)
                .build();
    }

    private ComponentManifest createNavbarMinimalManifest() {
        return ComponentManifest.builder()
                .componentId("NavbarMinimal")
                .displayName("Minimal Navbar")
                .category(CATEGORY)
                .icon("━")
                .description("Minimalist navbar with clean styling")
                .defaultProps(createDefaultProps("minimal"))
                .defaultStyles(createDefaultStyles("transparent", "#333333", "#007bff"))
                .reactComponentPath("/renderers/NavbarMinimalRenderer")
                .configurableProps(createNavbarConfigurableProps())
                .sizeConstraints(createNavbarSizeConstraints())
                .pluginId(PLUGIN_ID)
                .pluginVersion("1.0.0")
                .canHaveChildren(false)
                .build();
    }

    private ComponentManifest createNavbarDarkManifest() {
        return ComponentManifest.builder()
                .componentId("NavbarDark")
                .displayName("Dark Navbar")
                .category(CATEGORY)
                .icon("🌙")
                .description("Dark themed navbar")
                .defaultProps(createDefaultProps("default"))
                .defaultStyles(createDefaultStyles("#1a1a2e", "#ffffff", "#4dabf7"))
                .reactComponentPath("/renderers/NavbarDarkRenderer")
                .configurableProps(createNavbarConfigurableProps())
                .sizeConstraints(createNavbarSizeConstraints())
                .pluginId(PLUGIN_ID)
                .pluginVersion("1.0.0")
                .canHaveChildren(false)
                .build();
    }

    private ComponentManifest createNavbarGlassManifest() {
        Map<String, String> glassStyles = createDefaultStyles("rgba(255, 255, 255, 0.7)", "#333333", "#007bff");
        glassStyles.put("backdropFilter", "blur(10px)");

        return ComponentManifest.builder()
                .componentId("NavbarGlass")
                .displayName("Glass Navbar")
                .category(CATEGORY)
                .icon("💎")
                .description("Glassmorphism styled navbar with blur effect")
                .defaultProps(createDefaultProps("default"))
                .defaultStyles(glassStyles)
                .reactComponentPath("/renderers/NavbarGlassRenderer")
                .configurableProps(createNavbarConfigurableProps())
                .sizeConstraints(createNavbarSizeConstraints())
                .pluginId(PLUGIN_ID)
                .pluginVersion("1.0.0")
                .canHaveChildren(false)
                .build();
    }

    private ComponentManifest createNavbarStickyManifest() {
        Map<String, Object> stickyProps = createDefaultProps("default");
        stickyProps.put("sticky", true);

        Map<String, String> stickyStyles = createDefaultStyles("#ffffff", "#333333", "#007bff");
        stickyStyles.put("boxShadow", "0 2px 4px rgba(0,0,0,0.1)");

        return ComponentManifest.builder()
                .componentId("NavbarSticky")
                .displayName("Sticky Navbar")
                .category(CATEGORY)
                .icon("📌")
                .description("Sticky navbar that stays at the top when scrolling")
                .defaultProps(stickyProps)
                .defaultStyles(stickyStyles)
                .reactComponentPath("/renderers/NavbarStickyRenderer")
                .configurableProps(createNavbarConfigurableProps())
                .sizeConstraints(createNavbarSizeConstraints())
                .pluginId(PLUGIN_ID)
                .pluginVersion("1.0.0")
                .canHaveChildren(false)
                .build();
    }

    private ComponentManifest createSidebarNavManifest() {
        Map<String, Object> sidebarProps = new HashMap<>();
        sidebarProps.put("brandText", "My Site");
        sidebarProps.put("brandImageUrl", "");
        sidebarProps.put("brandLink", "/");
        sidebarProps.put("collapsed", false);
        sidebarProps.put("collapsible", true);
        sidebarProps.put("navItems", Arrays.asList(
                Map.of("label", "Home", "href", "/", "active", true),
                Map.of("label", "About", "href", "/about", "active", false),
                Map.of("label", "Services", "href", "/services", "active", false),
                Map.of("label", "Contact", "href", "/contact", "active", false)
        ));

        Map<String, String> sidebarStyles = new HashMap<>();
        sidebarStyles.put("backgroundColor", "#f8f9fa");
        sidebarStyles.put("textColor", "#333333");
        sidebarStyles.put("accentColor", "#007bff");
        sidebarStyles.put("width", "250px");

        SizeConstraints sidebarSizeConstraints = SizeConstraints.builder()
                .resizable(true)
                .defaultWidth("250px")
                .defaultHeight("100%")
                .minWidth("200px")
                .maxWidth("400px")
                .minHeight("400px")
                .maxHeight("100%")
                .widthLocked(false)
                .heightLocked(true)
                .build();

        return ComponentManifest.builder()
                .componentId("SidebarNav")
                .displayName("Sidebar Navigation")
                .category(CATEGORY)
                .icon("📋")
                .description("Vertical sidebar navigation menu")
                .defaultProps(sidebarProps)
                .defaultStyles(sidebarStyles)
                .reactComponentPath("/renderers/SidebarNavRenderer")
                .configurableProps(createNavbarConfigurableProps())
                .sizeConstraints(sidebarSizeConstraints)
                .pluginId(PLUGIN_ID)
                .pluginVersion("1.0.0")
                .canHaveChildren(false)
                .build();
    }

    private ComponentManifest createTopHeaderBarManifest() {
        Map<String, Object> headerProps = new HashMap<>();
        headerProps.put("leftText", "Welcome to our site!");
        headerProps.put("rightText", "Contact: info@example.com");
        headerProps.put("showSocialIcons", true);
        headerProps.put("socialLinks", Arrays.asList(
                Map.of("platform", "facebook", "url", "https://facebook.com"),
                Map.of("platform", "twitter", "url", "https://twitter.com"),
                Map.of("platform", "linkedin", "url", "https://linkedin.com")
        ));

        Map<String, String> headerStyles = new HashMap<>();
        headerStyles.put("backgroundColor", "#333333");
        headerStyles.put("textColor", "#ffffff");
        headerStyles.put("fontSize", "12px");
        headerStyles.put("padding", "8px 20px");

        SizeConstraints headerBarSizeConstraints = SizeConstraints.builder()
                .resizable(true)
                .defaultWidth("100%")
                .defaultHeight("36px")
                .minWidth("100%")
                .maxWidth("100%")
                .minHeight("28px")
                .maxHeight("60px")
                .widthLocked(true)
                .heightLocked(false)
                .build();

        List<PropDefinition> headerBarProps = Arrays.asList(
                PropDefinition.builder()
                        .name("leftText")
                        .type(PropDefinition.PropType.STRING)
                        .label("Left Text")
                        .defaultValue("Welcome to our site!")
                        .helpText("Text displayed on the left side")
                        .build(),
                PropDefinition.builder()
                        .name("rightText")
                        .type(PropDefinition.PropType.STRING)
                        .label("Right Text")
                        .defaultValue("Contact: info@example.com")
                        .helpText("Text displayed on the right side")
                        .build(),
                PropDefinition.builder()
                        .name("showSocialIcons")
                        .type(PropDefinition.PropType.BOOLEAN)
                        .label("Show Social Icons")
                        .defaultValue(true)
                        .helpText("Display social media icons")
                        .build(),
                PropDefinition.builder()
                        .name("socialLinks")
                        .type(PropDefinition.PropType.JSON)
                        .label("Social Links")
                        .defaultValue("[]")
                        .helpText("JSON array of social links with platform and url")
                        .build()
        );

        return ComponentManifest.builder()
                .componentId("TopHeaderBar")
                .displayName("Top Header Bar")
                .category(CATEGORY)
                .icon("📢")
                .description("Slim header bar for contact info and social links")
                .defaultProps(headerProps)
                .defaultStyles(headerStyles)
                .reactComponentPath("/renderers/TopHeaderBarRenderer")
                .configurableProps(headerBarProps)
                .sizeConstraints(headerBarSizeConstraints)
                .pluginId(PLUGIN_ID)
                .pluginVersion("1.0.0")
                .canHaveChildren(false)
                .build();
    }
}

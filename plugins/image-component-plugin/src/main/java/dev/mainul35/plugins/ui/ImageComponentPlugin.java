package dev.mainul35.plugins.ui;

import dev.mainul35.cms.sdk.PluginContext;
import dev.mainul35.cms.sdk.UIComponentPlugin;
import dev.mainul35.cms.sdk.annotation.UIComponent;
import dev.mainul35.cms.sdk.component.*;
import dev.mainul35.cms.sdk.component.ComponentCapabilities;
import lombok.extern.slf4j.Slf4j;

import java.util.*;

/**
 * Image Component Plugin
 * Provides an image component with placeholder support and various display options
 */
@Slf4j
@UIComponent(
    componentId = "Image",
    displayName = "Image",
    category = "ui",
    icon = "\uD83D\uDDBC\uFE0F",
    resizable = true,
    defaultWidth = "300px",
    defaultHeight = "200px"
)
public class ImageComponentPlugin implements UIComponentPlugin {

    private static final String PLUGIN_ID = "image-component-plugin";
    private static final String PLUGIN_VERSION = "1.0.0";

    private ComponentManifest manifest;

    @Override
    public void onLoad(PluginContext context) throws Exception {
        log.info("Loading Image Component Plugin");
        this.manifest = buildComponentManifest();
        log.info("Image Component Plugin loaded successfully");
    }

    @Override
    public void onActivate(PluginContext context) throws Exception {
        log.info("Activating Image Component Plugin");
    }

    @Override
    public void onDeactivate(PluginContext context) throws Exception {
        log.info("Deactivating Image Component Plugin");
    }

    @Override
    public void onUninstall(PluginContext context) throws Exception {
        log.info("Uninstalling Image Component Plugin");
    }

    @Override
    public ComponentManifest getComponentManifest() {
        return manifest;
    }

    @Override
    public String getReactComponentPath() {
        return "/renderers/ImageRenderer";
    }

    @Override
    public byte[] getComponentThumbnail() {
        return null;
    }

    @Override
    public ValidationResult validateProps(Map<String, Object> props) {
        List<String> errors = new ArrayList<>();

        if (props.containsKey("src")) {
            String src = props.get("src").toString();
            if (src != null && !src.isEmpty() && !src.startsWith("http") && !src.startsWith("/") && !src.startsWith("data:")) {
                errors.add("Invalid image URL format");
            }
        }

        return ValidationResult.builder()
                .isValid(errors.isEmpty())
                .errors(errors)
                .build();
    }

    private ComponentManifest buildComponentManifest() {
        return ComponentManifest.builder()
                .componentId("Image")
                .displayName("Image")
                .category("ui")
                .icon("\uD83D\uDDBC\uFE0F")
                .description("Display images with customizable sizing, fit options, and placeholder support")
                .pluginId(PLUGIN_ID)
                .pluginVersion(PLUGIN_VERSION)
                .reactComponentPath("/renderers/ImageRenderer")
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
                        .supportsTemplateBindings(false)
                        .build())
                .build();
    }

    private Map<String, Object> buildDefaultProps() {
        Map<String, Object> props = new HashMap<>();
        props.put("src", "");
        props.put("alt", "Image");
        props.put("objectFit", "cover");
        props.put("objectPosition", "center");
        props.put("aspectRatio", "auto");
        props.put("borderRadius", "0px");
        props.put("placeholder", "icon");
        props.put("placeholderColor", "#e9ecef");
        props.put("caption", "");
        props.put("showCaption", false);
        props.put("lazyLoad", true);
        return props;
    }

    private Map<String, String> buildDefaultStyles() {
        Map<String, String> styles = new HashMap<>();
        styles.put("width", "100%");
        styles.put("height", "100%");
        return styles;
    }

    private List<PropDefinition> buildConfigurableProps() {
        List<PropDefinition> props = new ArrayList<>();

        props.add(PropDefinition.builder()
                .name("src")
                .type(PropDefinition.PropType.URL)
                .label("Image URL")
                .defaultValue("")
                .required(false)
                .helpText("URL of the image to display")
                .build());

        props.add(PropDefinition.builder()
                .name("alt")
                .type(PropDefinition.PropType.STRING)
                .label("Alt Text")
                .defaultValue("Image")
                .required(false)
                .helpText("Alternative text for accessibility")
                .build());

        props.add(PropDefinition.builder()
                .name("aspectRatio")
                .type(PropDefinition.PropType.SELECT)
                .label("Aspect Ratio")
                .defaultValue("auto")
                .options(List.of("auto", "1:1", "4:3", "16:9", "3:2", "2:3", "3:4", "9:16", "circle"))
                .helpText("Fixed aspect ratio for the image")
                .build());

        props.add(PropDefinition.builder()
                .name("objectFit")
                .type(PropDefinition.PropType.SELECT)
                .label("Object Fit")
                .defaultValue("cover")
                .options(List.of("cover", "contain", "fill", "none", "scale-down"))
                .helpText("How the image should fit within its container")
                .build());

        props.add(PropDefinition.builder()
                .name("objectPosition")
                .type(PropDefinition.PropType.SELECT)
                .label("Object Position")
                .defaultValue("center")
                .options(List.of("center", "top", "bottom", "left", "right", "top left", "top right", "bottom left", "bottom right"))
                .helpText("Position of the image within its container")
                .build());

        props.add(PropDefinition.builder()
                .name("borderRadius")
                .type(PropDefinition.PropType.STRING)
                .label("Border Radius")
                .defaultValue("0px")
                .helpText("Rounded corners (e.g., 8px, 50%)")
                .build());

        props.add(PropDefinition.builder()
                .name("placeholder")
                .type(PropDefinition.PropType.SELECT)
                .label("Placeholder Type")
                .defaultValue("icon")
                .options(List.of("icon", "color"))
                .helpText("What to show when image is loading or missing")
                .build());

        props.add(PropDefinition.builder()
                .name("placeholderColor")
                .type(PropDefinition.PropType.COLOR)
                .label("Placeholder Color")
                .defaultValue("#e9ecef")
                .helpText("Background color for placeholder")
                .build());

        props.add(PropDefinition.builder()
                .name("caption")
                .type(PropDefinition.PropType.STRING)
                .label("Caption")
                .defaultValue("")
                .helpText("Caption text below the image")
                .build());

        props.add(PropDefinition.builder()
                .name("showCaption")
                .type(PropDefinition.PropType.BOOLEAN)
                .label("Show Caption")
                .defaultValue(false)
                .helpText("Display the caption below the image")
                .build());

        props.add(PropDefinition.builder()
                .name("lazyLoad")
                .type(PropDefinition.PropType.BOOLEAN)
                .label("Lazy Load")
                .defaultValue(true)
                .helpText("Load image only when visible in viewport")
                .build());

        return props;
    }

    private List<StyleDefinition> buildConfigurableStyles() {
        List<StyleDefinition> styles = new ArrayList<>();

        styles.add(StyleDefinition.builder()
                .property("width")
                .type(StyleDefinition.StyleType.SIZE)
                .label("Width")
                .defaultValue("100%")
                .allowedUnits(List.of("px", "%", "auto"))
                .category("size")
                .build());

        styles.add(StyleDefinition.builder()
                .property("height")
                .type(StyleDefinition.StyleType.SIZE)
                .label("Height")
                .defaultValue("auto")
                .allowedUnits(List.of("px", "%", "auto"))
                .category("size")
                .build());

        return styles;
    }

    private SizeConstraints buildSizeConstraints() {
        return SizeConstraints.builder()
                .resizable(true)
                .defaultWidth("300px")
                .defaultHeight("200px")
                .minWidth("50px")
                .maxWidth("2000px")
                .minHeight("50px")
                .maxHeight("2000px")
                .maintainAspectRatio(true)
                .build();
    }

    @Override
    public String getPluginId() {
        return PLUGIN_ID;
    }

    @Override
    public String getName() {
        return "Image Component";
    }

    @Override
    public String getVersion() {
        return PLUGIN_VERSION;
    }

    @Override
    public String getDescription() {
        return "Image component with placeholder support and various display options";
    }
}

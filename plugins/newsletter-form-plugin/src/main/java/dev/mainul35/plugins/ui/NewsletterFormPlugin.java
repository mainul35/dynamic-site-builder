package dev.mainul35.plugins.ui;

import dev.mainul35.cms.sdk.Plugin;
import dev.mainul35.cms.sdk.PluginContext;
import dev.mainul35.cms.sdk.UIComponentPlugin;
import dev.mainul35.cms.sdk.annotation.UIComponent;
import dev.mainul35.cms.sdk.component.*;
import dev.mainul35.cms.sdk.component.ComponentCapabilities;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Newsletter Form Plugin
 * A composite component that combines Label, Textbox, and Button to create
 * a newsletter subscription form.
 */
@UIComponent(
    componentId = "NewsletterForm",
    displayName = "Newsletter Form",
    category = "form",
    icon = "mail",
    resizable = true,
    defaultWidth = "400px",
    defaultHeight = "auto",
    minWidth = "280px",
    maxWidth = "800px",
    minHeight = "120px",
    maxHeight = "500px"
)
public class NewsletterFormPlugin implements UIComponentPlugin {

    private static final Logger log = LoggerFactory.getLogger(NewsletterFormPlugin.class);

    private PluginContext context;
    private ComponentManifest manifest;

    @Override
    public void onLoad(PluginContext context) throws Exception {
        this.context = context;
        log.info("Loading Newsletter Form Plugin");

        // Build component manifest
        this.manifest = buildComponentManifest();

        log.info("Newsletter Form Plugin loaded successfully");
    }

    @Override
    public void onActivate(PluginContext context) throws Exception {
        log.info("Activating Newsletter Form Plugin");
    }

    @Override
    public void onDeactivate(PluginContext context) throws Exception {
        log.info("Deactivating Newsletter Form Plugin");
    }

    @Override
    public void onUninstall(PluginContext context) throws Exception {
        log.info("Uninstalling Newsletter Form Plugin");
    }

    @Override
    public ComponentManifest getComponentManifest() {
        return manifest;
    }

    @Override
    public String getReactComponentPath() {
        return "/components/NewsletterForm.jsx";
    }

    @Override
    public byte[] getComponentThumbnail() {
        return null;
    }

    @Override
    public ValidationResult validateProps(Map<String, Object> props) {
        List<String> errors = new ArrayList<>();

        // Validate title
        if (props.containsKey("title")) {
            Object title = props.get("title");
            if (title != null && title.toString().length() > 200) {
                errors.add("Title must not exceed 200 characters");
            }
        }

        // Validate subtitle
        if (props.containsKey("subtitle")) {
            Object subtitle = props.get("subtitle");
            if (subtitle != null && subtitle.toString().length() > 500) {
                errors.add("Subtitle must not exceed 500 characters");
            }
        }

        // Validate button text
        if (props.containsKey("buttonText")) {
            Object buttonText = props.get("buttonText");
            if (buttonText != null && buttonText.toString().length() > 50) {
                errors.add("Button text must not exceed 50 characters");
            }
        }

        // Validate layout
        if (props.containsKey("layout")) {
            String layout = props.get("layout").toString();
            if (!List.of("stacked", "inline", "compact").contains(layout)) {
                errors.add("Invalid layout. Must be one of: stacked, inline, compact");
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
                .componentId("NewsletterForm")
                .displayName("Newsletter Form")
                .category("form")
                .icon("mail")
                .description("A newsletter subscription form with email input and subscribe button")
                .pluginId("newsletter-form-plugin")
                .pluginVersion("1.0.0")
                .reactComponentPath("/components/NewsletterForm.jsx")
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

    /**
     * Default props
     */
    private Map<String, Object> buildDefaultProps() {
        Map<String, Object> props = new HashMap<>();
        props.put("title", "Subscribe to Our Newsletter");
        props.put("subtitle", "Get the latest updates delivered to your inbox.");
        props.put("placeholder", "Enter your email address");
        props.put("buttonText", "Subscribe");
        props.put("buttonVariant", "primary");
        props.put("layout", "stacked");
        props.put("showTitle", true);
        props.put("showSubtitle", true);
        props.put("successMessage", "Thank you for subscribing!");
        props.put("errorMessage", "Please enter a valid email address.");
        return props;
    }

    /**
     * Default styles
     */
    private Map<String, String> buildDefaultStyles() {
        Map<String, String> styles = new HashMap<>();
        styles.put("backgroundColor", "#f8f9fa");
        styles.put("padding", "24px");
        styles.put("borderRadius", "8px");
        styles.put("textAlign", "center");
        return styles;
    }

    /**
     * Configurable properties
     */
    private List<PropDefinition> buildConfigurableProps() {
        List<PropDefinition> props = new ArrayList<>();

        // Title property
        props.add(PropDefinition.builder()
                .name("title")
                .type(PropDefinition.PropType.STRING)
                .label("Title")
                .defaultValue("Subscribe to Our Newsletter")
                .required(false)
                .helpText("The heading text for the newsletter form")
                .build());

        // Show title toggle
        props.add(PropDefinition.builder()
                .name("showTitle")
                .type(PropDefinition.PropType.BOOLEAN)
                .label("Show Title")
                .defaultValue(true)
                .helpText("Toggle visibility of the title")
                .build());

        // Subtitle property
        props.add(PropDefinition.builder()
                .name("subtitle")
                .type(PropDefinition.PropType.STRING)
                .label("Subtitle")
                .defaultValue("Get the latest updates delivered to your inbox.")
                .required(false)
                .helpText("The description text below the title")
                .build());

        // Show subtitle toggle
        props.add(PropDefinition.builder()
                .name("showSubtitle")
                .type(PropDefinition.PropType.BOOLEAN)
                .label("Show Subtitle")
                .defaultValue(true)
                .helpText("Toggle visibility of the subtitle")
                .build());

        // Placeholder property
        props.add(PropDefinition.builder()
                .name("placeholder")
                .type(PropDefinition.PropType.STRING)
                .label("Input Placeholder")
                .defaultValue("Enter your email address")
                .required(false)
                .helpText("Placeholder text for the email input field")
                .build());

        // Button text property
        props.add(PropDefinition.builder()
                .name("buttonText")
                .type(PropDefinition.PropType.STRING)
                .label("Button Text")
                .defaultValue("Subscribe")
                .required(true)
                .helpText("Text displayed on the subscribe button")
                .build());

        // Button variant property
        props.add(PropDefinition.builder()
                .name("buttonVariant")
                .type(PropDefinition.PropType.SELECT)
                .label("Button Style")
                .defaultValue("primary")
                .options(List.of("primary", "secondary", "success", "danger", "warning", "outline"))
                .helpText("Visual style of the subscribe button")
                .build());

        // Layout property
        props.add(PropDefinition.builder()
                .name("layout")
                .type(PropDefinition.PropType.SELECT)
                .label("Layout")
                .defaultValue("stacked")
                .options(List.of("stacked", "inline", "compact"))
                .helpText("Layout arrangement of form elements")
                .build());

        // Success message property
        props.add(PropDefinition.builder()
                .name("successMessage")
                .type(PropDefinition.PropType.STRING)
                .label("Success Message")
                .defaultValue("Thank you for subscribing!")
                .required(false)
                .helpText("Message shown after successful subscription")
                .build());

        // Error message property
        props.add(PropDefinition.builder()
                .name("errorMessage")
                .type(PropDefinition.PropType.STRING)
                .label("Error Message")
                .defaultValue("Please enter a valid email address.")
                .required(false)
                .helpText("Message shown when email validation fails")
                .build());

        return props;
    }

    /**
     * Configurable styles
     */
    private List<StyleDefinition> buildConfigurableStyles() {
        List<StyleDefinition> styles = new ArrayList<>();

        // Background color
        styles.add(StyleDefinition.builder()
                .property("backgroundColor")
                .type(StyleDefinition.StyleType.COLOR)
                .label("Background Color")
                .defaultValue("#f8f9fa")
                .category("background")
                .build());

        // Padding
        styles.add(StyleDefinition.builder()
                .property("padding")
                .type(StyleDefinition.StyleType.SIZE)
                .label("Padding")
                .defaultValue("24px")
                .allowedUnits(List.of("px", "rem", "em"))
                .category("spacing")
                .build());

        // Border radius
        styles.add(StyleDefinition.builder()
                .property("borderRadius")
                .type(StyleDefinition.StyleType.SIZE)
                .label("Border Radius")
                .defaultValue("8px")
                .allowedUnits(List.of("px", "rem", "%"))
                .category("border")
                .build());

        // Title color
        styles.add(StyleDefinition.builder()
                .property("titleColor")
                .type(StyleDefinition.StyleType.COLOR)
                .label("Title Color")
                .defaultValue("#333333")
                .category("text")
                .build());

        // Subtitle color
        styles.add(StyleDefinition.builder()
                .property("subtitleColor")
                .type(StyleDefinition.StyleType.COLOR)
                .label("Subtitle Color")
                .defaultValue("#666666")
                .category("text")
                .build());

        // Button color
        styles.add(StyleDefinition.builder()
                .property("buttonColor")
                .type(StyleDefinition.StyleType.COLOR)
                .label("Button Color")
                .defaultValue("#007bff")
                .category("button")
                .build());

        return styles;
    }

    /**
     * Size constraints
     */
    private SizeConstraints buildSizeConstraints() {
        return SizeConstraints.builder()
                .resizable(true)
                .defaultWidth("400px")
                .defaultHeight("auto")
                .minWidth("280px")
                .maxWidth("100%")
                .minHeight("120px")
                .maxHeight("500px")
                .widthLocked(false)
                .heightLocked(false)
                .maintainAspectRatio(false)
                .build();
    }

    @Override
    public String getPluginId() {
        return "newsletter-form-plugin";
    }

    @Override
    public String getName() {
        return "Newsletter Form";
    }

    @Override
    public String getVersion() {
        return "1.0.0";
    }

    @Override
    public String getDescription() {
        return "A newsletter subscription form composed of Label, Textbox, and Button components";
    }
}

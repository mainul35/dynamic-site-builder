package dev.mainul35.plugins.auth;

import dev.mainul35.cms.sdk.PluginContext;
import dev.mainul35.cms.sdk.UIComponentPlugin;
import dev.mainul35.cms.sdk.annotation.UIComponent;
import dev.mainul35.cms.sdk.component.*;
import lombok.extern.slf4j.Slf4j;

import java.util.*;

/**
 * Auth Component Plugin
 * Provides authentication UI components: LoginForm, RegisterForm, SocialLoginButtons,
 * ForgotPasswordForm, and LogoutButton.
 *
 * Components can access user info via AuthenticationContext available in template variables:
 * - {{auth.isAuthenticated}} - boolean
 * - {{auth.user.id}} - user ID
 * - {{auth.user.username}} - username
 * - {{auth.user.email}} - email
 * - {{auth.user.displayName}} - display name
 * - {{auth.user.avatarUrl}} - avatar URL
 * - {{auth.user.roles}} - array of roles
 */
@Slf4j
@UIComponent(
    componentId = "LoginForm",
    displayName = "Login Form",
    category = "form",
    icon = "\uD83D\uDD10",
    resizable = true,
    defaultWidth = "400px",
    defaultHeight = "auto"
)
public class AuthComponentPlugin implements UIComponentPlugin {

    private static final String PLUGIN_ID = "auth-component-plugin";
    private static final String PLUGIN_VERSION = "1.0.0";

    private List<ComponentManifest> manifests;

    @Override
    public void onLoad(PluginContext context) throws Exception {
        log.info("Loading Auth Component Plugin");
        this.manifests = buildAllComponentManifests();
        log.info("Auth Component Plugin loaded with {} components", manifests.size());
    }

    @Override
    public void onActivate(PluginContext context) throws Exception {
        log.info("Activating Auth Component Plugin");
    }

    @Override
    public void onDeactivate(PluginContext context) throws Exception {
        log.info("Deactivating Auth Component Plugin");
    }

    @Override
    public void onUninstall(PluginContext context) throws Exception {
        log.info("Uninstalling Auth Component Plugin");
    }

    @Override
    public ComponentManifest getComponentManifest() {
        return manifests.get(0); // LoginForm as primary
    }

    /**
     * Get all component manifests provided by this plugin.
     */
    @Override
    public List<ComponentManifest> getComponentManifests() {
        return manifests;
    }

    @Override
    public String getReactComponentPath() {
        return "/renderers/LoginFormRenderer";
    }

    @Override
    public byte[] getComponentThumbnail() {
        return null;
    }

    @Override
    public ValidationResult validateProps(Map<String, Object> props) {
        return ValidationResult.builder()
                .isValid(true)
                .errors(List.of())
                .build();
    }

    private List<ComponentManifest> buildAllComponentManifests() {
        return List.of(
            buildLoginFormManifest(),
            buildRegisterFormManifest(),
            buildSocialLoginButtonsManifest(),
            buildForgotPasswordFormManifest(),
            buildLogoutButtonManifest()
        );
    }

    // ==================== LOGIN FORM ====================
    private ComponentManifest buildLoginFormManifest() {
        return ComponentManifest.builder()
                .componentId("LoginForm")
                .displayName("Login Form")
                .category("form")
                .icon("\uD83D\uDD10")
                .description("Username/password login form with configurable fields and styling")
                .pluginId(PLUGIN_ID)
                .pluginVersion(PLUGIN_VERSION)
                .reactComponentPath("/renderers/LoginFormRenderer")
                .defaultProps(buildLoginFormDefaultProps())
                .defaultStyles(buildLoginFormDefaultStyles())
                .configurableProps(buildLoginFormConfigurableProps())
                .configurableStyles(buildFormConfigurableStyles())
                .sizeConstraints(buildFormSizeConstraints())
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

    private Map<String, Object> buildLoginFormDefaultProps() {
        Map<String, Object> props = new HashMap<>();
        props.put("title", "Sign In");
        props.put("subtitle", "Welcome back! Please sign in to continue.");
        props.put("usernameLabel", "Email or Username");
        props.put("usernamePlaceholder", "Enter your email or username");
        props.put("passwordLabel", "Password");
        props.put("passwordPlaceholder", "Enter your password");
        props.put("submitButtonText", "Sign In");
        props.put("showRememberMe", true);
        props.put("rememberMeLabel", "Remember me");
        props.put("showForgotPassword", true);
        props.put("forgotPasswordText", "Forgot password?");
        props.put("forgotPasswordUrl", "/forgot-password");
        props.put("showRegisterLink", true);
        props.put("registerText", "Don't have an account?");
        props.put("registerLinkText", "Sign up");
        props.put("registerUrl", "/register");
        props.put("loginEndpoint", "/api/auth/login");
        props.put("redirectUrl", "/");
        props.put("showSocialLogin", false);
        return props;
    }

    private Map<String, String> buildLoginFormDefaultStyles() {
        Map<String, String> styles = new HashMap<>();
        styles.put("backgroundColor", "#ffffff");
        styles.put("borderRadius", "12px");
        styles.put("padding", "32px");
        styles.put("boxShadow", "0 4px 6px rgba(0, 0, 0, 0.1)");
        styles.put("maxWidth", "400px");
        return styles;
    }

    private List<PropDefinition> buildLoginFormConfigurableProps() {
        List<PropDefinition> props = new ArrayList<>();

        props.add(PropDefinition.builder()
                .name("title")
                .type(PropDefinition.PropType.STRING)
                .label("Title")
                .defaultValue("Sign In")
                .helpText("Form title text")
                .build());

        props.add(PropDefinition.builder()
                .name("subtitle")
                .type(PropDefinition.PropType.STRING)
                .label("Subtitle")
                .defaultValue("Welcome back! Please sign in to continue.")
                .helpText("Subtitle text below the title")
                .build());

        props.add(PropDefinition.builder()
                .name("usernameLabel")
                .type(PropDefinition.PropType.STRING)
                .label("Username Label")
                .defaultValue("Email or Username")
                .build());

        props.add(PropDefinition.builder()
                .name("passwordLabel")
                .type(PropDefinition.PropType.STRING)
                .label("Password Label")
                .defaultValue("Password")
                .build());

        props.add(PropDefinition.builder()
                .name("submitButtonText")
                .type(PropDefinition.PropType.STRING)
                .label("Submit Button Text")
                .defaultValue("Sign In")
                .build());

        props.add(PropDefinition.builder()
                .name("showRememberMe")
                .type(PropDefinition.PropType.BOOLEAN)
                .label("Show Remember Me")
                .defaultValue(true)
                .build());

        props.add(PropDefinition.builder()
                .name("showForgotPassword")
                .type(PropDefinition.PropType.BOOLEAN)
                .label("Show Forgot Password Link")
                .defaultValue(true)
                .build());

        props.add(PropDefinition.builder()
                .name("forgotPasswordUrl")
                .type(PropDefinition.PropType.STRING)
                .label("Forgot Password URL")
                .defaultValue("/forgot-password")
                .build());

        props.add(PropDefinition.builder()
                .name("showRegisterLink")
                .type(PropDefinition.PropType.BOOLEAN)
                .label("Show Register Link")
                .defaultValue(true)
                .build());

        props.add(PropDefinition.builder()
                .name("registerUrl")
                .type(PropDefinition.PropType.STRING)
                .label("Register URL")
                .defaultValue("/register")
                .build());

        props.add(PropDefinition.builder()
                .name("loginEndpoint")
                .type(PropDefinition.PropType.STRING)
                .label("Login API Endpoint")
                .defaultValue("/api/auth/login")
                .helpText("Backend endpoint for login")
                .build());

        props.add(PropDefinition.builder()
                .name("redirectUrl")
                .type(PropDefinition.PropType.STRING)
                .label("Redirect After Login")
                .defaultValue("/")
                .helpText("URL to redirect after successful login")
                .build());

        props.add(PropDefinition.builder()
                .name("showSocialLogin")
                .type(PropDefinition.PropType.BOOLEAN)
                .label("Show Social Login")
                .defaultValue(false)
                .helpText("Display social login buttons below form")
                .build());

        return props;
    }

    // ==================== REGISTER FORM ====================
    private ComponentManifest buildRegisterFormManifest() {
        return ComponentManifest.builder()
                .componentId("RegisterForm")
                .displayName("Register Form")
                .category("form")
                .icon("\uD83D\uDCDD")
                .description("User registration form with configurable fields")
                .pluginId(PLUGIN_ID)
                .pluginVersion(PLUGIN_VERSION)
                .reactComponentPath("/renderers/RegisterFormRenderer")
                .defaultProps(buildRegisterFormDefaultProps())
                .defaultStyles(buildLoginFormDefaultStyles())
                .configurableProps(buildRegisterFormConfigurableProps())
                .configurableStyles(buildFormConfigurableStyles())
                .sizeConstraints(buildFormSizeConstraints())
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

    private Map<String, Object> buildRegisterFormDefaultProps() {
        Map<String, Object> props = new HashMap<>();
        props.put("title", "Create Account");
        props.put("subtitle", "Join us today! Create your account to get started.");
        props.put("showFullName", true);
        props.put("fullNameLabel", "Full Name");
        props.put("emailLabel", "Email");
        props.put("usernameLabel", "Username");
        props.put("showUsername", true);
        props.put("passwordLabel", "Password");
        props.put("showConfirmPassword", true);
        props.put("confirmPasswordLabel", "Confirm Password");
        props.put("submitButtonText", "Create Account");
        props.put("showTermsCheckbox", true);
        props.put("termsText", "I agree to the");
        props.put("termsLinkText", "Terms of Service");
        props.put("termsUrl", "/terms");
        props.put("showLoginLink", true);
        props.put("loginText", "Already have an account?");
        props.put("loginLinkText", "Sign in");
        props.put("loginUrl", "/login");
        props.put("registerEndpoint", "/api/auth/register");
        props.put("redirectUrl", "/login");
        props.put("passwordMinLength", 8);
        props.put("requireUppercase", true);
        props.put("requireNumber", true);
        props.put("requireSpecialChar", false);
        return props;
    }

    private List<PropDefinition> buildRegisterFormConfigurableProps() {
        List<PropDefinition> props = new ArrayList<>();

        props.add(PropDefinition.builder()
                .name("title")
                .type(PropDefinition.PropType.STRING)
                .label("Title")
                .defaultValue("Create Account")
                .build());

        props.add(PropDefinition.builder()
                .name("subtitle")
                .type(PropDefinition.PropType.STRING)
                .label("Subtitle")
                .defaultValue("Join us today!")
                .build());

        props.add(PropDefinition.builder()
                .name("showFullName")
                .type(PropDefinition.PropType.BOOLEAN)
                .label("Show Full Name Field")
                .defaultValue(true)
                .build());

        props.add(PropDefinition.builder()
                .name("showUsername")
                .type(PropDefinition.PropType.BOOLEAN)
                .label("Show Username Field")
                .defaultValue(true)
                .build());

        props.add(PropDefinition.builder()
                .name("showConfirmPassword")
                .type(PropDefinition.PropType.BOOLEAN)
                .label("Show Confirm Password")
                .defaultValue(true)
                .build());

        props.add(PropDefinition.builder()
                .name("submitButtonText")
                .type(PropDefinition.PropType.STRING)
                .label("Submit Button Text")
                .defaultValue("Create Account")
                .build());

        props.add(PropDefinition.builder()
                .name("showTermsCheckbox")
                .type(PropDefinition.PropType.BOOLEAN)
                .label("Show Terms Checkbox")
                .defaultValue(true)
                .build());

        props.add(PropDefinition.builder()
                .name("termsUrl")
                .type(PropDefinition.PropType.STRING)
                .label("Terms URL")
                .defaultValue("/terms")
                .build());

        props.add(PropDefinition.builder()
                .name("showLoginLink")
                .type(PropDefinition.PropType.BOOLEAN)
                .label("Show Login Link")
                .defaultValue(true)
                .build());

        props.add(PropDefinition.builder()
                .name("loginUrl")
                .type(PropDefinition.PropType.STRING)
                .label("Login URL")
                .defaultValue("/login")
                .build());

        props.add(PropDefinition.builder()
                .name("registerEndpoint")
                .type(PropDefinition.PropType.STRING)
                .label("Register API Endpoint")
                .defaultValue("/api/auth/register")
                .build());

        props.add(PropDefinition.builder()
                .name("redirectUrl")
                .type(PropDefinition.PropType.STRING)
                .label("Redirect After Register")
                .defaultValue("/login")
                .build());

        props.add(PropDefinition.builder()
                .name("passwordMinLength")
                .type(PropDefinition.PropType.NUMBER)
                .label("Min Password Length")
                .defaultValue(8)
                .build());

        props.add(PropDefinition.builder()
                .name("requireUppercase")
                .type(PropDefinition.PropType.BOOLEAN)
                .label("Require Uppercase")
                .defaultValue(true)
                .build());

        props.add(PropDefinition.builder()
                .name("requireNumber")
                .type(PropDefinition.PropType.BOOLEAN)
                .label("Require Number")
                .defaultValue(true)
                .build());

        props.add(PropDefinition.builder()
                .name("requireSpecialChar")
                .type(PropDefinition.PropType.BOOLEAN)
                .label("Require Special Character")
                .defaultValue(false)
                .build());

        return props;
    }

    // ==================== SOCIAL LOGIN BUTTONS ====================
    private ComponentManifest buildSocialLoginButtonsManifest() {
        return ComponentManifest.builder()
                .componentId("SocialLoginButtons")
                .displayName("Social Login Buttons")
                .category("form")
                .icon("\uD83C\uDF10")
                .description("Social login buttons for Google, GitHub, Facebook, etc.")
                .pluginId(PLUGIN_ID)
                .pluginVersion(PLUGIN_VERSION)
                .reactComponentPath("/renderers/SocialLoginButtonsRenderer")
                .defaultProps(buildSocialLoginDefaultProps())
                .defaultStyles(buildSocialLoginDefaultStyles())
                .configurableProps(buildSocialLoginConfigurableProps())
                .configurableStyles(buildFormConfigurableStyles())
                .sizeConstraints(buildButtonSizeConstraints())
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

    private Map<String, Object> buildSocialLoginDefaultProps() {
        Map<String, Object> props = new HashMap<>();
        props.put("showGoogle", true);
        props.put("showGithub", true);
        props.put("showFacebook", false);
        props.put("showTwitter", false);
        props.put("showLinkedIn", false);
        props.put("showApple", false);
        props.put("showMicrosoft", false);
        props.put("layout", "vertical");
        props.put("buttonStyle", "filled");
        props.put("showIcon", true);
        props.put("showLabel", true);
        props.put("googleText", "Continue with Google");
        props.put("githubText", "Continue with GitHub");
        props.put("facebookText", "Continue with Facebook");
        props.put("twitterText", "Continue with Twitter");
        props.put("linkedinText", "Continue with LinkedIn");
        props.put("appleText", "Continue with Apple");
        props.put("microsoftText", "Continue with Microsoft");
        props.put("dividerText", "or continue with");
        props.put("showDivider", true);
        props.put("googleAuthUrl", "/oauth2/authorization/google");
        props.put("githubAuthUrl", "/oauth2/authorization/github");
        props.put("facebookAuthUrl", "/oauth2/authorization/facebook");
        props.put("twitterAuthUrl", "/oauth2/authorization/twitter");
        props.put("linkedinAuthUrl", "/oauth2/authorization/linkedin");
        props.put("appleAuthUrl", "/oauth2/authorization/apple");
        props.put("microsoftAuthUrl", "/oauth2/authorization/microsoft");
        return props;
    }

    private Map<String, String> buildSocialLoginDefaultStyles() {
        Map<String, String> styles = new HashMap<>();
        styles.put("gap", "12px");
        styles.put("width", "100%");
        return styles;
    }

    private List<PropDefinition> buildSocialLoginConfigurableProps() {
        List<PropDefinition> props = new ArrayList<>();

        props.add(PropDefinition.builder()
                .name("showGoogle")
                .type(PropDefinition.PropType.BOOLEAN)
                .label("Show Google")
                .defaultValue(true)
                .build());

        props.add(PropDefinition.builder()
                .name("showGithub")
                .type(PropDefinition.PropType.BOOLEAN)
                .label("Show GitHub")
                .defaultValue(true)
                .build());

        props.add(PropDefinition.builder()
                .name("showFacebook")
                .type(PropDefinition.PropType.BOOLEAN)
                .label("Show Facebook")
                .defaultValue(false)
                .build());

        props.add(PropDefinition.builder()
                .name("showTwitter")
                .type(PropDefinition.PropType.BOOLEAN)
                .label("Show Twitter/X")
                .defaultValue(false)
                .build());

        props.add(PropDefinition.builder()
                .name("showLinkedIn")
                .type(PropDefinition.PropType.BOOLEAN)
                .label("Show LinkedIn")
                .defaultValue(false)
                .build());

        props.add(PropDefinition.builder()
                .name("showApple")
                .type(PropDefinition.PropType.BOOLEAN)
                .label("Show Apple")
                .defaultValue(false)
                .build());

        props.add(PropDefinition.builder()
                .name("showMicrosoft")
                .type(PropDefinition.PropType.BOOLEAN)
                .label("Show Microsoft")
                .defaultValue(false)
                .build());

        props.add(PropDefinition.builder()
                .name("layout")
                .type(PropDefinition.PropType.SELECT)
                .label("Layout")
                .defaultValue("vertical")
                .options(List.of("vertical", "horizontal", "grid"))
                .build());

        props.add(PropDefinition.builder()
                .name("buttonStyle")
                .type(PropDefinition.PropType.SELECT)
                .label("Button Style")
                .defaultValue("filled")
                .options(List.of("filled", "outlined", "icon-only"))
                .build());

        props.add(PropDefinition.builder()
                .name("showIcon")
                .type(PropDefinition.PropType.BOOLEAN)
                .label("Show Icons")
                .defaultValue(true)
                .build());

        props.add(PropDefinition.builder()
                .name("showLabel")
                .type(PropDefinition.PropType.BOOLEAN)
                .label("Show Labels")
                .defaultValue(true)
                .build());

        props.add(PropDefinition.builder()
                .name("showDivider")
                .type(PropDefinition.PropType.BOOLEAN)
                .label("Show Divider")
                .defaultValue(true)
                .helpText("Show 'or continue with' divider above buttons")
                .build());

        props.add(PropDefinition.builder()
                .name("dividerText")
                .type(PropDefinition.PropType.STRING)
                .label("Divider Text")
                .defaultValue("or continue with")
                .build());

        return props;
    }

    // ==================== FORGOT PASSWORD FORM ====================
    private ComponentManifest buildForgotPasswordFormManifest() {
        return ComponentManifest.builder()
                .componentId("ForgotPasswordForm")
                .displayName("Forgot Password Form")
                .category("form")
                .icon("\uD83D\uDD11")
                .description("Password reset request form")
                .pluginId(PLUGIN_ID)
                .pluginVersion(PLUGIN_VERSION)
                .reactComponentPath("/renderers/ForgotPasswordFormRenderer")
                .defaultProps(buildForgotPasswordDefaultProps())
                .defaultStyles(buildLoginFormDefaultStyles())
                .configurableProps(buildForgotPasswordConfigurableProps())
                .configurableStyles(buildFormConfigurableStyles())
                .sizeConstraints(buildFormSizeConstraints())
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

    private Map<String, Object> buildForgotPasswordDefaultProps() {
        Map<String, Object> props = new HashMap<>();
        props.put("title", "Reset Password");
        props.put("subtitle", "Enter your email and we'll send you a reset link.");
        props.put("emailLabel", "Email Address");
        props.put("emailPlaceholder", "Enter your email");
        props.put("submitButtonText", "Send Reset Link");
        props.put("showBackToLogin", true);
        props.put("backToLoginText", "Back to");
        props.put("backToLoginLinkText", "Sign in");
        props.put("backToLoginUrl", "/login");
        props.put("resetEndpoint", "/api/auth/forgot-password");
        props.put("successMessage", "If an account exists with this email, you will receive a password reset link.");
        props.put("showSuccessIcon", true);
        return props;
    }

    private List<PropDefinition> buildForgotPasswordConfigurableProps() {
        List<PropDefinition> props = new ArrayList<>();

        props.add(PropDefinition.builder()
                .name("title")
                .type(PropDefinition.PropType.STRING)
                .label("Title")
                .defaultValue("Reset Password")
                .build());

        props.add(PropDefinition.builder()
                .name("subtitle")
                .type(PropDefinition.PropType.STRING)
                .label("Subtitle")
                .defaultValue("Enter your email and we'll send you a reset link.")
                .build());

        props.add(PropDefinition.builder()
                .name("emailLabel")
                .type(PropDefinition.PropType.STRING)
                .label("Email Label")
                .defaultValue("Email Address")
                .build());

        props.add(PropDefinition.builder()
                .name("submitButtonText")
                .type(PropDefinition.PropType.STRING)
                .label("Submit Button Text")
                .defaultValue("Send Reset Link")
                .build());

        props.add(PropDefinition.builder()
                .name("showBackToLogin")
                .type(PropDefinition.PropType.BOOLEAN)
                .label("Show Back to Login")
                .defaultValue(true)
                .build());

        props.add(PropDefinition.builder()
                .name("backToLoginUrl")
                .type(PropDefinition.PropType.STRING)
                .label("Login URL")
                .defaultValue("/login")
                .build());

        props.add(PropDefinition.builder()
                .name("resetEndpoint")
                .type(PropDefinition.PropType.STRING)
                .label("Reset API Endpoint")
                .defaultValue("/api/auth/forgot-password")
                .build());

        props.add(PropDefinition.builder()
                .name("successMessage")
                .type(PropDefinition.PropType.STRING)
                .label("Success Message")
                .defaultValue("If an account exists with this email, you will receive a password reset link.")
                .build());

        return props;
    }

    // ==================== LOGOUT BUTTON ====================
    private ComponentManifest buildLogoutButtonManifest() {
        return ComponentManifest.builder()
                .componentId("LogoutButton")
                .displayName("Logout Button")
                .category("form")
                .icon("\uD83D\uDEAA")
                .description("Button to log out the current user")
                .pluginId(PLUGIN_ID)
                .pluginVersion(PLUGIN_VERSION)
                .reactComponentPath("/renderers/LogoutButtonRenderer")
                .defaultProps(buildLogoutButtonDefaultProps())
                .defaultStyles(buildLogoutButtonDefaultStyles())
                .configurableProps(buildLogoutButtonConfigurableProps())
                .configurableStyles(buildButtonConfigurableStyles())
                .sizeConstraints(buildButtonSizeConstraints())
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

    private Map<String, Object> buildLogoutButtonDefaultProps() {
        Map<String, Object> props = new HashMap<>();
        props.put("text", "Sign Out");
        props.put("icon", "\uD83D\uDEAA");
        props.put("showIcon", true);
        props.put("iconPosition", "left");
        props.put("variant", "secondary");
        props.put("size", "medium");
        props.put("logoutEndpoint", "/api/auth/logout");
        props.put("redirectUrl", "/");
        props.put("confirmLogout", false);
        props.put("confirmTitle", "Sign Out");
        props.put("confirmMessage", "Are you sure you want to sign out?");
        props.put("confirmButtonText", "Sign Out");
        props.put("cancelButtonText", "Cancel");
        props.put("showOnlyWhenLoggedIn", true);
        return props;
    }

    private Map<String, String> buildLogoutButtonDefaultStyles() {
        Map<String, String> styles = new HashMap<>();
        styles.put("backgroundColor", "#6c757d");
        styles.put("textColor", "#ffffff");
        styles.put("borderRadius", "8px");
        styles.put("padding", "10px 20px");
        styles.put("fontSize", "14px");
        return styles;
    }

    private List<PropDefinition> buildLogoutButtonConfigurableProps() {
        List<PropDefinition> props = new ArrayList<>();

        props.add(PropDefinition.builder()
                .name("text")
                .type(PropDefinition.PropType.STRING)
                .label("Button Text")
                .defaultValue("Sign Out")
                .build());

        props.add(PropDefinition.builder()
                .name("showIcon")
                .type(PropDefinition.PropType.BOOLEAN)
                .label("Show Icon")
                .defaultValue(true)
                .build());

        props.add(PropDefinition.builder()
                .name("iconPosition")
                .type(PropDefinition.PropType.SELECT)
                .label("Icon Position")
                .defaultValue("left")
                .options(List.of("left", "right"))
                .build());

        props.add(PropDefinition.builder()
                .name("variant")
                .type(PropDefinition.PropType.SELECT)
                .label("Variant")
                .defaultValue("secondary")
                .options(List.of("primary", "secondary", "danger", "text", "outlined"))
                .build());

        props.add(PropDefinition.builder()
                .name("size")
                .type(PropDefinition.PropType.SELECT)
                .label("Size")
                .defaultValue("medium")
                .options(List.of("small", "medium", "large"))
                .build());

        props.add(PropDefinition.builder()
                .name("logoutEndpoint")
                .type(PropDefinition.PropType.STRING)
                .label("Logout API Endpoint")
                .defaultValue("/api/auth/logout")
                .build());

        props.add(PropDefinition.builder()
                .name("redirectUrl")
                .type(PropDefinition.PropType.STRING)
                .label("Redirect After Logout")
                .defaultValue("/")
                .build());

        props.add(PropDefinition.builder()
                .name("confirmLogout")
                .type(PropDefinition.PropType.BOOLEAN)
                .label("Confirm Before Logout")
                .defaultValue(false)
                .build());

        props.add(PropDefinition.builder()
                .name("confirmMessage")
                .type(PropDefinition.PropType.STRING)
                .label("Confirm Message")
                .defaultValue("Are you sure you want to sign out?")
                .build());

        props.add(PropDefinition.builder()
                .name("showOnlyWhenLoggedIn")
                .type(PropDefinition.PropType.BOOLEAN)
                .label("Show Only When Logged In")
                .defaultValue(true)
                .helpText("Hide button when user is not authenticated")
                .build());

        return props;
    }

    // ==================== SHARED STYLES ====================
    private List<StyleDefinition> buildFormConfigurableStyles() {
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
                .defaultValue("12px")
                .allowedUnits(List.of("px", "rem", "%"))
                .category("border")
                .build());

        styles.add(StyleDefinition.builder()
                .property("padding")
                .type(StyleDefinition.StyleType.SIZE)
                .label("Padding")
                .defaultValue("32px")
                .allowedUnits(List.of("px", "rem", "em"))
                .category("spacing")
                .build());

        styles.add(StyleDefinition.builder()
                .property("boxShadow")
                .type(StyleDefinition.StyleType.SHADOW)
                .label("Box Shadow")
                .defaultValue("0 4px 6px rgba(0, 0, 0, 0.1)")
                .category("effects")
                .build());

        return styles;
    }

    private List<StyleDefinition> buildButtonConfigurableStyles() {
        List<StyleDefinition> styles = new ArrayList<>();

        styles.add(StyleDefinition.builder()
                .property("backgroundColor")
                .type(StyleDefinition.StyleType.COLOR)
                .label("Background Color")
                .defaultValue("#6c757d")
                .category("appearance")
                .build());

        styles.add(StyleDefinition.builder()
                .property("textColor")
                .type(StyleDefinition.StyleType.COLOR)
                .label("Text Color")
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

    // ==================== SIZE CONSTRAINTS ====================
    private SizeConstraints buildFormSizeConstraints() {
        return SizeConstraints.builder()
                .resizable(true)
                .defaultWidth("400px")
                .defaultHeight("auto")
                .minWidth("280px")
                .maxWidth("600px")
                .widthLocked(false)
                .heightLocked(false)
                .build();
    }

    private SizeConstraints buildButtonSizeConstraints() {
        return SizeConstraints.builder()
                .resizable(true)
                .defaultWidth("auto")
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
        return "Auth Component Plugin";
    }

    @Override
    public String getVersion() {
        return PLUGIN_VERSION;
    }

    @Override
    public String getDescription() {
        return "Authentication UI components: LoginForm, RegisterForm, SocialLoginButtons, ForgotPasswordForm, LogoutButton";
    }
}

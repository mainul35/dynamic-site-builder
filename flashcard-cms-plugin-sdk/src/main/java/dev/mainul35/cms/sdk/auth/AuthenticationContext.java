package dev.mainul35.cms.sdk.auth;

import dev.mainul35.cms.sdk.data.UserContext;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * Authentication context providing complete information about the current user session.
 *
 * This context is available in template variables as {{auth}}:
 * - {{auth.isAuthenticated}} - boolean indicating if user is logged in
 * - {{auth.user.id}} - unique user identifier
 * - {{auth.user.username}} - username
 * - {{auth.user.email}} - email address
 * - {{auth.user.displayName}} - display name (full name or username)
 * - {{auth.user.firstName}} - first name
 * - {{auth.user.lastName}} - last name
 * - {{auth.user.avatarUrl}} - profile picture URL
 * - {{auth.user.roles}} - array of user roles
 * - {{auth.provider}} - authentication provider (google, github, keycloak, etc.)
 * - {{auth.loginTime}} - when the user logged in
 * - {{auth.expiresAt}} - when the session expires
 *
 * Example usage in components:
 * - Show/hide based on auth: th:if="${auth.isAuthenticated}"
 * - Display username: th:text="${auth.user.displayName}"
 * - Check role: th:if="${auth.hasRole('ADMIN')}"
 */
public class AuthenticationContext {

    /**
     * Whether the user is authenticated
     */
    private boolean authenticated;

    /**
     * The authenticated user's information
     */
    private AuthenticatedUser user;

    /**
     * Authentication provider used (e.g., "google", "github", "keycloak", "local")
     */
    private String provider;

    /**
     * When the user logged in
     */
    private Instant loginTime;

    /**
     * When the session expires
     */
    private Instant expiresAt;

    /**
     * Session ID
     */
    private String sessionId;

    /**
     * OAuth2 access token (if applicable)
     */
    private String accessToken;

    /**
     * OAuth2 refresh token (if applicable)
     */
    private String refreshToken;

    /**
     * OAuth2 token type (e.g., "Bearer")
     */
    private String tokenType;

    /**
     * OAuth2 scopes granted
     */
    private String[] scopes;

    /**
     * Additional provider-specific claims
     */
    private Map<String, Object> claims;

    public AuthenticationContext() {
        this.authenticated = false;
        this.claims = new HashMap<>();
    }

    /**
     * Create an unauthenticated context
     */
    public static AuthenticationContext anonymous() {
        AuthenticationContext ctx = new AuthenticationContext();
        ctx.authenticated = false;
        ctx.user = null;
        return ctx;
    }

    /**
     * Create from UserContext
     */
    public static AuthenticationContext fromUserContext(UserContext userContext) {
        if (userContext == null || !userContext.isAuthenticated()) {
            return anonymous();
        }

        AuthenticationContext ctx = new AuthenticationContext();
        ctx.authenticated = true;
        ctx.provider = userContext.getAuthProvider();
        ctx.sessionId = userContext.getSessionId();

        AuthenticatedUser user = new AuthenticatedUser();
        user.setId(userContext.getUserId());
        user.setUsername(userContext.getUsername());
        user.setEmail(userContext.getEmail());
        user.setRoles(userContext.getRoles());
        user.setDisplayName(userContext.getUsername()); // Default to username

        if (userContext.getAttributes() != null) {
            // Extract common attributes
            Map<String, Object> attrs = userContext.getAttributes();
            if (attrs.containsKey("displayName")) {
                user.setDisplayName((String) attrs.get("displayName"));
            }
            if (attrs.containsKey("firstName")) {
                user.setFirstName((String) attrs.get("firstName"));
            }
            if (attrs.containsKey("lastName")) {
                user.setLastName((String) attrs.get("lastName"));
            }
            if (attrs.containsKey("avatarUrl")) {
                user.setAvatarUrl((String) attrs.get("avatarUrl"));
            }
            if (attrs.containsKey("picture")) {
                user.setAvatarUrl((String) attrs.get("picture"));
            }
            if (attrs.containsKey("phoneNumber")) {
                user.setPhoneNumber((String) attrs.get("phoneNumber"));
            }
            ctx.claims = attrs;
        }

        ctx.user = user;
        return ctx;
    }

    // Builder pattern
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private final AuthenticationContext context = new AuthenticationContext();
        private final AuthenticatedUser user = new AuthenticatedUser();

        public Builder authenticated(boolean authenticated) {
            context.authenticated = authenticated;
            return this;
        }

        public Builder userId(String userId) {
            user.setId(userId);
            return this;
        }

        public Builder username(String username) {
            user.setUsername(username);
            return this;
        }

        public Builder email(String email) {
            user.setEmail(email);
            return this;
        }

        public Builder displayName(String displayName) {
            user.setDisplayName(displayName);
            return this;
        }

        public Builder firstName(String firstName) {
            user.setFirstName(firstName);
            return this;
        }

        public Builder lastName(String lastName) {
            user.setLastName(lastName);
            return this;
        }

        public Builder avatarUrl(String avatarUrl) {
            user.setAvatarUrl(avatarUrl);
            return this;
        }

        public Builder roles(String... roles) {
            user.setRoles(roles);
            return this;
        }

        public Builder provider(String provider) {
            context.provider = provider;
            return this;
        }

        public Builder loginTime(Instant loginTime) {
            context.loginTime = loginTime;
            return this;
        }

        public Builder expiresAt(Instant expiresAt) {
            context.expiresAt = expiresAt;
            return this;
        }

        public Builder sessionId(String sessionId) {
            context.sessionId = sessionId;
            return this;
        }

        public Builder accessToken(String accessToken) {
            context.accessToken = accessToken;
            return this;
        }

        public Builder refreshToken(String refreshToken) {
            context.refreshToken = refreshToken;
            return this;
        }

        public Builder tokenType(String tokenType) {
            context.tokenType = tokenType;
            return this;
        }

        public Builder scopes(String... scopes) {
            context.scopes = scopes;
            return this;
        }

        public Builder claims(Map<String, Object> claims) {
            context.claims = claims;
            return this;
        }

        public Builder claim(String key, Object value) {
            if (context.claims == null) {
                context.claims = new HashMap<>();
            }
            context.claims.put(key, value);
            return this;
        }

        public AuthenticationContext build() {
            context.user = user;
            return context;
        }
    }

    /**
     * Check if user has a specific role
     */
    public boolean hasRole(String role) {
        return user != null && user.hasRole(role);
    }

    /**
     * Check if user has any of the specified roles
     */
    public boolean hasAnyRole(String... roles) {
        return user != null && user.hasAnyRole(roles);
    }

    /**
     * Check if user has all of the specified roles
     */
    public boolean hasAllRoles(String... roles) {
        return user != null && user.hasAllRoles(roles);
    }

    /**
     * Check if the session is expired
     */
    public boolean isExpired() {
        if (expiresAt == null) {
            return false;
        }
        return Instant.now().isAfter(expiresAt);
    }

    /**
     * Get a claim value
     */
    public Object getClaim(String key) {
        return claims != null ? claims.get(key) : null;
    }

    /**
     * Get a claim value with type casting
     */
    @SuppressWarnings("unchecked")
    public <T> T getClaim(String key, Class<T> type) {
        Object value = getClaim(key);
        if (value != null && type.isInstance(value)) {
            return (T) value;
        }
        return null;
    }

    /**
     * Convert to a Map for template rendering
     */
    public Map<String, Object> toMap() {
        Map<String, Object> map = new HashMap<>();
        map.put("isAuthenticated", authenticated);
        map.put("authenticated", authenticated);

        if (user != null) {
            map.put("user", user.toMap());
        } else {
            map.put("user", null);
        }

        map.put("provider", provider);
        map.put("loginTime", loginTime);
        map.put("expiresAt", expiresAt);
        map.put("sessionId", sessionId);
        map.put("claims", claims);

        return map;
    }

    // Getters and setters
    public boolean isAuthenticated() {
        return authenticated;
    }

    public void setAuthenticated(boolean authenticated) {
        this.authenticated = authenticated;
    }

    public AuthenticatedUser getUser() {
        return user;
    }

    public void setUser(AuthenticatedUser user) {
        this.user = user;
    }

    public String getProvider() {
        return provider;
    }

    public void setProvider(String provider) {
        this.provider = provider;
    }

    public Instant getLoginTime() {
        return loginTime;
    }

    public void setLoginTime(Instant loginTime) {
        this.loginTime = loginTime;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(Instant expiresAt) {
        this.expiresAt = expiresAt;
    }

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    public String getAccessToken() {
        return accessToken;
    }

    public void setAccessToken(String accessToken) {
        this.accessToken = accessToken;
    }

    public String getRefreshToken() {
        return refreshToken;
    }

    public void setRefreshToken(String refreshToken) {
        this.refreshToken = refreshToken;
    }

    public String getTokenType() {
        return tokenType;
    }

    public void setTokenType(String tokenType) {
        this.tokenType = tokenType;
    }

    public String[] getScopes() {
        return scopes;
    }

    public void setScopes(String[] scopes) {
        this.scopes = scopes;
    }

    public Map<String, Object> getClaims() {
        return claims;
    }

    public void setClaims(Map<String, Object> claims) {
        this.claims = claims;
    }

    @Override
    public String toString() {
        return "AuthenticationContext{" +
                "authenticated=" + authenticated +
                ", user=" + user +
                ", provider='" + provider + '\'' +
                ", sessionId='" + sessionId + '\'' +
                '}';
    }
}

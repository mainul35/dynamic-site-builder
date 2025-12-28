package dev.mainul35.cms.sdk.data;

import java.util.Arrays;
import java.util.Map;

/**
 * User context information passed to data providers.
 * Contains authentication and session information.
 */
public class UserContext {

    /**
     * Unique user identifier
     */
    private String userId;

    /**
     * Username or display name
     */
    private String username;

    /**
     * Email address
     */
    private String email;

    /**
     * User roles/permissions
     */
    private String[] roles;

    /**
     * Session identifier
     */
    private String sessionId;

    /**
     * Authentication provider (e.g., "google", "keycloak", "okta")
     */
    private String authProvider;

    /**
     * Additional attributes from the identity provider
     */
    private Map<String, Object> attributes;

    /**
     * Whether the user is authenticated
     */
    private boolean authenticated;

    public UserContext() {}

    // Builder pattern
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private final UserContext context = new UserContext();

        public Builder userId(String userId) {
            context.userId = userId;
            return this;
        }

        public Builder username(String username) {
            context.username = username;
            return this;
        }

        public Builder email(String email) {
            context.email = email;
            return this;
        }

        public Builder roles(String... roles) {
            context.roles = roles;
            return this;
        }

        public Builder sessionId(String sessionId) {
            context.sessionId = sessionId;
            return this;
        }

        public Builder authProvider(String authProvider) {
            context.authProvider = authProvider;
            return this;
        }

        public Builder attributes(Map<String, Object> attributes) {
            context.attributes = attributes;
            return this;
        }

        public Builder authenticated(boolean authenticated) {
            context.authenticated = authenticated;
            return this;
        }

        public UserContext build() {
            return context;
        }
    }

    /**
     * Check if user has a specific role
     */
    public boolean hasRole(String role) {
        if (roles == null || role == null) {
            return false;
        }
        for (String r : roles) {
            if (role.equals(r)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Check if user has any of the specified roles
     */
    public boolean hasAnyRole(String... requiredRoles) {
        if (roles == null || requiredRoles == null) {
            return false;
        }
        for (String required : requiredRoles) {
            if (hasRole(required)) {
                return true;
            }
        }
        return false;
    }

    // Getters and setters
    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String[] getRoles() {
        return roles;
    }

    public void setRoles(String[] roles) {
        this.roles = roles;
    }

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    public String getAuthProvider() {
        return authProvider;
    }

    public void setAuthProvider(String authProvider) {
        this.authProvider = authProvider;
    }

    public Map<String, Object> getAttributes() {
        return attributes;
    }

    public void setAttributes(Map<String, Object> attributes) {
        this.attributes = attributes;
    }

    public boolean isAuthenticated() {
        return authenticated;
    }

    public void setAuthenticated(boolean authenticated) {
        this.authenticated = authenticated;
    }

    @Override
    public String toString() {
        return "UserContext{" +
                "userId='" + userId + '\'' +
                ", username='" + username + '\'' +
                ", email='" + email + '\'' +
                ", roles=" + Arrays.toString(roles) +
                ", authenticated=" + authenticated +
                ", authProvider='" + authProvider + '\'' +
                '}';
    }
}

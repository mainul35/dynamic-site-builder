package dev.mainul35.cms.sdk.auth;

import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

/**
 * Represents an authenticated user with their profile information.
 *
 * Available in templates as {{auth.user}}:
 * - {{auth.user.id}} - unique user identifier
 * - {{auth.user.username}} - username
 * - {{auth.user.email}} - email address
 * - {{auth.user.displayName}} - display name (full name or username)
 * - {{auth.user.firstName}} - first name
 * - {{auth.user.lastName}} - last name
 * - {{auth.user.avatarUrl}} - profile picture URL
 * - {{auth.user.phoneNumber}} - phone number
 * - {{auth.user.roles}} - array of user roles
 * - {{auth.user.emailVerified}} - whether email is verified
 */
public class AuthenticatedUser {

    /**
     * Unique user identifier
     */
    private String id;

    /**
     * Username (login name)
     */
    private String username;

    /**
     * Email address
     */
    private String email;

    /**
     * Display name (full name or preferred name)
     */
    private String displayName;

    /**
     * First name
     */
    private String firstName;

    /**
     * Last name
     */
    private String lastName;

    /**
     * Profile picture URL
     */
    private String avatarUrl;

    /**
     * Phone number
     */
    private String phoneNumber;

    /**
     * User roles/permissions
     */
    private String[] roles;

    /**
     * Whether the email is verified
     */
    private boolean emailVerified;

    /**
     * User locale/language preference
     */
    private String locale;

    /**
     * User timezone
     */
    private String timezone;

    /**
     * Additional custom attributes
     */
    private Map<String, Object> attributes;

    public AuthenticatedUser() {
        this.roles = new String[0];
        this.attributes = new HashMap<>();
    }

    /**
     * Check if user has a specific role
     */
    public boolean hasRole(String role) {
        if (roles == null || role == null) {
            return false;
        }
        for (String r : roles) {
            if (role.equalsIgnoreCase(r)) {
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

    /**
     * Check if user has all of the specified roles
     */
    public boolean hasAllRoles(String... requiredRoles) {
        if (roles == null || requiredRoles == null) {
            return false;
        }
        for (String required : requiredRoles) {
            if (!hasRole(required)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Get full name (firstName + lastName)
     */
    public String getFullName() {
        if (firstName != null && lastName != null) {
            return firstName + " " + lastName;
        } else if (firstName != null) {
            return firstName;
        } else if (lastName != null) {
            return lastName;
        } else if (displayName != null) {
            return displayName;
        } else {
            return username;
        }
    }

    /**
     * Get initials for avatar placeholder
     */
    public String getInitials() {
        if (firstName != null && lastName != null) {
            return (firstName.substring(0, 1) + lastName.substring(0, 1)).toUpperCase();
        } else if (displayName != null && displayName.length() > 0) {
            String[] parts = displayName.split("\\s+");
            if (parts.length >= 2) {
                return (parts[0].substring(0, 1) + parts[1].substring(0, 1)).toUpperCase();
            }
            return displayName.substring(0, Math.min(2, displayName.length())).toUpperCase();
        } else if (username != null && username.length() > 0) {
            return username.substring(0, Math.min(2, username.length())).toUpperCase();
        }
        return "??";
    }

    /**
     * Get a custom attribute
     */
    public Object getAttribute(String key) {
        return attributes != null ? attributes.get(key) : null;
    }

    /**
     * Set a custom attribute
     */
    public void setAttribute(String key, Object value) {
        if (attributes == null) {
            attributes = new HashMap<>();
        }
        attributes.put(key, value);
    }

    /**
     * Convert to a Map for template rendering
     */
    public Map<String, Object> toMap() {
        Map<String, Object> map = new HashMap<>();
        map.put("id", id);
        map.put("username", username);
        map.put("email", email);
        map.put("displayName", displayName != null ? displayName : username);
        map.put("firstName", firstName);
        map.put("lastName", lastName);
        map.put("fullName", getFullName());
        map.put("initials", getInitials());
        map.put("avatarUrl", avatarUrl);
        map.put("phoneNumber", phoneNumber);
        map.put("roles", roles);
        map.put("emailVerified", emailVerified);
        map.put("locale", locale);
        map.put("timezone", timezone);
        map.put("attributes", attributes);
        return map;
    }

    // Builder pattern
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private final AuthenticatedUser user = new AuthenticatedUser();

        public Builder id(String id) {
            user.id = id;
            return this;
        }

        public Builder username(String username) {
            user.username = username;
            return this;
        }

        public Builder email(String email) {
            user.email = email;
            return this;
        }

        public Builder displayName(String displayName) {
            user.displayName = displayName;
            return this;
        }

        public Builder firstName(String firstName) {
            user.firstName = firstName;
            return this;
        }

        public Builder lastName(String lastName) {
            user.lastName = lastName;
            return this;
        }

        public Builder avatarUrl(String avatarUrl) {
            user.avatarUrl = avatarUrl;
            return this;
        }

        public Builder phoneNumber(String phoneNumber) {
            user.phoneNumber = phoneNumber;
            return this;
        }

        public Builder roles(String... roles) {
            user.roles = roles;
            return this;
        }

        public Builder emailVerified(boolean emailVerified) {
            user.emailVerified = emailVerified;
            return this;
        }

        public Builder locale(String locale) {
            user.locale = locale;
            return this;
        }

        public Builder timezone(String timezone) {
            user.timezone = timezone;
            return this;
        }

        public Builder attributes(Map<String, Object> attributes) {
            user.attributes = attributes;
            return this;
        }

        public Builder attribute(String key, Object value) {
            user.setAttribute(key, value);
            return this;
        }

        public AuthenticatedUser build() {
            return user;
        }
    }

    // Getters and setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
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

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String[] getRoles() {
        return roles;
    }

    public void setRoles(String[] roles) {
        this.roles = roles;
    }

    public boolean isEmailVerified() {
        return emailVerified;
    }

    public void setEmailVerified(boolean emailVerified) {
        this.emailVerified = emailVerified;
    }

    public String getLocale() {
        return locale;
    }

    public void setLocale(String locale) {
        this.locale = locale;
    }

    public String getTimezone() {
        return timezone;
    }

    public void setTimezone(String timezone) {
        this.timezone = timezone;
    }

    public Map<String, Object> getAttributes() {
        return attributes;
    }

    public void setAttributes(Map<String, Object> attributes) {
        this.attributes = attributes;
    }

    @Override
    public String toString() {
        return "AuthenticatedUser{" +
                "id='" + id + '\'' +
                ", username='" + username + '\'' +
                ", email='" + email + '\'' +
                ", displayName='" + displayName + '\'' +
                ", roles=" + Arrays.toString(roles) +
                '}';
    }
}

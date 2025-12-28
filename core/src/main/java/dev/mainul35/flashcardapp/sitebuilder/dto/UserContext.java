package dev.mainul35.flashcardapp.sitebuilder.dto;

/**
 * User context information passed to data providers.
 */
public class UserContext {

    private String userId;
    private String username;
    private String email;
    private String[] roles;
    private String sessionId;
    private String authProvider;

    // Getters and setters
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String[] getRoles() { return roles; }
    public void setRoles(String[] roles) { this.roles = roles; }

    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }

    public String getAuthProvider() { return authProvider; }
    public void setAuthProvider(String authProvider) { this.authProvider = authProvider; }
}

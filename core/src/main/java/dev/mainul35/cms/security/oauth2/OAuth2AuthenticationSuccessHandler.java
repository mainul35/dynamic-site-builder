package dev.mainul35.cms.security.oauth2;

import dev.mainul35.cms.security.entity.CmsUser;
import dev.mainul35.cms.security.entity.CmsRole;
import dev.mainul35.cms.security.entity.RoleName;
import dev.mainul35.cms.security.entity.UserStatus;
import dev.mainul35.cms.security.repository.CmsUserRepository;
import dev.mainul35.cms.security.repository.CmsRoleRepository;
import dev.mainul35.cms.security.service.JwtService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

/**
 * Handles successful OAuth2 login from VSD Auth Server.
 * Creates or updates the local CMS user and issues a local JWT token,
 * then redirects to the frontend with the token.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final CmsUserRepository userRepository;
    private final CmsRoleRepository roleRepository;
    private final JwtService jwtService;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {
        if (authentication instanceof OAuth2AuthenticationToken oauth2Token) {
            log.info("=== OAuth2 Success Handler Called ===");
            log.info("Configured frontend URL: '{}'", frontendUrl);
            log.info("Request URL: {}", request.getRequestURL());
            log.info("Request URI: {}", request.getRequestURI());
            log.info("Referer header: {}", request.getHeader("Referer"));
            log.info("Origin header: {}", request.getHeader("Origin"));
            log.info("X-Forwarded-Host: {}", request.getHeader("X-Forwarded-Host"));
            log.info("X-Forwarded-Proto: {}", request.getHeader("X-Forwarded-Proto"));

            OAuth2User oauth2User = oauth2Token.getPrincipal();
            Map<String, Object> attributes = oauth2User.getAttributes();

            String authServerId = (String) attributes.get("sub");
            String emailAttr = (String) attributes.get("email");
            String displayName = (String) attributes.get("display_name");
            if (displayName == null) {
                displayName = (String) attributes.get("name");
            }

            // If email is not directly available, check if sub contains an email
            // (VSD Auth Server may use email as the subject identifier)
            final String email;
            if (emailAttr != null) {
                email = emailAttr;
            } else if (authServerId != null && authServerId.contains("@")) {
                email = authServerId;
            } else {
                email = null;
            }

            log.info("OAuth2 login success for user: {} ({})", email, authServerId);
            log.debug("OAuth2 attributes: {}", attributes);

            // Find or create local CMS user
            CmsUser cmsUser = userRepository.findByAuthServerId(authServerId)
                    .orElseGet(() -> userRepository.findByEmail(email)
                            .orElse(null));

            if (cmsUser == null) {
                // Create new user from auth server
                cmsUser = createUserFromOAuth2(authServerId, email, displayName, attributes);
                log.info("Created new CMS user from auth server: {}", email);
            } else {
                // Update existing user - sync auth server ID and roles
                boolean updated = false;

                if (cmsUser.getAuthServerId() == null) {
                    cmsUser.setAuthServerId(authServerId);
                    updated = true;
                    log.info("Linked existing CMS user to auth server: {}", email);
                }

                // Sync roles from auth server for existing users
                cmsUser = syncRolesFromAuthServer(cmsUser, attributes);
                log.debug("Synced roles for existing user: {} -> {}", email,
                    cmsUser.getRoles().stream().map(r -> r.getRoleName()).toList());
            }

            // Generate local JWT token
            String accessToken = jwtService.generateAccessToken(cmsUser);

            // Redirect to frontend with token
            // Ensure frontendUrl is valid (fallback to hardcoded value if empty)
            String effectiveFrontendUrl = (frontendUrl != null && !frontendUrl.trim().isEmpty())
                    ? frontendUrl
                    : "http://localhost:5173";
            log.info("Using frontend URL: '{}'", effectiveFrontendUrl);

            // Use encode() to properly URL-encode the JWT token (handles + and = characters)
            String redirectUrl = UriComponentsBuilder.fromUriString(effectiveFrontendUrl)
                    .path("/oauth2/callback")
                    .queryParam("token", accessToken)
                    .encode()
                    .build()
                    .toUriString();

            log.info("Constructed redirect URL: {}", redirectUrl);
            log.info("Redirect URL starts with http: {}", redirectUrl.startsWith("http"));
            log.info("Token length: {}", accessToken.length());
            log.info("Full redirect URL length: {}", redirectUrl.length());

            // Clear any response state and do a simple HTTP redirect
            response.reset();
            response.setStatus(HttpServletResponse.SC_FOUND); // 302 redirect
            response.setHeader("Location", redirectUrl);
            response.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
            response.setHeader("Pragma", "no-cache");
            response.setHeader("Expires", "0");
            log.info("Sending 302 redirect to: {}", redirectUrl);
            response.flushBuffer();
        } else {
            super.onAuthenticationSuccess(request, response, authentication);
        }
    }

    private CmsUser createUserFromOAuth2(String authServerId, String email, String displayName,
                                          Map<String, Object> attributes) {
        CmsUser user = new CmsUser();
        user.setAuthServerId(authServerId);
        user.setEmail(email);
        // Use email prefix as username, or authServerId if email is not available
        if (email != null && email.contains("@")) {
            user.setUsername(email.split("@")[0]);
        } else if (authServerId != null) {
            user.setUsername(authServerId.contains("@") ? authServerId.split("@")[0] : authServerId);
        } else {
            user.setUsername("user_" + System.currentTimeMillis());
        }
        user.setFullName(displayName != null ? displayName : user.getUsername());
        user.setIsActive(true);
        user.setStatus(UserStatus.APPROVED); // Auto-approve SSO users

        // Assign default USER and DESIGNER roles for SSO users
        Set<CmsRole> roles = new HashSet<>();
        roleRepository.findByRoleName(RoleName.USER).ifPresent(roles::add);
        roleRepository.findByRoleName(RoleName.DESIGNER).ifPresent(roles::add);

        // Check if user has CMS roles from auth server
        Object authServerRoles = attributes.get("roles");
        if (authServerRoles instanceof Iterable<?> roleList) {
            for (Object role : roleList) {
                String roleName = role.toString();
                if (roleName.startsWith("CMS_")) {
                    // Map CMS roles from auth server using enum
                    String mappedRoleName = roleName.replace("CMS_", "");
                    for (RoleName enumRole : RoleName.values()) {
                        if (enumRole.name().equals(mappedRoleName)) {
                            roleRepository.findByRoleName(enumRole).ifPresent(roles::add);
                            break;
                        }
                    }
                }
            }
        }

        user.setRoles(roles);
        return userRepository.save(user);
    }

    /**
     * Sync roles from auth server for existing users.
     * Ensures SSO users have at least USER and DESIGNER roles,
     * and maps any CMS_* roles from the auth server.
     */
    private CmsUser syncRolesFromAuthServer(CmsUser user, Map<String, Object> attributes) {
        Set<CmsRole> roles = new HashSet<>(user.getRoles());
        Set<String> existingRoleNames = roles.stream()
                .map(CmsRole::getRoleName)
                .collect(java.util.stream.Collectors.toSet());
        boolean rolesChanged = false;

        // Ensure SSO users have at least USER and DESIGNER roles
        if (!existingRoleNames.contains(RoleName.USER.name())) {
            CmsRole userRole = roleRepository.findByRoleName(RoleName.USER).orElse(null);
            if (userRole != null) {
                roles.add(userRole);
                rolesChanged = true;
                log.info("Added USER role to existing SSO user: {}", user.getEmail());
            }
        }

        if (!existingRoleNames.contains(RoleName.DESIGNER.name())) {
            CmsRole designerRole = roleRepository.findByRoleName(RoleName.DESIGNER).orElse(null);
            if (designerRole != null) {
                roles.add(designerRole);
                rolesChanged = true;
                log.info("Added DESIGNER role to existing SSO user: {}", user.getEmail());
            }
        }

        // Map CMS roles from auth server
        Object authServerRoles = attributes.get("roles");
        if (authServerRoles instanceof Iterable<?> roleList) {
            for (Object role : roleList) {
                String roleName = role.toString();
                if (roleName.startsWith("CMS_")) {
                    String mappedRoleName = roleName.replace("CMS_", "");
                    for (RoleName enumRole : RoleName.values()) {
                        if (enumRole.name().equals(mappedRoleName)) {
                            if (!existingRoleNames.contains(enumRole.name())) {
                                CmsRole cmsRole = roleRepository.findByRoleName(enumRole).orElse(null);
                                if (cmsRole != null) {
                                    roles.add(cmsRole);
                                    rolesChanged = true;
                                    log.info("Added {} role from auth server to user: {}", enumRole, user.getEmail());
                                }
                            }
                            break;
                        }
                    }
                }
            }
        }

        if (rolesChanged) {
            user.setRoles(roles);
            return userRepository.save(user);
        }

        return user;
    }
}

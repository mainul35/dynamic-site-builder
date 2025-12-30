package dev.mainul35.cms.security.filter;

import dev.mainul35.cms.security.service.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String AUTHORIZATION_HEADER = "Authorization";
    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        try {
            String jwt = extractJwtFromRequest(request);

            if (StringUtils.hasText(jwt) && jwtService.isTokenValid(jwt)) {
                // Only process access tokens, not refresh tokens
                if (!jwtService.isAccessToken(jwt)) {
                    log.debug("Token is not an access token, skipping authentication");
                    filterChain.doFilter(request, response);
                    return;
                }

                Long userId = jwtService.extractUserId(jwt);
                String email = jwtService.extractEmail(jwt);
                Set<String> roles = jwtService.extractRoles(jwt);

                if (userId != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                    // Create authorities from roles
                    var authorities = roles.stream()
                            .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
                            .collect(Collectors.toList());

                    // Create authentication token
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            new JwtUserPrincipal(userId, email, roles),
                            null,
                            authorities
                    );

                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);

                    log.debug("Authenticated user {} with roles: {}", email, roles);
                }
            }
        } catch (Exception e) {
            log.error("Cannot set user authentication: {}", e.getMessage());
        }

        filterChain.doFilter(request, response);
    }

    private String extractJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader(AUTHORIZATION_HEADER);
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith(BEARER_PREFIX)) {
            return bearerToken.substring(BEARER_PREFIX.length());
        }
        return null;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getServletPath();
        // Skip JWT filter for auth endpoints and static resources
        return path.startsWith("/api/auth/login") ||
               path.startsWith("/api/auth/register") ||
               path.startsWith("/api/auth/refresh") ||
               path.startsWith("/oauth2/") ||
               path.startsWith("/login/oauth2/") ||
               path.startsWith("/h2-console") ||
               path.startsWith("/static/") ||
               path.startsWith("/assets/") ||
               path.equals("/") ||
               path.equals("/index.html") ||
               path.endsWith(".js") ||
               path.endsWith(".css") ||
               path.endsWith(".ico");
    }

    /**
     * Principal object that holds JWT user information
     */
    public record JwtUserPrincipal(Long userId, String email, Set<String> roles) {
        public boolean hasRole(String role) {
            return roles.contains(role);
        }

        public boolean isAdmin() {
            return hasRole("ADMIN");
        }
    }
}

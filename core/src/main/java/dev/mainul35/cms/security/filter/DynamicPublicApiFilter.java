package dev.mainul35.cms.security.filter;

import dev.mainul35.cms.security.entity.RoleName;
import dev.mainul35.cms.security.service.PublicApiPatternService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Security filter that checks if a request matches any dynamic public API pattern.
 *
 * This filter runs before the JWT authentication filter. If the request path
 * matches a public pattern from the database, it sets an anonymous authentication
 * to bypass authentication requirements.
 *
 * Changes to patterns in the database take effect immediately (with caching for performance).
 */
@Component
@RequiredArgsConstructor
@Slf4j
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
public class DynamicPublicApiFilter extends OncePerRequestFilter {

    private final PublicApiPatternService patternService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String requestPath = request.getRequestURI();
        String method = request.getMethod();

        // Check if this path matches any dynamic public pattern
        if (patternService.isPublicPath(requestPath, method)) {
            log.debug("Request {} {} matches dynamic public pattern, allowing anonymous access",
                    method, requestPath);

            // Set anonymous authentication if not already authenticated
            if (SecurityContextHolder.getContext().getAuthentication() == null) {
                SecurityContextHolder.getContext().setAuthentication(
                        new AnonymousAuthenticationToken(
                                "dynamic-public-api",
                                "anonymousUser",
                                List.of(new SimpleGrantedAuthority(RoleName.ANONYMOUS.withRolePrefix()))
                        )
                );
            }
        }

        filterChain.doFilter(request, response);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        // Only apply to API paths
        String path = request.getRequestURI();
        return !path.startsWith("/api/");
    }
}

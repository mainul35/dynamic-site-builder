package dev.mainul35.cms.security.config;

import dev.mainul35.cms.config.SecurityProperties;
import dev.mainul35.cms.security.authserver.AuthServerJwtConverter;
import dev.mainul35.cms.security.entity.RoleName;
import dev.mainul35.cms.security.filter.DynamicPublicApiFilter;
import dev.mainul35.cms.security.filter.JwtAuthenticationFilter;
import dev.mainul35.cms.security.oauth2.OAuth2AuthenticationSuccessHandler;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configurers.AuthorizeHttpRequestsConfigurer;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
@Slf4j
public class CmsSecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final DynamicPublicApiFilter dynamicPublicApiFilter;
    private final UserDetailsService userDetailsService;
    private final SecurityProperties securityProperties;
    private final AuthServerJwtConverter authServerJwtConverter;
    private final OAuth2AuthenticationSuccessHandler oauth2SuccessHandler;

    @Value("${app.auth-server.enabled:false}")
    private boolean authServerEnabled;

    @Value("${app.auth-server.jwk-set-uri:}")
    private String authServerJwkSetUri;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .headers(headers -> headers
                        .frameOptions(HeadersConfigurer.FrameOptionsConfig::sameOrigin))
                // Use IF_REQUIRED to allow sessions for OAuth2 login flow, but still support stateless JWT
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
                .authorizeHttpRequests(auth -> {
                        // Public endpoints - no authentication required
                        auth.requestMatchers("/api/auth/login", "/api/auth/register", "/api/auth/refresh").permitAll()
                        .requestMatchers("/api/auth/check").permitAll()

                        // OAuth2 endpoints
                        .requestMatchers("/oauth2/**", "/login/oauth2/**").permitAll()

                        // Static resources and frontend
                        .requestMatchers("/", "/index.html", "/favicon.ico").permitAll()
                        .requestMatchers("/static/**", "/assets/**").permitAll()
                        .requestMatchers("/*.js", "/*.css", "/*.ico", "/*.png", "/*.svg").permitAll()

                        // H2 Console (development only)
                        .requestMatchers("/h2-console/**").permitAll()

                        // Plugin endpoints (public for frontend rendering)
                        .requestMatchers(HttpMethod.GET, "/api/plugins/**").permitAll()
                        .requestMatchers("/api/plugins/*/assets/**").permitAll()

                        // Component registry - read is public for builder rendering
                        .requestMatchers(HttpMethod.GET, "/api/components/**").permitAll()

                        // Content repository - read is public
                        .requestMatchers(HttpMethod.GET, "/api/content/**").permitAll()

                        // Page data - public for site rendering
                        .requestMatchers(HttpMethod.GET, "/api/pages/*/data").permitAll();

                        // Dynamic public API patterns from configuration
                        // Configure via: security.public-api-patterns=/api/sample/**,/api/products/**
                        configurePublicApiPatterns(auth);

                        // Admin endpoints - require ADMIN role
                        auth.requestMatchers("/api/admin/**").hasRole(RoleName.ADMIN.name())

                        // User management endpoints
                        .requestMatchers("/api/users/pending").hasRole(RoleName.ADMIN.name())
                        .requestMatchers("/api/users/*/approve", "/api/users/*/reject").hasRole(RoleName.ADMIN.name())

                        // Protected API endpoints - require authentication
                        .requestMatchers("/api/**").authenticated()

                        // All other requests - permit (for SPA routing)
                        .anyRequest().permitAll();
                })
                .authenticationProvider(authenticationProvider());

        // DUAL AUTHENTICATION MODE:
        // Always add local JWT filters - they handle CMS-issued tokens (HS256)
        // and pass through auth server tokens (RS256) for OAuth2 Resource Server to handle
        log.info("Local JWT authentication enabled for CMS-issued tokens");
        // Dynamic public API filter runs first to check database-configured patterns
        http.addFilterBefore(dynamicPublicApiFilter, UsernamePasswordAuthenticationFilter.class);
        // JWT filter runs after to authenticate non-public requests (passes through auth server tokens)
        http.addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        // Additionally configure OAuth2 if auth server is enabled
        if (authServerEnabled && authServerJwkSetUri != null && !authServerJwkSetUri.isEmpty()) {
            log.info("VSD Auth Server mode also enabled, using JWT validation from: {}", authServerJwkSetUri);

            // OAuth2 Login for SSO flow (user clicks "Sign in with VSD Auth Server")
            http.oauth2Login(oauth2 -> oauth2
                    .successHandler(oauth2SuccessHandler)
                    .failureUrl("/login?error=oauth2")
            );

            // OAuth2 Resource Server handles auth server tokens (RS256) that passed through the local JWT filter
            http.oauth2ResourceServer(oauth2 -> oauth2
                    .jwt(jwt -> jwt
                            .decoder(jwtDecoder())
                            .jwtAuthenticationConverter(authServerJwtConverter)
                    )
            );
        }

        return http.build();
    }

    @Bean
    public JwtDecoder jwtDecoder() {
        if (authServerEnabled && authServerJwkSetUri != null && !authServerJwkSetUri.isEmpty()) {
            return NimbusJwtDecoder.withJwkSetUri(authServerJwkSetUri).build();
        }
        // Return a dummy decoder when not using auth server
        return token -> {
            throw new UnsupportedOperationException("Auth server not enabled");
        };
    }

    /**
     * Configure public API patterns from application.properties.
     * This allows site developers to define which endpoints are public
     * without modifying the CMS codebase.
     */
    private void configurePublicApiPatterns(
            AuthorizeHttpRequestsConfigurer<HttpSecurity>.AuthorizationManagerRequestMatcherRegistry auth) {
        String[] patterns = securityProperties.getPublicApiPatterns();
        if (patterns != null && patterns.length > 0) {
            log.info("Configuring {} public API pattern(s): {}", patterns.length, Arrays.toString(patterns));
            for (String pattern : patterns) {
                if (pattern != null && !pattern.trim().isEmpty()) {
                    auth.requestMatchers(HttpMethod.GET, pattern.trim()).permitAll();
                    log.debug("Added public API pattern: {}", pattern.trim());
                }
            }
        }
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of("*"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setExposedHeaders(Arrays.asList("Authorization", "Content-Type"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}

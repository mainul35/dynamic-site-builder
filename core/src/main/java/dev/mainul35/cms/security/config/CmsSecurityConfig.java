package dev.mainul35.cms.security.config;

import dev.mainul35.cms.config.SecurityProperties;
import dev.mainul35.cms.security.filter.DynamicPublicApiFilter;
import dev.mainul35.cms.security.filter.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .headers(headers -> headers
                        .frameOptions(HeadersConfigurer.FrameOptionsConfig::sameOrigin))
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
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
                        auth.requestMatchers("/api/admin/**").hasRole("ADMIN")

                        // User management endpoints
                        .requestMatchers("/api/users/pending").hasRole("ADMIN")
                        .requestMatchers("/api/users/*/approve", "/api/users/*/reject").hasRole("ADMIN")

                        // Protected API endpoints - require authentication
                        .requestMatchers("/api/**").authenticated()

                        // All other requests - permit (for SPA routing)
                        .anyRequest().permitAll();
                })
                .authenticationProvider(authenticationProvider())
                // Dynamic public API filter runs first to check database-configured patterns
                .addFilterBefore(dynamicPublicApiFilter, UsernamePasswordAuthenticationFilter.class)
                // JWT filter runs after to authenticate non-public requests
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
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

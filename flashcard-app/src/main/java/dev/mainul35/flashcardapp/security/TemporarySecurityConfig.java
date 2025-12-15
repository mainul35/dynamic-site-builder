package dev.mainul35.flashcardapp.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Temporary security configuration that disables authentication.
 * This allows the application to run during Phase 1 development.
 *
 * TODO: Replace with proper authentication in Phase 6 (Authentication & Authorization)
 */
@Configuration
@EnableWebSecurity
public class TemporarySecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // Disable CSRF for development (will be enabled in production)
                .csrf(AbstractHttpConfigurer::disable)

                // Allow all requests without authentication
                .authorizeHttpRequests(auth -> auth
                        .anyRequest().permitAll()
                )

                // Disable HTTP Basic authentication
                .httpBasic(AbstractHttpConfigurer::disable)

                // Disable form login
                .formLogin(AbstractHttpConfigurer::disable);

        return http.build();
    }
}

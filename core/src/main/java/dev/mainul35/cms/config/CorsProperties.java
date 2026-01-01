package dev.mainul35.cms.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Configuration properties for CORS settings.
 *
 * These can be configured in application.properties or via environment variables:
 * - cors.allowed-origins (or CORS_ALLOWED_ORIGINS env var)
 * - cors.allowed-methods (or CORS_ALLOWED_METHODS env var)
 * - cors.allow-credentials (or CORS_ALLOW_CREDENTIALS env var)
 */
@Component
@ConfigurationProperties(prefix = "cors")
@Getter
@Setter
public class CorsProperties {

    /**
     * Comma-separated list of allowed origins for CORS.
     * Default: http://localhost:5173,http://localhost:3000
     */
    private String[] allowedOrigins = {"http://localhost:5173", "http://localhost:3000"};

    /**
     * Comma-separated list of allowed HTTP methods.
     * Default: GET,POST,PUT,DELETE,OPTIONS
     */
    private String[] allowedMethods = {"GET", "POST", "PUT", "DELETE", "OPTIONS"};

    /**
     * Whether to allow credentials (cookies, authorization headers).
     * Default: true
     */
    private boolean allowCredentials = true;
}

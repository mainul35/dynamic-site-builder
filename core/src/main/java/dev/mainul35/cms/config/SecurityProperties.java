package dev.mainul35.cms.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Configuration properties for security settings.
 *
 * These can be configured in application.properties or via environment variables:
 * - security.public-api-patterns (or SECURITY_PUBLIC_API_PATTERNS env var)
 *
 * This allows site developers to define which API endpoints should be publicly
 * accessible without authentication, without modifying the CMS codebase.
 *
 * Example configuration:
 * security.public-api-patterns=/api/sample/**,/api/products/**,/api/public/**
 */
@Component
@ConfigurationProperties(prefix = "security")
@Getter
@Setter
public class SecurityProperties {

    /**
     * Comma-separated list of API endpoint patterns that should be publicly accessible.
     * Supports Ant-style patterns (e.g., /api/sample/**, /api/products/*).
     *
     * These endpoints will be accessible without authentication.
     * Default: empty (no additional public endpoints beyond CMS defaults)
     *
     * Examples:
     * - /api/sample/** : All endpoints under /api/sample/
     * - /api/products/* : Direct children of /api/products/
     * - /api/public/data : Exact path match
     */
    private String[] publicApiPatterns = {};
}

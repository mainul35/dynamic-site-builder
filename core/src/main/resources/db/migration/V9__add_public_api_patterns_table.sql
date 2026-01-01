-- V9__add_public_api_patterns_table.sql
-- Table for storing dynamic public API endpoint patterns
-- These patterns define which API endpoints are accessible without authentication

CREATE TABLE IF NOT EXISTS public_api_patterns (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    pattern VARCHAR(255) NOT NULL UNIQUE,
    http_methods VARCHAR(100) NOT NULL DEFAULT 'GET',
    description VARCHAR(500),
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_by BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookup of enabled patterns
CREATE INDEX idx_public_api_patterns_enabled ON public_api_patterns(enabled);

-- Insert default sample data pattern (can be disabled if not needed)
INSERT INTO public_api_patterns (pattern, http_methods, description, enabled)
VALUES ('/api/sample/**', 'GET', 'Sample data endpoints for builder testing and demos', TRUE);

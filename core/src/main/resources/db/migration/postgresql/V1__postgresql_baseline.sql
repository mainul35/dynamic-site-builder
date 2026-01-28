-- =============================================================
-- V1: PostgreSQL Baseline Migration for VSD CMS
-- All tables match JPA entity definitions exactly
-- =============================================================

-- =====================
-- 1. cms_roles (no dependencies)
-- Entity: dev.mainul35.cms.security.entity.CmsRole
-- =====================
CREATE TABLE cms_roles (
    id BIGSERIAL PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMP NOT NULL
);

-- Insert default roles
INSERT INTO cms_roles (role_name, description, created_at) VALUES
    ('ADMIN', 'System administrator with full access', CURRENT_TIMESTAMP),
    ('USER', 'Regular user with limited access', CURRENT_TIMESTAMP),
    ('PLUGIN_DEVELOPER', 'Plugin developer with marketplace access', CURRENT_TIMESTAMP),
    ('DESIGNER', 'Site designer with edit access', CURRENT_TIMESTAMP),
    ('VIEWER', 'Read-only access to content', CURRENT_TIMESTAMP);

-- =====================
-- 2. cms_users (no dependencies)
-- Entity: dev.mainul35.cms.security.entity.CmsUser
-- =====================
CREATE TABLE cms_users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255),
    full_name VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'PENDING',
    avatar_url VARCHAR(1000),
    locale VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50),
    email_verified BOOLEAN DEFAULT FALSE,
    phone_number VARCHAR(20),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    last_login_at TIMESTAMP,
    auth_server_id VARCHAR(36) UNIQUE
);

CREATE INDEX idx_cms_users_auth_server_id ON cms_users(auth_server_id);

-- =====================
-- 3. cms_user_roles (join table from CmsUser.roles @ManyToMany)
-- Only user_id and role_id — no extra columns
-- =====================
CREATE TABLE cms_user_roles (
    user_id BIGINT NOT NULL REFERENCES cms_users(id),
    role_id BIGINT NOT NULL REFERENCES cms_roles(id),
    PRIMARY KEY (user_id, role_id)
);

-- =====================
-- 4. cms_oauth2_connections
-- Entity: dev.mainul35.cms.security.entity.OAuth2Connection
-- =====================
CREATE TABLE cms_oauth2_connections (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES cms_users(id),
    provider VARCHAR(50) NOT NULL,
    provider_user_id VARCHAR(255) NOT NULL,
    provider_username VARCHAR(255),
    provider_email VARCHAR(255),
    access_token VARCHAR(2000),
    refresh_token VARCHAR(2000),
    token_expires_at TIMESTAMP,
    connected_at TIMESTAMP NOT NULL,
    last_used_at TIMESTAMP,
    UNIQUE (provider, provider_user_id)
);

-- =====================
-- 5. cms_refresh_tokens
-- Entity: dev.mainul35.cms.security.entity.RefreshToken
-- =====================
CREATE TABLE cms_refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    token_id VARCHAR(36) NOT NULL UNIQUE,
    user_id BIGINT NOT NULL REFERENCES cms_users(id),
    token_family VARCHAR(36) NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP,
    revoked_reason VARCHAR(255),
    user_agent VARCHAR(500),
    ip_address VARCHAR(45)
);

-- =====================
-- 6. public_api_patterns
-- Entity: dev.mainul35.cms.security.entity.PublicApiPattern
-- =====================
CREATE TABLE public_api_patterns (
    id BIGSERIAL PRIMARY KEY,
    pattern VARCHAR(255) NOT NULL UNIQUE,
    http_methods VARCHAR(255) NOT NULL DEFAULT 'GET',
    description VARCHAR(255),
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_by BIGINT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_public_api_patterns_enabled ON public_api_patterns(enabled);

INSERT INTO public_api_patterns (pattern, http_methods, description, enabled, created_at, updated_at)
VALUES ('/api/sample/**', 'GET', 'Sample data endpoints for builder testing and demos', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- =====================
-- 7. cms_plugins
-- Entity: dev.mainul35.cms.plugin.entity.Plugin
-- =====================
CREATE TABLE cms_plugins (
    id BIGSERIAL PRIMARY KEY,
    plugin_id VARCHAR(100) NOT NULL UNIQUE,
    plugin_name VARCHAR(200) NOT NULL,
    version VARCHAR(50) NOT NULL,
    description TEXT,
    author VARCHAR(200),
    main_class VARCHAR(500),
    plugin_type VARCHAR(50) DEFAULT 'feature',
    status VARCHAR(50) NOT NULL DEFAULT 'installed',
    is_bundled BOOLEAN NOT NULL DEFAULT FALSE,
    jar_path VARCHAR(1000),
    config_data TEXT,
    installed_at TIMESTAMP NOT NULL,
    activated_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- =====================
-- 8. cms_plugin_dependencies
-- Entity: dev.mainul35.cms.plugin.entity.PluginDependency
-- =====================
CREATE TABLE cms_plugin_dependencies (
    id BIGSERIAL PRIMARY KEY,
    plugin_id BIGINT NOT NULL REFERENCES cms_plugins(id),
    depends_on_plugin_id VARCHAR(100) NOT NULL,
    min_version VARCHAR(50),
    max_version VARCHAR(50),
    is_required BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL
);

-- =====================
-- 9. cms_component_registry
-- Entity: dev.mainul35.cms.sitebuilder.entity.ComponentRegistryEntry
-- =====================
CREATE TABLE cms_component_registry (
    id BIGSERIAL PRIMARY KEY,
    plugin_id VARCHAR(100) NOT NULL,
    component_id VARCHAR(100) NOT NULL,
    component_name VARCHAR(200) NOT NULL,
    category VARCHAR(50) NOT NULL,
    icon VARCHAR(100),
    component_manifest JSONB NOT NULL,
    react_bundle_path VARCHAR(500),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    registered_at TIMESTAMP NOT NULL
);

-- =====================
-- 10. sites
-- Entity: dev.mainul35.cms.sitebuilder.entity.Site
-- owner_user_id is a plain Long column, NOT a FK
-- =====================
CREATE TABLE sites (
    id BIGSERIAL PRIMARY KEY,
    site_name VARCHAR(255) NOT NULL,
    site_slug VARCHAR(255) NOT NULL UNIQUE,
    site_mode VARCHAR(255) NOT NULL DEFAULT 'MULTI_PAGE',
    description TEXT,
    owner_user_id BIGINT NOT NULL,
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    domain_name VARCHAR(255),
    favicon_url VARCHAR(255),
    metadata TEXT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    published_at TIMESTAMP
);

-- =====================
-- 11. pages
-- Entity: dev.mainul35.cms.sitebuilder.entity.Page
-- =====================
CREATE TABLE pages (
    id BIGSERIAL PRIMARY KEY,
    site_id BIGINT NOT NULL REFERENCES sites(id),
    page_name VARCHAR(255) NOT NULL,
    page_slug VARCHAR(255) NOT NULL,
    page_type VARCHAR(255) NOT NULL DEFAULT 'STANDARD',
    title VARCHAR(255),
    description TEXT,
    route_path VARCHAR(255),
    parent_page_id BIGINT REFERENCES pages(id),
    display_order INTEGER NOT NULL DEFAULT 0,
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    layout_id BIGINT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    published_at TIMESTAMP
);

CREATE INDEX idx_pages_site ON pages(site_id);
CREATE INDEX idx_pages_parent ON pages(parent_page_id);

-- =====================
-- 12. cms_page_versions
-- Entity: dev.mainul35.cms.sitebuilder.entity.PageVersion
-- =====================
CREATE TABLE cms_page_versions (
    id BIGSERIAL PRIMARY KEY,
    page_id BIGINT NOT NULL REFERENCES pages(id),
    version_number INTEGER NOT NULL,
    page_definition TEXT NOT NULL,
    change_description VARCHAR(500),
    created_by_user_id BIGINT,
    created_at TIMESTAMP NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT FALSE
);

-- =====================
-- 13. page_definitions
-- Entity: dev.mainul35.cms.sitebuilder.entity.PageDefinition
-- =====================
CREATE TABLE page_definitions (
    id BIGSERIAL PRIMARY KEY,
    page_name VARCHAR(255) NOT NULL UNIQUE,
    title VARCHAR(255),
    description TEXT,
    path VARCHAR(255),
    page_definition_json TEXT,
    data_sources TEXT,
    published BOOLEAN NOT NULL DEFAULT FALSE,
    version INTEGER,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- =====================
-- Seed default admin user
-- Password: admin123 (BCrypt hash)
-- =====================
INSERT INTO cms_users (username, email, password_hash, full_name, is_active, is_admin, status, email_verified, created_at, updated_at)
VALUES (
    'admin',
    'admin@localhost',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    'System Administrator',
    TRUE,
    TRUE,
    'APPROVED',
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Assign ADMIN role to the default admin user
INSERT INTO cms_user_roles (user_id, role_id)
SELECT u.id, r.id
FROM cms_users u, cms_roles r
WHERE u.username = 'admin' AND r.role_name = 'ADMIN';

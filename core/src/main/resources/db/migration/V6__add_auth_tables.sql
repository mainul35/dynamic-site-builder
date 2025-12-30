-- V6: Authentication and Authorization Tables
-- Adds JWT refresh tokens, OAuth2 connections, user approval workflow, and permissions

-- ========================================
-- Update cms_users with additional fields
-- ========================================
ALTER TABLE cms_users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'APPROVED';
ALTER TABLE cms_users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(1000);
ALTER TABLE cms_users ADD COLUMN IF NOT EXISTS locale VARCHAR(10) DEFAULT 'en';
ALTER TABLE cms_users ADD COLUMN IF NOT EXISTS timezone VARCHAR(50);
ALTER TABLE cms_users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE cms_users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);

-- Create index on status for approval workflow queries
CREATE INDEX IF NOT EXISTS idx_user_status ON cms_users(status);

-- ========================================
-- Table: cms_refresh_tokens
-- Stores refresh tokens for JWT rotation and revocation
-- ========================================
CREATE TABLE IF NOT EXISTS cms_refresh_tokens (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    token_id VARCHAR(36) NOT NULL UNIQUE,
    user_id BIGINT NOT NULL,
    token_family VARCHAR(36) NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP,
    revoked_reason VARCHAR(255),
    user_agent VARCHAR(500),
    ip_address VARCHAR(45),
    CONSTRAINT fk_refresh_token_user FOREIGN KEY (user_id) REFERENCES cms_users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_refresh_token_user ON cms_refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_token_family ON cms_refresh_tokens(token_family);
CREATE INDEX IF NOT EXISTS idx_refresh_token_expires ON cms_refresh_tokens(expires_at);

-- ========================================
-- Table: cms_oauth2_connections
-- Links CMS users to OAuth2/OIDC providers
-- ========================================
CREATE TABLE IF NOT EXISTS cms_oauth2_connections (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    provider VARCHAR(50) NOT NULL,
    provider_user_id VARCHAR(255) NOT NULL,
    provider_username VARCHAR(255),
    provider_email VARCHAR(255),
    access_token VARCHAR(2000),
    refresh_token VARCHAR(2000),
    token_expires_at TIMESTAMP,
    connected_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP,
    CONSTRAINT fk_oauth2_user FOREIGN KEY (user_id) REFERENCES cms_users(id) ON DELETE CASCADE,
    CONSTRAINT uk_provider_user UNIQUE (provider, provider_user_id)
);

CREATE INDEX IF NOT EXISTS idx_oauth2_user ON cms_oauth2_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_oauth2_provider ON cms_oauth2_connections(provider);

-- ========================================
-- Table: cms_user_approvals
-- Tracks user registration approval/rejection history
-- ========================================
CREATE TABLE IF NOT EXISTS cms_user_approvals (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    action VARCHAR(20) NOT NULL,
    performed_by BIGINT,
    reason VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_approval_user FOREIGN KEY (user_id) REFERENCES cms_users(id) ON DELETE CASCADE,
    CONSTRAINT fk_approval_admin FOREIGN KEY (performed_by) REFERENCES cms_users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_approval_user ON cms_user_approvals(user_id);
CREATE INDEX IF NOT EXISTS idx_approval_action ON cms_user_approvals(action);

-- ========================================
-- Table: cms_permissions
-- Fine-grained permissions for role-based access
-- ========================================
CREATE TABLE IF NOT EXISTS cms_permissions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    permission_name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(500),
    category VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Insert default permissions
INSERT INTO cms_permissions (permission_name, description, category, created_at) VALUES
    ('site:create', 'Create new sites', 'site', CURRENT_TIMESTAMP),
    ('site:read', 'View sites', 'site', CURRENT_TIMESTAMP),
    ('site:edit', 'Edit existing sites', 'site', CURRENT_TIMESTAMP),
    ('site:delete', 'Delete sites', 'site', CURRENT_TIMESTAMP),
    ('site:publish', 'Publish sites', 'site', CURRENT_TIMESTAMP),
    ('site:export', 'Export sites', 'site', CURRENT_TIMESTAMP),
    ('page:create', 'Create pages', 'page', CURRENT_TIMESTAMP),
    ('page:read', 'View pages', 'page', CURRENT_TIMESTAMP),
    ('page:edit', 'Edit pages', 'page', CURRENT_TIMESTAMP),
    ('page:delete', 'Delete pages', 'page', CURRENT_TIMESTAMP),
    ('page:publish', 'Publish pages', 'page', CURRENT_TIMESTAMP),
    ('component:create', 'Create components', 'component', CURRENT_TIMESTAMP),
    ('component:read', 'View components', 'component', CURRENT_TIMESTAMP),
    ('component:edit', 'Edit components', 'component', CURRENT_TIMESTAMP),
    ('content:read', 'Read content', 'content', CURRENT_TIMESTAMP),
    ('content:write', 'Write content', 'content', CURRENT_TIMESTAMP),
    ('content:delete', 'Delete content', 'content', CURRENT_TIMESTAMP),
    ('admin:users', 'Manage users', 'admin', CURRENT_TIMESTAMP),
    ('admin:users:approve', 'Approve user registrations', 'admin', CURRENT_TIMESTAMP),
    ('admin:plugins', 'Manage plugins', 'admin', CURRENT_TIMESTAMP),
    ('admin:settings', 'Manage system settings', 'admin', CURRENT_TIMESTAMP);

-- ========================================
-- Table: cms_role_permissions
-- Maps roles to permissions
-- ========================================
CREATE TABLE IF NOT EXISTS cms_role_permissions (
    role_id BIGINT NOT NULL,
    permission_id BIGINT NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    CONSTRAINT fk_role_perm_role FOREIGN KEY (role_id) REFERENCES cms_roles(id) ON DELETE CASCADE,
    CONSTRAINT fk_role_perm_perm FOREIGN KEY (permission_id) REFERENCES cms_permissions(id) ON DELETE CASCADE
);

-- ========================================
-- Add new roles: DESIGNER and VIEWER
-- ========================================
INSERT INTO cms_roles (role_name, description, created_at) VALUES
    ('DESIGNER', 'Site designer with edit access', CURRENT_TIMESTAMP),
    ('VIEWER', 'Read-only access to content', CURRENT_TIMESTAMP);

-- ========================================
-- Grant all permissions to ADMIN role
-- ========================================
INSERT INTO cms_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM cms_roles r, cms_permissions p
WHERE r.role_name = 'ADMIN';

-- ========================================
-- Grant permissions to DESIGNER role
-- ========================================
INSERT INTO cms_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM cms_roles r, cms_permissions p
WHERE r.role_name = 'DESIGNER'
  AND p.category IN ('site', 'page', 'component', 'content')
  AND p.permission_name NOT LIKE '%:delete';

-- ========================================
-- Grant read-only permissions to VIEWER role
-- ========================================
INSERT INTO cms_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM cms_roles r, cms_permissions p
WHERE r.role_name = 'VIEWER'
  AND p.permission_name LIKE '%:read';

-- ========================================
-- Table: cms_audit_log
-- Security audit trail
-- ========================================
CREATE TABLE IF NOT EXISTS cms_audit_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id VARCHAR(100),
    details TEXT,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES cms_users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_user ON cms_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON cms_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_created ON cms_audit_log(created_at);

-- ========================================
-- Create default admin user
-- Password: admin123 (BCrypt hash)
-- IMPORTANT: Change this password immediately after first login!
-- ========================================
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
INSERT INTO cms_user_roles (user_id, role_id, assigned_at)
SELECT u.id, r.id, CURRENT_TIMESTAMP
FROM cms_users u, cms_roles r
WHERE u.username = 'admin' AND r.role_name = 'ADMIN';

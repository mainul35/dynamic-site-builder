-- CMS Platform Core Tables
-- These tables support the plugin system, authentication, and marketplace functionality

-- ========================================
-- Table: cms_users
-- ========================================
CREATE TABLE IF NOT EXISTS cms_users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(200),
    is_active BOOLEAN DEFAULT TRUE,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    last_login_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_username ON cms_users(username);
CREATE INDEX IF NOT EXISTS idx_user_email ON cms_users(email);

-- ========================================
-- Table: cms_roles
-- ========================================
CREATE TABLE IF NOT EXISTS cms_roles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(500),
    created_at TIMESTAMP NOT NULL
);

-- Insert default roles
INSERT INTO cms_roles (role_name, description, created_at) VALUES
('ADMIN', 'System administrator with full access', CURRENT_TIMESTAMP),
('USER', 'Regular user with limited access', CURRENT_TIMESTAMP),
('PLUGIN_DEVELOPER', 'Plugin developer with marketplace access', CURRENT_TIMESTAMP)
ON DUPLICATE KEY UPDATE role_name = role_name;

-- ========================================
-- Table: cms_user_roles
-- ========================================
CREATE TABLE IF NOT EXISTS cms_user_roles (
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_user_role_user FOREIGN KEY (user_id) REFERENCES cms_users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_role_role FOREIGN KEY (role_id) REFERENCES cms_roles(id) ON DELETE CASCADE
);

-- ========================================
-- Table: cms_plugins
-- ========================================
CREATE TABLE IF NOT EXISTS cms_plugins (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    plugin_id VARCHAR(100) NOT NULL UNIQUE,
    plugin_name VARCHAR(200) NOT NULL,
    version VARCHAR(50) NOT NULL,
    description TEXT,
    author VARCHAR(200),
    main_class VARCHAR(500),
    plugin_type VARCHAR(50) DEFAULT 'feature',
    status VARCHAR(50) DEFAULT 'installed',
    is_bundled BOOLEAN DEFAULT FALSE,
    jar_path VARCHAR(1000),
    config_data TEXT,
    installed_at TIMESTAMP NOT NULL,
    activated_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_plugin_id ON cms_plugins(plugin_id);
CREATE INDEX IF NOT EXISTS idx_plugin_status ON cms_plugins(status);

-- ========================================
-- Table: cms_plugin_dependencies
-- ========================================
CREATE TABLE IF NOT EXISTS cms_plugin_dependencies (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    plugin_id BIGINT NOT NULL,
    depends_on_plugin_id VARCHAR(100) NOT NULL,
    min_version VARCHAR(50),
    max_version VARCHAR(50),
    is_required BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_plugin_dep_plugin FOREIGN KEY (plugin_id) REFERENCES cms_plugins(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_plugin_dep_plugin ON cms_plugin_dependencies(plugin_id);

-- ========================================
-- Table: cms_content_types
-- ========================================
CREATE TABLE IF NOT EXISTS cms_content_types (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    type_name VARCHAR(100) NOT NULL UNIQUE,
    plugin_id VARCHAR(100) NOT NULL,
    display_name VARCHAR(200),
    description TEXT,
    icon VARCHAR(100),
    supports_versioning BOOLEAN DEFAULT FALSE,
    supports_comments BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_content_type_plugin ON cms_content_types(plugin_id);

-- ========================================
-- Table: cms_themes
-- ========================================
CREATE TABLE IF NOT EXISTS cms_themes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    theme_name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(200),
    description TEXT,
    css_variables TEXT,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP
);

-- Insert default theme
INSERT INTO cms_themes (theme_name, display_name, description, is_active, created_at, updated_at) VALUES
('default', 'Default Theme', 'Default light theme', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON DUPLICATE KEY UPDATE theme_name = theme_name;

-- ========================================
-- Table: cms_marketplace_plugins
-- ========================================
CREATE TABLE IF NOT EXISTS cms_marketplace_plugins (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    plugin_id VARCHAR(100) NOT NULL UNIQUE,
    plugin_name VARCHAR(200) NOT NULL,
    author VARCHAR(200),
    description TEXT,
    latest_version VARCHAR(50),
    download_url VARCHAR(1000),
    icon_url VARCHAR(1000),
    homepage_url VARCHAR(1000),
    price DECIMAL(10, 2) DEFAULT 0.00,
    is_premium BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    download_count INT DEFAULT 0,
    rating DECIMAL(3, 2) DEFAULT 0.00,
    published_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_marketplace_plugin_id ON cms_marketplace_plugins(plugin_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_is_premium ON cms_marketplace_plugins(is_premium);

-- ========================================
-- Table: cms_plugin_subscriptions
-- ========================================
CREATE TABLE IF NOT EXISTS cms_plugin_subscriptions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    marketplace_plugin_id BIGINT NOT NULL,
    subscription_type VARCHAR(50) DEFAULT 'one_time',
    status VARCHAR(50) DEFAULT 'active',
    purchased_at TIMESTAMP NOT NULL,
    expires_at TIMESTAMP,
    amount_paid DECIMAL(10, 2),
    transaction_id VARCHAR(255),
    CONSTRAINT fk_subscription_user FOREIGN KEY (user_id) REFERENCES cms_users(id) ON DELETE CASCADE,
    CONSTRAINT fk_subscription_plugin FOREIGN KEY (marketplace_plugin_id) REFERENCES cms_marketplace_plugins(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_subscription_user ON cms_plugin_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_plugin ON cms_plugin_subscriptions(marketplace_plugin_id);
CREATE INDEX IF NOT EXISTS idx_subscription_status ON cms_plugin_subscriptions(status);

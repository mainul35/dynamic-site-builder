-- ========================================
-- Visual Site Builder Platform
-- Migration V4: Add site builder tables
-- ========================================

-- ========================================
-- Table: cms_sites
-- Represents a site created by the builder
-- ========================================
CREATE TABLE IF NOT EXISTS cms_sites (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    site_name VARCHAR(200) NOT NULL,
    site_slug VARCHAR(200) NOT NULL UNIQUE,
    site_mode VARCHAR(50) NOT NULL DEFAULT 'single_page', -- 'single_page', 'multi_page', 'full_site'
    description TEXT,
    owner_user_id BIGINT NOT NULL,
    is_published BOOLEAN DEFAULT FALSE,
    domain_name VARCHAR(255),
    favicon_url VARCHAR(500),
    metadata JSON, -- SEO metadata, analytics, etc.
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    published_at TIMESTAMP,
    CONSTRAINT fk_site_owner FOREIGN KEY (owner_user_id) REFERENCES cms_users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_site_slug ON cms_sites(site_slug);
CREATE INDEX IF NOT EXISTS idx_site_owner ON cms_sites(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_site_published ON cms_sites(is_published);

-- ========================================
-- Table: cms_pages
-- Individual pages within a site
-- ========================================
CREATE TABLE IF NOT EXISTS cms_pages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    site_id BIGINT NOT NULL,
    page_name VARCHAR(200) NOT NULL,
    page_slug VARCHAR(200) NOT NULL,
    page_type VARCHAR(50) DEFAULT 'standard', -- 'standard', 'template', 'homepage'
    title VARCHAR(500), -- Page title for SEO
    description TEXT, -- Meta description
    route_path VARCHAR(500), -- e.g., "/about", "/products/:id"
    parent_page_id BIGINT, -- For hierarchical pages
    display_order INT DEFAULT 0,
    is_published BOOLEAN DEFAULT FALSE,
    layout_id BIGINT, -- Shared layout reference
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    published_at TIMESTAMP,
    CONSTRAINT fk_page_site FOREIGN KEY (site_id) REFERENCES cms_sites(id) ON DELETE CASCADE,
    CONSTRAINT fk_page_parent FOREIGN KEY (parent_page_id) REFERENCES cms_pages(id) ON DELETE SET NULL,
    CONSTRAINT uk_site_page_slug UNIQUE (site_id, page_slug)
);

CREATE INDEX IF NOT EXISTS idx_page_site ON cms_pages(site_id);
CREATE INDEX IF NOT EXISTS idx_page_slug ON cms_pages(site_id, page_slug);
CREATE INDEX IF NOT EXISTS idx_page_route ON cms_pages(route_path);
CREATE INDEX IF NOT EXISTS idx_page_parent ON cms_pages(parent_page_id);

-- ========================================
-- Table: cms_page_versions
-- Version history for pages (undo/redo, rollback)
-- ========================================
CREATE TABLE IF NOT EXISTS cms_page_versions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    page_id BIGINT NOT NULL,
    version_number INT NOT NULL,
    page_definition JSON NOT NULL, -- Complete page structure
    change_description VARCHAR(500),
    created_by_user_id BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_version_page FOREIGN KEY (page_id) REFERENCES cms_pages(id) ON DELETE CASCADE,
    CONSTRAINT fk_version_user FOREIGN KEY (created_by_user_id) REFERENCES cms_users(id) ON DELETE SET NULL,
    CONSTRAINT uk_page_version UNIQUE (page_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_version_page ON cms_page_versions(page_id);
CREATE INDEX IF NOT EXISTS idx_version_active ON cms_page_versions(page_id, is_active);

-- ========================================
-- Table: cms_page_components
-- Components placed on a page (denormalized for performance)
-- ========================================
CREATE TABLE IF NOT EXISTS cms_page_components (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    page_id BIGINT NOT NULL,
    component_id VARCHAR(100) NOT NULL, -- References plugin component
    plugin_id VARCHAR(100) NOT NULL,
    instance_id VARCHAR(100) NOT NULL, -- Unique instance identifier
    parent_instance_id VARCHAR(100), -- For nested components

    -- Grid positioning
    grid_row INT,
    grid_column INT,
    grid_row_span INT DEFAULT 1,
    grid_column_span INT DEFAULT 1,

    -- Size
    width VARCHAR(50),
    height VARCHAR(50),

    -- Component data
    props JSON, -- Component properties
    styles JSON, -- CSS styles

    -- Ordering and visibility
    z_index INT DEFAULT 0,
    display_order INT DEFAULT 0,
    is_visible BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_component_page FOREIGN KEY (page_id) REFERENCES cms_pages(id) ON DELETE CASCADE,
    CONSTRAINT uk_component_instance UNIQUE (page_id, instance_id)
);

CREATE INDEX IF NOT EXISTS idx_component_page ON cms_page_components(page_id);
CREATE INDEX IF NOT EXISTS idx_component_plugin ON cms_page_components(plugin_id, component_id);
CREATE INDEX IF NOT EXISTS idx_component_parent ON cms_page_components(parent_instance_id);
CREATE INDEX IF NOT EXISTS idx_component_order ON cms_page_components(page_id, display_order);

-- ========================================
-- Table: cms_layouts
-- Shared layouts (headers, footers, sidebars)
-- ========================================
CREATE TABLE IF NOT EXISTS cms_layouts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    site_id BIGINT NOT NULL,
    layout_name VARCHAR(200) NOT NULL,
    layout_type VARCHAR(50) DEFAULT 'full', -- 'full', 'header', 'footer', 'sidebar'
    layout_definition JSON NOT NULL, -- Component structure
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_layout_site FOREIGN KEY (site_id) REFERENCES cms_sites(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_layout_site ON cms_layouts(site_id);
CREATE INDEX IF NOT EXISTS idx_layout_default ON cms_layouts(site_id, is_default);

-- ========================================
-- Table: cms_global_styles
-- Site-wide CSS variables and themes
-- ========================================
CREATE TABLE IF NOT EXISTS cms_global_styles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    site_id BIGINT NOT NULL,
    style_name VARCHAR(200) NOT NULL,
    css_variables JSON, -- CSS custom properties
    global_css TEXT, -- Raw CSS
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_global_style_site FOREIGN KEY (site_id) REFERENCES cms_sites(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_global_style_site ON cms_global_styles(site_id);
CREATE INDEX IF NOT EXISTS idx_global_style_active ON cms_global_styles(site_id, is_active);

-- ========================================
-- Table: cms_navigation_menus
-- Navigation structures for multi-page sites
-- ========================================
CREATE TABLE IF NOT EXISTS cms_navigation_menus (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    site_id BIGINT NOT NULL,
    menu_name VARCHAR(200) NOT NULL,
    menu_type VARCHAR(50) DEFAULT 'header', -- 'header', 'footer', 'sidebar', 'custom'
    menu_items JSON NOT NULL, -- Hierarchical menu structure
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_nav_menu_site FOREIGN KEY (site_id) REFERENCES cms_navigation_menus(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_nav_menu_site ON cms_navigation_menus(site_id);
CREATE INDEX IF NOT EXISTS idx_nav_menu_active ON cms_navigation_menus(site_id, is_active);

-- ========================================
-- Table: cms_component_registry
-- Registry of all available UI components from plugins
-- ========================================
CREATE TABLE IF NOT EXISTS cms_component_registry (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    plugin_id VARCHAR(100) NOT NULL,
    component_id VARCHAR(100) NOT NULL,
    component_name VARCHAR(200) NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'ui', 'layout', 'form', 'widget'
    icon VARCHAR(100),
    component_manifest JSON NOT NULL, -- Full manifest data
    react_bundle_path VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    registered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_component_registry UNIQUE (plugin_id, component_id)
);

CREATE INDEX IF NOT EXISTS idx_component_registry_plugin ON cms_component_registry(plugin_id);
CREATE INDEX IF NOT EXISTS idx_component_registry_category ON cms_component_registry(category);
CREATE INDEX IF NOT EXISTS idx_component_registry_active ON cms_component_registry(is_active);

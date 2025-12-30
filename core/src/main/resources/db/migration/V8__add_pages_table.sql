-- V8: Add pages table for site pages

CREATE TABLE IF NOT EXISTS pages (
    id BIGSERIAL PRIMARY KEY,
    site_id BIGINT NOT NULL,
    page_name VARCHAR(100) NOT NULL,
    page_slug VARCHAR(100) NOT NULL,
    page_type VARCHAR(20) NOT NULL DEFAULT 'STANDARD',
    title VARCHAR(200),
    description TEXT,
    route_path VARCHAR(255),
    parent_page_id BIGINT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    layout_id BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP,

    CONSTRAINT fk_pages_site FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
    CONSTRAINT fk_pages_parent FOREIGN KEY (parent_page_id) REFERENCES pages(id) ON DELETE SET NULL,
    CONSTRAINT uk_pages_site_slug UNIQUE (site_id, page_slug)
);

-- Create indexes for pages
CREATE INDEX IF NOT EXISTS idx_pages_site ON pages(site_id);
CREATE INDEX IF NOT EXISTS idx_pages_parent ON pages(parent_page_id);
CREATE INDEX IF NOT EXISTS idx_pages_site_slug ON pages(site_id, page_slug);
CREATE INDEX IF NOT EXISTS idx_pages_display_order ON pages(site_id, display_order);

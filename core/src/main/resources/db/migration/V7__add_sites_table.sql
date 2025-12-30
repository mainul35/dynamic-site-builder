-- V7: Add sites table for multi-site support

CREATE TABLE IF NOT EXISTS sites (
    id BIGSERIAL PRIMARY KEY,
    site_name VARCHAR(100) NOT NULL,
    site_slug VARCHAR(100) NOT NULL UNIQUE,
    site_mode VARCHAR(20) NOT NULL DEFAULT 'MULTI_PAGE',
    description TEXT,
    owner_user_id BIGINT NOT NULL,
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    domain_name VARCHAR(255),
    favicon_url VARCHAR(500),
    metadata TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP,

    CONSTRAINT fk_sites_owner FOREIGN KEY (owner_user_id) REFERENCES users(id)
);

-- Create indexes for sites
CREATE INDEX IF NOT EXISTS idx_sites_owner ON sites(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_sites_slug ON sites(site_slug);
CREATE INDEX IF NOT EXISTS idx_sites_published ON sites(is_published);

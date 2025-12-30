package dev.mainul35.cms.sitebuilder.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Entity representing a site in the CMS.
 * A site contains multiple pages and has its own configuration.
 */
@Entity
@Table(name = "sites")
public class Site {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Display name of the site
     */
    @Column(nullable = false)
    private String siteName;

    /**
     * URL-friendly slug for the site
     */
    @Column(nullable = false, unique = true)
    private String siteSlug;

    /**
     * Site mode: single_page, multi_page, or full_site
     */
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private SiteMode siteMode = SiteMode.MULTI_PAGE;

    /**
     * Site description
     */
    @Column(columnDefinition = "TEXT")
    private String description;

    /**
     * Owner user ID
     */
    @Column(nullable = false)
    private Long ownerUserId;

    /**
     * Whether the site is published
     */
    @Column(nullable = false)
    private boolean isPublished = false;

    /**
     * Custom domain name
     */
    @Column
    private String domainName;

    /**
     * Favicon URL
     */
    @Column
    private String faviconUrl;

    /**
     * Additional metadata as JSON
     */
    @Column(columnDefinition = "TEXT")
    private String metadata;

    /**
     * Creation timestamp
     */
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * Last update timestamp
     */
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    /**
     * Publish timestamp
     */
    @Column
    private LocalDateTime publishedAt;

    public enum SiteMode {
        SINGLE_PAGE,
        MULTI_PAGE,
        FULL_SITE
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Getters and setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getSiteName() {
        return siteName;
    }

    public void setSiteName(String siteName) {
        this.siteName = siteName;
    }

    public String getSiteSlug() {
        return siteSlug;
    }

    public void setSiteSlug(String siteSlug) {
        this.siteSlug = siteSlug;
    }

    public SiteMode getSiteMode() {
        return siteMode;
    }

    public void setSiteMode(SiteMode siteMode) {
        this.siteMode = siteMode;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Long getOwnerUserId() {
        return ownerUserId;
    }

    public void setOwnerUserId(Long ownerUserId) {
        this.ownerUserId = ownerUserId;
    }

    public boolean isPublished() {
        return isPublished;
    }

    public void setPublished(boolean published) {
        isPublished = published;
    }

    public String getDomainName() {
        return domainName;
    }

    public void setDomainName(String domainName) {
        this.domainName = domainName;
    }

    public String getFaviconUrl() {
        return faviconUrl;
    }

    public void setFaviconUrl(String faviconUrl) {
        this.faviconUrl = faviconUrl;
    }

    public String getMetadata() {
        return metadata;
    }

    public void setMetadata(String metadata) {
        this.metadata = metadata;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public LocalDateTime getPublishedAt() {
        return publishedAt;
    }

    public void setPublishedAt(LocalDateTime publishedAt) {
        this.publishedAt = publishedAt;
    }

    @Override
    public String toString() {
        return "Site{" +
                "id=" + id +
                ", siteName='" + siteName + '\'' +
                ", siteSlug='" + siteSlug + '\'' +
                ", siteMode=" + siteMode +
                ", isPublished=" + isPublished +
                '}';
    }
}

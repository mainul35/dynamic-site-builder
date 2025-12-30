package dev.mainul35.cms.sitebuilder.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import dev.mainul35.cms.sitebuilder.entity.Site;
import java.time.LocalDateTime;
import java.util.Map;

/**
 * DTO for Site responses
 */
public class SiteDto {
    private Long id;
    private String siteName;
    private String siteSlug;
    private String siteMode;
    private String description;
    private Long ownerUserId;

    @JsonProperty("isPublished")
    private boolean isPublished;

    private String domainName;
    private String faviconUrl;
    private Map<String, Object> metadata;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime publishedAt;

    public SiteDto() {}

    public static SiteDto fromEntity(Site site) {
        SiteDto dto = new SiteDto();
        dto.setId(site.getId());
        dto.setSiteName(site.getSiteName());
        dto.setSiteSlug(site.getSiteSlug());
        dto.setSiteMode(site.getSiteMode().name().toLowerCase());
        dto.setDescription(site.getDescription());
        dto.setOwnerUserId(site.getOwnerUserId());
        dto.setPublished(site.isPublished());
        dto.setDomainName(site.getDomainName());
        dto.setFaviconUrl(site.getFaviconUrl());
        dto.setCreatedAt(site.getCreatedAt());
        dto.setUpdatedAt(site.getUpdatedAt());
        dto.setPublishedAt(site.getPublishedAt());
        return dto;
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

    public String getSiteMode() {
        return siteMode;
    }

    public void setSiteMode(String siteMode) {
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

    public Map<String, Object> getMetadata() {
        return metadata;
    }

    public void setMetadata(Map<String, Object> metadata) {
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
}

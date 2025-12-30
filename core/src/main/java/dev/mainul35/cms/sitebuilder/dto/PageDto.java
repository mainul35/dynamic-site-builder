package dev.mainul35.cms.sitebuilder.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import dev.mainul35.cms.sitebuilder.entity.Page;
import java.time.LocalDateTime;

/**
 * DTO for Page responses
 */
public class PageDto {
    private Long id;
    private Long siteId;
    private String pageName;
    private String pageSlug;
    private String pageType;
    private String title;
    private String description;
    private String routePath;
    private Long parentPageId;
    private Integer displayOrder;

    @JsonProperty("isPublished")
    private boolean isPublished;

    private Long layoutId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime publishedAt;

    public PageDto() {}

    public static PageDto fromEntity(Page page) {
        PageDto dto = new PageDto();
        dto.setId(page.getId());
        dto.setSiteId(page.getSite() != null ? page.getSite().getId() : null);
        dto.setPageName(page.getPageName());
        dto.setPageSlug(page.getPageSlug());
        dto.setPageType(page.getPageType().name().toLowerCase());
        dto.setTitle(page.getTitle());
        dto.setDescription(page.getDescription());
        dto.setRoutePath(page.getRoutePath());
        dto.setParentPageId(page.getParentPage() != null ? page.getParentPage().getId() : null);
        dto.setDisplayOrder(page.getDisplayOrder());
        dto.setPublished(page.isPublished());
        dto.setLayoutId(page.getLayoutId());
        dto.setCreatedAt(page.getCreatedAt());
        dto.setUpdatedAt(page.getUpdatedAt());
        dto.setPublishedAt(page.getPublishedAt());
        return dto;
    }

    // Getters and setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getSiteId() {
        return siteId;
    }

    public void setSiteId(Long siteId) {
        this.siteId = siteId;
    }

    public String getPageName() {
        return pageName;
    }

    public void setPageName(String pageName) {
        this.pageName = pageName;
    }

    public String getPageSlug() {
        return pageSlug;
    }

    public void setPageSlug(String pageSlug) {
        this.pageSlug = pageSlug;
    }

    public String getPageType() {
        return pageType;
    }

    public void setPageType(String pageType) {
        this.pageType = pageType;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getRoutePath() {
        return routePath;
    }

    public void setRoutePath(String routePath) {
        this.routePath = routePath;
    }

    public Long getParentPageId() {
        return parentPageId;
    }

    public void setParentPageId(Long parentPageId) {
        this.parentPageId = parentPageId;
    }

    public Integer getDisplayOrder() {
        return displayOrder;
    }

    public void setDisplayOrder(Integer displayOrder) {
        this.displayOrder = displayOrder;
    }

    public boolean isPublished() {
        return isPublished;
    }

    public void setPublished(boolean published) {
        isPublished = published;
    }

    public Long getLayoutId() {
        return layoutId;
    }

    public void setLayoutId(Long layoutId) {
        this.layoutId = layoutId;
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

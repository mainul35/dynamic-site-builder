package dev.mainul35.cms.sitebuilder.dto;

import dev.mainul35.cms.sitebuilder.entity.PageVersion;

import java.time.LocalDateTime;

/**
 * DTO for PageVersion entity
 */
public class PageVersionDto {

    private Long id;
    private Long pageId;
    private Integer versionNumber;
    private String pageDefinition;
    private String changeDescription;
    private Long createdByUserId;
    private LocalDateTime createdAt;
    private boolean isActive;

    public PageVersionDto() {
    }

    public PageVersionDto(Long id, Long pageId, Integer versionNumber, String pageDefinition,
                          String changeDescription, Long createdByUserId, LocalDateTime createdAt, boolean isActive) {
        this.id = id;
        this.pageId = pageId;
        this.versionNumber = versionNumber;
        this.pageDefinition = pageDefinition;
        this.changeDescription = changeDescription;
        this.createdByUserId = createdByUserId;
        this.createdAt = createdAt;
        this.isActive = isActive;
    }

    /**
     * Convert entity to DTO
     */
    public static PageVersionDto fromEntity(PageVersion entity) {
        if (entity == null) return null;

        PageVersionDto dto = new PageVersionDto();
        dto.setId(entity.getId());
        dto.setPageId(entity.getPage() != null ? entity.getPage().getId() : null);
        dto.setVersionNumber(entity.getVersionNumber());
        dto.setPageDefinition(entity.getPageDefinition());
        dto.setChangeDescription(entity.getChangeDescription());
        dto.setCreatedByUserId(entity.getCreatedByUserId());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setActive(entity.isActive());
        return dto;
    }

    // Getters and setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getPageId() {
        return pageId;
    }

    public void setPageId(Long pageId) {
        this.pageId = pageId;
    }

    public Integer getVersionNumber() {
        return versionNumber;
    }

    public void setVersionNumber(Integer versionNumber) {
        this.versionNumber = versionNumber;
    }

    public String getPageDefinition() {
        return pageDefinition;
    }

    public void setPageDefinition(String pageDefinition) {
        this.pageDefinition = pageDefinition;
    }

    public String getChangeDescription() {
        return changeDescription;
    }

    public void setChangeDescription(String changeDescription) {
        this.changeDescription = changeDescription;
    }

    public Long getCreatedByUserId() {
        return createdByUserId;
    }

    public void setCreatedByUserId(Long createdByUserId) {
        this.createdByUserId = createdByUserId;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public boolean isActive() {
        return isActive;
    }

    public void setActive(boolean active) {
        isActive = active;
    }
}

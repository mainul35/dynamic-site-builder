package dev.mainul35.cms.sitebuilder.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Entity representing a version of a page in the site builder.
 * Each page can have multiple versions for history tracking and rollback.
 */
@Entity
@Table(name = "cms_page_versions")
public class PageVersion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * The page this version belongs to
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "page_id", nullable = false)
    private Page page;

    /**
     * Version number (auto-incremented per page)
     */
    @Column(name = "version_number", nullable = false)
    private Integer versionNumber;

    /**
     * Complete page definition as JSON
     * Contains grid config, components, global styles
     */
    @Column(name = "page_definition", columnDefinition = "TEXT", nullable = false)
    private String pageDefinition;

    /**
     * Description of changes in this version
     */
    @Column(name = "change_description", length = 500)
    private String changeDescription;

    /**
     * User who created this version
     */
    @Column(name = "created_by_user_id")
    private Long createdByUserId;

    /**
     * Creation timestamp
     */
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * Whether this is the currently active version
     */
    @Column(name = "is_active", nullable = false)
    private boolean isActive = false;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    // Getters and setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Page getPage() {
        return page;
    }

    public void setPage(Page page) {
        this.page = page;
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

    @Override
    public String toString() {
        return "PageVersion{" +
                "id=" + id +
                ", pageId=" + (page != null ? page.getId() : null) +
                ", versionNumber=" + versionNumber +
                ", isActive=" + isActive +
                ", createdAt=" + createdAt +
                '}';
    }
}

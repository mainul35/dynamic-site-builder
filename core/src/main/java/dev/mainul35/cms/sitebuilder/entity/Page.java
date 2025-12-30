package dev.mainul35.cms.sitebuilder.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Entity representing a page within a site.
 * Pages can be hierarchical (parent-child relationships).
 */
@Entity
@Table(name = "pages")
public class Page {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * The site this page belongs to
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "site_id", nullable = false)
    private Site site;

    /**
     * Display name of the page
     */
    @Column(nullable = false)
    private String pageName;

    /**
     * URL-friendly slug for the page
     */
    @Column(nullable = false)
    private String pageSlug;

    /**
     * Page type: standard, template, homepage
     */
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private PageType pageType = PageType.STANDARD;

    /**
     * SEO title
     */
    @Column
    private String title;

    /**
     * SEO description
     */
    @Column(columnDefinition = "TEXT")
    private String description;

    /**
     * Route path for the page (e.g., "/", "/about", "/products/item")
     */
    @Column
    private String routePath;

    /**
     * Parent page for hierarchical structure
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_page_id")
    private Page parentPage;

    /**
     * Display order among siblings
     */
    @Column(nullable = false)
    private Integer displayOrder = 0;

    /**
     * Whether the page is published
     */
    @Column(nullable = false)
    private boolean isPublished = false;

    /**
     * Layout ID (optional, for layout templates)
     */
    @Column
    private Long layoutId;

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

    /**
     * Page versions for history tracking
     */
    @OneToMany(mappedBy = "page", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PageVersion> versions = new ArrayList<>();

    public enum PageType {
        STANDARD,
        TEMPLATE,
        HOMEPAGE
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

    public Site getSite() {
        return site;
    }

    public void setSite(Site site) {
        this.site = site;
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

    public PageType getPageType() {
        return pageType;
    }

    public void setPageType(PageType pageType) {
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

    public Page getParentPage() {
        return parentPage;
    }

    public void setParentPage(Page parentPage) {
        this.parentPage = parentPage;
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

    public List<PageVersion> getVersions() {
        return versions;
    }

    public void setVersions(List<PageVersion> versions) {
        this.versions = versions;
    }

    @Override
    public String toString() {
        return "Page{" +
                "id=" + id +
                ", pageName='" + pageName + '\'' +
                ", pageSlug='" + pageSlug + '\'' +
                ", pageType=" + pageType +
                ", isPublished=" + isPublished +
                '}';
    }
}

package dev.mainul35.flashcardapp.sitebuilder.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Entity representing a page definition in the site builder.
 * Stores the complete page configuration including components and data sources.
 */
@Entity
@Table(name = "page_definitions")
public class PageDefinition {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Unique page name/slug (e.g., "home", "about", "products")
     */
    @Column(nullable = false, unique = true)
    private String pageName;

    /**
     * Display title for the page
     */
    @Column
    private String title;

    /**
     * Page description (for SEO)
     */
    @Column(columnDefinition = "TEXT")
    private String description;

    /**
     * URL path for the page (e.g., "/", "/about", "/products")
     */
    @Column
    private String path;

    /**
     * Complete page definition as JSON
     * Contains grid config, components, global styles
     */
    @Column(columnDefinition = "TEXT")
    private String pageDefinitionJson;

    /**
     * Data sources configuration as JSON
     * Contains named data source configs for data binding
     */
    @Column(columnDefinition = "TEXT")
    private String dataSources;

    /**
     * Whether the page is published
     */
    @Column(nullable = false)
    private boolean published = false;

    /**
     * Version number for optimistic locking
     */
    @Version
    private Integer version;

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
     * Created by user ID
     */
    @Column
    private String createdBy;

    /**
     * Last updated by user ID
     */
    @Column
    private String updatedBy;

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

    public String getPageName() {
        return pageName;
    }

    public void setPageName(String pageName) {
        this.pageName = pageName;
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

    public String getPath() {
        return path;
    }

    public void setPath(String path) {
        this.path = path;
    }

    public String getPageDefinitionJson() {
        return pageDefinitionJson;
    }

    public void setPageDefinitionJson(String pageDefinitionJson) {
        this.pageDefinitionJson = pageDefinitionJson;
    }

    public String getDataSources() {
        return dataSources;
    }

    public void setDataSources(String dataSources) {
        this.dataSources = dataSources;
    }

    public boolean isPublished() {
        return published;
    }

    public void setPublished(boolean published) {
        this.published = published;
    }

    public Integer getVersion() {
        return version;
    }

    public void setVersion(Integer version) {
        this.version = version;
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

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public String getUpdatedBy() {
        return updatedBy;
    }

    public void setUpdatedBy(String updatedBy) {
        this.updatedBy = updatedBy;
    }

    @Override
    public String toString() {
        return "PageDefinition{" +
                "id=" + id +
                ", pageName='" + pageName + '\'' +
                ", title='" + title + '\'' +
                ", path='" + path + '\'' +
                ", published=" + published +
                '}';
    }
}

package dev.mainul35.cms.sitebuilder.repository;

import dev.mainul35.cms.sitebuilder.entity.Page;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for Page entity
 */
@Repository
public interface PageRepository extends JpaRepository<Page, Long> {

    /**
     * Find all pages for a site, ordered by display order
     */
    List<Page> findBySiteIdOrderByDisplayOrderAsc(Long siteId);

    /**
     * Find a page by site ID and page ID
     */
    Optional<Page> findByIdAndSiteId(Long id, Long siteId);

    /**
     * Find a page by site ID and slug
     */
    Optional<Page> findBySiteIdAndPageSlug(Long siteId, String pageSlug);

    /**
     * Find root pages (no parent) for a site
     */
    List<Page> findBySiteIdAndParentPageIsNullOrderByDisplayOrderAsc(Long siteId);

    /**
     * Find child pages of a parent
     */
    List<Page> findByParentPageIdOrderByDisplayOrderAsc(Long parentPageId);

    /**
     * Find the homepage for a site
     */
    Optional<Page> findBySiteIdAndPageType(Long siteId, Page.PageType pageType);

    /**
     * Check if a slug exists for a site
     */
    boolean existsBySiteIdAndPageSlug(Long siteId, String pageSlug);

    /**
     * Check if a slug exists for a site (excluding a specific page)
     */
    boolean existsBySiteIdAndPageSlugAndIdNot(Long siteId, String pageSlug, Long pageId);

    /**
     * Count pages in a site
     */
    long countBySiteId(Long siteId);

    /**
     * Get max display order for root pages in a site
     */
    @Query("SELECT COALESCE(MAX(p.displayOrder), 0) FROM Page p WHERE p.site.id = :siteId AND p.parentPage IS NULL")
    Integer findMaxDisplayOrderForRootPages(@Param("siteId") Long siteId);

    /**
     * Get max display order for child pages of a parent
     */
    @Query("SELECT COALESCE(MAX(p.displayOrder), 0) FROM Page p WHERE p.parentPage.id = :parentId")
    Integer findMaxDisplayOrderForChildren(@Param("parentId") Long parentId);

    /**
     * Delete all pages for a site
     */
    void deleteBySiteId(Long siteId);
}

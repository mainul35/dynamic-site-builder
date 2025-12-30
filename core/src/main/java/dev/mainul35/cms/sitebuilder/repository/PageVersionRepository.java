package dev.mainul35.cms.sitebuilder.repository;

import dev.mainul35.cms.sitebuilder.entity.PageVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for page version operations.
 */
@Repository
public interface PageVersionRepository extends JpaRepository<PageVersion, Long> {

    /**
     * Find all versions for a page, ordered by version number descending (newest first)
     */
    List<PageVersion> findByPageIdOrderByVersionNumberDesc(Long pageId);

    /**
     * Find the currently active version for a page
     */
    Optional<PageVersion> findByPageIdAndIsActiveTrue(Long pageId);

    /**
     * Find the latest version for a page (by version number)
     */
    Optional<PageVersion> findTopByPageIdOrderByVersionNumberDesc(Long pageId);

    /**
     * Count total versions for a page
     */
    long countByPageId(Long pageId);

    /**
     * Find a specific version by page ID and version number
     */
    Optional<PageVersion> findByPageIdAndVersionNumber(Long pageId, Integer versionNumber);

    /**
     * Find a specific version by ID and ensure it belongs to the given page
     */
    Optional<PageVersion> findByIdAndPageId(Long id, Long pageId);

    /**
     * Deactivate all versions for a page (used before setting a new active version)
     */
    @Modifying
    @Query("UPDATE PageVersion v SET v.isActive = false WHERE v.page.id = :pageId")
    void deactivateAllVersionsForPage(@Param("pageId") Long pageId);

    /**
     * Delete all versions for a page
     */
    void deleteByPageId(Long pageId);

    /**
     * Get the maximum version number for a page
     */
    @Query("SELECT COALESCE(MAX(v.versionNumber), 0) FROM PageVersion v WHERE v.page.id = :pageId")
    Integer findMaxVersionNumberByPageId(@Param("pageId") Long pageId);
}

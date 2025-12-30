package dev.mainul35.cms.sitebuilder.repository;

import dev.mainul35.cms.sitebuilder.entity.Site;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for Site entity
 */
@Repository
public interface SiteRepository extends JpaRepository<Site, Long> {

    /**
     * Find site by slug
     */
    Optional<Site> findBySiteSlug(String siteSlug);

    /**
     * Find all sites owned by a user
     */
    List<Site> findByOwnerUserId(Long ownerUserId);

    /**
     * Find all published sites
     */
    List<Site> findByIsPublishedTrue();

    /**
     * Find all sites owned by a user, ordered by updated date
     */
    List<Site> findByOwnerUserIdOrderByUpdatedAtDesc(Long ownerUserId);

    /**
     * Check if a site slug exists
     */
    boolean existsBySiteSlug(String siteSlug);

    /**
     * Check if a site slug exists for a different site
     */
    boolean existsBySiteSlugAndIdNot(String siteSlug, Long id);
}

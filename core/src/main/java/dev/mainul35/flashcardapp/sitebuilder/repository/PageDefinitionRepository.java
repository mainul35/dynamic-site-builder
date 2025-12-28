package dev.mainul35.flashcardapp.sitebuilder.repository;

import dev.mainul35.flashcardapp.sitebuilder.entity.PageDefinition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for page definition operations.
 */
@Repository
public interface PageDefinitionRepository extends JpaRepository<PageDefinition, Long> {

    /**
     * Find page by unique name/slug
     */
    Optional<PageDefinition> findByPageName(String pageName);

    /**
     * Find page by URL path
     */
    Optional<PageDefinition> findByPath(String path);

    /**
     * Find all published pages
     */
    List<PageDefinition> findByPublishedTrue();

    /**
     * Find all pages created by a specific user
     */
    List<PageDefinition> findByCreatedBy(String createdBy);

    /**
     * Check if a page name exists
     */
    boolean existsByPageName(String pageName);

    /**
     * Check if a path exists
     */
    boolean existsByPath(String path);
}

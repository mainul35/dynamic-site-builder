package dev.mainul35.plugins.label.repository;

import dev.mainul35.plugins.entities.label.DynamicLabel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for DynamicLabel entity.
 * Provides database access for dynamic label content.
 */
@Repository
public interface DynamicLabelRepository extends JpaRepository<DynamicLabel, Long> {

    /**
     * Find a label by its content key and language
     */
    Optional<DynamicLabel> findByContentKeyAndLanguageAndActiveTrue(String contentKey, String language);

    /**
     * Find a label by its content key (any language, defaults to first found)
     */
    Optional<DynamicLabel> findFirstByContentKeyAndActiveTrue(String contentKey);

    /**
     * Find all labels for a specific language
     */
    List<DynamicLabel> findAllByLanguageAndActiveTrue(String language);

    /**
     * Find all active labels
     */
    List<DynamicLabel> findAllByActiveTrue();

    /**
     * Find label with fallback: first try exact language, then fall back to 'en'
     */
    @Query("SELECT d FROM DynamicLabel d WHERE d.contentKey = :key AND d.active = true " +
           "AND (d.language = :lang OR d.language = 'en') " +
           "ORDER BY CASE WHEN d.language = :lang THEN 0 ELSE 1 END")
    List<DynamicLabel> findByContentKeyWithFallback(@Param("key") String contentKey, @Param("lang") String language);

    /**
     * Check if a content key exists
     */
    boolean existsByContentKeyAndLanguage(String contentKey, String language);

    /**
     * Find all labels by plugin ID
     */
    List<DynamicLabel> findAllByPluginId(String pluginId);
}

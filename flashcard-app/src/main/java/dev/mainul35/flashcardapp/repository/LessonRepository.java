package dev.mainul35.flashcardapp.repository;

import dev.mainul35.flashcardapp.entity.Lesson;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LessonRepository extends JpaRepository<Lesson, Long> {

    /**
     * Find all lessons in a module ordered by display order
     */
    List<Lesson> findByModuleIdOrderByDisplayOrderAsc(Long moduleId);

    /**
     * Find lesson by ID with flashcards eagerly loaded
     */
    @Query("SELECT l FROM Lesson l LEFT JOIN FETCH l.flashcards WHERE l.id = :id")
    Optional<Lesson> findByIdWithFlashcards(Long id);

    /**
     * Find lesson by ID with media eagerly loaded
     */
    @Query("SELECT l FROM Lesson l LEFT JOIN FETCH l.media WHERE l.id = :id")
    Optional<Lesson> findByIdWithMedia(Long id);

    /**
     * Count lessons in a module
     */
    Long countByModuleId(Long moduleId);

    /**
     * Search lessons by title (case-insensitive)
     */
    List<Lesson> findByTitleContainingIgnoreCase(String keyword);

    /**
     * Delete all lessons in a module
     */
    void deleteByModuleId(Long moduleId);
}

package dev.mainul35.flashcardapp.repository;

import dev.mainul35.flashcardapp.entity.Module;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ModuleRepository extends JpaRepository<Module, Long> {

    /**
     * Find all modules ordered by display order ascending
     */
    List<Module> findAllByOrderByDisplayOrderAsc();

    /**
     * Find modules by course ID ordered by display order ascending
     */
    List<Module> findByCourseIdOrderByDisplayOrderAsc(Long courseId);

    /**
     * Find module by ID with lessons eagerly loaded (avoid N+1 queries)
     */
    @Query("SELECT m FROM Module m LEFT JOIN FETCH m.lessons WHERE m.id = :id")
    Optional<Module> findByIdWithLessons(@Param("id") Long id);

    /**
     * Find module by ID with lessons and flashcards eagerly loaded
     */
    @Query("SELECT m FROM Module m LEFT JOIN FETCH m.lessons l LEFT JOIN FETCH l.flashcards WHERE m.id = :id")
    Optional<Module> findByIdWithLessonsAndFlashcards(@Param("id") Long id);

    /**
     * Search modules by title (case-insensitive)
     */
    List<Module> findByTitleContainingIgnoreCase(String keyword);

    /**
     * Count modules in a course
     */
    Long countByCourseId(Long courseId);
}

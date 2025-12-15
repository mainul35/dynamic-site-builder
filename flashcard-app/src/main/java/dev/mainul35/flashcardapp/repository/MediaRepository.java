package dev.mainul35.flashcardapp.repository;

import dev.mainul35.flashcardapp.entity.Media;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MediaRepository extends JpaRepository<Media, Long> {

    /**
     * Find media for a lesson (one-to-one relationship)
     */
    Optional<Media> findByLessonId(Long lessonId);

    /**
     * Find media by filename
     */
    Optional<Media> findByFileName(String fileName);

    /**
     * Find all media files of a specific type
     */
    List<Media> findByMediaType(String mediaType);

    /**
     * Check if a lesson has media
     */
    boolean existsByLessonId(Long lessonId);

    /**
     * Delete media in a lesson
     */
    void deleteByLessonId(Long lessonId);
}

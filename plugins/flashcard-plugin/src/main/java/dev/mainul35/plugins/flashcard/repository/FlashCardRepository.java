package dev.mainul35.plugins.flashcard.repository;

import dev.mainul35.plugins.flashcard.entity.FlashCard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FlashCardRepository extends JpaRepository<FlashCard, Long> {

    List<FlashCard> findByDeckId(Long deckId);

    long countByDeckId(Long deckId);

    List<FlashCard> findByDeckIdOrderByCreatedAtDesc(Long deckId);

    @Query("SELECT f FROM FlashCard f WHERE f.deck.id = :deckId " +
           "AND (LOWER(f.frontContent) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(f.backContent) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    List<FlashCard> searchInDeck(Long deckId, String keyword);

    void deleteByDeckId(Long deckId);

    // Lesson-based methods
    List<FlashCard> findByLessonId(Long lessonId);

    long countByLessonId(Long lessonId);

    List<FlashCard> findByLessonIdOrderByCreatedAtDesc(Long lessonId);

    @Query("SELECT f FROM FlashCard f WHERE f.lesson.id = :lessonId " +
           "AND (LOWER(f.frontContent) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(f.backContent) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    List<FlashCard> searchInLesson(Long lessonId, String keyword);

    void deleteByLessonId(Long lessonId);
}

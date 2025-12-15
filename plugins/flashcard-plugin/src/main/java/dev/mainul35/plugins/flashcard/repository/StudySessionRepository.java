package dev.mainul35.plugins.flashcard.repository;

import dev.mainul35.plugins.flashcard.entity.StudySession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface StudySessionRepository extends JpaRepository<StudySession, Long> {

    List<StudySession> findByDeckIdOrderByStartedAtDesc(Long deckId);

    List<StudySession> findByCompletedAtIsNotNull();

    List<StudySession> findByCompletedAtIsNull();

    List<StudySession> findByStartedAtBetween(LocalDateTime start, LocalDateTime end);

    @Query("SELECT s FROM StudySession s WHERE s.completedAt IS NOT NULL " +
           "ORDER BY s.completedAt DESC")
    List<StudySession> findRecentCompletedSessions();

    @Query("SELECT AVG(s.score) FROM StudySession s WHERE s.deck.id = :deckId " +
           "AND s.completedAt IS NOT NULL")
    Double getAverageScoreByDeckId(Long deckId);

    long countByDeckId(Long deckId);

    @Query("SELECT SUM(s.totalCards) FROM StudySession s WHERE s.completedAt IS NOT NULL")
    Long getTotalCardsStudied();

    // Module-based methods
    List<StudySession> findByModuleIdOrderByStartedAtDesc(Long moduleId);

    @Query("SELECT AVG(s.score) FROM StudySession s WHERE s.module.id = :moduleId " +
           "AND s.completedAt IS NOT NULL")
    Double getAverageScoreByModuleId(Long moduleId);

    long countByModuleId(Long moduleId);
}

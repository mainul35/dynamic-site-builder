package dev.mainul35.flashcardapp.repository;

import dev.mainul35.flashcardapp.entity.StudySession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface StudySessionRepository extends JpaRepository<StudySession, Long> {
    
    /**
     * Find all study sessions for a specific deck
     * Ordered by start time (most recent first)
     */
    List<StudySession> findByDeckIdOrderByStartedAtDesc(Long deckId);
    
    /**
     * Find completed sessions only
     * completedAt IS NOT NULL
     */
    List<StudySession> findByCompletedAtIsNotNull();
    
    /**
     * Find incomplete (ongoing) sessions
     * completedAt IS NULL
     */
    List<StudySession> findByCompletedAtIsNull();
    
    /**
     * Find sessions within a date range
     * Useful for statistics: "sessions this week/month"
     */
    List<StudySession> findByStartedAtBetween(LocalDateTime start, LocalDateTime end);
    
    /**
     * Get recent completed sessions (for dashboard/history)
     * Limit to last N sessions
     */
    @Query("SELECT s FROM StudySession s WHERE s.completedAt IS NOT NULL " +
           "ORDER BY s.completedAt DESC")
    List<StudySession> findRecentCompletedSessions();
    
    /**
     * Calculate average score for a deck
     * Useful for deck statistics
     */
    @Query("SELECT AVG(s.score) FROM StudySession s WHERE s.deck.id = :deckId " +
           "AND s.completedAt IS NOT NULL")
    Double getAverageScoreByDeckId(Long deckId);
    
    /**
     * Count total study sessions for a deck
     */
    long countByDeckId(Long deckId);
    
    /**
     * Get total cards studied across all sessions
     */
    @Query("SELECT SUM(s.totalCards) FROM StudySession s WHERE s.completedAt IS NOT NULL")
    Long getTotalCardsStudied();
}
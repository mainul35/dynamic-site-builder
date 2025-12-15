package dev.mainul35.flashcardapp.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import dev.mainul35.flashcardapp.entity.Deck;
import dev.mainul35.flashcardapp.entity.StudySession;
import dev.mainul35.flashcardapp.repository.DeckRepository;
import dev.mainul35.flashcardapp.repository.StudySessionRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class StudySessionService {
    
    private final StudySessionRepository studySessionRepository;
    private final DeckRepository deckRepository;
    
    /**
     * Start a new study session for a deck
     */
    @Transactional
    public StudySession startStudySession(Long deckId, int totalCards) {
        log.info("Starting study session for deck: {} with {} cards", deckId, totalCards);
        
        Deck deck = deckRepository.findById(deckId)
                .orElseThrow(() -> new RuntimeException("Deck not found with id: " + deckId));
        
        StudySession session = new StudySession();
        session.setDeck(deck);
        session.setTotalCards(totalCards);
        session.setScore(0);
        // startedAt is automatically set by @CreationTimestamp
        
        return studySessionRepository.save(session);
    }
    
    /**
     * Complete a study session with final score
     */
    @Transactional
    public StudySession completeStudySession(Long sessionId, int finalScore) {
        log.info("Completing study session: {} with score: {}", sessionId, finalScore);
        
        return studySessionRepository.findById(sessionId)
                .map(session -> {
                    session.setScore(finalScore);
                    session.setCompletedAt(LocalDateTime.now());
                    return studySessionRepository.save(session);
                })
                .orElseThrow(() -> new RuntimeException("Study session not found with id: " + sessionId));
    }
    
    /**
     * Get a study session by ID
     */
    @Transactional(readOnly = true)
    public Optional<StudySession> getStudySessionById(Long id) {
        log.info("Fetching study session with id: {}", id);
        return studySessionRepository.findById(id);
    }
    
    /**
     * Get all study sessions for a deck
     */
    @Transactional(readOnly = true)
    public List<StudySession> getStudySessionsByDeckId(Long deckId) {
        log.info("Fetching study sessions for deck: {}", deckId);
        return studySessionRepository.findByDeckIdOrderByStartedAtDesc(deckId);
    }
    
    /**
     * Get all completed study sessions
     */
    @Transactional(readOnly = true)
    public List<StudySession> getCompletedSessions() {
        log.info("Fetching all completed study sessions");
        return studySessionRepository.findByCompletedAtIsNotNull();
    }
    
    /**
     * Get recent completed sessions (for history view)
     */
    @Transactional(readOnly = true)
    public List<StudySession> getRecentCompletedSessions() {
        log.info("Fetching recent completed sessions");
        return studySessionRepository.findRecentCompletedSessions();
    }
    
    /**
     * Get average score for a deck
     */
    @Transactional(readOnly = true)
    public Double getAverageScoreForDeck(Long deckId) {
        log.info("Calculating average score for deck: {}", deckId);
        Double avgScore = studySessionRepository.getAverageScoreByDeckId(deckId);
        return avgScore != null ? avgScore : 0.0;
    }
    
    /**
     * Get study statistics for a deck
     */
    @Transactional(readOnly = true)
    public DeckStatistics getDeckStatistics(Long deckId) {
        log.info("Fetching statistics for deck: {}", deckId);
        
        long sessionCount = studySessionRepository.countByDeckId(deckId);
        Double averageScore = getAverageScoreForDeck(deckId);
        
        return new DeckStatistics(deckId, sessionCount, averageScore);
    }
    
    /**
     * Inner class to hold deck statistics
     */
    public static class DeckStatistics {
        private final Long deckId;
        private final long totalSessions;
        private final double averageScore;
        
        public DeckStatistics(Long deckId, long totalSessions, double averageScore) {
            this.deckId = deckId;
            this.totalSessions = totalSessions;
            this.averageScore = averageScore;
        }
        
        public Long getDeckId() { return deckId; }
        public long getTotalSessions() { return totalSessions; }
        public double getAverageScore() { return averageScore; }
    }
}
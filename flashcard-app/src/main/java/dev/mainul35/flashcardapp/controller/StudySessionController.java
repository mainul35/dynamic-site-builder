package dev.mainul35.flashcardapp.controller;
import dev.mainul35.flashcardapp.entity.StudySession;
import dev.mainul35.flashcardapp.service.StudySessionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/study")
@RequiredArgsConstructor
@Slf4j
public class StudySessionController {
    
    private final StudySessionService studySessionService;
    
    /**
     * POST /api/study/sessions
     * Start a new study session
     * Request body: {"deckId": 1, "totalCards": 10}
     */
    @PostMapping("/sessions")
    public ResponseEntity<StudySession> startStudySession(@RequestBody Map<String, Object> request) {
        log.info("POST /api/study/sessions - Starting new study session");
        
        try {
            Long deckId = Long.valueOf(request.get("deckId").toString());
            Integer totalCards = Integer.valueOf(request.get("totalCards").toString());
            
            StudySession session = studySessionService.startStudySession(deckId, totalCards);
            return ResponseEntity.status(HttpStatus.CREATED).body(session);
        } catch (RuntimeException e) {
            log.error("Error starting study session: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * PUT /api/study/sessions/{id}
     * Complete a study session with final score
     * Request body: {"score": 8}
     */
    @PutMapping("/sessions/{id}")
    public ResponseEntity<StudySession> completeStudySession(
            @PathVariable Long id,
            @RequestBody Map<String, Object> request) {
        
        log.info("PUT /api/study/sessions/{} - Completing study session", id);
        
        try {
            Integer score = Integer.valueOf(request.get("score").toString());
            StudySession session = studySessionService.completeStudySession(id, score);
            return ResponseEntity.ok(session);
        } catch (RuntimeException e) {
            log.error("Error completing study session: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * GET /api/study/sessions/{id}
     * Get a specific study session
     */
    @GetMapping("/sessions/{id}")
    public ResponseEntity<StudySession> getStudySession(@PathVariable Long id) {
        log.info("GET /api/study/sessions/{}", id);
        
        return studySessionService.getStudySessionById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * GET /api/study/sessions
     * Get all completed study sessions (history)
     */
    @GetMapping("/sessions")
    public ResponseEntity<List<StudySession>> getAllCompletedSessions() {
        log.info("GET /api/study/sessions - Fetching completed sessions");
        List<StudySession> sessions = studySessionService.getCompletedSessions();
        return ResponseEntity.ok(sessions);
    }
    
    /**
     * GET /api/study/sessions/recent
     * Get recent completed sessions
     */
    @GetMapping("/sessions/recent")
    public ResponseEntity<List<StudySession>> getRecentSessions() {
        log.info("GET /api/study/sessions/recent - Fetching recent sessions");
        List<StudySession> sessions = studySessionService.getRecentCompletedSessions();
        return ResponseEntity.ok(sessions);
    }
    
    /**
     * GET /api/study/decks/{deckId}/sessions
     * Get all study sessions for a specific deck
     */
    @GetMapping("/decks/{deckId}/sessions")
    public ResponseEntity<List<StudySession>> getDeckSessions(@PathVariable Long deckId) {
        log.info("GET /api/study/decks/{}/sessions", deckId);
        List<StudySession> sessions = studySessionService.getStudySessionsByDeckId(deckId);
        return ResponseEntity.ok(sessions);
    }
    
    /**
     * GET /api/study/decks/{deckId}/statistics
     * Get study statistics for a deck
     */
    @GetMapping("/decks/{deckId}/statistics")
    public ResponseEntity<StudySessionService.DeckStatistics> getDeckStatistics(@PathVariable Long deckId) {
        log.info("GET /api/study/decks/{}/statistics", deckId);
        StudySessionService.DeckStatistics stats = studySessionService.getDeckStatistics(deckId);
        return ResponseEntity.ok(stats);
    }
}
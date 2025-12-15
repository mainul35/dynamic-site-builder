package dev.mainul35.plugins.flashcard.controller;

import dev.mainul35.cms.sdk.annotation.PluginController;
import dev.mainul35.plugins.flashcard.entity.StudySession;
import dev.mainul35.plugins.flashcard.service.StudySessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@PluginController(pluginId = "flashcard-plugin", basePath = "/api/study-sessions")
@RequestMapping("/api")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class StudySessionController extends dev.mainul35.cms.sdk.controller.PluginController {

    private final StudySessionService studySessionService;

    // Deck-based endpoints
    @GetMapping("/decks/{deckId}/study-sessions")
    public ResponseEntity<List<StudySession>> getSessionsByDeckId(@PathVariable Long deckId) {
        try {
            List<StudySession> sessions = studySessionService.getSessionsByDeckId(deckId);
            return ResponseEntity.ok(sessions);
        } catch (Exception e) {
            logError("Error fetching study sessions for deck: {}", deckId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/decks/{deckId}/study-sessions")
    public ResponseEntity<StudySession> createSessionForDeck(@PathVariable Long deckId, @RequestBody StudySession session) {
        try {
            StudySession created = studySessionService.createSessionForDeck(deckId, session);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (RuntimeException e) {
            if (e.getMessage().contains("Deck not found")) {
                return ResponseEntity.notFound().build();
            }
            logError("Error creating study session for deck: {}", deckId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/decks/{deckId}/average-score")
    public ResponseEntity<Double> getAverageScoreByDeckId(@PathVariable Long deckId) {
        try {
            Double avgScore = studySessionService.getAverageScoreByDeckId(deckId);
            return ResponseEntity.ok(avgScore != null ? avgScore : 0.0);
        } catch (Exception e) {
            logError("Error getting average score for deck: {}", deckId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Module-based endpoints
    @GetMapping("/modules/{moduleId}/study-sessions")
    public ResponseEntity<List<StudySession>> getSessionsByModuleId(@PathVariable Long moduleId) {
        try {
            List<StudySession> sessions = studySessionService.getSessionsByModuleId(moduleId);
            return ResponseEntity.ok(sessions);
        } catch (Exception e) {
            logError("Error fetching study sessions for module: {}", moduleId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/modules/{moduleId}/study-sessions")
    public ResponseEntity<StudySession> createSessionForModule(@PathVariable Long moduleId, @RequestBody StudySession session) {
        try {
            StudySession created = studySessionService.createSessionForModule(moduleId, session);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (RuntimeException e) {
            if (e.getMessage().contains("Module not found")) {
                return ResponseEntity.notFound().build();
            }
            logError("Error creating study session for module: {}", moduleId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/modules/{moduleId}/average-score")
    public ResponseEntity<Double> getAverageScoreByModuleId(@PathVariable Long moduleId) {
        try {
            Double avgScore = studySessionService.getAverageScoreByModuleId(moduleId);
            return ResponseEntity.ok(avgScore != null ? avgScore : 0.0);
        } catch (Exception e) {
            logError("Error getting average score for module: {}", moduleId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Generic study session endpoints
    @GetMapping("/study-sessions/recent")
    public ResponseEntity<List<StudySession>> getRecentCompletedSessions() {
        try {
            List<StudySession> sessions = studySessionService.getRecentCompletedSessions();
            return ResponseEntity.ok(sessions);
        } catch (Exception e) {
            logError("Error fetching recent completed sessions", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/study-sessions/{id}")
    public ResponseEntity<StudySession> getSessionById(@PathVariable Long id) {
        try {
            return studySessionService.getSessionById(id)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            logError("Error fetching study session with id: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/study-sessions/{id}")
    public ResponseEntity<StudySession> updateSession(@PathVariable Long id, @RequestBody StudySession session) {
        try {
            StudySession updated = studySessionService.updateSession(id, session);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            if (e.getMessage().contains("not found")) {
                return ResponseEntity.notFound().build();
            }
            logError("Error updating study session with id: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/study-sessions/{id}/complete")
    public ResponseEntity<StudySession> completeSession(@PathVariable Long id, @RequestParam Integer score) {
        try {
            StudySession completed = studySessionService.completeSession(id, score);
            return ResponseEntity.ok(completed);
        } catch (RuntimeException e) {
            if (e.getMessage().contains("not found")) {
                return ResponseEntity.notFound().build();
            }
            logError("Error completing study session with id: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/study-sessions/{id}")
    public ResponseEntity<Void> deleteSession(@PathVariable Long id) {
        try {
            studySessionService.deleteSession(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            if (e.getMessage().contains("not found")) {
                return ResponseEntity.notFound().build();
            }
            logError("Error deleting study session with id: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/study-sessions/total-cards-studied")
    public ResponseEntity<Long> getTotalCardsStudied() {
        try {
            Long total = studySessionService.getTotalCardsStudied();
            return ResponseEntity.ok(total != null ? total : 0L);
        } catch (Exception e) {
            logError("Error getting total cards studied", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}

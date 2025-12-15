package dev.mainul35.plugins.flashcard.service;

import dev.mainul35.cms.sdk.annotation.PluginService;
import dev.mainul35.plugins.flashcard.entity.StudySession;
import dev.mainul35.plugins.flashcard.repository.DeckRepository;
import dev.mainul35.plugins.flashcard.repository.StudySessionRepository;
import dev.mainul35.plugins.course.repository.ModuleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@PluginService(pluginId = "flashcard-plugin")
@RequiredArgsConstructor
public class StudySessionService extends dev.mainul35.cms.sdk.service.PluginService {

    private final StudySessionRepository studySessionRepository;
    private final DeckRepository deckRepository;
    private final ModuleRepository moduleRepository;

    @Transactional(readOnly = true)
    public List<StudySession> getSessionsByDeckId(Long deckId) {
        logInfo("Fetching study sessions for deck: {}", deckId);
        return studySessionRepository.findByDeckIdOrderByStartedAtDesc(deckId);
    }

    @Transactional(readOnly = true)
    public List<StudySession> getSessionsByModuleId(Long moduleId) {
        logInfo("Fetching study sessions for module: {}", moduleId);
        return studySessionRepository.findByModuleIdOrderByStartedAtDesc(moduleId);
    }

    @Transactional(readOnly = true)
    public Optional<StudySession> getSessionById(Long id) {
        logInfo("Fetching study session with id: {}", id);
        return studySessionRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public List<StudySession> getRecentCompletedSessions() {
        logInfo("Fetching recent completed study sessions");
        return studySessionRepository.findRecentCompletedSessions();
    }

    @Transactional
    public StudySession createSessionForDeck(Long deckId, StudySession session) {
        logInfo("Creating study session for deck: {}", deckId);

        return deckRepository.findById(deckId)
            .map(deck -> {
                session.setDeck(deck);
                if (session.getPluginId() == null) {
                    session.setPluginId("flashcard-plugin");
                }
                if (session.getScore() == null) {
                    session.setScore(0);
                }
                if (session.getTotalCards() == null) {
                    session.setTotalCards(0);
                }

                StudySession saved = studySessionRepository.save(session);
                logInfo("Study session created with id: {}", saved.getId());
                return saved;
            })
            .orElseThrow(() -> {
                logError("Deck not found with id: {}", deckId);
                return new RuntimeException("Deck not found with id: " + deckId);
            });
    }

    @Transactional
    public StudySession createSessionForModule(Long moduleId, StudySession session) {
        logInfo("Creating study session for module: {}", moduleId);

        return moduleRepository.findById(moduleId)
            .map(module -> {
                session.setModule(module);
                if (session.getPluginId() == null) {
                    session.setPluginId("flashcard-plugin");
                }
                if (session.getScore() == null) {
                    session.setScore(0);
                }
                if (session.getTotalCards() == null) {
                    session.setTotalCards(0);
                }

                StudySession saved = studySessionRepository.save(session);
                logInfo("Study session created with id: {}", saved.getId());
                return saved;
            })
            .orElseThrow(() -> {
                logError("Module not found with id: {}", moduleId);
                return new RuntimeException("Module not found with id: " + moduleId);
            });
    }

    @Transactional
    public StudySession updateSession(Long id, StudySession updatedSession) {
        logInfo("Updating study session with id: {}", id);

        return studySessionRepository.findById(id)
            .map(existingSession -> {
                if (updatedSession.getScore() != null) {
                    existingSession.setScore(updatedSession.getScore());
                }
                if (updatedSession.getTotalCards() != null) {
                    existingSession.setTotalCards(updatedSession.getTotalCards());
                }
                if (updatedSession.getCompletedAt() != null) {
                    existingSession.setCompletedAt(updatedSession.getCompletedAt());
                }

                StudySession saved = studySessionRepository.save(existingSession);
                logInfo("Study session updated: {}", saved.getId());
                return saved;
            })
            .orElseThrow(() -> {
                logError("Study session not found with id: {}", id);
                return new RuntimeException("Study session not found with id: " + id);
            });
    }

    @Transactional
    public StudySession completeSession(Long id, Integer score) {
        logInfo("Completing study session with id: {}", id);

        return studySessionRepository.findById(id)
            .map(session -> {
                session.setScore(score);
                session.setCompletedAt(LocalDateTime.now());

                StudySession saved = studySessionRepository.save(session);
                logInfo("Study session completed: {} with score: {}/{}", saved.getId(), score, saved.getTotalCards());
                return saved;
            })
            .orElseThrow(() -> {
                logError("Study session not found with id: {}", id);
                return new RuntimeException("Study session not found with id: " + id);
            });
    }

    @Transactional
    public void deleteSession(Long id) {
        logInfo("Deleting study session with id: {}", id);

        if (!studySessionRepository.existsById(id)) {
            throw new RuntimeException("Study session not found with id: " + id);
        }

        studySessionRepository.deleteById(id);
        logInfo("Study session deleted: {}", id);
    }

    @Transactional(readOnly = true)
    public Double getAverageScoreByDeckId(Long deckId) {
        return studySessionRepository.getAverageScoreByDeckId(deckId);
    }

    @Transactional(readOnly = true)
    public Double getAverageScoreByModuleId(Long moduleId) {
        return studySessionRepository.getAverageScoreByModuleId(moduleId);
    }

    @Transactional(readOnly = true)
    public Long getTotalCardsStudied() {
        return studySessionRepository.getTotalCardsStudied();
    }
}

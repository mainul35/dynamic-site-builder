package dev.mainul35.plugins.flashcard.service;

import dev.mainul35.cms.sdk.annotation.PluginService;
import dev.mainul35.plugins.flashcard.entity.FlashCard;
import dev.mainul35.plugins.flashcard.repository.DeckRepository;
import dev.mainul35.plugins.flashcard.repository.FlashCardRepository;
import dev.mainul35.plugins.lesson.repository.LessonRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@PluginService(pluginId = "flashcard-plugin")
@RequiredArgsConstructor
public class FlashCardService extends dev.mainul35.cms.sdk.service.PluginService {

    private final FlashCardRepository flashcardRepository;
    private final DeckRepository deckRepository;
    private final LessonRepository lessonRepository;

    @Transactional(readOnly = true)
    public List<FlashCard> getFlashcardsByDeckId(Long deckId) {
        logInfo("Fetching flashcards for deck: {}", deckId);
        return flashcardRepository.findByDeckIdOrderByCreatedAtDesc(deckId);
    }

    @Transactional(readOnly = true)
    public List<FlashCard> getFlashcardsByLessonId(Long lessonId) {
        logInfo("Fetching flashcards for lesson: {}", lessonId);
        return flashcardRepository.findByLessonIdOrderByCreatedAtDesc(lessonId);
    }

    @Transactional(readOnly = true)
    public Optional<FlashCard> getFlashcardById(Long id) {
        logInfo("Fetching flashcard with id: {}", id);
        return flashcardRepository.findById(id);
    }

    @Transactional
    public FlashCard createFlashcardInDeck(Long deckId, FlashCard flashcard) {
        logInfo("Creating flashcard in deck: {}", deckId);

        if (flashcard.getFrontContent() == null || flashcard.getFrontContent().trim().isEmpty()) {
            throw new IllegalArgumentException("Front content cannot be empty");
        }
        if (flashcard.getBackContent() == null || flashcard.getBackContent().trim().isEmpty()) {
            throw new IllegalArgumentException("Back content cannot be empty");
        }

        return deckRepository.findById(deckId)
            .map(deck -> {
                flashcard.setDeck(deck);
                if (flashcard.getPluginId() == null) {
                    flashcard.setPluginId("flashcard-plugin");
                }
                if (flashcard.getContentFormat() == null) {
                    flashcard.setContentFormat("html");
                }

                FlashCard saved = flashcardRepository.save(flashcard);
                logInfo("Flashcard created with id: {}", saved.getId());
                return saved;
            })
            .orElseThrow(() -> {
                logError("Deck not found with id: {}", deckId);
                return new RuntimeException("Deck not found with id: " + deckId);
            });
    }

    @Transactional
    public FlashCard createFlashcardInLesson(Long lessonId, FlashCard flashcard) {
        logInfo("Creating flashcard in lesson: {}", lessonId);

        if (flashcard.getFrontContent() == null || flashcard.getFrontContent().trim().isEmpty()) {
            throw new IllegalArgumentException("Front content cannot be empty");
        }
        if (flashcard.getBackContent() == null || flashcard.getBackContent().trim().isEmpty()) {
            throw new IllegalArgumentException("Back content cannot be empty");
        }

        return lessonRepository.findById(lessonId)
            .map(lesson -> {
                flashcard.setLesson(lesson);
                if (flashcard.getPluginId() == null) {
                    flashcard.setPluginId("flashcard-plugin");
                }
                if (flashcard.getContentFormat() == null) {
                    flashcard.setContentFormat("html");
                }

                FlashCard saved = flashcardRepository.save(flashcard);
                logInfo("Flashcard created with id: {}", saved.getId());
                return saved;
            })
            .orElseThrow(() -> {
                logError("Lesson not found with id: {}", lessonId);
                return new RuntimeException("Lesson not found with id: " + lessonId);
            });
    }

    @Transactional
    public FlashCard updateFlashcard(Long id, FlashCard updatedFlashcard) {
        logInfo("Updating flashcard with id: {}", id);

        return flashcardRepository.findById(id)
            .map(existingFlashcard -> {
                existingFlashcard.setFrontContent(updatedFlashcard.getFrontContent());
                existingFlashcard.setBackContent(updatedFlashcard.getBackContent());
                if (updatedFlashcard.getQuestionType() != null) {
                    existingFlashcard.setQuestionType(updatedFlashcard.getQuestionType());
                }
                if (updatedFlashcard.getAnswerOptions() != null) {
                    existingFlashcard.setAnswerOptions(updatedFlashcard.getAnswerOptions());
                }
                if (updatedFlashcard.getCorrectAnswer() != null) {
                    existingFlashcard.setCorrectAnswer(updatedFlashcard.getCorrectAnswer());
                }
                if (updatedFlashcard.getCorrectAnswerExplanation() != null) {
                    existingFlashcard.setCorrectAnswerExplanation(updatedFlashcard.getCorrectAnswerExplanation());
                }

                FlashCard saved = flashcardRepository.save(existingFlashcard);
                logInfo("Flashcard updated: {}", saved.getId());
                return saved;
            })
            .orElseThrow(() -> {
                logError("Flashcard not found with id: {}", id);
                return new RuntimeException("Flashcard not found with id: " + id);
            });
    }

    @Transactional
    public void deleteFlashcard(Long id) {
        logInfo("Deleting flashcard with id: {}", id);

        if (!flashcardRepository.existsById(id)) {
            throw new RuntimeException("Flashcard not found with id: " + id);
        }

        flashcardRepository.deleteById(id);
        logInfo("Flashcard deleted: {}", id);
    }

    @Transactional(readOnly = true)
    public List<FlashCard> searchInDeck(Long deckId, String keyword) {
        logInfo("Searching flashcards in deck {} with keyword: {}", deckId, keyword);
        return flashcardRepository.searchInDeck(deckId, keyword);
    }

    @Transactional(readOnly = true)
    public List<FlashCard> searchInLesson(Long lessonId, String keyword) {
        logInfo("Searching flashcards in lesson {} with keyword: {}", lessonId, keyword);
        return flashcardRepository.searchInLesson(lessonId, keyword);
    }
}

package dev.mainul35.plugins.flashcard.controller;

import dev.mainul35.cms.sdk.annotation.PluginController;
import dev.mainul35.plugins.flashcard.entity.FlashCard;
import dev.mainul35.plugins.flashcard.service.FlashCardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@PluginController(pluginId = "flashcard-plugin", basePath = "/api/flashcards")
@RequestMapping("/api")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class FlashCardController extends dev.mainul35.cms.sdk.controller.PluginController {

    private final FlashCardService flashcardService;

    // Deck-based endpoints
    @GetMapping("/decks/{deckId}/flashcards")
    public ResponseEntity<List<FlashCard>> getFlashcardsByDeckId(@PathVariable Long deckId) {
        try {
            List<FlashCard> flashcards = flashcardService.getFlashcardsByDeckId(deckId);
            return ResponseEntity.ok(flashcards);
        } catch (Exception e) {
            logError("Error fetching flashcards for deck: {}", deckId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/decks/{deckId}/flashcards")
    public ResponseEntity<FlashCard> createFlashcardInDeck(@PathVariable Long deckId, @RequestBody FlashCard flashcard) {
        try {
            FlashCard created = flashcardService.createFlashcardInDeck(deckId, flashcard);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalArgumentException e) {
            logError("Validation error creating flashcard", e);
            return ResponseEntity.badRequest().build();
        } catch (RuntimeException e) {
            if (e.getMessage().contains("Deck not found")) {
                return ResponseEntity.notFound().build();
            }
            logError("Error creating flashcard in deck: {}", deckId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/decks/{deckId}/flashcards/search")
    public ResponseEntity<List<FlashCard>> searchFlashcardsInDeck(@PathVariable Long deckId, @RequestParam String keyword) {
        try {
            List<FlashCard> flashcards = flashcardService.searchInDeck(deckId, keyword);
            return ResponseEntity.ok(flashcards);
        } catch (Exception e) {
            logError("Error searching flashcards in deck: {}", deckId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Lesson-based endpoints
    @GetMapping("/lessons/{lessonId}/flashcards")
    public ResponseEntity<List<FlashCard>> getFlashcardsByLessonId(@PathVariable Long lessonId) {
        try {
            List<FlashCard> flashcards = flashcardService.getFlashcardsByLessonId(lessonId);
            return ResponseEntity.ok(flashcards);
        } catch (Exception e) {
            logError("Error fetching flashcards for lesson: {}", lessonId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/lessons/{lessonId}/flashcards")
    public ResponseEntity<FlashCard> createFlashcardInLesson(@PathVariable Long lessonId, @RequestBody FlashCard flashcard) {
        try {
            FlashCard created = flashcardService.createFlashcardInLesson(lessonId, flashcard);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalArgumentException e) {
            logError("Validation error creating flashcard", e);
            return ResponseEntity.badRequest().build();
        } catch (RuntimeException e) {
            if (e.getMessage().contains("Lesson not found")) {
                return ResponseEntity.notFound().build();
            }
            logError("Error creating flashcard in lesson: {}", lessonId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/lessons/{lessonId}/flashcards/search")
    public ResponseEntity<List<FlashCard>> searchFlashcardsInLesson(@PathVariable Long lessonId, @RequestParam String keyword) {
        try {
            List<FlashCard> flashcards = flashcardService.searchInLesson(lessonId, keyword);
            return ResponseEntity.ok(flashcards);
        } catch (Exception e) {
            logError("Error searching flashcards in lesson: {}", lessonId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Generic flashcard endpoints
    @GetMapping("/flashcards/{id}")
    public ResponseEntity<FlashCard> getFlashcardById(@PathVariable Long id) {
        try {
            return flashcardService.getFlashcardById(id)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            logError("Error fetching flashcard with id: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/flashcards/{id}")
    public ResponseEntity<FlashCard> updateFlashcard(@PathVariable Long id, @RequestBody FlashCard flashcard) {
        try {
            FlashCard updated = flashcardService.updateFlashcard(id, flashcard);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            if (e.getMessage().contains("not found")) {
                return ResponseEntity.notFound().build();
            }
            logError("Error updating flashcard with id: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/flashcards/{id}")
    public ResponseEntity<Void> deleteFlashcard(@PathVariable Long id) {
        try {
            flashcardService.deleteFlashcard(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            if (e.getMessage().contains("not found")) {
                return ResponseEntity.notFound().build();
            }
            logError("Error deleting flashcard with id: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}

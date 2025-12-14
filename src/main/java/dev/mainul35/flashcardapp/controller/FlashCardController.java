package dev.mainul35.flashcardapp.controller;

import dev.mainul35.flashcardapp.entity.FlashCard;
import dev.mainul35.flashcardapp.service.FlashCardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Slf4j
public class FlashCardController {
    
    private final FlashCardService flashCardService;
    
    /**
     * GET /api/decks/{deckId}/cards
     * Get all FlashCards for a specific deck
     */
    @GetMapping("/decks/{deckId}/cards")
    public ResponseEntity<List<FlashCard>> getFlashCardsByDeck(@PathVariable Long deckId) {
        log.info("GET /api/decks/{}/cards - Fetching FlashCards", deckId);
        List<FlashCard> FlashCards = flashCardService.getFlashCardsByDeckId(deckId);
        return ResponseEntity.ok(FlashCards);
    }
    
    /**
     * POST /api/decks/{deckId}/cards
     * Create a new FlashCard in a deck
     * Request body: {"frontContent": "Question?", "backContent": "Answer"}
     */
    @PostMapping("/decks/{deckId}/cards")
    public ResponseEntity<FlashCard> createFlashCard(
            @PathVariable Long deckId,
            @RequestBody FlashCard FlashCard) {
        
        log.info("POST /api/decks/{}/cards - Creating FlashCard", deckId);
        
        try {
            FlashCard createdFlashCard = flashCardService.createFlashCard(deckId, FlashCard);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdFlashCard);
        } catch (IllegalArgumentException e) {
            log.error("Validation error: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (RuntimeException e) {
            log.error("Error creating FlashCard: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * GET /api/cards/{id}
     * Get a specific FlashCard by ID
     */
    @GetMapping("/cards/{id}")
    public ResponseEntity<FlashCard> getFlashCardById(@PathVariable Long id) {
        log.info("GET /api/cards/{} - Fetching FlashCard", id);
        
        return flashCardService.getFlashCardById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * PUT /api/cards/{id}
     * Update an existing FlashCard
     * Request body: {"frontContent": "Updated question?", "backContent": "Updated answer"}
     */
    @PutMapping("/cards/{id}")
    public ResponseEntity<FlashCard> updateFlashCard(
            @PathVariable Long id,
            @RequestBody FlashCard FlashCard) {
        
        log.info("PUT /api/cards/{} - Updating FlashCard", id);
        
        try {
            FlashCard updatedFlashCard = flashCardService.updateFlashCard(id, FlashCard);
            return ResponseEntity.ok(updatedFlashCard);
        } catch (RuntimeException e) {
            log.error("Error updating FlashCard: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * DELETE /api/cards/{id}
     * Delete a FlashCard
     */
    @DeleteMapping("/cards/{id}")
    public ResponseEntity<Void> deleteFlashCard(@PathVariable Long id) {
        log.info("DELETE /api/cards/{} - Deleting FlashCard", id);
        
        try {
            flashCardService.deleteFlashCard(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            log.error("Error deleting FlashCard: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * GET /api/decks/{deckId}/cards/search?keyword=java
     * Search FlashCards within a deck
     */
    @GetMapping("/decks/{deckId}/cards/search")
    public ResponseEntity<List<FlashCard>> searchFlashCards(
            @PathVariable Long deckId,
            @RequestParam String keyword) {
        
        log.info("GET /api/decks/{}/cards/search?keyword={}", deckId, keyword);
        List<FlashCard> FlashCards = flashCardService.searchFlashCardsInDeck(deckId, keyword);
        return ResponseEntity.ok(FlashCards);
    }
    
    /**
     * GET /api/decks/{deckId}/cards/count
     * Get FlashCard count for a deck
     */
    @GetMapping("/decks/{deckId}/cards/count")
    public ResponseEntity<Long> getFlashCardCount(@PathVariable Long deckId) {
        log.info("GET /api/decks/{}/cards/count", deckId);
        long count = flashCardService.countFlashCardsInDeck(deckId);
        return ResponseEntity.ok(count);
    }

    // ========== NEW LESSON-BASED ENDPOINTS ==========

    /**
     * GET /api/lessons/{lessonId}/flashcards
     * Get all FlashCards for a specific lesson
     */
    @GetMapping("/lessons/{lessonId}/flashcards")
    public ResponseEntity<List<FlashCard>> getFlashCardsByLesson(@PathVariable Long lessonId) {
        log.info("GET /api/lessons/{}/flashcards - Fetching FlashCards", lessonId);
        List<FlashCard> flashCards = flashCardService.getFlashCardsByLessonId(lessonId);
        return ResponseEntity.ok(flashCards);
    }

    /**
     * POST /api/lessons/{lessonId}/flashcards
     * Create a new FlashCard in a lesson
     */
    @PostMapping("/lessons/{lessonId}/flashcards")
    public ResponseEntity<FlashCard> createFlashCardInLesson(
            @PathVariable Long lessonId,
            @RequestBody FlashCard flashCard) {

        log.info("POST /api/lessons/{}/flashcards - Creating FlashCard", lessonId);

        try {
            FlashCard createdFlashCard = flashCardService.createFlashCardInLesson(lessonId, flashCard);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdFlashCard);
        } catch (IllegalArgumentException e) {
            log.error("Validation error: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (RuntimeException e) {
            log.error("Error creating FlashCard: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * GET /api/lessons/{lessonId}/flashcards/search?keyword=java
     * Search FlashCards within a lesson
     */
    @GetMapping("/lessons/{lessonId}/flashcards/search")
    public ResponseEntity<List<FlashCard>> searchFlashCardsInLesson(
            @PathVariable Long lessonId,
            @RequestParam String keyword) {

        log.info("GET /api/lessons/{}/flashcards/search?keyword={}", lessonId, keyword);
        List<FlashCard> flashCards = flashCardService.searchFlashCardsInLesson(lessonId, keyword);
        return ResponseEntity.ok(flashCards);
    }

    /**
     * GET /api/lessons/{lessonId}/flashcards/count
     * Get FlashCard count for a lesson
     */
    @GetMapping("/lessons/{lessonId}/flashcards/count")
    public ResponseEntity<Long> getFlashCardCountByLesson(@PathVariable Long lessonId) {
        log.info("GET /api/lessons/{}/flashcards/count", lessonId);
        long count = flashCardService.countFlashCardsInLesson(lessonId);
        return ResponseEntity.ok(count);
    }
}

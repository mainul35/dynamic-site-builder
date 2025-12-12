package dev.mainul35.flashcardapp.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import dev.mainul35.flashcardapp.entity.Deck;
import dev.mainul35.flashcardapp.service.DeckService;

import java.util.List;

@RestController
@RequestMapping("/api/decks")
@RequiredArgsConstructor
@Slf4j
public class DeckController {
    
    private final DeckService deckService;
    
    /**
     * GET /api/decks
     * Get all decks
     */
    @GetMapping
    public ResponseEntity<List<Deck>> getAllDecks() {
        log.info("GET /api/decks - Fetching all decks");
        List<Deck> decks = deckService.getAllDecks();
        return ResponseEntity.ok(decks);
    }
    
    /**
     * GET /api/decks/{id}
     * Get a specific deck by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<Deck> getDeckById(@PathVariable Long id) {
        log.info("GET /api/decks/{} - Fetching deck", id);
        
        return deckService.getDeckById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * GET /api/decks/{id}/with-cards
     * Get deck with all flashcards (eager loading)
     */
    @GetMapping("/{id}/with-cards")
    public ResponseEntity<Deck> getDeckWithFlashcards(@PathVariable Long id) {
        log.info("GET /api/decks/{}/with-cards - Fetching deck with flashcards", id);
        
        return deckService.getDeckWithFlashcards(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * POST /api/decks
     * Create a new deck
     * Request body example: {"title": "Java Basics", "description": "Core Java concepts"}
     */
    @PostMapping
    public ResponseEntity<Deck> createDeck(@RequestBody Deck deck) {
        log.info("POST /api/decks - Creating new deck: {}", deck.getTitle());
        
        try {
            Deck createdDeck = deckService.createDeck(deck);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdDeck);
        } catch (IllegalArgumentException e) {
            log.error("Validation error: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * PUT /api/decks/{id}
     * Update an existing deck
     * Request body example: {"title": "Updated Title", "description": "Updated description"}
     */
    @PutMapping("/{id}")
    public ResponseEntity<Deck> updateDeck(@PathVariable Long id, @RequestBody Deck deck) {
        log.info("PUT /api/decks/{} - Updating deck", id);
        
        try {
            Deck updatedDeck = deckService.updateDeck(id, deck);
            return ResponseEntity.ok(updatedDeck);
        } catch (RuntimeException e) {
            log.error("Error updating deck: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * DELETE /api/decks/{id}
     * Delete a deck
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDeck(@PathVariable Long id) {
        log.info("DELETE /api/decks/{} - Deleting deck", id);
        
        try {
            deckService.deleteDeck(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            log.error("Error deleting deck: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * GET /api/decks/search?keyword=java
     * Search decks by title
     */
    @GetMapping("/search")
    public ResponseEntity<List<Deck>> searchDecks(@RequestParam String keyword) {
        log.info("GET /api/decks/search?keyword={}", keyword);
        List<Deck> decks = deckService.searchDecksByTitle(keyword);
        return ResponseEntity.ok(decks);
    }
    
    /**
     * GET /api/decks/{id}/card-count
     * Get flashcard count for a deck
     */
    @GetMapping("/{id}/card-count")
    public ResponseEntity<Long> getCardCount(@PathVariable Long id) {
        log.info("GET /api/decks/{}/card-count", id);
        long count = deckService.getFlashcardCount(id);
        return ResponseEntity.ok(count);
    }
}
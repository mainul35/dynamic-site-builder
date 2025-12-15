package dev.mainul35.plugins.flashcard.controller;

import dev.mainul35.cms.sdk.annotation.PluginController;
import dev.mainul35.plugins.flashcard.entity.Deck;
import dev.mainul35.plugins.flashcard.service.DeckService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@PluginController(pluginId = "flashcard-plugin", basePath = "/api/decks")
@RequestMapping("/api/decks")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class DeckController extends dev.mainul35.cms.sdk.controller.PluginController {

    private final DeckService deckService;

    @GetMapping
    public ResponseEntity<List<Deck>> getAllDecks() {
        try {
            List<Deck> decks = deckService.getAllDecks();
            return ResponseEntity.ok(decks);
        } catch (Exception e) {
            logError("Error fetching all decks", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Deck> getDeckById(@PathVariable Long id) {
        try {
            return deckService.getDeckById(id)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            logError("Error fetching deck with id: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}/with-flashcards")
    public ResponseEntity<Deck> getDeckWithFlashcards(@PathVariable Long id) {
        try {
            return deckService.getDeckWithFlashcards(id)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            logError("Error fetching deck with flashcards, id: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping
    public ResponseEntity<Deck> createDeck(@RequestBody Deck deck) {
        try {
            Deck createdDeck = deckService.createDeck(deck);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdDeck);
        } catch (IllegalArgumentException e) {
            logError("Validation error creating deck", e);
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            logError("Error creating deck", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Deck> updateDeck(@PathVariable Long id, @RequestBody Deck deck) {
        try {
            Deck updatedDeck = deckService.updateDeck(id, deck);
            return ResponseEntity.ok(updatedDeck);
        } catch (RuntimeException e) {
            if (e.getMessage().contains("not found")) {
                return ResponseEntity.notFound().build();
            }
            logError("Error updating deck with id: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDeck(@PathVariable Long id) {
        try {
            deckService.deleteDeck(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            if (e.getMessage().contains("not found")) {
                return ResponseEntity.notFound().build();
            }
            logError("Error deleting deck with id: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/search")
    public ResponseEntity<List<Deck>> searchDecks(@RequestParam String keyword) {
        try {
            List<Deck> decks = deckService.searchDecksByTitle(keyword);
            return ResponseEntity.ok(decks);
        } catch (Exception e) {
            logError("Error searching decks with keyword: {}", keyword, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}/flashcard-count")
    public ResponseEntity<Long> getFlashcardCount(@PathVariable Long id) {
        try {
            long count = deckService.getFlashcardCount(id);
            return ResponseEntity.ok(count);
        } catch (Exception e) {
            logError("Error getting flashcard count for deck: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}

package dev.mainul35.flashcardapp.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import dev.mainul35.flashcardapp.entity.Deck;
import dev.mainul35.flashcardapp.repository.DeckRepository;
import dev.mainul35.flashcardapp.repository.FlashCardRepository;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class DeckService {
    
    private final DeckRepository deckRepository;
    private final FlashCardRepository flashcardRepository;
    
    /**
     * Get all decks ordered by creation date (newest first)
     */
    @Transactional(readOnly = true)
    public List<Deck> getAllDecks() {
        log.info("Fetching all decks");
        return deckRepository.findAllByOrderByCreatedAtDesc();
    }
    
    /**
     * Get a single deck by ID
     * Returns Optional to handle not found case
     */
    @Transactional(readOnly = true)
    public Optional<Deck> getDeckById(Long id) {
        log.info("Fetching deck with id: {}", id);
        return deckRepository.findById(id);
    }
    
    /**
     * Get deck with all flashcards loaded (avoids N+1 problem)
     */
    @Transactional(readOnly = true)
    public Optional<Deck> getDeckWithFlashcards(Long id) {
        log.info("Fetching deck with flashcards, id: {}", id);
        Deck deck = deckRepository.findByIdWithFlashcards(id);
        return Optional.ofNullable(deck);
    }
    
    /**
     * Create a new deck
     */
    @Transactional
    public Deck createDeck(Deck deck) {
        log.info("Creating new deck: {}", deck.getTitle());
        
        // Validation
        if (deck.getTitle() == null || deck.getTitle().trim().isEmpty()) {
            throw new IllegalArgumentException("Deck title cannot be empty");
        }
        
        return deckRepository.save(deck);
    }
    
    /**
     * Update an existing deck
     */
    @Transactional
    public Deck updateDeck(Long id, Deck updatedDeck) {
        log.info("Updating deck with id: {}", id);
        
        return deckRepository.findById(id)
                .map(existingDeck -> {
                    existingDeck.setTitle(updatedDeck.getTitle());
                    existingDeck.setDescription(updatedDeck.getDescription());
                    return deckRepository.save(existingDeck);
                })
                .orElseThrow(() -> new RuntimeException("Deck not found with id: " + id));
    }
    
    /**
     * Delete a deck and all its flashcards
     * Cascade delete handles flashcard deletion automatically
     */
    @Transactional
    public void deleteDeck(Long id) {
        log.info("Deleting deck with id: {}", id);
        
        if (!deckRepository.existsById(id)) {
            throw new RuntimeException("Deck not found with id: " + id);
        }
        
        deckRepository.deleteById(id);
    }
    
    /**
     * Search decks by title
     */
    @Transactional(readOnly = true)
    public List<Deck> searchDecksByTitle(String keyword) {
        log.info("Searching decks with keyword: {}", keyword);
        return deckRepository.findByTitleContainingIgnoreCase(keyword);
    }
    
    /**
     * Get flashcard count for a deck
     * Useful for displaying deck statistics
     */
    @Transactional(readOnly = true)
    public long getFlashcardCount(Long deckId) {
        log.info("Counting flashcards for deck: {}", deckId);
        return flashcardRepository.countByDeckId(deckId);
    }
}
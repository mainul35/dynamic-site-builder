package dev.mainul35.flashcardapp.service;


import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import dev.mainul35.flashcardapp.entity.Deck;
import dev.mainul35.flashcardapp.entity.FlashCard;
import dev.mainul35.flashcardapp.repository.DeckRepository;
import dev.mainul35.flashcardapp.repository.FlashCardRepository;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class FlashCardService {
    
    private final FlashCardRepository FlashCardRepository;
    private final DeckRepository deckRepository;
    
    /**
     * Get all FlashCards for a specific deck
     */
    @Transactional(readOnly = true)
    public List<FlashCard> getFlashCardsByDeckId(Long deckId) {
        log.info("Fetching FlashCards for deck: {}", deckId);
        return FlashCardRepository.findByDeckIdOrderByCreatedAtDesc(deckId);
    }
    
    /**
     * Get a single FlashCard by ID
     */
    @Transactional(readOnly = true)
    public Optional<FlashCard> getFlashCardById(Long id) {
        log.info("Fetching FlashCard with id: {}", id);
        return FlashCardRepository.findById(id);
    }
    
    /**
     * Create a new FlashCard in a deck
     */
    @Transactional
    public FlashCard createFlashCard(Long deckId, FlashCard FlashCard) {
        log.info("Creating FlashCard in deck: {}", deckId);
        
        // Validation
        if (FlashCard.getFrontContent() == null || FlashCard.getFrontContent().trim().isEmpty()) {
            throw new IllegalArgumentException("Front content cannot be empty");
        }
        if (FlashCard.getBackContent() == null || FlashCard.getBackContent().trim().isEmpty()) {
            throw new IllegalArgumentException("Back content cannot be empty");
        }
        
        // Find the deck and associate the FlashCard
        Deck deck = deckRepository.findById(deckId)
                .orElseThrow(() -> new RuntimeException("Deck not found with id: " + deckId));
        
        FlashCard.setDeck(deck);
        return FlashCardRepository.save(FlashCard);
    }
    
    /**
     * Update an existing FlashCard
     */
    @Transactional
    public FlashCard updateFlashCard(Long id, FlashCard updatedFlashCard) {
        log.info("Updating FlashCard with id: {}", id);
        
        return FlashCardRepository.findById(id)
                .map(existingFlashCard -> {
                    existingFlashCard.setFrontContent(updatedFlashCard.getFrontContent());
                    existingFlashCard.setBackContent(updatedFlashCard.getBackContent());
                    return FlashCardRepository.save(existingFlashCard);
                })
                .orElseThrow(() -> new RuntimeException("FlashCard not found with id: " + id));
    }
    
    /**
     * Delete a FlashCard
     */
    @Transactional
    public void deleteFlashCard(Long id) {
        log.info("Deleting FlashCard with id: {}", id);
        
        if (!FlashCardRepository.existsById(id)) {
            throw new RuntimeException("FlashCard not found with id: " + id);
        }
        
        FlashCardRepository.deleteById(id);
    }
    
    /**
     * Search FlashCards within a deck
     */
    @Transactional(readOnly = true)
    public List<FlashCard> searchFlashCardsInDeck(Long deckId, String keyword) {
        log.info("Searching FlashCards in deck: {} with keyword: {}", deckId, keyword);
        return FlashCardRepository.searchInDeck(deckId, keyword);
    }
    
    /**
     * Count FlashCards in a deck
     */
    @Transactional(readOnly = true)
    public long countFlashCardsInDeck(Long deckId) {
        log.info("Counting FlashCards in deck: {}", deckId);
        return FlashCardRepository.countByDeckId(deckId);
    }
}

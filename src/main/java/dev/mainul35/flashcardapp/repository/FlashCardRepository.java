package dev.mainul35.flashcardapp.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import dev.mainul35.flashcardapp.entity.FlashCard;

import java.util.List;

@Repository
public interface FlashCardRepository extends JpaRepository<FlashCard, Long> {
    
    /**
     * Find all flashcards belonging to a specific deck
     * Spring Data JPA generates: SELECT * FROM flashcards WHERE deck_id = ?
     */
    List<FlashCard> findByDeckId(Long deckId);
    
    /**
     * Count flashcards in a deck
     * Useful for showing "X cards" in deck list
     */
    long countByDeckId(Long deckId);
    
    /**
     * Find flashcards by deck, ordered by creation date
     * Shows newest cards first
     */
    List<FlashCard> findByDeckIdOrderByCreatedAtDesc(Long deckId);
    
    /**
     * Search flashcards by content (front or back)
     * Useful for searching within a deck
     */
    @Query("SELECT f FROM FlashCard f WHERE f.deck.id = :deckId " +
           "AND (LOWER(f.frontContent) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(f.backContent) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    List<FlashCard> searchInDeck(Long deckId, String keyword);
    
    /**
     * Delete all flashcards in a deck
     * Alternative to cascade delete
     */
    void deleteByDeckId(Long deckId);
}

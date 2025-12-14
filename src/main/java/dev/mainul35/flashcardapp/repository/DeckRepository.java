package dev.mainul35.flashcardapp.repository;
import dev.mainul35.flashcardapp.entity.Deck;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DeckRepository extends JpaRepository<Deck, Long> {
    
    /**
     * Find decks by title containing a keyword (case-insensitive)
     * Spring Data JPA automatically implements this based on method name
     * 
     * Example: findByTitleContainingIgnoreCase("java")
     * SQL: SELECT * FROM decks WHERE LOWER(title) LIKE LOWER('%java%')
     */
    List<Deck> findByTitleContainingIgnoreCase(String keyword);
    
    /**
     * Find all decks ordered by creation date (newest first)
     * Spring Data JPA generates the query from method name
     */
    List<Deck> findAllByOrderByCreatedAtDesc();
    
    /**
     * Custom query to get decks with flashcard count
     * @Query allows you to write custom JPQL queries
     *
     * This is useful for the deck list view to show card counts
     */
    @Query("SELECT d FROM Deck d LEFT JOIN FETCH d.flashcards WHERE d.id = :id")
    Deck findByIdWithFlashcards(Long id);

    /**
     * Find all decks for a specific module, ordered by display order
     */
    List<Deck> findByModuleIdOrderByDisplayOrderAsc(Long moduleId);

    /**
     * Find all decks without a module (legacy decks), ordered by creation date
     */
    List<Deck> findByModuleIsNullOrderByCreatedAtDesc();
}
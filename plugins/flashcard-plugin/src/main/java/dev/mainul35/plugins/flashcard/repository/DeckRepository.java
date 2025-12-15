package dev.mainul35.plugins.flashcard.repository;

import dev.mainul35.plugins.flashcard.entity.Deck;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DeckRepository extends JpaRepository<Deck, Long> {

    List<Deck> findByTitleContainingIgnoreCase(String keyword);

    List<Deck> findAllByOrderByCreatedAtDesc();

    @Query("SELECT d FROM Deck d LEFT JOIN FETCH d.flashcards WHERE d.id = :id")
    Deck findByIdWithFlashcards(Long id);

    List<Deck> findByModuleIdOrderByDisplayOrderAsc(Long moduleId);

    List<Deck> findByModuleIsNullOrderByCreatedAtDesc();
}

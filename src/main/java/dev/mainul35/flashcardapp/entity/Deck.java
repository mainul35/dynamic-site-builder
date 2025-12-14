package dev.mainul35.flashcardapp.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "decks")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Deck {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "module_id")
    @JsonIgnore
    private Module module;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(length = 1000)
    private String description;

    @Column(name = "display_order")
    private Integer displayOrder = 0;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    /**
     * One Deck has Many Flashcards
     * cascade = CascadeType.ALL: When we delete a deck, delete all its flashcards
     * orphanRemoval = true: When we remove a flashcard from the list, delete it from DB
     * mappedBy = "deck": The Flashcard entity owns the relationship (has the foreign key)
     */
    @OneToMany(mappedBy = "deck", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<FlashCard> flashcards = new ArrayList<>();
    
    /**
     * One Deck has Many Study Sessions
     */
    @OneToMany(mappedBy = "deck", cascade = CascadeType.ALL)
    private List<StudySession> studySessions = new ArrayList<>();
    
    /**
     * Helper method to add a flashcard to this deck
     * Maintains bidirectional relationship
     */
    public void addFlashcard(FlashCard flashcard) {
        flashcards.add(flashcard);
        flashcard.setDeck(this);
    }
    
    /**
     * Helper method to remove a flashcard from this deck
     * Maintains bidirectional relationship
     */
    public void removeFlashcard(FlashCard flashcard) {
        flashcards.remove(flashcard);
        flashcard.setDeck(null);
    }
}
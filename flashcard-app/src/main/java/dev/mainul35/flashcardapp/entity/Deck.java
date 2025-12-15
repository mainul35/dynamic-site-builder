package dev.mainul35.flashcardapp.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import dev.mainul35.cms.sdk.entity.PluginEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "plugin_flashcard_decks")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class Deck extends PluginEntity {

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
     * Constructor for creating a deck with plugin ID
     */
    public Deck(String pluginId) {
        super(pluginId);
    }

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
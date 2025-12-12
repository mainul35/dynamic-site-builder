package dev.mainul35.flashcardapp.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "flashcards")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FlashCard {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "front_content", nullable = false, length = 2000)
    private String frontContent;
    
    @Column(name = "back_content", nullable = false, length = 2000)
    private String backContent;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    /**
     * Many Flashcards belong to One Deck
     * @JsonIgnore: Prevents infinite recursion when serializing to JSON
     * Deck has flashcards → Flashcard has deck → Deck has flashcards → ...
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "deck_id", nullable = false)
    @JsonIgnore
    private Deck deck;
    
    /**
     * Constructor for easy creation without setting timestamps/id
     */
    public FlashCard(String frontContent, String backContent) {
        this.frontContent = frontContent;
        this.backContent = backContent;
    }
}
package dev.mainul35.flashcardapp.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "study_sessions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StudySession {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @CreationTimestamp
    @Column(name = "started_at", nullable = false, updatable = false)
    private LocalDateTime startedAt;
    
    @Column(name = "completed_at")
    private LocalDateTime completedAt;
    
    /**
     * Score: number of correct answers
     */
    @Column(nullable = false)
    private Integer score = 0;
    
    /**
     * Total number of cards in this study session
     */
    @Column(name = "total_cards", nullable = false)
    private Integer totalCards = 0;
    
    /**
     * Many Study Sessions belong to One Module (for module-level quizzes)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "module_id")
    @JsonIgnore
    private Module module;

    /**
     * Legacy: Many Study Sessions belong to One Deck (for migration compatibility)
     * Will be removed after successful migration
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "deck_id")
    @JsonIgnore
    private Deck deck;
    
    /**
     * Calculate percentage score
     */
    public double getPercentage() {
        if (totalCards == 0) {
            return 0.0;
        }
        return (score * 100.0) / totalCards;
    }
    
    /**
     * Check if session is completed
     */
    public boolean isCompleted() {
        return completedAt != null;
    }
}
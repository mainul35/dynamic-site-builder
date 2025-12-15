package dev.mainul35.flashcardapp.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import dev.mainul35.cms.sdk.entity.PluginEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "plugin_flashcard_study_sessions")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class StudySession extends PluginEntity {

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
     * Constructor for creating a study session with plugin ID
     */
    public StudySession(String pluginId) {
        super(pluginId);
    }

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
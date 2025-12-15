package dev.mainul35.flashcardapp.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import dev.mainul35.cms.sdk.entity.PluginEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "plugin_flashcard_cards")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class FlashCard extends PluginEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "front_content", nullable = false, columnDefinition = "TEXT")
    private String frontContent;

    @Column(name = "back_content", nullable = false, columnDefinition = "TEXT")
    private String backContent;

    /**
     * Content format: "html" for rich text (Quill), "markdown" for legacy content
     */
    @Column(name = "content_format", length = 20)
    private String contentFormat = "html";

    /**
     * Question type: "multiple_choice", "true_false"
     */
    @Column(name = "question_type", length = 20)
    private String questionType = "multiple_choice";

    /**
     * Answer options for multiple choice questions (JSON array)
     * Example: ["Option A", "Option B", "Option C", "Option D"]
     */
    @Column(name = "answer_options", columnDefinition = "TEXT")
    private String answerOptions;

    /**
     * Correct answer(s) for automatic grading
     * For multiple choice: JSON array of correct option indices (e.g., "[0, 2]" for options A and C)
     * For true/false: "true" or "false"
     */
    @Column(name = "correct_answer", columnDefinition = "TEXT")
    private String correctAnswer;

    /**
     * Correct answer explanation (shown when student answers incorrectly)
     * For true/false: Rich text explanation of the correct answer
     * For multiple choice: Optional explanation
     */
    @Column(name = "correct_answer_explanation", columnDefinition = "TEXT")
    private String correctAnswerExplanation;

    /**
     * Many Flashcards belong to One Lesson
     * @JsonIgnore: Prevents infinite recursion when serializing to JSON
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lesson_id")
    @JsonIgnore
    private Lesson lesson;

    /**
     * Legacy: Many Flashcards belong to One Deck (for migration compatibility)
     * Will be removed after successful migration
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "deck_id")
    @JsonIgnore
    private Deck deck;

    /**
     * Constructor for creating a flashcard with plugin ID
     */
    public FlashCard(String pluginId) {
        super(pluginId);
    }

    /**
     * Constructor for easy creation without setting timestamps/id
     */
    public FlashCard(String frontContent, String backContent) {
        this.frontContent = frontContent;
        this.backContent = backContent;
    }
}
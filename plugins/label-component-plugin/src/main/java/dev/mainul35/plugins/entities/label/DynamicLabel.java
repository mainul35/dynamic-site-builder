package dev.mainul35.plugins.entities.label;

import dev.mainul35.cms.sdk.entity.PluginEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

/**
 * Entity for storing dynamic label content that can be fetched via API.
 * Allows labels to display content from the database instead of static text.
 */
@Entity
@Table(name = "plugin_label_dynamic_content",
    uniqueConstraints = @UniqueConstraint(columnNames = {"content_key", "language", "plugin_id"}),
    indexes = {
        @Index(name = "idx_label_key_lang", columnList = "content_key, language"),
        @Index(name = "idx_label_plugin", columnList = "plugin_id")
    })
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DynamicLabel extends PluginEntity {

    private static final String PLUGIN_ID = "label-component-plugin";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Unique key to identify this content (e.g., "about-me", "welcome-message")
     */
    @Column(name = "content_key", nullable = false, length = 100)
    private String contentKey;

    /**
     * The actual text content to display
     */
    @Column(columnDefinition = "TEXT")
    private String content;

    /**
     * Language code (e.g., "en", "bn", "es")
     * Allows for multi-language support
     */
    @Column(name = "language", length = 10, nullable = false)
    @Builder.Default
    private String language = "en";

    /**
     * Optional title/label for admin UI
     */
    @Column(length = 200)
    private String title;

    /**
     * Optional description for admin UI
     */
    @Column(length = 500)
    private String description;

    /**
     * Whether this content is active/published
     */
    @Column(name = "is_active")
    @Builder.Default
    private boolean active = true;

    /**
     * Constructor with required fields
     */
    public DynamicLabel(String contentKey, String content) {
        super(PLUGIN_ID);
        this.contentKey = contentKey;
        this.content = content;
        this.language = "en";
        this.active = true;
    }

    /**
     * Constructor with language
     */
    public DynamicLabel(String contentKey, String content, String language) {
        super(PLUGIN_ID);
        this.contentKey = contentKey;
        this.content = content;
        this.language = language;
        this.active = true;
    }

    @PrePersist
    public void prePersist() {
        if (getPluginId() == null) {
            setPluginId(PLUGIN_ID);
        }
    }
}

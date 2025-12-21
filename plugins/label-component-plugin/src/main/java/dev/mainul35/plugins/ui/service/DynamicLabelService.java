package dev.mainul35.plugins.ui.service;

import dev.mainul35.cms.sdk.annotation.PluginService;
import dev.mainul35.plugins.entities.label.DynamicLabel;
import dev.mainul35.plugins.label.repository.DynamicLabelRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Service for managing dynamic label content.
 * Provides business logic for CRUD operations on labels.
 */
@Service
@PluginService(pluginId = "label-component-plugin")
public class DynamicLabelService {

    private static final Logger log = LoggerFactory.getLogger(DynamicLabelService.class);
    private static final String PLUGIN_ID = "label-component-plugin";

    private final DynamicLabelRepository labelRepository;

    public DynamicLabelService(DynamicLabelRepository labelRepository) {
        this.labelRepository = labelRepository;
    }

    /**
     * Get label content by key and language.
     * Falls back to English if the requested language is not found.
     */
    @Transactional(readOnly = true)
    public Optional<DynamicLabel> getLabelByKey(String contentKey, String language) {
        log.debug("Fetching label for key: {}, language: {}", contentKey, language);

        // Try exact match first
        Optional<DynamicLabel> label = labelRepository.findByContentKeyAndLanguageAndActiveTrue(contentKey, language);

        // Fall back to English if not found
        if (label.isEmpty() && !"en".equals(language)) {
            log.debug("Label not found for language {}, falling back to English", language);
            label = labelRepository.findByContentKeyAndLanguageAndActiveTrue(contentKey, "en");
        }

        return label;
    }

    /**
     * Get label content by key (uses default language or first available)
     */
    @Transactional(readOnly = true)
    public Optional<DynamicLabel> getLabelByKey(String contentKey) {
        return labelRepository.findFirstByContentKeyAndActiveTrue(contentKey);
    }

    /**
     * Get all labels for a specific language
     */
    @Transactional(readOnly = true)
    public List<DynamicLabel> getAllLabels(String language) {
        return labelRepository.findAllByLanguageAndActiveTrue(language);
    }

    /**
     * Get all active labels
     */
    @Transactional(readOnly = true)
    public List<DynamicLabel> getAllLabels() {
        return labelRepository.findAllByActiveTrue();
    }

    /**
     * Create a new dynamic label
     */
    @Transactional
    public DynamicLabel createLabel(String contentKey, String content, String language, String title, String description) {
        log.info("Creating new label with key: {}, language: {}", contentKey, language);

        DynamicLabel label = DynamicLabel.builder()
                .contentKey(contentKey)
                .content(content)
                .language(language != null ? language : "en")
                .title(title)
                .description(description)
                .active(true)
                .build();
        label.setPluginId(PLUGIN_ID);

        return labelRepository.save(label);
    }

    /**
     * Update an existing label
     */
    @Transactional
    public Optional<DynamicLabel> updateLabel(Long id, String content, String title, String description, Boolean active) {
        log.info("Updating label with id: {}", id);

        return labelRepository.findById(id)
                .map(label -> {
                    if (content != null) label.setContent(content);
                    if (title != null) label.setTitle(title);
                    if (description != null) label.setDescription(description);
                    if (active != null) label.setActive(active);
                    return labelRepository.save(label);
                });
    }

    /**
     * Delete a label by ID
     */
    @Transactional
    public boolean deleteLabel(Long id) {
        log.info("Deleting label with id: {}", id);

        if (labelRepository.existsById(id)) {
            labelRepository.deleteById(id);
            return true;
        }
        return false;
    }

    /**
     * Check if a label exists with the given key and language
     */
    @Transactional(readOnly = true)
    public boolean labelExists(String contentKey, String language) {
        return labelRepository.existsByContentKeyAndLanguage(contentKey, language);
    }
}

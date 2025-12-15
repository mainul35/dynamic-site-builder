package dev.mainul35.plugins.flashcard.service;

import dev.mainul35.cms.sdk.annotation.PluginService;
import dev.mainul35.plugins.flashcard.entity.Deck;
import dev.mainul35.plugins.flashcard.repository.DeckRepository;
import dev.mainul35.plugins.flashcard.repository.FlashCardRepository;
import dev.mainul35.plugins.course.repository.ModuleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@PluginService(pluginId = "flashcard-plugin")
@RequiredArgsConstructor
public class DeckService extends dev.mainul35.cms.sdk.service.PluginService {

    private final DeckRepository deckRepository;
    private final FlashCardRepository flashcardRepository;
    private final ModuleRepository moduleRepository;

    @Transactional(readOnly = true)
    public List<Deck> getAllDecks() {
        logInfo("Fetching all decks");
        return deckRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public Optional<Deck> getDeckById(Long id) {
        logInfo("Fetching deck with id: {}", id);
        return deckRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public Optional<Deck> getDeckWithFlashcards(Long id) {
        logInfo("Fetching deck with flashcards, id: {}", id);
        Deck deck = deckRepository.findByIdWithFlashcards(id);
        return Optional.ofNullable(deck);
    }

    @Transactional(readOnly = true)
    public List<Deck> getDecksByModuleId(Long moduleId) {
        logInfo("Fetching decks for module: {}", moduleId);
        return deckRepository.findByModuleIdOrderByDisplayOrderAsc(moduleId);
    }

    @Transactional
    public Deck createDeck(Deck deck) {
        logInfo("Creating new deck: {}", deck.getTitle());

        if (deck.getTitle() == null || deck.getTitle().trim().isEmpty()) {
            throw new IllegalArgumentException("Deck title cannot be empty");
        }

        if (deck.getPluginId() == null) {
            deck.setPluginId("flashcard-plugin");
        }

        return deckRepository.save(deck);
    }

    @Transactional
    public Deck createDeckInModule(Long moduleId, Deck deck) {
        logInfo("Creating new deck in module: {}", moduleId);

        if (deck.getTitle() == null || deck.getTitle().trim().isEmpty()) {
            throw new IllegalArgumentException("Deck title cannot be empty");
        }

        return moduleRepository.findById(moduleId)
            .map(module -> {
                deck.setModule(module);
                if (deck.getPluginId() == null) {
                    deck.setPluginId("flashcard-plugin");
                }
                if (deck.getDisplayOrder() == null) {
                    deck.setDisplayOrder(0);
                }

                Deck savedDeck = deckRepository.save(deck);
                logInfo("Deck created with id: {}", savedDeck.getId());
                return savedDeck;
            })
            .orElseThrow(() -> {
                logError("Module not found with id: {}", moduleId);
                return new RuntimeException("Module not found with id: " + moduleId);
            });
    }

    @Transactional
    public Deck updateDeck(Long id, Deck updatedDeck) {
        logInfo("Updating deck with id: {}", id);

        return deckRepository.findById(id)
            .map(existingDeck -> {
                existingDeck.setTitle(updatedDeck.getTitle());
                existingDeck.setDescription(updatedDeck.getDescription());
                if (updatedDeck.getDisplayOrder() != null) {
                    existingDeck.setDisplayOrder(updatedDeck.getDisplayOrder());
                }
                Deck saved = deckRepository.save(existingDeck);
                logInfo("Deck updated: {}", saved.getId());
                return saved;
            })
            .orElseThrow(() -> {
                logError("Deck not found with id: {}", id);
                return new RuntimeException("Deck not found with id: " + id);
            });
    }

    @Transactional
    public void deleteDeck(Long id) {
        logInfo("Deleting deck with id: {}", id);

        if (!deckRepository.existsById(id)) {
            throw new RuntimeException("Deck not found with id: " + id);
        }

        deckRepository.deleteById(id);
        logInfo("Deck deleted: {}", id);
    }

    @Transactional(readOnly = true)
    public List<Deck> searchDecksByTitle(String keyword) {
        logInfo("Searching decks with keyword: {}", keyword);
        return deckRepository.findByTitleContainingIgnoreCase(keyword);
    }

    @Transactional(readOnly = true)
    public long getFlashcardCount(Long deckId) {
        return flashcardRepository.countByDeckId(deckId);
    }
}

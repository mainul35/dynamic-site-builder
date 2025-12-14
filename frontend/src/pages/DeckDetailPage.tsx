import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { deckService } from '../services/deckService';
import { flashcardService } from '../services/flashcardService';
import { Deck, Flashcard, CreateFlashcardRequest } from '../types';
import FlashcardForm from '../components/FlashcardForm';
import './DeckDetailPage.css';

const DeckDetailPage: React.FC = () => {
  const { id, courseId, moduleId } = useParams<{ id: string; courseId?: string; moduleId?: string }>();
  const deckId = parseInt(id || '0');

  // Determine if we're in module context (coming from a module) or standalone
  const isModuleContext = courseId && moduleId;
  const backLink = isModuleContext
    ? `/courses/${courseId}/modules/${moduleId}`
    : '/decks';
  const backText = isModuleContext ? 'Back to Module' : 'Back to Decks';

  const [deck, setDeck] = useState<Deck | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (deckId) {
      loadDeckAndFlashcards();
    }
  }, [deckId]);

  const loadDeckAndFlashcards = async () => {
    try {
      setLoading(true);
      setError(null);
      const [deckData, flashcardsData] = await Promise.all([
        deckService.getDeckById(deckId),
        flashcardService.getFlashcardsByDeckId(deckId),
      ]);
      setDeck(deckData);
      // Ensure flashcardsData is an array
      setFlashcards(Array.isArray(flashcardsData) ? flashcardsData : []);
    } catch (err) {
      setError('Failed to load deck details. Please try again.');
      console.error('Error loading deck:', err);
      setFlashcards([]); // Set to empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFlashcard = async (flashcardData: CreateFlashcardRequest) => {
    try {
      setIsCreating(true);
      setError(null);
      const newFlashcard = await flashcardService.createFlashcard(deckId, flashcardData);
      setFlashcards((prev) => [...prev, newFlashcard]);
      setShowForm(false);
    } catch (err) {
      setError('Failed to create flashcard. Please try again.');
      console.error('Error creating flashcard:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteFlashcard = async (flashcardId: number) => {
    if (!window.confirm('Are you sure you want to delete this flashcard?')) {
      return;
    }

    try {
      await flashcardService.deleteFlashcard(flashcardId);
      setFlashcards((prev) => prev.filter((card) => card.id !== flashcardId));
    } catch (err) {
      setError('Failed to delete flashcard. Please try again.');
      console.error('Error deleting flashcard:', err);
    }
  };

  if (loading) {
    return (
      <div className="deck-detail-page">
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (!deck) {
    return (
      <div className="deck-detail-page">
        <div className="error">
          Deck not found
        </div>
        <Link to={backLink} className="btn btn-primary">
          {backText}
        </Link>
      </div>
    );
  }

  return (
    <div className="deck-detail-page">
      {error && (
        <div className="error">
          {error}
          <button
            className="btn-close"
            onClick={() => setError(null)}
            aria-label="Close"
          >
            ×
          </button>
        </div>
      )}

      <div className="deck-header">
        <div>
          <h1>{deck.title}</h1>
          <p className="deck-description">{deck.description}</p>
          <div className="deck-stats">
            <span className="stat">
              📚 {flashcards.length} {flashcards.length === 1 ? 'card' : 'cards'}
            </span>
          </div>
        </div>
        <div className="deck-actions">
          <Link to={backLink} className="btn btn-secondary">
            {backText}
          </Link>
          {flashcards.length > 0 && (
            <Link to={`/study/${deckId}`} className="btn btn-success">
              Start Studying
            </Link>
          )}
        </div>
      </div>

      <div className="flashcards-section">
        <div className="section-header">
          <h2>Flashcards</h2>
          {!showForm && (
            <button
              className="btn btn-primary"
              onClick={() => setShowForm(true)}
            >
              + Add Flashcard
            </button>
          )}
        </div>

        {showForm && (
          <div className="card">
            <h3>Add New Flashcard</h3>
            <FlashcardForm
              onSubmit={handleCreateFlashcard}
              onCancel={() => setShowForm(false)}
              isLoading={isCreating}
            />
          </div>
        )}

        {flashcards.length === 0 && !showForm ? (
          <div className="card text-center empty-state">
            <h3>No Flashcards Yet</h3>
            <p>Add your first flashcard to start studying this deck!</p>
            <button
              className="btn btn-primary mt-20"
              onClick={() => setShowForm(true)}
            >
              Add Your First Flashcard
            </button>
          </div>
        ) : (
          <div className="flashcards-list">
            {Array.isArray(flashcards) && flashcards.map((flashcard, index) => (
              <div key={flashcard.id} className="flashcard-item">
                <div className="flashcard-number">#{index + 1}</div>
                <div className="flashcard-content">
                  <div className="flashcard-side">
                    <div className="side-label">Question</div>
                    <div className="side-content markdown-content">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {flashcard.frontContent}
                      </ReactMarkdown>
                    </div>
                  </div>
                  <div className="flashcard-divider">→</div>
                  <div className="flashcard-side">
                    <div className="side-label">Answer</div>
                    <div className="side-content markdown-content">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {flashcard.backContent}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
                <div className="flashcard-actions">
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDeleteFlashcard(flashcard.id!)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DeckDetailPage;

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { deckService } from '../services/deckService';
import { Deck, CreateDeckRequest } from '../types';
import DeckForm from '../components/DeckForm';
import '../components/DeckForm.css';
import './DeckListPage.css';

const DeckListPage: React.FC = () => {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadDecks();
  }, []);

  const loadDecks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await deckService.getAllDecks();
      setDecks(data);
    } catch (err) {
      setError('Failed to load decks. Please try again.');
      console.error('Error loading decks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDeck = async (deckData: CreateDeckRequest) => {
    try {
      setIsCreating(true);
      setError(null);
      const newDeck = await deckService.createDeck(deckData);
      setDecks((prev) => [...prev, newDeck]);
      setShowForm(false);
    } catch (err) {
      setError('Failed to create deck. Please try again.');
      console.error('Error creating deck:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteDeck = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this deck?')) {
      return;
    }

    try {
      await deckService.deleteDeck(id);
      setDecks((prev) => prev.filter((deck) => deck.id !== id));
    } catch (err) {
      setError('Failed to delete deck. Please try again.');
      console.error('Error deleting deck:', err);
    }
  };

  if (loading) {
    return (
      <div className="deck-list-page">
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="deck-list-page">
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

      {!showForm ? (
        <>
          <div className="deck-list-header">
            <h2>My Decks</h2>
            <button
              className="btn btn-primary"
              onClick={() => setShowForm(true)}
            >
              + Create New Deck
            </button>
          </div>

          {decks.length === 0 ? (
            <div className="card text-center empty-state">
              <h3>No Decks Yet</h3>
              <p>Create your first deck to start studying!</p>
              <button
                className="btn btn-primary mt-20"
                onClick={() => setShowForm(true)}
              >
                Create Your First Deck
              </button>
            </div>
          ) : (
            <div className="deck-grid">
              {decks.map((deck) => (
                <div key={deck.id} className="deck-card">
                  <div className="deck-card-header">
                    <h3>{deck.title}</h3>
                  </div>
                  <div className="deck-card-body">
                    <p>{deck.description}</p>
                  </div>
                  <div className="deck-card-footer">
                    <Link
                      to={`/decks/${deck.id}`}
                      className="btn btn-primary btn-sm"
                    >
                      View Details
                    </Link>
                    <Link
                      to={`/study/${deck.id}`}
                      className="btn btn-success btn-sm"
                    >
                      Study
                    </Link>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteDeck(deck.id!)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="card">
          <h2>Create New Deck</h2>
          <DeckForm
            onSubmit={handleCreateDeck}
            onCancel={() => setShowForm(false)}
            isLoading={isCreating}
          />
        </div>
      )}
    </div>
  );
};

export default DeckListPage;

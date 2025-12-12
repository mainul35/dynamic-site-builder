import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { deckService } from '../services/deckService';
import { flashcardService } from '../services/flashcardService';
import { studySessionService } from '../services/studySessionService';
import { Deck, Flashcard, StudySession } from '../types';
import FlipCard from '../components/FlipCard';
import './StudyPage.css';

const StudyPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const deckId = parseInt(id || '0');

  const [deck, setDeck] = useState<Deck | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [studySession, setStudySession] = useState<StudySession | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    loadDeckAndStartSession();
  }, [deckId]);

  const loadDeckAndStartSession = async () => {
    try {
      setLoading(true);
      setError(null);

      const [deckData, flashcardsData] = await Promise.all([
        deckService.getDeckById(deckId),
        flashcardService.getFlashcardsByDeckId(deckId),
      ]);

      setDeck(deckData);
      const cards = Array.isArray(flashcardsData) ? flashcardsData : [];

      if (cards.length === 0) {
        setError('This deck has no flashcards to study.');
        setLoading(false);
        return;
      }

      // Shuffle the flashcards
      const shuffled = [...cards].sort(() => Math.random() - 0.5);
      setFlashcards(shuffled);

      // Start a study session
      const session = await studySessionService.startStudySession(deckId, cards.length);
      setStudySession(session);

    } catch (err) {
      setError('Failed to load study session. Please try again.');
      console.error('Error loading study session:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCorrect = () => {
    setScore(score + 1);
    moveToNext();
  };

  const handleIncorrect = () => {
    moveToNext();
  };

  const moveToNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      completeSession();
    }
  };

  const completeSession = async () => {
    if (studySession) {
      try {
        await studySessionService.completeStudySession(studySession.id!, score + (currentIndex === flashcards.length - 1 ? 1 : 0));
        setIsComplete(true);
      } catch (err) {
        console.error('Error completing session:', err);
        setIsComplete(true);
      }
    } else {
      setIsComplete(true);
    }
  };

  const handleRestart = () => {
    navigate(0); // Reload the page to restart
  };

  const handleGoBack = () => {
    navigate(`/decks/${deckId}`);
  };

  if (loading) {
    return (
      <div className="study-page">
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (error || !deck || flashcards.length === 0) {
    return (
      <div className="study-page">
        <div className="error-container">
          <h2>⚠️ Unable to Start Study Session</h2>
          <p>{error || 'This deck has no flashcards.'}</p>
          <Link to={`/decks/${deckId}`} className="btn btn-primary">
            Back to Deck
          </Link>
        </div>
      </div>
    );
  }

  if (isComplete) {
    const percentage = Math.round((score / flashcards.length) * 100);

    return (
      <div className="study-page">
        <div className="completion-container">
          <div className="completion-icon">
            {percentage >= 80 ? '🎉' : percentage >= 50 ? '👍' : '💪'}
          </div>
          <h1>Study Session Complete!</h1>
          <div className="score-display">
            <div className="score-number">{score} / {flashcards.length}</div>
            <div className="score-percentage">{percentage}%</div>
          </div>
          <p className="score-message">
            {percentage >= 80 ? 'Excellent work!' :
             percentage >= 50 ? 'Good job! Keep practicing.' :
             'Keep studying to improve!'}
          </p>
          <div className="completion-actions">
            <button className="btn btn-primary" onClick={handleRestart}>
              Study Again
            </button>
            <button className="btn btn-secondary" onClick={handleGoBack}>
              Back to Deck
            </button>
            <Link to="/decks" className="btn btn-secondary">
              All Decks
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentCard = flashcards[currentIndex];
  const progress = ((currentIndex + 1) / flashcards.length) * 100;

  return (
    <div className="study-page">
      <div className="study-header">
        <div className="study-info">
          <h1>{deck.title}</h1>
          <p className="study-description">{deck.description}</p>
        </div>
        <div className="study-stats">
          <div className="stat">
            <span className="stat-value">{currentIndex + 1}</span>
            <span className="stat-label">/ {flashcards.length}</span>
          </div>
          <div className="stat">
            <span className="stat-value">{score}</span>
            <span className="stat-label">Correct</span>
          </div>
        </div>
      </div>

      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }}></div>
      </div>

      <FlipCard
        flashcard={currentCard}
        onCorrect={handleCorrect}
        onIncorrect={handleIncorrect}
      />

      <div className="study-footer">
        <button className="btn btn-secondary" onClick={handleGoBack}>
          Exit Study Mode
        </button>
      </div>
    </div>
  );
};

export default StudyPage;

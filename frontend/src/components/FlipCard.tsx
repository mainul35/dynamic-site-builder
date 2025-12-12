import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Flashcard } from '../types';
import './FlipCard.css';

interface FlipCardProps {
  flashcard: Flashcard;
  onCorrect: () => void;
  onIncorrect: () => void;
  showButtons?: boolean;
}

const FlipCard: React.FC<FlipCardProps> = ({
  flashcard,
  onCorrect,
  onIncorrect,
  showButtons = true,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleCorrect = () => {
    onCorrect();
    setIsFlipped(false);
  };

  const handleIncorrect = () => {
    onIncorrect();
    setIsFlipped(false);
  };

  return (
    <div className="flip-card-container">
      <div className={`flip-card ${isFlipped ? 'flipped' : ''}`} onClick={handleFlip}>
        <div className="flip-card-inner">
          <div className="flip-card-front">
            <div className="card-label">Question</div>
            <div className="card-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {flashcard.frontContent}
              </ReactMarkdown>
            </div>
            <div className="flip-hint">Click to flip</div>
          </div>
          <div className="flip-card-back">
            <div className="card-label">Answer</div>
            <div className="card-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {flashcard.backContent}
              </ReactMarkdown>
            </div>
            <div className="flip-hint">Click to flip back</div>
          </div>
        </div>
      </div>

      {showButtons && isFlipped && (
        <div className="flip-card-actions">
          <button className="btn btn-danger" onClick={(e) => { e.stopPropagation(); handleIncorrect(); }}>
            ❌ Incorrect
          </button>
          <button className="btn btn-success" onClick={(e) => { e.stopPropagation(); handleCorrect(); }}>
            ✅ Correct
          </button>
        </div>
      )}
    </div>
  );
};

export default FlipCard;

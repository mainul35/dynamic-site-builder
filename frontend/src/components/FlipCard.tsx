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
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Set<number>>(new Set());
  const [isFlipped, setIsFlipped] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const questionType = flashcard.questionType || 'multiple_choice';
  const hasAutoGrading = flashcard.correctAnswer !== undefined && flashcard.correctAnswer !== null;

  // Parse answer options if available
  const answerOptions = flashcard.answerOptions
    ? JSON.parse(flashcard.answerOptions)
    : [];

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const checkAnswer = () => {
    let correct = false;

    if (!hasAutoGrading) {
      // If no correct answer is set, treat as old-style flashcard (always correct)
      correct = true;
    } else if (questionType === 'true_false') {
      correct = selectedAnswer === flashcard.correctAnswer;
    } else if (questionType === 'multiple_choice') {
      try {
        const correctAnswers = JSON.parse(flashcard.correctAnswer!);
        if (Array.isArray(correctAnswers)) {
          // Multiple correct answers
          const selectedArray = Array.from(selectedOptions).sort();
          correct = JSON.stringify(selectedArray) === JSON.stringify(correctAnswers.sort());
        } else {
          // Single correct answer (index)
          correct = selectedOptions.has(correctAnswers);
        }
      } catch {
        // If parsing fails, treat correctAnswer as a single index
        const correctIndex = parseInt(flashcard.correctAnswer!);
        correct = selectedOptions.size === 1 && selectedOptions.has(correctIndex);
      }
    }

    setIsCorrect(correct);
    setShowResult(true);
  };

  const handleResultOk = () => {
    if (isCorrect) {
      onCorrect();
    } else {
      onIncorrect();
    }
    resetCard();
  };

  const resetCard = () => {
    setSelectedAnswer(null);
    setSelectedOptions(new Set());
    setIsFlipped(false);
    setShowResult(false);
    setIsCorrect(false);
  };

  const handleMultipleChoiceToggle = (index: number) => {
    const newSelected = new Set(selectedOptions);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedOptions(newSelected);
  };

  const renderQuestion = () => {
    if (questionType === 'true_false') {
      return (
        <>
          <div className={`flip-card ${isFlipped ? 'flipped' : ''}`} onClick={handleFlip}>
            <div className="flip-card-inner">
              <div className="flip-card-front">
                <div className="card-label">Question</div>
                <div className="card-content">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {flashcard.frontContent}
                  </ReactMarkdown>
                </div>
                <div className="flip-hint">Click to flip and see explanation</div>
              </div>
              <div className="flip-card-back">
                <div className="card-label">Explanation</div>
                <div className="card-content">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {flashcard.backContent}
                  </ReactMarkdown>
                </div>
                <div className="flip-hint">Now choose your answer below</div>
              </div>
            </div>
          </div>

          {isFlipped && !showResult && (
            <div className="answer-section true-false-section">
              <button
                className={`btn answer-btn true-false-btn ${selectedAnswer === 'true' ? 'selected' : ''}`}
                onClick={(e) => { e.stopPropagation(); setSelectedAnswer('true'); }}
                disabled={showResult}
              >
                ✓ True / Yes
              </button>
              <button
                className={`btn answer-btn true-false-btn ${selectedAnswer === 'false' ? 'selected' : ''}`}
                onClick={(e) => { e.stopPropagation(); setSelectedAnswer('false'); }}
                disabled={showResult}
              >
                ✗ False / No
              </button>
            </div>
          )}

          {!showResult && selectedAnswer && isFlipped && (
            <button className="btn btn-primary submit-btn" onClick={(e) => { e.stopPropagation(); checkAnswer(); }}>
              Submit Answer
            </button>
          )}
        </>
      );
    }

    if (questionType === 'multiple_choice' && answerOptions.length > 0) {
      return (
        <div className="quiz-container">
          <div className="card-label">Question</div>
          <div className="card-content">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {flashcard.frontContent}
            </ReactMarkdown>
          </div>
          <div className="answer-section">
            {answerOptions.map((option: string, index: number) => (
              <button
                key={index}
                className={`btn answer-btn ${selectedOptions.has(index) ? 'selected' : ''}`}
                onClick={() => handleMultipleChoiceToggle(index)}
                disabled={showResult}
              >
                {String.fromCharCode(65 + index)}. {option}
              </button>
            ))}
          </div>
          {!showResult && selectedOptions.size > 0 && (
            <button className="btn btn-primary submit-btn" onClick={checkAnswer}>
              Submit Answer
            </button>
          )}
        </div>
      );
    }

    // Default: shouldn't reach here, but fallback to multiple choice
    return null;
  };

  return (
    <div className="flip-card-container">
      {renderQuestion()}

      {showResult && (
        <div className={`result-banner ${isCorrect ? 'correct' : 'incorrect'}`}>
          <div className="result-header">
            {isCorrect ? '✅ Correct!' : '❌ Incorrect'}
          </div>
          {!isCorrect && flashcard.correctAnswerExplanation && (
            <div className="correct-answer-display">
              <div className="correct-answer-label">Correct Answer:</div>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {flashcard.correctAnswerExplanation}
              </ReactMarkdown>
            </div>
          )}
          <button
            className="btn btn-primary result-ok-btn"
            onClick={(e) => { e.stopPropagation(); handleResultOk(); }}
          >
            OK
          </button>
        </div>
      )}
    </div>
  );
};

export default FlipCard;

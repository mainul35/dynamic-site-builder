import React from 'react';

const HomePage: React.FC = () => {
  return (
    <div className="home-page">
      <div className="card text-center">
        <h2>Welcome to Flashcard Quiz App! 🎓</h2>
        <p>Create decks, add flashcards, and study efficiently.</p>
        
        <div className="mt-20">
          <a href="/courses" className="btn btn-primary">
            Get Started
          </a>
        </div>
      </div>

      <div className="grid mt-20">
        <div className="card">
          <h3>📚 Create Decks</h3>
          <p>Organize your flashcards into decks by topic or subject.</p>
        </div>
        
        <div className="card">
          <h3>✏️ Add Cards</h3>
          <p>Create flashcards with questions on the front and answers on the back.</p>
        </div>
        
        <div className="card">
          <h3>🎯 Study Mode</h3>
          <p>Practice with your flashcards and track your progress.</p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
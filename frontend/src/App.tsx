import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';

// Pages
import HomePage from './pages/HomePage';
import DeckListPage from './pages/DeckListPage';
import DeckDetailPage from './pages/DeckDetailPage';
import StudyPage from './pages/StudyPage';
import HistoryPage from './pages/HistoryPage';
import CourseListPage from './pages/CourseListPage';
import CourseDetailPage from './pages/CourseDetailPage';
import ModuleDetailPage from './pages/ModuleDetailPage';
import LessonDetailPage from './pages/LessonDetailPage';

function App() {
  return (
    <Router>
      <div className="app">
        {/* Header */}
        <header className="header">
          <div className="container">
            <h1>🎴 Flashcard Quiz App</h1>
          </div>
        </header>

        {/* Navigation */}
        <nav className="nav">
          <div className="container">
            <ul className="nav-links">
              <li>
                <Link to="/">Home</Link>
              </li>
              <li>
                <Link to="/courses">Courses</Link>
              </li>
              <li>
                <Link to="/history">Quiz History</Link>
              </li>
            </ul>
          </div>
        </nav>

        {/* Main Content */}
        <main className="main-content">
          <div className="container">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/courses" element={<CourseListPage />} />
              <Route path="/courses/:courseId" element={<CourseDetailPage />} />
              <Route path="/courses/:courseId/modules/:moduleId" element={<ModuleDetailPage />} />
              <Route path="/courses/:courseId/modules/:moduleId/lessons/:lessonId" element={<LessonDetailPage />} />
              <Route path="/decks" element={<DeckListPage />} />
              <Route path="/decks/:id" element={<DeckDetailPage />} />
              <Route path="/study/:id" element={<StudyPage />} />
              <Route path="/history" element={<HistoryPage />} />
            </Routes>
          </div>
        </main>

        {/* Footer */}
        <footer className="footer">
          <div className="container">
            <p>&copy; 2024 Flashcard Quiz App. Built with React & Spring Boot.</p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
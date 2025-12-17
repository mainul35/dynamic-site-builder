import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Pages
import { BuilderPage } from './pages/BuilderPage';

function App() {
  return (
    <Router>
      <Routes>
        {/* Builder Routes - Full Screen */}
        <Route path="/builder/sites/:siteId/pages/:pageId" element={<BuilderPage />} />
        <Route path="/builder/new" element={<BuilderPage />} />
        <Route path="/" element={<BuilderPage />} />
        <Route path="*" element={<BuilderPage />} />
      </Routes>
    </Router>
  );
}

export default App;
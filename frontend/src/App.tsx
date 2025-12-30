import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import './App.css';

// Pages
import { BuilderPage } from './pages/BuilderPage';
import { LoginPage } from './pages/LoginPage';

// Auth components
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// Services
import { authService } from './services/authService';

function App() {
  // Initialize auth on app load
  useEffect(() => {
    authService.initializeAuth().catch((err) => {
      console.log('Auth initialization failed:', err);
    });
  }, []);

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Builder Routes - Full Screen */}
        <Route
          path="/builder/sites/:siteId/pages/:pageId"
          element={
            <ProtectedRoute requiredRoles={['ADMIN', 'DESIGNER']}>
              <BuilderPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/builder/new"
          element={
            <ProtectedRoute requiredRoles={['ADMIN', 'DESIGNER']}>
              <BuilderPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute requiredRoles={['ADMIN', 'DESIGNER']}>
              <BuilderPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="*"
          element={
            <ProtectedRoute requiredRoles={['ADMIN', 'DESIGNER']}>
              <BuilderPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;

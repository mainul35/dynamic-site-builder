import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import './App.css';

// Pages
import { BuilderPage } from './pages/BuilderPage';
import { LoginPage } from './pages/LoginPage';
import { OAuth2CallbackPage } from './pages/OAuth2CallbackPage';

// Auth components
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// Services
import { registerCoreExportTemplates } from './services/coreExportTemplates';

// Register core export templates on module load (before components render)
registerCoreExportTemplates();

// Debug component to log routing
function RouteLogger() {
  const location = useLocation();
  console.log('=== App RouteLogger ===');
  console.log('Current pathname:', location.pathname);
  console.log('Current search:', location.search);
  console.log('Full URL:', window.location.href);
  return null;
}

function App() {
  // Log at App render time
  console.log('=== App RENDER ===');
  console.log('window.location.pathname:', window.location.pathname);
  console.log('window.location.search:', window.location.search);

  return (
    <Router>
      <RouteLogger />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/oauth2/callback" element={<OAuth2CallbackPage />} />

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

import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore, UserProfile } from '../stores/authStore';
import './LoginPage.css';

// Log at module load time - this will show when the file is imported
console.log('=== OAuth2CallbackPage MODULE LOADED ===');
console.log('Current URL at module load:', window.location.href);
console.log('URL length:', window.location.href.length);
console.log('Current pathname:', window.location.pathname);
console.log('Current search:', window.location.search);
console.log('Search length:', window.location.search.length);

// Try to extract token directly from URL
const urlParams = new URLSearchParams(window.location.search);
const tokenFromUrl = urlParams.get('token');
console.log('Token from URL at module load:', tokenFromUrl ? `${tokenFromUrl.substring(0, 50)}... (length: ${tokenFromUrl.length})` : 'NULL');

/**
 * Decode JWT payload without verifying signature (for extracting user info client-side)
 */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

/**
 * OAuth2 callback page that receives the JWT token after successful SSO login.
 * The backend redirects here with the token as a query parameter.
 */
export const OAuth2CallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setTokens, setUser } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const processingRef = useRef(false);

  // Log immediately when component mounts
  console.log('OAuth2CallbackPage: Component mounted');
  console.log('OAuth2CallbackPage: window.location.href:', window.location.href);
  console.log('OAuth2CallbackPage: window.location.search:', window.location.search);

  useEffect(() => {
    const handleCallback = async () => {
      // Prevent multiple calls
      if (processingRef.current) {
        console.log('OAuth2CallbackPage: Already processing, skipping');
        return;
      }
      processingRef.current = true;
      console.log('OAuth2CallbackPage: handleCallback called');
      console.log('OAuth2CallbackPage: searchParams:', searchParams.toString());
      console.log('OAuth2CallbackPage: full URL:', window.location.href);
      console.log('OAuth2CallbackPage: search params from URL:', window.location.search);

      const token = searchParams.get('token');
      const errorParam = searchParams.get('error');

      console.log('OAuth2CallbackPage: token present:', !!token);
      console.log('OAuth2CallbackPage: error:', errorParam);

      if (errorParam) {
        setError(`Authentication failed: ${errorParam}`);
        return;
      }

      if (!token) {
        console.log('OAuth2CallbackPage: No token received!');
        setError('No authentication token received');
        return;
      }

      try {
        // Decode the JWT to extract user info
        const payload = decodeJwtPayload(token);
        if (!payload) {
          setError('Invalid token format');
          return;
        }

        // Extract expiration from token (exp is in seconds)
        const exp = payload.exp as number;
        const now = Math.floor(Date.now() / 1000);
        const expiresIn = exp ? exp - now : 3600; // Default 1 hour if no exp

        console.log('OAuth2CallbackPage: Token payload:', payload);
        console.log('OAuth2CallbackPage: expiresIn:', expiresIn);

        // Extract user profile from JWT claims
        // userId can be in 'userId' claim or 'sub' (subject) claim
        const userId = payload.userId || payload.sub;
        const userProfile: UserProfile = {
          id: Number(userId) || 0,
          username: (payload.email as string)?.split('@')[0] || 'user',
          email: payload.email as string || '',
          fullName: payload.fullName as string || payload.email as string || '',
          avatarUrl: payload.avatarUrl as string || undefined,
          roles: Array.isArray(payload.roles) ? (payload.roles as string[]) : ['USER'],
          emailVerified: true, // SSO users are considered verified
        };
        console.log('OAuth2CallbackPage: User profile:', userProfile);

        // IMPORTANT: Write directly to localStorage FIRST before updating Zustand store
        // This ensures the data is persisted before any navigation occurs
        const authData = {
          state: {
            accessToken: token,
            refreshToken: token,
            user: userProfile,
            isAuthenticated: true,
          },
          version: 0,
        };
        localStorage.setItem('auth-storage', JSON.stringify(authData));
        console.log('OAuth2CallbackPage: Wrote to localStorage directly');

        // Verify localStorage was written
        const verifyStorage = localStorage.getItem('auth-storage');
        console.log('OAuth2CallbackPage: Verified localStorage:', verifyStorage ? 'written' : 'FAILED');

        if (!verifyStorage) {
          setError('Failed to save authentication. localStorage write failed.');
          return;
        }

        // Also update Zustand store (for any components that might read from it)
        setTokens(token, token, expiresIn);
        setUser(userProfile);
        console.log('OAuth2CallbackPage: Updated Zustand store');

        // Small delay to ensure everything is synced
        await new Promise(resolve => setTimeout(resolve, 100));

        // Redirect to the dashboard using full page navigation
        console.log('OAuth2CallbackPage: Navigating to / (full page)');
        window.location.href = '/';
      } catch (err) {
        console.error('Failed to authenticate with SSO token:', err);
        setError('Failed to complete authentication. Please try again.');
      }
    };

    handleCallback();
  }, [searchParams, setTokens, setUser, navigate]);

  if (error) {
    return (
      <div className="login-page">
        <div className="login-card">
          <h2 className="login-title">Authentication Failed</h2>
          <div className="error-message">{error}</div>
          <button
            onClick={() => navigate('/login', { replace: true })}
            className="btn btn-primary btn-block"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h2 className="login-title">Completing Sign In...</h2>
        <p className="login-subtitle">Please wait while we authenticate your session.</p>
        <p style={{ fontSize: '10px', color: '#999', marginTop: '10px' }}>
          Token: {searchParams.get('token') ? `${searchParams.get('token')?.substring(0, 20)}... (${searchParams.get('token')?.length} chars)` : 'NONE'}
        </p>
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <div className="spinner" style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #3498db',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }} />
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default OAuth2CallbackPage;

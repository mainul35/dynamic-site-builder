import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore, UserProfile } from '../stores/authStore';
import './LoginPage.css';

// Log at module load time - this will show when the file is imported
console.log('=== OAuth2CallbackPage MODULE LOADED ===');
console.log('Current URL at module load:', window.location.href);
console.log('Current pathname:', window.location.pathname);
console.log('Current search:', window.location.search);

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
 * OAuth2 callback page that receives an authorization code after successful SSO login.
 * The backend redirects here with a short-lived code that is exchanged for the JWT token
 * via a secure POST request (token is never exposed in URL).
 */
export const OAuth2CallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setTokens, setUser } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const processingRef = useRef(false);

  useEffect(() => {
    const handleCallback = async () => {
      // Prevent multiple calls
      if (processingRef.current) {
        console.log('OAuth2CallbackPage: Already processing, skipping');
        return;
      }
      processingRef.current = true;
      console.log('OAuth2CallbackPage: Processing authorization code exchange');

      const code = searchParams.get('code');
      const errorParam = searchParams.get('error');

      if (errorParam) {
        setError(`Authentication failed: ${errorParam}`);
        return;
      }

      if (!code) {
        console.log('OAuth2CallbackPage: No authorization code received!');
        setError('No authorization code received');
        return;
      }

      try {
        // Exchange the authorization code for a JWT token via secure POST request
        console.log('OAuth2CallbackPage: Exchanging code for token...');
        const response = await fetch('/api/auth/oauth2/exchange', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('OAuth2CallbackPage: Token exchange failed:', errorData);
          setError(errorData.message || 'Failed to exchange authorization code');
          return;
        }

        const data = await response.json();
        const token = data.accessToken;

        if (!token) {
          setError('No token received from exchange');
          return;
        }

        console.log('OAuth2CallbackPage: Token received successfully');

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

        // Extract user profile from JWT claims
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

        // Write to localStorage before updating Zustand store
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

        // Verify localStorage was written
        const verifyStorage = localStorage.getItem('auth-storage');
        if (!verifyStorage) {
          setError('Failed to save authentication. localStorage write failed.');
          return;
        }

        // Update Zustand store
        setTokens(token, token, expiresIn);
        setUser(userProfile);

        // Small delay to ensure everything is synced
        await new Promise(resolve => setTimeout(resolve, 100));

        // Redirect to the dashboard
        console.log('OAuth2CallbackPage: Authentication complete, redirecting to dashboard');
        window.location.href = '/';
      } catch (err) {
        console.error('Failed to complete SSO authentication:', err);
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

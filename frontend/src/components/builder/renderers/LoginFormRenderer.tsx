import React, { useState } from 'react';
import { RendererProps } from './RendererRegistry';
import './AuthComponents.css';

/**
 * LoginForm Renderer
 * Renders a username/password login form with configurable options
 */
const LoginFormRenderer: React.FC<RendererProps> = ({ component, isEditMode }) => {
  const props = component.props || {};
  const styles = component.styles || {};

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    rememberMe: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditMode) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(props.loginEndpoint || '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          rememberMe: formData.rememberMe,
        }),
      });

      if (response.ok) {
        window.location.href = props.redirectUrl || '/';
      } else {
        const data = await response.json();
        setError(data.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const containerStyle: React.CSSProperties = {
    backgroundColor: styles.backgroundColor || '#ffffff',
    borderRadius: styles.borderRadius || '12px',
    padding: styles.padding || '32px',
    boxShadow: styles.boxShadow || '0 4px 6px rgba(0, 0, 0, 0.1)',
    maxWidth: styles.maxWidth || '400px',
    width: '100%',
  };

  return (
    <div className="auth-form login-form" style={containerStyle}>
      {props.title && <h2 className="auth-form-title">{props.title}</h2>}
      {props.subtitle && <p className="auth-form-subtitle">{props.subtitle}</p>}

      <form onSubmit={handleSubmit} className="auth-form-content">
        {error && <div className="auth-form-error">{error}</div>}

        <div className="auth-form-field">
          <label htmlFor="username">{props.usernameLabel || 'Email or Username'}</label>
          <input
            type="text"
            id="username"
            placeholder={props.usernamePlaceholder || 'Enter your email or username'}
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            disabled={isEditMode || isLoading}
            required
          />
        </div>

        <div className="auth-form-field">
          <label htmlFor="password">{props.passwordLabel || 'Password'}</label>
          <input
            type="password"
            id="password"
            placeholder={props.passwordPlaceholder || 'Enter your password'}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            disabled={isEditMode || isLoading}
            required
          />
        </div>

        <div className="auth-form-options">
          {props.showRememberMe !== false && (
            <label className="auth-checkbox">
              <input
                type="checkbox"
                checked={formData.rememberMe}
                onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                disabled={isEditMode || isLoading}
              />
              <span>{props.rememberMeLabel || 'Remember me'}</span>
            </label>
          )}

          {props.showForgotPassword !== false && (
            <a
              href={props.forgotPasswordUrl || '/forgot-password'}
              className="auth-form-link"
              onClick={(e) => isEditMode && e.preventDefault()}
            >
              {props.forgotPasswordText || 'Forgot password?'}
            </a>
          )}
        </div>

        <button
          type="submit"
          className="auth-form-submit"
          disabled={isEditMode || isLoading}
        >
          {isLoading ? 'Signing in...' : props.submitButtonText || 'Sign In'}
        </button>

        {props.showSocialLogin && (
          <>
            <div className="auth-social-divider">
              <span>or continue with</span>
            </div>
            <div className="social-login-buttons" style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
              {/* Google */}
              <button
                type="button"
                className="social-login-btn"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  backgroundColor: '#ffffff',
                  color: '#757575',
                  border: '1px solid #dadce0',
                  cursor: isEditMode ? 'default' : 'pointer',
                  fontWeight: 500,
                  fontSize: '14px',
                }}
                onClick={() => !isEditMode && (window.location.href = props.googleAuthUrl || '/oauth2/authorization/google')}
                disabled={isEditMode}
              >
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Continue with Google</span>
              </button>
              {/* GitHub */}
              <button
                type="button"
                className="social-login-btn"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  backgroundColor: '#24292e',
                  color: '#ffffff',
                  border: '1px solid #24292e',
                  cursor: isEditMode ? 'default' : 'pointer',
                  fontWeight: 500,
                  fontSize: '14px',
                }}
                onClick={() => !isEditMode && (window.location.href = props.githubAuthUrl || '/oauth2/authorization/github')}
                disabled={isEditMode}
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                <span>Continue with GitHub</span>
              </button>
            </div>
          </>
        )}

        {props.showRegisterLink !== false && (
          <p className="auth-form-footer">
            {props.registerText || "Don't have an account?"}{' '}
            <a
              href={props.registerUrl || '/register'}
              className="auth-form-link"
              onClick={(e) => isEditMode && e.preventDefault()}
            >
              {props.registerLinkText || 'Sign up'}
            </a>
          </p>
        )}
      </form>
    </div>
  );
};

export default LoginFormRenderer;

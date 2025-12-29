import React, { useState } from 'react';
import type { RendererProps } from '../types';
import '../styles/AuthComponents.css';

/**
 * LoginForm Renderer
 * Renders a login form with email/password fields and optional features
 */
const LoginFormRenderer: React.FC<RendererProps> = ({ component, isEditMode }) => {
  const props = component.props || {};
  const styles = component.styles || {};

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditMode) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(props.loginEndpoint as string || '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, rememberMe }),
        credentials: 'include',
      });

      if (response.ok) {
        window.location.href = props.redirectUrl as string || '/';
      } else {
        const data = await response.json();
        setError(data.message || 'Invalid email or password');
      }
    } catch {
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

  const title = props.title as string | undefined;
  const subtitle = props.subtitle as string | undefined;

  return (
    <div className="auth-form login-form" style={containerStyle}>
      {title && <h2 className="auth-form-title">{title}</h2>}
      {subtitle && <p className="auth-form-subtitle">{subtitle}</p>}

      <form onSubmit={handleSubmit} className="auth-form-content">
        {error && <div className="auth-form-error">{error}</div>}

        <div className="auth-form-field">
          <label htmlFor="email">{props.emailLabel as string || 'Email'}</label>
          <input
            type="email"
            id="email"
            placeholder={props.emailPlaceholder as string || 'Enter your email'}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isEditMode || isLoading}
            required
          />
        </div>

        <div className="auth-form-field">
          <label htmlFor="password">{props.passwordLabel as string || 'Password'}</label>
          <input
            type="password"
            id="password"
            placeholder={props.passwordPlaceholder as string || 'Enter your password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isEditMode || isLoading}
            required
          />
        </div>

        <div className="auth-form-options">
          {props.showRememberMe !== false && (
            <label className="auth-checkbox">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isEditMode || isLoading}
              />
              <span>{props.rememberMeLabel as string || 'Remember me'}</span>
            </label>
          )}

          {props.showForgotPassword !== false && (
            <a
              href={props.forgotPasswordUrl as string || '/forgot-password'}
              className="auth-form-link"
              onClick={(e) => isEditMode && e.preventDefault()}
            >
              {props.forgotPasswordLabel as string || 'Forgot password?'}
            </a>
          )}
        </div>

        <button
          type="submit"
          className="auth-form-submit"
          disabled={isEditMode || isLoading}
        >
          {isLoading ? 'Signing in...' : (props.submitButtonText as string || 'Sign In')}
        </button>

        {props.showSignUpLink !== false && (
          <p className="auth-form-footer">
            {props.signUpText as string || "Don't have an account?"}{' '}
            <a
              href={props.signUpUrl as string || '/register'}
              className="auth-form-link"
              onClick={(e) => isEditMode && e.preventDefault()}
            >
              {props.signUpLinkText as string || 'Sign up'}
            </a>
          </p>
        )}
      </form>
    </div>
  );
};

export default LoginFormRenderer;

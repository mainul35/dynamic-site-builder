import React, { useState } from 'react';
import type { RendererProps } from '../types';
import '../styles/AuthComponents.css';

/**
 * ForgotPasswordForm Renderer
 * Renders a password reset request form
 */
const ForgotPasswordFormRenderer: React.FC<RendererProps> = ({ component, isEditMode }) => {
  const props = component.props || {};
  const styles = component.styles || {};

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditMode) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch((props.resetEndpoint as string) || '/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setIsSuccess(true);
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to send reset link. Please try again.');
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

  if (isSuccess) {
    return (
      <div className="auth-form forgot-password-form" style={containerStyle}>
        <div className="auth-success">
          {props.showSuccessIcon !== false && (
            <div className="auth-success-icon">✓</div>
          )}
          <h2 className="auth-form-title">Check Your Email</h2>
          <p className="auth-form-subtitle">
            {(props.successMessage as string) ||
              'If an account exists with this email, you will receive a password reset link.'}
          </p>
          {props.showBackToLogin !== false && (
            <p className="auth-form-footer">
              <a
                href={(props.backToLoginUrl as string) || '/login'}
                className="auth-form-link"
                onClick={(e) => isEditMode && e.preventDefault()}
              >
                ← {(props.backToLoginLinkText as string) || 'Back to Sign in'}
              </a>
            </p>
          )}
        </div>
      </div>
    );
  }

  const title = props.title as string | undefined;
  const subtitle = props.subtitle as string | undefined;

  return (
    <div className="auth-form forgot-password-form" style={containerStyle}>
      {title && <h2 className="auth-form-title">{title}</h2>}
      {subtitle && <p className="auth-form-subtitle">{subtitle}</p>}

      <form onSubmit={handleSubmit} className="auth-form-content">
        {error && <div className="auth-form-error">{error}</div>}

        <div className="auth-form-field">
          <label htmlFor="email">{(props.emailLabel as string) || 'Email Address'}</label>
          <input
            type="email"
            id="email"
            placeholder={(props.emailPlaceholder as string) || 'Enter your email'}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isEditMode || isLoading}
            required
          />
        </div>

        <button
          type="submit"
          className="auth-form-submit"
          disabled={isEditMode || isLoading}
        >
          {isLoading ? 'Sending...' : (props.submitButtonText as string) || 'Send Reset Link'}
        </button>

        {props.showBackToLogin !== false && (
          <p className="auth-form-footer">
            {(props.backToLoginText as string) || 'Back to'}{' '}
            <a
              href={(props.backToLoginUrl as string) || '/login'}
              className="auth-form-link"
              onClick={(e) => isEditMode && e.preventDefault()}
            >
              {(props.backToLoginLinkText as string) || 'Sign in'}
            </a>
          </p>
        )}
      </form>
    </div>
  );
};

export default ForgotPasswordFormRenderer;

import React, { useState } from 'react';
import type { RendererProps } from '../types';
import '../styles/AuthComponents.css';

/**
 * RegisterForm Renderer
 * Renders a user registration form with configurable fields and validation
 */
const RegisterFormRenderer: React.FC<RendererProps> = ({ component, isEditMode }) => {
  const props = component.props || {};
  const styles = component.styles || {};

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    const minLength = (props.passwordMinLength as number) || 8;

    if (password.length < minLength) {
      errors.push(`Password must be at least ${minLength} characters`);
    }
    if (props.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain an uppercase letter');
    }
    if (props.requireNumber && !/\d/.test(password)) {
      errors.push('Password must contain a number');
    }
    if (props.requireSpecialChar && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain a special character');
    }

    return errors;
  };

  const handlePasswordChange = (password: string) => {
    setFormData({ ...formData, password });
    setPasswordErrors(validatePassword(password));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditMode) return;

    // Validate
    const pwdErrors = validatePassword(formData.password);
    if (pwdErrors.length > 0) {
      setPasswordErrors(pwdErrors);
      return;
    }

    if (props.showConfirmPassword && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (props.showTermsCheckbox && !formData.agreeTerms) {
      setError('You must agree to the terms of service');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch((props.registerEndpoint as string) || '/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          username: formData.username,
          password: formData.password,
        }),
      });

      if (response.ok) {
        window.location.href = (props.redirectUrl as string) || '/login';
      } else {
        const data = await response.json();
        setError(data.message || 'Registration failed. Please try again.');
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
    <div className="auth-form register-form" style={containerStyle}>
      {title && <h2 className="auth-form-title">{title}</h2>}
      {subtitle && <p className="auth-form-subtitle">{subtitle}</p>}

      <form onSubmit={handleSubmit} className="auth-form-content">
        {error && <div className="auth-form-error">{error}</div>}

        {props.showFullName !== false && (
          <div className="auth-form-field">
            <label htmlFor="fullName">{(props.fullNameLabel as string) || 'Full Name'}</label>
            <input
              type="text"
              id="fullName"
              placeholder="Enter your full name"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              disabled={isEditMode || isLoading}
              required
            />
          </div>
        )}

        <div className="auth-form-field">
          <label htmlFor="email">{(props.emailLabel as string) || 'Email'}</label>
          <input
            type="email"
            id="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            disabled={isEditMode || isLoading}
            required
          />
        </div>

        {props.showUsername !== false && (
          <div className="auth-form-field">
            <label htmlFor="username">{(props.usernameLabel as string) || 'Username'}</label>
            <input
              type="text"
              id="username"
              placeholder="Choose a username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              disabled={isEditMode || isLoading}
              required
            />
          </div>
        )}

        <div className="auth-form-field">
          <label htmlFor="password">{(props.passwordLabel as string) || 'Password'}</label>
          <input
            type="password"
            id="password"
            placeholder="Create a password"
            value={formData.password}
            onChange={(e) => handlePasswordChange(e.target.value)}
            disabled={isEditMode || isLoading}
            required
          />
          {passwordErrors.length > 0 && (
            <ul className="auth-form-validation-errors">
              {passwordErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          )}
        </div>

        {props.showConfirmPassword !== false && (
          <div className="auth-form-field">
            <label htmlFor="confirmPassword">
              {(props.confirmPasswordLabel as string) || 'Confirm Password'}
            </label>
            <input
              type="password"
              id="confirmPassword"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              disabled={isEditMode || isLoading}
              required
            />
          </div>
        )}

        {props.showTermsCheckbox !== false && (
          <div className="auth-form-options">
            <label className="auth-checkbox">
              <input
                type="checkbox"
                checked={formData.agreeTerms}
                onChange={(e) => setFormData({ ...formData, agreeTerms: e.target.checked })}
                disabled={isEditMode || isLoading}
              />
              <span>
                {(props.termsText as string) || 'I agree to the'}{' '}
                <a
                  href={(props.termsUrl as string) || '/terms'}
                  className="auth-form-link"
                  onClick={(e) => isEditMode && e.preventDefault()}
                >
                  {(props.termsLinkText as string) || 'Terms of Service'}
                </a>
              </span>
            </label>
          </div>
        )}

        <button
          type="submit"
          className="auth-form-submit"
          disabled={isEditMode || isLoading}
        >
          {isLoading ? 'Creating account...' : (props.submitButtonText as string) || 'Create Account'}
        </button>

        {props.showLoginLink !== false && (
          <p className="auth-form-footer">
            {(props.loginText as string) || 'Already have an account?'}{' '}
            <a
              href={(props.loginUrl as string) || '/login'}
              className="auth-form-link"
              onClick={(e) => isEditMode && e.preventDefault()}
            >
              {(props.loginLinkText as string) || 'Sign in'}
            </a>
          </p>
        )}
      </form>
    </div>
  );
};

export default RegisterFormRenderer;

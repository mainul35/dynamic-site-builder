import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { authService } from '../services/authService';
import './LoginPage.css';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, error, isLoading, clearError } = useAuthStore();

  const [formData, setFormData] = useState({
    usernameOrEmail: '',
    password: '',
    rememberMe: false,
  });
  const [showRegister, setShowRegister] = useState(false);
  const [registerData, setRegisterData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
  });
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  // Clear errors when switching forms
  useEffect(() => {
    clearError();
    setValidationError('');
  }, [showRegister, clearError]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!formData.usernameOrEmail || !formData.password) {
      setValidationError('Please enter your username/email and password');
      return;
    }

    try {
      await authService.login(formData);
      // Navigation handled by useEffect above
    } catch (err) {
      // Error handled by authStore
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!registerData.username || !registerData.email || !registerData.password) {
      setValidationError('Please fill in all required fields');
      return;
    }

    if (registerData.password !== registerData.confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }

    if (registerData.password.length < 8) {
      setValidationError('Password must be at least 8 characters');
      return;
    }

    try {
      await authService.register({
        username: registerData.username,
        email: registerData.email,
        password: registerData.password,
        fullName: registerData.fullName,
      });
      setRegisterSuccess(true);
    } catch (err) {
      // Error handled by authStore
    }
  };

  if (registerSuccess) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="success-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#27ae60" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="login-title">Registration Successful!</h2>
          <p className="login-subtitle">
            Your account has been created and is pending approval.
            An administrator will review your registration.
          </p>
          <button
            onClick={() => {
              setShowRegister(false);
              setRegisterSuccess(false);
              setRegisterData({
                username: '',
                email: '',
                password: '',
                confirmPassword: '',
                fullName: '',
              });
            }}
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
        <h2 className="login-title">
          {showRegister ? 'Create Account' : 'Sign in to CMS'}
        </h2>
        <p className="login-subtitle">
          {showRegister ? (
            <>
              Already have an account?{' '}
              <button
                onClick={() => setShowRegister(false)}
                className="link-button"
              >
                Sign in
              </button>
            </>
          ) : (
            <>
              Don't have an account?{' '}
              <button
                onClick={() => setShowRegister(true)}
                className="link-button"
              >
                Register
              </button>
            </>
          )}
        </p>

        {/* Error message */}
        {(error || validationError) && (
          <div className="error-message">
            {error || validationError}
          </div>
        )}

        {showRegister ? (
          /* Registration Form */
          <form className="login-form" onSubmit={handleRegisterSubmit}>
            <div className="form-group">
              <label htmlFor="username">Username *</label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={registerData.username}
                onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                className="form-control"
                placeholder="Choose a username"
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={registerData.email}
                onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                className="form-control"
                placeholder="your@email.com"
              />
            </div>
            <div className="form-group">
              <label htmlFor="fullName">Full Name</label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                value={registerData.fullName}
                onChange={(e) => setRegisterData({ ...registerData, fullName: e.target.value })}
                className="form-control"
                placeholder="John Doe"
              />
            </div>
            <div className="form-group">
              <label htmlFor="reg-password">Password *</label>
              <input
                id="reg-password"
                name="password"
                type="password"
                required
                value={registerData.password}
                onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                className="form-control"
                placeholder="Min. 8 characters"
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password *</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={registerData.confirmPassword}
                onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                className="form-control"
                placeholder="Confirm your password"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary btn-block"
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        ) : (
          /* Login Form */
          <form className="login-form" onSubmit={handleLoginSubmit}>
            <div className="form-group">
              <label htmlFor="usernameOrEmail">Username or Email</label>
              <input
                id="usernameOrEmail"
                name="usernameOrEmail"
                type="text"
                required
                value={formData.usernameOrEmail}
                onChange={(e) => setFormData({ ...formData, usernameOrEmail: e.target.value })}
                className="form-control"
                placeholder="admin"
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="form-control"
                placeholder="Enter your password"
              />
            </div>
            <div className="remember-me">
              <label>
                <input
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                />
                <span>Remember me</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary btn-block"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>

            {/* OAuth2 login buttons - shown when providers are configured */}
            <div className="oauth-divider">
              <span>Or continue with</span>
            </div>

            <a href="/oauth2/authorization/google" className="btn btn-oauth">
              <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign in with Google
            </a>
          </form>
        )}

        <div className="login-footer">
          Default admin login: admin / admin123
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

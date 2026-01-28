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

            {/* OAuth2 login buttons - VSD Auth Server SSO */}
            <div className="oauth-divider">
              <span>Or continue with</span>
            </div>

            <a href="/oauth2/authorization/vsd-auth" className="btn btn-oauth btn-vsd-auth">
              <svg className="vsd-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Sign in with VSD Auth Server
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

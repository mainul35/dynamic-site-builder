import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

/**
 * Check if token is expired by decoding JWT
 */
function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.log('ProtectedRoute: Token invalid format - not 3 parts');
      return true;
    }
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    const exp = payload.exp as number;
    if (!exp) {
      console.log('ProtectedRoute: Token has no expiration - treating as valid');
      return false; // No expiration = not expired
    }
    const now = Math.floor(Date.now() / 1000);
    const isExpired = exp < now;
    console.log('ProtectedRoute: Token expiration check', { exp, now, isExpired, expiresIn: exp - now });
    return isExpired;
  } catch (e) {
    console.log('ProtectedRoute: Token decode error', e);
    return true;
  }
}

/**
 * Read auth state directly from localStorage
 */
function getAuthFromLocalStorage(): { isAuthenticated: boolean; accessToken: string | null; user: any } {
  try {
    const stored = localStorage.getItem('auth-storage');
    console.log('ProtectedRoute: localStorage raw value exists:', !!stored);
    if (!stored) {
      console.log('ProtectedRoute: No auth-storage in localStorage');
      return { isAuthenticated: false, accessToken: null, user: null };
    }
    const parsed = JSON.parse(stored);
    const state = parsed.state || parsed;
    console.log('ProtectedRoute: Parsed localStorage auth', {
      hasState: !!state,
      isAuthenticated: state.isAuthenticated,
      hasToken: !!state.accessToken,
      tokenLength: state.accessToken?.length,
      hasUser: !!state.user,
      userEmail: state.user?.email
    });
    return {
      isAuthenticated: state.isAuthenticated || false,
      accessToken: state.accessToken || null,
      user: state.user || null,
    };
  } catch (e) {
    console.log('ProtectedRoute: Error parsing localStorage', e);
    return { isAuthenticated: false, accessToken: null, user: null };
  }
}

/**
 * ProtectedRoute component that guards routes requiring authentication
 * Redirects to login page if user is not authenticated
 * Optionally checks for required roles
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles = [],
}) => {
  const location = useLocation();

  // Get auth state from Zustand store (reactive)
  const storeState = useAuthStore();
  const { isAuthenticated, user, accessToken } = storeState;

  // State to track if we've done our initial check
  const [isReady, setIsReady] = useState(false);
  const [authState, setAuthState] = useState<{
    isAuthenticated: boolean;
    accessToken: string | null;
    user: any;
  }>({ isAuthenticated: false, accessToken: null, user: null });

  useEffect(() => {
    // On mount, check localStorage directly to avoid hydration race conditions
    const localAuth = getAuthFromLocalStorage();

    console.log('ProtectedRoute: Initial check', {
      localStorage: {
        isAuthenticated: localAuth.isAuthenticated,
        hasToken: !!localAuth.accessToken,
        hasUser: !!localAuth.user,
      },
      store: {
        isAuthenticated,
        hasToken: !!accessToken,
        hasUser: !!user,
      }
    });

    // Use localStorage values if store hasn't hydrated yet
    if (localAuth.isAuthenticated && localAuth.accessToken && localAuth.user) {
      // Check if token is expired
      if (!isTokenExpired(localAuth.accessToken)) {
        console.log('ProtectedRoute: Using localStorage auth (valid token)');
        setAuthState(localAuth);
        setIsReady(true);
        return;
      } else {
        console.log('ProtectedRoute: localStorage token is expired');
      }
    }

    // Use store values
    setAuthState({
      isAuthenticated,
      accessToken,
      user,
    });
    setIsReady(true);
  }, []); // Only run once on mount

  // Also update when store changes (after initial mount)
  useEffect(() => {
    if (isReady && isAuthenticated && accessToken && user) {
      console.log('ProtectedRoute: Store updated with auth', { email: user.email });
      setAuthState({ isAuthenticated, accessToken, user });
    }
  }, [isReady, isAuthenticated, accessToken, user]);

  // Show loading while checking
  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!authState.isAuthenticated || !authState.accessToken) {
    console.log('ProtectedRoute: Not authenticated, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check for required roles
  if (requiredRoles.length > 0) {
    const userRoles = authState.user?.roles || [];
    const hasRequiredRole = requiredRoles.some((role) => userRoles.includes(role));

    if (!hasRequiredRole) {
      console.log('ProtectedRoute: Missing required roles', { required: requiredRoles, has: userRoles });
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
          <div className="text-center p-8 bg-white rounded-lg shadow-md">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-4">
              You don't have permission to access this page.
            </p>
            <p className="text-sm text-gray-500">
              Required roles: {requiredRoles.join(', ')}
            </p>
            <button
              onClick={() => window.history.back()}
              className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Go Back
            </button>
          </div>
        </div>
      );
    }
  }

  console.log('ProtectedRoute: Rendering protected content');
  return <>{children}</>;
};

export default ProtectedRoute;

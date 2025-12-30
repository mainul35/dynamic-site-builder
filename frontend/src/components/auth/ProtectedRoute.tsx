import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { authService } from '../../services/authService';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
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
  const { isAuthenticated, user, refreshToken } = useAuthStore();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      // If we have a refresh token but no access token, try to refresh
      if (refreshToken && !isAuthenticated) {
        try {
          await authService.initializeAuth();
        } catch (error) {
          console.error('Failed to initialize auth:', error);
        }
      }
      setIsInitializing(false);
    };

    initAuth();
  }, [refreshToken, isAuthenticated]);

  // Show loading while initializing
  if (isInitializing) {
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
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check for required roles
  if (requiredRoles.length > 0) {
    const userRoles = user?.roles || [];
    const hasRequiredRole = requiredRoles.some((role) => userRoles.includes(role));

    if (!hasRequiredRole) {
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

  return <>{children}</>;
};

export default ProtectedRoute;

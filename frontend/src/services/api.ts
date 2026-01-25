import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../stores/authStore';

/**
 * Base API URL
 * In development: Vite proxy forwards /api to http://localhost:8080/api
 * In production: Served by Spring Boot, same origin
 */
const API_BASE_URL = '/api';

/**
 * Axios instance with default configuration
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Flag to prevent infinite refresh loops
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

/**
 * Check if a token is an SSO token (can't be refreshed via /auth/refresh)
 * SSO tokens have 'type' = 'access' and no 'family' claim
 */
function checkIsSsoToken(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));

    // SSO tokens have 'type' = 'access' and no 'family' claim
    // Regular refresh tokens have 'type' = 'refresh' and 'family' claim
    const tokenType = payload.type as string;
    const hasFamily = 'family' in payload;

    return tokenType === 'access' && !hasFamily;
  } catch {
    return false;
  }
}

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

/**
 * Request interceptor - adds JWT token to requests
 */
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const store = useAuthStore.getState();
    const token = store.accessToken;

    console.log('API Request:', config.url, {
      hasToken: !!token,
      isAuthenticated: store.isAuthenticated
    });

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor - handles token refresh on 401
 */
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Skip refresh for auth endpoints
    const isAuthEndpoint = originalRequest?.url?.includes('/auth/');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      console.log('API 401 error:', originalRequest.url, {
        isRefreshing,
        hasRetried: originalRequest._retry
      });

      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              resolve(api(originalRequest));
            },
            reject: (err: any) => {
              reject(err);
            },
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const store = useAuthStore.getState();
      const refreshToken = store.refreshToken;

      console.log('API 401 handling:', {
        hasRefreshToken: !!refreshToken,
        isAuthenticated: store.isAuthenticated
      });

      if (!refreshToken) {
        console.log('API: No refresh token, logging out');
        // Don't logout or redirect if we're on OAuth2 callback page (it will handle auth)
        if (!window.location.pathname.includes('/oauth2/callback')) {
          store.logout();
        }
        isRefreshing = false;
        return Promise.reject(error);
      }

      // Check if this is an SSO token (can't be refreshed via /auth/refresh)
      const isSsoToken = checkIsSsoToken(refreshToken);
      console.log('API: isSsoToken:', isSsoToken);

      if (isSsoToken) {
        // SSO tokens can't be refreshed - just logout
        console.log('API: SSO token got 401, logging out');
        processQueue(error, null);
        store.logout();
        isRefreshing = false;
        // Redirect to login page (but not if we're already on OAuth2 callback - it will handle auth)
        if (!window.location.pathname.includes('/oauth2/callback')) {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      try {
        // Refresh the token (only for non-SSO tokens)
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken, expiresIn, user } = response.data;

        store.setTokens(accessToken, newRefreshToken, expiresIn);
        store.setUser(user);

        processQueue(null, accessToken);

        // Retry the original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }

        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        store.logout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;

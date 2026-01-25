import api from './api';
import { useAuthStore, UserProfile } from '../stores/authStore';

export interface LoginRequest {
  usernameOrEmail: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  fullName?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: UserProfile;
}

export interface RegisterResponse {
  message: string;
  user: UserProfile;
}

class AuthService {
  private refreshPromise: Promise<AuthResponse> | null = null;

  /**
   * Login with username/email and password
   */
  async login(request: LoginRequest): Promise<AuthResponse> {
    const store = useAuthStore.getState();
    store.setLoading(true);
    store.clearError();

    try {
      const response = await api.post<AuthResponse>('/auth/login', request);
      const data = response.data;

      store.setTokens(data.accessToken, data.refreshToken, data.expiresIn);
      store.setUser(data.user);
      store.setLoading(false);

      return data;
    } catch (error: any) {
      const message = error.response?.data?.error || 'Login failed';
      store.setError(message);
      throw new Error(message);
    }
  }

  /**
   * Register a new user (requires admin approval)
   */
  async register(request: RegisterRequest): Promise<RegisterResponse> {
    const store = useAuthStore.getState();
    store.setLoading(true);
    store.clearError();

    try {
      const response = await api.post<RegisterResponse>('/auth/register', request);
      store.setLoading(false);
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error || 'Registration failed';
      store.setError(message);
      throw new Error(message);
    }
  }

  /**
   * Refresh the access token using the refresh token
   */
  async refreshToken(): Promise<AuthResponse> {
    // Prevent multiple simultaneous refresh requests
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    const store = useAuthStore.getState();
    const refreshToken = store.refreshToken;

    if (!refreshToken) {
      store.logout();
      throw new Error('No refresh token available');
    }

    this.refreshPromise = api
      .post<AuthResponse>('/auth/refresh', { refreshToken })
      .then((response) => {
        const data = response.data;
        store.setTokens(data.accessToken, data.refreshToken, data.expiresIn);
        store.setUser(data.user);
        return data;
      })
      .catch((error) => {
        // Refresh failed - logout user
        store.logout();
        throw error;
      })
      .finally(() => {
        this.refreshPromise = null;
      });

    return this.refreshPromise;
  }

  /**
   * Logout the current user
   */
  async logout(): Promise<void> {
    const store = useAuthStore.getState();
    const refreshToken = store.refreshToken;

    try {
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch (error) {
      // Ignore logout errors
      console.warn('Logout request failed:', error);
    } finally {
      store.logout();
    }
  }

  /**
   * Logout from all sessions
   */
  async logoutAll(): Promise<void> {
    const store = useAuthStore.getState();

    try {
      await api.post('/auth/logout-all');
    } catch (error) {
      console.warn('Logout all request failed:', error);
    } finally {
      store.logout();
    }
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<UserProfile> {
    const response = await api.get<UserProfile>('/auth/me');
    const store = useAuthStore.getState();
    store.setUser(response.data);
    return response.data;
  }

  /**
   * Check if user is authenticated
   */
  async checkAuth(): Promise<boolean> {
    try {
      const response = await api.get<{ authenticated: boolean }>('/auth/check');
      return response.data.authenticated;
    } catch {
      return false;
    }
  }

  /**
   * Initialize auth state from stored refresh token.
   * For SSO tokens where access token == refresh token, we skip refresh
   * and just validate the existing token.
   */
  async initializeAuth(): Promise<boolean> {
    const store = useAuthStore.getState();
    const refreshToken = store.refreshToken;
    let accessToken = store.accessToken;

    console.log('authService.initializeAuth: Starting', {
      hasRefreshToken: !!refreshToken,
      hasAccessToken: !!accessToken,
      isAuthenticated: store.isAuthenticated,
      hasUser: !!store.user
    });

    // If already authenticated with a valid access token, skip initialization
    // This prevents race conditions when navigating from OAuth2CallbackPage
    if (store.isAuthenticated && accessToken && store.user) {
      console.log('authService.initializeAuth: Already authenticated, checking token expiry');
      const payload = this.decodeJwtPayload(accessToken);
      if (payload) {
        const exp = payload.exp as number;
        const now = Math.floor(Date.now() / 1000);
        if (exp && exp > now) {
          console.log('authService.initializeAuth: Token still valid, skipping init');
          return true;
        }
      }
    }

    if (!refreshToken) {
      console.log('authService.initializeAuth: No refresh token, returning false');
      return false;
    }

    // Check if this is an SSO token by decoding it
    // SSO tokens have the same value for access and refresh (we use the same token for both)
    const isSsoToken = this.isSsoToken(refreshToken);
    console.log('authService.initializeAuth: isSsoToken:', isSsoToken);

    if (isSsoToken) {
      // For SSO tokens, restore accessToken from refreshToken if not set
      if (!accessToken) {
        console.log('authService.initializeAuth: SSO token, restoring accessToken from refreshToken');
        // Restore the access token from refresh token for SSO
        const payload = this.decodeJwtPayload(refreshToken);
        if (payload) {
          const exp = payload.exp as number;
          const now = Math.floor(Date.now() / 1000);
          const expiresIn = exp ? exp - now : 3600;
          console.log('authService.initializeAuth: Token expiresIn:', expiresIn);

          if (expiresIn > 0) {
            // Token still valid, restore it
            store.setTokens(refreshToken, refreshToken, expiresIn);
            accessToken = refreshToken;
            console.log('authService.initializeAuth: Tokens restored');
          } else {
            // Token expired, logout
            console.log('authService.initializeAuth: Token expired, logging out');
            store.logout();
            return false;
          }
        }
      } else {
        // Access token exists, just verify it's not expired locally (skip API call)
        const payload = this.decodeJwtPayload(accessToken);
        if (payload) {
          const exp = payload.exp as number;
          const now = Math.floor(Date.now() / 1000);
          if (exp && exp > now) {
            console.log('authService.initializeAuth: SSO token still valid (local check)');
            return true;
          } else {
            console.log('authService.initializeAuth: SSO token expired');
            store.logout();
            return false;
          }
        }
      }

      // Only call checkAuth if we just restored the token (accessToken was null)
      try {
        console.log('authService.initializeAuth: Calling checkAuth...');
        const isValid = await this.checkAuth();
        console.log('authService.initializeAuth: checkAuth result:', isValid);
        if (!isValid) {
          console.log('authService.initializeAuth: checkAuth returned false, logging out');
          store.logout();
        }
        return isValid;
      } catch (error) {
        console.log('authService.initializeAuth: checkAuth threw error, logging out', error);
        store.logout();
        return false;
      }
    }

    // Normal refresh flow for regular login tokens
    console.log('authService.initializeAuth: Regular token, calling refreshToken...');
    try {
      await this.refreshToken();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if a token is an SSO token (issued by CMS for OAuth2 users)
   * SSO tokens have userId in the subject and don't have a token family
   */
  private isSsoToken(token: string): boolean {
    const payload = this.decodeJwtPayload(token);
    if (!payload) return false;

    // SSO tokens have 'type' = 'access' and no 'family' claim (refresh tokens have family)
    // Regular refresh tokens have 'type' = 'refresh' and 'family' claim
    const tokenType = payload.type as string;
    const hasFamily = 'family' in payload;

    // If it's an access token type without family, it's likely an SSO token being used as refresh
    return tokenType === 'access' && !hasFamily;
  }

  /**
   * Decode JWT payload without verifying signature
   */
  private decodeJwtPayload(token: string): Record<string, unknown> | null {
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
   * Get the current access token
   */
  getAccessToken(): string | null {
    return useAuthStore.getState().accessToken;
  }

  /**
   * Check if user has a specific role
   */
  hasRole(role: string): boolean {
    return useAuthStore.getState().hasRole(role);
  }

  /**
   * Check if user is admin
   */
  isAdmin(): boolean {
    return useAuthStore.getState().isAdmin();
  }
}

export const authService = new AuthService();
export default authService;

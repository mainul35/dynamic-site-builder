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
   * Initialize auth state from stored refresh token
   */
  async initializeAuth(): Promise<boolean> {
    const store = useAuthStore.getState();
    const refreshToken = store.refreshToken;

    if (!refreshToken) {
      return false;
    }

    try {
      await this.refreshToken();
      return true;
    } catch {
      return false;
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

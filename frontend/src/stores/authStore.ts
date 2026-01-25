import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  roles: string[];
  emailVerified: boolean;
}

export interface AuthState {
  // State
  accessToken: string | null;
  refreshToken: string | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  _hasHydrated: boolean;

  // Actions
  setTokens: (accessToken: string, refreshToken: string, expiresIn: number) => void;
  setUser: (user: UserProfile) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => void;
  clearError: () => void;
  setHasHydrated: (hasHydrated: boolean) => void;

  // Helpers
  hasRole: (role: string) => boolean;
  isAdmin: () => boolean;
  isDesigner: () => boolean;
}

// Token expiration tracking
let tokenExpirationTimeout: NodeJS.Timeout | null = null;

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      _hasHydrated: false,

      // Actions
      setTokens: (accessToken: string, refreshToken: string, expiresIn: number) => {
        console.log('authStore.setTokens called:', { hasToken: !!accessToken });
        set({
          accessToken,
          refreshToken,
          isAuthenticated: true,
          error: null,
          _hasHydrated: true, // Mark as hydrated when tokens are set
        });

        // Set up token refresh before expiration (refresh 1 minute before expiry)
        if (tokenExpirationTimeout) {
          clearTimeout(tokenExpirationTimeout);
        }
        const refreshTime = (expiresIn - 60) * 1000; // Convert to ms, subtract 1 minute
        if (refreshTime > 0) {
          tokenExpirationTimeout = setTimeout(() => {
            // Token refresh will be handled by the auth service
            console.log('Access token expiring soon, refresh needed');
          }, refreshTime);
        }
      },

      setUser: (user: UserProfile) => {
        console.log('authStore.setUser called:', { email: user?.email });
        set({ user });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      setError: (error: string | null) => {
        set({ error, isLoading: false });
      },

      logout: () => {
        console.log('authStore.logout called');
        if (tokenExpirationTimeout) {
          clearTimeout(tokenExpirationTimeout);
          tokenExpirationTimeout = null;
        }
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          isAuthenticated: false,
          error: null,
        });
      },

      clearError: () => {
        set({ error: null });
      },

      setHasHydrated: (hasHydrated: boolean) => {
        set({ _hasHydrated: hasHydrated });
      },

      // Helpers
      hasRole: (role: string) => {
        const { user } = get();
        return user?.roles?.includes(role) ?? false;
      },

      isAdmin: () => {
        return get().hasRole('ADMIN');
      },

      isDesigner: () => {
        const state = get();
        return state.hasRole('DESIGNER') || state.hasRole('ADMIN');
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      // Persist tokens and user info
      // Note: For SSO users, accessToken === refreshToken, so we persist both
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        console.log('authStore: Rehydration complete', {
          isAuthenticated: state?.isAuthenticated,
          hasAccessToken: !!state?.accessToken,
          hasUser: !!state?.user
        });
        state?.setHasHydrated(true);
      },
    }
  )
);

// Selector hooks for common use cases
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useCurrentUser = () => useAuthStore((state) => state.user);
export const useAuthError = () => useAuthStore((state) => state.error);
export const useIsLoading = () => useAuthStore((state) => state.isLoading);

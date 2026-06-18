import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import Cookies from 'js-cookie';
import type { User, AuthMeta, LoginRequest, RegisterRequest } from '@/src/types';
import { authApi, ApiError } from '@/src/lib/api';
import { isProfileComplete } from '@/src/lib/profile-completeness';

// ============================================
// Types
// ============================================

interface AuthState {
  // State
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Getters
  getUserRole: () => 'Admin' | 'Doctor' | 'Student' | 'Unknown' | 'Instructor' | 'Support' | null;
  isAdmin: () => boolean;
  isDoctor: () => boolean;
  isProfileComplete: () => boolean;
  isInitialized: boolean;

  // Actions
  login: (credentials: LoginRequest) => Promise<void>;
  loginWithCookies: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  fetchCurrentUser: () => Promise<void>;
  updateUser: (user: User) => void;
  clearError: () => void;
  activateSession: () => void;
}

// ============================================
// Storage Helpers
// ============================================

const AUTH_COOKIE_NAME = 'token';
const USER_COOKIE_NAME = 'user_data';
const USER_ROLE_COOKIE_NAME = 'user_role';

// sessionStorage keys for the pending (pre-verification) auth state
const PENDING_TOKEN_KEY = 'pending_auth_token';
const PENDING_USER_KEY  = 'pending_auth_user';
const PENDING_META_KEY  = 'pending_auth_meta';

function setPendingAuth(token: string, user: User, meta: AuthMeta) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(PENDING_TOKEN_KEY, token);
  sessionStorage.setItem(PENDING_USER_KEY,  JSON.stringify(user));
  sessionStorage.setItem(PENDING_META_KEY,  JSON.stringify(meta));
}

function clearPendingAuth() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(PENDING_TOKEN_KEY);
  sessionStorage.removeItem(PENDING_USER_KEY);
  sessionStorage.removeItem(PENDING_META_KEY);
}

function getPendingToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(PENDING_TOKEN_KEY);
}

function getPendingUser(): User | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(PENDING_USER_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as User; } catch { return null; }
}

function getPendingMeta(): AuthMeta | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(PENDING_META_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as AuthMeta; } catch { return null; }
}

function cookieExpiryFromAuthMeta(meta: AuthMeta): number | Date {
  const exp = meta.expires_at;
  if (exp == null) return 30;
  if (typeof exp === 'number' && Number.isFinite(exp) && exp > 0 && exp < 1e10) {
    return new Date(Date.now() + exp * 1000);
  }
  if (typeof exp === 'string') {
    const d = new Date(exp);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return 30;
}

function setAuthCookies(user: User, meta: AuthMeta) {
  Cookies.set(AUTH_COOKIE_NAME, meta.token, {
    expires: cookieExpiryFromAuthMeta(meta),
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });

  Cookies.set(USER_COOKIE_NAME, JSON.stringify(user), {
    expires: 30,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });

  Cookies.set(USER_ROLE_COOKIE_NAME, user.attributes.role, {
    expires: 30,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
}

function clearAuthCookies() {
  Cookies.remove(AUTH_COOKIE_NAME);
  Cookies.remove(USER_COOKIE_NAME);
  Cookies.remove(USER_ROLE_COOKIE_NAME);
}

function getTokenFromCookies(): string | null {
  return Cookies.get(AUTH_COOKIE_NAME) || null;
}

function getUserFromCookies(): User | null {
  const userData = Cookies.get(USER_COOKIE_NAME);
  if (userData) {
    try {
      return JSON.parse(userData) as User;
    } catch {
      return null;
    }
  }
  return null;
}

// ============================================
// Store
// ============================================

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: false,
      error: null,

      // Getters
      getUserRole: () => {
        const { user } = get();
        return user?.attributes.role || null;
      },

      isAdmin: () => {
        const role = get().getUserRole();
        return role === 'Admin';
      },

      isDoctor: () => {
        const role = get().getUserRole();
        return role === 'Doctor';
      },

      isProfileComplete: () => {
        const { user } = get();
        return isProfileComplete(user);
      },

      // Actions
      login: async (credentials) => {
        set({ isLoading: true, error: null });

        try {
          const response = await authApi.login(credentials);
          const { data: user, meta } = response;

          // Store token + user in sessionStorage temporarily.
          // Cookies are NOT written yet - they will be set after OTP verification.
          setPendingAuth(meta.token, user, meta);

          set({
            user,
            token: meta.token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const message = error instanceof ApiError
            ? error.message
            : 'Failed to login. Please try again.';

          set({
            isLoading: false,
            error: message,
            isAuthenticated: false,
          });
          throw error;
        }
      },

      // Login and save to cookies immediately (for non-OTP flows, e.g. admin)
      loginWithCookies: async (credentials: LoginRequest) => {
        set({ isLoading: true, error: null });

        try {
          const response = await authApi.login(credentials);
          const { data: user, meta } = response;

          setAuthCookies(user, meta);
          clearPendingAuth(); // make sure no leftover pending state

          set({
            user,
            token: meta.token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const message = error instanceof ApiError
            ? error.message
            : 'Failed to login. Please try again.';

          set({
            isLoading: false,
            error: message,
            isAuthenticated: false,
          });
          throw error;
        }
      },

      register: async (data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await authApi.register(data);
          const { data: user, meta } = response;

          // Same as login: store in sessionStorage temporarily, write cookies after OTP.
          setPendingAuth(meta.token, user, meta);

          set({
            user,
            token: meta.token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const message = error instanceof ApiError
            ? error.message
            : 'Failed to register. Please try again.';

          set({
            isLoading: false,
            error: message,
            isAuthenticated: false,
          });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });

        try {
          await authApi.logout();
        } catch {
          // Silently ignore logout API errors
        } finally {
          clearAuthCookies();
          clearPendingAuth();

          if (typeof window !== 'undefined') {
            const { disconnectEcho } = await import('@/src/lib/echo');
            disconnectEcho();
          }

          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });

          // Redirect to login page
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
      },

      fetchCurrentUser: async () => {
        const token = getTokenFromCookies();

        if (!token) {
          set({ isAuthenticated: false, user: null });
          return;
        }

        set({ isLoading: true });

        try {
          const response = await authApi.me();
          const user = response.data;

          // Update cookies with fresh user data
          Cookies.set(USER_COOKIE_NAME, JSON.stringify(user), {
            expires: 30,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
          });

          Cookies.set(USER_ROLE_COOKIE_NAME, user.attributes.role, {
            expires: 30,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
          });

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch {
          clearAuthCookies();

          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },

      // Activate session: promote pending sessionStorage data to permanent cookies.
      // Called after successful OTP verification.
      activateSession: () => {
        // Prefer sessionStorage (most up-to-date) then fall back to Zustand state
        const pendingToken = getPendingToken();
        const pendingUser  = getPendingUser();
        const pendingMeta  = getPendingMeta();

        const token = pendingToken ?? get().token;
        const user  = pendingUser  ?? get().user;

        if (!user || !token) return;

        const meta: AuthMeta = pendingMeta ?? { token, token_type: 'Bearer', expires_at: 365 };

        setAuthCookies(user, meta);
        clearPendingAuth(); // no longer needed

        // Make sure Zustand state is in sync
        set({ user, token, isAuthenticated: true });
      },

      updateUser: (user) => {
        Cookies.set(USER_COOKIE_NAME, JSON.stringify(user), {
          expires: 30,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
        });
        Cookies.set(USER_ROLE_COOKIE_NAME, user.attributes.role, {
          expires: 30,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
        });
        set({
          user,
          isAuthenticated: true,
        });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => {
        // Use a custom storage that syncs with cookies
        return {
          getItem: (name: string) => {
            // Try localStorage first
            if (typeof window !== 'undefined') {
              const item = localStorage.getItem(name);
              if (item) return item;
            }
            return null;
          },
          setItem: (name: string, value: string) => {
            if (typeof window !== 'undefined') {
              localStorage.setItem(name, value);
            }
          },
          removeItem: (name: string) => {
            if (typeof window !== 'undefined') {
              localStorage.removeItem(name);
            }
          },
        };
      }),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// ============================================
// Initialize store from cookies (for SSR compatibility)
// ============================================

export function initializeAuthStore() {
  // Check permanent cookies first, then fall back to pending sessionStorage
  const cookieToken = getTokenFromCookies();
  const cookieUser  = getUserFromCookies();

  const pendingToken = getPendingToken();
  const pendingUser  = getPendingUser();

  const token = cookieToken ?? pendingToken;
  const user  = cookieUser  ?? pendingUser;

  if (token) {
    useAuthStore.setState({
      token,
      user,
      isAuthenticated: true,
      isInitialized: true,
    });

    // If token is from cookie and user data is missing, refetch
    if (cookieToken && !cookieUser) {
      useAuthStore.getState().fetchCurrentUser().catch(() => {
        // Non-fatal: isInitialized is already true
      });
    }
  } else {
    // No token anywhere — definitely not authenticated
    useAuthStore.setState({
      isInitialized: true,
    });
  }
}

// ============================================
// Export individual hooks for convenience
// ============================================

// Stable selector hooks with shallow equality to prevent infinite loops
export function useAuth() {
  return useAuthStore(
    useShallow((state) => ({
      user: state.user,
      token: state.token,
      isAuthenticated: state.isAuthenticated,
      isLoading: state.isLoading,
      error: state.error,
      isAdmin: state.isAdmin(),
      isDoctor: state.isDoctor(),
      isProfileComplete: state.isProfileComplete(),
      userRole: state.getUserRole(),
      isInitialized: state.isInitialized,
    }))
  );
}

export function useAuthActions() {
  return useAuthStore(
    useShallow((state) => ({
      loginWithCookies: state.loginWithCookies,
      login: state.login,
      register: state.register,
      logout: state.logout,
      fetchCurrentUser: state.fetchCurrentUser,
      updateUser: state.updateUser,
      clearError: state.clearError,
      activateSession: state.activateSession,
    }))
  );
}

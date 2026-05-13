import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import Cookies from 'js-cookie';
import type { User, AuthMeta, LoginRequest, RegisterRequest } from '@/src/types';
import { authApi, ApiError } from '@/src/lib/api';

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
  getUserRole: () => 'Admin' | 'Doctor' | 'Student' | 'Unknown' | null;
  isAdmin: () => boolean;
  isDoctor: () => boolean;

  // Actions
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  fetchCurrentUser: () => Promise<void>;
  clearError: () => void;
}

// ============================================
// Storage Helpers
// ============================================

const AUTH_COOKIE_NAME = 'token';
const USER_COOKIE_NAME = 'user_data';
const USER_ROLE_COOKIE_NAME = 'user_role';

function setAuthCookies(user: User, meta: AuthMeta) {
  Cookies.set(AUTH_COOKIE_NAME, meta.token, {
    expires: meta.expires_at ? new Date(meta.expires_at) : 30,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
  
  Cookies.set(USER_COOKIE_NAME, JSON.stringify(user), {
    expires: 30,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
  
  Cookies.set(USER_ROLE_COOKIE_NAME, user.attributes.role, {
    expires: 30,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
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

      // Actions
      login: async (credentials) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await authApi.login(credentials);
          const { data: user, meta } = response;
          
          setAuthCookies(user, meta);
          
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
          
          setAuthCookies(user, meta);
          
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
        } catch (error) {
          // Silently ignore logout API errors
        } finally {
          clearAuthCookies();
          
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
            sameSite: 'strict',
          });
          
          Cookies.set(USER_ROLE_COOKIE_NAME, user.attributes.role, {
            expires: 30,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
          });
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
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
  const token = getTokenFromCookies();
  const user = getUserFromCookies();
  
  if (token && user) {
    useAuthStore.setState({
      user,
      token,
      isAuthenticated: true,
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
      userRole: state.getUserRole(),
    }))
  );
}

export function useAuthActions() {
  return useAuthStore(
    useShallow((state) => ({
      login: state.login,
      register: state.register,
      logout: state.logout,
      fetchCurrentUser: state.fetchCurrentUser,
      clearError: state.clearError,
    }))
  );
}

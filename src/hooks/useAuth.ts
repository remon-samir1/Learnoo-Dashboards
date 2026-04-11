import { useCallback } from 'react';
import { useAuth, useAuthActions } from '@/src/stores/authStore';
import type { LoginRequest, RegisterRequest } from '@/src/types';

// ============================================
// Auth Hook - Main authentication hook
// ============================================

export function useAuthHook() {
  const {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    isAdmin,
    isDoctor,
    userRole,
  } = useAuth();

  const {
    login,
    register,
    logout,
    fetchCurrentUser,
    clearError,
  } = useAuthActions();

  const loginWithCredentials = useCallback(async (credentials: LoginRequest) => {
    return login(credentials);
  }, [login]);

  const registerUser = useCallback(async (data: RegisterRequest) => {
    return register(data);
  }, [register]);

  const logoutUser = useCallback(async () => {
    return logout();
  }, [logout]);

  const refreshUser = useCallback(async () => {
    return fetchCurrentUser();
  }, [fetchCurrentUser]);

  return {
    // State
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    isAdmin,
    isDoctor,
    userRole,
    
    // Actions
    login: loginWithCredentials,
    register: registerUser,
    logout: logoutUser,
    refreshUser,
    clearError,
  };
}

// ============================================
// useCurrentUser - Simple hook to get current user
// ============================================

export function useCurrentUser() {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  return {
    user,
    isAuthenticated,
    isLoading,
    fullName: user ? `${user.attributes.first_name} ${user.attributes.last_name}` : null,
    email: user?.attributes.email || null,
    role: user?.attributes.role || null,
  };
}

// ============================================
// useIsAdmin - Check if current user is admin
// ============================================

export function useIsAdmin() {
  const { isAdmin, isLoading } = useAuth();
  return { isAdmin, isLoading };
}

// ============================================
// useIsDoctor - Check if current user is doctor
// ============================================

export function useIsDoctor() {
  const { isDoctor, isLoading } = useAuth();
  return { isDoctor, isLoading };
}

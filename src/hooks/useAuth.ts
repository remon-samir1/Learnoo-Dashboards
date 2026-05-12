import { useCallback, useMemo } from 'react';
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
<<<<<<< HEAD
    isInstructor,
=======
    isDoctor,
>>>>>>> origin/master
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
<<<<<<< HEAD
    isInstructor,
=======
    isDoctor,
>>>>>>> origin/master
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
<<<<<<< HEAD
  const { user, isAuthenticated, isLoading, canUseActivations } = useAuth();
=======
  const { user, isAuthenticated, isLoading } = useAuth();
>>>>>>> origin/master

  // Use useMemo to maintain stable reference and prevent unnecessary re-renders
  return useMemo(() => ({
    user,
    isAuthenticated,
    isLoading,
    fullName: user ? `${user.attributes.first_name} ${user.attributes.last_name}` : null,
    email: user?.attributes.email || null,
    role: user?.attributes.role || null,
<<<<<<< HEAD
    canUseActivations,
  }), [user, isAuthenticated, isLoading, canUseActivations]);
=======
  }), [user, isAuthenticated, isLoading]);
>>>>>>> origin/master
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
<<<<<<< HEAD

// ============================================
// useIsInstructor - Check if current user is instructor
// ============================================

export function useIsInstructor() {
  const { isInstructor, isLoading } = useAuth();
  return { isInstructor, isLoading };
}
=======
>>>>>>> origin/master

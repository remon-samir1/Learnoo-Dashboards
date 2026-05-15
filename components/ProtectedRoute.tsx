'use client';

import { useEffect, useLayoutEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { initializeAuthStore, useAuth } from '@/src/stores/authStore';
import { isProfileComplete } from '@/src/lib/profile-completeness';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireProfileComplete?: boolean;
}

export default function ProtectedRoute({ 
  children, 
  requireProfileComplete = true 
}: ProtectedRouteProps) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [authReady, setAuthReady] = useState(false);

  useLayoutEffect(() => {
    initializeAuthStore();
    setAuthReady(true);
  }, []);

  useEffect(() => {
    if (!authReady || isLoading) return;

    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    // If profile completeness is required and profile is incomplete, redirect to selection
    if (requireProfileComplete && !isProfileComplete(user)) {
      router.replace('/select-university');
      return;
    }
  }, [authReady, isAuthenticated, user, isLoading, router, requireProfileComplete]);

  // Show loading state while hydrating auth from cookies
  if (!authReady || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // If not authenticated or profile incomplete, don't render children (redirect will happen)
  if (!isAuthenticated || (requireProfileComplete && !isProfileComplete(user))) {
    return null;
  }

  return <>{children}</>;
}

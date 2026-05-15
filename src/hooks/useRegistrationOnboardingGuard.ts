'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isRegistrationOnboarding } from '@/src/lib/onboarding-selection';

/** Restrict onboarding pages to the register flow only. */
export function useRegistrationOnboardingGuard() {
  const router = useRouter();

  useEffect(() => {
    if (!isRegistrationOnboarding()) {
      router.replace('/login');
    }
  }, [router]);
}

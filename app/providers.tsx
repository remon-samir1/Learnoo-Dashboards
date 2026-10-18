'use client';

import { PersistentLiveSession } from '@/components/live-sessions/PersistentLiveSession';
import PlatformBranding from '@/src/components/PlatformBranding';
import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NextIntlClientProvider } from 'next-intl';
import { initializeAuthStore } from '@/src/stores/authStore';

interface ProvidersProps {
  children: React.ReactNode;
  /** next-intl message tree from `messages/{locale}.json` */
  messages: Record<string, unknown>;
  locale: string;
}

export default function Providers({ children, messages, locale }: ProvidersProps) {
  useEffect(() => initializeAuthStore(), []);
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <NextIntlClientProvider messages={messages} locale={locale} timeZone="UTC">
      <QueryClientProvider client={queryClient}>
        <PlatformBranding />
        <PersistentLiveSession>{children}</PersistentLiveSession>
      </QueryClientProvider>
    </NextIntlClientProvider>
  );
}

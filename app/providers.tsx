'use client';

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
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        refetchOnWindowFocus: false,
      },
    },
  }));

  useEffect(() => {
    // Initialize auth store from cookies on mount
    initializeAuthStore();
  }, []);

  return (
    <NextIntlClientProvider messages={messages} locale={locale} timeZone="UTC">
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </NextIntlClientProvider>
  );
}

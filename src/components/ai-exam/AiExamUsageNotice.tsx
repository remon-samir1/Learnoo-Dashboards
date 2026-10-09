'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

type Usage = { limit: number; used: number; remaining: number };

export function AiExamUsageNotice({ onLimitReached }: { onLimitReached: (reached: boolean) => void }) {
  const t = useTranslations('exams');
  const [usage, setUsage] = useState<Usage | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let active = true;

    const refresh = async () => {
      try {
        const response = await fetch('/api/ai-exam-usage', { cache: 'no-store' });
        if (!response.ok) throw new Error();
        const data = await response.json() as Usage;
        if (active) {
          setUsage(data);
          setUnavailable(false);
          onLimitReached(data.remaining <= 0);
        }
      } catch {
        if (active) {
          setUnavailable(true);
          onLimitReached(false);
        }
      }
    };

    void refresh();
    const interval = window.setInterval(() => void refresh(), 30_000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [onLimitReached]);

  const reached = usage?.remaining === 0;

  return (
    <div role={reached ? 'alert' : 'status'} aria-live="polite" className={`rounded-xl border p-3 text-sm ${reached ? 'border-amber-300 bg-amber-50 text-amber-900' : 'border-blue-100 bg-blue-50 text-blue-900'}`}>
      <p className="font-semibold">
        {unavailable ? t('ai.dailyUsageUnavailable') : !usage ? t('ai.dailyUsageLoading') : reached ? t('ai.dailyUsageReached') : t('ai.dailyUsageRemaining', { remaining: usage.remaining, limit: usage.limit })}
      </p>
      {usage && <p className="mt-1">{t('ai.dailyUsageUsed', { used: usage.used, limit: usage.limit })}</p>}
      <p className="mt-1 text-xs opacity-80">{t('ai.dailyUsageEstimate')}</p>
    </div>
  );
}

'use client';

import { Download } from 'lucide-react';
import { useLocale } from 'next-intl';
import { useSelectedLayoutSegments } from 'next/navigation';

export default function AppDownloadLink({ floating = false }: { floating?: boolean }) {
  const ar = useLocale() === 'ar';
  const segments = useSelectedLayoutSegments();
  if (floating && segments.includes('(auth)')) return null;

  return <a
    href="https://play.google.com/store/apps/details?id=com.sunmed.learnoo"
    target="_blank"
    rel="noopener noreferrer"
    aria-label={ar ? 'تحميل تطبيق ليرنو من Google Play (يفتح في نافذة جديدة)' : 'Download Learnoo from Google Play (opens in a new window)'}
    className={floating
      ? 'fixed start-4 bottom-[calc(6rem+env(safe-area-inset-bottom,0px))] z-40 flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm text-primary shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary'
      : 'mt-5 flex items-center justify-center gap-3 rounded-xl border bg-white px-5 py-3 text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary'}
  >
    <Download size={20} aria-hidden="true" />
    <span>{ar ? 'حمّل تطبيق ليرنو' : 'Download Learnoo'}<span className="block text-xs text-gray-600" dir="ltr">Google Play</span></span>
  </a>;
}

'use client';

import { useLocale } from 'next-intl';

export default function AppDownloadLink() {
  const ar = useLocale() === 'ar';

  return <footer className="mt-6 w-full shrink-0 border-t border-gray-200 px-4 py-5 text-center">
    <p className="text-sm font-semibold text-gray-700">{ar ? 'حمّل تطبيق ليرنو' : 'Download Learnoo'}</p>
    <div className="mt-3 flex flex-wrap justify-center gap-3">
      {[
        ['Google Play', 'https://play.google.com/store/apps/details?id=com.sunmed.learnoo'],
        ['Huawei AppGallery', 'https://appgallery.huawei.com/app/C119233749'],
      ].map(([name, href]) => <a
        key={name}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={ar ? `تحميل تطبيق ليرنو من ${name} (يفتح في نافذة جديدة)` : `Download Learnoo from ${name} (opens in a new window)`}
        className="rounded-xl border bg-white px-4 py-3 text-sm text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        dir="ltr"
      >{name}</a>)}
    </div>
  </footer>;
}

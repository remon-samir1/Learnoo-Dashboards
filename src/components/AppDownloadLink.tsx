'use client';

import { useLocale } from 'next-intl';
import Image from 'next/image';

export default function AppDownloadLink() {
  const ar = useLocale() === 'ar';

  return <footer className="mt-6 w-full shrink-0 border-t border-gray-200 px-4 py-5 text-center">
    <p className="text-sm font-semibold text-gray-700">{ar ? 'حمّل تطبيق ليرنو' : 'Download Learnoo'}</p>
    <div className="relative mx-auto mt-3 w-full max-w-sm">
      <Image src="/images/app-download-badges.png" alt="" width={1280} height={427} sizes="(max-width: 448px) 100vw, 384px" className="h-auto w-full" />
      {[
        ['Google Play', 'https://play.google.com/store/apps/details?id=com.sunmed.learnoo'],
        ['Huawei AppGallery', 'https://appgallery.huawei.com/app/C119233749'],
      ].map(([name, href], index) => <a
        key={name}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={ar ? `تحميل تطبيق ليرنو من ${name} (يفتح في نافذة جديدة)` : `Download Learnoo from ${name} (opens in a new window)`}
        className={`absolute inset-x-[17%] h-1/2 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${index === 0 ? 'top-0' : 'bottom-0'}`}
      ><span className="sr-only">{name}</span></a>)}
    </div>
  </footer>;
}

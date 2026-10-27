'use client';

import { useLocale } from 'next-intl';
import Image from 'next/image';

export default function AppDownloadLink() {
  const ar = useLocale() === 'ar';

  return <footer className="mt-6 w-full shrink-0 border-t border-gray-200 px-4 py-5 text-center">
    <p className="text-sm font-semibold text-gray-700">{ar ? 'حمّل تطبيق ليرنو' : 'Download Learnoo'}</p>
    <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3">
      {[
        { name: 'Google Play', href: 'https://play.google.com/store/apps/details?id=com.sunmed.learnoo', src: `/images/store-badges/google-play-${ar ? 'ar' : 'en'}.png`, width: 646, height: 250, className: 'h-[72px] w-auto' },
        { name: 'Huawei AppGallery', href: 'https://appgallery.huawei.com/app/C119233749', src: '/images/store-badges/appgallery-en.png', width: 3545, height: 1064, className: 'h-12 w-auto' },
      ].map(({ name, href, src, width, height, className }) => <a
        key={name}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={ar ? `تحميل تطبيق ليرنو من ${name} (يفتح في نافذة جديدة)` : `Download Learnoo from ${name} (opens in a new window)`}
        className="flex h-[72px] items-center rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
      ><Image src={src} alt={name} width={width} height={height} sizes="190px" className={className} /></a>)}
      <div aria-disabled="true" className="flex h-[88px] flex-col items-center justify-center gap-1 text-xs text-gray-500">
        <Image src="/images/store-badges/app-store-en.svg" alt="App Store" width={250} height={83} sizes="150px" className="h-12 w-auto" />
        <span>{ar ? 'قريبًا' : 'Coming soon'}</span>
      </div>
    </div>
  </footer>;
}

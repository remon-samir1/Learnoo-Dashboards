'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import AuthPageLayout from '../components/AuthLayout';

export default function VerificationCodePage() {
  const t = useTranslations('auth.verification');
  const tc = useTranslations('common');
  const [code, setCode] = useState('');
  const [timeLeft, setTimeLeft] = useState(81); // 1:21

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <AuthPageLayout
      title={t('title')}
      subtitle={t('subtitle')}
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label className="font-sans font-medium text-[11.9px] leading-5 text-text-main">{t('code')}</label>
          <input
            type="text"
            className="w-full h-10 px-3 py-[9px] bg-white border border-border-color shadow-[0px_1px_2px_rgba(0,0,0,0.05)] rounded-md font-sans text-sm leading-5 text-text-main outline-none focus:border-primary focus:shadow-[0px_0px_0px_3px_rgba(33,55,214,0.1)] transition-colors placeholder:text-text-placeholder tracking-[2px] placeholder:tracking-normal"
            placeholder="Enter 6-digit code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          />
        </div>

        <div className="flex items-center justify-center gap-[6px] font-sans text-[11.9px] leading-5">
          <span className="text-gray-500">{formatTime(timeLeft)}</span>
          {timeLeft === 0 ? (
            <button
              className="bg-transparent border-none font-sans text-[11.9px] font-medium text-primary cursor-pointer p-0 hover:opacity-80 transition-opacity"
              onClick={() => setTimeLeft(81)}
            >
              {t('resend')}
            </button>
          ) : (
            <button className="bg-transparent border-none font-sans text-[11.9px] font-medium text-primary cursor-default p-0 opacity-50" disabled>
              {t('resend')}
            </button>
          )}
        </div>

        <Link href="/reset-password" virtual-link-type="internal">
          <button className="w-full h-9 bg-primary border-none rounded-lg font-sans font-medium text-[11.9px] leading-5 text-white cursor-pointer hover:opacity-90 active:scale-[0.99] transition-all">{t('verify')}</button>
        </Link>

        <Link href="/login" virtual-link-type="internal" className="block text-center font-sans text-[11.9px] leading-5 text-gray-500 hover:text-primary transition-colors">
          ← {tc('back')}
        </Link>
      </div>
    </AuthPageLayout>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/src/lib/api';
import { parentApi } from '@/src/lib/api';
import AuthPageLayout from '../../components/AuthLayout';

export default function LinkStudentPage() {
  const t = useTranslations('auth.linkStudent');
  const router = useRouter();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleVerify() {
    if (!code.trim()) {
      setError(t('errors.missingCode'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      await parentApi.linkStudents([code.trim()]);
      toast.success(t('success'));
      router.push('/parent/dashboard');
    } catch (err) {
      const message = getApiErrorMessage(err, t('errors.verificationFailed'));
      toast.error(message);
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthPageLayout title={t('title')} subtitle={t('subtitle')}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label className="font-sans font-medium text-[11.9px] leading-5 text-text-main">
            {t('codeLabel')}
          </label>
          <input
            type="text"
            className="h-10 w-full rounded-md border border-border-color bg-white px-3 py-[9px] font-sans text-sm leading-5 text-text-main shadow-[0px_1px_2px_rgba(0,0,0,0.05)] outline-none transition-colors placeholder:text-text-placeholder focus:border-primary focus:shadow-[0px_0px_0px_3px_rgba(33,55,214,0.1)]"
            placeholder={t('codePlaceholder')}
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3">
            <p className="font-sans text-xs leading-5 text-red-600">{error}</p>
          </div>
        )}

        <button
          onClick={handleVerify}
          disabled={loading}
          className="w-full h-9 bg-primary border-none rounded-lg font-sans font-medium text-[11.9px] leading-5 text-white cursor-pointer hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? t('verifying') : t('verify')}
        </button>

        <div className="rounded-md bg-blue-50/50 p-4 border border-blue-100 mt-2">
          <h4 className="font-sans font-medium text-xs text-blue-900 mb-1">{t('howToGetCode.title')}</h4>
          <p className="font-sans text-xs leading-5 text-blue-800">
            {t('howToGetCode.description')}
          </p>
        </div>
      </div>
    </AuthPageLayout>
  );
}

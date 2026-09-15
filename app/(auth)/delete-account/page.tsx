'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import Cookies from '@/lib/cookies';
import { authApi, getApiErrorMessage } from '@/src/lib/api';
import { useAuthActions } from '@/src/stores/authStore';
import AuthPageLayout from '../components/AuthLayout';
import CountryCodeSelect, { DEFAULT_COUNTRY } from '../components/CountryCodeSelect';
import { isValidLocalPhone, normalizeLocalPhone } from '@/src/lib/local-phone';

type Step = 'phone' | 'confirm' | 'done';

const inputClass =
  'w-full min-w-0 h-10 px-3 py-[9px] bg-white border border-border-color shadow-[0px_1px_2px_rgba(0,0,0,0.05)] rounded-md font-sans text-sm leading-5 text-text-main outline-none focus:border-primary focus:shadow-[0px_0px_0px_3px_rgba(33,55,214,0.1)] transition-colors placeholder:text-text-placeholder';

export default function DeleteAccountPage() {
  const t = useTranslations('auth.deleteAccount');
  const { login } = useAuthActions();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState(DEFAULT_COUNTRY);
  const [code, setCode] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  return (
    <AuthPageLayout title={t('title')} subtitle={t('subtitle')}>
      <div className="flex flex-col gap-6">
        {step !== 'done' && (
          <div className="rounded-md border border-border-color bg-gray-50 p-3 flex flex-col gap-1">
            <p className="font-sans text-xs leading-5 text-text-main">{t('whatHappens')}</p>
            <ul className="list-disc ps-5 font-sans text-xs leading-5 text-text-muted">
              <li>{t('effects.profile')}</li>
              <li>{t('effects.content')}</li>
              <li>{t('effects.access')}</li>
              <li>{t('effects.irreversible')}</li>
            </ul>
          </div>
        )}

        {step === 'phone' && (
          <>
            <div className="flex flex-col gap-2">
              <label className="font-sans font-medium text-[11.9px] leading-5 text-text-main">{t('phone')}</label>
              <div className="flex gap-2 min-w-0">
                <CountryCodeSelect value={country} onChange={setCountry} />
                <input
                  type="tel"
                  className={`flex-1 ${inputClass}`}
                  placeholder={t('phonePlaceholder')}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>
            {error && <p className="font-sans text-xs leading-5 text-red-600">{error}</p>}
            <button onClick={handleSendCode} disabled={loading} className="w-full h-9 bg-primary rounded-lg font-sans font-medium text-[11.9px] text-white disabled:opacity-50">
              {loading ? t('sending') : t('sendCode')}
            </button>
          </>
        )}

        {step === 'confirm' && (
          <>
            <div className="flex flex-col gap-2">
              <label className="font-sans font-medium text-[11.9px] leading-5 text-text-main">{t('code')}</label>
              <input
                type="text"
                className={`${inputClass} tracking-[2px]`}
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                autoComplete="one-time-code"
              />
            </div>
            <label className="flex items-start gap-2 font-sans text-xs leading-5 text-text-main">
              <input type="checkbox" className="mt-1" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
              <span>{t('confirmLabel')}</span>
            </label>
            {error && <p className="font-sans text-xs leading-5 text-red-600">{error}</p>}
            <button
              onClick={handleDelete}
              disabled={loading || !agreed || code.length !== 6}
              className="w-full h-9 bg-red-600 rounded-lg font-sans font-medium text-[11.9px] text-white disabled:opacity-50"
            >
              {loading ? t('deleting') : t('deleteButton')}
            </button>
          </>
        )}

        {step === 'done' && (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
            <p className="font-sans text-xs leading-5 text-emerald-800">{t('done')}</p>
          </div>
        )}

        <Link href="/login" virtual-link-type="internal" className="block text-center font-sans text-[11.9px] leading-5 text-gray-500 hover:text-primary">
          {t('backToLogin')}
        </Link>
      </div>
    </AuthPageLayout>
  );

  async function handleSendCode() {
    const local = normalizeLocalPhone(phone);
    if (!local || !isValidLocalPhone(country.iso, phone)) {
      setError(t('errors.phone'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      await login({ phone: `${country.code}${local}`, device_name: 'learnoo-web' } as any);
      const response = await authApi.sendPhoneVerification();
      // Same behaviour as the sign-in verification page: the code is issued to
      // this session and shown for confirmation.
      setCode(response.code);
      setStep('confirm');
    } catch (err: unknown) {
      const message = getApiErrorMessage(err, t('errors.failed'));
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    setLoading(true);
    setError('');
    try {
      await authApi.deleteAccount(code);
      // The session belongs to an account that no longer exists: drop it here
      // instead of the store's logout, which would navigate away from this page.
      sessionStorage.clear();
      for (const name of ['token', 'user_data', 'user_role', 'auth_flow']) Cookies.remove(name);
      setStep('done');
    } catch (err: unknown) {
      const message = getApiErrorMessage(err, t('errors.failed'));
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import Cookies from '@/lib/cookies';
import { ApiError } from '@/src/lib/api';
import { getPostAuthHref } from '@/src/lib/auth-post-login-redirect';
import { useAuthActions } from '@/src/stores/authStore';
import AuthPageLayout from '../components/AuthLayout';

const DEVICE_NAME = 'learnoo-web';

const COUNTRY_CODES = [
  { code: '20', flag: '🇪🇬', name: 'Egypt' },
  { code: '966', flag: '🇸🇦', name: 'Saudi Arabia' },
  { code: '971', flag: '🇦🇪', name: 'UAE' },
  { code: '965', flag: '🇰🇼', name: 'Kuwait' },
  { code: '974', flag: '🇶🇦', name: 'Qatar' },
  { code: '962', flag: '🇯🇴', name: 'Jordan' },
];

function formatRegisterFieldErrors(errors: Record<string, string[]> | undefined): string | null {
  if (!errors || typeof errors !== 'object') return null;
  const parts: string[] = [];
  for (const [, msgs] of Object.entries(errors)) {
    if (Array.isArray(msgs)) {
      for (const m of msgs) {
        if (typeof m === 'string' && m.trim()) parts.push(m.trim());
      }
    }
  }
  return parts.length > 0 ? parts.join(' ') : null;
}

export default function CreateAccountPage() {
  const t = useTranslations('auth.createAccount');
  const router = useRouter();
  const locale = useLocale() || 'ar';
  const { register, fetchCurrentUser } = useAuthActions();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('20');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError('');
    const fn = firstName.trim();
    const ln = lastName.trim();
    const em = email.trim();
    const ph = phone.trim().replace(/\s+/g, '');
    const fullPhone = `${countryCode}${ph}`;

    if (!fn || !ln || !em || !ph || !password || !confirmPassword) {
      setError(t('errors.missingFields'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('errors.passwordMismatch'));
      return;
    }

    if (!agreeToTerms) {
      setError(t('errors.agreeToTerms'));
      return;
    }

    // Egyptian phone validation: should not start with 0
    // if (countryCode === '+20' && ph.startsWith('0')) {
    //   setError(t('errors.egyptPhoneFormat'));
    //   return;
    // }

    setLoading(true);
    try {
      // Use auth store register action which handles API call and cookie storage
      await register({
        first_name: fn,
        last_name: ln,
        phone: fullPhone,
        email: em,
        password,
        device_name: DEVICE_NAME,
      });

      await fetchCurrentUser();

      const userData = Cookies.get('user_data');
      const user = userData ? JSON.parse(userData) : null;
      const userRole = user?.attributes?.role;

      router.push(getPostAuthHref(locale, userRole, user));
    } catch (err) {
      if (err instanceof ApiError) {
        const fieldMsg = formatRegisterFieldErrors(err.errors);
        setError(fieldMsg || err.message.trim() || t('errors.registerFailed'));
      } else {
        setError(err instanceof Error ? err.message : t('errors.registerFailed'));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthPageLayout title={t('title')} subtitle={t('subtitle')}>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label className="font-sans font-medium text-[11.9px] leading-5 text-text-main">{t('firstName')}</label>
          <input
            type="text"
            name="firstName"
            autoComplete="given-name"
            className="h-10 w-full rounded-md border border-border-color bg-white px-3 py-[9px] font-sans text-sm leading-5 text-text-main shadow-[0px_1px_2px_rgba(0,0,0,0.05)] outline-none transition-colors placeholder:text-text-placeholder focus:border-primary focus:shadow-[0px_0px_0px_3px_rgba(33,55,214,0.1)]"
            placeholder={t('firstNamePlaceholder')}
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-sans font-medium text-[11.9px] leading-5 text-text-main">{t('lastName')}</label>
          <input
            type="text"
            name="lastName"
            autoComplete="family-name"
            className="h-10 w-full rounded-md border border-border-color bg-white px-3 py-[9px] font-sans text-sm leading-5 text-text-main shadow-[0px_1px_2px_rgba(0,0,0,0.05)] outline-none transition-colors placeholder:text-text-placeholder focus:border-primary focus:shadow-[0px_0px_0px_3px_rgba(33,55,214,0.1)]"
            placeholder={t('lastNamePlaceholder')}
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-sans font-medium text-[11.9px] leading-5 text-text-main">{t('email')}</label>
          <input
            type="email"
            name="email"
            autoComplete="email"
            className="h-10 w-full rounded-md border border-border-color bg-white px-3 py-[9px] font-sans text-sm leading-5 text-text-main shadow-[0px_1px_2px_rgba(0,0,0,0.05)] outline-none transition-colors placeholder:text-text-placeholder focus:border-primary focus:shadow-[0px_0px_0px_3px_rgba(33,55,214,0.1)]"
            placeholder={t('emailPlaceholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-sans font-medium text-[11.9px] leading-5 text-text-main">{t('phone')}</label>
          <div className="flex gap-2">
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className="h-10 w-[140px] rounded-md border border-border-color bg-white px-2 py-[9px] font-sans text-sm leading-5 text-text-main shadow-[0px_1px_2px_rgba(0,0,0,0.05)] outline-none transition-colors focus:border-primary focus:shadow-[0px_0px_0px_3px_rgba(33,55,214,0.1)]"
            >
              {COUNTRY_CODES.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.flag} {country.code}
                </option>
              ))}
            </select>
            <input
              type="tel"
              name="phone"
              autoComplete="tel"
              className="h-10 flex-1 rounded-md border border-border-color bg-white px-3 py-[9px] font-sans text-sm leading-5 text-text-main shadow-[0px_1px_2px_rgba(0,0,0,0.05)] outline-none transition-colors placeholder:text-text-placeholder focus:border-primary focus:shadow-[0px_0px_0px_3px_rgba(33,55,214,0.1)]"
              placeholder={t('phonePlaceholder')}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-sans font-medium text-[11.9px] leading-5 text-text-main">{t('password')}</label>
          <input
            type="password"
            name="password"
            autoComplete="new-password"
            className="h-10 w-full rounded-md border border-border-color bg-white px-3 py-[9px] font-sans text-sm leading-5 text-text-main shadow-[0px_1px_2px_rgba(0,0,0,0.05)] outline-none transition-colors placeholder:text-text-placeholder focus:border-primary focus:shadow-[0px_0px_0px_3px_rgba(33,55,214,0.1)]"
            placeholder={t('passwordPlaceholder')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-sans font-medium text-[11.9px] leading-5 text-text-main">{t('confirmPassword')}</label>
          <input
            type="password"
            name="confirmPassword"
            autoComplete="new-password"
            className="h-10 w-full rounded-md border border-border-color bg-white px-3 py-[9px] font-sans text-sm leading-5 text-text-main shadow-[0px_1px_2px_rgba(0,0,0,0.05)] outline-none transition-colors placeholder:text-text-placeholder focus:border-primary focus:shadow-[0px_0px_0px_3px_rgba(33,55,214,0.1)]"
            placeholder={t('confirmPasswordPlaceholder')}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-3">
            <p className="font-sans text-xs leading-5 text-red-600">{error}</p>
          </div>
        ) : null}

        <label className="flex items-start gap-2 font-sans text-[11.9px] leading-5 text-text-main cursor-pointer">
          <input
            type="checkbox"
            className="mt-0.5 h-[14px] w-[14px] border border-border-color rounded-[3px] accent-primary cursor-pointer"
            checked={agreeToTerms}
            onChange={(e) => setAgreeToTerms(e.target.checked)}
          />
          <span>
            {t('agreeToTerms')}{' '}
            <Link href="/terms" virtual-link-type="internal" className="font-sans text-[11.9px] font-medium text-primary hover:opacity-80 transition-opacity">
              {t('termsAndConditions')}
            </Link>
          </span>
        </label>

        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={loading}
          className="mt-1 h-9 w-full cursor-pointer rounded-lg border-none bg-primary font-sans text-[11.9px] font-medium leading-5 text-white transition-all hover:opacity-90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? t('creatingAccount') : t('submit')}
        </button>

        <p className="text-center font-sans text-xs leading-5 text-text-muted">
          {t('haveAccount')}{' '}
          <Link
            href="/login"
            virtual-link-type="internal"
            className="font-sans text-xs font-medium text-primary transition-opacity hover:opacity-80"
          >
            {t('login')}
          </Link>
        </p>
      </div>
    </AuthPageLayout>
  );
}

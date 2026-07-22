'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import Cookies from '@/lib/cookies';
import { getApiErrorMessage } from '@/src/lib/api';
import { useAuthActions } from '@/src/stores/authStore';
import AuthPageLayout from '../components/AuthLayout';

export default function LoginPage() {
  const t = useTranslations('auth.login');
  const router = useRouter();
  const { login, fetchCurrentUser } = useAuthActions();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [justRegistered, setJustRegistered] = useState(false);
  const locale = useLocale() || "ar";

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    if (sp.get('registered') !== '1') return;
    setJustRegistered(true);
    sp.delete('registered');
    const qs = sp.toString();
    const path = `${window.location.pathname}${qs ? `?${qs}` : ''}`;
    window.history.replaceState(null, '', path);
  }, []);

  return (
    <AuthPageLayout
      title={t('title')}
      subtitle={t('subtitle')}
    >
      <div className="flex flex-col gap-6">
        {justRegistered ? (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
            <p className="font-sans text-xs leading-5 text-emerald-800">{t('registeredSuccess')}</p>
          </div>
        ) : null}

        {/* Phone */}
        <div className="flex flex-col gap-2">
          <label className="font-sans font-medium text-[11.9px] leading-5 text-text-main">{t('phone')}</label>
          <input
            type="tel"
            className="w-full h-10 px-3 py-[9px] bg-white border border-border-color shadow-[0px_1px_2px_rgba(0,0,0,0.05)] rounded-md font-sans text-sm leading-5 text-text-main outline-none focus:border-primary focus:shadow-[0px_0px_0px_3px_rgba(33,55,214,0.1)] transition-colors placeholder:text-text-placeholder"
            placeholder={t('phonePlaceholder')}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="font-sans text-xs leading-5 text-red-600">{error}</p>
          </div>
        )}

        {/* Sign In Button */}
        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full h-9 bg-primary border-none rounded-lg font-sans font-medium text-[11.9px] leading-5 text-white cursor-pointer hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? t('signingIn') : t('signIn')}
        </button>

        {/* Links */}
        <div className="flex flex-col gap-2 text-center">
          <p className="font-sans text-xs leading-5 text-text-muted">
            <Link href="/parent-login" virtual-link-type="internal" className="font-sans font-medium text-xs text-primary hover:opacity-80 transition-opacity">
              {t('parentLink')}
            </Link>
          </p>
          <p className="font-sans text-xs leading-5 text-text-muted">
            <Link href="/admin-login" virtual-link-type="internal" className="font-sans font-medium text-xs text-primary hover:opacity-80 transition-opacity">
              {t('adminLink')}
            </Link>
          </p>
          <p className="font-sans text-xs leading-5 text-text-muted">
            {t('noAccount')}{' '}
            <Link href="/create-account" virtual-link-type="internal" className="font-sans font-medium text-xs text-primary hover:opacity-80 transition-opacity">
              {t('createAccount')}
            </Link>
          </p>
          <p className="font-sans text-xs leading-5 text-text-muted">
            <Link href="/forgot-password" virtual-link-type="internal" className="font-sans font-medium text-xs text-primary hover:opacity-80 transition-opacity">
              {t('forgotPassword')}
            </Link>
          </p>
        </div>
      </div>
    </AuthPageLayout>
  );

  async function handleLogin() {
    if (!phone) {
      setError(t('errors.missingFields'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Use auth store login action - omit password entirely for student login
      // This will store token in state only (not cookies) - cookies will be set after OTP verification
      await login({
        phone: phone,
        device_name: 'learnoo-web',
      } as any);

      sessionStorage.removeItem('registration_onboarding');
      // Ensure any leftover registration flow flag is cleared so login flow is not
      // mistaken for a registration that should go to complete-profile.
      try {
        sessionStorage.removeItem('auth_flow');
      } catch { }
      try {
        Cookies.set('auth_flow', 'login');
      } catch { }
      // Redirect to verification page - user must verify OTP before accessing dashboard
      // Note: We don't call fetchCurrentUser() here because token is not in cookies yet
      router.push('/verification-code');
    } catch (err: unknown) {
      const message = getApiErrorMessage(err, t('errors.loginFailed'));
      toast.error(message);
      setError(err instanceof Error ? err.message : t('errors.loginFailed'));
    } finally {
      setLoading(false);
    }
  }
}

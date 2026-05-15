'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import Cookies, { CookieAttributes } from '@/lib/cookies';
import { getPostAuthHref } from '@/src/lib/auth-post-login-redirect';
import { useAuthActions } from '@/src/stores/authStore';
import AuthPageLayout from '../components/AuthLayout';

export default function LoginPage() {
  const t = useTranslations('auth.login');
  const router = useRouter();
  const { login, fetchCurrentUser } = useAuthActions();
  const [rememberMe, setRememberMe] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

        {/* Email */}
        <div className="flex flex-col gap-2">
          <label className="font-sans font-medium text-[11.9px] leading-5 text-text-main">{t('email')}</label>
          <input
            type="email"
            className="w-full h-10 px-3 py-[9px] bg-white border border-border-color shadow-[0px_1px_2px_rgba(0,0,0,0.05)] rounded-md font-sans text-sm leading-5 text-text-main outline-none focus:border-primary focus:shadow-[0px_0px_0px_3px_rgba(33,55,214,0.1)] transition-colors placeholder:text-text-placeholder"
            placeholder={t('emailPlaceholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* Password */}
        <div className="flex flex-col gap-2">
          <label className="font-sans font-medium text-[11.9px] leading-5 text-text-main">{t('password')}</label>
          <input
            type="password"
            className="w-full h-10 px-3 py-[9px] bg-white border border-border-color shadow-[0px_1px_2px_rgba(0,0,0,0.05)] rounded-md font-sans text-sm leading-5 text-text-main outline-none focus:border-primary focus:shadow-[0px_0px_0px_3px_rgba(33,55,214,0.1)] transition-colors placeholder:text-text-placeholder"
            placeholder={t('passwordPlaceholder')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {/* Remember me + Forgot password */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 font-sans text-[11.9px] leading-5 text-text-main cursor-pointer">
            <input
              type="checkbox"
              className="w-[14px] h-[14px] border border-border-color rounded-[3px] accent-primary cursor-pointer"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <span>{t('rememberMe')}</span>
          </label>
          <Link href="/forgot-password" virtual-link-type="internal" className="font-sans font-medium text-[11.9px] leading-5 text-primary hover:opacity-80 transition-opacity">
            {t('forgotPassword')}
          </Link>
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

        {/* Create account */}
        <p className="font-sans text-xs leading-5 text-text-muted text-center">
          {t('noAccount')}{' '}
          <Link href="/create-account" virtual-link-type="internal" className="font-sans font-medium text-xs text-primary hover:opacity-80 transition-opacity">
            {t('createAccount')}
          </Link>
        </p>
      </div>
    </AuthPageLayout>
  );

  async function handleLogin() {
    if (!email || !password) {
      setError(t('errors.missingFields'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Use auth store login action
      await login({
        phone_or_email: email,
        password: password,
        device_name: 'learnoo-web',
      });

      await fetchCurrentUser();

      const userData = Cookies.get('user_data');
      const user = userData ? JSON.parse(userData) : null;
      const userRole = user?.attributes?.role;

      sessionStorage.removeItem('registration_onboarding');
      router.push(getPostAuthHref(locale, userRole));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  }
}

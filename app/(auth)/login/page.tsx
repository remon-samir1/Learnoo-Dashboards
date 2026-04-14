'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Cookies, { CookieAttributes } from '@/lib/cookies';
import AuthPageLayout from '../components/AuthLayout';

export default function LoginPage() {
  const t = useTranslations('auth.login');
  const router = useRouter();
  const [rememberMe, setRememberMe] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  return (
    <AuthPageLayout
      title={t('title')}
      subtitle={t('subtitle')}
    >
      <div className="flex flex-col gap-6">
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
      const response = await fetch('https://api.learnoo.app/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          phone_or_email: email,
          password: password,
          device_name: 'learnoo-web',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t('errors.loginFailed'));
      }

      const userRole = data.data?.attributes?.role;
      const token = data.meta?.token;

      if (!token) {
        throw new Error(t('errors.noToken'));
      }

      // Save token in cookies
      const cookieOptions: CookieAttributes = {
        expires: rememberMe ? 30 : undefined, // 30 days if remember me, session otherwise
        secure: true,
        sameSite: 'strict',
      };

      Cookies.set('token', token, cookieOptions);
      Cookies.set('user_role', userRole, cookieOptions);
      Cookies.set('user_data', JSON.stringify(data.data), cookieOptions);

      // Redirect based on role
      if (userRole === 'Admin') {
        router.push('/dashboard');
      } else if (userRole === 'Doctor') {
        router.push('/doctor/dashboard');
      } else {
        setError(t('errors.noPermission'));
        // Clear cookies if role is not authorized
        Cookies.remove('token');
        Cookies.remove('user_role');
        Cookies.remove('user_data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  }
}

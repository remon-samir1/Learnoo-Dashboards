'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { toast } from 'sonner';
import { useAuthActions, useAuthStore } from '@/src/stores/authStore';
import { authApi, getApiErrorMessage } from '@/src/lib/api';
import { useEchoOTP } from '@/src/hooks/useEchoOTP';
import AuthPageLayout from '../components/AuthLayout';

export default function VerificationCodePage() {
  const t = useTranslations('auth.verification');
  const tc = useTranslations('common');
  const router = useRouter();
  const locale = useLocale();
  const [code, setCode] = useState('');
  const [timeLeft, setTimeLeft] = useState(81);
  const [isLoading, setIsLoading] = useState(false);
  const { otp, isConnected, clearOTP } = useEchoOTP();
  const { activateSession } = useAuthActions();

  const otpProcessedRef = useRef(false);
  // Call verification-notification API on mount to trigger OTP send
  useEffect(() => {
    const sendVerificationNotification = async () => {
      try {
        const response = await authApi.sendPhoneVerification();
        // @ts-ignore - The type is updated but sometimes inference is slow
        const receivedOtp = response?.user?.otp;
        if (receivedOtp) {
          setCode(receivedOtp);
        }
      } catch (err: unknown) {
        const message = getApiErrorMessage(err, t('errors.verificationFailed') || 'Failed to send verification code');
        toast.error(message);
      }
    };

    sendVerificationNotification();
  }, []); // runs once on mount
  useEffect(() => {
    if (otp && !otpProcessedRef.current) {
      otpProcessedRef.current = true;
      setCode(otp);
      clearOTP();
    }
    if (!otp) {
      otpProcessedRef.current = false;
    }
  }, [otp, clearOTP]);

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

  const handleVerify = async () => {
    if (!code || code.length !== 6) {
      toast.error(t('errors.codeRequired') || 'Please enter a valid 6-digit code');
      return;
    }

    setIsLoading(true);

    try {
      // Call the phone verification endpoint
      await authApi.verifyPhone(code);

      // Activate session by saving cookies (token, user_data, user_role)
      activateSession();

      toast.success(t('success') || 'OTP verified successfully');

      // Get user from state to determine dashboard route
      const user = useAuthStore.getState().user;
      if (!user) {
        toast.error(t('errors.userNotFound') || 'User data not found');
        return;
      }

      // Determine dashboard route based on user role
      const role = user.attributes.role;
      let dashboardPath = '/student';

      switch (role) {
        case 'Admin':
          dashboardPath = '/admin';
          break;
        case 'Doctor':
        case 'Instructor':
          dashboardPath = '/doctor';
          break;
        case 'Support':
          dashboardPath = '/support';
          break;
        default:
          dashboardPath = '/student';
      }

      // If the user came from a registration flow, send them to complete-profile first.
      const fromRegister =
        typeof window !== 'undefined' &&
        sessionStorage.getItem('auth_flow') === 'register';
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('auth_flow');
      }

      if (fromRegister) {
        router.push(`/${locale}/student/complete-profile`);
      } else {
        router.push(dashboardPath);
      }
    } catch (err: unknown) {
      const message = getApiErrorMessage(err, t('errors.verificationFailed') || 'Verification failed');
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthPageLayout
      title={t('title')}
      subtitle={t('subtitle')}
    >
      <div className="flex flex-col gap-6">
        {isConnected && (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
            <p className="font-sans text-xs leading-5 text-emerald-800">
              {t('connected') || 'Connected to OTP service'}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label className="font-sans font-medium text-[11.9px] leading-5 text-text-main">{t('code')}</label>
          <input
            type="text"
            className="w-full h-10 px-3 py-[9px] bg-white border border-border-color shadow-[0px_1px_2px_rgba(0,0,0,0.05)] rounded-md font-sans text-sm leading-5 text-text-main outline-none focus:border-primary focus:shadow-[0px_0px_0px_3px_rgba(33,55,214,0.1)] transition-colors placeholder:text-text-placeholder tracking-[2px] placeholder:tracking-normal"
            placeholder="Enter 6-digit code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            autoComplete="one-time-code"
          />
        </div>

        <button
          onClick={handleVerify}
          disabled={isLoading || code.length !== 6}
          className="w-full h-9 bg-primary border-none rounded-lg font-sans font-medium text-[11.9px] leading-5 text-white cursor-pointer hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (t('verifying') || 'Verifying...') : t('verify')}
        </button>

        <Link href="/login" virtual-link-type="internal" className="block text-center font-sans text-[11.9px] leading-5 text-gray-500 hover:text-primary transition-colors">
          ← {tc('back')}
        </Link>
      </div>
    </AuthPageLayout>
  );
}
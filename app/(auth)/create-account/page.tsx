'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import AuthPageLayout from '../components/AuthLayout';

export default function CreateAccountPage() {
  const t = useTranslations('auth.createAccount');
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <AuthPageLayout
      title={t('title')}
      subtitle={t('subtitle')}
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label className="font-sans font-medium text-[11.9px] leading-5 text-text-main">{t('firstName')}</label>
          <input
            type="text"
            name="fullName"
            className="w-full h-10 px-3 py-[9px] bg-white border border-border-color shadow-[0px_1px_2px_rgba(0,0,0,0.05)] rounded-md font-sans text-sm leading-5 text-text-main outline-none focus:border-primary focus:shadow-[0px_0px_0px_3px_rgba(33,55,214,0.1)] transition-colors placeholder:text-text-placeholder"
            placeholder="John Doe"
            value={form.fullName}
            onChange={handleChange}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-sans font-medium text-[11.9px] leading-5 text-text-main">{t('email')}</label>
          <input
            type="email"
            name="email"
            className="w-full h-10 px-3 py-[9px] bg-white border border-border-color shadow-[0px_1px_2px_rgba(0,0,0,0.05)] rounded-md font-sans text-sm leading-5 text-text-main outline-none focus:border-primary focus:shadow-[0px_0px_0px_3px_rgba(33,55,214,0.1)] transition-colors placeholder:text-text-placeholder"
            placeholder="admin@learnoo.com"
            value={form.email}
            onChange={handleChange}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-sans font-medium text-[11.9px] leading-5 text-text-main">{t('lastName')}</label>
          <input
            type="tel"
            name="phone"
            className="w-full h-10 px-3 py-[9px] bg-white border border-border-color shadow-[0px_1px_2px_rgba(0,0,0,0.05)] rounded-md font-sans text-sm leading-5 text-text-main outline-none focus:border-primary focus:shadow-[0px_0px_0px_3px_rgba(33,55,214,0.1)] transition-colors placeholder:text-text-placeholder"
            placeholder="+20 100 123 4567"
            value={form.phone}
            onChange={handleChange}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-sans font-medium text-[11.9px] leading-5 text-text-main">{t('password')}</label>
          <input
            type="password"
            name="password"
            className="w-full h-10 px-3 py-[9px] bg-white border border-border-color shadow-[0px_1px_2px_rgba(0,0,0,0.05)] rounded-md font-sans text-sm leading-5 text-text-main outline-none focus:border-primary focus:shadow-[0px_0px_0px_3px_rgba(33,55,214,0.1)] transition-colors placeholder:text-text-placeholder"
            placeholder="Create a strong password"
            value={form.password}
            onChange={handleChange}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-sans font-medium text-[11.9px] leading-5 text-text-main">{t('confirmPassword')}</label>
          <input
            type="password"
            name="confirmPassword"
            className="w-full h-10 px-3 py-[9px] bg-white border border-border-color shadow-[0px_1px_2px_rgba(0,0,0,0.05)] rounded-md font-sans text-sm leading-5 text-text-main outline-none focus:border-primary focus:shadow-[0px_0px_0px_3px_rgba(33,55,214,0.1)] transition-colors placeholder:text-text-placeholder"
            placeholder="Confirm your new password"
            value={form.confirmPassword}
            onChange={handleChange}
          />
        </div>

        <button className="w-full h-9 bg-primary border-none rounded-lg font-sans font-medium text-[11.9px] leading-5 text-white cursor-pointer hover:opacity-90 active:scale-[0.99] transition-all mt-1">{t('submit')}</button>

        <p className="font-sans text-xs leading-5 text-text-muted text-center">
          {t('haveAccount')}{' '}
          <Link href="/login" virtual-link-type="internal" className="font-sans font-medium text-xs text-primary hover:opacity-80 transition-opacity">
            {t('login')}
          </Link>
        </p>
      </div>
    </AuthPageLayout>
  );
}

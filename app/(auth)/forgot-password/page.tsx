'use client';

import { useState } from 'react';
import Link from 'next/link';
import AuthPageLayout from '../components/AuthLayout';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');

  return (
    <AuthPageLayout
      title="Forgot Password"
      subtitle="Enter your email to receive a verification code"
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label className="font-sans font-medium text-[11.9px] leading-5 text-text-main">Email Address</label>
          <input
            type="email"
            className="w-full h-10 px-3 py-[9px] bg-white border border-border-color shadow-[0px_1px_2px_rgba(0,0,0,0.05)] rounded-md font-sans text-sm leading-5 text-text-main outline-none focus:border-primary focus:shadow-[0px_0px_0px_3px_rgba(33,55,214,0.1)] transition-colors placeholder:text-text-placeholder"
            placeholder="admin@learnoo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <Link href="/verification-code" virtual-link-type="internal">
          <button className="w-full h-9 bg-primary border-none rounded-lg font-sans font-medium text-[11.9px] leading-5 text-white cursor-pointer hover:opacity-90 active:scale-[0.99] transition-all">Send Verification Code</button>
        </Link>

        <Link href="/login" virtual-link-type="internal" className="block text-center font-sans text-[11.9px] leading-5 text-gray-500 hover:text-primary transition-colors">
          ← Back to sign in
        </Link>
      </div>
    </AuthPageLayout>
  );
}

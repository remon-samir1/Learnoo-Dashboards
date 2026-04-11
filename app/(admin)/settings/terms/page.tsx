import React from 'react';
import SettingsPageHeader from '@/components/settings/SettingsPageHeader';
import SettingsSection from '@/components/settings/SettingsSection';
import SettingsActionButtons from '@/components/settings/SettingsActionButtons';

export default function TermsSettingsPage() {
  return (
    <div className="flex flex-col h-full">
      <SettingsPageHeader 
        title="Terms & Privacy" 
        description="Manage terms of service and privacy policy" 
      />

      <SettingsSection title="Terms of Service">
        <textarea 
          className="w-full px-5 py-5 bg-white border border-[#EEEEEE] rounded-[16px] text-[14px] text-[#4B5563] leading-relaxed min-h-[220px] focus:outline-none focus:ring-2 focus:ring-[#2137D6]/20 focus:border-[#2137D6] transition-all hover:border-[#D1D5DB] resize-y"
          defaultValue={`Welcome to Learnoo. By using our platform, you agree to these Terms of Service.

1. Account Registration You must provide accurate information when creating an account.

2. Content Usage All course content is for personal educational use only.

3. Payments All purchases are final unless stated otherwise.`}
        />
      </SettingsSection>

      <SettingsSection title="Privacy Policy">
        <textarea 
          className="w-full px-5 py-5 bg-white border border-[#EEEEEE] rounded-[16px] text-[14px] text-[#4B5563] leading-relaxed min-h-[220px] focus:outline-none focus:ring-2 focus:ring-[#2137D6]/20 focus:border-[#2137D6] transition-all hover:border-[#D1D5DB] resize-y"
          defaultValue={`Learnoo Privacy Policy

We collect and process your data to provide educational services.

1. Data Collection We collect name, email, phone, and usage data.

2. Data Usage Your data is used to personalize your learning experience.

3. Data Sharing We do not sell your personal data to third parties.`}
        />
      </SettingsSection>

      <SettingsActionButtons />
    </div>
  );
}

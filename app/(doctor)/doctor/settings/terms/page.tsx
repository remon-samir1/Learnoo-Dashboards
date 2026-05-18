'use client';

import React, { useState, useEffect } from 'react';
import SettingsPageHeader from '@/components/settings/SettingsPageHeader';
import SettingsSection from '@/components/settings/SettingsSection';
import { usePlatformFeature, useUpdatePlatformFeature } from '@/src/hooks';
import toast, { Toaster } from 'react-hot-toast';

const DEFAULT_TERMS = `Welcome to Learnoo. By using our platform, you agree to these Terms of Service.

1. Account Registration You must provide accurate information when creating an account.

2. Content Usage All course content is for personal educational use only.

3. Payments All purchases are final unless stated otherwise.`;

const DEFAULT_PRIVACY = `Learnoo Privacy Policy

We collect and process your data to provide educational services.

1. Data Collection We collect name, email, phone, and usage data.

2. Data Usage Your data is used to personalize your learning experience.

3. Data Sharing We do not sell your personal data to third parties.`;

export default function TermsSettingsPage() {
  const { data: features, isLoading } = usePlatformFeature();
  const updateFeature = useUpdatePlatformFeature();

  const [termsOfService, setTermsOfService] = useState(DEFAULT_TERMS);
  const [privacyPolicy, setPrivacyPolicy] = useState(DEFAULT_PRIVACY);

  // Helper to get feature value by key
  const getFeatureValue = (key: string, defaultValue: string = ''): string => {
    if (!features) return defaultValue;
    const feature = features.find((f) => f.attributes.key === key);
    return feature?.attributes.value || defaultValue;
  };

  useEffect(() => {
    if (features) {
      setTermsOfService(getFeatureValue('terms_of_service', DEFAULT_TERMS));
      setPrivacyPolicy(getFeatureValue('privacy_policy', DEFAULT_PRIVACY));
    }
  }, [features]);

  const handleSave = async () => {
    const requests = [];

    if (termsOfService.trim()) {
      requests.push(updateFeature.mutateAsync({ key: 'terms_of_service', value: termsOfService.trim() }));
    }
    if (privacyPolicy.trim()) {
      requests.push(updateFeature.mutateAsync({ key: 'privacy_policy', value: privacyPolicy.trim() }));
    }

    try {
      await Promise.all(requests);
      toast.success('Terms & Privacy settings saved successfully!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save settings');
    }
  };

  const handleCancel = () => {
    if (features) {
      setTermsOfService(getFeatureValue('terms_of_service', DEFAULT_TERMS));
      setPrivacyPolicy(getFeatureValue('privacy_policy', DEFAULT_PRIVACY));
    }
  };

  return (
    <div className="flex flex-col h-full">
      <Toaster position="top-right" />
      <SettingsPageHeader
        title="Terms & Privacy"
        description="Manage terms of service and privacy policy"
      />

      <SettingsSection title="Terms of Service">
        {isLoading ? (
          <div className="animate-pulse">
            <div className="h-[220px] w-full bg-gray-200 rounded-[16px]"></div>
          </div>
        ) : (
          <textarea
            className="w-full px-5 py-5 bg-white border border-[#EEEEEE] rounded-[16px] text-[14px] text-[#4B5563] leading-relaxed min-h-[220px] focus:outline-none focus:ring-2 focus:ring-[#2137D6]/20 focus:border-[#2137D6] transition-all hover:border-[#D1D5DB] resize-y"
            value={termsOfService}
            onChange={(e) => setTermsOfService(e.target.value)}
            placeholder="Enter your Terms of Service content..."
          />
        )}
      </SettingsSection>

      <SettingsSection title="Privacy Policy">
        {isLoading ? (
          <div className="animate-pulse">
            <div className="h-[220px] w-full bg-gray-200 rounded-[16px]"></div>
          </div>
        ) : (
          <textarea
            className="w-full px-5 py-5 bg-white border border-[#EEEEEE] rounded-[16px] text-[14px] text-[#4B5563] leading-relaxed min-h-[220px] focus:outline-none focus:ring-2 focus:ring-[#2137D6]/20 focus:border-[#2137D6] transition-all hover:border-[#D1D5DB] resize-y"
            value={privacyPolicy}
            onChange={(e) => setPrivacyPolicy(e.target.value)}
            placeholder="Enter your Privacy Policy content..."
          />
        )}
      </SettingsSection>

      <div className="flex justify-end gap-4 mt-8 pb-8">
        <button
          onClick={handleCancel}
          disabled={isLoading || updateFeature.isPending}
          className="px-5 py-2.5 text-[14px] font-semibold text-[#4B5563] bg-white border border-[#EEEEEE] hover:bg-[#F9FAFB] rounded-xl transition-colors hover:border-[#D1D5DB] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={isLoading || updateFeature.isPending}
          className="px-5 py-2.5 text-[14px] font-semibold text-white bg-[#2137D6] hover:bg-[#1C2EB8] rounded-xl transition-colors shadow-md shadow-[#2137D6]/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {updateFeature.isPending ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import SettingsPageHeader from '@/components/settings/SettingsPageHeader';
import SettingsSection from '@/components/settings/SettingsSection';
import { usePlatformFeature, useUpdatePlatformFeature } from '@/src/hooks';
import toast, { Toaster } from 'react-hot-toast';

export default function GeneralSettingsPage() {
  const tSleep = useTranslations('videoSleepSettings');
  const { data: features, isLoading } = usePlatformFeature();
  const updateFeature = useUpdatePlatformFeature();

  const [formData, setFormData] = useState({
    platformName: '',
    tagline: '',
    supportEmail: '',
    sleepMinutes: '5',
  });

  // Helper to get feature value by key
  const getFeatureValue = (key: string): string => {
    if (!features) return '';
    const feature = features.find((f) => f.attributes.key === key);
    return feature?.attributes.value || '';
  };

  useEffect(() => {
    if (features) {
      setFormData({
        platformName: getFeatureValue('platform_name'),
        tagline: getFeatureValue('tagline'),
        supportEmail: getFeatureValue('support_email'),
        sleepMinutes: getFeatureValue('sleep_per_minute') || '5',
      });
    }
  }, [features]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    const minutes = Number(formData.sleepMinutes);
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 1440) {
      toast.error(tSleep('invalid'));
      return;
    }
    const requests = [updateFeature.mutateAsync({ key: 'sleep_per_minute', value: String(minutes) })];
    
    if (formData.platformName.trim()) {
      requests.push(updateFeature.mutateAsync({ key: 'platform_name', value: formData.platformName.trim() }));
    }
    if (formData.tagline.trim()) {
      requests.push(updateFeature.mutateAsync({ key: 'tagline', value: formData.tagline.trim() }));
    }
    if (formData.supportEmail.trim()) {
      requests.push(updateFeature.mutateAsync({ key: 'support_email', value: formData.supportEmail.trim() }));
    }
    
    try {
      await Promise.all(requests);
      toast.success('Settings saved successfully!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save settings');
    }
  };

  const handleCancel = () => {
    if (features) {
      setFormData({
        platformName: getFeatureValue('platform_name'),
        tagline: getFeatureValue('tagline'),
        supportEmail: getFeatureValue('support_email'),
        sleepMinutes: getFeatureValue('sleep_per_minute') || '5',
      });
    }
  };

  return (
    <div className="flex flex-col h-full">
      <Toaster position="top-right" />
      <SettingsPageHeader 
        title="General Settings" 
        description="Platform name, timezone, and basic configuration" 
      />

      <SettingsSection title="Platform">
        {isLoading ? (
          <div className="space-y-6">
            <div className="animate-pulse">
              <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
              <div className="h-10 w-full bg-gray-200 rounded-xl"></div>
            </div>
            <div className="animate-pulse">
              <div className="h-4 w-16 bg-gray-200 rounded mb-2"></div>
              <div className="h-10 w-full bg-gray-200 rounded-xl"></div>
            </div>
            <div className="animate-pulse">
              <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
              <div className="h-10 w-full bg-gray-200 rounded-xl"></div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-1.5">
              <label className="text-[13px] font-medium text-[#4B5563]">Platform Name</label>
              <input 
                type="text" 
                name="platformName"
                value={formData.platformName}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-white border border-[#EEEEEE] rounded-xl text-[14px] text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2137D6]/20 focus:border-[#2137D6] transition-all hover:border-[#D1D5DB]"
              />
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              <label className="text-[13px] font-medium text-[#4B5563]">Tagline</label>
              <input 
                type="text" 
                name="tagline"
                value={formData.tagline}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-white border border-[#EEEEEE] rounded-xl text-[14px] text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2137D6]/20 focus:border-[#2137D6] transition-all hover:border-[#D1D5DB]"
              />
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              <label className="text-[13px] font-medium text-[#4B5563]">Support Email</label>
              <input 
                type="email" 
                name="supportEmail"
                value={formData.supportEmail}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-white border border-[#EEEEEE] rounded-xl text-[14px] text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2137D6]/20 focus:border-[#2137D6] transition-all hover:border-[#D1D5DB]"
              />
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              <label htmlFor="video-sleep-minutes" className="text-[13px] font-medium text-[#4B5563]">{tSleep('label')}</label>
              <input
                id="video-sleep-minutes"
                type="number"
                name="sleepMinutes"
                min={1}
                max={1440}
                step={1}
                value={formData.sleepMinutes}
                onChange={handleChange}
                aria-describedby="video-sleep-description"
                className="w-full px-4 py-2.5 bg-white border border-[#EEEEEE] rounded-xl text-[14px] text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2137D6]/20 focus:border-[#2137D6]"
              />
              <p id="video-sleep-description" className="text-sm text-gray-500">{tSleep('description')}</p>
            </div>
          </div>
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

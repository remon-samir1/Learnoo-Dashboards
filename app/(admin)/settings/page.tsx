'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import SettingsCard from '@/components/settings/SettingsCard';

export default function PlatformSettingsPage() {
  const t = useTranslations('header.titles');
  const tSettings = useTranslations('platformSettings');

  const settingsCategories = [
    {
      icon: 'Settings' as const,
      titleKey: 'generalSettings',
      href: '/settings/general'
    },
    {
      icon: 'Palette' as const,
      titleKey: 'branding',
      href: '/settings/branding'
    },
    {
      icon: 'Bell' as const,
      titleKey: 'notifications',
      href: '/settings/notifications',
      soon: true,
      disabled: true
    },
    {
      icon: 'Globe' as const,
      titleKey: 'languageRegion',
      href: '/settings/language',
      soon: true,
      disabled: true
    },
    {
      icon: 'FileText' as const,
      titleKey: 'termsPrivacy',
      href: '/settings/terms'
    }
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[22px] font-bold text-[#111827]">{t('platformSettings')}</h1>
        <p className="text-[14px] text-[#6B7280] mt-2">{tSettings('pageDescription')}</p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {settingsCategories.map((category, index) => (
          <SettingsCard
            key={index}
            icon={category.icon}
            title={tSettings(`${category.titleKey}.title`)}
            description={tSettings(`${category.titleKey}.description`)}
            href={category.href}
            soon={category.soon}
            disabled={category.disabled}
            soonLabel={tSettings('soon')}
          />
        ))}
      </div>
    </div>
  );
}

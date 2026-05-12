'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import SettingsCard from '@/components/settings/SettingsCard';
<<<<<<< HEAD
import { useCurrentUser } from '@/src/hooks/useAuth';
=======
>>>>>>> origin/master

export default function PlatformSettingsPage() {
  const t = useTranslations('header.titles');
  const tSettings = useTranslations('platformSettings');
<<<<<<< HEAD
  const { role } = useCurrentUser();
  const isInstructor = role === 'Instructor';

  const allSettingsCategories = [
    {
      icon: 'Settings' as const,
      titleKey: 'generalSettings',
      href: '/settings/general',
      adminOnly: true
    },
    {
      icon: 'User' as const,
      titleKey: 'profile',
      href: '/settings/profile',
      adminOnly: false,
      soon: false,
      disabled: false
=======

  const settingsCategories = [
    {
      icon: 'Settings' as const,
      titleKey: 'generalSettings',
      href: '/settings/general'
>>>>>>> origin/master
    },
    {
      icon: 'Palette' as const,
      titleKey: 'branding',
<<<<<<< HEAD
      href: '/settings/branding',
      adminOnly: true
=======
      href: '/settings/branding'
>>>>>>> origin/master
    },
    {
      icon: 'Bell' as const,
      titleKey: 'notifications',
      href: '/settings/notifications',
      soon: true,
<<<<<<< HEAD
      disabled: true,
      adminOnly: true
=======
      disabled: true
>>>>>>> origin/master
    },
    {
      icon: 'Globe' as const,
      titleKey: 'languageRegion',
      href: '/settings/language',
      soon: true,
<<<<<<< HEAD
      disabled: true,
      adminOnly: true
=======
      disabled: true
>>>>>>> origin/master
    },
    {
      icon: 'FileText' as const,
      titleKey: 'termsPrivacy',
<<<<<<< HEAD
      href: '/settings/terms',
      adminOnly: true
=======
      href: '/settings/terms'
>>>>>>> origin/master
    },
    {
      icon: 'Image' as const,
      titleKey: 'watermark',
<<<<<<< HEAD
      href: '/settings/watermark',
      adminOnly: true
    }
  ];

  const settingsCategories = isInstructor
    ? allSettingsCategories.filter(c => !c.adminOnly)
    : allSettingsCategories;

=======
      href: '/settings/watermark'
    }
  ];

>>>>>>> origin/master
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

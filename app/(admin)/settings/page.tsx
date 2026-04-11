import React from 'react';
import SettingsCard from '@/components/settings/SettingsCard';
import { 
  Settings, 
  Palette, 
  Bell, 
  Globe, 
  FileText 
} from 'lucide-react';

export default function PlatformSettingsPage() {
  const settingsCategories = [
    {
      icon: Settings,
      title: 'General Settings',
      description: 'Platform name, timezone, and basic configuration.',
      href: '/settings/general'
    },
    {
      icon: Palette,
      title: 'Branding',
      description: 'Logos, colors, and visual identity.',
      href: '/settings/branding'
    },
    {
      icon: Bell,
      title: 'Notifications Settings',
      description: 'Email templates and push notification defaults.',
      href: '/settings/notifications'
    },
    {
      icon: Globe,
      title: 'Language & Region',
      description: 'Default language, date formats, and currency.',
      href: '/settings/language'
    },
    {
      icon: FileText,
      title: 'Terms & Privacy',
      description: 'Manage terms of service and privacy policy text.',
      href: '/settings/terms'
    }
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[22px] font-bold text-[#111827]">Platform Settings</h1>
        <p className="text-[14px] text-[#6B7280] mt-2">Manage your platform's core configuration and preferences.</p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {settingsCategories.map((category, index) => (
          <SettingsCard
            key={index}
            icon={category.icon}
            title={category.title}
            description={category.description}
            href={category.href}
          />
        ))}
      </div>
    </div>
  );
}

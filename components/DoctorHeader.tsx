"use client";

import React from 'react';
import { useTranslations } from 'next-intl';
import { Search, Bell, LogOut } from 'lucide-react';
import Link from 'next/link';
import { logout } from '@/lib/auth';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useCurrentUser } from '@/src/hooks/useAuth';
import { usePlatformFeature } from '@/src/hooks';

export default function DoctorHeader() {
  const t = useTranslations();
  const { user, fullName } = useCurrentUser();
  const { data: features } = usePlatformFeature();

  const getFeatureValue = (key: string, defaultValue: string = ''): string => {
    if (!features) return defaultValue;
    const feature = features.find((f) => f.attributes.key === key);
    return feature?.attributes.value || defaultValue;
  };

  const primaryColor = getFeatureValue('primary_color', '#4F46E5');

  // Get user initials
  const getInitials = () => {
    if (!user) return '??';
    const first = user.attributes.first_name?.charAt(0) || '';
    const last = user.attributes.last_name?.charAt(0) || '';
    return `${first}${last}`.toUpperCase() || '??';
  };

  const displayName = fullName || (user ? `${user.attributes.first_name} ${user.attributes.last_name}` : 'Doctor');

  return (
    <header className="h-16 bg-white flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Search */}
      <div className="relative group flex-1 max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="w-4 h-4 text-[#9CA3AF]" />
        </div>
        <input
          type="text"
          placeholder={t('common.search')}
          className="w-full h-10 pl-10 pr-4 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:ring-opacity-20 placeholder:text-[#9CA3AF]"
        />
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-4">
        <LanguageSwitcher />
        
        {/* Notification Bell */}  
        <Link href="/doctor/notifications"
         className="relative p-2 text-[#64748B] hover:bg-[#F1F5F9] rounded-full transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-[#4F46E5] rounded-full border-2 border-white"></span>
        </Link>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-4 border-l border-[#E5E7EB]">
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
            style={{
              backgroundColor: `${primaryColor}15`,
            }}
          >
            <span
              className="text-[12px] font-bold"
              style={{ color: primaryColor }}
            >
              {getInitials()}
            </span>
          </div>
          <span className="text-sm font-medium text-[#1E293B]">{displayName}</span>
        </div>

        {/* Logout */}
        <button 
          onClick={logout}
          className="p-2 text-[#64748B] hover:bg-[#F1F5F9] rounded-full transition-colors"
          title={t('common.logout')}
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}

"use client";

import React from 'react';
import { useTranslations } from 'next-intl';
import { Search, Bell, LogOut } from 'lucide-react';
import { useAuthActions, useAuth } from '@/src/stores/authStore';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function SupportHeader() {
  const t = useTranslations();
  const { user } = useAuth();
  const { logout } = useAuthActions();

  // Get user initials
  const getInitials = () => {
    if (!user) return '??';
    const first = user.attributes.first_name?.charAt(0) || '';
    const last = user.attributes.last_name?.charAt(0) || '';
    return `${first}${last}`.toUpperCase() || '??';
  };

  const displayName = user ? `${user.attributes.first_name} ${user.attributes.last_name}` : 'Support';

  return (
    <header className="h-16 bg-white flex items-center justify-between px-6 sticky top-0 z-30 border-b border-[#E5E7EB]">
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
        <div className="relative p-2 text-[#64748B] hover:bg-[#F1F5F9] rounded-full transition-colors cursor-pointer">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-[#4F46E5] rounded-full border-2 border-white"></span>
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-4 border-l border-[#E5E7EB]">
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-[#4F46E5]/10"
          >
            <span className="text-[12px] font-bold text-[#4F46E5]">
              {getInitials()}
            </span>
          </div>
          <span className="text-sm font-medium text-[#1E293B]">{displayName}</span>
        </div>

        {/* Logout */}
        <button 
          onClick={() => logout()}
          className="p-2 text-[#64748B] hover:bg-[#F1F5F9] rounded-full transition-colors"
          title={t('common.logout')}
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}

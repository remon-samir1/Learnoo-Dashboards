"use client";

import React from 'react';
import { useTranslations } from 'next-intl';
import { Search, Bell, LogOut } from 'lucide-react';
import Link from 'next/link';
import { logout } from '@/lib/auth';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function DoctorHeader() {
  const t = useTranslations();
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
          <div className="w-8 h-8 rounded-full overflow-hidden">
            <img 
              src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100&h=100&fit=crop&crop=face" 
              alt="Dr. Nada"
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-sm font-medium text-[#1E293B]">Dr. Nada</span>
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

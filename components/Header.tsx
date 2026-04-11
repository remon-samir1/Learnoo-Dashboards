"use client";

import React from 'react';
import { LogOut } from 'lucide-react';
import { logout } from '@/lib/auth';

export default function Header() {
  return (
    <header className="h-16 bg-white border-b border-[#EEEEEE] flex items-center justify-between px-8 sticky top-0 z-30 shadow-[0px_1px_2px_rgba(0,0,0,0.05)]">
      {/* Title */}
      <h2 className="text-[17px] font-semibold text-[#111827]">Dashboard Overview</h2>

      {/* Actions */}
      <div className="flex items-center gap-6">
        {/* Search */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
             </svg>
          </div>
          <input
            type="text"
            placeholder="Search..."
            className="w-[401px] h-10 pl-10 pr-4 bg-[#F8FAFC] border border-[#EEEEEE] rounded-lg text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-20 placeholder:text-[#BBBBBA]"
          />
        </div>

        {/* Icons */}
        <div className="flex items-center gap-4">
          <button className="p-2 text-[#9CA3AF] hover:bg-[#F4F5FD] rounded-full transition-colors relative">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#2137D6] rounded-full border-2 border-white"></span>
          </button>
          <button className="p-2 text-[#9CA3AF] hover:bg-[#F4F5FD] rounded-full transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button 
            onClick={logout}
            className="p-2 text-[#9CA3AF] hover:bg-[#F4F5FD] rounded-full transition-colors"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}

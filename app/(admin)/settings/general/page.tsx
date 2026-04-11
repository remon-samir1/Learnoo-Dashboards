import React from 'react';
import SettingsPageHeader from '@/components/settings/SettingsPageHeader';
import SettingsSection from '@/components/settings/SettingsSection';
import SettingsActionButtons from '@/components/settings/SettingsActionButtons';

export default function GeneralSettingsPage() {
  return (
    <div className="flex flex-col h-full">
      <SettingsPageHeader 
        title="General Settings" 
        description="Platform name, timezone, and basic configuration" 
      />

      <SettingsSection title="Platform">
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-1.5">
            <label className="text-[13px] font-medium text-[#4B5563]">Platform Name</label>
            <input 
              type="text" 
              defaultValue="Learnoo"
              className="w-full px-4 py-2.5 bg-white border border-[#EEEEEE] rounded-xl text-[14px] text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2137D6]/20 focus:border-[#2137D6] transition-all hover:border-[#D1D5DB]"
            />
          </div>
          <div className="grid grid-cols-1 gap-1.5">
            <label className="text-[13px] font-medium text-[#4B5563]">Tagline</label>
            <input 
              type="text" 
              defaultValue="Learn Smarter"
              className="w-full px-4 py-2.5 bg-white border border-[#EEEEEE] rounded-xl text-[14px] text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2137D6]/20 focus:border-[#2137D6] transition-all hover:border-[#D1D5DB]"
            />
          </div>
          <div className="grid grid-cols-1 gap-1.5">
            <label className="text-[13px] font-medium text-[#4B5563]">Support Email</label>
            <input 
              type="email" 
              defaultValue="support@learnoo.com"
              className="w-full px-4 py-2.5 bg-white border border-[#EEEEEE] rounded-xl text-[14px] text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2137D6]/20 focus:border-[#2137D6] transition-all hover:border-[#D1D5DB]"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="grid grid-cols-1 gap-1.5 relative">
              <label className="text-[13px] font-medium text-[#4B5563]">Timezone</label>
              <select className="w-full px-4 py-2.5 bg-white border border-[#EEEEEE] rounded-xl text-[14px] text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2137D6]/20 focus:border-[#2137D6] transition-all appearance-none cursor-pointer hover:border-[#D1D5DB]">
                <option>Africa/Cairo</option>
              </select>
              <div className="absolute right-4 top-[38px] pointer-events-none text-[#9CA3AF]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              <label className="text-[13px] font-medium text-[#4B5563]">Max Students</label>
              <input 
                type="number" 
                defaultValue="50000"
                className="w-full px-4 py-2.5 bg-white border border-[#EEEEEE] rounded-xl text-[14px] text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2137D6]/20 focus:border-[#2137D6] transition-all hover:border-[#D1D5DB]"
              />
            </div>
          </div>
        </div>
      </SettingsSection>

      <SettingsActionButtons />
    </div>
  );
}

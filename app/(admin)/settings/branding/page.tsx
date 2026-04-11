import React from 'react';
import SettingsPageHeader from '@/components/settings/SettingsPageHeader';
import SettingsSection from '@/components/settings/SettingsSection';
import SettingsActionButtons from '@/components/settings/SettingsActionButtons';
import { Upload } from 'lucide-react';

export default function BrandingSettingsPage() {
  return (
    <div className="flex flex-col h-full">
      <SettingsPageHeader 
        title="Branding" 
        description="Logos, colors, and visual identity" 
      />

      <SettingsSection title="Logo">
        <div className="flex items-center gap-6">
          <div className="w-[100px] h-[100px] bg-[#E0E7FF] rounded-[16px] flex items-center justify-center border border-[#C7D2FE]/50 shadow-sm shrink-0">
            <span className="text-[28px] font-bold text-[#2137D6]">L</span>
          </div>
          <div>
            <button className="flex items-center gap-2 px-5 py-2.5 text-[13px] font-semibold text-[#4B5563] bg-white border border-[#EEEEEE] hover:bg-[#F9FAFB] hover:border-[#D1D5DB] rounded-xl transition-colors mb-3">
              <Upload className="w-4 h-4" />
              Upload Logo
            </button>
            <p className="text-[12px] text-[#9CA3AF]">PNG, SVG. Max 2MB. Recommended 512x512px.</p>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection title="Colors & Typography">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="grid grid-cols-1 gap-1.5 relative">
            <label className="text-[13px] font-medium text-[#4B5563]">Primary Color</label>
            <div className="relative">
              <div className="absolute left-[5px] top-[5px] bottom-[5px] w-10 rounded-lg shadow-sm" style={{ backgroundColor: '#2563EB' }}></div>
              <input 
                type="text" 
                defaultValue="#2563EB"
                className="w-full pl-[60px] pr-4 py-2.5 bg-white border border-[#EEEEEE] rounded-xl text-[14px] text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2137D6]/20 focus:border-[#2137D6] transition-all hover:border-[#D1D5DB]"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-1.5 relative">
            <label className="text-[13px] font-medium text-[#4B5563]">Accent Color</label>
            <div className="relative">
              <div className="absolute left-[5px] top-[5px] bottom-[5px] w-10 rounded-lg shadow-sm" style={{ backgroundColor: '#10B981' }}></div>
              <input 
                type="text" 
                defaultValue="#10B981"
                className="w-full pl-[60px] pr-4 py-2.5 bg-white border border-[#EEEEEE] rounded-xl text-[14px] text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2137D6]/20 focus:border-[#2137D6] transition-all hover:border-[#D1D5DB]"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-1.5 relative">
             <label className="text-[13px] font-medium text-[#4B5563]">Font Family</label>
              <select className="w-full px-4 py-2.5 bg-white border border-[#EEEEEE] rounded-xl text-[14px] text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2137D6]/20 focus:border-[#2137D6] transition-all appearance-none cursor-pointer hover:border-[#D1D5DB]">
                <option>Inter</option>
              </select>
              <div className="absolute right-4 top-[38px] pointer-events-none text-[#9CA3AF]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </div>
          </div>
        </div>
      </SettingsSection>

      <SettingsActionButtons />
    </div>
  );
}

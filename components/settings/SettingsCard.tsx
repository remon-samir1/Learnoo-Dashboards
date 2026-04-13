'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Settings, 
  Palette, 
  Bell, 
  Globe, 
  FileText,
  ChevronRight 
} from 'lucide-react';

const iconMap = {
  Settings,
  Palette,
  Bell,
  Globe,
  FileText
};

type IconName = keyof typeof iconMap;

interface SettingsCardProps {
  icon: IconName;
  title: string;
  description: string;
  href: string;
  soon?: boolean;
  disabled?: boolean;
}

export default function SettingsCard({ icon, title, description, href, soon, disabled }: SettingsCardProps) {
  const IconComponent = iconMap[icon];
  return (
    <Link 
      href={disabled ? '#' : href} 
      onClick={(e) => disabled && e.preventDefault()}
      className={`flex items-center gap-5 p-6 bg-white border border-[#EEEEEE] rounded-2xl transition-all ${disabled ? 'opacity-60 cursor-not-allowed' : 'hover:border-[#2137D6]/20 hover:shadow-[0px_4px_20px_rgba(33,55,214,0.05)] group'}`}
    >
      <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full bg-[#F8FAFC] border border-[#EEEEEE] text-[#4B5563] group-hover:bg-[#F4F5FD] group-hover:text-[#2137D6] group-hover:border-[#2137D6]/20 transition-all">
        <IconComponent className="w-[22px] h-[22px]" strokeWidth={1.5} />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h3 className={`text-[16px] font-semibold text-[#111827] ${disabled ? '' : 'group-hover:text-[#2137D6]'} transition-colors`}>{title}</h3>
          {soon && (
            <span className="px-2 py-0.5 text-[11px] font-medium text-[#2137D6] bg-[#2137D6]/10 rounded-full">
              soon
            </span>
          )}
        </div>
        <p className="text-[13px] text-[#6B7280] mt-1">{description}</p>
      </div>
      {!disabled && (
        <div className={`flex-shrink-0 text-[#9CA3AF] ${disabled ? '' : 'group-hover:text-[#2137D6]'} transition-transform group-hover:translate-x-1`}>
          <ChevronRight className="w-5 h-5" strokeWidth={1.5} />
        </div>
      )}
    </Link>
  );
}

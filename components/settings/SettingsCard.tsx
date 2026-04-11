import React from 'react';
import Link from 'next/link';
import { LucideIcon, ChevronRight } from 'lucide-react';

interface SettingsCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
}

export default function SettingsCard({ icon: Icon, title, description, href }: SettingsCardProps) {
  return (
    <Link 
      href={href} 
      className="flex items-center gap-5 p-6 bg-white border border-[#EEEEEE] rounded-2xl hover:border-[#2137D6]/20 hover:shadow-[0px_4px_20px_rgba(33,55,214,0.05)] transition-all group"
    >
      <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full bg-[#F8FAFC] border border-[#EEEEEE] text-[#4B5563] group-hover:bg-[#F4F5FD] group-hover:text-[#2137D6] group-hover:border-[#2137D6]/20 transition-all">
        <Icon className="w-[22px] h-[22px]" strokeWidth={1.5} />
      </div>
      <div className="flex-1">
        <h3 className="text-[16px] font-semibold text-[#111827] group-hover:text-[#2137D6] transition-colors">{title}</h3>
        <p className="text-[13px] text-[#6B7280] mt-1">{description}</p>
      </div>
      <div className="flex-shrink-0 text-[#9CA3AF] group-hover:text-[#2137D6] transition-transform group-hover:translate-x-1">
        <ChevronRight className="w-5 h-5" strokeWidth={1.5} />
      </div>
    </Link>
  );
}

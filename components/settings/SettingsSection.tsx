import React from 'react';

interface SettingsSectionProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export default function SettingsSection({ title, children, className = '' }: SettingsSectionProps) {
  return (
    <div className={`bg-white border border-[#EEEEEE] rounded-[16px] p-6 lg:p-8 shadow-sm mb-6 ${className}`}>
      {title && <h2 className="text-[15px] font-bold text-[#111827] mb-6">{title}</h2>}
      {children}
    </div>
  );
}

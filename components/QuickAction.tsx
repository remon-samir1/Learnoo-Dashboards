import React from 'react';
import Link from 'next/link';

interface QuickActionProps {
  icon: React.ReactNode;
  label: string;
  bgColor: string;
  iconBgColor: string;
  iconColor: string;
  href?: string;
}

export default function QuickAction({ 
  icon, 
  label, 
  bgColor, 
  iconBgColor, 
  iconColor,
  href = "#"
}: QuickActionProps) {
  return (
    <Link href={href} className="flex flex-col items-center justify-center min-w-[150px] flex-1 h-[115px] bg-white border border-[#EEEEEE] rounded-xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 group">
      <div className={`w-12 h-12 ${iconBgColor} rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
        <div style={{ color: iconColor }}>
          {icon}
        </div>
      </div>
      <span className="text-[11.9px] font-medium text-[#374151]">{label}</span>
    </Link>
  );
}


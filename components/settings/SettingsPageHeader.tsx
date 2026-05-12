import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface SettingsPageHeaderProps {
  title: string;
  description: string;
  backLink?: string;
}

export default function SettingsPageHeader({ title, description, backLink = '/settings' }: SettingsPageHeaderProps) {
  return (
    <div className="flex items-start gap-4 mb-8">
      <Link href={backLink} className="p-2 -ml-2 text-[#6B7280] hover:bg-black/5 rounded-xl transition-colors mt-0.5">
        <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
      </Link>
      <div>
        <h1 className="text-[20px] font-bold text-[#111827]">{title}</h1>
        <p className="text-[14px] text-[#6B7280] mt-1">{description}</p>
      </div>
    </div>
  );
}

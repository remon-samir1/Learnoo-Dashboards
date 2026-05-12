"use client";

import React from 'react';

interface FeatureToggleProps {
  label: string;
  description?: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

export default function FeatureToggle({
  label,
  description,
  enabled,
  onChange
}: FeatureToggleProps) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-[#F1F5F9] last:border-0 hover:bg-[#F8FAFC]/50 px-2 rounded-xl transition-colors">
      <div className="flex flex-col gap-0.5">
        <span className="text-[14px] font-bold text-[#1E293B]">{label}</span>
        {description && (
          <span className="text-[12px] text-[#64748B]">{description}</span>
        )}
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 ${
          enabled ? 'bg-[#2563EB]' : 'bg-[#E2E8F0]'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            enabled ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

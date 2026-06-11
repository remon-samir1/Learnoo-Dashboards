'use client';

import React, { useState } from 'react';
import { ArrowLeft, Save, Smartphone, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function ParentalMonitoringSettingsPage() {
  const [enabled, setEnabled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await new Promise((r) => setTimeout(r, 500));
      toast.success('Settings saved successfully');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-3xl mx-auto pb-12">
      <div className="flex items-center gap-4">
        <Link
          href="/settings"
          className="p-2.5 bg-white border border-[#E2E8F0] rounded-xl text-[#64748B] hover:text-[#1E293B] hover:shadow-sm transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">Parental Monitoring</h1>
          <p className="text-sm text-[#64748B] mt-0.5">Configure parental monitoring settings</p>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-4">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-amber-800">Backend/Mobile Required</p>
          <p className="text-sm text-amber-700 mt-1">
            Parental monitoring features require mobile SDK integration. This UI enables the backend feature flag only.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#F1F5F9] bg-[#F8FAFC]/50 flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-[#2137D6]" />
          <h2 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider">Parental Monitoring</h2>
        </div>
        <div className="p-6">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2137D6]"></div>
            <span className="ml-3 text-sm font-bold text-[#1E293B]">Enable Parental Monitoring</span>
          </label>
          <p className="text-xs text-[#64748B] mt-3">
            When enabled, parents can monitor their children&apos;s:
          </p>
          <ul className="mt-3 space-y-2">
            {['Lesson progress and completion', 'Exam scores and results', 'Attendance records', 'Overall platform activity'].map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-[#475569]">
                <span className="w-1.5 h-1.5 bg-[#2137D6] rounded-full" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="px-8 py-3 bg-[#2137D6] hover:bg-[#1a2bb3] text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-200 disabled:opacity-70 flex items-center gap-2"
        >
          {isSaving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save
        </button>
      </div>
    </div>
  );
}

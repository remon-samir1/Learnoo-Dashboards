'use client';

import React, { useState } from 'react';
import { ArrowLeft, Save, Palette, Check } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

const THEME_PRESETS = [
  { id: 'default', name: 'Default', primary: '#2137D6', bg: '#FFFFFF' },
  { id: 'dark', name: 'Dark', primary: '#6366F1', bg: '#1E293B' },
  { id: 'green', name: 'Green', primary: '#10B981', bg: '#FFFFFF' },
  { id: 'purple', name: 'Purple', primary: '#8B5CF6', bg: '#FFFFFF' },
  { id: 'orange', name: 'Orange', primary: '#F59E0B', bg: '#FFFFFF' },
  { id: 'rose', name: 'Rose', primary: '#F43F5E', bg: '#FFFFFF' },
];

const ICON_PRESETS = [
  { id: 'default', name: 'Default Icons', preview: '🔵' },
  { id: 'rounded', name: 'Rounded Icons', preview: '🟣' },
  { id: 'outline', name: 'Outline Icons', preview: '⚪' },
];

export default function AppearanceSettingsPage() {
  const [activeTheme, setActiveTheme] = useState('default');
  const [activeIconSet, setActiveIconSet] = useState('default');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await new Promise((r) => setTimeout(r, 500));
      toast.success('Appearance settings saved');
    } catch {
      toast.error('Failed to save');
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
          <h1 className="text-2xl font-bold text-[#1E293B]">App Appearance</h1>
          <p className="text-sm text-[#64748B] mt-0.5">Customize the visual theme and icon set</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#F1F5F9] bg-[#F8FAFC]/50 flex items-center gap-2">
          <Palette className="w-4 h-4 text-[#2137D6]" />
          <h2 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider">Color Theme</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-3 gap-4">
            {THEME_PRESETS.map((theme) => (
              <button
                key={theme.id}
                type="button"
                onClick={() => setActiveTheme(theme.id)}
                className={`relative p-4 rounded-xl border-2 transition-all ${
                  activeTheme === theme.id
                    ? 'border-[#2137D6] ring-2 ring-[#2137D6]/20'
                    : 'border-[#E2E8F0] hover:border-[#94A3B8]'
                }`}
              >
                {activeTheme === theme.id && (
                  <div className="absolute -top-2 -right-2 w-5 h-5 bg-[#2137D6] rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full" style={{ backgroundColor: theme.primary }} />
                  <span className="text-xs font-bold text-[#1E293B]">{theme.name}</span>
                </div>
                <div className="h-2 rounded" style={{ backgroundColor: theme.bg, border: '1px solid #E2E8F0' }} />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#F1F5F9] bg-[#F8FAFC]/50 flex items-center gap-2">
          <Palette className="w-4 h-4 text-[#2137D6]" />
          <h2 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider">Icon Set</h2>
        </div>
        <div className="p-6">
          <div className="flex gap-4">
            {ICON_PRESETS.map((iconSet) => (
              <button
                key={iconSet.id}
                type="button"
                onClick={() => setActiveIconSet(iconSet.id)}
                className={`flex-1 flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                  activeIconSet === iconSet.id
                    ? 'border-[#2137D6] bg-[#EEF2FF]'
                    : 'border-[#E2E8F0] hover:border-[#94A3B8]'
                }`}
              >
                <span className="text-2xl">{iconSet.preview}</span>
                <span className="text-sm font-bold text-[#1E293B]">{iconSet.name}</span>
                {activeIconSet === iconSet.id && (
                  <Check className="w-4 h-4 text-[#2137D6] ml-auto" />
                )}
              </button>
            ))}
          </div>
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

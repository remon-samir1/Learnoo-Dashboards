"use client";

import React, { useState } from 'react';
import { ChevronLeft, MessageCircle, Mic, HelpCircle, Video, Info, Lock } from 'lucide-react';
import Link from 'next/link';
import FeatureToggle from '@/components/live-sessions/FeatureToggle';

export default function SessionSettingsPage({ params }: { params: { id: string } }) {
  const [settings, setSettings] = useState({
    chat: true,
    qa: true,
    voice: false,
    recording: true,
    timestampComments: true
  });

  const handleToggle = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href={`/live-sessions/${params.id}`}>
            <button className="p-2 hover:bg-[#F1F5F9] rounded-full transition-colors border border-transparent hover:border-[#E2E8F0]">
              <ChevronLeft className="w-6 h-6 text-[#1E293B]" />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#1E293B]">Session Settings</h1>
            <p className="text-[#64748B] text-[14px]">Configure features for this live session.</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl flex flex-col gap-8">
        {/* Communication Settings */}
        <div className="bg-white border border-[#F1F5F9] rounded-2xl p-8 shadow-sm">
          <h2 className="text-[16px] font-bold text-[#1E293B] mb-6 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-[#2563EB]" />
            Communication
          </h2>
          
          <div className="flex flex-col">
            <FeatureToggle 
              label="Enable Chat" 
              description="Allow real-time text chat during the session"
              enabled={settings.chat}
              onChange={() => handleToggle('chat')}
            />
            <FeatureToggle 
              label="Enable Q&A" 
              description="Allow structured questions and answers"
              enabled={settings.qa}
              onChange={() => handleToggle('qa')}
            />
            <FeatureToggle 
              label="Enable Voice Notes" 
              description="Allow students to send and receive voice messages"
              enabled={settings.voice}
              onChange={() => handleToggle('voice')}
            />
          </div>
        </div>

        {/* Recording & Playback Settings */}
        <div className="bg-white border border-[#F1F5F9] rounded-2xl p-8 shadow-sm">
          <h2 className="text-[16px] font-bold text-[#1E293B] mb-6 flex items-center gap-2">
            <Video className="w-5 h-5 text-[#7C3AED]" />
            Recording & Playback
          </h2>
          
          <div className="flex flex-col">
            <FeatureToggle 
              label="Enable Recording" 
              description="Automatically record and save the session to the library"
              enabled={settings.recording}
              onChange={() => handleToggle('recording')}
            />
            <FeatureToggle 
              label="Comments on Timestamp" 
              description="Allow users to add comments at specific video timestamps"
              enabled={settings.timestampComments}
              onChange={() => handleToggle('timestampComments')}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-4 mt-4">
          <Link href={`/live-sessions/${params.id}`}>
            <button className="px-6 py-2.5 bg-white border border-[#E2E8F0] text-[#64748B] rounded-xl font-bold text-[14px] hover:bg-[#F8FAFC] transition-all">
              Back to Session
            </button>
          </Link>
          <button className="px-6 py-2.5 bg-[#2563EB] text-white rounded-xl font-bold text-[14px] hover:bg-[#1D4ED8] transition-all shadow-md shadow-blue-100">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

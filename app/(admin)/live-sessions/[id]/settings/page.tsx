"use client";

import React, { useState, useEffect, use } from 'react';
import { ChevronLeft, MessageCircle, Video, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import FeatureToggle from '@/components/live-sessions/FeatureToggle';
import { api } from '@/src/lib/api';
import type { LiveRoom } from '@/src/types';

export default function SessionSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [liveRoom, setLiveRoom] = useState<LiveRoom | null>(null);
  const [settings, setSettings] = useState({
    enable_chat: true,
    enable_recording: false
  });

  useEffect(() => {
    const fetchLiveRoom = async () => {
      try {
        const response = await api.liveRooms.get(Number(id));
        setLiveRoom(response.data);
        setSettings({
          enable_chat: response.data.attributes.enable_chat ?? true,
          enable_recording: response.data.attributes.enable_recording ?? false
        });
      } catch (error) {
        console.error('Error fetching live room:', error);
        toast.error('Failed to load session settings');
      } finally {
        setLoading(false);
      }
    };

    fetchLiveRoom();
  }, [id]);

  const handleToggle = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.liveRooms.update(Number(id), {
        enable_chat: settings.enable_chat,
        enable_recording: settings.enable_recording,
      });
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#2563EB]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href={`/live-sessions/${id}`}>
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
              enabled={settings.enable_chat}
              onChange={() => handleToggle('enable_chat')}
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
              enabled={settings.enable_recording}
              onChange={() => handleToggle('enable_recording')}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-4 mt-4">
          <Link href={`/live-sessions/${id}`}>
            <button className="px-6 py-2.5 bg-white border border-[#E2E8F0] text-[#64748B] rounded-xl font-bold text-[14px] hover:bg-[#F8FAFC] transition-all">
              Back to Session
            </button>
          </Link>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-[#2563EB] text-white rounded-xl font-bold text-[14px] hover:bg-[#1D4ED8] transition-all shadow-md shadow-blue-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

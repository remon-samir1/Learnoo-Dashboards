"use client";

import React from 'react';
import { Video, MoreVertical, MessageCircle, HelpCircle, Mic, MicOff, Play, Square, Settings as SettingsIcon, Info } from 'lucide-react';

interface LiveSessionCardProps {
  status: 'LIVE' | 'UPCOMING' | 'ENDED';
  title: string;
  course: string;
  instructor: string;
  time: string;
  duration: string;
  features: {
    chat: boolean;
    qa: boolean;
    voice: boolean;
  };
  onStart?: () => void;
  onEnd?: () => void;
  onDetails?: () => void;
  onSettings?: () => void;
}

export default function LiveSessionCard({
  status,
  title,
  course,
  instructor,
  time,
  duration,
  features,
  onStart,
  onEnd,
  onDetails,
  onSettings
}: LiveSessionCardProps) {
  const isLive = status === 'LIVE';
  const isUpcoming = status === 'UPCOMING';
  const isEnded = status === 'ENDED';

  return (
    <div className="bg-white border border-[#F1F5F9] rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center gap-6 shadow-sm hover:shadow-md transition-all">
      {/* Session Icon */}
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${isLive ? 'bg-[#FEF1F1]' : 'bg-[#F4F5FD]'}`}>
        <Video className={`w-8 h-8 ${isLive ? 'text-[#EF4444]' : 'text-[#2563EB]'}`} />
      </div>

      {/* Session Info */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${
            isLive ? 'bg-[#EF4444] text-white' : 
            isUpcoming ? 'bg-[#DBEAFE] text-[#2563EB]' : 
            'bg-[#F1F5F9] text-[#64748B]'
          }`}>
            {status}
          </span>
          <span className="text-[13px] font-medium text-[#1E293B]">{time}</span>
          <span className="text-[13px] text-[#64748B]">• {duration}</span>
        </div>
        
        <h3 className="text-lg font-bold text-[#1E293B] mb-1 truncate">{title}</h3>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-[#64748B]">
          <span>{course}</span>
          <span className="flex items-center gap-1">
            <span className="w-4 h-0.5 bg-[#E2E8F0]" />
            {instructor}
          </span>
        </div>

        {/* Feature Indicators */}
        <div className="flex flex-wrap items-center gap-4 mt-4">
          <div className="flex items-center gap-1.5 text-[12px] font-medium">
            <MessageCircle className={`w-4 h-4 ${features.chat ? 'text-[#10B981]' : 'text-[#94A3B8]'}`} />
            <span className={features.chat ? 'text-[#1E293B]' : 'text-[#94A3B8]'}>Chat {features.chat ? 'On' : 'Off'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[12px] font-medium">
            <HelpCircle className={`w-4 h-4 ${features.qa ? 'text-[#10B981]' : 'text-[#94A3B8]'}`} />
            <span className={features.qa ? 'text-[#1E293B]' : 'text-[#94A3B8]'}>Q&A {features.qa ? 'On' : 'Off'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[12px] font-medium">
            {features.voice ? (
              <Mic className="w-4 h-4 text-[#10B981]" />
            ) : (
              <MicOff className="w-4 h-4 text-[#94A3B8]" />
            )}
            <span className={features.voice ? 'text-[#1E293B]' : 'text-[#94A3B8]'}>Voice {features.voice ? 'On' : 'Off'}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-2 w-full md:w-[140px]">
        {isLive && (
          <button 
            onClick={onEnd}
            className="w-full py-2 bg-[#EF4444] text-white rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 hover:bg-[#DC2626] transition-colors"
          >
            <Square className="w-4 h-4 fill-current" />
            End
          </button>
        )}
        {isUpcoming && (
          <button 
            onClick={onStart}
            className="w-full py-2 bg-[#2563EB] text-white rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 hover:bg-[#1D4ED8] transition-colors"
          >
            <Play className="w-4 h-4 fill-current" />
            Start
          </button>
        )}
        {(isUpcoming || isLive || isEnded) && (
          <button 
            onClick={onDetails}
            className="w-full py-2 bg-white border border-[#E2E8F0] text-[#1E293B] rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 hover:bg-[#F8FAFC] transition-colors"
          >
            <Info className="w-4 h-4" />
            Details
          </button>
        )}
        <button 
          onClick={onSettings}
          className="w-full py-2 bg-white border border-[#E2E8F0] text-[#1E293B] rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 hover:bg-[#F8FAFC] transition-colors"
        >
          <SettingsIcon className="w-4 h-4" />
          Settings
        </button>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from 'react';
import { ChevronLeft, Calendar as CalendarIcon, Clock, Users, MapPin, User, Info } from 'lucide-react';
import Link from 'next/link';
import FeatureToggle from '@/components/live-sessions/FeatureToggle';

export default function ScheduleSessionPage() {
  const [features, setFeatures] = useState({
    chat: true,
    qa: true,
    voice: false,
    recording: true
  });

  const handleToggle = (key: keyof typeof features) => {
    setFeatures(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/live-sessions">
          <button className="p-2 hover:bg-[#F1F5F9] rounded-full transition-colors border border-transparent hover:border-[#E2E8F0]">
            <ChevronLeft className="w-6 h-6 text-[#1E293B]" />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">Schedule Live Session</h1>
          <p className="text-[#64748B] text-[14px]">Create and configure a new live streaming session.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          {/* Session Details Card */}
          <div className="bg-white border border-[#F1F5F9] rounded-2xl p-8 shadow-sm">
            <h2 className="text-[16px] font-bold text-[#1E293B] mb-6 flex items-center gap-2">
              Session Details
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Session Title */}
              <div className="md:col-span-2 flex flex-col gap-2">
                <label className="text-[13px] font-bold text-[#1E293B]">Session Title</label>
                <input 
                  type="text" 
                  placeholder="e.g., Physics 101: Q&A Session"
                  className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none transition-all text-[14px]"
                />
              </div>

              {/* Course */}
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-[#1E293B]">Course</label>
                <div className="relative">
                  <select className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none appearance-none transition-all text-[14px] bg-white">
                    <option>Select Course</option>
                    <option>Physics 101: Mechanics</option>
                    <option>Advanced Mathematics</option>
                  </select>
                  <ChevronLeft className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 -rotate-90 text-[#64748B] pointer-events-none" />
                </div>
              </div>

              {/* Center */}
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-[#1E293B]">Center</label>
                <div className="relative">
                  <select className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none appearance-none transition-all text-[14px] bg-white">
                    <option>Select Center</option>
                    <option>Dokki Center</option>
                    <option>Nasr City Center</option>
                  </select>
                  <ChevronLeft className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 -rotate-90 text-[#64748B] pointer-events-none" />
                </div>
              </div>

              {/* Instructor */}
              <div className="md:col-span-2 flex flex-col gap-2">
                <label className="text-[13px] font-bold text-[#1E293B]">Instructor</label>
                <div className="relative">
                  <select className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none appearance-none transition-all text-[14px] bg-white">
                    <option>Select Instructor</option>
                    <option>Dr. Ahmed Hassan</option>
                    <option>Prof. Mahmoud Ali</option>
                  </select>
                  <ChevronLeft className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 -rotate-90 text-[#64748B] pointer-events-none" />
                </div>
              </div>

              {/* Date */}
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-[#1E293B]">Date</label>
                <div className="relative">
                  <input 
                    type="date" 
                    className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none transition-all text-[14px]"
                  />
                </div>
              </div>

              {/* Time */}
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-[#1E293B]">Time</label>
                <div className="relative">
                  <input 
                    type="time" 
                    className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none transition-all text-[14px]"
                  />
                </div>
              </div>

              {/* Duration */}
              <div className="md:col-span-2 flex flex-col gap-2">
                <label className="text-[13px] font-bold text-[#1E293B]">Duration (minutes)</label>
                <input 
                  type="number" 
                  defaultValue={60}
                  step={15}
                  className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none transition-all text-[14px]"
                />
              </div>
            </div>
          </div>

          {/* Session Features Card */}
          <div className="bg-white border border-[#F1F5F9] rounded-2xl p-8 shadow-sm">
            <h2 className="text-[16px] font-bold text-[#1E293B] mb-6 flex items-center gap-2">
              Session Features
            </h2>
            
            <div className="flex flex-col">
              <FeatureToggle 
                label="Enable Chat" 
                description="Allow real-time text chat during the session"
                enabled={features.chat}
                onChange={() => handleToggle('chat')}
              />
              <FeatureToggle 
                label="Enable Q&A" 
                description="Allow structured questions during the session"
                enabled={features.qa}
                onChange={() => handleToggle('qa')}
              />
              <FeatureToggle 
                label="Enable Voice Notes" 
                description="Allow students to send voice messages"
                enabled={features.voice}
                onChange={() => handleToggle('voice')}
              />
              <FeatureToggle 
                label="Enable Recording" 
                description="Automatically record the session for later viewing"
                enabled={features.recording}
                onChange={() => handleToggle('recording')}
              />
            </div>
          </div>
        </div>

        {/* Form Summary & Actions */}
        <div className="flex flex-col gap-6">
          <div className="bg-[#F8FAFF] border border-[#E0E7FF] rounded-2xl p-6 flex flex-col gap-4">
             <div className="flex items-center gap-3 text-[#2563EB] mb-2">
                <Info className="w-5 h-5" />
                <span className="font-bold text-[14px]">Quick Help</span>
             </div>
             <p className="text-[12.5px] text-[#475569] leading-relaxed">
               Make sure all details are correct. All session settings can be adjusted later through the session settings page.
             </p>
             <ul className="text-[12.5px] text-[#475569] flex flex-col gap-2 mt-2">
                <li className="flex items-center gap-2">• Students will be notified</li>
                <li className="flex items-center gap-2">• Session links generated automatically</li>
                <li className="flex items-center gap-2">• Recording available post-session</li>
             </ul>
          </div>

          <div className="flex flex-col gap-3">
             <button className="w-full py-3.5 bg-[#2563EB] text-white rounded-xl font-bold text-[14px] hover:bg-[#1D4ED8] transition-all shadow-lg shadow-blue-100">
               Schedule Session
             </button>
             <Link href="/live-sessions">
               <button className="w-full py-3.5 bg-white border border-[#E2E8F0] text-[#64748B] rounded-xl font-bold text-[14px] hover:bg-[#F8FAFC] transition-all text-center">
                 Cancel
               </button>
             </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

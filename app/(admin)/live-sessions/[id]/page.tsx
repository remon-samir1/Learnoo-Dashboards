"use client";

import React from 'react';
import { ChevronLeft, Users, MessageCircle, Mic, HelpCircle, Activity, Settings as SettingsIcon, Clock, MapPin, User, Calendar as CalendarIcon, CheckCircle2, XCircle, Video } from 'lucide-react';
import Link from 'next/link';
import StatCard from '@/components/StatCard';

const mockAttendees = [
  { id: '1', name: 'Ahmed Ali', time: '14:02', avatar: 'AA' },
  { id: '2', name: 'Fatima Mohamed', time: '14:00', avatar: 'FM' },
  { id: '3', name: 'Mohamed Hassan', time: '14:05', avatar: 'MH' },
  { id: '4', name: 'Sara Ibrahim', time: '14:01', avatar: 'SI' }
];

export default function SessionDetailsPage({ params }: { params: { id: string } }) {
  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/live-sessions">
            <button className="p-2 hover:bg-[#F1F5F9] rounded-full transition-colors border border-transparent hover:border-[#E2E8F0]">
              <ChevronLeft className="w-6 h-6 text-[#1E293B]" />
            </button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-[#1E293B]">Physics 101: Q&A Session</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-[#DBEAFE] text-[#2563EB] text-[10px] font-bold tracking-wider uppercase">
                UPCOMING
              </span>
            </div>
            <div className="flex items-center gap-4 mt-1 text-[13px] text-[#64748B]">
              <span>Physics 101: Mechanics</span>
              <span>•</span>
              <span>Dr. Ahmed Hassan</span>
            </div>
          </div>
        </div>
        <Link href={`/live-sessions/${params.id}/settings`}>
          <button className="bg-white border border-[#E2E8F0] text-[#1E293B] px-4 py-2.5 rounded-xl font-bold text-[14px] flex items-center gap-2 hover:bg-[#F8FAFC] transition-all">
            <SettingsIcon className="w-4 h-4" />
            Settings
          </button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Attendees"
          value="4"
          icon={<Users className="w-6 h-6" />}
          iconColor="text-[#2563EB]"
        />
        <StatCard
          label="Questions"
          value="12"
          icon={<HelpCircle className="w-6 h-6" />}
          iconColor="text-[#7C3AED]"
        />
        <StatCard
          label="Voice Notes"
          value="3"
          icon={<Mic className="w-6 h-6" />}
          iconColor="text-[#EA580C]"
        />
        <StatCard
          label="Interactions"
          value="87"
          icon={<Activity className="w-6 h-6" />}
          iconColor="text-[#10B981]"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Info and Features */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          {/* Session Info Card */}
          <div className="bg-white border border-[#F1F5F9] rounded-2xl p-8 shadow-sm">
            <h2 className="text-[16px] font-bold text-[#1E293B] mb-6 flex items-center gap-2">
              <Video className="w-5 h-5 text-[#2563EB]" />
              Session Info
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8">
              <div className="flex flex-col gap-1">
                <span className="text-[12px] font-bold text-[#94A3B8] uppercase">Course</span>
                <span className="text-[14px] font-bold text-[#1E293B]">Physics 101: Mechanics</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[12px] font-bold text-[#94A3B8] uppercase">Instructor</span>
                <span className="text-[14px] font-bold text-[#1E293B]">Dr. Ahmed Hassan</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[12px] font-bold text-[#94A3B8] uppercase">Center</span>
                <span className="text-[14px] font-bold text-[#1E293B]">Main Center, Dokki</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[12px] font-bold text-[#94A3B8] uppercase">Date & Time</span>
                <span className="text-[14px] font-bold text-[#1E293B]">Oct 28, 2024 at 14:00</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[12px] font-bold text-[#94A3B8] uppercase">Duration</span>
                <span className="text-[14px] font-bold text-[#1E293B]">60 min</span>
              </div>
            </div>
          </div>

          {/* Features Card */}
          <div className="bg-white border border-[#F1F5F9] rounded-2xl p-8 shadow-sm">
            <h2 className="text-[16px] font-bold text-[#1E293B] mb-6 flex items-center gap-2">
              Features
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 bg-[#F0FDF4] rounded-xl border border-[#DCFCE7]">
                 <div className="flex items-center gap-3">
                   <div className="w-2 h-2 bg-[#10B981] rounded-full" />
                   <span className="text-[13px] font-bold text-[#166534]">Chat Enabled</span>
                 </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-[#F0FDF4] rounded-xl border border-[#DCFCE7]">
                 <div className="flex items-center gap-3">
                   <div className="w-2 h-2 bg-[#10B981] rounded-full" />
                   <span className="text-[13px] font-bold text-[#166534]">Q&A Enabled</span>
                 </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-[#F8FAFC] rounded-xl border border-[#F1F5F9] opacity-50">
                 <div className="flex items-center gap-3">
                   <div className="w-2 h-2 bg-[#94A3B8] rounded-full" />
                   <span className="text-[13px] font-bold text-[#64748B]">Voice Notes Disabled</span>
                 </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-[#F0FDF4] rounded-xl border border-[#DCFCE7]">
                 <div className="flex items-center gap-3">
                   <div className="w-2 h-2 bg-[#10B981] rounded-full" />
                   <span className="text-[13px] font-bold text-[#166534]">Recording Enabled</span>
                 </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Attendees */}
        <div className="bg-white border border-[#F1F5F9] rounded-2xl p-8 shadow-sm h-fit">
          <h2 className="text-[16px] font-bold text-[#1E293B] mb-6 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#2563EB]" />
            Attendees
          </h2>
          
          <div className="flex flex-col gap-4">
            {mockAttendees.map((attendee) => (
              <div key={attendee.id} className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-xl border border-[#F1F5F9]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#DBEAFE] text-[#2563EB] rounded-lg flex items-center justify-center text-[11px] font-bold">
                    {attendee.avatar}
                  </div>
                  <span className="text-[13px] font-bold text-[#1E293B]">{attendee.name}</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-[#64748B]">
                  <Clock className="w-3 h-3" />
                  {attendee.time}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

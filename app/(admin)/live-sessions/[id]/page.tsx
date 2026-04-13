"use client";

import React, { useState, useEffect, use } from 'react';
import { ChevronLeft, Users, Settings as SettingsIcon, Clock, Video, Loader2, Disc, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import StatCard from '@/components/StatCard';
import { api } from '@/src/lib/api';
import { toast } from 'react-hot-toast';
import type { LiveRoom } from '@/src/types';


function getSessionStatus(room: LiveRoom): 'LIVE' | 'UPCOMING' | 'ENDED' {
  // Use API status if available
  const apiStatus = room.attributes.status;
  if (apiStatus === 'live') return 'LIVE';
  if (apiStatus === 'ended') return 'ENDED';
  if (apiStatus === 'pending') return 'UPCOMING';
  
  // Fallback to calculation if no API status
  const now = new Date();
  const startTime = new Date(room.attributes.started_at);
  const endTime = room.attributes.ended_at ? new Date(room.attributes.ended_at) : null;

  if (endTime && now >= startTime && now <= endTime) {
    return 'LIVE';
  } else if (now < startTime) {
    return 'UPCOMING';
  } else {
    return 'ENDED';
  }
}

function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric',
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: false 
  });
}

function getCourseTitle(room: LiveRoom): string {
  // First check if course is in attributes (list endpoint format)
  if (room.attributes.course?.data?.attributes?.title) {
    return room.attributes.course.data.attributes.title;
  }
  // Then check if course is in relationships with included data
  if (room.relationships?.course?.data && room.included) {
    const courseId = room.relationships.course.data.id;
    const course = room.included.find(item => item.id === courseId && item.type === 'courses');
    if (course?.attributes?.title) {
      return String(course.attributes.title);
    }
  }
  return 'No Course';
}

function getInstructorName(room: LiveRoom): string {
  // First check if user is in attributes (list endpoint format)
  if (room.attributes.user?.data?.attributes?.full_name) {
    return room.attributes.user.data.attributes.full_name;
  }
  // Then check if user is in relationships with included data
  if (room.relationships?.user?.data && room.included) {
    const userId = room.relationships.user.data.id;
    const user = room.included.find(item => item.id === userId && item.type === 'users');
    if (user?.attributes?.full_name) {
      return String(user.attributes.full_name);
    }
    if (user?.attributes?.first_name || user?.attributes?.last_name) {
      return `${user.attributes.first_name || ''} ${user.attributes.last_name || ''}`.trim();
    }
  }
  return 'Unknown';
}

export default function SessionDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [loading, setLoading] = useState(true);
  const [liveRoom, setLiveRoom] = useState<LiveRoom | null>(null);

  useEffect(() => {
    const fetchLiveRoom = async () => {
      try {
        const response = await api.liveRooms.get(Number(id));
        setLiveRoom(response.data);
      } catch (error) {
        console.error('Error fetching live room:', error);
        toast.error('Failed to load session details');
      } finally {
        setLoading(false);
      }
    };

    fetchLiveRoom();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#2563EB]" />
      </div>
    );
  }

  if (!liveRoom) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-[#64748B]">Session not found</p>
        <Link href="/live-sessions">
          <button className="px-4 py-2 bg-[#2563EB] text-white rounded-xl text-sm font-bold">
            Back to Sessions
          </button>
        </Link>
      </div>
    );
  }

  const attrs = liveRoom.attributes;
  const status = getSessionStatus(liveRoom);

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
              <h1 className="text-2xl font-bold text-[#1E293B]">{attrs.title}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${
                status === 'LIVE' ? 'bg-[#EF4444] text-white' :
                status === 'UPCOMING' ? 'bg-[#DBEAFE] text-[#2563EB]' :
                'bg-[#F1F5F9] text-[#64748B]'
              }`}>
                {status}
              </span>
            </div>
            <div className="flex items-center gap-4 mt-1 text-[13px] text-[#64748B]">
              <span>{formatDateTime(attrs.started_at)}</span>
            </div>
          </div>
        </div>
        <Link href={`/live-sessions/${id}/settings`}>
          <button className="bg-white border border-[#E2E8F0] text-[#1E293B] px-4 py-2.5 rounded-xl font-bold text-[14px] flex items-center gap-2 hover:bg-[#F8FAFC] transition-all">
            <SettingsIcon className="w-4 h-4" />
            Settings
          </button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
        <StatCard
          label="Max Students"
          value={String(attrs.max_students)}
          icon={<Users className="w-6 h-6" />}
          iconColor="text-[#7C3AED]"
        />
        <StatCard
          label="Max Join Time"
          value={attrs.max_join_time ? `${attrs.max_join_time}m` : 'Anytime'}
          icon={<Clock className="w-6 h-6" />}
          iconColor="text-[#EA580C]"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-8 max-w-4xl">
        {/* Info and Features */}
        <div className="flex flex-col gap-8">
          {/* Session Info Card */}
          <div className="bg-white border border-[#F1F5F9] rounded-2xl p-8 shadow-sm">
            <h2 className="text-[16px] font-bold text-[#1E293B] mb-6 flex items-center gap-2">
              <Video className="w-5 h-5 text-[#2563EB]" />
              Session Info
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8">
              <div className="flex flex-col gap-1">
                <span className="text-[12px] font-bold text-[#94A3B8] uppercase">Title</span>
                <span className="text-[14px] font-bold text-[#1E293B]">{attrs.title}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[12px] font-bold text-[#94A3B8] uppercase">Course</span>
                <span className="text-[14px] font-bold text-[#1E293B]">{getCourseTitle(liveRoom)}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[12px] font-bold text-[#94A3B8] uppercase">Instructor</span>
                <span className="text-[14px] font-bold text-[#1E293B]">{getInstructorName(liveRoom)}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[12px] font-bold text-[#94A3B8] uppercase">Description</span>
                <span className="text-[14px] font-bold text-[#1E293B]">{attrs.description || '-'}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[12px] font-bold text-[#94A3B8] uppercase">Start Time</span>
                <span className="text-[14px] font-bold text-[#1E293B]">{formatDateTime(attrs.started_at)}</span>
              </div>
              {attrs.ended_at && (
                <div className="flex flex-col gap-1">
                  <span className="text-[12px] font-bold text-[#94A3B8] uppercase">End Time</span>
                  <span className="text-[14px] font-bold text-[#1E293B]">{formatDateTime(attrs.ended_at)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Features Card */}
          <div className="bg-white border border-[#F1F5F9] rounded-2xl p-8 shadow-sm">
            <h2 className="text-[16px] font-bold text-[#1E293B] mb-6 flex items-center gap-2">
              Features
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`flex items-center justify-between p-4 rounded-xl border ${
                attrs.enable_chat ? 'bg-[#F0FDF4] border-[#DCFCE7]' : 'bg-[#F8FAFC] border-[#F1F5F9] opacity-50'
              }`}>
                 <div className="flex items-center gap-3">
                   <MessageCircle className={`w-4 h-4 ${attrs.enable_chat ? 'text-[#10B981]' : 'text-[#94A3B8]'}`} />
                   <span className={`text-[13px] font-bold ${attrs.enable_chat ? 'text-[#166534]' : 'text-[#64748B]'}`}>
                     Chat {attrs.enable_chat ? 'Enabled' : 'Disabled'}
                   </span>
                 </div>
              </div>
              <div className={`flex items-center justify-between p-4 rounded-xl border ${
                attrs.enable_recording ? 'bg-[#FEF2F2] border-[#FECACA]' : 'bg-[#F8FAFC] border-[#F1F5F9] opacity-50'
              }`}>
                 <div className="flex items-center gap-3">
                   <Disc className={`w-4 h-4 ${attrs.enable_recording ? 'text-[#EF4444]' : 'text-[#94A3B8]'}`} />
                   <span className={`text-[13px] font-bold ${attrs.enable_recording ? 'text-[#991B1B]' : 'text-[#64748B]'}`}>
                     Recording {attrs.enable_recording ? 'Enabled' : 'Disabled'}
                   </span>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

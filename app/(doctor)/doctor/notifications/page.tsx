"use client";

import React, { useState } from 'react';
import { Bell, Search, FileText, CheckCircle2, AlertCircle, MessageCircle, User, Calendar, DollarSign, RefreshCw } from 'lucide-react';

interface Notification {
  id: number;
  title: string;
  subtitle: string;
  time: string;
  avatar: string;
  avatarBg: string;
  isNew: boolean;
  type: 'student' | 'exam' | 'message' | 'system';
  hasAttachment?: boolean;
  quote?: string;
}

const notifications: Notification[] = [
  {
    id: 1,
    title: 'Ahmed K. submitted Exam #3: Advanced Cardiology',
    subtitle: 'Score pending grading. Needs your review.',
    time: '2 mins ago',
    avatar: 'AK',
    avatarBg: 'bg-[#4F46E5]',
    isNew: true,
    type: 'exam',
    hasAttachment: true,
  },
  {
    id: 2,
    title: 'Sara F. joined your course',
    subtitle: 'Cardiology 101: Basics to Advanced',
    time: '15 mins ago',
    avatar: 'SF',
    avatarBg: 'bg-[#10B981]',
    isNew: true,
    type: 'student',
  },
  {
    id: 3,
    title: 'System Maintenance Scheduled',
    subtitle: 'Server maintenance will occur tonight at 2:00 AM UTC.',
    time: '1 hour ago',
    avatar: 'Sys',
    avatarBg: 'bg-[#374151]',
    isNew: true,
    type: 'system',
  },
  {
    id: 4,
    title: 'Mohamed H. sent you a message',
    subtitle: '',
    time: '1 hour ago',
    avatar: 'MH',
    avatarBg: 'bg-[#F59E0B]',
    isNew: false,
    type: 'message',
    quote: '"Dr. Khalid, could you please clarify the reading list for next week?"',
  },
  {
    id: 5,
    title: 'Nour A. completed Lecture 7',
    subtitle: 'Completed 100% of the video material.',
    time: '3 hours ago',
    avatar: 'NA',
    avatarBg: 'bg-[#EC4899]',
    isNew: false,
    type: 'student',
  },
  {
    id: 6,
    title: 'John D. failed Exam #2: Neuroanatomy',
    subtitle: 'Score: 45%. You might want to follow up.',
    time: 'Yesterday',
    avatar: 'JD',
    avatarBg: 'bg-[#4F46E5]',
    isNew: false,
    type: 'exam',
    hasAttachment: true,
  },
  {
    id: 7,
    title: 'Lina M. replied to your announcement',
    subtitle: '',
    time: 'Yesterday',
    avatar: 'LM',
    avatarBg: 'bg-[#F59E0B]',
    isNew: false,
    type: 'message',
    quote: '"Thank you for the update!"',
  },
  {
    id: 8,
    title: 'System Payout Processed',
    subtitle: 'Your monthly payout of $4,500 has been transferred.',
    time: '2 days ago',
    avatar: 'Sys',
    avatarBg: 'bg-[#374151]',
    isNew: false,
    type: 'system',
  },
];

const tabs = [
  { id: 'all', label: 'All' },
  { id: 'student', label: 'Students' },
  { id: 'exam', label: 'Exams' },
  { id: 'message', label: 'Messages' },
  { id: 'system', label: 'System' },
];

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab !== 'all' && n.type !== activeTab) return false;
    if (searchQuery && !n.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const newCount = notifications.filter((n) => n.isNew).length;

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Bell className="w-6 h-6 text-[#4F46E5]" />
            <h1 className="text-2xl font-bold text-[#1E293B]">Notifications</h1>
            {newCount > 0 && (
              <span className="px-2.5 py-0.5 bg-[#FEF2F2] text-[#EF4444] text-xs font-semibold rounded-full">
                {newCount} new
              </span>
            )}
          </div>
          <p className="text-sm text-[#64748B]">
            Stay updated with your students&apos; progress and system alerts.
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E5E7EB] text-[#64748B] text-sm font-medium rounded-lg hover:bg-[#F8FAFC] transition-colors">
          <CheckCircle2 className="w-4 h-4" />
          Mark all as read
        </button>
      </div>

      {/* Tabs and Search */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E7EB]">
          <div className="flex items-center gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-[#4F46E5] text-white'
                    : 'text-[#64748B] hover:bg-[#F1F5F9]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 pl-9 pr-4 py-2 bg-[#F8FAFC] border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:ring-opacity-20 placeholder:text-[#9CA3AF]"
            />
          </div>
        </div>

        {/* Notifications List */}
        <div className="divide-y divide-[#F1F5F9]">
          {filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`flex items-start gap-4 p-4 hover:bg-[#F8FAFC] transition-colors ${
                notification.isNew ? 'bg-[#F8FAFC]' : ''
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-10 h-10 ${notification.avatarBg} rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0`}
              >
                {notification.avatar}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#1E293B]">
                  {notification.title}
                </p>
                {notification.subtitle && (
                  <p className="text-sm text-[#64748B] mt-0.5">{notification.subtitle}</p>
                )}
                {notification.quote && (
                  <p className="text-sm text-[#64748B] mt-1 italic border-l-2 border-[#E5E7EB] pl-3">
                    {notification.quote}
                  </p>
                )}
              </div>

              {/* Right Side */}
              <div className="flex items-center gap-3 shrink-0">
                {notification.hasAttachment && (
                  <div className="w-8 h-8 bg-[#EEF2FF] rounded-full flex items-center justify-center">
                    <FileText className="w-4 h-4 text-[#4F46E5]" />
                  </div>
                )}
                <div className="flex items-center gap-2">
                  {notification.isNew && (
                    <span className="w-2 h-2 bg-[#4F46E5] rounded-full"></span>
                  )}
                  <span className="text-xs text-[#94A3B8] whitespace-nowrap">{notification.time}</span>
                </div>
              </div>
            </div>
          ))}

          {filteredNotifications.length === 0 && (
            <div className="py-12 text-center">
              <Bell className="w-12 h-12 text-[#E5E7EB] mx-auto mb-3" />
              <p className="text-[#64748B]">No notifications found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

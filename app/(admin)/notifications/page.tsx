"use client";

import React, { useState } from 'react';
import { Send, Bell, ChevronDown } from 'lucide-react';

const RECENT_NOTIFICATIONS = [
  {
    id: 1,
    title: 'System Maintenance Notice',
    date: 'Oct 24, 10:00 AM',
    message: 'Platform will be down for 1 hour tonight.',
    target: 'Target: All Students'
  },
  {
    id: 2,
    title: 'System Maintenance Notice',
    date: 'Oct 24, 10:00 AM',
    message: 'Platform will be down for 1 hour tonight.',
    target: 'Target: All Students'
  },
  {
    id: 3,
    title: 'System Maintenance Notice',
    date: 'Oct 24, 10:00 AM',
    message: 'Platform will be down for 1 hour tonight.',
    target: 'Target: All Students'
  }
];

export default function NotificationsPage() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1E293B]">Notifications</h1>
        <p className="text-sm text-[#64748B] mt-0.5">Send push and in-app notifications to students.</p>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compose Notification Panel */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <Send className="w-5 h-5 text-[#2137D6]" />
            <h2 className="text-[17px] font-bold text-[#1E293B]">Compose Notification</h2>
          </div>

          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-[#475569]">Notification Title</label>
              <input 
                type="text" 
                placeholder="e.g., New Course Available!" 
                className="w-full px-4 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all placeholder:text-[#94A3B8]"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-[#475569]">Message</label>
              <textarea 
                rows={5} 
                placeholder="Type your message here..." 
                className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all placeholder:text-[#94A3B8] resize-none"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-[#475569]">Target Audience</label>
              <div className="relative">
                <select className="appearance-none w-full pl-4 pr-10 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#1E293B] focus:outline-none cursor-pointer hover:border-[#CBD5E1] transition-colors">
                  <option>All Students</option>
                  <option>Specific Course</option>
                  <option>Specific Center</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] pointer-events-none" />
              </div>
            </div>

            <button className="w-full mt-2 py-3 font-semibold bg-[#2137D6] hover:bg-[#1a2bb3] text-white rounded-xl text-sm transition-all shadow-lg shadow-blue-200">
              Send Notification
            </button>
          </div>
        </div>

        {/* Recent History Panel */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="w-5 h-5 text-[#2137D6]" />
            <h2 className="text-[17px] font-bold text-[#1E293B]">Recent History</h2>
          </div>

          <div className="flex flex-col gap-4">
            {RECENT_NOTIFICATIONS.map((notif) => (
              <div key={notif.id} className="bg-[#F8FAFC] border border-[#F1F5F9] rounded-xl p-5 flex flex-col gap-2 transition-all hover:bg-[#F1F5F9]/50">
                <div className="flex items-center justify-between">
                  <span className="text-[14px] font-bold text-[#1E293B]">{notif.title}</span>
                  <span className="text-[11px] font-semibold text-[#64748B]">{notif.date}</span>
                </div>
                <p className="text-[13px] text-[#64748B]">{notif.message}</p>
                <div className="mt-1.5">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#EEF2FF] text-[#2137D6] text-[11px] font-bold tracking-wide">
                    {notif.target}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

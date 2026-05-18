"use client";

import React, { useState } from 'react';
import { ArrowLeft, ChevronDown, Send } from 'lucide-react';
import Link from 'next/link';

export default function CreateNotificationPage() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [delivery, setDelivery] = useState('now'); // 'now' | 'later'

  return (
    <div className="flex flex-col gap-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link 
          href="/notifications" 
          className="p-2 bg-white border border-[#E2E8F0] rounded-xl text-[#64748B] hover:text-[#1E293B] hover:bg-[#F8FAFC] transition-all shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">Create Notification</h1>
          <p className="text-sm text-[#64748B] mt-0.5">Compose and send a notification to students</p>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {/* Message Section */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm">
          <h2 className="text-lg font-bold text-[#1E293B] mb-6">Message</h2>

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
              <label className="text-sm font-semibold text-[#475569]">Message Body</label>
              <textarea 
                rows={5} 
                placeholder="Write your notification message..." 
                className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all placeholder:text-[#94A3B8] resize-none"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={500}
              />
              <span className="text-xs font-medium text-[#94A3B8] mt-0.5">
                {message.length}/500 characters
              </span>
            </div>
          </div>
        </div>

        {/* Audience Section */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm">
          <h2 className="text-lg font-bold text-[#1E293B] mb-6">Audience</h2>

          <div className="flex flex-col gap-1.5 max-w-xl">
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
        </div>

        {/* Delivery Section */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm">
          <h2 className="text-lg font-bold text-[#1E293B] mb-6">Delivery</h2>

          <div className="flex items-center gap-8">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className={`w-5 h-5 rounded-full border-[1.5px] flex items-center justify-center transition-all ${delivery === 'now' ? 'border-[#2137D6]' : 'border-[#CBD5E1] group-hover:border-[#94A3B8]'}`}>
                {delivery === 'now' && <div className="w-2.5 h-2.5 rounded-full bg-[#2137D6]" />}
              </div>
              <span className={`text-sm font-semibold ${delivery === 'now' ? 'text-[#1E293B]' : 'text-[#475569]'}`}>
                Send Now
              </span>
              {/* Invisible radio input for accessibility */}
              <input 
                type="radio" 
                name="delivery" 
                value="now" 
                className="sr-only" 
                checked={delivery === 'now'}
                onChange={() => setDelivery('now')}
              />
            </label>

            <label className="flex items-center gap-3 cursor-pointer group">
              <div className={`w-5 h-5 rounded-full border-[1.5px] flex items-center justify-center transition-all ${delivery === 'later' ? 'border-[#2137D6]' : 'border-[#CBD5E1] group-hover:border-[#94A3B8]'}`}>
                {delivery === 'later' && <div className="w-2.5 h-2.5 rounded-full bg-[#2137D6]" />}
              </div>
              <span className={`text-sm font-semibold ${delivery === 'later' ? 'text-[#1E293B]' : 'text-[#475569]'}`}>
                Schedule for Later
              </span>
              <input 
                type="radio" 
                name="delivery" 
                value="later" 
                className="sr-only" 
                checked={delivery === 'later'}
                onChange={() => setDelivery('later')}
              />
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 mt-2">
          <Link 
            href="/notifications"
            className="px-6 py-2.5 bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#475569] rounded-xl text-sm font-bold transition-all shadow-sm"
          >
            Cancel
          </Link>
          <button className="flex items-center gap-2 px-6 py-2.5 bg-[#2137D6] hover:bg-[#1a2bb3] text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-200">
            <Send className="w-4 h-4" />
            Send Now
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from 'react';
import { ArrowLeft, Check, Trash, MessageSquare, Flag } from 'lucide-react';
import Link from 'next/link';

export default function PostDetailsPage() {
  const [reply, setReply] = useState('');

  return (
    <div className="flex flex-col gap-8 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            href="/community" 
            className="p-2 bg-white border border-[#E2E8F0] rounded-xl text-[#64748B] hover:text-[#1E293B] hover:bg-[#F8FAFC] transition-all shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#1E293B]">Post Details</h1>
            <p className="text-[13px] font-semibold text-[#64748B] mt-1">Community moderation view</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-1.5 px-5 py-2.5 bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#1E293B] rounded-xl text-sm font-bold transition-all shadow-sm">
            <Check className="w-[18px] h-[18px]" />
            Approve
          </button>
          <button className="flex items-center gap-1.5 px-5 py-2.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded-xl text-sm font-bold transition-all shadow-sm shadow-red-200">
            <Trash className="w-[18px] h-[18px]" />
            Delete Post
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Main Content (Left) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Post Card */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm">
            <div className="flex items-start gap-5 flex-1">
              <div className="w-12 h-12 rounded-full bg-[#DBEAFE] text-[#2563EB] flex items-center justify-center font-bold text-lg shrink-0">
                A
              </div>
              
              <div className="flex flex-col flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className="text-[16px] font-bold text-[#1E293B]">Ahmed Ali</span>
                  <span className="text-[13px] font-semibold text-[#94A3B8]">2 hours ago</span>
                  <span className="px-3 py-1 rounded-full bg-[#DBEAFE] text-[#2563EB] text-[11px] font-bold tracking-wide">
                    Physics 101
                  </span>
                  <span className="px-3 py-1 rounded-full bg-[#FEE2E2] text-[#EF4444] text-[11px] font-bold tracking-wide">
                    Flagged ( 3 )
                  </span>
                </div>
                
                <p className="text-[15px] leading-relaxed text-[#475569]">
                  I have been struggling with the concept of projectile motion. The way it was explained in the lecture was a bit fast. Can someone help me understand the horizontal and vertical components separately?
                </p>
              </div>
            </div>
          </div>

          {/* Comments Section */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-[#2137D6]" />
              <h2 className="text-lg font-bold text-[#1E293B]">Comments ( 2 )</h2>
            </div>
            
            <div className="flex flex-col gap-4">
              
              {/* Comment 1 */}
              <div className="bg-[#F8FAFC] rounded-2xl p-5 flex items-start gap-4 border border-[#F1F5F9]">
                <div className="w-10 h-10 rounded-full bg-[#E2E8F0] text-[#64748B] flex items-center justify-center font-bold text-sm shrink-0">
                  F
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className="text-[14px] font-bold text-[#1E293B]">Fatima Mohamed</span>
                    <span className="text-[12px] font-semibold text-[#94A3B8]">1 hour ago</span>
                  </div>
                  <p className="text-[14px] leading-relaxed text-[#475569]">
                    I had the same issue! The key is to treat horizontal and vertical as completely independent.
                  </p>
                </div>
              </div>

              {/* Comment 2 (Instructor) */}
              <div className="bg-[#F0F9FF] rounded-2xl p-5 flex items-start gap-4 border border-[#E0F2FE]">
                <div className="w-10 h-10 rounded-full bg-[#1E3A8A] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm shadow-blue-200">
                  D
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className="text-[14px] font-bold text-[#1E293B]">Dr. Ahmed Hassan</span>
                    <span className="px-2 py-0.5 rounded-md bg-[#DBEAFE] text-[#1D4ED8] text-[10px] font-bold uppercase tracking-wide">
                      Instructor
                    </span>
                    <span className="text-[12px] font-semibold text-[#64748B]">45 min ago</span>
                  </div>
                  <p className="text-[14px] leading-relaxed text-[#334155]">
                    Great question! Horizontal velocity is constant (no air resistance), while vertical velocity changes due to gravity. Think of them as two separate 1D problems.
                  </p>
                </div>
              </div>

            </div>

            {/* Admin Reply */}
            <div className="mt-2 flex flex-col gap-3">
              <textarea 
                rows={3} 
                placeholder="Reply as admin..." 
                className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all placeholder:text-[#94A3B8] resize-none"
                value={reply}
                onChange={(e) => setReply(e.target.value)}
              />
              <div className="flex justify-start">
                 <button className="px-6 py-2.5 bg-[#2137D6] hover:bg-[#1a2bb3] text-white rounded-xl text-sm font-bold transition-all shadow-sm shadow-blue-200">
                    Post Reply as Admin
                 </button>
              </div>
            </div>
          </div>

        </div>

        {/* Sidebar (Right) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Moderation History */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <Flag className="w-5 h-5 text-[#EF4444]" />
              <h2 className="text-lg font-bold text-[#1E293B]">Moderation History</h2>
            </div>
            
            <div className="flex flex-col gap-3">
              <div className="bg-[#F8FAFC] border border-[#F1F5F9] rounded-xl p-4 flex flex-col gap-1.5">
                <span className="text-[14px] font-bold text-[#1E293B]">Flagged by student</span>
                <span className="text-[12px] font-medium text-[#64748B]">by Omar Tariq - 2 hours ago</span>
              </div>
              
              <div className="bg-[#F8FAFC] border border-[#F1F5F9] rounded-xl p-4 flex flex-col gap-1.5">
                <span className="text-[14px] font-bold text-[#1E293B]">Flagged by student</span>
                <span className="text-[12px] font-medium text-[#64748B]">by Sara Ibrahim - 1.5 hours ago</span>
              </div>
            </div>
          </div>
          
        </div>

      </div>
    </div>
  );
}

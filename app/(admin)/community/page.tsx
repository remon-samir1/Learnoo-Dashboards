"use client";

import React from 'react';
import Link from 'next/link';
import { ChevronDown, MessageCircle, Send, Globe, Edit2, Trash2, MessageSquare, Pin, Check, Trash } from 'lucide-react';

const COMMUNITY_LINKS = [
  {
    id: 1,
    title: 'Join whatsApp Group',
    type: 'What\'s app',
    status: 'active',
    icon: <MessageCircle className="w-8 h-8 text-[#16A34A]" />,
    typeColor: 'bg-[#DCFCE7] text-[#16A34A]'
  },
  {
    id: 2,
    title: 'Join Telegram Channel',
    type: 'Telegram',
    status: 'active',
    icon: <Send className="w-8 h-8 text-[#2563EB]" />,
    typeColor: 'bg-[#DBEAFE] text-[#2563EB]'
  },
  {
    id: 3,
    title: 'Our Course Website',
    type: 'What\'s app',
    status: 'active',
    icon: <Globe className="w-8 h-8 text-[#EF4444]" />,
    typeColor: 'bg-[#FEE2E2] text-[#EF4444]'
  }
];

const MOCK_POSTS = [
  {
    id: 1,
    userInitial: 'S',
    userName: 'Student Name',
    time: '2 hours ago',
    status: 'Flagged (3)',
    statusColor: 'bg-[#FEE2E2] text-[#EF4444]',
    content: 'This is a reported post that needs moderation review.',
    comments: 12,
    showApprove: true
  },
  {
    id: 2,
    userInitial: 'A',
    userName: 'Ahmed Ali',
    time: '4 hours ago',
    status: 'Approved',
    statusColor: 'bg-[#DCFCE7] text-[#16A34A]',
    content: 'Great lecture today! Really helped me understand the concept.',
    comments: 12,
    showApprove: false
  },
  {
    id: 3,
    userInitial: 'F',
    userName: 'Fatima Mohamed',
    time: '1 day ago',
    status: 'Approved',
    statusColor: 'bg-[#DCFCE7] text-[#16A34A]',
    content: 'Can someone share notes from yesterday\'s class?',
    comments: 12,
    showApprove: false
  }
];

export default function CommunityModerationPage() {
  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">Community Moderation</h1>
          <p className="text-sm text-[#64748B] mt-0.5">Review and moderate student posts and comments.</p>
        </div>
        <div className="relative w-40">
          <select className="appearance-none w-full pl-4 pr-10 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm font-semibold text-[#475569] focus:outline-none cursor-pointer hover:border-[#CBD5E1] transition-colors shadow-sm">
            <option>All Posts</option>
            <option>Flagged</option>
            <option>Approved</option>
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] pointer-events-none" />
        </div>
      </div>

      {/* Community Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {COMMUNITY_LINKS.map((link) => (
          <div key={link.id} className="bg-white rounded-2xl border border-[#E2E8F0] p-6 flex flex-col shadow-sm">
            <div className="flex justify-between items-start mb-6">
              {link.icon}
              <span className="px-2.5 py-0.5 bg-[#DCFCE7] text-[#16A34A] rounded-md text-[11px] font-bold tracking-wide uppercase">
                {link.status}
              </span>
            </div>
            
            <h3 className="text-[15px] font-bold text-[#475569] mb-3">{link.title}</h3>
            
            <div className="mb-5">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold tracking-wide ${link.typeColor}`}>
                {link.type}
              </span>
            </div>

            <div className="mt-auto pt-4 border-t border-[#F1F5F9] flex items-center gap-4">
              <Link href={`/community/edit-link`} className="text-[#94A3B8] hover:text-[#475569] transition-colors">
                <Edit2 className="w-[18px] h-[18px]" />
              </Link>
              <button className="text-[#94A3B8] hover:text-[#EF4444] transition-colors">
                <Trash2 className="w-[18px] h-[18px]" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Posts List */}
      <div className="flex flex-col gap-5 mt-2">
        {MOCK_POSTS.map((post) => (
          <div key={post.id} className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1">
                <div className="w-10 h-10 rounded-full bg-[#F1F5F9] text-[#64748B] flex items-center justify-center font-bold text-[15px] shrink-0">
                  {post.userInitial}
                </div>
                
                <div className="flex flex-col flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-[15px] font-bold text-[#1E293B]">{post.userName}</span>
                    <span className="text-xs font-semibold text-[#94A3B8]">{post.time}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide ${post.statusColor}`}>
                      {post.status}
                    </span>
                  </div>
                  
                  <Link href={`/community/${post.id}`} className="block mt-3 text-[15px] font-medium text-[#475569] hover:text-[#2137D6] transition-colors cursor-pointer">
                    {post.content}
                  </Link>

                  <div className="flex items-center gap-6 mt-5">
                    <button className="flex items-center gap-2 text-[#64748B] hover:text-[#1E293B] transition-colors">
                      <MessageSquare className="w-[18px] h-[18px]" />
                      <span className="text-[13px] font-semibold">{post.comments} Comments</span>
                    </button>
                    <button className="flex items-center gap-2 text-[#64748B] hover:text-[#1E293B] transition-colors">
                      <Pin className="w-[18px] h-[18px]" />
                      <span className="text-[13px] font-semibold">Pin</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 ml-6 pt-1">
                {post.showApprove && (
                  <button className="flex items-center gap-1.5 px-4 py-2 border border-[#E2E8F0] text-[#1E293B] hover:bg-[#F8FAFC] rounded-xl text-sm font-bold transition-all">
                    <Check className="w-4 h-4" />
                    Approve
                  </button>
                )}
                <button className="flex items-center gap-1.5 px-4 py-2 bg-[#E11D48] hover:bg-[#BE123C] text-white rounded-xl text-sm font-bold transition-all shadow-sm shadow-rose-200">
                  <Trash className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

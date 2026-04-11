"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BookOpen,
  FileEdit,
  Video,
  ClipboardList,
  MessageSquare,
  Users,
  StickyNote,
  Library,
  GraduationCap,
  Bell,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

import Logo from '@/components/Logo';

interface DoctorSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const menuItems = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/doctor/dashboard' },
  { name: 'My Courses', icon: BookOpen, path: '/doctor/courses' },
  { name: 'Content Manager', icon: FileEdit, path: '/doctor/content-manager' },
  { name: 'Live Sessions', icon: Video, path: '/doctor/live-sessions' },
  { name: 'Exams', icon: ClipboardList, path: '/doctor/exams' },
  { name: 'Q&A', icon: MessageSquare, path: '/doctor/qa', badge: 3 },
  { name: 'Community', icon: Users, path: '/doctor/community' },
  { name: 'Notes & Summaries', icon: StickyNote, path: '/doctor/notes-summaries' },
  { name: 'Electronic Library', icon: Library, path: '/doctor/electronic-library' },
  { name: 'Students', icon: GraduationCap, path: '/doctor/students' },
  { name: 'Notifications', icon: Bell, path: '/doctor/notifications' },
  { name: 'Profile & Settings', icon: Settings, path: '/doctor/settings' },
];

export default function DoctorSidebar({ isCollapsed, onToggle }: DoctorSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={`bg-[#F9FAFF] flex flex-col h-screen sticky top-0 border-r border-[#E5E7EB] transition-all duration-300 ease-in-out z-50 ${isCollapsed ? 'w-20' : 'w-64'
        }`}
    >
      {/* Brand Logo and Title */}
      <div className={`h-20 flex items-center px-5 gap-3 border-b border-[#F0F2F5] ${isCollapsed ? 'justify-center px-0' : ''}`}>
        <div className="w-10 h-10 bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-200">
          <Logo className="w-8 h-8 text-white" />
        </div>
        {!isCollapsed && (
          <span className="font-bold text-xl text-[#4F46E5] tracking-tight">Learnoo</span>
        )}
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 overflow-y-auto px-4 py-6 scrollbar-hide flex flex-col gap-1">
        {!isCollapsed && (
          <p className="text-[10px] font-bold tracking-[1.5px] text-[#94A3B8] uppercase px-3 mb-4">MAIN MENU</p>
        )}
        <nav className="flex flex-col gap-1.5">
          {menuItems.map((item) => {
            const isActive = pathname === item.path || pathname.startsWith(item.path);
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                href={item.path}
                className={`group flex items-center p-3 rounded-xl transition-all duration-300 relative ${isActive
                  ? isCollapsed
                    ? " text-[#4F46E5]  scale-110 z-10"
                    : "bg-[#4F46E5]/10 text-[#4F46E5] shadow-sm ring-1 ring-[#4F46E5]/20"
                  : "text-[#64748B] hover:bg-white/60 hover:text-[#4F46E5]"
                  } ${isCollapsed ? 'justify-center mx-1.5' : ''}`}
                title={isCollapsed ? item.name : ''}
              >
                {isActive && !isCollapsed && (
                  <div className="absolute left-[-16px] top-1/2 -translate-y-1/2 w-1.5 h-8 bg-[#4F46E5] rounded-r-full shadow-[2px_0px_10px_rgba(79,70,229,0.4)]" />
                )}
                <div className={`shrink-0 ${isCollapsed ? '' : 'mr-3'}`}>
                  <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                </div>
                {!isCollapsed && (
                  <span className={`text-[13px] font-medium ${isActive ? "font-bold" : ""}`}>
                    {item.name}
                  </span>
                )}
                {item.badge && !isCollapsed && (
                  <span className="ml-auto bg-[#EF4444] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
                {isActive && isCollapsed && (
                  <div className="absolute left-[-15px] top-1/2 -translate-y-1/2 w-1.5 h-10 bg-[#4F46E5] rounded-r-full shadow-[2px_0px_12px_rgba(79,70,229,0.5)] animate-in fade-in slide-in-from-left-2 duration-300" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Doctor Profile Section */}
      <div className={`p-4 border-t border-[#F0F2F5] mt-auto ${isCollapsed ? 'items-center' : ''}`}>
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100&h=100&fit=crop&crop=face" 
                alt="Dr. Nada Salah"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <p className="text-[13px] font-bold text-[#1E293B] truncate">Dr. Nada Salah</p>
            </div>
            <button className="ml-auto text-[#64748B] hover:text-[#EF4444] transition-colors p-1.5 rounded-lg hover:bg-[#FEF2F2]">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
        {isCollapsed && (
          <div className="flex flex-col gap-4 items-center">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100&h=100&fit=crop&crop=face" 
                alt="Dr. Nada Salah"
                className="w-full h-full object-cover"
              />
            </div>
            <button className="text-[#64748B] hover:text-[#EF4444] transition-colors p-2.5 rounded-xl hover:bg-[#FEF2F2]">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Sidebar toggle button */}
      <button
        onClick={onToggle}
        className="absolute right-[-14px] top-[100px] w-7 h-7 bg-white rounded-full border border-[#E5E7EB] flex items-center justify-center shadow-md hover:shadow-lg hover:scale-110 active:scale-95 transition-all text-[#4F46E5] z-[60]"
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </aside>
  );
}

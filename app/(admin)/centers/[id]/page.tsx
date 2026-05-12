"use client";

import React from 'react';
import { 
  ArrowLeft,
  Edit2,
  Users,
  Video,
  Library,
  StickyNote,
  BookOpen
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';

export default function CenterDetailsPage() {
  const router = useRouter();
  const params = useParams();
  
  // Mock data for a single center
  const center = {
    id: params.id,
    name: 'Main Center, Dokki',
    status: 'ACTIVE',
    location: 'Giza, Cairo',
    type: 'Physical Center',
    stats: [
      { label: 'Students', value: '4,500', icon: Users, color: 'text-[#4F46E5]', bg: 'bg-indigo-50' },
      { label: 'Live Sessions', value: '24', icon: Video, color: 'text-[#4F46E5]', bg: 'bg-indigo-50' },
      { label: 'Library Items', value: '18', icon: Library, color: 'text-[#4F46E5]', bg: 'bg-indigo-50' },
      { label: 'Notes', value: '340', icon: StickyNote, color: 'text-[#4F46E5]', bg: 'bg-indigo-50' },
    ],
    courses: [
      { id: 'c1', name: 'Physics 101: Mechanics', students: 120, status: 'ACTIVE' },
      { id: 'c2', name: 'Advanced Mathematics', students: 95, status: 'ACTIVE' },
      { id: 'c3', name: 'Organic Chemistry Basics', students: 78, status: 'ACTIVE' },
    ]
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="p-2.5 bg-white border border-[#E5E7EB] rounded-xl text-[#64748B] hover:text-[#1E293B] hover:shadow-md transition-all group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-[#1E293B]">{center.name}</h1>
              <span className="px-2 py-0.5 bg-[#EBFDF5] text-[#10B981] text-[10px] font-bold rounded border border-emerald-100 tracking-wide">
                {center.status}
              </span>
            </div>
            <p className="text-sm text-[#94A3B8] mt-1">
              {center.location} · <span className="text-[#64748B] font-medium">{center.type}</span>
            </p>
          </div>
        </div>
        <Link 
          href={`/centers/edit/${center.id}`}
          className="bg-[#2137D6] hover:bg-[#1a2bb3] text-white px-5 py-2.5 rounded-lg flex items-center gap-2 text-sm font-semibold transition-all shadow-sm shadow-blue-100"
        >
          <Edit2 className="w-4 h-4" />
          Edit Center
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {center.stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white p-6 rounded-3xl border border-[#F1F5F9] shadow-sm flex flex-col items-center justify-center text-center gap-2 hover:shadow-md transition-all group cursor-default">
              <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-1 group-hover:scale-110 transition-transform`}>
                <Icon className="w-6 h-6" />
              </div>
              <span className="text-2xl font-bold text-[#1E293B]">{stat.value}</span>
              <span className="text-[13px] font-medium text-[#64748B]">{stat.label}</span>
            </div>
          );
        })}
      </div>

      {/* Linked Courses Section */}
      <div className="bg-white rounded-3xl border border-[#F1F5F9] shadow-sm overflow-hidden p-8 flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[#4F46E5]" />
          <h2 className="text-lg font-bold text-[#1E293B]">Linked Courses</h2>
        </div>

        <div className="flex flex-col gap-4">
          {center.courses.map((course) => (
            <div 
              key={course.id}
              className="flex items-center justify-between p-5 bg-[#F8FAFC] rounded-2xl border border-[#F1F5F9] hover:border-[#4F46E5]/20 group transition-all"
            >
              <div className="flex flex-col gap-1">
                <span className="text-[15px] font-bold text-[#1E293B]">{course.name}</span>
                <span className="text-[12px] text-[#64748B] font-medium">{course.students} students enrolled</span>
              </div>
              <span className="px-2.5 py-1 bg-[#EBFDF5] text-[#10B981] text-[10px] font-bold rounded-full border border-emerald-50">
                {course.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

"use client";

import React from 'react';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  User, 
  FileText, 
  BookOpen, 
  Calendar, 
  Eye 
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NoteDetailPage() {
  const router = useRouter();

  const note = {
    id: 1,
    title: 'Chapter 1 Summary: Kinematics',
    course: 'Physics 101',
    lecture: 'Introduction to Motion',
    content: "Kinematics is the branch of mechanics that describes the motion of objects without considering the forces that cause the motion. Key concepts include displacement, velocity, acceleration, and the equations of motion.\n\n**Key Equations:**\n- v = u + at\n- s = ut + ½at²\n- v² = u² + 2as\n\nThese equations apply to uniformly accelerated motion in a straight line. Students should practice solving problems involving free fall (g = 9.8 m/s²) and projectile motion.",
    author: 'Dr. Ahmed Hassan',
    type: 'Summary',
    date: '2024-10-20',
    visibility: 'PUBLIC'
  };

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link 
            href="/notes-summaries"
            className="p-2.5 bg-white border border-[#E2E8F0] rounded-xl text-[#64748B] hover:text-[#1E293B] hover:shadow-sm transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#1E293B]">{note.title}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-sm font-semibold text-[#64748B]">{note.course}</span>
              <span className="w-4 h-[1px] bg-[#CBD5E1]"></span>
              <span className="text-sm text-[#94A3B8]">{note.lecture}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link 
            href={`/notes-summaries/${note.id}/edit`}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#E2E8F0] text-[#1E293B] rounded-xl text-sm font-bold hover:bg-[#F8FAFC] transition-all"
          >
            <Edit className="w-4 h-4" />
            Edit
          </Link>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-[#EF4444] hover:bg-[#DC2626] text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-red-200">
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column - Content */}
        <div className="flex-1">
          <section className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm overflow-hidden p-6 h-full">
            <h2 className="text-base font-bold text-[#1E293B] mb-6">Content</h2>
            <div className="prose prose-sm max-w-none text-[#475569] leading-relaxed whitespace-pre-wrap">
              {note.content}
            </div>
          </section>
        </div>

        {/* Right Column - Details */}
        <div className="w-full lg:w-[350px]">
          <section className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm overflow-hidden p-6">
            <h2 className="text-base font-bold text-[#1E293B] mb-6">Details</h2>
            
            <div className="flex flex-col gap-6">
              {/* Author */}
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[#EEF2FF] rounded-xl flex items-center justify-center shrink-0 border border-indigo-50">
                  <User className="w-5 h-5 text-[#4F46E5]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[12px] text-[#64748B]">Author</span>
                  <span className="text-sm font-bold text-[#1E293B]">{note.author}</span>
                </div>
              </div>

              {/* Type */}
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[#F5F3FF] rounded-xl flex items-center justify-center shrink-0 border border-purple-50">
                  <FileText className="w-5 h-5 text-[#8B5CF6]" />
                </div>
                <div className="flex flex-col gap-1 items-start">
                  <span className="text-[12px] text-[#64748B]">Type</span>
                  <span className="inline-flex px-3 py-1 rounded-full text-[10px] font-bold bg-[#EEF2FF] text-[#4F46E5] tracking-wide">
                    {note.type}
                  </span>
                </div>
              </div>

              {/* Course */}
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[#ECFDF5] rounded-xl flex items-center justify-center shrink-0 border border-emerald-50">
                  <BookOpen className="w-5 h-5 text-[#10B981]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[12px] text-[#64748B]">Course</span>
                  <span className="text-sm font-bold text-[#1E293B]">{note.course}</span>
                </div>
              </div>

              {/* Date */}
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[#FFFBEB] rounded-xl flex items-center justify-center shrink-0 border border-amber-50">
                  <Calendar className="w-5 h-5 text-[#F59E0B]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[12px] text-[#64748B]">Date</span>
                  <span className="text-sm font-bold text-[#1E293B]">{note.date}</span>
                </div>
              </div>

              {/* Visibility */}
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[#F1F5F9] rounded-xl flex items-center justify-center shrink-0 border border-slate-100">
                  <Eye className="w-5 h-5 text-[#64748B]" />
                </div>
                <div className="flex flex-col gap-1 items-start">
                  <span className="text-[12px] text-[#64748B]">Visibility</span>
                  <span className="inline-flex px-3 py-1 rounded-full text-[10px] font-bold bg-[#EBFDF5] text-[#10B981] border border-emerald-100 tracking-wide">
                    {note.visibility}
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  ChevronDown, 
  FileText, 
  Eye, 
  Edit2, 
  Pin, 
  Trash2 
} from 'lucide-react';
import Link from 'next/link';

const MOCK_NOTES = [
  {
    id: 1,
    title: 'Chapter 1 Summary: Kinematics',
    date: '2024-10-20',
    type: 'INSTRUCTOR',
    course: 'Physics 101',
    lecture: 'Introduction to Motion',
    author: 'Dr. Ahmed Hassan',
    visibility: 'PUBLIC'
  },
  {
    id: 2,
    title: "Key Points: Newton's Laws",
    date: '2024-10-21',
    type: 'STUDENT',
    course: 'Physics 101',
    lecture: 'First Law of Motion',
    author: 'Ahmed Ali',
    visibility: 'PUBLIC'
  },
  {
    id: 3,
    title: 'Math Chapter 2 Highlights',
    date: '2024-10-20',
    type: 'STUDENT',
    course: 'Advanced Mathematics',
    lecture: 'Derivatives',
    author: 'Fatima Mohamed',
    visibility: 'PRIVATE'
  },
  {
    id: 4,
    title: 'Official Summary: Organic Compounds',
    date: '2024-10-23',
    type: 'INSTRUCTOR',
    course: 'Organic Chemistry',
    lecture: 'Hydrocarbons',
    author: 'Dr. Fatima Sayed',
    visibility: 'PUBLIC'
  },
  {
    id: 5,
    title: 'Quick Notes: Cell Division',
    date: '2024-10-24',
    type: 'STUDENT',
    course: 'Biology',
    lecture: 'Mitosis',
    author: 'Sara Ibrahim',
    visibility: 'PUBLIC'
  }
];

export default function NotesSummariesPage() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">Notes & Summaries</h1>
          <p className="text-sm text-[#64748B] mt-0.5">Manage instructor notes and student-created summaries.</p>
        </div>
        <Link 
          href="/notes-summaries/add"
          className="flex items-center gap-2 px-5 py-2.5 bg-[#2137D6] hover:bg-[#1a2bb3] text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-200"
        >
          <Plus className="w-4 h-4" />
          Add Note
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[300px] relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
          <input 
            type="text" 
            placeholder="Search..." 
            className="w-full pl-11 pr-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all placeholder:text-[#94A3B8]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <select className="appearance-none pl-4 pr-10 py-3 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#475569] font-medium focus:outline-none cursor-pointer hover:border-[#CBD5E1] transition-colors">
              <option>All Types</option>
              <option>Instructor</option>
              <option>Student</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] pointer-events-none" />
          </div>
          <div className="relative">
            <select className="appearance-none pl-4 pr-10 py-3 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#475569] font-medium focus:outline-none cursor-pointer hover:border-[#CBD5E1] transition-colors">
              <option>All Courses</option>
              <option>Physics 101</option>
              <option>Advanced Mathematics</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8FAFC]/50 border-b border-[#F1F5F9]">
                <th className="px-6 py-4 text-[13px] font-semibold text-[#64748B] uppercase tracking-wider">Note Title</th>
                <th className="px-6 py-4 text-[13px] font-semibold text-[#64748B] uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-[13px] font-semibold text-[#64748B] uppercase tracking-wider">Course & Lecture</th>
                <th className="px-6 py-4 text-[13px] font-semibold text-[#64748B] uppercase tracking-wider">Author</th>
                <th className="px-6 py-4 text-[13px] font-semibold text-[#64748B] uppercase tracking-wider text-center">Visibility</th>
                <th className="px-6 py-4 text-[13px] font-semibold text-[#64748B] uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {MOCK_NOTES.map((note) => (
                <tr key={note.id} className="hover:bg-[#F8FAFC]/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-[#EEF2FF] text-[#4F46E5] rounded-xl flex items-center justify-center border border-indigo-50 shadow-sm shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-bold text-[#1E293B] truncate">{note.title}</span>
                        <span className="text-[12px] text-[#94A3B8]">{note.date}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-bold tracking-wide ${
                      note.type === 'INSTRUCTOR' 
                        ? 'bg-[#EEF2FF] text-[#4F46E5] border border-indigo-100' 
                        : 'bg-[#F1F5F9] text-[#64748B] border border-slate-200'
                    }`}>
                      {note.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-[#1E293B]">{note.course}</span>
                      <span className="text-[12px] text-[#64748B] truncate">{note.lecture}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-[#475569]">{note.author}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-bold tracking-wide ${
                      note.visibility === 'PUBLIC' 
                        ? 'bg-[#EBFDF5] text-[#10B981] border border-emerald-100' 
                        : 'bg-[#F1F5F9] text-[#64748B] border border-slate-200'
                    }`}>
                      {note.visibility}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link 
                        href={`/notes-summaries/${note.id}`}
                        className="p-2 text-[#94A3B8] hover:text-[#4F46E5] hover:bg-indigo-50 rounded-lg transition-all"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link 
                        href={`/notes-summaries/${note.id}/edit`}
                        className="p-2 text-[#94A3B8] hover:text-[#4F46E5] hover:bg-indigo-50 rounded-lg transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Link>
                      <button className="p-2 text-[#94A3B8] hover:text-[#4F46E5] hover:bg-indigo-50 rounded-lg transition-all">
                        <Pin className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-[#94A3B8] hover:text-[#EF4444] hover:bg-red-50 rounded-lg transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

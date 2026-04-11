"use client";

import React, { useState } from 'react';
import { 
  Search, 
  Download as DownloadIcon, 
  ChevronLeft, 
  ChevronRight,
  FileText,
  Video,
  FileCode,
  BookOpen
} from 'lucide-react';

interface DownloadRecord {
  id: string;
  studentName: string;
  studentInitials: string;
  studentColor: string;
  fileName: string;
  type: 'PDF' | 'Video' | 'Note' | 'Library';
  course: string;
  center: string;
  date: string;
}

const initialRecords: DownloadRecord[] = [
  {
    id: '1',
    studentName: 'Ahmed Ali',
    studentInitials: 'A',
    studentColor: 'bg-[#EEF2FF] text-[#4F46E5]',
    fileName: 'Physics_Chapter1_Slides.pdf',
    type: 'PDF',
    course: 'Physics 101',
    center: 'Main Center, Dokki',
    date: '2024-10-24 14:30'
  },
  {
    id: '2',
    studentName: 'Fatima Mohamed',
    studentInitials: 'F',
    studentColor: 'bg-[#EEF2FF] text-[#4F46E5]',
    fileName: 'Math_Lecture_Video.mp4',
    type: 'Video',
    course: 'Advanced Mathematics',
    center: 'Nasr City Center',
    date: '2024-10-24 13:15'
  },
  {
    id: '3',
    studentName: 'Mohamed Hassan',
    studentInitials: 'M',
    studentColor: 'bg-[#EEF2FF] text-[#4F46E5]',
    fileName: 'Chemistry_Lab_Manual.pdf',
    type: 'PDF',
    course: 'Organic Chemistry',
    center: 'Alexandria Branch',
    date: '2024-10-24 11:45'
  },
  {
    id: '4',
    studentName: 'Sara Ibrahim',
    studentInitials: 'S',
    studentColor: 'bg-[#EEF2FF] text-[#4F46E5]',
    fileName: 'Biology_Notes_Summary.pdf',
    type: 'Note',
    course: 'Biology',
    center: 'Main Center, Dokki',
    date: '2024-10-24 10:20'
  },
  {
    id: '5',
    studentName: 'Omar Tariq',
    studentInitials: 'O',
    studentColor: 'bg-[#EEF2FF] text-[#4F46E5]',
    fileName: 'Programming_Textbook.pdf',
    type: 'Library',
    course: 'Computer Science',
    center: 'Online Only',
    date: '2024-10-24 09:00'
  },
  {
    id: '6',
    studentName: 'Mona Ibrahim',
    studentInitials: 'M',
    studentColor: 'bg-[#EEF2FF] text-[#4F46E5]',
    fileName: 'English_Literature_Guide.pdf',
    type: 'Library',
    course: 'English',
    center: 'Nasr City Center',
    date: '2024-10-23 16:45'
  }
];

const getTypeBadgeColor = (type: string) => {
  switch (type) {
    case 'PDF':
      return 'bg-[#F1F5F9] text-[#64748B]';
    case 'Video':
      return 'bg-[#EEF2FF] text-[#4F46E5]';
    case 'Note':
      return 'bg-[#F8FAFC] text-[#94A3B8]'; // Adjusted for note
    case 'Library':
      return 'bg-[#ECFDF5] text-[#10B981]';
    default:
      return 'bg-[#F1F5F9] text-[#64748B]';
  }
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'PDF':
      return <FileText className="w-4 h-4 text-[#EF4444]" />;
    case 'Video':
      return <Video className="w-4 h-4 text-[#8B5CF6]" />;
    case 'Note':
      return <FileText className="w-4 h-4 text-[#F59E0B]" />; // Yellow document for Note
    case 'Library':
      return <BookOpen className="w-4 h-4 text-[#10B981]" />;
    default:
      return <FileText className="w-4 h-4 text-[#64748B]" />;
  }
};

export default function DownloadsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  
  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-[#1E293B]">Downloads Management</h1>
          <p className="text-sm text-[#64748B]">Monitor student downloads and resource access.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E5E7EB] text-[#1E293B] text-[13px] font-semibold rounded-xl hover:bg-[#F8FAFC] transition-colors shadow-sm">
          Export Logs
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm overflow-hidden flex flex-col">
        {/* Filter Bar */}
        <div className="p-4 border-b border-[#F1F5F9] flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-[400px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
            <input
              type="text"
              placeholder="Search by student or file..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#F1F5F9] rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5]/30 transition-all placeholder:text-[#94A3B8] shadow-sm"
            />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            <select className="px-3 py-2.5 bg-white border border-[#F1F5F9] rounded-xl text-[13px] text-[#475569] font-medium outline-none focus:ring-2 focus:ring-[#4F46E5]/20 cursor-pointer w-full md:w-[130px] shadow-sm">
              <option>All Types</option>
              <option>PDFs</option>
              <option>Videos</option>
            </select>
            <select className="px-3 py-2.5 bg-white border border-[#F1F5F9] rounded-xl text-[13px] text-[#475569] font-medium outline-none focus:ring-2 focus:ring-[#4F46E5]/20 cursor-pointer w-full md:w-[140px] shadow-sm">
              <option>All Courses</option>
            </select>
            <select className="px-3 py-2.5 bg-white border border-[#F1F5F9] rounded-xl text-[13px] text-[#475569] font-medium outline-none focus:ring-2 focus:ring-[#4F46E5]/20 cursor-pointer w-full md:w-[140px] shadow-sm">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
              <option>This Month</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#F1F5F9] bg-[#F8FAFC]/50">
                <th className="px-6 py-4 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Student</th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">File Name</th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Course</th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Center</th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Date & Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {initialRecords.map((record) => (
                <tr key={record.id} className="hover:bg-[#F8FAFC]/50 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${record.studentColor}`}>
                        {record.studentInitials}
                      </div>
                      <span className="text-[13px] font-bold text-[#1E293B] group-hover:text-[#4F46E5] transition-colors">{record.studentName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                       {getTypeIcon(record.type)}
                      <span className="text-[13px] font-medium text-[#475569]">{record.fileName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 text-[11px] font-bold rounded-lg ${getTypeBadgeColor(record.type)}`}>
                      {record.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-[13px] text-[#64748B]">{record.course}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-[13px] text-[#64748B]">{record.center}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-[13px] text-[#64748B]">{record.date}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-[#F1F5F9] flex items-center justify-between">
          <p className="text-[13px] text-[#64748B] font-medium">
            Showing <span className="font-bold text-[#1E293B]">1</span> to <span className="font-bold text-[#1E293B]">6</span> of <span className="font-bold text-[#1E293B]">6</span> downloads
          </p>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 text-[13px] font-medium text-[#64748B] bg-white border border-[#E5E7EB] rounded-lg hover:bg-[#F8FAFC] transition-colors focus:ring-2 focus:ring-[#4F46E5]/20 outline-none disabled:opacity-50 disabled:cursor-not-allowed">
              Previous
            </button>
            <button className="px-3 py-1.5 text-[13px] font-medium text-[#1E293B] bg-white border border-[#E5E7EB] rounded-lg hover:bg-[#F8FAFC] transition-colors focus:ring-2 focus:ring-[#4F46E5]/20 outline-none disabled:opacity-50 disabled:cursor-not-allowed">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

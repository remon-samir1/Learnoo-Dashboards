"use client";

import React from 'react';
import { 
  ArrowLeft, 
  Download, 
  MoreVertical,
  Search,
  ChevronDown
} from 'lucide-react';
import Link from 'next/link';

interface StudentResult {
  id: string;
  name: string;
  score: number;
  total: number;
  grade: string;
  timeTaken: string;
  date: string;
  avatar: string;
}

const MOCK_RESULTS: StudentResult[] = [
  { id: '1', name: 'Ahmed Ali', score: 87, total: 100, grade: 'A-', timeTaken: '48 min', date: '2024-10-10', avatar: 'A' },
  { id: '2', name: 'Fatima Mohamed', score: 92, total: 100, grade: 'A', timeTaken: '52 min', date: '2024-10-10', avatar: 'F' },
  { id: '3', name: 'Mohamed Hassan', score: 74, total: 100, grade: 'B', timeTaken: '60 min', date: '2024-10-10', avatar: 'M' },
  { id: '4', name: 'Sara Ibrahim', score: 65, total: 100, grade: 'C+', timeTaken: '55 min', date: '2024-10-10', avatar: 'S' },
  { id: '5', name: 'Omar Tariq', score: 88, total: 100, grade: 'A-', timeTaken: '44 min', date: '2024-10-10', avatar: 'O' }
];

const getGradeColor = (grade: string) => {
  if (grade.startsWith('A')) return 'bg-[#E1FCEF] text-[#059669]';
  if (grade.startsWith('B')) return 'bg-[#FEE2E2] text-[#EF4444]'; // Wait, Image shows B as Yellow
  if (grade.startsWith('B')) return 'bg-[#FEF3C7] text-[#D97706]';
  if (grade.startsWith('C')) return 'bg-[#FEF3C7] text-[#D97706]';
  return 'bg-[#F1F5F9] text-[#64748B]';
};

// Correcting based on Image 2:
// A is Green
// A- is light green
// B is Yellow
// C+ is Yellow
const getGradeStyles = (grade: string) => {
  switch (grade) {
    case 'A': return 'bg-[#E1FCEF] text-[#059669]';
    case 'A-': return 'bg-[#E1FCEF] text-[#059669]';
    case 'B': return 'bg-[#FEF3C7] text-[#D97706]';
    case 'C+': return 'bg-[#FEF3C7] text-[#D97706]';
    default: return 'bg-[#F1F5F9] text-[#64748B]';
  }
};

const getProgressBarColor = (score: number) => {
  if (score >= 80) return 'bg-[#10B981]';
  if (score >= 70) return 'bg-[#F59E0B]';
  return 'bg-[#EF4444]';
};

export default function ExamResultsPage({ params }: { params: { id: string } }) {
  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            href="/exams"
            className="p-2.5 bg-white border border-[#E2E8F0] rounded-xl text-[#64748B] hover:text-[#1E293B] hover:shadow-sm transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#1E293B]">Exam Results</h1>
            <p className="text-sm text-[#64748B] mt-0.5">Midterm: Mechanics · Physics 101</p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#E2E8F0] text-[#1E293B] rounded-xl text-sm font-bold hover:bg-[#F8FAFC] transition-all shadow-sm">
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-8 flex flex-col items-center justify-center gap-2 shadow-sm">
          <h3 className="text-4xl font-bold text-[#1E293B]">5</h3>
          <p className="text-sm font-medium text-[#94A3B8]">Students Attempted</p>
        </div>
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-8 flex flex-col items-center justify-center gap-2 shadow-sm">
          <div className="flex items-baseline gap-1">
            <h3 className="text-4xl font-bold text-[#10B981]">81 %</h3>
          </div>
          <p className="text-sm font-medium text-[#94A3B8]">Average Score</p>
        </div>
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-8 flex flex-col items-center justify-center gap-2 shadow-sm">
          <h3 className="text-4xl font-bold text-[#2137D6]">5</h3>
          <p className="text-sm font-medium text-[#94A3B8]">Passed</p>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
              <th className="px-6 py-4 text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider">Student</th>
              <th className="px-6 py-4 text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider">Score</th>
              <th className="px-6 py-4 text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider">Grade</th>
              <th className="px-6 py-4 text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider">Time Taken</th>
              <th className="px-6 py-4 text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider text-right">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {MOCK_RESULTS.map((res) => (
              <tr key={res.id} className="hover:bg-[#F8FAFC] transition-colors">
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-[#EFF6FF] rounded-full flex items-center justify-center text-[#2137D6] font-bold text-xs">
                      {res.avatar}
                    </div>
                    <span className="text-sm font-bold text-[#1E293B]">{res.name}</span>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex flex-col gap-2 min-w-[120px]">
                    <span className="text-sm font-bold text-[#1E293B]">
                      {res.score} / {res.total}
                    </span>
                    <div className="w-full h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${getProgressBarColor(res.score)}`} 
                        style={{ width: `${(res.score / res.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span className={`inline-flex items-center px-3 py-1 transparent rounded-full text-[10px] font-bold ring-1 ring-inset ${getGradeStyles(res.grade)}`}>
                    {res.grade}
                  </span>
                </td>
                <td className="px-6 py-5 text-sm text-[#64748B] font-medium">
                  {res.timeTaken}
                </td>
                <td className="px-6 py-5 text-sm text-[#64748B] font-medium text-right">
                  {res.date}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

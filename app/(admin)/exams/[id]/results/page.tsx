"use client";

import React from 'react';
import { 
  ArrowLeft, 
  Download, 
  MoreVertical,
  Search,
  ChevronDown,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { useQuizAttempts, useQuiz } from '@/src/hooks/useQuizzes';
import { useParams } from 'next/navigation';
import { api } from '@/src/lib/api';

interface StudentResult {
  id: string;
  name: string;
  score: number;
  total: number;
  grade: string;
  timeTaken: string;
  date: string;
  avatar: string;
  attemptCount: number;
}

const calculateGrade = (score: number, total: number): string => {
  const percentage = (score / total) * 100;
  if (percentage >= 90) return 'A';
  if (percentage >= 85) return 'A-';
  if (percentage >= 75) return 'B';
  if (percentage >= 65) return 'C+';
  if (percentage >= 55) return 'C';
  return 'F';
};

const calculateTimeTaken = (startedAt: string, finishedAt: string | null): string => {
  const start = new Date(startedAt);
  const end = finishedAt ? new Date(finishedAt) : new Date();
  const diffMs = end.getTime() - start.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) {
    return '< 1 min';
  }
  
  if (!finishedAt) {
    return `${diffMins} min (in progress)`;
  }
  
  return `${diffMins} min`;
};

const transformAttemptsToResults = (attempts: any[]): StudentResult[] => {
  // Calculate attempt count per user
  const userAttemptCounts = attempts.reduce((acc: Record<string, number>, attempt: any) => {
    const userId = attempt.attributes?.user_id;
    if (userId) {
      acc[userId] = (acc[userId] || 0) + 1;
    }
    return acc;
  }, {});
  
  return attempts.map((attempt: any) => {
    const attrs = attempt.attributes || {};
    const userAttrs = attrs.user?.data?.attributes || {};
    
    const fullName = userAttrs.full_name || 'Unknown';
    const score = attrs.score ?? 0;
    const total = attrs.total_score ?? 100; // Use total_score from API
    const grade = calculateGrade(score, total);
    const timeTaken = calculateTimeTaken(attrs.started_at, attrs.finished_at);
    const date = attrs.finished_at || attrs.started_at;
    const attemptCount = userAttemptCounts[attrs.user_id] || 1;
    
    return {
      id: attempt.id.toString(),
      name: fullName,
      score,
      total,
      grade,
      timeTaken,
      date: date ? new Date(date).toLocaleDateString() : 'N/A',
      avatar: fullName.charAt(0).toUpperCase() || 'U',
      attemptCount
    };
  });
};

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

const exportToCSV = (results: StudentResult[], examId: string) => {
  if (results.length === 0) return;
  
  const headers = ['Student Name', 'Score', 'Total', 'Grade', 'Attempts', 'Time Taken', 'Date'];
  const csvContent = [
    headers.join(','),
    ...results.map(r => [
      `"${r.name}"`,
      r.score,
      r.total,
      r.grade,
      r.attemptCount,
      `"${r.timeTaken}"`,
      r.date
    ].join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `exam-${examId}-results-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export default function ExamResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { data: attempts, isLoading } = useQuizAttempts();
  const { data: quiz } = useQuiz(parseInt(React.use(params).id));
  const resolvedParams = React.use(params);
  const examId = resolvedParams.id;
  const [searchQuery, setSearchQuery] = React.useState('');
  
  // Get passing marks from quiz
  const passingMarks = quiz?.attributes?.passing_marks || 50;
  
  // Filter attempts by quiz_id and transform to results format
  const results = React.useMemo(() => {
    if (!attempts) return [];
    const filteredAttempts = attempts.filter(
      (attempt: any) => attempt.attributes?.quiz_id === parseInt(examId)
    );
    return transformAttemptsToResults(filteredAttempts);
  }, [attempts, examId]);

  // Filter results by search query
  const filteredResults = React.useMemo(() => {
    if (!searchQuery.trim()) return results;
    const query = searchQuery.toLowerCase();
    return results.filter(r => 
      r.name.toLowerCase().includes(query)
    );
  }, [results, searchQuery]);

  // Calculate stats
  const stats = React.useMemo(() => {
    if (results.length === 0) {
      return { attempted: 0, averageScore: 0, passed: 0 };
    }
    const attempted = results.length;
    const totalScore = results.reduce((sum, r) => sum + r.score, 0);
    const averageScore = Math.round((totalScore / attempted));
    const passed = results.filter(r => {
      const percentage = r.total > 0 ? (r.score / r.total) * 100 : 0;
      return percentage >= passingMarks;
    }).length;
    return { attempted, averageScore, passed };
  }, [results, passingMarks]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-[#64748B]" />
      </div>
    );
  }

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
            <p className="text-sm text-[#64748B] mt-0.5">Exam ID: {examId}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
            <input
              type="text"
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:border-transparent w-64"
            />
          </div>
          <button 
            onClick={() => exportToCSV(results, examId)}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#E2E8F0] text-[#1E293B] rounded-xl text-sm font-bold hover:bg-[#F8FAFC] transition-all shadow-sm"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-8 flex flex-col items-center justify-center gap-2 shadow-sm">
          <h3 className="text-4xl font-bold text-[#1E293B]">{stats.attempted}</h3>
          <p className="text-sm font-medium text-[#94A3B8]">Students Attempted</p>
        </div>
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-8 flex flex-col items-center justify-center gap-2 shadow-sm">
          <div className="flex items-baseline gap-1">
            <h3 className="text-4xl font-bold text-[#10B981]">{stats.averageScore} %</h3>
          </div>
          <p className="text-sm font-medium text-[#94A3B8]">Average Score</p>
        </div>
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-8 flex flex-col items-center justify-center gap-2 shadow-sm">
          <h3 className="text-4xl font-bold text-[#2137D6]">{stats.passed}</h3>
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
              <th className="px-6 py-4 text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider">Attempts</th>
              <th className="px-6 py-4 text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider">Time Taken</th>
              <th className="px-6 py-4 text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider text-right">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {filteredResults.length > 0 ? (
              filteredResults.map((res) => (
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
                  <td className="px-6 py-5">
                    <span className="text-sm font-bold text-[#1E293B]">{res.attemptCount}</span>
                  </td>
                  <td className="px-6 py-5 text-sm text-[#64748B] font-medium">
                    {res.timeTaken}
                  </td>
                  <td className="px-6 py-5 text-sm text-[#64748B] font-medium text-right">
                    {res.date}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-[#94A3B8]">
                  {searchQuery.trim() ? 'No results found matching your search.' : 'No exam results found for this exam.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

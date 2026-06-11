'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, Download, Search, Loader2, Eye, Clock, FileText } from 'lucide-react';
import Link from 'next/link';
import { api, getApiErrorMessage } from '@/src/lib/api';
import type { StudentViewData } from '@/src/types';

export default function LectureAnalyticsPage() {
  const params = useParams();
  const lectureId = params.id as string;
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<StudentViewData[]>([]);

  useEffect(() => {
    loadAnalytics();
  }, [lectureId]);

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.lectureAnalytics.list(parseInt(lectureId));
      setData(res.data);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load analytics'));
    } finally {
      setLoading(false);
    }
  };

  const filteredData = data.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleExport = () => {
    const csv = [
      ['Student Name', 'Email', 'View Count', 'Watch Time (min)', 'PDF Opens', 'Last Accessed'],
      ...filteredData.map((s) => [s.name, s.email, s.viewCount, s.watchTimeMinutes, s.pdfOpenCount, s.lastAccessed]),
    ]
      .map((row) => row.join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lecture-${lectureId}-analytics.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/lectures/${lectureId}/edit`}
            className="p-2.5 bg-white border border-[#E2E8F0] rounded-xl text-[#64748B] hover:text-[#1E293B] hover:shadow-sm transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#1E293B]">Student Analytics</h1>
            <p className="text-sm text-[#64748B] mt-0.5">Per-student view tracking for this lecture</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={filteredData.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm font-bold text-[#1E293B] hover:bg-[#F8FAFC] transition-all disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
        <input
          type="text"
          placeholder="Search students..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] transition-all"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="w-8 h-8 animate-spin text-[#2137D6]" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-4">
          <p className="text-[#EF4444]">{error}</p>
          <button
            onClick={loadAnalytics}
            className="px-4 py-2 bg-[#2137D6] text-white rounded-xl text-sm font-bold"
          >
            Retry
          </button>
        </div>
      ) : filteredData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-[#F1F5F9]">
          <Eye className="w-12 h-12 text-[#94A3B8] mb-4" />
          <p className="text-sm font-bold text-[#1E293B]">No analytics data yet</p>
          <p className="text-xs text-[#64748B] mt-1">Student activity will appear once they start viewing this lecture</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#F1F5F9] bg-[#F8FAFC]/50">
                  <th className="text-left px-6 py-4 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Student</th>
                  <th className="text-center px-6 py-4 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                    <div className="flex items-center justify-center gap-1"><Eye className="w-3.5 h-3.5" /> Views</div>
                  </th>
                  <th className="text-center px-6 py-4 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                    <div className="flex items-center justify-center gap-1"><Clock className="w-3.5 h-3.5" /> Watch Time</div>
                  </th>
                  <th className="text-center px-6 py-4 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                    <div className="flex items-center justify-center gap-1"><FileText className="w-3.5 h-3.5" /> PDF Opens</div>
                  </th>
                  <th className="text-right px-6 py-4 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Last Accessed</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((student) => (
                  <tr key={student.id} className="border-b border-[#F1F5F9] hover:bg-[#F8FAFC]/50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-bold text-[#1E293B]">{student.name}</p>
                        <p className="text-xs text-[#64748B]">{student.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-bold text-[#2137D6]">{student.viewCount}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm text-[#475569]">{student.watchTimeMinutes} min</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm text-[#475569]">{student.pdfOpenCount}</span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-[#64748B]">{student.lastAccessed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 border-t border-[#F1F5F9] bg-[#F8FAFC]/50">
            <p className="text-xs text-[#64748B]">{filteredData.length} student{filteredData.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      )}
    </div>
  );
}

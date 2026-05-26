'use client';

import React, { useEffect, useState } from 'react';
import { 
  LifeBuoy, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Trash2,
  Eye,
  Filter,
  ArrowUpDown
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/src/lib/api';

interface Issue {
  id: string | number;
  category: string;
  type: string;
  priority: string | null;
  description: string;
  steps_before_problem_appears: string;
  expected_result: string;
  actual_result: string;
  status: string | null;
  created_at: string;
  attachment?: string;
}

export default function IssuesPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | number | null>(null);

  const fetchIssues = async () => {
    setIsLoading(true);
    try {
      const response = await api.issues.list();
      setIssues(response.data);
    } catch (error) {
      console.error('Failed to fetch issues:', error);
      toast.error('Failed to load issues');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, []);

  const handleView = (issue: Issue) => {
    setSelectedIssue(issue);
    setShowModal(true);
  };

  const handleDelete = async (id: string | number) => {
    if (!window.confirm('Are you sure you want to delete this issue?')) return;
    setDeletingId(id);
    try {
      await api.issues.delete(`${id}`);
      toast.success('Issue deleted successfully');
      setIssues(prev => prev.filter(i => i.id !== id));
    } catch {
      toast.error('Failed to delete issue');
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadge = (status: string | null) => {
    const s = (status || 'opened').toLowerCase();
    type StatusConfig = { bg: string; text: string; icon: typeof Clock };
    const statuses: Record<string, StatusConfig> = {
      opened: { bg: 'bg-blue-50', text: 'text-blue-700', icon: Clock },
      in_progress: { bg: 'bg-amber-50', text: 'text-amber-700', icon: AlertCircle },
      resolved: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: CheckCircle2 },
      closed: { bg: 'bg-slate-50', text: 'text-slate-700', icon: CheckCircle2 },
    };

    const config = statuses[s] || statuses.opened;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${config.bg} ${config.text}`}>
        <Icon className="w-3.5 h-3.5" />
        {s.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const getPriorityBadge = (priority: string | null) => {
    const p = (priority || 'medium').toLowerCase();
    const priorities: Record<string, { bg: string, text: string }> = {
      urgent: { bg: 'bg-red-50', text: 'text-red-700' },
      medium: { bg: 'bg-orange-50', text: 'text-orange-700' },
      low: { bg: 'bg-green-50', text: 'text-green-700' },
    };

    const config = priorities[p] || priorities.medium;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold ${config.bg} ${config.text}`}>
        {p.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">Support Issues</h1>
          <p className="text-[#64748B] text-sm mt-1">Manage and track all reported issues from users.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchIssues}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E5E7EB] rounded-xl text-sm font-medium text-[#1E293B] hover:bg-[#F8FAFC] transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Issues', value: issues.length, color: 'bg-blue-500' },
          { label: 'Opened', value: issues.filter(i => (i.status || 'opened') === 'opened').length, color: 'bg-amber-500' },
          { label: 'Resolved', value: issues.filter(i => i.status === 'resolved').length, color: 'bg-emerald-500' },
          { label: 'Urgent', value: issues.filter(i => i.priority === 'urgent').length, color: 'bg-red-500' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm">
            <p className="text-sm font-medium text-[#64748B]">{stat.label}</p>
            <div className="mt-2 flex items-end justify-between">
              <span className="text-2xl font-bold text-[#1E293B]">{stat.value}</span>
              <div className={`w-2 h-2 rounded-full ${stat.color}`}></div>
            </div>
          </div>
        ))}
      </div>

      {/* Issues Table */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F8FAFC]">
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-[#64748B] hover:text-[#1E293B] transition-colors">
              <Filter className="w-4 h-4" />
              Filter
            </button>
            <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-[#64748B] hover:text-[#1E293B] transition-colors">
              <ArrowUpDown className="w-4 h-4" />
              Sort
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-[#F8FAFC]">
                <th className="px-6 py-4 text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Issue Details</th>
                <th className="px-6 py-4 text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Category & Type</th>
                <th className="px-6 py-4 text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Priority</th>
                <th className="px-6 py-4 text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-[#94A3B8] uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-slate-100 rounded w-3/4"></div></td>
                    <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-slate-100 rounded w-1/2"></div></td>
                    <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-slate-100 rounded w-1/4"></div></td>
                    <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-slate-100 rounded w-1/3"></div></td>
                    <td className="px-6 py-4 whitespace-nowrap text-right"><div className="h-4 bg-slate-100 rounded w-8 ml-auto"></div></td>
                  </tr>
                ))
              ) : issues.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[#64748B]">
                    <div className="flex flex-col items-center gap-2">
                      <LifeBuoy className="w-12 h-12 text-[#E5E7EB]" />
                      <p className="text-lg font-medium">No issues found</p>
                      <p className="text-sm">Great job! All issues have been cleared.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                issues.map((issue) => (
                  <tr key={issue.id} className="hover:bg-[#F8FAFC] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="max-w-xs md:max-w-md">
                        <p className="text-sm font-semibold text-[#1E293B] truncate">
                          {issue.description}
                        </p>
                        <p className="text-xs text-[#64748B] mt-1">
                          Reported on {new Date(issue.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-[#475569]">{issue.category}</span>
                        <span className="text-xs text-[#94A3B8]">{issue.type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getPriorityBadge(issue.priority)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(issue.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          className="p-2 text-[#64748B] hover:text-[#4F46E5] hover:bg-[#4F46E5]/10 rounded-lg transition-all"
                          title="View Details"
                          onClick={() => handleView(issue)}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          className={`p-2 text-[#EF4444] hover:bg-red-50 rounded-lg transition-all ${deletingId === issue.id ? 'opacity-50 pointer-events-none' : ''}`}
                          title="Delete Issue"
                          onClick={() => handleDelete(issue.id)}
                          disabled={deletingId === issue.id}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {!isLoading && issues.length > 0 && (
          <div className="px-6 py-4 bg-[#F8FAFC] border-t border-[#E5E7EB]">
            <p className="text-xs text-[#94A3B8]">
              Showing {issues.length} total issues. All timestamps are in local time.
            </p>
          </div>
        )}
      </div>

      {showModal && selectedIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 relative">
            <button
              className="absolute top-3 right-3 text-[#64748B] hover:text-[#1E293B]"
              onClick={() => setShowModal(false)}
              aria-label="Close"
            >
              ×
            </button>
            <h2 className="text-xl font-bold mb-4 text-[#1E293B]">Issue Details</h2>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              <div>
                <span className="font-semibold text-[#475569]">Description: </span>
                <span className="text-[#1E293B]">{selectedIssue.description}</span>
              </div>
              <div>
                <span className="font-semibold text-[#475569]">Category: </span>
                <span className="text-[#1E293B]">{selectedIssue.category}</span>
              </div>
              <div>
                <span className="font-semibold text-[#475569]">Type: </span>
                <span className="text-[#1E293B]">{selectedIssue.type}</span>
              </div>
              <div>
                <span className="font-semibold text-[#475569]">Priority: </span>
                <div className="mt-1">{getPriorityBadge(selectedIssue.priority)}</div>
              </div>
              <div>
                <span className="font-semibold text-[#475569]">Status: </span>
                <div className="mt-1">{getStatusBadge(selectedIssue.status)}</div>
              </div>
              <div>
                <span className="font-semibold text-[#475569]">Steps Before Problem: </span>
                <span className="text-[#1E293B]">{selectedIssue.steps_before_problem_appears}</span>
              </div>
              <div>
                <span className="font-semibold text-[#475569]">Expected Result: </span>
                <span className="text-[#1E293B]">{selectedIssue.expected_result}</span>
              </div>
              <div>
                <span className="font-semibold text-[#475569]">Actual Result: </span>
                <span className="text-[#1E293B]">{selectedIssue.actual_result}</span>
              </div>
              <div>
                <span className="font-semibold text-[#475569]">Created At: </span>
                <span className="text-[#1E293B]">{new Date(selectedIssue.created_at).toLocaleString()}</span>
              </div>
            {selectedIssue.attachment && (
  <div>
    <span className="font-semibold text-[#475569]">Attachment: </span>
    <div className="mt-2">
      {(() => {
        const url = selectedIssue.attachment;  
        if (url.match(/\.(mp4|webm|ogg)$/i)) {
          return (
            <video
              src={url}
              controls
              className="max-w-full max-h-60 rounded border border-[#E5E7EB]"
            />
          );
        } else if (url.match(/\.(jpg|jpeg|png|gif|bmp|svg|webp)$/i)) {
          return (
    
            <img
              src={url}
              alt="Attachment"
              className="max-w-full max-h-60 rounded border border-[#E5E7EB]"
            />
          );
        } else {

          return (
            <div className="space-y-2">
              <img
                src={url}
                alt="Attachment"
                className="max-w-full max-h-60 rounded border border-[#E5E7EB]"
                onError={(e) => {
              
                  const target = e.currentTarget;
                  target.style.display = 'none';
                  target.nextElementSibling?.removeAttribute('hidden');
                }}
              />
              <a
                hidden
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 underline"
              >
                Download Attachment
              </a>
            </div>
          );
        }
      })()}
    </div>
  </div>
)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

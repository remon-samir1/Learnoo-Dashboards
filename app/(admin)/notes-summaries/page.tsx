'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  ChevronDown, 
  FileText, 
  Eye, 
  Edit2, 
  Pin, 
  Trash2,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { useNotes, useDeleteNote } from '@/src/hooks/useNotes';
import type { Note } from '@/src/types';

function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    'summary': 'Summary',
    'highlight': 'Highlight',
    'key_point': 'Key Point',
    'important_notice': 'Important Notice'
  };
  return labels[type] || type;
}

function getTypeColor(type: string): string {
  const colors: Record<string, string> = {
    'summary': 'bg-[#EEF2FF] text-[#4F46E5] border border-indigo-100',
    'highlight': 'bg-[#FEF3C7] text-[#D97706] border border-amber-100',
    'key_point': 'bg-[#ECFDF5] text-[#10B981] border border-emerald-100',
    'important_notice': 'bg-[#FEE2E2] text-[#EF4444] border border-red-100'
  };
  return colors[type] || 'bg-[#F1F5F9] text-[#64748B] border border-slate-200';
}

function formatDate(dateString: string | null): string {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString();
}

export default function NotesSummariesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All Types');
  
  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: notesResponse, isLoading, error, refetch } = useNotes([]);
  const { mutate: deleteNote, isLoading: isDeleting } = useDeleteNote();

  const notes = notesResponse || [];

  // Filter notes based on search and type
  const filteredNotes = useMemo(() => {
    return notes.filter((note: Note) => {
      const matchesSearch = debouncedSearch === '' || 
        note.attributes.title?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        note.attributes.content?.toLowerCase().includes(debouncedSearch.toLowerCase());
      
      const matchesType = typeFilter === 'All Types' || 
        getTypeLabel(note.attributes.type) === typeFilter;
      
      return matchesSearch && matchesType;
    });
  }, [notes, debouncedSearch, typeFilter]);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    
    try {
      await deleteNote(id);
      await refetch();
    } catch {
      // Error handled by hook
    }
  };

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
            <select 
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="appearance-none pl-4 pr-10 py-3 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#475569] font-medium focus:outline-none cursor-pointer hover:border-[#CBD5E1] transition-colors"
            >
              <option>All Types</option>
              <option>Summary</option>
              <option>Highlight</option>
              <option>Key Point</option>
              <option>Important Notice</option>
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
                <th className="px-6 py-4 text-[13px] font-semibold text-[#64748B] uppercase tracking-wider">Title</th>
                <th className="px-6 py-4 text-[13px] font-semibold text-[#64748B] uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-[13px] font-semibold text-[#64748B] uppercase tracking-wider">Course ID</th>
                <th className="px-6 py-4 text-[13px] font-semibold text-[#64748B] uppercase tracking-wider text-center">Status</th>
                <th className="px-6 py-4 text-[13px] font-semibold text-[#64748B] uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {isLoading && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center">
                      <Loader2 className="w-8 h-8 animate-spin text-[#2137D6]" />
                    </div>
                  </td>
                </tr>
              )}
              
              {!isLoading && error && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[#EF4444]">
                    Failed to load notes. Please try again.
                  </td>
                </tr>
              )}
              
              {!isLoading && !error && filteredNotes.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[#64748B]">
                    No notes found.
                  </td>
                </tr>
              )}
              
              {!isLoading && !error && filteredNotes.map((note: Note) => (
                <tr key={note.id} className="hover:bg-[#F8FAFC]/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-[#EEF2FF] text-[#4F46E5] rounded-xl flex items-center justify-center border border-indigo-50 shadow-sm shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-bold text-[#1E293B] truncate">
                          {note.attributes.title || 'Untitled Note'}
                        </span>
                        <span className="text-[12px] text-[#94A3B8]">
                          {formatDate(note.attributes.created_at)}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-bold tracking-wide ${getTypeColor(note.attributes.type)}`}>
                      {getTypeLabel(note.attributes.type)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-[#1E293B]">{note.attributes.course_id || 'N/A'}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-bold tracking-wide ${
                      note.attributes.is_publish 
                        ? 'bg-[#EBFDF5] text-[#10B981] border border-emerald-100' 
                        : 'bg-[#F1F5F9] text-[#64748B] border border-slate-200'
                    }`}>
                      {note.attributes.is_publish ? 'Published' : 'Draft'}
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
                      <button 
                        onClick={() => handleDelete(parseInt(note.id))}
                        disabled={isDeleting}
                        className="p-2 text-[#94A3B8] hover:text-[#EF4444] hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                      >
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

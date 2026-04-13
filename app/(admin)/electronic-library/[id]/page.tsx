'use client';

import React from 'react';
import { ArrowLeft, Edit, Trash2, BookOpen, DollarSign, Calendar, Eye, Lock } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';
import { useLibrary, useDeleteLibrary } from '@/src/hooks/useLibraries';
import { Loader2 } from 'lucide-react';

function formatDate(dateString: string | null): string {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString();
}

function getMaterialTypeColor(type: string): string {
  const colors: Record<string, string> = {
    'booklet': 'bg-[#EEF2FF] text-[#4F46E5] border border-indigo-100',
    'reference': 'bg-[#FEF3C7] text-[#D97706] border border-amber-100',
    'guide': 'bg-[#ECFDF5] text-[#10B981] border border-emerald-100'
  };
  return colors[type] || 'bg-[#F1F5F9] text-[#64748B] border border-slate-200';
}

export default function LibraryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const libraryId = parseInt(params.id as string);

  const { data: library, isLoading, error } = useLibrary(libraryId);
  const { mutate: deleteLibrary, isLoading: isDeleting } = useDeleteLibrary();

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this library item?')) return;
    try {
      await deleteLibrary(libraryId);
      router.push('/electronic-library');
    } catch {
      // Error handled by hook
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#2137D6]" />
      </div>
    );
  }

  if (error || !library) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-[#EF4444]">Failed to load library item. Please try again.</p>
        <Link 
          href="/electronic-library"
          className="flex items-center gap-2 px-4 py-2 bg-[#2137D6] text-white rounded-xl text-sm font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Library
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link 
            href="/electronic-library"
            className="p-2.5 bg-white border border-[#E2E8F0] rounded-xl text-[#64748B] hover:text-[#1E293B] hover:shadow-sm transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#1E293B]">{library.attributes.title}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide ${getMaterialTypeColor(library.attributes.material_type)}`}>
                {library.attributes.material_type}
              </span>
              <span className="text-sm text-[#94A3B8]">{formatDate(library.attributes.created_at)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link 
            href={`/electronic-library/${library.id}/edit`}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#E2E8F0] text-[#1E293B] rounded-xl text-sm font-bold hover:bg-[#F8FAFC] transition-all"
          >
            <Edit className="w-4 h-4" />
            Edit
          </Link>
          <button 
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#EF4444] hover:bg-[#DC2626] text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-red-200 disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column - Cover Image */}
        <div className="w-full lg:w-[400px]">
          <section className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm overflow-hidden">
            <div className="relative h-80 bg-[#F8FAFC]">
              {library.attributes.cover_image ? (
                <Image
                  src={library.attributes.cover_image}
                  alt={library.attributes.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-[#94A3B8]">
                  No Cover Image
                </div>
              )}
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl font-bold text-[#2137D6]">${Number(library.attributes.price).toFixed(2)}</span>
                <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-bold tracking-wide ${
                  library.attributes.is_publish
                    ? 'bg-[#EBFDF5] text-[#10B981] border border-emerald-100'
                    : 'bg-[#F1F5F9] text-[#64748B] border border-slate-200'
                }`}>
                  {library.attributes.is_publish ? 'Published' : 'Draft'}
                </span>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column - Details */}
        <div className="flex-1">
          <section className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm overflow-hidden p-6">
            <h2 className="text-base font-bold text-[#1E293B] mb-6">Item Details</h2>
            
            <div className="flex flex-col gap-6">
              {/* Description */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#EEF2FF] rounded-xl flex items-center justify-center shrink-0 border border-indigo-50">
                  <BookOpen className="w-5 h-5 text-[#4F46E5]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[12px] text-[#64748B]">Description</span>
                  <span className="text-sm text-[#1E293B] leading-relaxed">{library.attributes.description}</span>
                </div>
              </div>

              {/* Course ID */}
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[#ECFDF5] rounded-xl flex items-center justify-center shrink-0 border border-emerald-50">
                  <DollarSign className="w-5 h-5 text-[#10B981]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[12px] text-[#64748B]">Course ID</span>
                  <span className="text-sm font-bold text-[#1E293B]">{library.attributes.course_id}</span>
                </div>
              </div>

              {/* Code Activation */}
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[#FEF3C7] rounded-xl flex items-center justify-center shrink-0 border border-amber-50">
                  <Lock className="w-5 h-5 text-[#D97706]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[12px] text-[#64748B]">Code Activation Required</span>
                  <span className="text-sm font-bold text-[#1E293B]">{library.attributes.code_activation ? 'Yes' : 'No'}</span>
                </div>
              </div>

              {/* Attachments */}
              {library.attributes.attachments && library.attributes.attachments.length > 0 && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#EEF2FF] rounded-xl flex items-center justify-center shrink-0 border border-indigo-50">
                      <svg className="w-5 h-5 text-[#4F46E5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[12px] text-[#64748B]">Attachments</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 pl-14">
                    {library.attributes.attachments.map((att) => (
                      <a
                        key={att.id}
                        href={att.attributes.path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] hover:bg-[#EEF2FF] hover:border-[#4F46E5] transition-all group"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#1E293B] truncate group-hover:text-[#4F46E5]">{att.attributes.name}</p>
                          <p className="text-xs text-[#94A3B8]">{att.attributes.extension.toUpperCase()} • {(parseInt(att.attributes.size) / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                        <svg className="w-5 h-5 text-[#64748B] group-hover:text-[#4F46E5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Created Date */}
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[#FFFBEB] rounded-xl flex items-center justify-center shrink-0 border border-amber-50">
                  <Calendar className="w-5 h-5 text-[#F59E0B]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[12px] text-[#64748B]">Created Date</span>
                  <span className="text-sm font-bold text-[#1E293B]">{formatDate(library.attributes.created_at)}</span>
                </div>
              </div>

              {/* Updated Date */}
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[#F1F5F9] rounded-xl flex items-center justify-center shrink-0 border border-slate-100">
                  <Eye className="w-5 h-5 text-[#64748B]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[12px] text-[#64748B]">Last Updated</span>
                  <span className="text-sm font-bold text-[#1E293B]">{formatDate(library.attributes.updated_at)}</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

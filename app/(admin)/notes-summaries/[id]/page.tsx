'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  User, 
  FileText, 
  BookOpen, 
  Calendar, 
  Eye,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useNote, useDeleteNote } from '@/src/hooks/useNotes';

function formatDate(dateString: string | null, naText: string = 'N/A'): string {
  if (!dateString) return naText;
  return new Date(dateString).toLocaleDateString();
}

export default function NoteDetailPage() {
  const t = useTranslations('notesSummaries');
  const router = useRouter();
  const params = useParams();
  const noteId = parseInt(params.id as string);

  const { data: note, isLoading, error } = useNote(noteId);
  const { mutate: deleteNote, isLoading: isDeleting } = useDeleteNote();

  const handleDelete = async () => {
    if (!confirm(t('detail.deleteConfirm'))) return;
    
    try {
      await deleteNote(noteId);
      router.push('/notes-summaries');
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

  if (error || !note) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-[#EF4444]">{t('detail.loadError')}</p>
        <Link 
          href="/notes-summaries"
          className="flex items-center gap-2 px-4 py-2 bg-[#2137D6] text-white rounded-xl text-sm font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('detail.backToNotes')}
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
            href="/notes-summaries"
            className="p-2.5 bg-white border border-[#E2E8F0] rounded-xl text-[#64748B] hover:text-[#1E293B] hover:shadow-sm transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#1E293B]">
              {note.attributes.title || t('untitledNote')}
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-sm font-semibold text-[#64748B]">{note.attributes.type}</span>
              <span className="w-4 h-[1px] bg-[#CBD5E1]"></span>
              <span className="text-sm text-[#94A3B8]">{formatDate(note.attributes.created_at, t('na'))}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link 
            href={`/notes-summaries/${note.id}/edit`}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#E2E8F0] text-[#1E293B] rounded-xl text-sm font-bold hover:bg-[#F8FAFC] transition-all"
          >
            <Edit className="w-4 h-4" />
            {t('detail.edit')}
          </Link>
          <button 
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#EF4444] hover:bg-[#DC2626] text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-red-200 disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            {t('detail.delete')}
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column - Content */}
        <div className="flex-1">
          <section className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm overflow-hidden p-6 h-full">
            <h2 className="text-base font-bold text-[#1E293B] mb-6">{t('detail.content')}</h2>
            <div className="prose prose-sm max-w-none text-[#475569] leading-relaxed whitespace-pre-wrap">
              {note.attributes.content}
            </div>
          </section>
        </div>

        {/* Right Column - Details */}
        <div className="w-full lg:w-[350px]">
          <section className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm overflow-hidden p-6">
            <h2 className="text-base font-bold text-[#1E293B] mb-6">{t('detail.details')}</h2>
            
            <div className="flex flex-col gap-6">
              {/* Type */}
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[#F5F3FF] rounded-xl flex items-center justify-center shrink-0 border border-purple-50">
                  <FileText className="w-5 h-5 text-[#8B5CF6]" />
                </div>
                <div className="flex flex-col gap-1 items-start">
                  <span className="text-[12px] text-[#64748B]">{t('detail.type')}</span>
                  <span className="inline-flex px-3 py-1 rounded-full text-[10px] font-bold bg-[#EEF2FF] text-[#4F46E5] tracking-wide">
                    {note.attributes.type}
                  </span>
                </div>
              </div>

              {/* Course */}
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[#ECFDF5] rounded-xl flex items-center justify-center shrink-0 border border-emerald-50">
                  <BookOpen className="w-5 h-5 text-[#10B981]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[12px] text-[#64748B]">{t('detail.courseId')}</span>
                  <span className="text-sm font-bold text-[#1E293B]">{note.attributes.course_id || t('na')}</span>
                </div>
              </div>

              {/* Linked Lecture */}
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[#EEF2FF] rounded-xl flex items-center justify-center shrink-0 border border-indigo-50">
                  <User className="w-5 h-5 text-[#4F46E5]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[12px] text-[#64748B]">{t('detail.linkedLecture')}</span>
                  <span className="text-sm font-bold text-[#1E293B]">{note.attributes.linked_lecture || t('na')}</span>
                </div>
              </div>

              {/* Date */}
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[#FFFBEB] rounded-xl flex items-center justify-center shrink-0 border border-amber-50">
                  <Calendar className="w-5 h-5 text-[#F59E0B]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[12px] text-[#64748B]">{t('detail.date')}</span>
                  <span className="text-sm font-bold text-[#1E293B]">{formatDate(note.attributes.created_at, t('na'))}</span>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[#F1F5F9] rounded-xl flex items-center justify-center shrink-0 border border-slate-100">
                  <Eye className="w-5 h-5 text-[#64748B]" />
                </div>
                <div className="flex flex-col gap-1 items-start">
                  <span className="text-[12px] text-[#64748B]">{t('detail.status')}</span>
                  <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-bold tracking-wide ${
                    note.attributes.is_publish
                      ? 'bg-[#EBFDF5] text-[#10B981] border border-emerald-100'
                      : 'bg-[#F1F5F9] text-[#64748B] border border-slate-200'
                  }`}>
                    {note.attributes.is_publish ? t('status.published') : t('status.draft')}
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

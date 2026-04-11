'use client';

import React, { useState } from 'react';
import { 
  ClipboardList, 
  MessageSquare, 
  Plus,
  CheckCircle2,
  XCircle,
  Reply,
  Trash2,
  Edit
} from 'lucide-react';
import Link from 'next/link';
import { useQuizzes, useDeleteQuiz } from '@/src/hooks/useQuizzes';
import { useChapters } from '@/src/hooks/useChapters';
import { AdminPageHeader } from '@/src/components/admin/AdminPageHeader';
import { DataTable, Column } from '@/src/components/ui/DataTable';
import { DeleteModal } from '@/src/components/ui/DeleteModal';
import type { Quiz } from '@/src/types';

export default function ExamsPage() {
  const [activeTab, setActiveTab] = useState<'exams' | 'qa'>('exams');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  
  const { data: quizzes, isLoading, error, refetch } = useQuizzes([]);
  const { data: chapters } = useChapters([]);
  const { mutate: deleteQuiz, isLoading: isDeleting } = useDeleteQuiz();

  const handleDelete = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedQuiz) return;
    
    try {
      await deleteQuiz(parseInt(selectedQuiz.id));
      setDeleteModalOpen(false);
      setSelectedQuiz(null);
      refetch();
    } catch {
      // Error handled by hook
    }
  };

  const getChapterName = (chapterId: number | null) => {
    if (!chapterId) return '-';
    const chapter = chapters?.find(c => parseInt(c.id) === chapterId);
    return chapter?.attributes.title || '-';
  };

  const columns: Column<Quiz>[] = [
    {
      key: 'title',
      header: 'Title',
      render: (item) => item.attributes.title,
    },
    {
      key: 'type',
      header: 'Type',
      render: (item) => (
        <span className="capitalize">{item.attributes.type}</span>
      ),
    },
    {
      key: 'chapter',
      header: 'Chapter',
      render: (item) => getChapterName(item.attributes.chapter_id),
    },
    {
      key: 'duration',
      header: 'Duration',
      render: (item) => `${item.attributes.duration} mins`,
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${
          item.attributes.is_published
            ? 'bg-[#E1FCEF] text-[#059669]'
            : 'bg-[#F1F5F9] text-[#64748B]'
        }`}>
          {item.attributes.is_published ? 'Published' : 'Draft'}
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6 pb-12">
      <AdminPageHeader
        title="Exams & Quizzes"
        description="Manage assessments and quizzes"
        actionLabel="Create Exam"
        actionHref="/exams/create"
      />

      {/* Tabs */}
      <div className="flex items-center gap-8 border-b border-[#E2E8F0]">
        <button
          onClick={() => setActiveTab('exams')}
          className={`flex items-center gap-2 px-1 py-4 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'exams'
              ? 'border-[#2137D6] text-[#2137D6]'
              : 'border-transparent text-[#94A3B8] hover:text-[#64748B]'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          Exams & Quizzes
        </button>
        <button
          onClick={() => setActiveTab('qa')}
          className={`flex items-center gap-2 px-1 py-4 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'qa'
              ? 'border-[#2137D6] text-[#2137D6]'
              : 'border-transparent text-[#94A3B8] hover:text-[#64748B]'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Q&A Moderation
          <span className="ml-2 px-2 py-0.5 bg-[#FEE2E2] text-[#EF4444] text-[10px] rounded-full">
            Coming Soon
          </span>
        </button>
      </div>

      {/* Content */}
      <div className="mt-2">
        {activeTab === 'exams' ? (
          <>
            <DataTable
              data={quizzes || []}
              columns={columns}
              isLoading={isLoading}
              keyExtractor={(item) => item.id}
              onDelete={handleDelete}
              editHref={(item) => `/exams/edit/${item.id}`}
              emptyMessage="No exams found. Create your first exam!"
            />
            <DeleteModal
              isOpen={deleteModalOpen}
              onClose={() => {
                setDeleteModalOpen(false);
                setSelectedQuiz(null);
              }}
              onConfirm={handleConfirmDelete}
              title="Delete Exam"
              itemName={selectedQuiz?.attributes.title || ''}
              isLoading={isDeleting}
            />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-[#64748B]">
            <MessageSquare className="w-12 h-12 mb-4 text-[#94A3B8]" />
            <p>Q&A Moderation coming soon</p>
          </div>
        )}
      </div>
    </div>
  );
}

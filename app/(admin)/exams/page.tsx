'use client';

import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  Plus,
  CheckCircle2,
  XCircle,
  Reply,
  Trash2,
  Edit
} from 'lucide-react';
import Link from 'next/link';
import { useQuizzes, useDeleteQuiz, useUpdateQuiz } from '@/src/hooks/useQuizzes';
import { useChapters } from '@/src/hooks/useChapters';
import { AdminPageHeader } from '@/src/components/admin/AdminPageHeader';
import { DataTable, Column } from '@/src/components/ui/DataTable';
import { DeleteModal } from '@/src/components/ui/DeleteModal';
import type { Quiz } from '@/src/types';

export default function ExamsPage() {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);

  const { data: quizzesData, isLoading, error, refetch } = useQuizzes([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);

  // Sync local state with API data
  useEffect(() => {
    if (quizzesData) {
      setQuizzes(quizzesData);
    }
  }, [quizzesData]);
  const { data: chapters } = useChapters([]);
  const { mutate: deleteQuiz, isLoading: isDeleting } = useDeleteQuiz();
  const { mutate: updateQuiz } = useUpdateQuiz();

  const handleDelete = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedQuiz) return;

    const deletedId = selectedQuiz.id;

    try {
      // Immediately remove from UI
      setQuizzes(prev => prev.filter(q => q.id !== deletedId));
      setDeleteModalOpen(false);
      setSelectedQuiz(null);

      // Then delete on server
      await deleteQuiz(parseInt(deletedId));
      await refetch();

      alert('Exam deleted successfully!');
    } catch {
      // Restore on error
      await refetch();
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
      key: 'questions',
      header: 'Questions',
      render: (item) => (
        <span className="text-sm text-[#475569]">
          {item.attributes.questions?.length || 0} Qs
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => (
        <button
          onClick={async () => {
            try {
              await updateQuiz(parseInt(item.id), {
                status: item.attributes.status === 'active' ? 'draft' : 'active'
              });
              refetch();
            } catch {
              // Error handled by hook
            }
          }}
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-all hover:opacity-80 ${item.attributes.status === 'active'
            ? 'bg-[#E1FCEF] text-[#059669]'
            : 'bg-[#F1F5F9] text-[#64748B]'
            }`}
        >
          {item.attributes.status === 'active' ? 'Active' : 'Draft'}
        </button>
      ),
    },
    {
      key: 'visibility',
      header: 'Visibility',
      render: (item) => (
        <button
          onClick={async () => {
            try {
              await updateQuiz(parseInt(item.id), {
                is_public: !item.attributes.is_public
              });
              refetch();
            } catch {
              // Error handled by hook
            }
          }}
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-all hover:opacity-80 ${item.attributes.is_public
            ? 'bg-[#E0E7FF] text-[#2137D6]'
            : 'bg-[#F1F5F9] text-[#64748B]'
            }`}
        >
          {item.attributes.is_public ? 'Public' : 'Private'}
        </button>
      ),
    }
  ];

  return (
    <div className="flex flex-col gap-6 pb-12">
      <AdminPageHeader
        title="Exams & Quizzes"
        description="Manage assessments and quizzes"
        actionLabel="Create Exam"
        actionHref="/exams/create"
      />

      {/* Content */}
      <div className="mt-2">
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
      </div>
    </div>
  );
}

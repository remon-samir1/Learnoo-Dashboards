'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { useQuizzes, useDeleteQuiz, useUpdateQuiz } from '@/src/hooks/useQuizzes';
import { useChapters } from '@/src/hooks/useChapters';
import { useCourses } from '@/src/hooks/useCourses';
import { AdminPageHeader } from '@/src/components/admin/AdminPageHeader';
import { DataTable, Column } from '@/src/components/ui/DataTable';
import { DeleteModal } from '@/src/components/ui/DeleteModal';
import type { Quiz, Course } from '@/src/types';



export default function ExamsPage() {
  const t = useTranslations();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);

  const { data: quizzesData, isLoading, error, refetch } = useQuizzes();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);

  // Sync local state with API data
  useEffect(() => {
    if (quizzesData) {
      setQuizzes(quizzesData);
    }
  }, [quizzesData]);
  const { data: chapters } = useChapters();
  const { data: courses } = useCourses();
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
      setQuizzes(prev => prev.filter(q => q.id !== deletedId));
      setDeleteModalOpen(false);
      setSelectedQuiz(null);

      await deleteQuiz(parseInt(deletedId));
      await refetch();

      alert(t('exams.deleteSuccess'));
    } catch {
      await refetch();
    }
  };

  const getChapterName = (chapterId: number | null) => {
    if (!chapterId) return '-';
    const chapter = chapters?.find(c => parseInt(c.id) === chapterId);
    return chapter?.attributes.title || '-';
  };

  const getCourseName = (courseId: number | null | undefined) => {
    if (!courseId) return null;
    const course = courses?.find(c => parseInt(c.id) === courseId);
    return course?.attributes.title || null;
  };

  const getCourseNames = (item: Quiz) => {
    if (item.attributes.courses && item.attributes.courses.length > 0) {
      return item.attributes.courses.map((c: Course) => c.attributes.title);
    }

    const names: string[] = [];
    const ids = item.attributes.course_ids?.length ? item.attributes.course_ids : (item.attributes.course_id ? [item.attributes.course_id] : []);
    ids.forEach(id => {
      const name = getCourseName(id);
      if (name) names.push(name);
    });
    return names.length ? names : '-';
  };

  const columns: Column<Quiz>[] = [
    {
      key: 'title',
      header: t('exams.columns.title'),
      render: (item) => (
        <div className="whitespace-nowrap font-medium text-[#1E293B]">
          {item.attributes.title}
        </div>
      ),
      width: '380px',
    },
    {
      key: 'type',
      header: t('exams.columns.type'),
      render: (item) => (
        <span className="capitalize">{item.attributes.type}</span>
      ),
    },
    {
      key: 'chapter',
      header: t('exams.columns.chapter'),
      render: (item) => getChapterName(item.attributes.chapter_id),
    },
    {
      key: 'course',
      header: t('exams.columns.course'),
      render: (item) => {
        const names = getCourseNames(item);
        return Array.isArray(names) ? names.join(', ') : names;
      },
    },
    {
      key: 'duration',
      header: t('exams.columns.duration'),
      render: (item) => `${item.attributes.duration} ${t('exams.minutes')}`,
    },
    {
      key: 'questions',
      header: t('exams.columns.questions'),
      render: (item) => (
        <span className="text-sm text-[#475569]">
          {item.attributes.questions?.length || 0} {t('exams.questions')}
        </span>
      ),
    },
    {
      key: 'status',
      header: t('exams.columns.status'),
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
          {item.attributes.status === 'active' ? t('exams.status.active') : t('exams.status.draft')}
        </button>
      ),
    },
    {
      key: 'visibility',
      header: t('exams.columns.visibility'),
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
          {item.attributes.is_public ? t('exams.visibility.public') : t('exams.visibility.private')}
        </button>
      ),
    },
    {
      key: 'results',
      header: 'Results',
      render: (item) => (
        <Link
          href={`/exams/${item.id}/results`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#EFF6FF] text-[#2137D6] rounded-lg text-[10px] font-bold hover:bg-[#E0E7FF] transition-all"
        >
          <BarChart3 className="w-3.5 h-3.5" />
          Results
        </Link>
      ),
    }
  ];

  return (
    <div className="flex flex-col gap-6 pb-12">
      <AdminPageHeader
        title={t('exams.pageTitle')}
        description={t('exams.pageDescription')}
        actionLabel={t('exams.createExam')}
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
          emptyMessage={t('exams.noExams')}
        />
        <DeleteModal
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setSelectedQuiz(null);
          }}
          onConfirm={handleConfirmDelete}
          title={t('exams.pageTitle')}
          itemName={selectedQuiz?.attributes.title || ''}
          isLoading={isDeleting}
        />
      </div>
    </div>
  );
}

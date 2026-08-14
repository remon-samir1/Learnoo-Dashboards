'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import {
  AlertCircle,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Copy,
  Loader2,
  Pencil,
  RotateCcw,
  Search,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { AdminPageHeader } from '@/src/components/admin/AdminPageHeader';
import { DeleteModal } from '@/src/components/ui/DeleteModal';
import { useChapters } from '@/src/hooks/useChapters';
import { useCourses } from '@/src/hooks/useCourses';
import {
  useCreateQuiz,
  useDeleteQuiz,
  useQuizList,
  useUpdateQuiz,
} from '@/src/hooks/useQuizzes';
import { api } from '@/src/lib/api';
import {
  buildExamFormData,
  getQuizCourseIds,
} from '@/src/lib/exam-form';
import type { Course, Quiz } from '@/src/types';

interface ExamManagementListProps {
  basePath: '/exams' | '/doctor/exams';
}

const SEARCH_DEBOUNCE_MS = 400;

function useDebouncedValue<T>(value: T, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(timeoutId);
  }, [delay, value]);

  return debouncedValue;
}

export function ExamManagementList({ basePath }: ExamManagementListProps) {
  const t = useTranslations('exams');
  const commonT = useTranslations('common');
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const [page, setPage] = useState(1);
  const [pageInputValue, setPageInputValue] = useState('1');
  const [searchValue, setSearchValue] = useState('');
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [updatingQuizId, setUpdatingQuizId] = useState<string | null>(null);
  const [copyingQuizId, setCopyingQuizId] = useState<string | null>(null);
  const debouncedTitle = useDebouncedValue(searchValue.trim(), SEARCH_DEBOUNCE_MS);

  const quizzesQuery = useQuizList({
    page,
    title: debouncedTitle || undefined,
  });
  const { data: chapters } = useChapters();
  const { data: courses } = useCourses();
  const deleteMutation = useDeleteQuiz();
  const updateMutation = useUpdateQuiz();
  const createMutation = useCreateQuiz();

  const quizzes = quizzesQuery.data?.data ?? [];
  const meta = quizzesQuery.data?.meta;
  const currentPage = meta?.current_page ?? page;
  const totalPages = Math.max(meta?.last_page ?? 1, 1);
  const totalItems = meta?.total ?? quizzes.length;
  const fromItem = totalItems === 0 ? 0 : (meta?.from ?? ((currentPage - 1) * (meta?.per_page ?? quizzes.length) + 1));
  const toItem = meta?.to ?? Math.min(fromItem + quizzes.length - 1, totalItems);

  useEffect(() => {
    setPageInputValue(currentPage.toString());
  }, [currentPage]);

  const chapterNames = useMemo(
    () => new Map((chapters ?? []).map((chapter) => [Number(chapter.id), chapter.attributes.title])),
    [chapters]
  );
  const courseNames = useMemo(
    () => new Map((courses ?? []).map((course) => [Number(course.id), course.attributes.title])),
    [courses]
  );

  const getCourseNames = (quiz: Quiz) => {
    if (quiz.attributes.courses?.length) {
      return quiz.attributes.courses
        .map((course: Course) => course.attributes.title)
        .filter(Boolean)
        .join(', ');
    }

    const ids = quiz.attributes.course_ids?.length
      ? quiz.attributes.course_ids
      : quiz.attributes.course_id
        ? [quiz.attributes.course_id]
        : [];

    return ids.map((id) => courseNames.get(Number(id))).filter(Boolean).join(', ') || '—';
  };

  const formatDateTimeForInput = (isoString: string | null): string => {
    if (!isoString) return '';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const handleCopyQuiz = async (quiz: Quiz) => {
    setCopyingQuizId(quiz.id);
    try {
      const fullQuizRes = await api.quizzes.get(Number(quiz.id));
      const fullQuiz = fullQuizRes.data;

      const examDetails = {
        title: `${fullQuiz.attributes.title} (Copy)`,
        courses: getQuizCourseIds(
          fullQuiz.attributes.courses,
          fullQuiz.attributes.course_id,
          fullQuiz.attributes.course_ids
        ),
        chapter: fullQuiz.attributes.chapter_id ? String(fullQuiz.attributes.chapter_id) : '',
        type: (fullQuiz.attributes.type === 'exam' ? 'exam' : 'homework') as 'exam' | 'homework',
        duration: String(fullQuiz.attributes.duration || 60),
        totalMarks: String(fullQuiz.attributes.total_marks || 100),
        passingMarks: String(fullQuiz.attributes.passing_marks || 60),
        maxAttempts: String(fullQuiz.attributes.max_attempts || 1),
        startTime: formatDateTimeForInput(fullQuiz.attributes.start_time),
        endTime: formatDateTimeForInput(fullQuiz.attributes.end_time),
        is_public: (fullQuiz.attributes.is_public === true || fullQuiz.attributes.is_public === 'true') ? 'true' : (fullQuiz.attributes.is_public === 'included' ? 'included' : 'false') as 'true' | 'false' | 'included',
        status: fullQuiz.attributes.status === 'active' ? 'Active' : 'Draft' as 'Draft' | 'Active',
      };

      const questions = (fullQuiz.attributes.questions || []).map((q) => ({
        id: `copy-${Date.now()}-${Math.random()}`,
        text: q.attributes.text,
        type: q.attributes.type,
        score: q.attributes.score,
        autoCorrect: q.attributes.auto_correct ?? true,
        image: null,
        imagePreview: q.attributes.image || '',
        answers: q.attributes.answers?.map((ans) => ({
          id: `copy-ans-${Date.now()}-${Math.random()}`,
          text: ans.attributes.text,
          isCorrect: ans.attributes.is_correct,
          reason: ans.attributes.reason || '',
          image: null,
          imagePreview: ans.attributes.image || '',
          reason_image: null,
          reasonImagePreview: ans.attributes.reason_image || '',
        })) || [],
      }));

      const formData = buildExamFormData(examDetails, questions, 'create');
      await createMutation.mutateAsync(formData);
      toast.success(t('createSuccess', { fallback: 'Exam copied successfully' }));
    } catch (error) {
      console.error(error);
      toast.error(t('createError', { fallback: 'Failed to copy exam' }));
    } finally {
      setCopyingQuizId(null);
    }
  };

  const updateQuiz = async (quiz: Quiz, data: { status?: 'draft' | 'active'; is_public?: boolean | 'true' | 'false' | 'included' }) => {
    setUpdatingQuizId(quiz.id);
    try {
      await updateMutation.mutateAsync(Number(quiz.id), data);
      toast.success(t('updateSuccess'));
    } catch {
      toast.error(t('updateError'));
    } finally {
      setUpdatingQuizId(null);
    }
  };

  const confirmDelete = async () => {
    if (!selectedQuiz) return;

    try {
      await deleteMutation.mutateAsync(Number(selectedQuiz.id));
      toast.success(t('deleteSuccess'));
      setSelectedQuiz(null);
    } catch {
      toast.error(t('deleteError'));
    }
  };

  const changePage = (nextPage: number) => {
    if (nextPage < 1 || nextPage > totalPages || nextPage === currentPage) return;
    setPage(nextPage);
  };

  const handlePageSubmit = () => {
    const newPage = parseInt(pageInputValue, 10);
    if (!isNaN(newPage) && newPage >= 1 && newPage <= totalPages) {
      if (newPage !== currentPage) {
        changePage(newPage);
      }
    } else {
      setPageInputValue(currentPage.toString());
    }
  };

  const pageSummaryText = t('pageSummary', { current: '[[INPUT]]', total: totalPages });
  const [summaryBefore, summaryAfter] = pageSummaryText.split('[[INPUT]]');

  return (
    <div className="flex flex-col gap-6 pb-12">
      <AdminPageHeader
        title={t('pageTitle')}
        description={t('pageDescription')}
        actionLabel={t('createExam')}
        actionHref={`${basePath}/create`}
      />

      <section className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">
        <div className="border-b border-[#E2E8F0] p-4 sm:p-5">
          <label className="relative block max-w-xl">
            <span className="sr-only">{t('searchLabel')}</span>
            <Search className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="search"
              value={searchValue}
              onChange={(event) => {
                setSearchValue(event.target.value);
                setPage(1);
              }}
              placeholder={t('searchPlaceholder')}
              className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] py-3 pe-4 ps-11 text-sm text-[#1E293B] outline-none transition focus:border-[#2137D6] focus:ring-2 focus:ring-[#2137D6]/10"
            />
          </label>
        </div>

        {quizzesQuery.isPending ? (
          <ExamListSkeleton />
        ) : quizzesQuery.isError ? (
          <div className="flex min-h-72 flex-col items-center justify-center gap-4 px-6 py-12 text-center">
            <div className="rounded-full bg-red-50 p-3 text-red-600">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-bold text-[#1E293B]">{t('loadErrorTitle')}</h2>
              <p className="mt-1 text-sm text-[#64748B]">{t('loadErrorDescription')}</p>
            </div>
            <button
              type="button"
              onClick={() => void quizzesQuery.refetch()}
              disabled={quizzesQuery.isFetching}
              className="inline-flex items-center gap-2 rounded-xl bg-[#2137D6] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#1a2bb3] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {quizzesQuery.isFetching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4" />
              )}
              {t('retry')}
            </button>
          </div>
        ) : quizzes.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
            <Search className="h-8 w-8 text-[#94A3B8]" />
            <h2 className="mt-4 font-bold text-[#1E293B]">
              {debouncedTitle ? t('noSearchResults') : t('noExams')}
            </h2>
            {debouncedTitle && (
              <button
                type="button"
                onClick={() => setSearchValue('')}
                className="mt-3 text-sm font-bold text-[#2137D6] hover:underline"
              >
                {t('clearSearch')}
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1120px] border-collapse text-start">
                <thead>
                  <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                    {[
                      t('columns.title'),
                      t('columns.type'),
                      t('columns.chapter'),
                      t('columns.course'),
                      t('columns.duration'),
                      t('columns.questions'),
                      t('columns.status'),
                      t('columns.visibility'),
                      t('columns.results'),
                      commonT('actions'),
                    ].map((heading) => (
                      <th key={heading} scope="col" className="px-4 py-4 text-start text-xs font-bold uppercase tracking-wide text-[#475569]">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {quizzes.map((quiz) => {
                    const isUpdating = updatingQuizId === quiz.id;
                    const title = quiz.attributes.title;
                    return (
                      <tr key={quiz.id} className="transition-colors hover:bg-[#F8FAFC]/70">
                        <td className="max-w-72 px-4 py-4 align-top">
                          <p className="line-clamp-2 min-w-48 font-bold leading-5 text-[#1E293B]" title={title}>
                            {title}
                          </p>
                        </td>
                        <td className="px-4 py-4 text-sm text-[#475569]">
                          {quiz.attributes.type === 'homework' ? t('types.homework') : t('types.exam')}
                        </td>
                        <td className="max-w-52 px-4 py-4 text-sm text-[#475569]">
                          <span className="line-clamp-2" title={chapterNames.get(Number(quiz.attributes.chapter_id)) ?? '—'}>
                            {chapterNames.get(Number(quiz.attributes.chapter_id)) ?? '—'}
                          </span>
                        </td>
                        <td className="max-w-72 px-4 py-4 text-sm text-[#475569]">
                          <span className="line-clamp-2" title={getCourseNames(quiz)}>{getCourseNames(quiz)}</span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm text-[#475569]">
                          {t('durationValue', { count: quiz.attributes.duration })}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm text-[#475569]">
                          {t('questionsValue', { count: quiz.attributes.questions?.length ?? 0 })}
                        </td>
                        <td className="px-4 py-4">
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => void updateQuiz(quiz, {
                              status: quiz.attributes.status === 'active' ? 'draft' : 'active',
                            })}
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${quiz.attributes.status === 'active'
                              ? 'bg-[#E1FCEF] text-[#047857]'
                              : 'bg-[#F1F5F9] text-[#64748B]'
                              }`}
                          >
                            {isUpdating && <Loader2 className="h-3 w-3 animate-spin" />}
                            {quiz.attributes.status === 'active' ? t('status.active') : t('status.draft')}
                          </button>
                        </td>
                        <td className="px-4 py-4">
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => {
                              const currentVal = quiz.attributes.is_public;
                              let nextVal: 'true' | 'false' | 'included' = 'false';
                              if (currentVal === true || currentVal === 'true') nextVal = 'included';
                              else if (currentVal === 'included') nextVal = 'false';
                              else nextVal = 'true';

                              void updateQuiz(quiz, { is_public: nextVal });
                            }}
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${(quiz.attributes.is_public === true || quiz.attributes.is_public === 'true')
                              ? 'bg-[#E0E7FF] text-[#2137D6]'
                              : (quiz.attributes.is_public === 'included' ? 'bg-[#FEF3C7] text-[#D97706]' : 'bg-[#F1F5F9] text-[#64748B]')
                              }`}
                          >
                            {isUpdating && <Loader2 className="h-3 w-3 animate-spin" />}
                            {(quiz.attributes.is_public === true || quiz.attributes.is_public === 'true')
                              ? (t('visibility.public') || 'Public')
                              : (quiz.attributes.is_public === 'included' ? (t('create.included') || 'Included') : (t('visibility.private') || 'Private'))}
                          </button>
                        </td>
                        <td className="px-4 py-4">
                          <Link
                            href={`${basePath}/${quiz.id}/results`}
                            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-[#EFF6FF] px-3 py-2 text-xs font-bold text-[#2137D6] transition hover:bg-[#E0E7FF]"
                          >
                            <BarChart3 className="h-4 w-4" />
                            {t('results')}
                          </Link>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => void handleCopyQuiz(quiz)}
                              disabled={copyingQuizId === quiz.id}
                              aria-label={t('copyExam', { title, fallback: 'Copy' })}
                              title={commonT('copy', { fallback: 'Copy' })}
                              className="rounded-full p-2 text-[#64748B] transition hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {copyingQuizId === quiz.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </button>
                            <Link
                              href={`${basePath}/${quiz.id}/edit`}
                              aria-label={t('editExam', { title })}
                              title={commonT('edit')}
                              className="rounded-full p-2 text-[#64748B] transition hover:bg-blue-50 hover:text-[#2137D6]"
                            >
                              <Pencil className="h-4 w-4" />
                            </Link>
                            <button
                              type="button"
                              onClick={() => setSelectedQuiz(quiz)}
                              aria-label={t('deleteExam', { title })}
                              title={commonT('delete')}
                              className="rounded-full p-2 text-[#64748B] transition hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex flex-col gap-3 border-t border-[#E2E8F0] bg-[#F8FAFC] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-[#64748B]">
                  {t('paginationSummary', { from: fromItem, to: toItem, total: totalItems })}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => changePage(currentPage - 1)}
                    disabled={currentPage <= 1 || quizzesQuery.isFetching}
                    className="inline-flex items-center gap-1 rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-sm font-bold text-[#475569] transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isRtl ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                    {commonT('previous')}
                  </button>
                  <div className="flex items-center gap-1.5 px-2 text-sm text-[#64748B]">
                    <span>{summaryBefore}</span>
                    <input
                      type="number"
                      min={1}
                      max={totalPages}
                      value={pageInputValue}
                      onChange={(e) => setPageInputValue(e.target.value)}
                      onBlur={handlePageSubmit}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handlePageSubmit();
                      }}
                      className="w-12 rounded border border-[#E2E8F0] px-1 py-0.5 text-center text-sm outline-none transition-colors focus:border-[#2137D6] focus:ring-1 focus:ring-[#2137D6] disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={quizzesQuery.isFetching}
                    />
                    <span>{summaryAfter}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => changePage(currentPage + 1)}
                    disabled={currentPage >= totalPages || quizzesQuery.isFetching}
                    className="inline-flex items-center gap-1 rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-sm font-bold text-[#475569] transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {commonT('next')}
                    {isRtl ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      <DeleteModal
        isOpen={selectedQuiz !== null}
        onClose={() => setSelectedQuiz(null)}
        onConfirm={() => void confirmDelete()}
        title={t('deleteTitle')}
        description={t('deleteDescription', { title: selectedQuiz?.attributes.title ?? '' })}
        isLoading={deleteMutation.isPending}
        cancelLabel={commonT('cancel')}
        confirmLabel={commonT('delete')}
        confirmLoadingLabel={t('deleting')}
      />
    </div>
  );
}

function ExamListSkeleton() {
  return (
    <div className="overflow-hidden" aria-hidden="true">
      <div className="h-14 animate-pulse border-b border-[#E2E8F0] bg-[#F8FAFC]" />
      {[0, 1, 2, 3, 4].map((row) => (
        <div key={row} className="grid min-w-[1120px] grid-cols-10 gap-4 border-b border-[#E2E8F0] px-4 py-5 last:border-b-0">
          {Array.from({ length: 10 }, (_, column) => (
            <div key={column} className="h-4 animate-pulse rounded bg-[#E2E8F0]" />
          ))}
        </div>
      ))}
    </div>
  );
}

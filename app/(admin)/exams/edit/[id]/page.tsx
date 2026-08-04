"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Trash2,
  ChevronDown,
  Clock,
  Calendar,
  FileText,
  Award,
  RotateCcw,
  Loader2,
  X,
  ImagePlus,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';
import { useChapters } from '@/src/hooks/useChapters';
import { quizKeys, useQuiz } from '@/src/hooks/useQuizzes';
import { CourseTreeSelect } from '@/src/components/admin/CourseTreeSelect';
import { parseGeneratedExamQuestions } from '@/src/lib/exam-ai';
import {
  buildExamFormData,
  createReplacementPreview,
  getApiErrorMessages,
  getQuizCourseIds,
  isApiErrorPayload,
  mapGeneratedQuestionsToForm,
  revokeAnswerObjectUrls,
  revokeQuestionObjectUrls,
  revokeQuestionsObjectUrls,
  type ExamFormAnswer as Answer,
  type ExamFormDetails as ExamDetails,
  type ExamFormQuestion as Question,
} from '@/src/lib/exam-form';
import {
  readExamField,
  type ExamDateField,
  type ExamNumberField,
} from '@/src/lib/exam-form-fields';

// ─── helpers ────────────────────────────────────────────────────────────────

/** Get auth token from cookies (same logic as the API route) */
function getTokenFromCookies(): string {
  if (typeof document === 'undefined') return '';
  const cookies = document.cookie.split('; ');
  for (const cookie of cookies) {
    const [key, value] = cookie.split('=');
    if (key === 'token' || key === 'auth_token') return decodeURIComponent(value || '');
  }
  return '';
}

/** Submit the quiz update directly to the backend. */
async function submitQuizUpdate(examId: string, formData: FormData): Promise<Response> {
  const token = getTokenFromCookies();
  if (!token) throw new Error('UNAUTHORIZED');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.learnoo.app';
  return fetch(`${apiUrl}/v1/quiz/${examId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
    },
    body: formData,
  });
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function EditExamPage() {
  const t = useTranslations('exams');
  const locale = useLocale();
  const BackIcon = locale === 'ar' ? ArrowRight : ArrowLeft;
  const router = useRouter();
  const params = useParams();
  const examId = params.id as string;

  const { data: chapters, isLoading: chaptersLoading } = useChapters();
  const { data: quiz, isLoading: quizLoading } = useQuiz(parseInt(examId));
  const queryClient = useQueryClient();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isExtractingAI, setIsExtractingAI] = useState(false);
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [pendingQuestions, setPendingQuestions] = useState<Question[] | null>(null);

  const [showAIModal, setShowAIModal] = useState(false);
  const [aiQuestionCount, setAiQuestionCount] = useState<string>('5');
  const [aiFile, setAiFile] = useState<File | null>(null);

  const [examDetails, setExamDetails] = useState<ExamDetails>({
    title: '', courses: [], chapter: '', type: 'exam',
    duration: '60', totalMarks: '100', passingMarks: '60', maxAttempts: '1',
    status: 'Draft', startTime: '', endTime: '', is_public: false,
  });

  const [questions, setQuestions] = useState<Question[]>([]);
  const questionsRef = useRef(questions);
  questionsRef.current = questions;

  useEffect(() => () => revokeQuestionsObjectUrls(questionsRef.current), []);

  const closeAIModal = () => {
    if (isExtractingAI) return;
    setShowAIModal(false);
    setAiFile(null);
    setAiQuestionCount('5');
  };

  const closeReplaceModal = () => {
    setShowReplaceModal(false);
    setPendingQuestions(null);
  };

  // ── format helper ──
  const formatDateTimeForInput = (isoString: string | null): string => {
    if (!isoString) return '';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const filteredChapters = examDetails.courses.length > 0
    ? chapters?.filter(ch => examDetails.courses.includes(String(ch.attributes.course_id)))
    : chapters;

  // ── load quiz ──
  useEffect(() => {
    if (!quiz) return;

    setExamDetails({
      title: quiz.attributes.title || '',
      courses: getQuizCourseIds(
        quiz.attributes.courses,
        quiz.attributes.course_id,
        quiz.attributes.course_ids
      ),
      chapter: quiz.attributes.chapter_id ? String(quiz.attributes.chapter_id) : '',
      type: quiz.attributes.type === 'exam' ? 'exam' : 'homework',
      duration: String(quiz.attributes.duration || 60),
      totalMarks: String(quiz.attributes.total_marks || 100),
      passingMarks: String(quiz.attributes.passing_marks || 60),
      maxAttempts: String(quiz.attributes.max_attempts || 1),
      startTime: formatDateTimeForInput(quiz.attributes.start_time),
      endTime: formatDateTimeForInput(quiz.attributes.end_time),
      is_public: quiz.attributes.is_public || false,
      status: quiz.attributes.status === 'active' ? 'Active' : 'Draft',
    });

    if (quiz.attributes.questions?.length) {
      setQuestions(
        quiz.attributes.questions.map((q) => ({
          id: String(q.id),
          text: q.attributes.text,
          type: q.attributes.type,
          score: q.attributes.score,
          autoCorrect: q.attributes.auto_correct ?? true,
          image: null,
          imagePreview: q.attributes.image || '',          // ✅ existing image URL
          answers: q.attributes.answers?.map((ans) => ({
            id: String(ans.attributes.id),        // ✅ real API id
            text: ans.attributes.text,
            isCorrect: ans.attributes.is_correct,
            reason: ans.attributes.reason || '',
            image: null,
            imagePreview: ans.attributes.image || '',      // ✅ existing image URL
            reason_image: null,
            reasonImagePreview: ans.attributes.reason_image || '', // ✅ existing reason image URL
          })) || [],
        }))
      );
    }
  }, [quiz]);

  // Edit state is hydrated only from the selected server entity.
  useEffect(() => {
    localStorage.removeItem(`exam_edit_form_draft_${examId}`);
  }, [examId]);

  // ── question helpers ──
  const addQuestion = (atIndex?: number) => {
    const newQuestion: Question = {
      id: `new-${Date.now()}`, text: '', type: 'single_choice',
      score: 1, autoCorrect: true, image: null, imagePreview: '',
      answers: [
        { id: `a-${Date.now()}-1`, text: '', isCorrect: false, reason: '', image: null, imagePreview: '', reason_image: null, reasonImagePreview: '' },
        { id: `a-${Date.now()}-2`, text: '', isCorrect: false, reason: '', image: null, imagePreview: '', reason_image: null, reasonImagePreview: '' },
      ],
    };

    if (typeof atIndex === 'number') {
      const updatedQuestions = [...questions];
      updatedQuestions.splice(atIndex, 0, newQuestion);
      setQuestions(updatedQuestions);
    } else {
      setQuestions((prev) => [...prev, newQuestion]);
    }
  };

  const removeQuestion = (id: string) => {
    if (questions.length <= 1) return;

    const removedQuestion = questions.find((question) => question.id === id);
    if (removedQuestion) revokeQuestionObjectUrls(removedQuestion);
    setQuestions((current) => current.filter((question) => question.id !== id));
  };

  const updateQuestion = (id: string, updates: Partial<Question>) =>
    setQuestions((prev) => prev.map(q => q.id === id ? { ...q, ...updates } : q));

  const addAnswer = (qId: string) =>
    setQuestions((prev) => prev.map(q =>
      q.id === qId
        ? { ...q, answers: [...q.answers, { id: `a-${Date.now()}`, text: '', isCorrect: false, reason: '', image: null, imagePreview: '', reason_image: null, reasonImagePreview: '' }] }
        : q
    ));

  const removeAnswer = (qId: string, answerId: string) =>
    setQuestions((current) => current.map((question) => {
      if (question.id !== qId || question.answers.length <= 2) return question;

      const removedAnswer = question.answers.find((answer) => answer.id === answerId);
      if (removedAnswer) revokeAnswerObjectUrls(removedAnswer);
      return {
        ...question,
        answers: question.answers.filter((answer) => answer.id !== answerId),
      };
    }));

  const updateAnswer = (qId: string, answerId: string, updates: Partial<Answer>) =>
    setQuestions((prev) => prev.map(q =>
      q.id === qId
        ? { ...q, answers: q.answers.map(a => a.id === answerId ? { ...a, ...updates } : a) }
        : q
    ));

  const toggleCorrectAnswer = (qId: string, answerId: string) =>
    setQuestions((prev) => prev.map(q => {
      if (q.id !== qId) return q;
      if (q.type === 'single_choice' || q.type === 'true_false') {
        return { ...q, answers: q.answers.map(a => ({ ...a, isCorrect: a.id === answerId ? !a.isCorrect : false })) };
      }
      return { ...q, answers: q.answers.map(a => a.id === answerId ? { ...a, isCorrect: !a.isCorrect } : a) };
    }));

  const handleQuestionImageChange = (qId: string, file: File | null) =>
    setQuestions((current) => current.map((question) => question.id === qId
      ? {
        ...question,
        image: file,
        imagePreview: createReplacementPreview(question.imagePreview, file),
      }
      : question));

  const handleAnswerImageChange = (qId: string, answerId: string, file: File | null) =>
    setQuestions((current) => current.map((question) => question.id === qId
      ? {
        ...question,
        answers: question.answers.map((answer) => answer.id === answerId
          ? {
            ...answer,
            image: file,
            imagePreview: createReplacementPreview(answer.imagePreview, file),
          }
          : answer),
      }
      : question));

  const handleAnswerReasonImageChange = (qId: string, answerId: string, file: File | null) =>
    setQuestions((current) => current.map((question) => question.id === qId
      ? {
        ...question,
        answers: question.answers.map((answer) => answer.id === answerId
          ? {
            ...answer,
            reason_image: file,
            reasonImagePreview: createReplacementPreview(answer.reasonImagePreview, file),
          }
          : answer),
      }
      : question));

  const handleAIUpload = async (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!aiFile) {
      toast.error(t('ai.selectFileError'));
      return;
    }

    setIsExtractingAI(true);

    try {
      const formData = new FormData();
      formData.append('file', aiFile);
      if (aiQuestionCount) formData.append('count', aiQuestionCount);

      const response = await fetch('/api/ai-exam-extract', {
        method: 'POST',
        body: formData,
      });
      const data: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(isApiErrorPayload(data) && data.message ? data.message : t('ai.extractError'));
      }

      setPendingQuestions(mapGeneratedQuestionsToForm(parseGeneratedExamQuestions(data)));
      setShowReplaceModal(true);
    } catch (error) {
      toast.error(error instanceof Error && error.message !== 'INVALID_AI_RESPONSE'
        ? error.message
        : t('ai.invalidResponse'));
    } finally {
      setIsExtractingAI(false);
      setShowAIModal(false);
      setAiFile(null);
      setAiQuestionCount('5');
    }
  };

  const confirmAIQuestions = (mode: 'replace' | 'append') => {
    if (!pendingQuestions) return;

    if (mode === 'replace') {
      revokeQuestionsObjectUrls(questionsRef.current);
      setQuestions(pendingQuestions);
    } else {
      setQuestions((current) => [...current, ...pendingQuestions]);
    }

    closeReplaceModal();
    toast.success(t('ai.questionsUpdated'));
  };

  // ── submit ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (examDetails.courses.length === 0) {
        toast.error(t('create.validation.courseRequired'));
        return;
      }

      const formData = buildExamFormData(examDetails, questions, 'edit');

      // Submit directly using the helper.
      const response = await submitQuizUpdate(examId, formData);

      const responsePayload: unknown = await response.json().catch(() => null);
      const responseData = isApiErrorPayload(responsePayload) ? responsePayload : {};

      if (!response.ok) {
        const validationMessages = getApiErrorMessages(responseData.errors);
        if (validationMessages.length > 0) {
          validationMessages.forEach((message) => toast.error(message));
        } else {
          toast.error(responseData.message || responseData.details || t('edit.error'));
        }
        return;
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: quizKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: quizKeys.detail(Number(examId)) }),
      ]);
      toast.success(t('edit.success'));
      localStorage.removeItem(`exam_edit_form_draft_${examId}`);
      router.push('/exams');
    } catch (error) {
      toast.error(error instanceof Error && error.message !== 'UNAUTHORIZED'
        ? error.message
        : t('edit.unauthorized'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── loading / not found ──
  if (quizLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#2137D6]" />
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-[#64748B]">{t('edit.notFound')}</p>
        <Link href="/exams" className="text-[#2137D6] hover:underline">{t('edit.backToExams')}</Link>
      </div>
    );
  }

  // ── render ──
  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto pb-12">
      {/* AI Modal */}
      {showAIModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-800">{t('ai.title')}</h3>
                <p className="text-sm text-slate-500 mt-1">{t('ai.description')}</p>
              </div>
            </div>
            <form onSubmit={handleAIUpload} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-[#475569]">{t('ai.questionCount')}</label>
                <input
                  type="number"
                  min="1"
                  className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all"
                  value={aiQuestionCount}
                  onChange={e => setAiQuestionCount(e.target.value)}
                  placeholder={t('ai.questionCountPlaceholder')}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-[#475569]">{t('ai.pdfFile')} <span className="text-[#EF4444]">*</span></label>
                <input
                  type="file"
                  accept=".pdf"
                  required
                  className="w-full px-4 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm file:me-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-purple-100 file:text-purple-700 hover:file:bg-purple-200"
                  onChange={e => setAiFile(e.target.files?.[0] || null)}
                />
              </div>
              <div className="flex flex-col gap-3 mt-2">
                <button
                  type="submit"
                  disabled={isExtractingAI || !aiFile}
                  className="w-full flex justify-center items-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isExtractingAI ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {isExtractingAI ? t('ai.extracting') : t('ai.extract')}
                </button>
                <button
                  type="button"
                  onClick={closeAIModal}
                  disabled={isExtractingAI}
                  className="w-full px-4 py-3 text-slate-500 hover:text-slate-700 font-medium transition-colors disabled:opacity-50"
                >
                  {t('create.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Show Replace Modal */}
      {showReplaceModal && pendingQuestions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-800">{t('ai.replaceTitle')}</h3>
                <p className="text-sm text-slate-500 mt-1">
                  {t('ai.replaceDescription', { count: pendingQuestions.length })}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => confirmAIQuestions('replace')}
                className="w-full px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl transition-colors border border-red-200 shadow-sm"
              >
                {t('ai.replaceCurrent')}
              </button>
              <button 
                onClick={() => confirmAIQuestions('append')}
                className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-colors shadow-sm"
              >
                {t('ai.appendCurrent')}
              </button>
              <button 
                onClick={closeReplaceModal}
                className="w-full px-4 py-2 mt-2 text-slate-500 hover:text-slate-700 font-medium transition-colors"
              >
                {t('create.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/exams"
            className="p-2.5 bg-white border border-[#E2E8F0] rounded-xl text-[#64748B] hover:text-[#1E293B] hover:shadow-sm transition-all"
          >
            <BackIcon className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#1E293B]">{t('edit.pageTitle')}</h1>
            <p className="text-sm text-[#64748B] mt-0.5">{t('edit.pageDescription')}</p>
          </div>
        </div>

        {/* AI Upload Button */}
        <div>
          <button 
            type="button"
            onClick={() => {
              setAiFile(null);
              setAiQuestionCount('5');
              setShowAIModal(true);
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all shadow-purple-100 bg-purple-600 hover:bg-purple-700 text-white hover:shadow-md`}
          >
            <Sparkles className="w-4 h-4" />
            {t('ai.openButton')}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">

        {/* ── Exam Details ── */}
        <section className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#F1F5F9] bg-[#F8FAFC]/50 flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#2137D6]" />
            <h2 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider">{t('create.examTitle')}</h2>
          </div>
          <div className="p-6 flex flex-col gap-6">

            {/* Title */}
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-bold text-[#475569]">{t('create.examTitle')} <span className="text-[#EF4444]">*</span></label>
              <input
                type="text"
                placeholder={t('create.titlePlaceholder')}
                className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all placeholder:text-[#94A3B8]"
                value={examDetails.title}
                onChange={(e) => setExamDetails({ ...examDetails, title: e.target.value })}
                required
              />
            </div>

            <CourseTreeSelect
              value={examDetails.courses}
              onMultiChange={(val) => setExamDetails(prev => ({ ...prev, courses: val, chapter: '' }))}
              label={t('create.course')}
              multiple
              inline
              required
            />

            {/* Type & Chapter */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2 relative">
                <label className="text-[13px] font-bold text-[#475569]">{t('create.examType')} <span className="text-[#EF4444]">*</span></label>
                <select
                  className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all appearance-none cursor-pointer"
                  value={examDetails.type}
                  onChange={(e) => setExamDetails({ ...examDetails, type: e.target.value as 'exam' | 'homework' })}
                  required
                >
                  <option value="exam">{t('create.exam')}</option>
                  <option value="homework">{t('create.homework')}</option>
                </select>
                <ChevronDown className="absolute end-4 top-[42px] w-4 h-4 text-[#94A3B8] pointer-events-none" />
              </div>

              <div className="flex flex-col gap-2 relative">
                <label className="text-[13px] font-bold text-[#475569]">{t('create.chapter')}</label>
                <select
                  className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all appearance-none cursor-pointer disabled:opacity-50"
                  value={examDetails.chapter}
                  onChange={(e) => setExamDetails({ ...examDetails, chapter: e.target.value })}
                  disabled={examDetails.courses.length === 0 || chaptersLoading}
                >
                  <option value="">
                    {examDetails.courses.length === 0 ? t('create.selectCourseFirst') : chaptersLoading ? t('create.loading') : t('create.selectChapter')}
                  </option>
                  {filteredChapters?.map((ch) => (
                    <option key={ch.id} value={ch.id}>{ch.attributes.title}</option>
                  ))}
                </select>
                <ChevronDown className="absolute end-4 top-[42px] w-4 h-4 text-[#94A3B8] pointer-events-none" />
                {chaptersLoading && examDetails.courses.length > 0 && (
                  <Loader2 className="absolute end-10 top-[42px] w-4 h-4 text-[#2137D6] animate-spin" />
                )}
              </div>
            </div>

            {/* Duration, Marks, Attempts */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {([
                { label: t('create.duration'), icon: Clock, key: 'duration', min: 1 },
                { label: t('create.totalMarks'), icon: Award, key: 'totalMarks', min: 1 },
                { label: t('create.passingMarks'), icon: Award, key: 'passingMarks', min: 0 },
                { label: t('create.maxAttempts'), icon: RotateCcw, key: 'maxAttempts', min: 1 },
              ] satisfies ExamNumberField[]).map(({ label, icon: Icon, key, min }) => (
                <div key={key} className="flex flex-col gap-2">
                  <label className="text-[13px] font-bold text-[#475569]">{label} {(key === 'duration' || key === 'totalMarks') && <span className="text-[#EF4444]">*</span>}</label>
                  <div className="relative">
                    <Icon className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                    <input
                      type="number" min={min}
                      className="w-full ps-10 pe-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all"
                      value={readExamField(examDetails, key)}
                      onChange={(e) => setExamDetails({ ...examDetails, [key]: e.target.value })}
                      required={key === 'duration' || key === 'totalMarks'}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Start / End Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {([
                { label: t('create.startTime'), key: 'startTime' },
                { label: t('create.endTime'), key: 'endTime' },
              ] satisfies ExamDateField[]).map(({ label, key }) => (
                <div key={key} className="flex flex-col gap-2">
                  <label className="text-[13px] font-bold text-[#475569]">{label}</label>
                  <div className="relative">
                    <Calendar className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                    <input
                      type="datetime-local"
                      className="w-full ps-10 pe-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all"
                      value={readExamField(examDetails, key)}
                      onChange={(e) => setExamDetails({ ...examDetails, [key]: e.target.value })}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Status & Visibility */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2 relative">
                <label className="text-[13px] font-bold text-[#475569]">{t('status.label')} <span className="text-[#EF4444]">*</span></label>
                <select
                  className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all appearance-none cursor-pointer"
                  value={examDetails.status}
                  onChange={(e) => setExamDetails({ ...examDetails, status: e.target.value as 'Draft' | 'Active' })}
                  required
                >
                  <option value="Draft">{t('status.draft')}</option>
                  <option value="Active">{t('status.active')}</option>
                </select>
                <ChevronDown className="absolute end-4 top-[42px] w-4 h-4 text-[#94A3B8] pointer-events-none" />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-[#475569]">{t('create.visibility')}</label>
                <div className="flex items-center gap-3 px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
                  <input
                    type="checkbox" id="is_public"
                    className="w-4 h-4 text-[#2137D6] rounded border-[#E2E8F0] focus:ring-[#2137D6]"
                    checked={examDetails.is_public}
                    onChange={(e) => setExamDetails({ ...examDetails, is_public: e.target.checked })}
                  />
                  <label htmlFor="is_public" className="text-sm text-[#475569] cursor-pointer">
                    {t('create.public')}
                  </label>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Questions ── */}
        <div className="flex flex-col gap-8">
          {/* Insert at top button */}
          <div className="flex justify-center -mb-4 relative z-10">
            <button
              type="button"
              onClick={() => addQuestion(0)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E2E8F0] rounded-full text-xs font-bold text-[#2137D6] hover:bg-[#F8FAFC] hover:shadow-md transition-all group shadow-sm"
              title={t('create.addQuestionAtBeginning')}
            >
              <Plus className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform" />
              {t('create.addQuestion')} {t('create.insertHere')}
            </button>
          </div>

          {questions.map((q, index) => (
            <React.Fragment key={q.id}>
              <section className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-[#F1F5F9] bg-[#F8FAFC]/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-[#1E293B]">{t('create.question')} {index + 1}</h3>
                  <span className="text-xs px-2 py-1 bg-[#E0E7FF] text-[#2137D6] rounded-full">
                    {q.type === 'single_choice' ? t('create.singleChoice') :
                      q.type === 'multiple_choice' ? t('create.multipleChoice') :
                        q.type === 'true_false' ? t('create.trueFalse') :
                          t('create.shortAnswer')}
                  </span>
                </div>
                {questions.length > 1 && (
                  <button type="button" onClick={() => removeQuestion(q.id)}
                    className="p-1.5 text-[#EF4444] hover:bg-[#FEE2E2] rounded-lg transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="p-6 flex flex-col gap-6">
                {/* Type / Score / Auto-correct */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-2 relative">
                    <label className="text-[13px] font-bold text-[#475569]">{t('create.questionType')}</label>
                    <select
                      className="w-full px-4 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all appearance-none cursor-pointer"
                      value={q.type}
                      onChange={(e) => {
                        const newType = e.target.value as Question['type'];
                        const timestamp = Date.now();
                        const updates: Partial<Question> = newType === 'true_false'
                          ? {
                            type: newType,
                            answers: [
                              { id: `a-${timestamp}-1`, text: t('create.trueAnswer'), isCorrect: false, reason: '', image: null, imagePreview: '' },
                              { id: `a-${timestamp}-2`, text: t('create.falseAnswer'), isCorrect: false, reason: '', image: null, imagePreview: '' },
                            ],
                          }
                          : { type: newType };

                        updateQuestion(q.id, updates);
                      }}
                    >
                      <option value="single_choice">{t('create.singleChoice')}</option>
                      <option value="multiple_choice">{t('create.multipleChoice')}</option>
                      <option value="true_false">{t('create.trueFalse')}</option>
                      <option value="short_answer">{t('create.shortAnswer')}</option>
                    </select>
                    <ChevronDown className="absolute end-4 top-[38px] w-4 h-4 text-[#94A3B8] pointer-events-none" />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-bold text-[#475569]">{t('create.score')}</label>
                    <input
                      type="number" min="0"
                      className="w-full px-4 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all"
                      value={q.score}
                      onChange={(e) => updateQuestion(q.id, { score: parseInt(e.target.value) || 0 })}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-bold text-[#475569]">{t('create.autoCorrect')}</label>
                    <div className="flex items-center gap-3 px-4 py-2.5 bg-white border border-[#E2E8F0] rounded-xl h-[42px]">
                      <input
                        type="checkbox" id={`autoCorrect-${q.id}`}
                        className="w-4 h-4 text-[#2137D6] rounded border-[#E2E8F0] focus:ring-[#2137D6]"
                        checked={q.autoCorrect}
                        onChange={(e) => updateQuestion(q.id, { autoCorrect: e.target.checked })}
                      />
                      <label htmlFor={`autoCorrect-${q.id}`} className="text-sm text-[#475569] cursor-pointer">
                        {t('create.enableAutoCorrection')}
                      </label>
                    </div>
                  </div>
                </div>

                {/* Question Text */}
                <div className="flex flex-col gap-2">
                  <label className="text-[13px] font-bold text-[#475569]">{t('create.questionText')}</label>
                  <input
                    type="text"
                    placeholder={t('create.questionPlaceholder')}
                    className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all placeholder:text-[#94A3B8]"
                    value={q.text}
                    onChange={(e) => updateQuestion(q.id, { text: e.target.value })}
                  />
                </div>

                {/* Question Image */}
                <div className="flex flex-col gap-2">
                  <label className="text-[13px] font-bold text-[#475569]">{t('create.questionImage')}</label>
                  {q.imagePreview ? (
                    <div className="relative w-fit">
                      <Image src={q.imagePreview} alt={t('create.questionPreview')}
                        className="h-32 w-auto rounded-xl border border-[#E2E8F0] object-cover" />
                      <button type="button" onClick={() => handleQuestionImageChange(q.id, null)}
                        className="absolute top-2 end-2 p-1.5 bg-white/90 hover:bg-white text-[#EF4444] rounded-full shadow-sm transition-all">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="relative w-fit">
                      <input type="file" accept="image/*" className="hidden" id={`q-img-${q.id}`}
                        onChange={(e) => handleQuestionImageChange(q.id, e.target.files?.[0] || null)} />
                      <label htmlFor={`q-img-${q.id}`}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-dashed border-[#CBD5E1] rounded-xl text-sm text-[#64748B] hover:bg-[#F1F5F9] hover:border-[#94A3B8] transition-all cursor-pointer">
                        <ImagePlus className="w-4 h-4" />
                        {t('create.uploadImage')}
                      </label>
                    </div>
                  )}
                </div>

                {/* Answers */}
                {q.type !== 'short_answer' && (
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <label className="text-[13px] font-bold text-[#475569]">{t('create.answers')}</label>
                      {q.type !== 'true_false' && (
                        <button type="button" onClick={() => addAnswer(q.id)}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#2137D6] bg-[#E0E7FF] rounded-lg hover:bg-[#C7D2FF] transition-all">
                          <Plus className="w-3 h-3" />
                          {t('create.addAnswer')}
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {q.answers.map((answer, ansIndex) => (
                        <div key={answer.id} className="flex flex-col gap-2">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => toggleCorrectAnswer(q.id, answer.id)}
                              className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${answer.isCorrect ? 'bg-[#10B981] border-[#10B981] text-white' : 'border-[#E2E8F0] hover:border-[#10B981]'
                                }`}
                            >
                              {answer.isCorrect && (
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </button>

                            <input
                              type="text"
                              placeholder={`${t('create.answer')} ${ansIndex + 1}`}
                              className="flex-1 px-4 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all placeholder:text-[#94A3B8]"
                              value={answer.text}
                              onChange={(e) => updateAnswer(q.id, answer.id, { text: e.target.value })}
                              required
                            />

                            <input
                              type="text"
                              placeholder={t('create.reasonForAnswer', { number: ansIndex + 1 })}
                              className="flex-1 px-4 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all placeholder:text-[#94A3B8]"
                              value={answer.reason}
                              onChange={(e) => updateAnswer(q.id, answer.id, { reason: e.target.value })}
                            />

                            <div className="relative">
                              <input type="file" accept="image/*" className="hidden"
                                id={`a-img-${q.id}-${answer.id}`}
                                onChange={(e) => handleAnswerImageChange(q.id, answer.id, e.target.files?.[0] || null)} />
                              <label htmlFor={`a-img-${q.id}-${answer.id}`}
                                className={`flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer transition-all ${answer.imagePreview ? 'bg-[#E0E7FF] text-[#2137D6]' : 'bg-[#F8FAFC] text-[#94A3B8] hover:text-[#64748B]'
                                  }`}
                                title={answer.imagePreview ? t('create.changeImage') : t('create.addImage')}>
                                <ImagePlus className="w-4 h-4" />
                              </label>
                            </div>

                            {/* Reason image toggle */}
                            <div className="relative">
                              <input type="file" accept="image/*" className="hidden"
                                id={`a-reason-img-${q.id}-${answer.id}`}
                                onChange={(e) => handleAnswerReasonImageChange(q.id, answer.id, e.target.files?.[0] || null)} />
                              <label htmlFor={`a-reason-img-${q.id}-${answer.id}`}
                                className={`flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer transition-all ${answer.reasonImagePreview ? 'bg-[#E0E7FF] text-[#2137D6]' : 'bg-[#F8FAFC] text-[#94A3B8] hover:text-[#64748B]'
                                  }`}
                                title={answer.reasonImagePreview ? t('create.changeReasonImage') : t('create.addReasonImage')}>
                                <ImagePlus className="w-4 h-4 border border-[#2137D6] rounded-sm" />
                              </label>
                            </div>

                            {q.answers.length > 2 && q.type !== 'true_false' && (
                              <button type="button" onClick={() => removeAnswer(q.id, answer.id)}
                                className="p-1.5 text-[#EF4444] hover:bg-[#FEE2E2] rounded-lg transition-all">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>

                          <div className="flex gap-4 ms-9">
                            {/* Answer image preview */}
                            {answer.imagePreview && (
                              <div className="flex items-center gap-2">
                                <Image src={answer.imagePreview} alt={t('create.answerPreview', { number: ansIndex + 1 })}
                                  className="h-16 w-auto rounded-lg border border-[#E2E8F0] object-cover" />
                                <button type="button" onClick={() => handleAnswerImageChange(q.id, answer.id, null)}
                                  className="p-1.5 text-[#EF4444] hover:bg-[#FEE2E2] rounded-lg transition-all">
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            )}

                            {/* Reason image preview */}
                            {answer.reasonImagePreview && (
                              <div className="flex items-center gap-2">
                                <div className="relative">
                                  <Image src={answer.reasonImagePreview} alt={t('create.reasonPreview', { number: ansIndex + 1 })}
                                    className="h-16 w-auto rounded-lg border border-[#2137D6] object-cover" />
                                  <span className="absolute -top-2 -start-2 bg-[#2137D6] text-white text-[10px] px-1 rounded">{t('create.reasonLabel')}</span>
                                </div>
                                <button type="button" onClick={() => handleAnswerReasonImageChange(q.id, answer.id, null)}
                                  className="p-1.5 text-[#EF4444] hover:bg-[#FEE2E2] rounded-lg transition-all">
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <p className="text-xs text-[#64748B]">
                      {t('create.markCorrectHint')}
                      {q.type === 'multiple_choice' && t('create.multipleAllowed')}
                    </p>
                  </div>
                )}

                {/* Short Answer */}
                {q.type === 'short_answer' && (
                  <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-bold text-[#475569]">{t('create.expectedAnswer')}</label>
                    <textarea
                      placeholder={t('create.expectedAnswerPlaceholder')}
                      rows={3}
                      className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all placeholder:text-[#94A3B8] resize-none"
                      value={q.answers[0]?.text || ''}
                      onChange={(e) => updateAnswer(q.id, q.answers[0]?.id || '1', { text: e.target.value })}
                    />
                  </div>
                )}
              </div>
            </section>

            {/* Insert Question Button Between */}
            <div className="flex justify-center -my-4 relative z-10">
              <button
                type="button"
                onClick={() => addQuestion(index + 1)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E2E8F0] rounded-full text-xs font-bold text-[#2137D6] hover:bg-[#F8FAFC] hover:shadow-md transition-all group shadow-sm"
                title={`Add question after question ${index + 1}`}
              >
                <Plus className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform" />
                {t('create.addQuestion')} {index === questions.length - 1 ? '' : t('create.insertHere')}
              </button>
            </div>
          </React.Fragment>
        ))}
      </div>

        {/* Add Question */}
        <button type="button" onClick={() => addQuestion()}
          className="flex items-center gap-2 px-6 py-3 bg-white border border-[#E2E8F0] rounded-xl text-sm font-bold text-[#1E293B] hover:bg-[#F8FAFC] hover:shadow-sm transition-all w-fit">
          <Plus className="w-4 h-4" />
          {t('create.addQuestion')}
        </button>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-[#E2E8F0]">
          <button type="button" onClick={() => router.push('/exams')} disabled={isSubmitting}
            className="px-8 py-3 bg-white border border-[#E2E8F0] rounded-xl text-sm font-bold text-[#64748B] hover:bg-[#F8FAFC] hover:shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            {t('edit.cancel')}
          </button>
          <button type="submit" disabled={isSubmitting}
            className="px-10 py-3 bg-[#2137D6] hover:bg-[#1a2bb3] text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSubmitting ? t('edit.saving') : t('edit.saveChanges')}
          </button>
        </div>
      </form>
    </div>
  );
}
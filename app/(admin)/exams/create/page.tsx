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
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useChapters } from '@/src/hooks/useChapters';
import { quizKeys, useCreateQuiz } from '@/src/hooks/useQuizzes';
import { CourseTreeSelect } from '@/src/components/admin/CourseTreeSelect';
import { parseGeneratedExamQuestions } from '@/src/lib/exam-ai';
import {
  buildExamFormData,
  createReplacementPreview,
  getApiErrorMessages,
  isApiErrorPayload,
  mapGeneratedQuestionsToForm,
  revokeAnswerObjectUrls,
  revokeQuestionObjectUrls,
  revokeQuestionsObjectUrls,
  type ExamFormAnswer as Answer,
  type ExamFormDetails as ExamDetails,
  type ExamFormQuestion as Question,
} from '@/src/lib/exam-form';

export default function CreateExamPage() {
  const t = useTranslations('exams');
  const locale = useLocale();
  const BackIcon = locale === 'ar' ? ArrowRight : ArrowLeft;
  const router = useRouter();
  const { data: chapters, isLoading: chaptersLoading } = useChapters();
  const queryClient = useQueryClient();
  const { mutateAsync: createQuiz } = useCreateQuiz();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isExtractingAI, setIsExtractingAI] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiQuestionCount, setAiQuestionCount] = useState<string>('5');
  const [aiFile, setAiFile] = useState<File | null>(null);

  const [examDetails, setExamDetails] = useState<ExamDetails>({
    title: '',
    courses: [],
    chapter: '',
    type: 'exam',
    duration: '60',
    totalMarks: '100',
    passingMarks: '60',
    maxAttempts: '1',
    status: 'Draft',
    startTime: '',
    endTime: '',
    is_public: 'false' as 'true' | 'false' | 'included'
  });

  // Filter chapters based on selected course
  const filteredChapters = examDetails.courses.length > 0
    ? chapters?.filter(ch => examDetails.courses.includes(String(ch.attributes.course_id)))
    : chapters;

  const [questions, setQuestions] = useState<Question[]>([
    {
      id: '1',
      quizId: '',
      text: '',
      type: 'single_choice',
      score: 1,
      autoCorrect: true,
      answers: [
        { id: '1', text: '', isCorrect: false, reason: '' },
        { id: '2', text: '', isCorrect: false, reason: '' }
      ]
    }
  ]);

  const questionsRef = useRef(questions);
  questionsRef.current = questions;

  // Create routes must always start clean. Remove legacy drafts without restoring them.
  useEffect(() => {
    localStorage.removeItem('exam_create_form_draft');
    localStorage.removeItem('doctor_exam_create_form_draft');

    return () => revokeQuestionsObjectUrls(questionsRef.current);
  }, []);

  const closeAIModal = () => {
    if (isExtractingAI) return;
    setShowAIModal(false);
    setAiFile(null);
    setAiQuestionCount('5');
  };

  const addQuestion = (atIndex?: number) => {
    const newId = `new-${Date.now()}`;
    const newQuestion: Question = {
      id: newId,
      quizId: '',
      text: '',
      type: 'single_choice',
      score: 1,
      autoCorrect: true,
      image: null,
      imagePreview: '',
      answers: [
        { id: '1', text: '', isCorrect: false, reason: '', image: null, imagePreview: '', reason_image: null, reasonImagePreview: '' },
        { id: '2', text: '', isCorrect: false, reason: '', image: null, imagePreview: '', reason_image: null, reasonImagePreview: '' }
      ]
    };

    if (typeof atIndex === 'number') {
      const updatedQuestions = [...questions];
      updatedQuestions.splice(atIndex, 0, newQuestion);
      setQuestions(updatedQuestions);
    } else {
      setQuestions([...questions, newQuestion]);
    }
  };

  const removeQuestion = (id: string) => {
    if (questions.length <= 1) return;

    const removedQuestion = questions.find((question) => question.id === id);
    if (removedQuestion) revokeQuestionObjectUrls(removedQuestion);
    setQuestions((current) => current.filter((question) => question.id !== id));
  };

  const handleAIUpload = async (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!aiFile) {
      toast.error(t('ai.selectFileError'));
      return;
    }

    setIsExtractingAI(true);
    const titleWithoutExtension = aiFile.name.replace(/\.[^/.]+$/, '');

    try {
      const formData = new FormData();
      formData.append('file', aiFile);
      if (aiQuestionCount) formData.append('count', aiQuestionCount);

      const response = await fetch('http://31.97.36.130:5678/webhook/form', {
        method: 'POST',
        body: formData,
      });
      const data: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(isApiErrorPayload(data) && data.message ? data.message : t('ai.extractError'));
      }

      const newQuestions = mapGeneratedQuestionsToForm(parseGeneratedExamQuestions(data));
      revokeQuestionsObjectUrls(questionsRef.current);
      setExamDetails((current) => ({
        ...current,
        title: current.title || titleWithoutExtension,
      }));
      setQuestions(newQuestions);
      toast.success(t('ai.extractSuccess'));
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

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const addAnswer = (qId: string) => {
    setQuestions(questions.map(q => {
      if (q.id === qId) {
        const newAnswerId = (q.answers.length + 1).toString();
        return {
          ...q,
          answers: [...q.answers, { id: newAnswerId, text: '', isCorrect: false, reason: '', reason_image: null, reasonImagePreview: '' }]
        };
      }
      return q;
    }));
  };

  const removeAnswer = (qId: string, answerId: string) => {
    setQuestions((current) => current.map((question) => {
      if (question.id !== qId || question.answers.length <= 2) return question;

      const removedAnswer = question.answers.find((answer) => answer.id === answerId);
      if (removedAnswer) revokeAnswerObjectUrls(removedAnswer);
      return {
        ...question,
        answers: question.answers.filter((answer) => answer.id !== answerId),
      };
    }));
  };

  const updateAnswer = (qId: string, answerId: string, updates: Partial<Answer>) => {
    setQuestions(questions.map(q => {
      if (q.id === qId) {
        return {
          ...q,
          answers: q.answers.map(a => a.id === answerId ? { ...a, ...updates } : a)
        };
      }
      return q;
    }));
  };

  const toggleCorrectAnswer = (qId: string, answerId: string) => {
    setQuestions(questions.map(q => {
      if (q.id === qId) {
        if (q.type === 'single_choice' || q.type === 'true_false') {
          // Single choice - only one correct answer
          return {
            ...q,
            answers: q.answers.map(a => ({
              ...a,
              isCorrect: a.id === answerId ? !a.isCorrect : false
            }))
          };
        } else {
          // Multiple choice - toggle without affecting others
          return {
            ...q,
            answers: q.answers.map(a =>
              a.id === answerId ? { ...a, isCorrect: !a.isCorrect } : a
            )
          };
        }
      }
      return q;
    }));
  };

  const handleQuestionImageChange = (qId: string, file: File | null) => {
    setQuestions((current) => current.map((question) => question.id === qId
      ? {
        ...question,
        image: file,
        imagePreview: createReplacementPreview(question.imagePreview, file),
      }
      : question));
  };

  const handleAnswerImageChange = (qId: string, answerId: string, file: File | null) => {
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
  };

  const handleAnswerReasonImageChange = (qId: string, answerId: string, file: File | null) => {
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate a course is selected
      if (examDetails.courses.length === 0) {
        toast.error(t('create.validation.courseRequired'));
        setIsSubmitting(false);
        return;
      }

      const totalMarks = Number(examDetails.totalMarks) || 0;
      const currentScore = Number(questions.reduce((sum, q) => sum + (Number(q.score) || 0), 0).toFixed(2));
      if (currentScore !== totalMarks) {
        toast.error(locale === 'ar'
          ? `مجموع درجات الأسئلة (${currentScore}) يجب أن يساوي الدرجة الكلية (${totalMarks})`
          : `Total questions score (${currentScore}) must equal total marks (${totalMarks})`);
        setIsSubmitting(false);
        return;
      }

      const formData = buildExamFormData(examDetails, questions, 'create');

      // Get token not needed since api.ts handles it natively
      const responsePayload = await createQuiz(formData);

      if (!responsePayload) {
        throw new Error(t('create.error'));
      }

      // Refresh handled by hook
      localStorage.removeItem('exam_create_form_draft');
      toast.success(t('create.success'));
      router.push('/exams');
    } catch (error: any) {
      console.error('Error creating exam:', error);
      if (error?.errors) {
        const validationMessages = getApiErrorMessages(error.errors);
        if (validationMessages.length > 0) {
          validationMessages.forEach((message) => toast.error(message));
          setIsSubmitting(false);
          return;
        }
      }
      toast.error(error?.message || t('create.error'));
      setIsSubmitting(false);
    }
  };

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
            <h1 className="text-2xl font-bold text-[#1E293B]">{t('create.pageTitle')}</h1>
            <p className="text-sm text-[#64748B] mt-0.5">{t('create.pageDescription')}</p>
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
        {/* Exam Details Section */}
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

            {/* Type, Chapter */}
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
                    {examDetails.courses.length === 0
                      ? t('create.selectCourseFirst')
                      : chaptersLoading
                        ? t('create.loading')
                        : t('create.selectChapter')}
                  </option>
                  {filteredChapters?.map((chapter) => (
                    <option key={chapter.id} value={chapter.id}>
                      {chapter.attributes.title}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute end-4 top-[42px] w-4 h-4 text-[#94A3B8] pointer-events-none" />
                {chaptersLoading && examDetails.courses.length > 0 && <Loader2 className="absolute end-10 top-[42px] w-4 h-4 text-[#2137D6] animate-spin" />}
              </div>
            </div>

            {/* Duration, Marks, Attempts */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-[#475569]">{t('create.duration')} <span className="text-[#EF4444]">*</span></label>
                <div className="relative">
                  <Clock className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                  <input
                    type="number"
                    min="1"
                    className="w-full ps-10 pe-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all"
                    value={examDetails.duration}
                    onChange={(e) => setExamDetails({ ...examDetails, duration: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-[#475569]">{t('create.totalMarks')} <span className="text-[#EF4444]">*</span></label>
                <div className="relative">
                  <Award className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                  <input
                    type="number"
                    min="1"
                    className="w-full ps-10 pe-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all"
                    value={examDetails.totalMarks}
                    onChange={(e) => setExamDetails({ ...examDetails, totalMarks: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-[#475569]">{t('create.passingMarks')}</label>
                <div className="relative">
                  <Award className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="w-full ps-10 pe-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all"
                    value={examDetails.passingMarks}
                    onChange={(e) => setExamDetails({ ...examDetails, passingMarks: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-[#475569]">{t('create.maxAttempts')}</label>
                <div className="relative">
                  <RotateCcw className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                  <input
                    type="number"
                    min="1"
                    className="w-full ps-10 pe-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all"
                    value={examDetails.maxAttempts}
                    onChange={(e) => setExamDetails({ ...examDetails, maxAttempts: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Start/End Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-[#475569]">{t('create.startTime')}</label>
                <div className="relative">
                  <Calendar className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                  <input
                    type="datetime-local"
                    className="w-full ps-10 pe-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all"
                    value={examDetails.startTime}
                    onChange={(e) => setExamDetails({ ...examDetails, startTime: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-[#475569]">{t('create.endTime')}</label>
                <div className="relative">
                  <Calendar className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                  <input
                    type="datetime-local"
                    className="w-full ps-10 pe-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all"
                    value={examDetails.endTime}
                    onChange={(e) => setExamDetails({ ...examDetails, endTime: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Status & Published */}
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

              <div className="flex flex-col gap-2 relative">
                <label className="text-[13px] font-bold text-[#475569]">{t('create.visibility')} <span className="text-[#EF4444]">*</span></label>
                <select
                  className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all appearance-none cursor-pointer"
                  value={examDetails.is_public}
                  onChange={(e) => setExamDetails({ ...examDetails, is_public: e.target.value as 'true' | 'false' | 'included' })}
                  required
                >
                  <option value="true">{t('create.public') || 'Public'}</option>
                  <option value="false">{t('create.private') || 'Private'}</option>
                  <option value="included">{t('create.included') || 'Included'}</option>
                </select>
                <ChevronDown className="absolute end-4 top-[42px] w-4 h-4 text-[#94A3B8] pointer-events-none" />
              </div>
            </div>
          </div>
        </section>

        {/* Questions Section */}
        <div className="flex flex-col gap-8">
          <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-[#F1F5F9] shadow-sm">
            <div>
              <h2 className="text-base font-bold text-[#1E293B]">
                {locale === 'ar' ? 'الأسئلة' : 'Questions'}
              </h2>
              <p className={`text-sm mt-1 ${Number(questions.reduce((sum, q) => sum + (Number(q.score) || 0), 0).toFixed(2)) === (Number(examDetails.totalMarks) || 0) ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                {locale === 'ar'
                  ? `مجموع الدرجات الحالي: ${Number(questions.reduce((sum, q) => sum + (Number(q.score) || 0), 0).toFixed(2))} / ${examDetails.totalMarks}`
                  : `Current total score: ${Number(questions.reduce((sum, q) => sum + (Number(q.score) || 0), 0).toFixed(2))} / ${examDetails.totalMarks}`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                const total = Number(examDetails.totalMarks) || 0;
                if (questions.length > 0 && total > 0) {
                  const perQuestion = Number((total / questions.length).toFixed(2));
                  const newQuestions = questions.map(q => ({ ...q, score: perQuestion }));

                  const totalAssigned = Number((perQuestion * questions.length).toFixed(2));
                  const diff = Number((total - totalAssigned).toFixed(2));
                  if (diff !== 0) {
                    newQuestions[newQuestions.length - 1].score = Number((perQuestion + diff).toFixed(2));
                  }

                  setQuestions(newQuestions);
                  toast.success(locale === 'ar' ? 'تم توزيع الدرجات بنجاح' : 'Marks distributed successfully');
                }
              }}
              className="px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm font-bold text-[#2137D6] hover:bg-[#F1F5F9] transition-all"
            >
              {locale === 'ar' ? 'توزيع الدرجات بالتساوي' : 'Distribute marks equally'}
            </button>
          </div>

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
                    <button
                      type="button"
                      onClick={() => removeQuestion(q.id)}
                      className="p-1.5 text-[#EF4444] hover:bg-[#FEE2E2] rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="p-6 flex flex-col gap-6">
                  {/* Question Type & Score & Auto-correct */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-2 relative">
                      <label className="text-[13px] font-bold text-[#475569]">{t('create.questionType')}</label>
                      <select
                        className="w-full px-4 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all appearance-none cursor-pointer"
                        value={q.type}
                        onChange={(e) => {
                          const newType = e.target.value as Question['type'];
                          const updates: Partial<Question> = newType === 'true_false'
                            ? {
                              type: newType,
                              answers: [
                                { id: '1', text: t('create.trueAnswer'), isCorrect: false, reason: '' },
                                { id: '2', text: t('create.falseAnswer'), isCorrect: false, reason: '' },
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
                        type="number"
                        min="0"
                        className="w-full px-4 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all"
                        value={q.score}
                        onChange={(e) => updateQuestion(q.id, { score: parseInt(e.target.value) || 0 })}
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-[13px] font-bold text-[#475569]">{t('create.autoCorrect')}</label>
                      <div className="flex items-center gap-3 px-4 py-2.5 bg-white border border-[#E2E8F0] rounded-xl h-[42px]">
                        <input
                          type="checkbox"
                          id={`autoCorrect-${q.id}`}
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
                        <img
                          src={q.imagePreview}
                          alt={t('create.questionPreview')}
                          className="h-32 w-auto rounded-xl border border-[#E2E8F0] object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleQuestionImageChange(q.id, null)}
                          className="absolute top-2 end-2 p-1.5 bg-white/90 hover:bg-white text-[#EF4444] rounded-full shadow-sm transition-all"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="relative w-fit">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          id={`q-img-${q.id}`}
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            handleQuestionImageChange(q.id, file);
                          }}
                        />
                        <label
                          htmlFor={`q-img-${q.id}`}
                          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-dashed border-[#CBD5E1] rounded-xl text-sm text-[#64748B] hover:bg-[#F1F5F9] hover:border-[#94A3B8] transition-all cursor-pointer"
                        >
                          <ImagePlus className="w-4 h-4" />
                          {t('create.uploadImage')}
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Answers Section */}
                  {q.type !== 'short_answer' && (
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <label className="text-[13px] font-bold text-[#475569]">{t('create.answers')}</label>
                        {q.type !== 'true_false' && (
                          <button
                            type="button"
                            onClick={() => addAnswer(q.id)}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#2137D6] bg-[#E0E7FF] rounded-lg hover:bg-[#C7D2FF] transition-all"
                          >
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
                                className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${answer.isCorrect
                                  ? 'bg-[#10B981] border-[#10B981] text-white'
                                  : 'border-[#E2E8F0] hover:border-[#10B981]'
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
                              {/* Answer reason */}
                              <input
                                type="text"
                                placeholder={t('create.reasonForAnswer', { number: ansIndex + 1 })}
                                className="flex-1 px-4 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all placeholder:text-[#94A3B8] mt-2"
                                value={answer.reason}
                                onChange={(e) => updateAnswer(q.id, answer.id, { reason: e.target.value })}
                              />
                              {/* Answer image toggle */}
                              <div className="relative">
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  id={`a-img-${q.id}-${answer.id}`}
                                  onChange={(e) => {
                                    const file = e.target.files?.[0] || null;
                                    handleAnswerImageChange(q.id, answer.id, file);
                                  }}
                                />
                                <label
                                  htmlFor={`a-img-${q.id}-${answer.id}`}
                                  className={`flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer transition-all ${answer.imagePreview ? 'bg-[#E0E7FF] text-[#2137D6]' : 'bg-[#F8FAFC] text-[#94A3B8] hover:text-[#64748B]'
                                    }`}
                                  title={answer.imagePreview ? t('create.changeImage') : t('create.addImage')}
                                >
                                  <ImagePlus className="w-4 h-4" />
                                </label>
                              </div>

                              {/* Reason image toggle */}
                              <div className="relative">
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  id={`a-reason-img-${q.id}-${answer.id}`}
                                  onChange={(e) => {
                                    const file = e.target.files?.[0] || null;
                                    handleAnswerReasonImageChange(q.id, answer.id, file);
                                  }}
                                />
                                <label
                                  htmlFor={`a-reason-img-${q.id}-${answer.id}`}
                                  className={`flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer transition-all ${answer.reasonImagePreview ? 'bg-[#E0E7FF] text-[#2137D6]' : 'bg-[#F8FAFC] text-[#94A3B8] hover:text-[#64748B]'
                                    }`}
                                  title={answer.reasonImagePreview ? t('create.changeReasonImage') : t('create.addReasonImage')}
                                >
                                  <ImagePlus className="w-4 h-4 border border-[#2137D6] rounded-sm" />
                                </label>
                              </div>

                              {q.answers.length > 2 && q.type !== 'true_false' && (
                                <button
                                  type="button"
                                  onClick={() => removeAnswer(q.id, answer.id)}
                                  className="p-1.5 text-[#EF4444] hover:bg-[#FEE2E2] rounded-lg transition-all"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>

                            <div className="flex gap-4 ms-9">
                              {/* Answer image preview */}
                              {answer.imagePreview && (
                                <div className="flex items-center gap-2">
                                  <img
                                    src={answer.imagePreview}
                                    alt={t('create.answerPreview', { number: ansIndex + 1 })}
                                    className="h-16 w-auto rounded-lg border border-[#E2E8F0] object-cover"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleAnswerImageChange(q.id, answer.id, null)}
                                    className="p-1.5 text-[#EF4444] hover:bg-[#FEE2E2] rounded-lg transition-all"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              )}

                              {/* Reason image preview */}
                              {answer.reasonImagePreview && (
                                <div className="flex items-center gap-2">
                                  <div className="relative">
                                    <img
                                      src={answer.reasonImagePreview}
                                      alt={t('create.reasonPreview', { number: ansIndex + 1 })}
                                      className="h-16 w-auto rounded-lg border border-[#2137D6] object-cover"
                                    />
                                    <span className="absolute -top-2 -start-2 bg-[#2137D6] text-white text-[10px] px-1 rounded">{t('create.reasonLabel')}</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleAnswerReasonImageChange(q.id, answer.id, null)}
                                    className="p-1.5 text-[#EF4444] hover:bg-[#FEE2E2] rounded-lg transition-all"
                                  >
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

                  {/* Short Answer Expected Response */}
                  {q.type === 'short_answer' && (
                    <div className="flex flex-col gap-2">
                      <label className="text-[13px] font-bold text-[#475569]">{t('create.expectedAnswer')}</label>
                      <textarea
                        placeholder={t('create.expectedAnswerPlaceholder')}
                        rows={3}
                        className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all placeholder:text-[#94A3B8] resize-none"
                        value={q.answers[0]?.text || ''}
                        onChange={(e) => {
                          if (q.answers.length === 0) {
                            updateAnswer(q.id, '1', { text: e.target.value });
                          } else {
                            updateAnswer(q.id, q.answers[0].id, { text: e.target.value });
                          }
                        }}
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

        {/* Add Question Button */}
        <button
          type="button"
          onClick={() => addQuestion()}
          className="flex items-center gap-2 px-6 py-3 bg-white border border-[#E2E8F0] rounded-xl text-sm font-bold text-[#1E293B] hover:bg-[#F8FAFC] hover:shadow-sm transition-all w-fit"
        >
          <Plus className="w-4 h-4" />
          {t('create.addQuestion')}
        </button>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-[#E2E8F0]">
          <button
            type="button"
            onClick={() => router.push('/exams')}
            disabled={isSubmitting}
            className="px-8 py-3 bg-white border border-[#E2E8F0] rounded-xl text-sm font-bold text-[#64748B] hover:bg-[#F8FAFC] hover:shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('create.cancel')}
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-10 py-3 bg-[#2137D6] hover:bg-[#1a2bb3] text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting && (
              <Loader2 className="w-4 h-4 animate-spin" />
            )}
            {isSubmitting ? t('create.creating') : t('create.createExam')}
          </button>
        </div>
      </form>
    </div>
  );
}

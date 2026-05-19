"use client";

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  ArrowLeft,
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
  ImagePlus
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useCourses } from '@/src/hooks/useCourses';
import { useChapters } from '@/src/hooks/useChapters';
import { useQuiz, useUpdateQuiz } from '@/src/hooks/useQuizzes';
import { CourseTreeSelect } from '@/src/components/admin/CourseTreeSelect';

interface Answer {
  id: string;
  text: string;
  isCorrect: boolean;
  reason: string;
  image?: File | null;
  imagePreview?: string;
}

interface Question {
  id: string;
  text: string;
  type: 'single_choice' | 'multiple_choice' | 'true_false' | 'short_answer';
  score: number;
  autoCorrect: boolean;
  answers: Answer[];
  image?: File | null;
  imagePreview?: string;
}

interface ExamDetails {
  title: string;
  courses: string[];
  chapter: string;
  type: 'exam' | 'homework';
  duration: string;
  totalMarks: string;
  passingMarks: string;
  maxAttempts: string;
  status: 'Draft' | 'Active';
  startTime: string;
  endTime: string;
  is_public: boolean;
}

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

/** Rebuild FormData so every File entry has the correct MIME type */
async function rebuildFormData(source: FormData): Promise<FormData> {
  const rebuilt = new FormData();
  for (const [key, value] of source.entries()) {
    if (value instanceof File) {
      const buffer = await value.arrayBuffer();
      const blob = new Blob([buffer], { type: value.type || 'image/jpeg' });
      rebuilt.append(key, blob, value.name);
    } else {
      rebuilt.append(key, value);
    }
  }
  return rebuilt;
}

/** Submit the quiz update directly to the backend */
async function submitQuizUpdate(examId: string, formData: FormData): Promise<Response> {
  const token = getTokenFromCookies();

  if (!token) {
    throw new Error('Unauthorized - No token found. Please login again.');
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.learnoo.app';

  console.log('=== FormData Contents ===');
  let fileCount = 0;
  for (const [key, value] of formData.entries()) {
    if (value instanceof File) {
      console.log(`📁 ${key}: ${value.name} (${value.size} bytes)`);
      fileCount++;
    } else {
      console.log(`📝 ${key}: ${String(value).substring(0, 50)}`);
    }
  }
  console.log(`Total files: ${fileCount}`);

  const newFormData = await rebuildFormData(formData);

  console.log(`🚀 PUT ${apiUrl}/v1/quiz/${examId}`);

  return fetch(`${apiUrl}/v1/quiz/${examId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      // DO NOT set Content-Type – let FormData set the boundary
    },
    body: newFormData,
  });
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function EditExamPage() {
  const t = useTranslations('exams');
  const router = useRouter();
  const params = useParams();
  const examId = params.id as string;

  const { data: courses,     isLoading: coursesLoading  } = useCourses();
  const { data: chapters,    isLoading: chaptersLoading } = useChapters();
  const { data: quiz,        isLoading: quizLoading     } = useQuiz(parseInt(examId));
  const { isLoading: isUpdating } = useUpdateQuiz();


  const [isSubmitting, setIsSubmitting] = useState(false);

  const [examDetails, setExamDetails] = useState<ExamDetails>({
    title: '', courses: [], chapter: '', type: 'exam',
    duration: '60', totalMarks: '100', passingMarks: '60', maxAttempts: '1',
    status: 'Draft', startTime: '', endTime: '', is_public: false,
  });

  const [questions, setQuestions] = useState<Question[]>([]);

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
      title:       quiz.attributes.title || '',
      courses:   [String(quiz.attributes.course_id || '')].filter(Boolean),
      chapter:     quiz.attributes.chapter_id ? String(quiz.attributes.chapter_id) : '',
      type:        quiz.attributes.type === 'exam' ? 'exam' : 'homework',
      duration:    String(quiz.attributes.duration     || 60),
      totalMarks:  String(quiz.attributes.total_marks  || 100),
      passingMarks:String(quiz.attributes.passing_marks || 60),
      maxAttempts: String(quiz.attributes.max_attempts  || 1),
      startTime:   formatDateTimeForInput(quiz.attributes.start_time),
      endTime:     formatDateTimeForInput(quiz.attributes.end_time),
      is_public:   quiz.attributes.is_public || false,
      status:      quiz.attributes.status === 'active' ? 'Active' : 'Draft',
    });

    if (quiz.attributes.questions?.length) {
      setQuestions(
        quiz.attributes.questions.map((q) => ({
          id:          String(q.id),
          text:        q.attributes.text,
          type:        q.attributes.type,
          score:       q.attributes.score,
          autoCorrect: q.attributes.auto_correct ?? true,
          image:       null,
          imagePreview: q.attributes.image || '',          // ✅ existing image URL
          answers: q.attributes.answers?.map((ans) => ({
            id:          String(ans.attributes.id),        // ✅ real API id
            text:        ans.attributes.text,
            isCorrect:   ans.attributes.is_correct,
            reason:      ans.attributes.reason || '',
            image:       null,
            imagePreview: ans.attributes.image || '',      // ✅ existing image URL
          })) || [],
        }))
      );
    }
  }, [quiz]);

  // ── question helpers ──
  const addQuestion = () => {
    setQuestions((prev) => [...prev, {
      id: `new-${Date.now()}`, text: '', type: 'single_choice',
      score: 1, autoCorrect: true, image: null, imagePreview: '',
      answers: [
        { id: `a-${Date.now()}-1`, text: '', isCorrect: false, reason: '', image: null, imagePreview: '' },
        { id: `a-${Date.now()}-2`, text: '', isCorrect: false, reason: '', image: null, imagePreview: '' },
      ],
    }]);
  };

  const removeQuestion = (id: string) => {
    if (questions.length > 1) setQuestions((prev) => prev.filter(q => q.id !== id));
  };

  const updateQuestion = (id: string, updates: Partial<Question>) =>
    setQuestions((prev) => prev.map(q => q.id === id ? { ...q, ...updates } : q));

  const addAnswer = (qId: string) =>
    setQuestions((prev) => prev.map(q =>
      q.id === qId
        ? { ...q, answers: [...q.answers, { id: `a-${Date.now()}`, text: '', isCorrect: false, reason: '', image: null, imagePreview: '' }] }
        : q
    ));

  const removeAnswer = (qId: string, answerId: string) =>
    setQuestions((prev) => prev.map(q =>
      q.id === qId && q.answers.length > 2
        ? { ...q, answers: q.answers.filter(a => a.id !== answerId) }
        : q
    ));

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
    setQuestions((prev) => prev.map(q =>
      q.id === qId ? { ...q, image: file, imagePreview: file ? URL.createObjectURL(file) : '' } : q
    ));

  const handleAnswerImageChange = (qId: string, answerId: string, file: File | null) =>
    setQuestions((prev) => prev.map(q =>
      q.id === qId
        ? { ...q, answers: q.answers.map(a =>
            a.id === answerId ? { ...a, image: file, imagePreview: file ? URL.createObjectURL(file) : '' } : a
          )}
        : q
    ));

  // ── submit ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (examDetails.courses.length === 0) {
        alert('Please select at least one course');
        return;
      }

      // Build FormData
      const formData = new FormData();

      examDetails.courses.forEach(cid => formData.append('course_ids[]', cid));
      formData.append('course_id', examDetails.courses[0]);
      if (examDetails.chapter) formData.append('chapter_id', examDetails.chapter);
      formData.append('title',         examDetails.title);
      formData.append('type',          examDetails.type);
      formData.append('duration',      examDetails.duration);
      formData.append('total_marks',   examDetails.totalMarks);
      formData.append('passing_marks', examDetails.passingMarks);
      formData.append('max_attempts',  examDetails.maxAttempts);
      formData.append('is_public',     examDetails.is_public ? '1' : '0');   // ✅ boolean as 0/1
      formData.append('status',        examDetails.status.toLowerCase());
      if (examDetails.startTime) formData.append('start_time', examDetails.startTime);
      if (examDetails.endTime)   formData.append('end_time',   examDetails.endTime);

      questions.forEach((q, qIndex) => {
        formData.append(`questions[${qIndex}][text]`,         q.text);
        formData.append(`questions[${qIndex}][type]`,         q.type);
        formData.append(`questions[${qIndex}][score]`,        String(q.score));
        formData.append(`questions[${qIndex}][auto_correct]`, q.autoCorrect ? '1' : '0'); // ✅
        formData.append(`questions[${qIndex}][order]`,        String(qIndex + 1));

        if (q.image instanceof File) {
          formData.append(`questions[${qIndex}][image]`, q.image);
        }

        if (q.type !== 'short_answer') {
          q.answers.forEach((a, aIndex) => {
            formData.append(`questions[${qIndex}][answers][${aIndex}][text]`,       a.text);
            formData.append(`questions[${qIndex}][answers][${aIndex}][is_correct]`, a.isCorrect ? '1' : '0'); // ✅
            if (a.reason) formData.append(`questions[${qIndex}][answers][${aIndex}][reason]`, a.reason);
            if (a.image instanceof File) formData.append(`questions[${qIndex}][answers][${aIndex}][image]`, a.image);
          });
        }
      });

      // Submit directly using the helper (handles token + FormData rebuild)
      const response = await submitQuizUpdate(examId, formData);

      const responseData = await response.json().catch(() => ({ message: 'Failed to parse response' }));

      if (!response.ok) {
        console.error('❌ Update error:', responseData);
        alert(responseData.message || responseData.details || 'Failed to update exam');
        return;
      }

      console.log('✅ Quiz updated successfully:', responseData);
      alert('Exam updated successfully!');
      router.push('/exams');
    } catch (error) {
      console.error('Error updating exam:', error);
      alert(error instanceof Error ? error.message : 'Failed to update exam');
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
        <p className="text-[#64748B]">Exam not found</p>
        <Link href="/exams" className="text-[#2137D6] hover:underline">Back to Exams</Link>
      </div>
    );
  }

  // ── render ──
  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/exams"
          className="p-2.5 bg-white border border-[#E2E8F0] rounded-xl text-[#64748B] hover:text-[#1E293B] hover:shadow-sm transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">{t('edit.pageTitle')}</h1>
          <p className="text-sm text-[#64748B] mt-0.5">{t('edit.pageDescription')}</p>
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
                <ChevronDown className="absolute right-4 top-[42px] w-4 h-4 text-[#94A3B8] pointer-events-none" />
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
                <ChevronDown className="absolute right-4 top-[42px] w-4 h-4 text-[#94A3B8] pointer-events-none" />
                {chaptersLoading && examDetails.courses.length > 0 && (
                  <Loader2 className="absolute right-10 top-[42px] w-4 h-4 text-[#2137D6] animate-spin" />
                )}
              </div>
            </div>

            {/* Duration, Marks, Attempts */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: t('create.duration'),     icon: Clock,     key: 'duration',     min: 1  },
                { label: t('create.totalMarks'),   icon: Award,     key: 'totalMarks',   min: 1  },
                { label: t('create.passingMarks'), icon: Award,     key: 'passingMarks', min: 0  },
                { label: t('create.maxAttempts'),  icon: RotateCcw, key: 'maxAttempts',  min: 1  },
              ].map(({ label, icon: Icon, key, min }) => (
                <div key={key} className="flex flex-col gap-2">
                  <label className="text-[13px] font-bold text-[#475569]">{label} {(key === 'duration' || key === 'totalMarks') && <span className="text-[#EF4444]">*</span>}</label>
                  <div className="relative">
                    <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                    <input
                      type="number" min={min}
                      className="w-full pl-10 pr-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all"
                      value={(examDetails as any)[key]}
                      onChange={(e) => setExamDetails({ ...examDetails, [key]: e.target.value })}
                      required={key === 'duration' || key === 'totalMarks'}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Start / End Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { label: t('create.startTime'), key: 'startTime' },
                { label: t('create.endTime'),   key: 'endTime'   },
              ].map(({ label, key }) => (
                <div key={key} className="flex flex-col gap-2">
                  <label className="text-[13px] font-bold text-[#475569]">{label}</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                    <input
                      type="datetime-local"
                      className="w-full pl-10 pr-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all"
                      value={(examDetails as any)[key]}
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
                <ChevronDown className="absolute right-4 top-[42px] w-4 h-4 text-[#94A3B8] pointer-events-none" />
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
        <div className="flex flex-col gap-6">
          {questions.map((q, index) => (
            <section key={q.id} className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-[#F1F5F9] bg-[#F8FAFC]/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-[#1E293B]">{t('create.question')} {index + 1}</h3>
                  <span className="text-xs px-2 py-1 bg-[#E0E7FF] text-[#2137D6] rounded-full">
                    {q.type === 'single_choice'   ? t('create.singleChoice')   :
                     q.type === 'multiple_choice' ? t('create.multipleChoice') :
                     q.type === 'true_false'      ? t('create.trueFalse')      :
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
                      onChange={(e) => updateQuestion(q.id, { type: e.target.value as Question['type'] })}
                    >
                      <option value="single_choice">{t('create.singleChoice')}</option>
                      <option value="multiple_choice">{t('create.multipleChoice')}</option>
                      <option value="true_false">{t('create.trueFalse')}</option>
                      <option value="short_answer">{t('create.shortAnswer')}</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-[38px] w-4 h-4 text-[#94A3B8] pointer-events-none" />
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
                    <label className="text-[13px] font-bold text-[#475569]">Auto-correct</label>
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
                  <label className="text-[13px] font-bold text-[#475569]">Question Image</label>
                  {q.imagePreview ? (
                    <div className="relative w-fit">
                      <img src={q.imagePreview} alt="Question preview"
                        className="h-32 w-auto rounded-xl border border-[#E2E8F0] object-cover" />
                      <button type="button" onClick={() => handleQuestionImageChange(q.id, null)}
                        className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-white text-[#EF4444] rounded-full shadow-sm transition-all">
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
                        Upload Image
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
                              className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
                                answer.isCorrect ? 'bg-[#10B981] border-[#10B981] text-white' : 'border-[#E2E8F0] hover:border-[#10B981]'
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
                              placeholder={`Reason for answer ${ansIndex + 1}`}
                              className="flex-1 px-4 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all placeholder:text-[#94A3B8]"
                              value={answer.reason}
                              onChange={(e) => updateAnswer(q.id, answer.id, { reason: e.target.value })}
                            />

                            <div className="relative">
                              <input type="file" accept="image/*" className="hidden"
                                id={`a-img-${q.id}-${answer.id}`}
                                onChange={(e) => handleAnswerImageChange(q.id, answer.id, e.target.files?.[0] || null)} />
                              <label htmlFor={`a-img-${q.id}-${answer.id}`}
                                className={`flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer transition-all ${
                                  answer.imagePreview ? 'bg-[#E0E7FF] text-[#2137D6]' : 'bg-[#F8FAFC] text-[#94A3B8] hover:text-[#64748B]'
                                }`}
                                title={answer.imagePreview ? 'Change image' : 'Add image'}>
                                <ImagePlus className="w-4 h-4" />
                              </label>
                            </div>

                            {q.answers.length > 2 && q.type !== 'true_false' && (
                              <button type="button" onClick={() => removeAnswer(q.id, answer.id)}
                                className="p-1.5 text-[#EF4444] hover:bg-[#FEE2E2] rounded-lg transition-all">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>

                          {answer.imagePreview && (
                            <div className="flex items-center gap-2 ml-9">
                              <img src={answer.imagePreview} alt={`Answer ${ansIndex + 1} preview`}
                                className="h-16 w-auto rounded-lg border border-[#E2E8F0] object-cover" />
                              <button type="button" onClick={() => handleAnswerImageChange(q.id, answer.id, null)}
                                className="p-1.5 text-[#EF4444] hover:bg-[#FEE2E2] rounded-lg transition-all">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          )}
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
          ))}
        </div>

        {/* Add Question */}
        <button type="button" onClick={addQuestion}
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
          <button type="submit" disabled={isSubmitting || isUpdating}
            className="px-10 py-3 bg-[#2137D6] hover:bg-[#1a2bb3] text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
            {(isSubmitting || isUpdating) && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSubmitting || isUpdating ? t('edit.saving') : t('edit.saveChanges')}
          </button>
        </div>
      </form>
    </div>
  );
}
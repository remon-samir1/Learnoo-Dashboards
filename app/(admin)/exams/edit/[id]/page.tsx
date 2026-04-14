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
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useCourses } from '@/src/hooks/useCourses';
import { useChapters } from '@/src/hooks/useChapters';
import { useQuiz, useUpdateQuiz } from '@/src/hooks/useQuizzes';

interface Answer {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface Question {
  id: string;
  text: string;
  type: 'single_choice' | 'multiple_choice' | 'true_false' | 'short_answer';
  score: number;
  autoCorrect: boolean;
  answers: Answer[];
}

interface ExamDetails {
  title: string;
  course: string;
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

export default function EditExamPage() {
  const t = useTranslations('exams');
  const router = useRouter();
  const params = useParams();
  const examId = params.id as string;

  const { data: courses, isLoading: coursesLoading } = useCourses();
  const { data: chapters, isLoading: chaptersLoading } = useChapters();
  const { data: quiz, isLoading: quizLoading } = useQuiz(parseInt(examId));
  const { mutate: updateQuiz, isLoading: isUpdating } = useUpdateQuiz();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [examDetails, setExamDetails] = useState<ExamDetails>({
    title: '',
    course: '',
    chapter: '',
    type: 'exam',
    duration: '60',
    totalMarks: '100',
    passingMarks: '60',
    maxAttempts: '1',
    status: 'Draft',
    startTime: '',
    endTime: '',
    is_public: false
  });

  const [questions, setQuestions] = useState<Question[]>([]);

  // Helper to format ISO datetime to datetime-local format (YYYY-MM-DDTHH:MM)
  const formatDateTimeForInput = (isoString: string | null): string => {
    if (!isoString) return '';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';
    // Format to YYYY-MM-DDTHH:MM
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Filter chapters based on selected course
  const filteredChapters = examDetails.course
    ? chapters?.filter(ch => ch.attributes.course_id === parseInt(examDetails.course))
    : chapters;

  // Load quiz data when available
  useEffect(() => {
    if (quiz) {
      setExamDetails({
        title: quiz.attributes.title || '',
        course: quiz.attributes.course_id ? String(quiz.attributes.course_id) : '',
        chapter: quiz.attributes.chapter_id ? String(quiz.attributes.chapter_id) : '',
        type: quiz.attributes.type === 'exam' ? 'exam' : 'homework',
        duration: String(quiz.attributes.duration || 60),
        totalMarks: String(quiz.attributes.total_marks || 100),
        passingMarks: String(quiz.attributes.passing_marks || 60),
        maxAttempts: String(quiz.attributes.max_attempts || 1),
        startTime: formatDateTimeForInput(quiz.attributes.start_time),
        endTime: formatDateTimeForInput(quiz.attributes.end_time),
        is_public: quiz.attributes.is_public || false,
        status: (quiz.attributes.is_public || quiz.attributes.status === 'active') ? 'Active' : 'Draft'
      });

      // Load questions if available
      if (quiz.attributes.questions && quiz.attributes.questions.length > 0) {
        setQuestions(quiz.attributes.questions.map((q) => ({
          id: String(q.id),
          text: q.attributes.text,
          type: q.attributes.type,
          score: q.attributes.score,
          autoCorrect: q.attributes.auto_correct ?? true,
          answers: q.attributes.answers?.map((ans, idx) => ({
            id: String(idx + 1),
            text: ans.attributes.text,
            isCorrect: ans.attributes.is_correct
          })) || []
        })));
      }
    }
  }, [quiz]);

  const addQuestion = () => {
    const newId = (questions.length + 1).toString();
    setQuestions([...questions, {
      id: newId,
      text: '',
      type: 'single_choice',
      score: 1,
      autoCorrect: true,
      answers: [
        { id: '1', text: '', isCorrect: false },
        { id: '2', text: '', isCorrect: false }
      ]
    }]);
  };

  const removeQuestion = (id: string) => {
    if (questions.length > 1) {
      setQuestions(questions.filter(q => q.id !== id));
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
          answers: [...q.answers, { id: newAnswerId, text: '', isCorrect: false }]
        };
      }
      return q;
    }));
  };

  const removeAnswer = (qId: string, answerId: string) => {
    setQuestions(questions.map(q => {
      if (q.id === qId && q.answers.length > 2) {
        return {
          ...q,
          answers: q.answers.filter(a => a.id !== answerId)
        };
      }
      return q;
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
          return {
            ...q,
            answers: q.answers.map(a => ({
              ...a,
              isCorrect: a.id === answerId ? !a.isCorrect : false
            }))
          };
        } else {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate course is selected
      if (!examDetails.course) {
        alert('Please select a course');
        setIsSubmitting(false);
        return;
      }

      const quizData = {
        course_id: parseInt(examDetails.course),
        chapter_id: examDetails.chapter ? parseInt(examDetails.chapter) : undefined,
        title: examDetails.title,
        type: examDetails.type,
        duration: parseInt(examDetails.duration) || 60,
        total_marks: parseInt(examDetails.totalMarks) || 100,
        passing_marks: parseInt(examDetails.passingMarks) || 60,
        max_attempts: parseInt(examDetails.maxAttempts) || 1,
        is_public: examDetails.is_public,
        status: examDetails.status.toLowerCase() as 'draft' | 'active',
        start_time: examDetails.startTime || null,
        end_time: examDetails.endTime || null,
        questions: questions.map((q, i) => ({
          text: q.text,
          type: q.type,
          score: q.score,
          auto_correct: q.autoCorrect,
          answers: q.type === 'short_answer' ? undefined : q.answers.map(a => ({
            text: a.text,
            is_correct: a.isCorrect,
          })),
          order: i + 1,
        })),
      };

      await updateQuiz(parseInt(examId), quizData);

      alert('Exam updated successfully!');
    } catch (error) {
      console.error('Error updating exam:', error);
      alert('Failed to update exam. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <Link href="/exams" className="text-[#2137D6] hover:underline">
          Back to Exams
        </Link>
      </div>
    );
  }

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
                onChange={(e) => setExamDetails({...examDetails, title: e.target.value})}
                required
              />
            </div>

            {/* Type, Course, Center */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col gap-2 relative">
                <label className="text-[13px] font-bold text-[#475569]">{t('create.examType')} <span className="text-[#EF4444]">*</span></label>
                <select
                  className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all appearance-none cursor-pointer"
                  value={examDetails.type}
                  onChange={(e) => setExamDetails({...examDetails, type: e.target.value as 'exam' | 'homework'})}
                  required
                >
                  <option value="exam">{t('create.exam')}</option>
                  <option value="homework">{t('create.homework')}</option>
                </select>
                <ChevronDown className="absolute right-4 top-[42px] w-4 h-4 text-[#94A3B8] pointer-events-none" />
              </div>

              <div className="flex flex-col gap-2 relative">
                <label className="text-[13px] font-bold text-[#475569]">{t('create.course')} <span className="text-[#EF4444]">*</span></label>
                <select
                  className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all appearance-none cursor-pointer disabled:opacity-50"
                  value={examDetails.course}
                  onChange={(e) => setExamDetails({...examDetails, course: e.target.value, chapter: ''})}
                  disabled={coursesLoading}
                >
                  <option value="">{coursesLoading ? t('create.loading') : t('create.selectCourse')}</option>
                  {courses?.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.attributes.title}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-[42px] w-4 h-4 text-[#94A3B8] pointer-events-none" />
                {coursesLoading && <Loader2 className="absolute right-10 top-[42px] w-4 h-4 text-[#2137D6] animate-spin" />}
              </div>

              <div className="flex flex-col gap-2 relative">
                <label className="text-[13px] font-bold text-[#475569]">{t('create.chapter')}</label>
                <select
                  className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all appearance-none cursor-pointer disabled:opacity-50"
                  value={examDetails.chapter}
                  onChange={(e) => setExamDetails({...examDetails, chapter: e.target.value})}
                  disabled={chaptersLoading}
                >
                  <option value="">{chaptersLoading ? t('create.loading') : t('create.selectChapter')}</option>
                  {filteredChapters?.map((chapter) => (
                    <option key={chapter.id} value={chapter.id}>
                      {chapter.attributes.title}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-[42px] w-4 h-4 text-[#94A3B8] pointer-events-none" />
                {chaptersLoading && <Loader2 className="absolute right-10 top-[42px] w-4 h-4 text-[#2137D6] animate-spin" />}
              </div>
            </div>

            {/* Duration, Marks, Attempts */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-[#475569]">{t('create.duration')} <span className="text-[#EF4444]">*</span></label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                  <input
                    type="number"
                    min="1"
                    className="w-full pl-10 pr-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all"
                    value={examDetails.duration}
                    onChange={(e) => setExamDetails({...examDetails, duration: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-[#475569]">{t('create.totalMarks')} <span className="text-[#EF4444]">*</span></label>
                <div className="relative">
                  <Award className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                  <input
                    type="number"
                    min="1"
                    className="w-full pl-10 pr-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all"
                    value={examDetails.totalMarks}
                    onChange={(e) => setExamDetails({...examDetails, totalMarks: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-[#475569]">{t('create.passingMarks')}</label>
                <div className="relative">
                  <Award className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="w-full pl-10 pr-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all"
                    value={examDetails.passingMarks}
                    onChange={(e) => setExamDetails({...examDetails, passingMarks: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-[#475569]">{t('create.maxAttempts')}</label>
                <div className="relative">
                  <RotateCcw className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                  <input
                    type="number"
                    min="1"
                    className="w-full pl-10 pr-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all"
                    value={examDetails.maxAttempts}
                    onChange={(e) => setExamDetails({...examDetails, maxAttempts: e.target.value})}
                  />
                </div>
              </div>
            </div>

            {/* Start/End Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-[#475569]">{t('create.startTime')}</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                  <input
                    type="datetime-local"
                    className="w-full pl-10 pr-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all"
                    value={examDetails.startTime}
                    onChange={(e) => setExamDetails({...examDetails, startTime: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-[#475569]">{t('create.endTime')}</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                  <input
                    type="datetime-local"
                    className="w-full pl-10 pr-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all"
                    value={examDetails.endTime}
                    onChange={(e) => setExamDetails({...examDetails, endTime: e.target.value})}
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
                  onChange={(e) => setExamDetails({...examDetails, status: e.target.value as 'Draft' | 'Active'})}
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
                    type="checkbox"
                    id="is_public"
                    className="w-4 h-4 text-[#2137D6] rounded border-[#E2E8F0] focus:ring-[#2137D6]"
                    checked={examDetails.is_public}
                    onChange={(e) => setExamDetails({...examDetails, is_public: e.target.checked})}
                  />
                  <label htmlFor="is_public" className="text-sm text-[#475569] cursor-pointer">
                    {t('create.public')}
                  </label>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Questions Section */}
        <div className="flex flex-col gap-6">
          {questions.map((q, index) => (
            <section key={q.id} className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm overflow-hidden">
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
                      type="number"
                      min="0"
                      className="w-full px-4 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all"
                      value={q.score}
                      onChange={(e) => updateQuestion(q.id, { score: parseInt(e.target.value) || 0 })}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-bold text-[#475569]">Auto-correct</label>
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
                  <label className="text-[13px] font-bold text-[#475569]">{t('create.questionText')} <span className="text-[#EF4444]">*</span></label>
                  <input
                    type="text"
                    placeholder={t('create.questionPlaceholder')}
                    className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all placeholder:text-[#94A3B8]"
                    value={q.text}
                    onChange={(e) => updateQuestion(q.id, { text: e.target.value })}
                    required
                  />
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
                        <div key={answer.id} className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => toggleCorrectAnswer(q.id, answer.id)}
                            className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
                              answer.isCorrect
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
          ))}
        </div>

        {/* Add Question Button */}
        <button
          type="button"
          onClick={addQuestion}
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
            {t('edit.cancel')}
          </button>
          <button
            type="submit"
            disabled={isSubmitting || isUpdating}
            className="px-10 py-3 bg-[#2137D6] hover:bg-[#1a2bb3] text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {(isSubmitting || isUpdating) && (
              <Loader2 className="w-4 h-4 animate-spin" />
            )}
            {isSubmitting || isUpdating ? t('edit.saving') : t('edit.saveChanges')}
          </button>
        </div>
      </form>
    </div>
  );
}

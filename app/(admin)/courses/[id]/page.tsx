'use client';

import React, { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import {
  ArrowLeft,
  Video,
  BookOpen,
  FileText,
  Users,
  Layers,
  Edit3,
  BarChart3,
  ClipboardList,
  Loader2,
  Power,
  Upload,
  CheckCircle,
  Copy,
  Search,
  X,
  Plus
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { StatCard } from '@/components/StatCard';
import { ProgressBar } from '@/components/ProgressBar';
import { useCourse } from '@/src/hooks/useCourses';
import { useLectures } from '@/src/hooks/useLectures';
import { useCodes, useActivateCode, useUploadPreActivation } from '@/src/hooks';
import { useStudents } from '@/src/hooks/useStudents';
import { useCurrentUser } from '@/src/hooks/useAuth';
import toast from 'react-hot-toast';

export default function CourseDetailPage() {
  const t = useTranslations();
  const { id } = useParams();
  const courseId = Number(id);

  const { data: course, isLoading: courseLoading, error: courseError } = useCourse(courseId);
  const { data: lectures, isLoading: lecturesLoading } = useLectures({ course_id: courseId });
  const { data: codes, isLoading: codesLoading, refetch: refetchCodes } = useCodes();
  const { mutate: activateCode, isLoading: isActivating } = useActivateCode();
  const { mutate: uploadPreActivation, isLoading: isUploadingPreActivation } = useUploadPreActivation();
  const { data: students } = useStudents();
  const { canUseActivations } = useCurrentUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const preactivationFileRef = useRef<HTMLInputElement>(null);

  // Activation state
  const [selectedCode, setSelectedCode] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [activationTab, setActivationTab] = useState<'code' | 'preactivation'>('code');
  const [uploadedNumbers, setUploadedNumbers] = useState<string[]>([]);
  const [preactivationNumbers, setPreactivationNumbers] = useState<string[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const [preactivationResults, setPreactivationResults] = useState<{ success: number; failed: number; count: number } | null>(null);

  // Filter codes for this course
  const courseCodes = codes?.filter(
    (code) =>
      code.attributes.codeable_type === 'App\\Models\\Course' &&
      code.attributes.codeable_id === courseId &&
      !code.attributes.is_used
  ) || [];

  const filteredStudents = students?.data?.filter((student: any) => {
    const fullName = `${student.attributes.first_name} ${student.attributes.last_name}`.toLowerCase();
    const email = student.attributes.email?.toLowerCase() || '';
    const search = studentSearch.toLowerCase();
    return fullName.includes(search) || email.includes(search);
  }) || [];

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(t('courses.messages.codeCopied'));
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleActivate = async () => {
    if (!selectedCode || !selectedStudent) {
      toast.error(t('courses.messages.selectCodeAndStudent'));
      return;
    }

    const code = codes?.find((c) => c.id === selectedCode);
    if (!code) return;

    try {
      await activateCode({
        code: code.attributes.code,
        item_id: courseId,
        item_type: 'course',
        user_id: selectedStudent,
      });
      toast.success(t('courses.messages.courseActivated'));
      setSelectedCode('');
      setSelectedStudent('');
      setStudentSearch('');
      refetchCodes();
    } catch {
      // Error handled by hook
    }
  };

  const handlePreactivationFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setPreactivationNumbers([]);
      return;
    }

    // Read file to show preview
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const numbers = text
        .split(/[\n,\r,;]/)
        .map((n) => n.trim())
        .filter((n) => n.length > 0);
      setPreactivationNumbers(numbers);
      setPreactivationResults(null);
      toast.success(`${numbers.length} ${t('courses.view.preactivation.numbersReady')}`);
    };
    reader.readAsText(file);
  };

  const clearPreactivationNumbers = () => {
    setPreactivationNumbers([]);
    setPreactivationResults(null);
    if (preactivationFileRef.current) {
      preactivationFileRef.current.value = '';
    }
  };

  const handlePreactivationUpload = async () => {
    const file = preactivationFileRef.current?.files?.[0];
    if (!file) {
      toast.error(t('courses.view.preactivation.selectFile'));
      return;
    }

    try {
      const result = await uploadPreActivation({ item_id: courseId, item_type: 'course', file });
      setPreactivationResults({
        success: result.activated || 0,
        failed: result.skipped || 0,
        count: result.total_phones || 0
      });
      toast.success(result.message || `${t('courses.view.preactivation.success')} ${result.total_phones || 0}`);
      refetchCodes();
      // Clear the file after successful upload
      if (preactivationFileRef.current) {
        preactivationFileRef.current.value = '';
      }
      setPreactivationNumbers([]);
    } catch {
      toast.error(t('courses.view.preactivation.failed'));
    }
  };
  
  // For simplicity in this view, we'll show lectures and their chapter counts.
  // If we wanted to show all chapters, we might need a more complex join or multiple fetches.
  // The original design had "chapters" as the main list items, but typical structure is Course -> Lectures -> Chapters.
  // The provided design shows "Lecture 1: Kinematics" as an item with "4 Chapters".
  
  const isLoading = courseLoading || lecturesLoading;

  if (courseLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-[#2137D6]" />
        <p className="text-[#64748B] font-medium">{t('courses.view.loading')}</p>
      </div>
    );
  }

  if (courseError || !course) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="p-4 bg-red-50 rounded-2xl border border-red-100 text-red-600 max-w-md text-center">
          <p className="font-bold mb-1">{t('courses.view.error')}</p>
          <p className="text-sm">{courseError || t('courses.view.notFound')}</p>
        </div>
        <Link
          href="/courses"
          className="px-6 py-2 bg-white border border-[#E2E8F0] rounded-xl text-sm font-bold text-[#64748B] hover:bg-[#F8FAFC] transition-all"
        >
          {t('courses.view.backToCourses')}
        </Link>
      </div>
    );
  }

  const attributes = course.attributes;

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            href="/courses"
            className="p-2.5 bg-white border border-[#E2E8F0] rounded-xl text-[#64748B] hover:text-[#1E293B] hover:shadow-sm transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-[#1E293B]">{attributes.title}</h1>
              <span className={`px-2 py-1 ${attributes.status === 1 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'} rounded-md text-[10px] font-bold uppercase tracking-wider`}>
                {attributes.status === 1 ? t('courses.view.active') : t('courses.view.inactive')}
              </span>
            </div>
            <p className="text-sm text-[#64748B] mt-0.5">
              {attributes.sub_title}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/departments"
            className="px-5 py-2.5 bg-white border border-[#E2E8F0] text-[#475569] rounded-xl text-sm font-bold hover:bg-[#F8FAFC] transition-all"
          >
            {t('courses.view.manageContent')}
          </Link>
          <Link
            href={`/courses/${id}/edit`}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#2137D6] hover:bg-[#1a2bb3] text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-200"
          >
            <Edit3 className="w-4 h-4" />
            {t('courses.view.editCourse')}
          </Link>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard icon={Layers} value={attributes.stats?.lectures?.toString() || "0"} label={t('courses.view.stats.lectures')} />
        <StatCard icon={Video} value={attributes.stats?.chapters?.toString() || "0"} label={t('courses.view.stats.chapters')} />
        <StatCard icon={BookOpen} value={attributes.stats?.notes?.toString() || "0"} label={t('courses.view.stats.notes')} />
        <StatCard icon={FileText} value={attributes.stats?.exams?.toString() || "0"} label={t('courses.view.stats.exams')} />
        <StatCard icon={Users} value={attributes.stats?.students?.toString() || "0"} label={t('courses.view.stats.students')} />
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Content */}
        <div className="flex-1 flex flex-col gap-6">
          <section className="bg-white rounded-2xl border border-[#F1F5F9] p-6 shadow-sm">
            <h2 className="text-lg font-bold text-[#1E293B] mb-4">{t('courses.view.sections.description')}</h2>
            <p className="text-sm text-[#64748B] leading-relaxed whitespace-pre-wrap">
              {attributes.description}
            </p>
          </section>

          <section className="bg-white rounded-2xl border border-[#F1F5F9] p-6 shadow-sm">
            <h2 className="text-lg font-bold text-[#1E293B] mb-4">{t('courses.view.sections.objectives')}</h2>
            <p className="text-sm text-[#64748B] leading-relaxed whitespace-pre-wrap">
              {attributes.objectives}
            </p>
          </section>

          <section className="bg-white rounded-2xl border border-[#F1F5F9] p-6 shadow-sm">
            <h2 className="text-lg font-bold text-[#1E293B] mb-6">{t('courses.view.sections.lecturesContent')}</h2>
            <div className="flex flex-col gap-3">
              {attributes.lectures && attributes.lectures.length > 0 ? (
                attributes.lectures.map((lecture: any, idx: number) => (
                  <div key={lecture.id} className="flex items-center justify-between p-4 bg-[#F8FAFC] border border-[#F1F5F9] rounded-xl hover:border-[#2137D6]/20 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-lg border border-[#E2E8F0] flex items-center justify-center text-sm font-bold text-[#2137D6]">
                        {idx + 1}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-[#1E293B]">{lecture.attributes.title}</h4>
                        <p className="text-xs text-[#94A3B8] mt-1 line-clamp-1">{lecture.attributes.description}</p>
                      </div>
                    </div>
                    <button className="px-3 py-1 bg-white border border-[#E2E8F0] rounded-lg text-[10px] font-bold text-[#64748B] hover:border-[#2137D6] hover:text-[#2137D6] transition-colors">
                      {t('courses.view.viewDetails')}
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[#94A3B8]">{t('courses.view.noLectures')}</p>
              )}
            </div>
          </section>
        </div>

        {/* Sidebar Widgets */}
        <div className="w-full lg:w-80 flex flex-col gap-6">
          {/* Performance Card */}
          <section className="bg-white rounded-2xl border border-[#F1F5F9] p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="w-4 h-4 text-[#2137D6]" />
              <h2 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider">{t('courses.view.sections.performance')}</h2>
            </div>
            <div className="flex flex-col gap-6">
              <ProgressBar label={t('courses.view.stats.lectures')} value={0} colorClass="bg-[#10B981]" />
              <ProgressBar label={t('courses.view.stats.chapters')} value={0} colorClass="bg-[#2137D6]" />
            </div>
          </section>

          {/* Details Card */}
          <section className="bg-white rounded-2xl border border-[#F1F5F9] p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <ClipboardList className="w-4 h-4 text-[#2137D6]" />
              <h2 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider">{t('courses.view.sections.courseDetails')}</h2>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[#94A3B8] font-bold">{t('courses.view.labels.price')}</p>
                <p className="text-xs font-bold text-[#475569] mt-1">{attributes.price} EGP</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[#94A3B8] font-bold">{t('courses.view.labels.visibility')}</p>
                <p className="text-xs font-bold text-[#475569] mt-1 capitalize">{attributes.visibility}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[#94A3B8] font-bold">{t('courses.view.labels.maxViews')}</p>
                <p className="text-xs font-bold text-[#475569] mt-1">{attributes.max_views_per_student} {t('courses.view.labels.perStudent')}</p>
              </div>
               <div>
                <p className="text-[10px] uppercase tracking-wider text-[#94A3B8] font-bold">{t('courses.view.labels.createdAt')}</p>
                <p className="text-xs font-bold text-[#475569] mt-1">
                  {attributes.created_at ? new Date(attributes.created_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </section>

          {/* Activation Card */}
          {canUseActivations && (
          <section className="bg-white rounded-2xl border border-[#F1F5F9] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Power className="w-4 h-4 text-[#2137D6]" />
                <h2 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider">{t('courses.view.sections.activation')}</h2>
              </div>
              <Link
                href={`/activation/generate?course_id=${courseId}`}
                className="p-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#64748B] hover:text-[#2137D6] hover:border-[#2137D6] transition-all"
                title={t('courses.view.generateCodes')}
              >
                <Plus className="w-4 h-4" />
              </Link>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 mb-4 bg-[#F8FAFC] rounded-lg p-1">
              <button
                onClick={() => setActivationTab('code')}
                className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition-all ${
                  activationTab === 'code'
                    ? 'bg-white text-[#2137D6] shadow-sm'
                    : 'text-[#64748B] hover:text-[#1E293B]'
                }`}
              >
                {t('courses.view.activationTabs.byCode')}
              </button>
              <button
                onClick={() => setActivationTab('preactivation')}
                className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition-all ${
                  activationTab === 'preactivation'
                    ? 'bg-white text-[#2137D6] shadow-sm'
                    : 'text-[#64748B] hover:text-[#1E293B]'
                }`}
              >
                {t('courses.view.activationTabs.preactivation')}
              </button>
            </div>

            {activationTab === 'code' ? (
              <div className="flex flex-col gap-4">
                {/* Available Codes */}
                <div>
                  <label className="text-xs font-bold text-[#64748B] mb-2 block">{t('courses.view.availableCodes')} ({courseCodes.length})</label>
                  {codesLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-5 h-5 animate-spin text-[#2137D6]" />
                    </div>
                  ) : courseCodes.length > 0 ? (
                    <div className="max-h-32 overflow-y-auto border border-[#E2E8F0] rounded-xl p-2 flex flex-col gap-1">
                      {courseCodes.map((code) => (
                        <label
                          key={code.id}
                          className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                            selectedCode === code.id ? 'bg-[#EEF2FF] border border-[#2137D6]' : 'hover:bg-[#F8FAFC] border border-transparent'
                          }`}
                        >
                          <input
                            type="radio"
                            name="code"
                            value={code.id}
                            checked={selectedCode === code.id}
                            onChange={(e) => setSelectedCode(e.target.value)}
                            className="w-4 h-4 text-[#2137D6]"
                          />
                          <span className="flex-1 font-mono text-xs text-[#1E293B]">{code.attributes.code}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyCode(code.attributes.code);
                            }}
                            className="p-1 hover:bg-[#EEF2FF] rounded transition-colors"
                          >
                            {copiedCode === code.attributes.code ? (
                              <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 text-[#94A3B8]" />
                            )}
                          </button>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#94A3B8] italic">{t('activation.messages.noCodesAvailable')}</p>
                  )}
                </div>

                {/* Student Selection */}
                <div>
                  <label className="text-xs font-bold text-[#64748B] mb-2 block">{t('courses.view.selectStudent')}</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                    <input
                      type="text"
                      placeholder={t('courses.view.searchStudents')}
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10"
                    />
                  </div>
                  {studentSearch && (
                    <div className="mt-2 max-h-32 overflow-y-auto border border-[#E2E8F0] rounded-xl p-2 flex flex-col gap-1">
                      {filteredStudents.length > 0 ? (
                        filteredStudents.map((student: any) => (
                          <label
                            key={student.id}
                            className={`flex flex-col p-2 rounded-lg cursor-pointer transition-colors ${
                              selectedStudent === student.id ? 'bg-[#EEF2FF]' : 'hover:bg-[#F8FAFC]'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="radio"
                                name="student"
                                value={student.id}
                                checked={selectedStudent === student.id}
                                onChange={(e) => {
                                  setSelectedStudent(e.target.value);
                                  setStudentSearch(`${student.attributes.first_name} ${student.attributes.last_name}`);
                                }}
                                className="w-4 h-4 text-[#2137D6]"
                              />
                              <span className="text-xs font-medium text-[#1E293B]">
                                {student.attributes.first_name} {student.attributes.last_name}
                              </span>
                            </div>
                            <span className="text-[10px] text-[#94A3B8] pl-6">{student.attributes.email}</span>
                          </label>
                        ))
                      ) : (
                        <p className="text-xs text-[#94A3B8] italic">{t('courses.view.noStudentsFound')}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Activate Button */}
                <button
                  onClick={handleActivate}
                  disabled={isActivating || !selectedCode || !selectedStudent}
                  className="w-full py-2.5 bg-[#2137D6] hover:bg-[#1a2bb3] text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isActivating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t('courses.view.activating')}
                    </>
                  ) : (
                    <>
                      <Power className="w-4 h-4" />
                      {t('courses.view.activate')}
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="p-3 bg-[#EEF2FF] rounded-xl border border-[#2137D6]/20">
                  <p className="text-xs text-[#2137D6]">
                    <span className="font-bold">{t('courses.view.preactivation.title')}:</span> {t('courses.view.preactivation.description')}
                  </p>
                </div>

                {/* File Upload */}
                <div>
                  <label className="text-xs font-bold text-[#64748B] mb-2 block">{t('courses.view.preactivation.title')}</label>
                  <p className="text-[10px] text-[#94A3B8] mb-2">Supported: .txt, .csv (one phone per line)</p>
                  <input
                    ref={preactivationFileRef}
                    type="file"
                    accept=".txt,.csv"
                    onChange={handlePreactivationFileSelect}
                    className="hidden"
                  />
                  <button
                    onClick={() => preactivationFileRef.current?.click()}
                    className="w-full py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-[#EEF2FF] hover:border-[#2137D6] text-[#475569] rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    {t('students.import.selectFile')}
                  </button>
                </div>

                {/* Phone Numbers Preview */}
                {preactivationNumbers.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-[#64748B]">{t('courses.view.preactivation.title')} ({preactivationNumbers.length})</label>
                      <button
                        onClick={clearPreactivationNumbers}
                        className="text-[10px] text-red-500 hover:text-red-600 flex items-center gap-1"
                      >
                        <X className="w-3 h-3" />
                        {t('courses.view.preactivation.clear')}
                      </button>
                    </div>
                    <div className="max-h-32 overflow-y-auto bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3">
                      <div className="flex flex-wrap gap-2">
                        {preactivationNumbers.map((num, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-white border border-[#E2E8F0] rounded-lg text-xs text-[#475569]"
                          >
                            {num}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Pre-activate Button */}
                <button
                  onClick={handlePreactivationUpload}
                  disabled={preactivationNumbers.length === 0 || isUploadingPreActivation}
                  className="w-full py-2.5 bg-[#10B981] hover:bg-[#059669] text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isUploadingPreActivation ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t('students.import.uploading')}
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      {t('courses.view.preactivation.upload')} {preactivationNumbers.length > 0 && `(${preactivationNumbers.length})`}
                    </>
                  )}
                </button>

                {/* Pre-activation Results */}
                {preactivationResults && (
                  <div className="mt-2 p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                    <p className="text-xs font-bold text-[#1E293B] mb-2">{t('courses.view.preactivation.title')}:</p>
                    <div className="flex items-center gap-4 mb-3">
                      <span className="text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        {t('students.import.success')}: {preactivationResults.success}
                      </span>
                      {preactivationResults.failed > 0 && (
                        <span className="text-xs text-red-600 flex items-center gap-1">
                          <X className="w-3.5 h-3.5" />
                          {t('students.import.failed')}: {preactivationResults.failed}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
          )}
        </div>
      </div>
    </div>
  );
}


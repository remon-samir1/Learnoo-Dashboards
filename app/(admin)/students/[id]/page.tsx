"use client";

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  ArrowLeft,
  Edit2,
  Key,
  Mail,
  Phone,
  Calendar,
  GraduationCap,
  BookOpen,
  ClipboardList,
  ShieldCheck,
  Layout,
  User,
  ExternalLink,
  ChevronRight,
  MapPin,
  Clock,
  Smartphone,
  Globe,
  MoreVertical,
  Building2,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useStudent, useResetStudentPassword } from '@/src/hooks/useStudents';
import ResetPasswordModal from '@/components/modals/ResetPasswordModal';
import { StudentStatusLabels } from '@/src/types';

// Helper to get initials from name
function getInitials(firstName: string | null | undefined, lastName: string | null | undefined) {
  const first = (firstName || '')[0] || '';
  const last = (lastName || '')[0] || '';
  return (first + last).toUpperCase();
}

export default function StudentProfilePage() {
  const t = useTranslations();
  const params = useParams();
  const studentId = params.id as string;
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState<string | undefined>(undefined);
  const [resetError, setResetError] = useState<string | null>(null);

  // Fetch student data
  const { data: studentResponse, isLoading, error } = useStudent(studentId);
  const { mutate: resetPassword, isLoading: isResetting } = useResetStudentPassword();

  // New API response structure: { data: { id, type, attributes } }
  const studentData = studentResponse?.data?.attributes;

  const student = studentData ? {
    id: studentResponse.data.id,
    name: studentData.full_name || `${studentData.first_name || ''} ${studentData.last_name || ''}`.trim() || 'Unknown',
    firstName: studentData.first_name,
    lastName: studentData.last_name,
    status: studentData.status ?? 1,
    email: studentData.email,
    phone: studentData.phone?.toString() || 'N/A',
    university: studentData.university?.data?.attributes?.name || 'N/A',
    faculty: studentData.faculty?.data?.attributes?.name || 'N/A',
    year: 'N/A', // Not available in API
    joined: studentData.joined || (studentData.created_at ? new Date(studentData.created_at).toLocaleDateString() : 'N/A'),
    lastActive: 'Recently', // Not available in API
    avatar: getInitials(studentData.first_name, studentData.last_name),
    centers: studentData.centers || [],
    enrolledCourses: studentData.enrolled_courses || [],
    exams: studentData.exam_results || [],
    activity: {
      notesCreated: studentData.activity_stats?.notes_created || 0,
      downloads: studentData.activity_stats?.downloads || 0,
      liveAttendance: studentData.activity_stats?.live_attendance || 0,
      communityPosts: studentData.activity_stats?.community_posts || 0
    },
    device: {
      name: studentData.device_access?.device || 'Unknown Device',
      lastIp: studentData.device_access?.last_ip || 'N/A'
    }
  } : null;

  // Step 1: Open confirmation modal
  const handleResetClick = () => {
    setGeneratedPassword(undefined);
    setResetError(null);
    setIsResetModalOpen(true);
  };

  // Step 2: Confirm and call API
  const handleConfirmReset = async () => {
    try {
      // Generate 10-char password to ensure it meets min 8 char requirement
      const newPassword = Math.random().toString(36).slice(-10).toUpperCase();
      await resetPassword({ studentId, password: newPassword });
      setGeneratedPassword(newPassword);
    } catch (err: any) {
      console.error('Failed to reset password:', err);
      setResetError(err.message || 'Failed to reset password. Please try again.');
    }
  };

  const handleCloseModal = () => {
    setIsResetModalOpen(false);
    setGeneratedPassword(undefined);
    setResetError(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-[#2137D6] animate-spin" />
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-red-500">{t('students.form.view.loadError')}</p>
        <Link
          href="/students"
          className="px-4 py-2 bg-[#2137D6] text-white rounded-lg text-sm font-medium"
        >
          {t('students.form.view.backToStudents')}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-[1400px] mx-auto pb-12">
      {/* Top Navigation & Profile Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/students"
            className="p-2 bg-white border border-[#E2E8F0] rounded-xl text-[#64748B] hover:text-[#1E293B] hover:shadow-sm transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold text-[#1E293B]">{student.name}</h1>
            <div className="flex items-center gap-3 text-[12px] text-[#64748B] mt-0.5">
              <span className="font-medium">{t('students.form.view.studentId')}: <span className="font-bold text-[#1E293B] uppercase">{student.id}</span></span>
              <span className="w-1 h-1 bg-[#CBD5E1] rounded-full"></span>
              <span>{t('students.form.view.lastActive')} <span className="font-bold text-[#1E293B]">{student.lastActive}</span></span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* <button 
            onClick={handleResetPassword}
            disabled={isResetting}
            className="flex-1 md:flex-none px-5 py-2.5 bg-white border border-[#E2E8F0] text-[#475569] rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#F8FAFC] hover:shadow-sm transition-all disabled:opacity-50"
          >
            {isResetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
            Reset Password
          </button> */}
          <Link
            href={`/students/${student.id}/edit`}
            className="flex-1 md:flex-none px-5 py-2.5 bg-[#2137D6] hover:bg-[#1a2bb3] text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-200"
          >
            <Edit2 className="w-4 h-4" />
            Edit Student
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Details & Stats */}
        <div className="lg:col-span-8 flex flex-col gap-6">

          {/* Section 1: Personal Info */}
          <section className="bg-white rounded-3xl border border-[#F1F5F9] shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-[#F1F5F9] flex items-center gap-2">
              <div className="p-1.5 bg-indigo-50 rounded-lg">
                <User className="w-4 h-4 text-[#4F46E5]" />
              </div>
              <h2 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider">{t('students.form.view.sections.personal')}</h2>
            </div>
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-y-10 gap-x-12">
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-[1px]">{t('students.form.view.fields.fullName')}</span>
                <span className="text-[15px] font-bold text-[#1E293B]">{student.name}</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-[1px]">{t('students.form.view.fields.status')}</span>
                <span className={`inline-flex w-fit px-3 py-1 text-[10px] font-bold rounded-lg border uppercase ${
                    student.status === 1
                      ? 'bg-[#EBFDF5] text-[#10B981] border-emerald-100'
                      : student.status === 0
                        ? 'bg-red-50 text-red-600 border-red-100'
                        : 'bg-orange-50 text-orange-600 border-orange-100'
                  }`}>
                  {StudentStatusLabels[student.status]}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[#F4F5FD] rounded-xl flex items-center justify-center border border-indigo-50 text-[#4F46E5]">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-[#94A3B8] uppercase">{t('students.form.view.fields.email')}</span>
                  <span className="text-[14px] font-semibold text-[#475569]">{student.email}</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[#F4F5FD] rounded-xl flex items-center justify-center border border-indigo-50 text-[#4F46E5]">
                  <Phone className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-[#94A3B8] uppercase">{t('students.form.view.fields.phone')}</span>
                  <span className="text-[14px] font-semibold text-[#475569]">{student.phone}</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[#F4F5FD] rounded-xl flex items-center justify-center border border-indigo-50 text-[#4F46E5]">
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-[#94A3B8] uppercase">{t('students.form.view.fields.joined')}</span>
                  <span className="text-[14px] font-semibold text-[#475569]">{student.joined}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Academic Info */}
          <section className="bg-white rounded-3xl border border-[#F1F5F9] shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-[#F1F5F9] flex items-center gap-2">
              <div className="p-1.5 bg-indigo-50 rounded-lg">
                <GraduationCap className="w-4 h-4 text-[#4F46E5]" />
              </div>
              <h2 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider">{t('students.form.view.sections.academic')}</h2>
            </div>
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-[1px]">{t('students.form.view.fields.university')}</span>
                <span className="text-[15px] font-bold text-[#1E293B]">{student.university}</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-[1px]">{t('students.form.view.fields.faculty')}</span>
                <span className="text-[15px] font-bold text-[#1E293B]">{student.faculty}</span>
              </div>
            </div>
          </section>

          {/* Section 3: Enrolled Courses */}
          <section className="bg-white rounded-3xl border border-[#F1F5F9] shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-[#F1F5F9] flex items-center gap-2">
              <div className="p-1.5 bg-indigo-50 rounded-lg">
                <BookOpen className="w-4 h-4 text-[#4F46E5]" />
              </div>
              <h2 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider">{t('students.form.view.sections.enrolledCourses')}</h2>
            </div>
            <div className="p-6 flex flex-col gap-5">
              {student.enrolledCourses.length > 0 ? (
                student.enrolledCourses.map((course: any, idx: number) => {
                  const courseAttrs = course.attributes || course;
                  const courseTitle = courseAttrs.title || 'Untitled Course';
                  const courseSubtitle = courseAttrs.sub_title || '';
                  const thumbnail = courseAttrs.thumbnail;
                  const stats = courseAttrs.stats || {};

                  return (
                    <div key={idx} className="p-5 bg-white border border-[#F1F5F9] rounded-2xl flex flex-col gap-4 group hover:shadow-sm transition-all">
                      <div className="flex items-start gap-4">
                        {thumbnail && (
                          <img
                            src={thumbnail}
                            alt={courseTitle}
                            className="w-16 h-16 rounded-xl object-cover border border-[#F1F5F9]"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-bold text-[#1E293B] truncate">{courseTitle}</h3>
                          {courseSubtitle && (
                            <p className="text-[12px] text-[#64748B] mt-1 truncate">{courseSubtitle}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-[11px] text-[#64748B]">
                        <span><strong className="text-[#1E293B]">{stats.lectures || 0}</strong> {t('students.form.view.fields.lectures')}</span>
                        <span className="w-1 h-1 bg-[#CBD5E1] rounded-full"></span>
                        <span><strong className="text-[#1E293B]">{stats.chapters || 0}</strong> {t('students.form.view.fields.chapters')}</span>
                        <span className="w-1 h-1 bg-[#CBD5E1] rounded-full"></span>
                        <span><strong className="text-[#1E293B]">{stats.exams || 0}</strong> {t('students.form.view.fields.exams')}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-[#94A3B8]">
                  {t('students.form.view.noCourses')}
                </div>
              )}
            </div>
          </section>

          {/* Section 4: Exam Results */}
          <section className="bg-white rounded-3xl border border-[#F1F5F9] shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-[#F1F5F9] flex items-center gap-2">
              <div className="p-1.5 bg-indigo-50 rounded-lg">
                <ClipboardList className="w-4 h-4 text-[#4F46E5]" />
              </div>
              <h2 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider">{t('students.form.view.sections.examResults')}</h2>
            </div>
            <div className="overflow-x-auto p-4">
              {student.exams.length > 0 ? (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F8FAFC] border-b border-[#F1F5F9]">
                      <th className="px-6 py-4 text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider">{t('students.form.view.fields.exam')}</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider">{t('students.form.view.fields.score')}</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider">{t('students.form.view.fields.date')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {student.exams.map((exam: any, idx: number) => {
                      const examAttrs = exam.attributes || exam;
                      const quizAttrs = examAttrs.quiz?.data?.attributes;
                      const examName = quizAttrs?.title || 'Unknown Exam';
                      const score = examAttrs.score ?? 0;
                      const totalScore = examAttrs.total_score ?? 0;
                      const percentage = examAttrs.percentage ?? 0;
                      const date = examAttrs.finished_at || examAttrs.created_at;

                      return (
                        <tr key={idx} className="hover:bg-[#F8FAFC]/50 transition-colors">
                          <td className="px-6 py-5 text-sm font-bold text-[#1E293B]">{examName}</td>
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-[#1E293B]">{score}/{totalScore}</span>
                              <span className="text-[11px] text-[#64748B]">({percentage}%)</span>
                            </div>
                          </td>
                          <td className="px-6 py-5 text-sm text-[#64748B] font-medium">
                            {date ? new Date(date).toLocaleDateString() : 'N/A'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-8 text-[#94A3B8]">
                  {t('students.form.view.noExams')}
                </div>
              )}
            </div>
          </section>

          {/* Section 5: Security & Account Access */}
          <section className="bg-white rounded-3xl border border-[#F1F5F9] shadow-sm overflow-hidden border-orange-100">
            <div className="px-6 py-5 border-b border-[#F1F5F9] flex items-center gap-2">
              <div className="p-1.5 bg-orange-50 rounded-lg">
                <ShieldCheck className="w-4 h-4 text-orange-600" />
              </div>
              <h2 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider">{t('students.form.view.sections.security')}</h2>
            </div>
            <div className="p-8 flex flex-col gap-4">
              <button
                onClick={handleResetClick}
                disabled={isResetting}
                className="w-fit flex items-center gap-2.5 text-[#4F46E5] hover:bg-indigo-50 px-5 py-2.5 rounded-xl border border-indigo-100 font-bold transition-all disabled:opacity-50"
              >
                {isResetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                {t('students.form.view.fields.resetPassword')}
              </button>
            </div>
          </section>
        </div>

        {/* Right Column: Cards */}
        <div className="lg:col-span-4 flex flex-col gap-6">

          {/* Card 1: Centers */}
          <section className="bg-white rounded-3xl border border-[#F1F5F9] shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-[#F1F5F9] flex items-center gap-2">
              <div className="p-1.5 bg-indigo-50 rounded-lg">
                <Building2 className="w-4 h-4 text-[#4F46E5]" />
              </div>
              <h2 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider">{t('students.form.view.sections.centers')}</h2>
            </div>
            <div className="p-6 flex flex-col gap-3">
              {student.centers.length > 0 ? (
                student.centers.map((center: any) => (
                  <div key={center.id} className="p-4 bg-[#F8FAFC] border border-[#F1F5F9] rounded-2xl flex items-center gap-3">
                    <div className="w-2 h-2 bg-[#4F46E5] rounded-full"></div>
                    <span className="text-[13.5px] font-bold text-[#475569]">{center.attributes?.name || center.name || 'Unknown Center'}</span>
                  </div>
                ))
              ) : (
                <div className="p-4 bg-[#F8FAFC] border border-[#F1F5F9] rounded-2xl text-[#94A3B8] text-sm">
                  {t('students.form.view.noCenters')}
                </div>
              )}
            </div>
          </section>

          {/* Card 2: Activity Summary */}
          <section className="bg-white rounded-3xl border border-[#F1F5F9] shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-[#F1F5F9] flex items-center gap-2">
              <Layout className="w-4 h-4 text-[#4F46E5]" />
              <h2 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider">{t('students.form.view.sections.activity')}</h2>
            </div>
            <div className="p-6 flex flex-col gap-5">
              <div className="flex items-center justify-between py-2 border-b border-[#F1F5F9]/50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-slate-500"><BookOpen className="w-4 h-4" /></div>
                  <span className="text-[14px] font-medium text-[#64748B]">{t('students.form.view.fields.notesCreated')}</span>
                </div>
                <span className="text-base font-bold text-[#1E293B]">{student.activity.notesCreated}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-[#F1F5F9]/50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-slate-500"><Globe className="w-4 h-4" /></div>
                  <span className="text-[14px] font-medium text-[#64748B]">{t('students.form.view.fields.downloads')}</span>
                </div>
                <span className="text-base font-bold text-[#1E293B]">{student.activity.downloads}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-[#F1F5F9]/50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-slate-500"><Clock className="w-4 h-4" /></div>
                  <span className="text-[14px] font-medium text-[#64748B]">{t('students.form.view.fields.liveAttendance')}</span>
                </div>
                <span className="text-base font-bold text-[#1E293B]">{student.activity.liveAttendance}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-[#F1F5F9]/50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-slate-500"><Smartphone className="w-4 h-4" /></div>
                  <span className="text-[14px] font-medium text-[#64748B]">{t('students.form.view.fields.communityPosts')}</span>
                </div>
                <span className="text-base font-bold text-[#1E293B]">{student.activity.communityPosts}</span>
              </div>
            </div>
          </section>

          {/* Card 3: Device & Access */}
          <section className="bg-white rounded-3xl border border-[#F1F5F9] shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-[#F1F5F9] flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-[#4F46E5]" />
              <h2 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider">{t('students.form.view.sections.device')}</h2>
            </div>
            <div className="p-6 flex flex-col gap-6">
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-[1px]">{t('students.form.view.fields.device')}</span>
                <span className="text-[14px] font-bold text-[#1E293B]">{student.device.name}</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-[1px]">{t('students.form.view.fields.lastIp')}</span>
                <span className="text-[14px] font-bold text-[#1E293B]">{student.device.lastIp}</span>
              </div>
            </div>
          </section>

        </div>
      </div>

      {/* Reset Modal */}
      <ResetPasswordModal
        isOpen={isResetModalOpen}
        onClose={handleCloseModal}
        studentName={student.name}
        generatedPassword={generatedPassword}
        onConfirm={handleConfirmReset}
        isLoading={isResetting}
        error={resetError}
      />
    </div>
  );
}

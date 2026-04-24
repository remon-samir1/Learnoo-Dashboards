'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { 
  Search, 
  Plus, 
  Eye, 
  Key, 
  Edit2, 
  Trash2,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { useStudents, useDeleteStudent, useResetStudentPassword } from '@/src/hooks/useStudents';
import { TableSkeleton } from '@/src/components/ui/Skeleton';
import type { Student, StudentStatus } from '@/src/types';
import { StudentStatusLabels } from '@/src/types';
import ResetPasswordModal from '@/components/modals/ResetPasswordModal';

// Helper to get initials from name
function getInitials(firstName: string, lastName: string) {
  return (firstName[0] || '') + (lastName[0] || '').toUpperCase();
}

export default function StudentsPage() {
  const t = useTranslations('students');
  const tc = useTranslations('common');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StudentStatus | 'all'>('all');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<{ id: string; name: string } | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState<string | undefined>(undefined);
  const [resetError, setResetError] = useState<string | null>(null);

  // Instant search (no debounce)
  useEffect(() => {
    setDebouncedSearch(searchTerm);
    setPage(1); // Reset to first page on search
  }, [searchTerm]);

  const filter = useMemo(() => ({
    status: statusFilter === 'all' ? undefined : statusFilter,
    page,
    role: 0,
  }), [statusFilter, page]);

  const { data: studentsResponse, isLoading, error, refetch } = useStudents(filter, {});
  const { mutate: deleteStudent, isLoading: isDeleting } = useDeleteStudent();
  const { mutate: resetPassword, isLoading: isResetting } = useResetStudentPassword();

  const students = studentsResponse?.data || [];
  const meta = studentsResponse?.meta as any;

  // Local filtering by search term (student code, phone, name, email)
  const filteredStudents = useMemo(() => {
    if (!debouncedSearch) return students;

    const search = debouncedSearch.toLowerCase();
    return students.filter((student: Student) => {
      const fullName = `${student.attributes.first_name} ${student.attributes.last_name}`.toLowerCase();
      const email = student.attributes.email?.toLowerCase() || '';
      const phone = String(student.attributes.phone || '').toLowerCase();
      const studentCode = String(student.attributes.student_code || '').toLowerCase();

      return fullName.includes(search) || email.includes(search) || phone.includes(search) || studentCode.includes(search);
    });
  }, [students, debouncedSearch]);

  const handleDelete = async (id: string) => {
    if (confirm(t('deleteConfirm'))) {
      try {
        await deleteStudent(id);
        refetch();
      } catch {
        // Error handled by hook
      }
    }
  };

  // Step 1: Open confirmation modal
  const handleResetClick = (student: Student) => {
    const attrs = student.attributes;
    const displayName = attrs.full_name || `${attrs.first_name || ''} ${attrs.last_name || ''}`.trim() || 'Unknown';
    setSelectedStudent({ id: student.id, name: displayName });
    setGeneratedPassword(undefined);
    setResetError(null);
    setIsResetModalOpen(true);
  };

  // Step 2: Confirm and call API
  const handleConfirmReset = async () => {
    if (!selectedStudent) return;
    
    try {
      const newPassword = Math.random().toString(36).slice(-10).toUpperCase();
      await resetPassword({ studentId: selectedStudent.id, password: newPassword });
      setGeneratedPassword(newPassword);
    } catch (err: any) {
      console.error('Failed to reset password:', err);
      setResetError(err.message || 'Failed to reset password. Please try again.');
    }
  };

  const handleCloseModal = () => {
    setIsResetModalOpen(false);
    setSelectedStudent(null);
    setGeneratedPassword(undefined);
    setResetError(null);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">{t('pageTitle')}</h1>
          <p className="text-sm text-[#64748B] mt-1">{t('pageDescription')}</p>
        </div>
        <Link 
          href="/students/add"
          className="bg-[#2137D6] hover:bg-[#1a2bb3] text-white px-5 py-2.5 rounded-lg flex items-center gap-2 text-sm font-semibold transition-all shadow-sm shadow-blue-100"
        >
          <Plus className="w-4 h-4" />
          {t('addStudent')}
        </Link>
      </div>

      {/* Filters Section */}
      <div className="bg-white p-4 rounded-2xl border border-[#F1F5F9] shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
          <input 
            type="text" 
            placeholder={t('searchPlaceholder')}
            className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm text-[#475569] focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 w-full md:w-[200px] appearance-none cursor-pointer"
            value={statusFilter}
            onChange={(e) => {
              const value = e.target.value;
              setStatusFilter(value === 'all' ? 'all' : parseInt(value) as StudentStatus);
              setPage(1);
            }}
          >
            <option value="all">{t('allStatuses')}</option>
            <option value={1}>{tc('active')}</option>
            <option value={0}>{tc('inactive')}</option>
            <option value={2}>{tc('suspended')}</option>
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm overflow-hidden min-h-[400px]">
        {isLoading ? (
          <TableSkeleton rows={5} />
        ) : error ? (
          <div className="p-12 text-center text-red-500">
            {tc('error')}: {error}
          </div>
        ) : students && students.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#F1F5F9]">
                    <th className="px-6 py-4 text-[13px] font-semibold text-[#64748B] uppercase tracking-wider">{t('studentCode')}</th>
                    <th className="px-6 py-4 text-[13px] font-semibold text-[#64748B] uppercase tracking-wider">{t('nameContact')}</th>
                    <th className="px-6 py-4 text-[13px] font-semibold text-[#64748B] uppercase tracking-wider">{t('university')}</th>
                    <th className="px-6 py-4 text-[13px] font-semibold text-[#64748B] uppercase tracking-wider">{t('centers')}</th>
                    <th className="px-6 py-4 text-[13px] font-semibold text-[#64748B] uppercase tracking-wider text-center">{t('status')}</th>
                    <th className="px-6 py-4 text-[13px] font-semibold text-[#64748B] uppercase tracking-wider text-right">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {filteredStudents.map((student: Student) => {
                    const { first_name, last_name, full_name, email, phone, status, university, centers, student_code } = student.attributes;
                    const displayName = full_name || `${first_name || ''} ${last_name || ''}`.trim() || 'Unknown';
                    const universityName = university?.data?.attributes?.name || tc('na');
                    const centersNames = centers?.map(c => c.attributes?.name || tc('unknown')).join(', ') || tc('na');

                    return (
                      <tr key={student.id} className="hover:bg-[#F8FAFC]/50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="text-sm font-mono font-medium text-[#475569]">{student_code || '-'}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {student.attributes.image ? (
                              <img
                                src={student.attributes.image}
                                alt={displayName}
                                className="w-10 h-10 rounded-full object-cover border border-indigo-50 shadow-sm"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-[#EEF2FF] rounded-full flex items-center justify-center border border-indigo-50 shadow-sm">
                                <span className="text-sm font-bold text-[#4F46E5]">{getInitials(first_name, last_name)}</span>
                              </div>
                            )}
                            <div className="flex flex-col min-w-0">
                              <span className="text-sm font-bold text-[#1E293B]">{displayName}</span>
                              <span className="text-[12px] text-[#64748B] truncate">{email}</span>
                              <span className="text-[11px] text-[#94A3B8]">{phone || t('noPhone')}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-[#475569] font-medium">{universityName}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-[#475569]">{centersNames}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex px-3 py-1 rounded-full text-[11px] font-bold border ${
                            status === 1
                              ? 'bg-[#EBFDF5] text-[#10B981] border-[#10B981]/20'
                              : status === 0
                                ? 'bg-red-50 text-red-600 border-red-600/20'
                                : 'bg-orange-50 text-orange-600 border-orange-600/20'
                          }`}>
                            {StudentStatusLabels[status ?? 1]}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link 
                              href={`/students/${student.id}`}
                              className="p-2 text-[#64748B] hover:text-[#4F46E5] hover:bg-indigo-50 rounded-lg transition-all"
                              title={t('viewProfile')}
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            <button
                              className="p-2 text-[#64748B] hover:text-[#F59E0B] hover:bg-amber-50 rounded-lg transition-all"
                              title={t('resetPassword')}
                              onClick={() => handleResetClick(student)}
                              disabled={isResetting}
                            >
                              {isResetting && selectedStudent?.id === student.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Key className="w-4 h-4" />
                              )}
                            </button>
                            <Link 
                              href={`/students/${student.id}/edit`}
                              className="p-2 text-[#64748B] hover:text-[#4F46E5] hover:bg-indigo-50 rounded-lg transition-all"
                              title={t('editStudent')}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Link>
                            <button 
                              className="p-2 text-[#64748B] hover:text-[#EF4444] hover:bg-red-50 rounded-lg transition-all"
                              title={t('deleteStudent')}
                              onClick={() => handleDelete(student.id)}
                              disabled={isDeleting}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 bg-[#F8FAFC] border-t border-[#F1F5F9] flex items-center justify-between mt-auto">
              <p className="text-[13px] text-[#64748B]">
                {tc('showing')} <span className="font-bold text-[#1E293B]">{meta?.from || 0} {tc('to')} {meta?.to || 0}</span> {tc('of')} <span className="font-bold text-[#1E293B]">{meta?.total || 0}</span> {tc('results')}
              </p>
              <div className="flex items-center gap-1.5">
                {/* Previous Button */}
                <button
                  className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm font-medium text-[#64748B] hover:bg-white hover:border-[#2137D6] hover:text-[#2137D6] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-[#E2E8F0] disabled:hover:text-[#64748B]"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  {tc('previous')}
                </button>

                {/* Page Numbers */}
                {(() => {
                  const totalPages = meta?.last_page || 1;
                  const currentPage = page;
                  const pages: (number | string)[] = [];

                  if (totalPages <= 7) {
                    for (let i = 1; i <= totalPages; i++) pages.push(i);
                  } else {
                    if (currentPage <= 3) {
                      pages.push(1, 2, 3, 4, '...', totalPages);
                    } else if (currentPage >= totalPages - 2) {
                      pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
                    } else {
                      pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
                    }
                  }

                  return pages.map((p, i) => (
                    p === '...' ? (
                      <span key={`ellipsis-${i}`} className="px-2 text-[#94A3B8]">...</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p as number)}
                        className={`min-w-[40px] px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          currentPage === p
                            ? 'bg-[#2137D6] text-white shadow-md'
                            : 'border border-[#E2E8F0] text-[#64748B] hover:bg-white hover:border-[#2137D6] hover:text-[#2137D6]'
                        }`}
                      >
                        {p}
                      </button>
                    )
                  ));
                })()}

                {/* Next Button */}
                <button
                  className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm font-medium text-[#64748B] hover:bg-white hover:border-[#2137D6] hover:text-[#2137D6] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-[#E2E8F0] disabled:hover:text-[#64748B]"
                  disabled={page >= (meta?.last_page || 1)}
                  onClick={() => setPage(page + 1)}
                >
                  {tc('next')}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="p-12 text-center text-[#64748B]">
            {t('noStudents')}
          </div>
        )}
      </div>

      {/* Reset Password Modal */}
      <ResetPasswordModal
        isOpen={isResetModalOpen}
        onClose={handleCloseModal}
        studentName={selectedStudent?.name || ''}
        generatedPassword={generatedPassword}
        onConfirm={handleConfirmReset}
        isLoading={isResetting}
        error={resetError}
      />
    </div>
  );
}

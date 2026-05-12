'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2,
  Loader2,
  Mail,
  Phone,
  User,
<<<<<<< HEAD
  Key,
} from 'lucide-react';
import Link from 'next/link';
import { useInstructors, useDeleteInstructor, useResetInstructorPassword, useToggleCanUseActivations } from '@/src/hooks/useInstructors';
=======
} from 'lucide-react';
import Link from 'next/link';
import { useInstructors, useDeleteInstructor } from '@/src/hooks/useInstructors';
>>>>>>> origin/master
import { TableSkeleton } from '@/src/components/ui/Skeleton';
import type { Student } from '@/src/types';
import { StudentStatusLabels } from '@/src/types';

export default function InstructorsPage() {
  const t = useTranslations('instructors');
  const tc = useTranslations('common');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);

  // Instant search (no debounce)
  useEffect(() => {
    setDebouncedSearch(searchTerm);
    setPage(1); // Reset to first page on search
  }, [searchTerm]);

  const filter = useMemo(() => ({
    search: debouncedSearch || undefined,
    page,
    role: 1,
  }), [debouncedSearch, page]);

  const { data: instructorsResponse, isLoading, error, refetch } = useInstructors(filter, {});
  const { mutate: deleteInstructor, isLoading: isDeleting } = useDeleteInstructor();
<<<<<<< HEAD
  const { mutate: resetPassword, isLoading: isResetting } = useResetInstructorPassword();
  const { mutate: toggleCanUseActivations, isLoading: isToggling } = useToggleCanUseActivations();
=======
>>>>>>> origin/master

  const instructors = instructorsResponse?.data || [];
  const meta = instructorsResponse?.meta as any;

  const handleDelete = async (id: string) => {
    if (confirm(t('deleteConfirm'))) {
      try {
        await deleteInstructor(id);
        refetch();
      } catch {
        // Error handled by hook
      }
    }
  };

<<<<<<< HEAD
  const handleResetPassword = async (instructor: Student) => {
    const newPassword = prompt('Enter new password for ' + getFullName(instructor) + ':');
    if (!newPassword || newPassword.trim() === '') {
      return;
    }
    
    if (confirm(`Are you sure you want to reset the password for ${getFullName(instructor)}?`)) {
      try {
        await resetPassword({ instructorId: instructor.id, password: newPassword.trim() });
        alert('Password reset successfully!');
      } catch {
        // Error handled by hook
      }
    }
  };

  const handleToggleCanUseActivations = async (instructor: Student) => {
    const newValue = !instructor.attributes.can_use_activations;
    
    if (confirm(`Are you sure you want to ${newValue ? 'enable' : 'disable'} activations for ${getFullName(instructor)}?`)) {
      try {
        await toggleCanUseActivations({ instructorId: instructor.id, canUseActivations: newValue });
        refetch(); // Refresh data to show updated value
      } catch {
        // Error handled by hook
      }
    }
  };

=======
>>>>>>> origin/master
  // Helper to get full name from student structure
  const getFullName = (instructor: Student) => {
    return `${instructor.attributes.first_name} ${instructor.attributes.last_name}`.trim();
  };

  // Helper to get initials
  const getInitials = (instructor: Student) => {
    return `${instructor.attributes.first_name?.charAt(0) || ''}${instructor.attributes.last_name?.charAt(0) || ''}`.toUpperCase();
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
          href="/instructors/add"
          className="bg-[#2137D6] hover:bg-[#1a2bb3] text-white px-5 py-2.5 rounded-lg flex items-center gap-2 text-sm font-semibold transition-all shadow-sm shadow-blue-100"
        >
          <Plus className="w-4 h-4" />
          {t('addInstructor')}
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
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm overflow-hidden">
        {isLoading ? (
          <TableSkeleton />
        ) : error ? (
          <div className="p-8 text-center text-red-500">
            {tc('errorLoading')}
          </div>
        ) : instructors.length === 0 ? (
          <div className="p-12 text-center">
            <User className="w-16 h-16 text-[#CBD5E1] mx-auto mb-4" />
            <p className="text-[#64748B] font-medium">{t('noInstructors')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                <tr>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                    {t('name')}
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                    {t('email')}
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                    {t('phone')}
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                    {t('specialization')}
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                    {t('status')}
                  </th>
<<<<<<< HEAD
                  <th className="text-center px-6 py-4 text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                    Can Use Activations
                  </th>
=======
>>>>>>> origin/master
                  <th className="text-right px-6 py-4 text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                    {tc('actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {instructors.map((instructor: Student) => (
                  <tr key={instructor.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {instructor.attributes.image ? (
                          <img 
                            src={instructor.attributes.image} 
                            alt={getFullName(instructor)}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-[#E2E8F0] flex items-center justify-center">
                            <span className="text-sm font-semibold text-[#64748B]">
                              {getInitials(instructor)}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-[#1E293B]">{getFullName(instructor)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-[#64748B]">
                        <Mail className="w-4 h-4" />
                        <span className="text-sm">{instructor.attributes.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-[#64748B]">
                        <Phone className="w-4 h-4" />
                        <span className="text-sm">{instructor.attributes.phone || '-'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-[#64748B]">
                        {instructor.attributes.specialization || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm px-2.5 py-1 rounded-full ${
                        instructor.attributes.status === 1 
                          ? 'bg-green-100 text-green-700' 
                          : instructor.attributes.status === 2 
                            ? 'bg-red-100 text-red-700' 
                            : 'bg-gray-100 text-gray-700'
                      }`}>
                        {StudentStatusLabels[instructor.attributes.status || 0]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
<<<<<<< HEAD
                      <div className="flex justify-center">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={instructor.attributes.can_use_activations || false}
                            onChange={() => handleToggleCanUseActivations(instructor)}
                            disabled={isToggling}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleResetPassword(instructor)}
                          disabled={isResetting}
                          className="p-2 hover:bg-[#FEF3C7] rounded-lg transition-colors text-[#64748B] hover:text-[#F59E0B] disabled:opacity-50"
                          title="Reset Password"
                        >
                          {isResetting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Key className="w-4 h-4" />
                          )}
                        </button>
=======
                      <div className="flex items-center justify-end gap-2">
>>>>>>> origin/master
                        <Link
                          href={`/instructors/${instructor.id}/edit`}
                          className="p-2 hover:bg-[#F1F5F9] rounded-lg transition-colors text-[#64748B] hover:text-[#2137D6]"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(instructor.id)}
                          disabled={isDeleting}
                          className="p-2 hover:bg-[#FEF2F2] rounded-lg transition-colors text-[#64748B] hover:text-[#EF4444] disabled:opacity-50"
                        >
                          {isDeleting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {meta && meta.last_page > 1 && (
          <div className="px-6 py-4 border-t border-[#E2E8F0] flex items-center justify-between">
            <p className="text-sm text-[#64748B]">
              {tc('showing')} {meta.from} - {meta.to} {tc('of')} {meta.total}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm font-medium text-[#64748B] hover:bg-[#F1F5F9] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {tc('previous')}
              </button>
              <span className="px-3 py-1.5 text-sm font-medium text-[#1E293B] bg-[#F1F5F9] rounded-lg">
                {page}
              </span>
              <button
                onClick={() => setPage(p => Math.min(meta.last_page, p + 1))}
                disabled={page === meta.last_page}
                className="px-3 py-1.5 text-sm font-medium text-[#64748B] hover:bg-[#F1F5F9] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {tc('next')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Eye, 
  Key, 
  Edit2, 
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { useStudents, useDeleteStudent } from '@/src/hooks/useStudents';
import { TableSkeleton } from '@/src/components/ui/Skeleton';
import type { Student } from '@/src/types';

// Helper to get initials from name
function getInitials(firstName: string, lastName: string) {
  return (firstName[0] || '') + (lastName[0] || '').toUpperCase();
}

export default function StudentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); // Reset to first page on search
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const filter = useMemo(() => ({
    search: debouncedSearch || undefined,
    status: statusFilter === 'All Statuses' ? undefined : statusFilter.toLowerCase(),
    page,
  }), [debouncedSearch, statusFilter, page]);

  const { data: studentsResponse, isLoading, error, refetch } = useStudents([filter], {});
  const { mutate: deleteStudent, isLoading: isDeleting } = useDeleteStudent();

  const students = studentsResponse?.data || [];
  const meta = studentsResponse?.meta as any;

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this student?')) {
      try {
        await deleteStudent(id);
        refetch();
      } catch {
        // Error handled by hook
      }
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">Students Management</h1>
          <p className="text-sm text-[#64748B] mt-1">Manage student accounts, access, and details.</p>
        </div>
        <Link 
          href="/students/add"
          className="bg-[#2137D6] hover:bg-[#1a2bb3] text-white px-5 py-2.5 rounded-lg flex items-center gap-2 text-sm font-semibold transition-all shadow-sm shadow-blue-100"
        >
          <Plus className="w-4 h-4" />
          Add Student
        </Link>
      </div>

      {/* Filters Section */}
      <div className="bg-white p-4 rounded-2xl border border-[#F1F5F9] shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
          <input 
            type="text" 
            placeholder="Search by name or email..."
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
              setStatusFilter(e.target.value);
              setPage(1); // Reset to first page on filter change
            }}
          >
            <option>All Statuses</option>
            <option>Active</option>
            <option>Inactive</option>
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm overflow-hidden min-h-[400px]">
        {isLoading ? (
          <TableSkeleton rows={5} />
        ) : error ? (
          <div className="p-12 text-center text-red-500">
            Failed to load students: {error}
          </div>
        ) : students && students.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#F1F5F9]">
                    <th className="px-6 py-4 text-[13px] font-semibold text-[#64748B] uppercase tracking-wider">Name & Contact</th>
                    <th className="px-6 py-4 text-[13px] font-semibold text-[#64748B] uppercase tracking-wider">University</th>
                    <th className="px-6 py-4 text-[13px] font-semibold text-[#64748B] uppercase tracking-wider">Centers</th>
                    <th className="px-6 py-4 text-[13px] font-semibold text-[#64748B] uppercase tracking-wider text-center">Status</th>
                    <th className="px-6 py-4 text-[13px] font-semibold text-[#64748B] uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {students.map((student: Student) => {
                    const { first_name, last_name, email, phone, role, university, centers } = student.attributes;
                    // Use status if available, otherwise fallback to role or 'Active'
                    const status = (student.attributes as any).status || (role === 'Student' ? 'Active' : role);
                    const fullName = `${first_name} ${last_name}`;
                    const universityName = university?.data?.attributes?.name || 'N/A';
                    const centersNames = centers?.map(c => c.attributes.name).join(', ') || 'N/A';
                    
                    return (
                      <tr key={student.id} className="hover:bg-[#F8FAFC]/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#EEF2FF] rounded-full flex items-center justify-center border border-indigo-50 shadow-sm">
                              <span className="text-sm font-bold text-[#4F46E5]">{getInitials(first_name, last_name)}</span>
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-sm font-bold text-[#1E293B]">{fullName}</span>
                              <span className="text-[12px] text-[#64748B] truncate">{email}</span>
                              <span className="text-[11px] text-[#94A3B8]">{phone || 'No phone'}</span>
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
                          <span className={`inline-flex px-3 py-1 rounded-full text-[11px] font-bold ${
                            status === 'Active' || status === 'active' 
                              ? 'bg-[#EBFDF5] text-[#10B981] border border-emerald-100' 
                              : 'bg-[#F1F5F9] text-[#64748B] border border-slate-200'
                          }`}>
                            {status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link 
                              href={`/students/${student.id}`}
                              className="p-2 text-[#64748B] hover:text-[#4F46E5] hover:bg-indigo-50 rounded-lg transition-all"
                              title="View Profile"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            <button 
                              className="p-2 text-[#64748B] hover:text-[#4F46E5] hover:bg-indigo-50 rounded-lg transition-all"
                              title="Reset Password"
                            >
                              <Key className="w-4 h-4" />
                            </button>
                            <button 
                              className="p-2 text-[#64748B] hover:text-[#4F46E5] hover:bg-indigo-50 rounded-lg transition-all"
                              title="Edit Student"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              className="p-2 text-[#64748B] hover:text-[#EF4444] hover:bg-red-50 rounded-lg transition-all"
                              title="Delete Student"
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
                Showing <span className="font-bold text-[#1E293B]">{meta?.from || 0} to {meta?.to || 0}</span> of <span className="font-bold text-[#1E293B]">{meta?.total || 0}</span> results
              </p>
              <div className="flex gap-2">
                <button 
                  className="px-4 py-2 border border-[#E2E8F0] rounded-lg text-sm font-medium text-[#64748B] hover:bg-white transition-all disabled:opacity-50"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </button>
                <button 
                  className="px-4 py-2 border border-[#E2E8F0] rounded-lg text-sm font-medium text-[#64748B] hover:bg-white transition-all disabled:opacity-50"
                  disabled={page >= (meta?.last_page || 1)}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="p-12 text-center text-[#64748B]">
            No students found. Add your first student!
          </div>
        )}
      </div>
    </div>
  );
}

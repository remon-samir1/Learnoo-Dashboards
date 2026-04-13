'use client';

import React, { useState } from 'react';
import { Power, Search, Plus, ChevronDown, Loader2, Trash2, Copy, CheckCircle, List, UserPlus, History, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { AdminPageHeader } from '@/src/components/admin/AdminPageHeader';
import { SearchFilter } from '@/src/components/admin/SearchFilter';
import { DataTable, Column } from '@/src/components/ui/DataTable';
import { DeleteModal } from '@/src/components/ui/DeleteModal';
import { useCodes, useDeleteCode, useActivateCode } from '@/src/hooks';
import { useStudents } from '@/src/hooks/useStudents';
import { useCourses } from '@/src/hooks/useCourses';
import { useChapters } from '@/src/hooks/useChapters';
import { useLibraries } from '@/src/hooks/useLibraries';
import type { Code, Student, Course, Chapter, Library, ActivateCodeRequest } from '@/src/types';
import toast from 'react-hot-toast';

type TabType = 'codes' | 'assign' | 'history';

export default function ActivationPage() {
  const [activeTab, setActiveTab] = useState<TabType>('codes');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [statusFilter, setStatusFilter] = useState('All');
  const [itemFilter, setItemFilter] = useState('All Items');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedCode, setSelectedCode] = useState<Code | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Assign tab states
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedCodeId, setSelectedCodeId] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [codeSearch, setCodeSearch] = useState('');
  const [assignSuccessMessage, setAssignSuccessMessage] = useState('');

  // History tab states
  const [historyStudentSearch, setHistoryStudentSearch] = useState('');
  const [selectedHistoryStudent, setSelectedHistoryStudent] = useState<Student | null>(null);

  const { data: codes, isLoading, error, refetch } = useCodes();
  const { mutate: deleteCode, isLoading: isDeleting } = useDeleteCode();
  const { mutate: activateCode, isLoading: isAssigning } = useActivateCode();
  const { data: students, isLoading: isLoadingStudents } = useStudents();
  const { data: courses } = useCourses();
  const { data: chapters } = useChapters();
  const { data: libraries } = useLibraries();

  const handleDelete = (code: Code) => {
    setSelectedCode(code);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedCode) return;

    try {
      await deleteCode(parseInt(selectedCode.id));
      setDeleteModalOpen(false);
      setSelectedCode(null);
      refetch();
    } catch {
      // Error handled by hook
    }
  };

  const handleRefresh = async () => {
    if (!codes || codes.length === 0) return;

    setIsRefreshing(true);
    const orphanedCodes: Code[] = [];

    // Identify codes that don't belong to anything
    codes.forEach((code) => {
      const itemName = getItemName(code.attributes.codeable_type, code.attributes.codeable_id);
      // Check if the item name is a fallback (e.g., "Course #123", "Chapter #123", "Library #123")
      const isOrphaned = /^(Course|Chapter|Library) #\d+$/.test(itemName);
      if (isOrphaned) {
        orphanedCodes.push(code);
      }
    });

    if (orphanedCodes.length === 0) {
      toast.success('No orphaned codes found. All codes are valid!');
      setIsRefreshing(false);
      return;
    }

    const deletePromises = orphanedCodes.map((code) =>
      deleteCode(parseInt(code.id))
    );

    try {
      await Promise.all(deletePromises);
      toast.success(`${orphanedCodes.length} orphaned code(s) removed successfully`);
      refetch();
    } catch {
      toast.error('Failed to remove some orphaned codes');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success('Code copied to clipboard');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !selectedCodeId) {
      toast.error('Please select both a student and a code');
      return;
    }

    const code = codes?.find((c) => c.id === selectedCodeId);
    if (!code) {
      toast.error('Code not found');
      return;
    }

    try {
      const itemType: 'course' | 'chapter' | 'library' =
        code.attributes.codeable_type === 'App\\Models\\Course'
          ? 'course'
          : code.attributes.codeable_type === 'App\\Models\\Chapter'
          ? 'chapter'
          : 'library';
      await activateCode({
        code: code.attributes.code,
        item_id: code.attributes.codeable_id,
        item_type: itemType,
        user_id: selectedStudent,
      });
      const student = students?.data?.find((s: Student) => s.id === selectedStudent);
      setAssignSuccessMessage(`Code "${code.attributes.code}" successfully assigned to ${student?.attributes.first_name || ''} ${student?.attributes.last_name || 'student'}!`);
      toast.success('Code assigned successfully!');
      setSelectedStudent('');
      setSelectedCodeId('');
      setTimeout(() => setAssignSuccessMessage(''), 5000);
    } catch {
      // Error handled by hook
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'App\\Models\\Course': 'Course',
      'App\\Models\\Chapter': 'Chapter',
      'App\\Models\\Library': 'Library',
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'App\\Models\\Course': 'bg-blue-100 text-blue-700',
      'App\\Models\\Chapter': 'bg-green-100 text-green-700',
      'App\\Models\\Library': 'bg-purple-100 text-purple-700',
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  const getItemName = (type: string, id: number) => {
    let item: Course | Chapter | Library | undefined;
    switch (type) {
      case 'App\\Models\\Course':
        item = courses?.find((c: Course) => parseInt(c.id) === id);
        return item?.attributes.title || `Course #${id}`;
      case 'App\\Models\\Chapter':
        item = chapters?.find((c: Chapter) => parseInt(c.id) === id);
        return item?.attributes.title || `Chapter #${id}`;
      case 'App\\Models\\Library':
        item = libraries?.find((l: Library) => parseInt(l.id) === id);
        return item?.attributes.title || `Library #${id}`;
      default:
        return `Item #${id}`;
    }
  };

  const getItemOptions = () => {
    if (typeFilter === 'All Types') return [];

    switch (typeFilter) {
      case 'Course':
        return courses?.map((c) => ({ value: c.id, label: c.attributes.title })) || [];
      case 'Chapter':
        return chapters?.map((c) => ({ value: c.id, label: c.attributes.title })) || [];
      case 'Library':
        return libraries?.map((l) => ({ value: l.id, label: l.attributes.title })) || [];
      default:
        return [];
    }
  };

  const filteredCodes = codes?.filter((code) => {
    const matchesSearch = code.attributes.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'All Types' || getTypeLabel(code.attributes.codeable_type) === typeFilter;
    const matchesStatus = statusFilter === 'All' ||
      (statusFilter === 'Used' && code.attributes.is_used) ||
      (statusFilter === 'Available' && !code.attributes.is_used);
    const matchesItem = itemFilter === 'All Items' ||
      (code.attributes.codeable_id.toString() === itemFilter && getTypeLabel(code.attributes.codeable_type) === typeFilter);
    return matchesSearch && matchesType && matchesStatus && matchesItem;
  }) || [];

  const columns: Column<Code>[] = [
    {
      key: 'code',
      header: 'Code',
      render: (item) => (
        <div className="flex items-center gap-2">
          <span className="font-mono font-medium text-[#1E293B]">{item.attributes.code}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCopyCode(item.attributes.code);
            }}
            className="p-1 hover:bg-[#EEF2FF] rounded transition-colors"
            title="Copy code"
          >
            {copiedCode === item.attributes.code ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4 text-[#64748B]" />
            )}
          </button>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (item) => (
        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getTypeColor(item.attributes.codeable_type)}`}>
          {getTypeLabel(item.attributes.codeable_type)}
        </span>
      ),
    },
    {
      key: 'item',
      header: 'Item',
      render: (item) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium text-[#1E293B] truncate max-w-[200px]">
            {getItemName(item.attributes.codeable_type, item.attributes.codeable_id)}
          </span>
          <span className="text-xs text-[#94A3B8]">ID: {item.attributes.codeable_id}</span>
        </div>
      ),
    },
    {
      key: 'is_used',
      header: 'Status',
      render: (item) => (
        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
          item.attributes.is_used 
            ? 'bg-red-100 text-red-700' 
            : 'bg-green-100 text-green-700'
        }`}>
          {item.attributes.is_used ? 'Used' : 'Available'}
        </span>
      ),
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (item) =>
        item.attributes.created_at
          ? new Date(item.attributes.created_at).toLocaleDateString()
          : '-',
    },
  ];

  if (error) {
    return (
      <div className="flex flex-col gap-8 pb-12">
        <AdminPageHeader
          title="Activation Management"
          description="Manage activation codes for courses, chapters, and library items"
          actionLabel="Generate Codes"
          actionHref="/activation/generate"
        />
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <p className="text-red-600">Failed to load activation codes: {error}</p>
          <button
            onClick={refetch}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const studentsList = students?.data || [];
  const filteredStudents = studentsList.filter((student: Student) => {
    const fullName = `${student.attributes.first_name} ${student.attributes.last_name}`.toLowerCase();
    const email = student.attributes.email?.toLowerCase() || '';
    const search = studentSearch.toLowerCase();
    return fullName.includes(search) || email.includes(search);
  });

  const filteredHistoryStudents = studentsList.filter((student: Student) => {
    const fullName = `${student.attributes.first_name} ${student.attributes.last_name}`.toLowerCase();
    const email = student.attributes.email?.toLowerCase() || '';
    const search = historyStudentSearch.toLowerCase();
    return fullName.includes(search) || email.includes(search);
  });

  return (
    <div className="flex flex-col gap-8 pb-12">
      <AdminPageHeader
        title="Activation Management"
        description="Manage activation codes for courses, chapters, and library items"
        actionLabel="Generate Codes"
        actionHref="/activation/generate"
      />

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E2E8F0]">
        <button
          onClick={() => setActiveTab('codes')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 ${
            activeTab === 'codes'
              ? 'border-[#2137D6] text-[#2137D6]'
              : 'border-transparent text-[#64748B] hover:text-[#1E293B]'
          }`}
        >
          <List className="w-4 h-4" />
          All Codes
        </button>
        <button
          onClick={() => setActiveTab('assign')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 ${
            activeTab === 'assign'
              ? 'border-[#2137D6] text-[#2137D6]'
              : 'border-transparent text-[#64748B] hover:text-[#1E293B]'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          Assign to User
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 ${
            activeTab === 'history'
              ? 'border-[#2137D6] text-[#2137D6]'
              : 'border-transparent text-[#64748B] hover:text-[#1E293B]'
          }`}
        >
          <History className="w-4 h-4" />
          Student History
        </button>
      </div>

      {/* Codes Tab */}
      {activeTab === 'codes' && (
        <>
          <div className="flex items-center justify-between">
            <SearchFilter
            searchPlaceholder="Search activation codes..."
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            filters={[
              {
                key: 'type',
                label: 'All Types',
                options: [
                  { value: 'Course', label: 'Course' },
                  { value: 'Chapter', label: 'Chapter' },
                  { value: 'Library', label: 'Library' },
                ],
                value: typeFilter === 'All Types' ? '' : typeFilter,
                onChange: (val) => {
                  setTypeFilter(val || 'All Types');
                  setItemFilter('All Items');
                },
              },
              ...(typeFilter !== 'All Types' && getItemOptions().length > 0 ? [{
                key: 'item',
                label: 'All Items',
                options: getItemOptions(),
                value: itemFilter === 'All Items' ? '' : itemFilter,
                onChange: (val: string) => setItemFilter(val || 'All Items'),
              }] : []),
              {
                key: 'status',
                label: 'All Status',
                options: [
                  { value: 'Used', label: 'Used' },
                  { value: 'Available', label: 'Available' },
                ],
                value: statusFilter === 'All' ? '' : statusFilter,
                onChange: (val) => setStatusFilter(val || 'All'),
              },
            ]}
          />
            <button
              onClick={handleRefresh}
              disabled={isRefreshing || isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E2E8F0] text-[#64748B] rounded-xl text-sm font-medium hover:bg-[#F8FAFC] hover:text-[#1E293B] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              title="Remove codes that don't belong to any item"
            >
              {isRefreshing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Cleaning...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Clean Invalid
                </>
              )}
            </button>
          </div>

          <DataTable
            data={filteredCodes}
            columns={columns}
            isLoading={isLoading}
            keyExtractor={(item) => item.id}
            onDelete={handleDelete}
            editHref={(item) => `/activation/${item.id}/edit`}
            emptyMessage="No activation codes found. Generate your first codes!"
          />
        </>
      )}

      {/* Assign to User Tab */}
      {activeTab === 'assign' && (
        <form onSubmit={handleAssign} className="flex flex-col gap-6">
          {/* Student Selection */}
          <section className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#F1F5F9] bg-[#F8FAFC]/50">
              <h2 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider">Select Student</h2>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                <input
                  type="text"
                  placeholder="Search students by name or email..."
                  className="w-full pl-11 pr-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                />
              </div>

              <div className="max-h-64 overflow-y-auto border border-[#E2E8F0] rounded-xl">
                {isLoadingStudents ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-[#2137D6]" />
                  </div>
                ) : filteredStudents && filteredStudents.length > 0 ? (
                  <div className="divide-y divide-[#E2E8F0]">
                    {filteredStudents.map((student: Student) => (
                      <label
                        key={student.id}
                        className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-[#F8FAFC] transition-colors ${
                          selectedStudent === student.id ? 'bg-[#EEF2FF]' : ''
                        }`}
                      >
                        <input
                          type="radio"
                          name="student"
                          value={student.id}
                          checked={selectedStudent === student.id}
                          onChange={(e) => setSelectedStudent(e.target.value)}
                          className="w-4 h-4 text-[#2137D6] focus:ring-[#2137D6]"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-[#1E293B]">
                            {student.attributes.first_name} {student.attributes.last_name}
                          </p>
                          <p className="text-sm text-[#64748B]">{student.attributes.email}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-[#64748B]">
                    No students found
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Code Selection */}
          <section className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#F1F5F9] bg-[#F8FAFC]/50">
              <h2 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider">Select Activation Code</h2>
            </div>
            <div className="p-6">
              {/* Code Search */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                  <input
                    type="text"
                    placeholder="Search by code..."
                    value={codeSearch}
                    onChange={(e) => setCodeSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all"
                  />
                </div>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-[#2137D6]" />
                </div>
              ) : codes && codes.length > 0 ? (
                (() => {
                  const availableCodes = codes.filter((code) => !code.attributes.is_used);
                  const filteredCodes = availableCodes.filter((code) =>
                    code.attributes.code.toLowerCase().includes(codeSearch.toLowerCase())
                  );
                  return filteredCodes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                      {filteredCodes.map((code) => (
                        <label
                          key={code.id}
                          className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all ${
                            selectedCodeId === code.id
                              ? 'border-[#2137D6] bg-[#EEF2FF]'
                              : 'border-[#E2E8F0] hover:border-[#CBD5E1]'
                          }`}
                        >
                          <input
                            type="radio"
                            name="code"
                            value={code.id}
                            checked={selectedCodeId === code.id}
                            onChange={(e) => setSelectedCodeId(e.target.value)}
                            className="w-4 h-4 text-[#2137D6] focus:ring-[#2137D6]"
                          />
                          <div className="flex-1">
                            <p className="font-mono font-medium text-[#1E293B]">{code.attributes.code}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                                code.attributes.codeable_type === 'App\\Models\\Course'
                                  ? 'bg-blue-100 text-blue-700'
                                  : code.attributes.codeable_type === 'App\\Models\\Chapter'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-purple-100 text-purple-700'
                              }`}>
                                {getTypeLabel(code.attributes.codeable_type)}
                              </span>
                              <span className="text-xs text-[#64748B] truncate max-w-[150px]">
                                {getItemName(code.attributes.codeable_type, code.attributes.codeable_id)}
                              </span>
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-[#64748B]">
                      {availableCodes.length === 0 ? (
                        <>
                          No available codes to assign. All codes have been used.{' '}
                          <Link href="/activation/generate" className="text-[#2137D6] hover:underline">Generate new codes</Link>
                        </>
                      ) : (
                        <>
                          No codes match your search.{' '}
                          <button type="button" onClick={() => setCodeSearch('')} className="text-[#2137D6] hover:underline">Clear search</button>
                        </>
                      )}
                    </div>
                  );
                })()
              ) : (
                <div className="text-center py-8 text-[#64748B]">
                  No activation codes available. <Link href="/activation/generate" className="text-[#2137D6] hover:underline">Generate codes</Link>
                </div>
              )}
            </div>
          </section>

          {/* Success Message */}
          {assignSuccessMessage && (
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <p className="text-sm font-medium text-green-800">{assignSuccessMessage}</p>
            </div>
          )}

          {/* Action Button */}
          <div className="flex items-center justify-end">
            <button
              type="submit"
              disabled={isAssigning || !selectedStudent || !selectedCodeId}
              className="flex items-center gap-2 px-8 py-3 bg-[#2137D6] hover:bg-[#1a2bb3] text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAssigning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Assign to User
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Student History Tab */}
      {activeTab === 'history' && (
        <div className="flex flex-col gap-6">
          {/* Student Selection */}
          <section className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#F1F5F9] bg-[#F8FAFC]/50">
              <h2 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider">Select Student</h2>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                <input
                  type="text"
                  placeholder="Search students by name or email..."
                  className="w-full pl-11 pr-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all"
                  value={historyStudentSearch}
                  onChange={(e) => setHistoryStudentSearch(e.target.value)}
                />
              </div>

              <div className="max-h-48 overflow-y-auto border border-[#E2E8F0] rounded-xl">
                {isLoadingStudents ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-[#2137D6]" />
                  </div>
                ) : filteredHistoryStudents && filteredHistoryStudents.length > 0 ? (
                  <div className="divide-y divide-[#E2E8F0]">
                    {filteredHistoryStudents.map((student: Student) => (
                      <button
                        key={student.id}
                        onClick={() => setSelectedHistoryStudent(student)}
                        className={`flex items-center gap-3 p-3 w-full text-left hover:bg-[#F8FAFC] transition-colors ${
                          selectedHistoryStudent?.id === student.id ? 'bg-[#EEF2FF]' : ''
                        }`}
                      >
                        <div className={`w-2 h-2 rounded-full ${selectedHistoryStudent?.id === student.id ? 'bg-[#2137D6]' : 'bg-[#CBD5E1]'}`} />
                        <div className="flex-1">
                          <p className="font-medium text-[#1E293B]">
                            {student.attributes.first_name} {student.attributes.last_name}
                          </p>
                          <p className="text-sm text-[#64748B]">{student.attributes.email}</p>
                        </div>
                        {(student.attributes.used_codes?.length || 0) > 0 && (
                          <span className="px-2 py-0.5 bg-[#2137D6]/10 text-[#2137D6] text-xs font-medium rounded-full">
                            {student.attributes.used_codes?.length} code{student.attributes.used_codes?.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-[#64748B]">
                    No students found
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Student's Used Codes */}
          {selectedHistoryStudent && (
            <section className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-[#F1F5F9] bg-[#F8FAFC]/50 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider">
                    {selectedHistoryStudent.attributes.first_name} {selectedHistoryStudent.attributes.last_name}'s Used Codes
                  </h2>
                  <p className="text-xs text-[#64748B] mt-1">
                    {selectedHistoryStudent.attributes.used_codes?.length || 0} code(s) used
                  </p>
                </div>
                <button
                  onClick={() => setSelectedHistoryStudent(null)}
                  className="text-xs text-[#64748B] hover:text-[#EF4444]"
                >
                  Clear Selection
                </button>
              </div>
              <div className="p-6">
                {selectedHistoryStudent.attributes.used_codes && selectedHistoryStudent.attributes.used_codes.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedHistoryStudent.attributes.used_codes.map((code) => (
                      <div
                        key={code.id}
                        className="flex items-center gap-3 p-3 border border-[#E2E8F0] rounded-xl bg-[#F8FAFC]"
                      >
                        <div className="flex-1">
                          <p className="font-mono font-medium text-[#1E293B]">{code.attributes.code}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                              code.attributes.codeable_type === 'App\\Models\\Course'
                                ? 'bg-blue-100 text-blue-700'
                                : code.attributes.codeable_type === 'App\\Models\\Chapter'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-purple-100 text-purple-700'
                            }`}>
                              {getTypeLabel(code.attributes.codeable_type)}
                            </span>
                            <span className="text-xs text-[#64748B] truncate max-w-[150px]">
                              {getItemName(code.attributes.codeable_type, code.attributes.codeable_id)}
                            </span>
                          </div>
                        </div>
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-[10px] font-medium rounded-full">
                          Used
                        </span>
                        <button
                          onClick={() => handleCopyCode(code.attributes.code)}
                          className="p-1.5 hover:bg-[#EEF2FF] rounded-lg transition-colors"
                          title="Copy code"
                        >
                          {copiedCode === code.attributes.code ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4 text-[#64748B]" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-[#64748B]">
                    <p>This student has not used any activation codes yet.</p>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      )}

      <DeleteModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedCode(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Activation Code"
        itemName={selectedCode?.attributes.code || ''}
        isLoading={isDeleting}
      />
    </div>
  );
}

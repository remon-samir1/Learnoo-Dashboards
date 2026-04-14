'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
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
  const t = useTranslations();
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
      toast.success(t('activation.messages.noOrphanedCodes'));
      setIsRefreshing(false);
      return;
    }

    const deletePromises = orphanedCodes.map((code) =>
      deleteCode(parseInt(code.id))
    );

    try {
      await Promise.all(deletePromises);
      toast.success(`${orphanedCodes.length} ${t('activation.messages.orphanedCodesRemoved')}`);
      refetch();
    } catch {
      toast.error(t('activation.messages.failedRemoveOrphaned'));
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(t('activation.messages.codeCopied'));
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !selectedCodeId) {
      toast.error(t('activation.messages.selectStudentAndCode'));
      return;
    }

    const code = codes?.find((c) => c.id === selectedCodeId);
    if (!code) {
      toast.error(t('activation.messages.codeNotFound'));
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
      toast.success(t('activation.messages.codeAssigned'));
      setSelectedStudent('');
      setSelectedCodeId('');
      setTimeout(() => setAssignSuccessMessage(''), 5000);
    } catch {
      // Error handled by hook
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'App\\Models\\Course': t('activation.types.course'),
      'App\\Models\\Chapter': t('activation.types.chapter'),
      'App\\Models\\Library': t('activation.types.library'),
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
      header: t('activation.columns.code'),
      render: (item) => (
        <div className="flex items-center gap-2">
          <span className="font-mono font-medium text-[#1E293B]">{item.attributes.code}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCopyCode(item.attributes.code);
            }}
            className="p-1 hover:bg-[#EEF2FF] rounded transition-colors"
            title={t('activation.actions.copyCode')}
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
      header: t('activation.columns.type'),
      render: (item) => (
        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getTypeColor(item.attributes.codeable_type)}`}>
          {getTypeLabel(item.attributes.codeable_type)}
        </span>
      ),
    },
    {
      key: 'item',
      header: t('activation.columns.item'),
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
      header: t('activation.columns.status'),
      render: (item) => (
        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
          item.attributes.is_used
            ? 'bg-red-100 text-red-700'
            : 'bg-green-100 text-green-700'
        }`}>
          {item.attributes.is_used ? t('activation.status.used') : t('activation.status.available')}
        </span>
      ),
    },
    {
      key: 'created_at',
      header: t('activation.columns.created'),
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
          title={t('activation.pageTitle')}
          description={t('activation.pageDescription')}
          actionLabel={t('activation.generateCodes')}
          actionHref="/activation/generate"
        />
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <p className="text-red-600">{t('activation.messages.loadError')}: {error}</p>
          <button
            onClick={refetch}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            {t('common.retry')}
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
        title={t('activation.pageTitle')}
        description={t('activation.pageDescription')}
        actionLabel={t('activation.generateCodes')}
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
          {t('activation.tabs.allCodes')}
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
          {t('activation.tabs.assignToUser')}
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
          {t('activation.tabs.studentHistory')}
        </button>
      </div>

      {/* Codes Tab */}
      {activeTab === 'codes' && (
        <>
          <div className="flex items-center justify-between">
            <SearchFilter
            searchPlaceholder={t('activation.filters.searchPlaceholder')}
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            filters={[
              {
                key: 'type',
                label: t('activation.types.allTypes'),
                options: [
                  { value: 'Course', label: t('activation.types.course') },
                  { value: 'Chapter', label: t('activation.types.chapter') },
                  { value: 'Library', label: t('activation.types.library') },
                ],
                value: typeFilter === 'All Types' ? '' : typeFilter,
                onChange: (val) => {
                  setTypeFilter(val || 'All Types');
                  setItemFilter('All Items');
                },
              },
              ...(typeFilter !== 'All Types' && getItemOptions().length > 0 ? [{
                key: 'item',
                label: t('activation.filters.allItems'),
                options: getItemOptions(),
                value: itemFilter === 'All Items' ? '' : itemFilter,
                onChange: (val: string) => setItemFilter(val || 'All Items'),
              }] : []),
              {
                key: 'status',
                label: t('activation.status.allStatus'),
                options: [
                  { value: 'Used', label: t('activation.status.used') },
                  { value: 'Available', label: t('activation.status.available') },
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
                  {t('activation.actions.cleaning')}
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  {t('activation.actions.cleanInvalid')}
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
            emptyMessage={t('activation.messages.noCodesFound')}
          />
        </>
      )}

      {/* Assign to User Tab */}
      {activeTab === 'assign' && (
        <form onSubmit={handleAssign} className="flex flex-col gap-6">
          {/* Student Selection */}
          <section className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#F1F5F9] bg-[#F8FAFC]/50">
              <h2 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider">{t('activation.sections.selectStudent')}</h2>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                <input
                  type="text"
                  placeholder={t('activation.sections.searchStudents')}
                  className="w-full pl-11 pr-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                />
              </div>

              <div className="max-h-64 overflow-y-auto border border-[#E2E8F0] rounded-xl">
                {isLoadingStudents ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 text-[#2137D6] animate-spin" />
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
                    {t('activation.messages.noStudentsFound')}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Code Selection */}
          <section className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#F1F5F9] bg-[#F8FAFC]/50">
              <h2 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider">{t('activation.sections.selectCode')}</h2>
            </div>
            <div className="p-6">
              {/* Code Search */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                  <input
                    type="text"
                    placeholder={t('activation.sections.searchCodes')}
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
                          {t('activation.messages.noAvailableCodes')}{' '}
                          <Link href="/activation/generate" className="text-[#2137D6] hover:underline">{t('activation.messages.generateNewCodes')}</Link>
                        </>
                      ) : (
                        <>
                          {t('activation.messages.noCodesMatchSearch')}{' '}
                          <button type="button" onClick={() => setCodeSearch('')} className="text-[#2137D6] hover:underline">{t('activation.messages.clearSearch')}</button>
                        </>
                      )}
                    </div>
                  );
                })()
              ) : (
                <div className="text-center py-8 text-[#64748B]">
                  {t('activation.messages.noCodesAvailable')} <Link href="/activation/generate" className="text-[#2137D6] hover:underline">{t('activation.messages.generateCodesLink')}</Link>
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
                  {t('activation.actions.assigning')}
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  {t('activation.actions.assign')}
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
              <h2 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider">{t('activation.sections.selectStudent')}</h2>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                <input
                  type="text"
                  placeholder={t('activation.sections.searchStudents')}
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
                            {student.attributes.used_codes?.length} {t('activation.history.codeCount')}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-[#64748B]">
                    {t('activation.messages.noStudentsFound')}
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
                    {selectedHistoryStudent.attributes.first_name} {selectedHistoryStudent.attributes.last_name} - {t('activation.history.usedCodes')}
                  </h2>
                  <p className="text-xs text-[#64748B] mt-1">
                    {selectedHistoryStudent.attributes.used_codes?.length || 0} {t('activation.history.codeCount')}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedHistoryStudent(null)}
                  className="text-xs text-[#64748B] hover:text-[#EF4444]"
                >
                  {t('activation.actions.clearSelection')}
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
                              code.attributes.codeable_type === 'App\Models\Course'
                                ? 'bg-blue-100 text-blue-700'
                                : code.attributes.codeable_type === 'App\Models\Chapter'
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
                          {t('activation.status.used')}
                        </span>
                        <button
                          onClick={() => handleCopyCode(code.attributes.code)}
                          className="p-1.5 hover:bg-[#EEF2FF] rounded-lg transition-colors"
                          title={t('activation.actions.copyCode')}
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
                    <p>{t('activation.messages.studentNoCodes')}</p>
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
        title={t('activation.delete.title')}
        itemName={selectedCode?.attributes.code || ''}
        isLoading={isDeleting}
      />
    </div>
  );
}

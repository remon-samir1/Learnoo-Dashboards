'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useDepartments, useDeleteDepartment } from '@/src/hooks/useDepartments';
import { useFaculties } from '@/src/hooks/useFaculties';
import { GraduationCap } from 'lucide-react';
import { AdminPageHeader } from '@/src/components/admin/AdminPageHeader';
import { SearchFilter } from '@/src/components/admin/SearchFilter';
import { DataTable, Column } from '@/src/components/ui/DataTable';
import { DeleteModal } from '@/src/components/ui/DeleteModal';
import type { Department } from '@/src/types';

export default function DepartmentsPage() {
  const t = useTranslations();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  
  const { data: departments, isLoading, error, refetch } = useDepartments();
  const { data: faculties } = useFaculties();
  const { mutate: deleteDepartment, isLoading: isDeleting } = useDeleteDepartment();

  const handleDelete = (department: Department) => {
    setSelectedDepartment(department);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedDepartment) return;
    
    try {
      await deleteDepartment(parseInt(selectedDepartment.id));
      setDeleteModalOpen(false);
      setSelectedDepartment(null);
      refetch();
    } catch {
      // Error handled by hook
    }
  };

  const getParentName = (department: Department) => {
    return department.attributes.parent?.data?.attributes?.name || '-';
  };

  const getParentId = (department: Department) => {
    return department.attributes.parent?.data?.id;
  };

  const filteredDepartments = departments?.filter((d) => {
    const matchesSearch = d.attributes.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.attributes.code && d.attributes.code.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFaculty = !selectedFaculty || getParentId(d) === selectedFaculty;
    return matchesSearch && matchesFaculty;
  }) || [];

  const facultyOptions = faculties?.map(f => ({
    value: f.id,
    label: f.attributes.name,
  })) || [];

  const columns: Column<Department>[] = [
    {
      key: 'image',
      header: t('departments.columns.image'),
      render: (item) => (
        <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
          {item.attributes.image ? (
            <img 
              src={item.attributes.image} 
              alt={item.attributes.name} 
              className="w-full h-full object-cover"
            />
          ) : (
            <GraduationCap className="w-5 h-5 text-gray-400" />
          )}
        </div>
      ),
    },
    {
      key: 'name',
      header: t('departments.columns.name'),
      render: (item) => item.attributes.name,
    },
    {
      key: 'parent',
      header: t('departments.columns.parent'),
      render: (item) => getParentName(item),
    },
    {
      key: 'stats',
      header: t('departments.columns.stats'),
      render: (item) => (
        <div className="flex gap-4 text-xs">
          <span className="text-blue-600 font-medium">{item.attributes.stats?.courses || 0} {t('departments.stats.courses')}</span>
          <span className="text-green-600 font-medium">{item.attributes.stats?.students || 0} {t('departments.stats.students')}</span>
        </div>
      ),
    },
    {
      key: 'created_at',
      header: t('departments.columns.created'),
      render: (item) => item.attributes.created_at 
        ? new Date(item.attributes.created_at).toLocaleDateString() 
        : '-',
    },
  ];

  if (error) {
    return (
      <div className="flex flex-col gap-8">
        <AdminPageHeader
          title={t('departments.pageTitle')}
          description={t('departments.pageDescription')}
          actionLabel={t('departments.addDepartment')}
          actionHref="/departments/add"
        />
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <p className="text-red-600">{t('departments.loadError')}: {error}</p>
          <button
            onClick={refetch}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            {t('departments.retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-12">
      <AdminPageHeader
        title={t('departments.pageTitle')}
        description={t('departments.pageDescription')}
        actionLabel={t('departments.addDepartment')}
        actionHref="/departments/add"
      />

      <SearchFilter
        searchPlaceholder={t('departments.searchPlaceholder')}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        filters={[
          {
            key: 'faculty',
            label: t('departments.allFaculties'),
            options: facultyOptions,
            value: selectedFaculty,
            onChange: setSelectedFaculty,
          },
        ]}
      />

      <DataTable
        data={filteredDepartments}
        columns={columns}
        isLoading={isLoading}
        keyExtractor={(item) => item.id}
        onDelete={handleDelete}
        editHref={(item) => `/departments/${item.id}/edit`}
        emptyMessage={t('departments.noDepartments')}
      />

      <DeleteModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedDepartment(null);
        }}
        onConfirm={handleConfirmDelete}
        title={t('departments.deleteTitle')}
        itemName={selectedDepartment?.attributes.name || ''}
        isLoading={isDeleting}
      />
    </div>
  );
}

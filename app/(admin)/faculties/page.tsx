'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useFaculties, useDeleteFaculty } from '@/src/hooks/useFaculties';
import { useUniversities } from '@/src/hooks/useUniversities';
import { AdminPageHeader } from '@/src/components/admin/AdminPageHeader';
import { SearchFilter } from '@/src/components/admin/SearchFilter';
import { DataTable, Column } from '@/src/components/ui/DataTable';
import { DeleteModal } from '@/src/components/ui/DeleteModal';
import type { Faculty } from '@/src/types';

export default function FacultiesPage() {
  const t = useTranslations();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUniversity, setSelectedUniversity] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState<Faculty | null>(null);

  const { data: faculties, isLoading, error, refetch } = useFaculties();
  const { data: universities } = useUniversities();
  const { mutate: deleteFaculty, isLoading: isDeleting } = useDeleteFaculty();

  const handleDelete = (faculty: Faculty) => {
    setSelectedFaculty(faculty);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedFaculty) return;

    try {
      await deleteFaculty(parseInt(selectedFaculty.id));
      setDeleteModalOpen(false);
      setSelectedFaculty(null);
      refetch();
    } catch {
      // Error handled by hook
    }
  };

  // Get university name from parent relationship
  const getUniversityName = (faculty: Faculty) => {
    return faculty.attributes.parent?.data?.attributes?.name || '-';
  };

  const filteredFaculties = faculties?.filter((f) => {
    const matchesSearch = f.attributes.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesUniversity = !selectedUniversity || f.attributes.parent?.data?.id === selectedUniversity;
    return matchesSearch && matchesUniversity;
  }) || [];

  const universityOptions = universities?.map(u => ({
    value: u.id,
    label: u.attributes.name,
  })) || [];

  const columns: Column<Faculty>[] = [
    {
      key: 'name',
      header: t('faculties.columns.name'),
      render: (item) => item.attributes.name,
    },
    {
      key: 'university',
      header: t('faculties.columns.university'),
      render: (item) => getUniversityName(item),
    },
    {
      key: 'created_at',
      header: t('faculties.columns.created'),
      render: (item) => item.attributes.created_at
        ? new Date(item.attributes.created_at).toLocaleDateString()
        : '-',
    },
  ];

  if (error) {
    return (
      <div className="flex flex-col gap-8">
        <AdminPageHeader
          title={t('faculties.pageTitle')}
          description={t('faculties.pageDescription')}
          actionLabel={t('faculties.addFaculty')}
          actionHref="/faculties/add"
        />
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <p className="text-red-600">{t('faculties.loadError')}: {error}</p>
          <button
            onClick={refetch}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            {t('faculties.retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-12">
      <AdminPageHeader
        title={t('faculties.pageTitle')}
        description={t('faculties.pageDescription')}
        actionLabel={t('faculties.addFaculty')}
        actionHref="/faculties/add"
      />

      <SearchFilter
        searchPlaceholder={t('faculties.searchPlaceholder')}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        filters={[
          {
            key: 'university',
            label: t('faculties.allUniversities'),
            options: universityOptions,
            value: selectedUniversity,
            onChange: setSelectedUniversity,
          },
        ]}
      />

      <DataTable
        data={filteredFaculties}
        columns={columns}
        isLoading={isLoading}
        keyExtractor={(item) => item.id}
        onDelete={handleDelete}
        editHref={(item) => `/faculties/${item.id}/edit`}
        emptyMessage={t('faculties.noFaculties')}
      />

      <DeleteModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedFaculty(null);
        }}
        onConfirm={handleConfirmDelete}
        title={t('faculties.deleteTitle')}
        itemName={selectedFaculty?.attributes.name || ''}
        isLoading={isDeleting}
      />
    </div>
  );
}

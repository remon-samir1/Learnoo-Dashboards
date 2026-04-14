'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useUniversities, useDeleteUniversity } from '@/src/hooks/useUniversities';
import { AdminPageHeader } from '@/src/components/admin/AdminPageHeader';
import { SearchFilter } from '@/src/components/admin/SearchFilter';
import { DataTable, Column } from '@/src/components/ui/DataTable';
import { DeleteModal } from '@/src/components/ui/DeleteModal';
import type { University } from '@/src/types';

export default function UniversitiesPage() {
  const t = useTranslations();
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedUniversity, setSelectedUniversity] = useState<University | null>(null);
  
  const { data: universities, isLoading, error, refetch } = useUniversities();
  const { mutate: deleteUniversity, isLoading: isDeleting, isSuccess, reset } = useDeleteUniversity();

  const handleDelete = (university: University) => {
    setSelectedUniversity(university);
    setDeleteModalOpen(true);
  };

  // Handle successful deletion
  React.useEffect(() => {
    if (isSuccess) {
      setDeleteModalOpen(false);
      setSelectedUniversity(null);
      window.location.reload();
      reset();
    }
  }, [isSuccess, reset]);

  const handleConfirmDelete = async () => {
    if (!selectedUniversity) return;
    await deleteUniversity(parseInt(selectedUniversity.id));
  };

  const filteredUniversities = universities?.filter((u) =>
    u.attributes.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.attributes.code && u.attributes.code.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  const columns: Column<University>[] = [
    {
      key: 'name',
      header: t('universities.columns.name'),
      render: (item) => item.attributes.name,
    },
    {
      key: 'created_at',
      header: t('universities.columns.created'),
      render: (item) => item.attributes.created_at
        ? new Date(item.attributes.created_at).toLocaleDateString()
        : '-',
    },
  ];

  if (error) {
    return (
      <div className="flex flex-col gap-8">
        <AdminPageHeader
          title={t('universities.pageTitle')}
          description={t('universities.pageDescription')}
          actionLabel={t('universities.addUniversity')}
          actionHref="/universities/add"
        />
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <p className="text-red-600">{t('universities.loadError')}: {error}</p>
          <button
            onClick={refetch}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            {t('universities.retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-12">
      <AdminPageHeader
        title={t('universities.pageTitle')}
        description={t('universities.pageDescription')}
        actionLabel={t('universities.addUniversity')}
        actionHref="/universities/add"
      />

      <SearchFilter
        searchPlaceholder={t('universities.searchPlaceholder')}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <DataTable
        data={filteredUniversities}
        columns={columns}
        isLoading={isLoading}
        keyExtractor={(item) => item.id}
        onDelete={handleDelete}
        editHref={(item) => `/universities/${item.id}/edit`}
        emptyMessage={t('universities.noUniversities')}
      />

      <DeleteModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedUniversity(null);
        }}
        onConfirm={handleConfirmDelete}
        title={t('universities.deleteTitle')}
        itemName={selectedUniversity?.attributes.name || ''}
        isLoading={isDeleting}
      />
    </div>
  );
}

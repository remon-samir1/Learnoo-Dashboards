'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useLevels, useDeleteLevel } from '@/src/hooks/useLevels';
import { AdminPageHeader } from '@/src/components/admin/AdminPageHeader';
import { SearchFilter } from '@/src/components/admin/SearchFilter';
import { DataTable, Column } from '@/src/components/ui/DataTable';
import { DeleteModal } from '@/src/components/ui/DeleteModal';
import type { Level } from '@/src/types';

export default function LevelsPage() {
  const t = useTranslations('levels');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);
  
  const { data: levels, isLoading, error, refetch } = useLevels();
  const { mutate: deleteLevel, isLoading: isDeleting } = useDeleteLevel();

  const handleDelete = (level: Level) => {
    setSelectedLevel(level);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedLevel) return;
    
    try {
      await deleteLevel(parseInt(selectedLevel.id));
      setDeleteModalOpen(false);
      setSelectedLevel(null);
      refetch();
    } catch {
      // Error handled by hook
    }
  };

  const filteredLevels = levels?.filter((l) =>
    l.attributes.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.attributes.description.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const columns: Column<Level>[] = [
    {
      key: 'name',
      header: t('columns.name'),
      render: (item) => item.attributes.name,
    },
    {
      key: 'description',
      header: t('columns.description'),
      render: (item) => (
        <span className="truncate max-w-xs block" title={item.attributes.description}>
          {item.attributes.description}
        </span>
      ),
    },
    {
      key: 'created_at',
      header: t('columns.created'),
      render: (item) => item.attributes.created_at 
        ? new Date(item.attributes.created_at).toLocaleDateString() 
        : '-',
    },
  ];

  if (error) {
    return (
      <div className="flex flex-col gap-8">
        <AdminPageHeader
          title={t('pageTitle')}
          description={t('pageDescription')}
          actionLabel={t('addLevel')}
          actionHref="/levels/add"
        />
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <p className="text-red-600">{t('error')}: {error}</p>
          <button
            onClick={refetch}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            {t('retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-12">
      <AdminPageHeader
        title={t('pageTitle')}
        description={t('pageDescription')}
        actionLabel={t('addLevel')}
        actionHref="/levels/add"
      />

      <SearchFilter
        searchPlaceholder={t('searchPlaceholder')}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <DataTable
        data={filteredLevels}
        columns={columns}
        isLoading={isLoading}
        keyExtractor={(item) => item.id}
        onDelete={handleDelete}
        editHref={(item) => `/levels/${item.id}/edit`}
        emptyMessage={t('emptyMessage')}
      />

      <DeleteModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedLevel(null);
        }}
        onConfirm={handleConfirmDelete}
        title={t('deleteTitle')}
        itemName={selectedLevel?.attributes.name || ''}
        isLoading={isDeleting}
      />
    </div>
  );
}
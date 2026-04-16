'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useCenters, useDeleteCenter } from '@/src/hooks/useCenters';
import { AdminPageHeader } from '@/src/components/admin/AdminPageHeader';
import { SearchFilter } from '@/src/components/admin/SearchFilter';
import { DataTable, Column } from '@/src/components/ui/DataTable';
import { DeleteModal } from '@/src/components/ui/DeleteModal';
import { Building2 } from 'lucide-react';
import type { Center } from '@/src/types';

export default function CentersPage() {
  const t = useTranslations();
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedCenter, setSelectedCenter] = useState<Center | null>(null);

  const { data: centers, isLoading, error, refetch } = useCenters();
  const { mutate: deleteCenter, isLoading: isDeleting } = useDeleteCenter();

  const handleDelete = (center: Center) => {
    setSelectedCenter(center);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedCenter) return;

    try {
      await deleteCenter(parseInt(selectedCenter.id));
      setDeleteModalOpen(false);
      setSelectedCenter(null);
      refetch();
    } catch {
      // Error handled by hook
    }
  };

  const filteredCenters = centers?.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const columns: Column<Center>[] = [
    {
      key: 'image',
      header: t('centers.columns.image'),
      render: (item) => (
        <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
          {item.image ? (
            <img
              src={item.image}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <Building2 className="w-5 h-5 text-gray-400" />
          )}
        </div>
      ),
    },
    {
      key: 'name',
      header: t('centers.centerName'),
      render: (item) => (
        <span className="text-sm font-bold text-[#1E293B]">{item.name}</span>
      ),
    },
    {
      key: 'parent',
      header: t('centers.parent'),
      render: (item) => item.parent?.data?.attributes?.name || '-',
    },
    {
      key: 'created_at',
      header: t('centers.created'),
      render: (item) => item.created_at
        ? new Date(item.created_at).toLocaleDateString()
        : '-',
    },
  ];

  if (error) {
    return (
      <div className="flex flex-col gap-8">
        <AdminPageHeader
          title={t('centers.pageTitle')}
          description={t('centers.pageDescription')}
          actionLabel={t('centers.addCenter')}
          actionHref="/centers/add"
        />
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <p className="text-red-600">{t('centers.loadError')}: {error}</p>
          <button
            onClick={refetch}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            {t('centers.retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-12">
      <AdminPageHeader
        title={t('centers.pageTitle')}
        description={t('centers.pageDescription')}
        actionLabel={t('centers.addCenter')}
        actionHref="/centers/add"
      />

      <SearchFilter
        searchPlaceholder={t('centers.searchPlaceholder')}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <DataTable
        data={filteredCenters}
        columns={columns}
        isLoading={isLoading}
        keyExtractor={(item) => item.id}
        onDelete={handleDelete}
        editHref={(item) => `/centers/${item.id}/edit`}
        emptyMessage={t('centers.noCenters')}
      />

      <DeleteModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedCenter(null);
        }}
        onConfirm={handleConfirmDelete}
        title={t('centers.pageTitle')}
        itemName={selectedCenter?.name || ''}
        isLoading={isDeleting}
      />
    </div>
  );
}

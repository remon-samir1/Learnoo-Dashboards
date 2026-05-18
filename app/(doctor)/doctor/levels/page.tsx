'use client';

import React, { useState } from 'react';
import { useLevels, useDeleteLevel } from '@/src/hooks/useLevels';
import { AdminPageHeader } from '@/src/components/admin/AdminPageHeader';
import { SearchFilter } from '@/src/components/admin/SearchFilter';
import { DataTable, Column } from '@/src/components/ui/DataTable';
import { DeleteModal } from '@/src/components/ui/DeleteModal';
import type { Level } from '@/src/types';

export default function LevelsPage() {
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
      header: 'Name',
      render: (item) => item.attributes.name,
    },
    {
      key: 'description',
      header: 'Description',
      render: (item) => (
        <span className="truncate max-w-xs block" title={item.attributes.description}>
          {item.attributes.description}
        </span>
      ),
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (item) => item.attributes.created_at 
        ? new Date(item.attributes.created_at).toLocaleDateString() 
        : '-',
    },
  ];

  if (error) {
    return (
      <div className="flex flex-col gap-8">
        <AdminPageHeader
          title="Levels Management"
          description="Manage student levels and grades"
          actionLabel="Add Level"
          actionHref="/levels/add"
        />
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <p className="text-red-600">Failed to load levels: {error}</p>
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

  return (
    <div className="flex flex-col gap-8 pb-12">
      <AdminPageHeader
        title="Levels Management"
        description="Manage student levels and grades"
        actionLabel="Add Level"
        actionHref="/levels/add"
      />

      <SearchFilter
        searchPlaceholder="Search levels..."
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
        emptyMessage="No levels found. Create your first level!"
      />

      <DeleteModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedLevel(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Level"
        itemName={selectedLevel?.attributes.name || ''}
        isLoading={isDeleting}
      />
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { useCenters, useDeleteCenter } from '@/src/hooks/useCenters';
import { AdminPageHeader } from '@/src/components/admin/AdminPageHeader';
import { SearchFilter } from '@/src/components/admin/SearchFilter';
import { DataTable, Column } from '@/src/components/ui/DataTable';
import { DeleteModal } from '@/src/components/ui/DeleteModal';
import { Building2 } from 'lucide-react';
import type { Center } from '@/src/types';

export default function CentersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedCenter, setSelectedCenter] = useState<Center | null>(null);
  
  const { data: centers, isLoading, error, refetch } = useCenters([]);
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
      key: 'name',
      header: 'Center Name',
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#EEF2FF] rounded-xl flex items-center justify-center border border-indigo-50 shadow-sm">
            <Building2 className="w-5 h-5 text-[#4F46E5]" />
          </div>
          <span className="text-sm font-bold text-[#1E293B]">{item.name}</span>
        </div>
      ),
    },
    {
      key: 'parent_id',
      header: 'Parent Center',
      render: (item) => {
        if (!item.parent_id) return '-';
        const parent = centers?.find(c => parseInt(c.id) === item.parent_id);
        return parent?.name || '-';
      },
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (item) => item.created_at 
        ? new Date(item.created_at).toLocaleDateString() 
        : '-',
    },
  ];

  if (error) {
    return (
      <div className="flex flex-col gap-8">
        <AdminPageHeader
          title="Centers Management"
          description="Manage physical and virtual centers"
          actionLabel="Add Center"
          actionHref="/centers/add"
        />
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <p className="text-red-600">Failed to load centers: {error}</p>
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
        title="Centers Management"
        description="Manage physical and virtual centers"
        actionLabel="Add Center"
        actionHref="/centers/add"
      />

      <SearchFilter
        searchPlaceholder="Search centers..."
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
        emptyMessage="No centers found. Create your first center!"
      />

      <DeleteModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedCenter(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Center"
        itemName={selectedCenter?.name || ''}
        isLoading={isDeleting}
      />
    </div>
  );
}

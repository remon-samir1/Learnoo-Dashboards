'use client';

import React, { useState } from 'react';
import { useFaculties, useDeleteFaculty } from '@/src/hooks/useFaculties';
import { useUniversities } from '@/src/hooks/useUniversities';
import { AdminPageHeader } from '@/src/components/admin/AdminPageHeader';
import { SearchFilter } from '@/src/components/admin/SearchFilter';
import { DataTable, Column } from '@/src/components/ui/DataTable';
import { DeleteModal } from '@/src/components/ui/DeleteModal';
import type { Faculty } from '@/src/types';

export default function FacultiesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUniversity, setSelectedUniversity] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState<Faculty | null>(null);
  
  const { data: faculties, isLoading, error, refetch } = useFaculties([]);
  const { data: universities } = useUniversities([]);
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

  const getUniversityName = (universityId: number) => {
    const university = universities?.find(u => parseInt(u.id) === universityId);
    return university?.attributes.name || '-';
  };

  const filteredFaculties = faculties?.filter((f) => {
    const matchesSearch = f.attributes.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.attributes.code && f.attributes.code.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesUniversity = !selectedUniversity || f.attributes.university_id === parseInt(selectedUniversity);
    return matchesSearch && matchesUniversity;
  }) || [];

  const universityOptions = universities?.map(u => ({
    value: u.id,
    label: u.attributes.name,
  })) || [];

  const columns: Column<Faculty>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (item) => item.attributes.name,
    },
    {
      key: 'code',
      header: 'Code',
      render: (item) => item.attributes.code || '-',
    },
    {
      key: 'university',
      header: 'University',
      render: (item) => getUniversityName(item.attributes.university_id),
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
          title="Faculties Management"
          description="Manage faculties and colleges"
          actionLabel="Add Faculty"
          actionHref="/faculties/add"
        />
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <p className="text-red-600">Failed to load faculties: {error}</p>
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
        title="Faculties Management"
        description="Manage faculties and colleges"
        actionLabel="Add Faculty"
        actionHref="/faculties/add"
      />

      <SearchFilter
        searchPlaceholder="Search faculties..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        filters={[
          {
            key: 'university',
            label: 'All Universities',
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
        emptyMessage="No faculties found. Create your first faculty!"
      />

      <DeleteModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedFaculty(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Faculty"
        itemName={selectedFaculty?.attributes.name || ''}
        isLoading={isDeleting}
      />
    </div>
  );
}

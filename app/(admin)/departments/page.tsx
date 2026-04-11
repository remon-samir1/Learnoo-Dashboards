'use client';

import React, { useState } from 'react';
import { useDepartments, useDeleteDepartment } from '@/src/hooks/useDepartments';
import { useFaculties } from '@/src/hooks/useFaculties';
import { AdminPageHeader } from '@/src/components/admin/AdminPageHeader';
import { SearchFilter } from '@/src/components/admin/SearchFilter';
import { DataTable, Column } from '@/src/components/ui/DataTable';
import { DeleteModal } from '@/src/components/ui/DeleteModal';
import type { Department } from '@/src/types';

export default function DepartmentsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  
  const { data: departments, isLoading, error, refetch } = useDepartments([]);
  const { data: faculties } = useFaculties([]);
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

  const getFacultyName = (facultyId: number) => {
    const faculty = faculties?.find(f => parseInt(f.id) === facultyId);
    return faculty?.attributes.name || '-';
  };

  const filteredDepartments = departments?.filter((d) => {
    const matchesSearch = d.attributes.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.attributes.code && d.attributes.code.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFaculty = !selectedFaculty || d.attributes.faculty_id === parseInt(selectedFaculty);
    return matchesSearch && matchesFaculty;
  }) || [];

  const facultyOptions = faculties?.map(f => ({
    value: f.id,
    label: f.attributes.name,
  })) || [];

  const columns: Column<Department>[] = [
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
      key: 'faculty',
      header: 'Faculty',
      render: (item) => getFacultyName(item.attributes.faculty_id),
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
          title="Subjects Management"
          description="Manage subjects and departments (departments are subjects)"
          actionLabel="Add Subject"
          actionHref="/departments/add"
        />
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <p className="text-red-600">Failed to load subjects: {error}</p>
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
        title="Subjects Management"
        description="Manage subjects and departments (departments are subjects)"
        actionLabel="Add Subject"
        actionHref="/departments/add"
      />

      <SearchFilter
        searchPlaceholder="Search subjects..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        filters={[
          {
            key: 'faculty',
            label: 'All Faculties',
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
        emptyMessage="No subjects found. Create your first subject!"
      />

      <DeleteModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedDepartment(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Subject"
        itemName={selectedDepartment?.attributes.name || ''}
        isLoading={isDeleting}
      />
    </div>
  );
}

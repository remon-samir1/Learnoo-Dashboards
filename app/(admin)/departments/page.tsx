'use client';

import React, { useState } from 'react';
import { useDepartments, useDeleteDepartment } from '@/src/hooks/useDepartments';
import { useFaculties } from '@/src/hooks/useFaculties';
import { GraduationCap } from 'lucide-react';
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
      key: 'image',
      header: 'Image',
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
      key: 'stats',
      header: 'Stats',
      render: (item) => (
        <div className="flex gap-4 text-xs">
          <span className="text-blue-600 font-medium">{item.attributes.stats?.courses || 0} Courses</span>
          <span className="text-green-600 font-medium">{item.attributes.stats?.students || 0} Students</span>
        </div>
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
          title="Departments Management"
          description="Manage departments and categories"
          actionLabel="Add Department"
          actionHref="/departments/add"
        />
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <p className="text-red-600">Failed to load departments: {error}</p>
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
        title="Departments Management"
        description="Manage departments and categories"
        actionLabel="Add Department"
        actionHref="/departments/add"
      />

      <SearchFilter
        searchPlaceholder="Search departments..."
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
        emptyMessage="No departments found. Create your first department!"
      />

      <DeleteModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedDepartment(null);
        }}
        onConfirm= { handleConfirmDelete }
        title="Delete Department"
        itemName={selectedDepartment?.attributes.name || ''}
        isLoading={isDeleting}
      />
    </div>
  );
}

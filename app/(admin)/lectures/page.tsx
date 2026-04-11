'use client';

import React, { useState } from 'react';
import { useLectures, useDeleteLecture } from '@/src/hooks/useLectures';
import { useCourses } from '@/src/hooks/useCourses';
import { AdminPageHeader } from '@/src/components/admin/AdminPageHeader';
import { SearchFilter } from '@/src/components/admin/SearchFilter';
import { DataTable, Column } from '@/src/components/ui/DataTable';
import { DeleteModal } from '@/src/components/ui/DeleteModal';
import type { Lecture } from '@/src/types';

export default function LecturesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);
  
  const { data: lectures, isLoading, error, refetch } = useLectures([]);
  const { data: courses } = useCourses([]);
  const { mutate: deleteLecture, isLoading: isDeleting } = useDeleteLecture();

  const handleDelete = (lecture: Lecture) => {
    setSelectedLecture(lecture);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedLecture) return;
    
    try {
      await deleteLecture(parseInt(selectedLecture.id));
      setDeleteModalOpen(false);
      setSelectedLecture(null);
      refetch();
    } catch {
      // Error handled by hook
    }
  };

  const getCourseName = (courseId: number) => {
    const course = courses?.find(c => parseInt(c.id) === courseId);
    return course?.attributes.title || '-';
  };

  const filteredLectures = lectures?.filter((l) => {
    const matchesSearch = l.attributes.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.attributes.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCourse = !selectedCourse || l.attributes.course_id === parseInt(selectedCourse);
    return matchesSearch && matchesCourse;
  }) || [];

  const courseOptions = courses?.map(c => ({
    value: c.id,
    label: c.attributes.title,
  })) || [];

  const columns: Column<Lecture>[] = [
    {
      key: 'title',
      header: 'Title',
      render: (item) => item.attributes.title,
    },
    {
      key: 'course',
      header: 'Course',
      render: (item) => getCourseName(item.attributes.course_id),
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
          title="Lectures Management"
          description="Manage course lectures"
          actionLabel="Add Lecture"
          actionHref="/lectures/add"
        />
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <p className="text-red-600">Failed to load lectures: {error}</p>
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
        title="Lectures Management"
        description="Manage course lectures"
        actionLabel="Add Lecture"
        actionHref="/lectures/add"
      />

      <SearchFilter
        searchPlaceholder="Search lectures..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        filters={[
          {
            key: 'course',
            label: 'All Courses',
            options: courseOptions,
            value: selectedCourse,
            onChange: setSelectedCourse,
          },
        ]}
      />

      <DataTable
        data={filteredLectures}
        columns={columns}
        isLoading={isLoading}
        keyExtractor={(item) => item.id}
        onDelete={handleDelete}
        editHref={(item) => `/lectures/${item.id}/edit`}
        emptyMessage="No lectures found. Create your first lecture!"
      />

      <DeleteModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedLecture(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Lecture"
        itemName={selectedLecture?.attributes.title || ''}
        isLoading={isDeleting}
      />
    </div>
  );
}

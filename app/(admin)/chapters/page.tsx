'use client';

import React, { useState } from 'react';

import { useChapters, useRetryChapterConversion } from '@/src/hooks/useChapters';

import { useLectures } from '@/src/hooks/useLectures';

import { AdminPageHeader } from '@/src/components/admin/AdminPageHeader';

import { SearchFilter } from '@/src/components/admin/SearchFilter';

import { DataTable, Column } from '@/src/components/ui/DataTable';

import type { Chapter } from '@/src/types';

export default function ChaptersPage() {

  const [searchQuery, setSearchQuery] = useState('');

  const [selectedLecture, setSelectedLecture] = useState('');

  const { data: chapters, isLoading, error, refetch } = useChapters();

  const { data: lectures } = useLectures();

  const { mutate: retryConversion, isLoading: isRetrying } = useRetryChapterConversion();

  const handleRetryConversion = async (chapterId: number) => {
    try {
      await retryConversion(chapterId);
      refetch();
    } catch {
      // Error surfaced by the mutation hook itself.
    }
  };

  const getLectureName = (lectureId: number) => {

    const lecture = lectures?.find(l => parseInt(l.id) === lectureId);

    return lecture?.attributes.title || '-';

  };

  const filteredChapters = chapters?.filter((c) => {

    const matchesSearch = c.attributes.title.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesLecture = !selectedLecture || c.attributes.lecture_id === parseInt(selectedLecture);

    return matchesSearch && matchesLecture;

  }) || [];

  const lectureOptions = lectures?.map(l => ({

    value: l.id,

    label: l.attributes.title,

  })) || [];

  const columns: Column<Chapter>[] = [

    {

      key: 'title',

      header: 'Title',

      render: (item) => item.attributes.title,

    },

    {

      key: 'lecture',

      header: 'Lecture',

      render: (item) => getLectureName(item.attributes.lecture_id),

    },

    {

      key: 'duration',

      header: 'Duration',

      render: (item) => item.attributes.duration,

    },

    {

      key: 'video_status',

      header: 'Video',

      render: (item) => {

        const status = item.attributes.video_status ?? 'none';

        if (status === 'none') return <span className="text-gray-400">—</span>;

        const badgeClass: Record<string, string> = {
          ready: 'bg-green-100 text-green-700',
          queued: 'bg-blue-100 text-blue-700',
          processing: 'bg-blue-100 text-blue-700',
          failed: 'bg-red-100 text-red-700',
        };

        return (

          <div className="flex flex-col gap-1">

            <span
              className={`inline-flex w-fit px-2 py-1 rounded-full text-xs font-medium ${badgeClass[status] ?? 'bg-gray-100 text-gray-700'}`}
              title={item.attributes.video_status_reason ?? undefined}
            >

              {status}

            </span>

            {status === 'failed' && (

              <button

                type="button"

                onClick={() => handleRetryConversion(parseInt(item.id))}

                disabled={isRetrying}

                className="text-xs font-medium text-blue-600 hover:underline disabled:opacity-50"

              >

                Retry conversion

              </button>

            )}

          </div>

        );

      },

    },

    {

      key: 'is_free_preview',

      header: 'Free Preview',

      render: (item) => (

        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${

          item.attributes.is_free_preview === 1

            ? 'bg-green-100 text-green-700' 

            : 'bg-gray-100 text-gray-700'

        }`}>

          {item.attributes.is_free_preview === 1 ? 'Yes' : 'No'}

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

          title="Chapters Management"

          description="Manage lecture chapters and videos"

        />

        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">

          <p className="text-red-600">Failed to load chapters: {error}</p>

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

        title="Chapters Management"

        description="Manage lecture chapters and videos"

      />

      <SearchFilter

        searchPlaceholder="Search chapters..."

        searchValue={searchQuery}

        onSearchChange={setSearchQuery}

        filters={[

          {

            key: 'lecture',

            label: 'All Lectures',

            options: lectureOptions,

            value: selectedLecture,

            onChange: setSelectedLecture,

          },

        ]}

      />

      <DataTable

        data={filteredChapters}

        columns={columns}

        isLoading={isLoading}

        keyExtractor={(item) => item.id}

        showActions={false}

        emptyMessage="No chapters found."

      />

    </div>

  );

}


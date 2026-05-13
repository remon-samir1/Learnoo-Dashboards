'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown, FileText, Loader2, X } from 'lucide-react';
import { DeleteModal } from '@/src/components/ui/DeleteModal';
import { useDeleteNote, useUpdateNote } from '@/src/hooks/useNotes';
import type { Note, NoteType } from '@/src/types';

type StudentCourseNotesTabProps = {
  notes: Note[] | undefined;
  courseId: number;
  courseTitle: string;
  onNotesUpdated: () => void;
};

export default function StudentCourseNotesTab({
  notes,
  courseId,
  courseTitle,
  onNotesUpdated,
}: StudentCourseNotesTabProps) {
  const t = useTranslations('courses.studentDetails');
  const tNs = useTranslations('notesSummaries');

  const {
    mutate: updateNote,
    isLoading: isUpdating,
    error: updateError,
    reset: resetUpdate,
  } = useUpdateNote();
  const {
    mutate: removeNote,
    isLoading: isDeleting,
    error: deleteError,
    reset: resetDelete,
  } = useDeleteNote();

  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Note | null>(null);

  const handleUpdated = useCallback(async () => {
    onNotesUpdated();
    resetUpdate();
  }, [onNotesUpdated, resetUpdate]);

  const handleDeleted = useCallback(async () => {
    onNotesUpdated();
    resetDelete();
  }, [onNotesUpdated, resetDelete]);

  if (!notes?.length) {
    return (
      <p className="rounded-2xl border border-[#E5E7EB] bg-white px-6 py-10 text-center text-sm text-[#64748B]">
        {t('notesEmpty')}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      {(updateError || deleteError) && (
        <div
          className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {updateError ? t('notes.updateError') : t('notes.deleteError')}
        </div>
      )}

      <ul className="flex flex-col gap-4 sm:gap-5">
        {notes.map((note, i) => (
          <StudentNoteCard
            key={String(note?.id ?? note?.attributes?.title ?? i)}
            note={note}
            untitledLabel={tNs('untitledNote')}
            onEdit={() => {
              resetUpdate();
              setEditingNote(note);
            }}
            onDelete={() => {
              resetDelete();
              setDeleteTarget(note);
            }}
            editLabel={tNs('detail.edit')}
            deleteLabel={tNs('detail.delete')}
          />
        ))}
      </ul>

      {editingNote ? (
        <StudentEditNoteModal
          note={editingNote}
          courseId={courseId}
          courseTitle={courseTitle}
          isSaving={isUpdating}
          onClose={() => {
            setEditingNote(null);
            resetUpdate();
          }}
          onSubmit={async (payload) => {
            const id = Number.parseInt(editingNote.id, 10);
            if (!Number.isFinite(id)) return;
            try {
              await updateNote(id, payload);
              setEditingNote(null);
              await handleUpdated();
            } catch {
              /* error surfaced via updateError */
            }
          }}
        />
      ) : null}

      <DeleteModal
        isOpen={!!deleteTarget}
        onClose={() => {
          setDeleteTarget(null);
          resetDelete();
        }}
        onConfirm={async () => {
          if (!deleteTarget) return;
          const id = Number.parseInt(deleteTarget.id, 10);
          if (!Number.isFinite(id)) return;
          try {
            await removeNote(id);
            setDeleteTarget(null);
            await handleDeleted();
          } catch {
            /* error surfaced via deleteError */
          }
        }}
        title={t('notes.deleteTitle')}
        description={t('notes.deleteDescription', {
          title:
            deleteTarget?.attributes?.title?.trim() ||
            tNs('untitledNote'),
        })}
        isLoading={isDeleting}
        cancelLabel={tNs('editNote.cancel')}
        confirmLabel={tNs('detail.delete')}
        confirmLoadingLabel={t('notes.deleting')}
      />
    </div>
  );
}

function StudentNoteCard({
  note,
  untitledLabel,
  onEdit,
  onDelete,
  editLabel,
  deleteLabel,
}: {
  note: Note;
  untitledLabel: string;
  onEdit: () => void;
  onDelete: () => void;
  editLabel: string;
  deleteLabel: string;
}) {
  const attrs = note.attributes;
  const title = attrs.title?.trim() || '';
  const linked = attrs.linked_lecture?.trim();
  const content = attrs.content?.trim() ?? '';
  const heading = title || untitledLabel;

  return (
    <li className="rounded-2xl border border-[#E5E7EB] bg-white px-5 py-5 shadow-sm sm:px-6 sm:py-6">
      <div className="flex flex-col gap-1 text-start">
        <h3 className="text-base font-bold leading-snug text-[#0F172A] sm:text-[17px]">
          {heading}
        </h3>
        {linked ? (
          <p className="text-sm font-medium text-[#64748B]">{linked}</p>
        ) : null}
        {content ? (
          <p className="mt-2 text-sm leading-relaxed text-[#475569]">{content}</p>
        ) : null}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-[#F1F5F9] pt-5">
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex h-10 shrink-0 items-center justify-center rounded-full border border-[#E2E8F0] bg-white px-6 text-sm font-semibold text-[#475569] shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-[#CBD5E1] hover:bg-[#F8FAFC] active:scale-[0.98]"
        >
          {editLabel}
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="inline-flex h-10 shrink-0 items-center justify-center rounded-full bg-[#EF4444] px-6 text-sm font-semibold text-white shadow-[0_1px_3px_rgba(239,68,68,0.35)] transition hover:bg-[#DC2626] hover:shadow-[0_2px_6px_rgba(220,38,38,0.35)] active:scale-[0.98]"
        >
          {deleteLabel}
        </button>
      </div>
    </li>
  );
}

function StudentEditNoteModal({
  note,
  courseId,
  courseTitle,
  isSaving,
  onClose,
  onSubmit,
}: {
  note: Note;
  courseId: number;
  courseTitle: string;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    type: NoteType;
    content: string;
    course_id: number;
    linked_lecture?: string;
    is_publish: boolean;
  }) => Promise<void>;
}) {
  const tNs = useTranslations('notesSummaries');

  const NOTE_TYPES = [
    { value: 'summary' as const, label: tNs('filters.summary') },
    { value: 'highlight' as const, label: tNs('filters.highlight') },
    { value: 'key_point' as const, label: tNs('filters.keyPoint') },
    { value: 'important_notice' as const, label: tNs('filters.importantNotice') },
  ];

  const [title, setTitle] = useState('');
  const [type, setType] = useState<string>('summary');
  const [content, setContent] = useState('');
  const [linkedLecture, setLinkedLecture] = useState('');
  const [isPublish, setIsPublish] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setTitle(note.attributes.title || '');
    setType(note.attributes.type || 'summary');
    setContent(note.attributes.content || '');
    setLinkedLecture(note.attributes.linked_lecture || '');
    setIsPublish(note.attributes.is_publish || false);
    setErrors({});
  }, [note]);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!title.trim()) {
      next.title = tNs('create.titleRequired');
    }
    if (!type.trim()) {
      next.type = tNs('create.typeRequired');
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit({
      title: title.trim(),
      type: type as NoteType,
      content: content.trim(),
      course_id: courseId,
      linked_lecture: linkedLecture.trim() || undefined,
      is_publish: isPublish,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-[#1E293B]">{tNs('editNote.pageTitle')}</h2>
            <p className="mt-0.5 text-sm text-[#64748B]">{tNs('editNote.pageDescription')}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-xl border border-[#E2E8F0] bg-white p-2.5 text-[#64748B] transition hover:text-[#1E293B] hover:shadow-sm disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-[#475569]">
              {tNs('editNote.titleLabel')} <span className="text-[#EF4444]">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={tNs('editNote.titlePlaceholder')}
              className={`w-full rounded-xl border bg-white px-4 py-3 text-sm transition-all placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 ${errors.title ? 'border-[#EF4444]' : 'border-[#E2E8F0]'
                }`}
            />
            {errors.title ? <p className="mt-1 text-sm text-[#EF4444]">{errors.title}</p> : null}
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-[#475569]">
              {tNs('editNote.typeLabel')} <span className="text-[#EF4444]">*</span>
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className={`w-full rounded-xl border bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 ${errors.type ? 'border-[#EF4444]' : 'border-[#E2E8F0]'
                }`}
            >
              {NOTE_TYPES.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {errors.type ? <p className="mt-1 text-sm text-[#EF4444]">{errors.type}</p> : null}
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-[#475569]">
              {tNs('editNote.courseLabel')}
            </label>
            <div className="relative">
              <select
                value={String(courseId)}
                disabled
                className="w-full cursor-not-allowed appearance-none rounded-xl border border-[#E2E8F0] bg-gray-50 px-4 py-3 text-sm opacity-80 focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 disabled:opacity-70"
              >
                <option value={String(courseId)}>{courseTitle}</option>
              </select>
              <ChevronDown className="pointer-events-none absolute end-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-[#475569]">
              {tNs('editNote.linkedLectureLabel')}
            </label>
            <input
              type="text"
              value={linkedLecture}
              onChange={(e) => setLinkedLecture(e.target.value)}
              placeholder={tNs('editNote.linkedLecturePlaceholder')}
              className="w-full rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 text-sm transition-all placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-[#475569]">
              {tNs('editNote.contentLabel')}
            </label>
            <div className="relative">
              <FileText className="absolute start-4 top-4 h-5 w-5 text-[#94A3B8]" />
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={tNs('editNote.contentPlaceholder')}
                rows={8}
                className="w-full resize-none rounded-xl border border-[#E2E8F0] bg-white py-4 pe-4 ps-12 text-sm transition-all placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10"
              />
            </div>
            <p className="mt-2 text-xs text-[#94A3B8]">
              {tNs('editNote.charactersCount', { count: content.length })}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="student-note-is-publish"
              checked={isPublish}
              onChange={(e) => setIsPublish(e.target.checked)}
              className="h-5 w-5 rounded border-[#E2E8F0] text-[#2137D6] focus:ring-[#2137D6]"
            />
            <label htmlFor="student-note-is-publish" className="text-sm font-semibold text-[#475569]">
              {tNs('create.publishImmediately')}
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-5 py-2.5 text-sm font-bold text-[#64748B] transition-colors hover:text-[#1E293B] disabled:opacity-50"
            >
              {tNs('editNote.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 rounded-xl bg-[#2137D6] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-[#1a2bb3] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {tNs('editNote.saving')}
                </>
              ) : (
                tNs('editNote.saveChanges')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

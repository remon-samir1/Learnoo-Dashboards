'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, Power, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useActivateCode } from '@/src/hooks';
import { ApiError } from '@/src/lib/api';
import { activateCodeResponseUnlocksQuiz } from '@/src/lib/student-quiz-activation-lock';
import type { ActivateCodeResponse } from '@/src/types';

export type StudentActivationItemType = 'course' | 'library' | 'chapter' | 'quiz';

export interface StudentCourseActivationModalProps {
  open: boolean;
  onClose: () => void;
  /**
   * Target resource id for POST `/v1/code/activate` as `item_id` (string form of integer).
   * Course id, chapter id, or library material id depending on `activationItemType`.
   */
  courseId: string;
  courseTitle?: string;
  /** `item_type` sent to `/v1/code/activate`. Defaults to `course`. */
  activationItemType?: StudentActivationItemType;
  onActivated?: (result?: ActivateCodeResponse) => void | Promise<void>;
}

function parseItemId(rawId: string): number | null {
  const n = Number.parseInt(rawId, 10);
  if (!Number.isFinite(n) || n < 1) return null;
  return n;
}

function invalidToastKey(
  type: StudentActivationItemType
): 'invalidLibrary' | 'invalidChapter' | 'invalidCourse' | 'invalidQuiz' {
  if (type === 'library') return 'invalidLibrary';
  if (type === 'chapter') return 'invalidChapter';
  if (type === 'quiz') return 'invalidQuiz';
  return 'invalidCourse';
}

function successToastKey(
  type: StudentActivationItemType
): 'successLibrary' | 'successChapter' | 'successQuiz' | 'success' {
  if (type === 'library') return 'successLibrary';
  if (type === 'chapter') return 'successChapter';
  if (type === 'quiz') return 'successQuiz';
  return 'success';
}

function descriptionKey(
  type: StudentActivationItemType
): 'descriptionLibrary' | 'descriptionChapter' | 'descriptionQuiz' | 'description' {
  if (type === 'library') return 'descriptionLibrary';
  if (type === 'chapter') return 'descriptionChapter';
  if (type === 'quiz') return 'descriptionQuiz';
  return 'description';
}

export function StudentCourseActivationModal(props: StudentCourseActivationModalProps) {
  if (!props.open) return null;
  return (
    <StudentCourseActivationModalInner
      key={`${props.activationItemType ?? 'course'}-${props.courseId}`}
      {...props}
    />
  );
}

function StudentCourseActivationModalInner({
  onClose,
  courseId,
  courseTitle,
  activationItemType = 'course',
  onActivated,
}: StudentCourseActivationModalProps) {
  const t = useTranslations('courses.studentActivation');
  const tView = useTranslations('courses.view');
  const [code, setCode] = useState('');
  const { mutate: activateCode, isLoading } = useActivateCode();

  const itemId = parseItemId(courseId);
  const itemType = activationItemType;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) {
      toast.error(t('enterCode'));
      return;
    }
    if (itemId == null) {
      toast.error(t(invalidToastKey(itemType)));
      return;
    }

    try {
      const result = await activateCode({
        code: trimmed,
        item_id: itemId,
        item_type: itemType,
      });
      if (itemType === 'quiz' && !activateCodeResponseUnlocksQuiz(result)) {
        toast.error(t('quizActivationNotEffective'));
        return;
      }
      toast.success(t(successToastKey(itemType)));
      await onActivated?.(result);
      onClose();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : t('genericError');
      toast.error(message);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="student-activation-modal-title"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-[#F1F5F9] bg-white shadow-xl animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-[#F1F5F9] p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2 min-w-0">
              <Power className="h-4 w-4 shrink-0 text-[#2137D6]" aria-hidden />
              <h2
                id="student-activation-modal-title"
                className="text-sm font-bold uppercase tracking-wider text-[#1E293B]"
              >
                {tView('sections.activation')}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="shrink-0 p-1 text-[#94A3B8] transition-colors hover:text-[#64748B] disabled:opacity-50"
              aria-label={t('close')}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          {courseTitle?.trim() ? (
            <p className="mt-3 text-sm font-medium text-[#475569]">{courseTitle.trim()}</p>
          ) : null}
          <p className="mt-2 text-xs text-[#64748B]">{t(descriptionKey(itemType))}</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
          <div>
            <label
              htmlFor="student-activation-code"
              className="mb-2 block text-xs font-bold text-[#64748B]"
            >
              {t('codeLabel')}
            </label>
            <input
              id="student-activation-code"
              type="text"
              name="activation-code"
              autoComplete="off"
              value={code}
              onChange={(ev) => setCode(ev.target.value)}
              placeholder={t('codePlaceholder')}
              disabled={isLoading}
              className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-2.5 text-sm text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 disabled:opacity-60"
            />
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="w-full rounded-xl border border-[#E2E8F0] bg-white px-4 py-2.5 text-sm font-medium text-[#475569] transition-all hover:bg-[#F8FAFC] disabled:opacity-50 sm:w-auto"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={isLoading || itemId == null}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2137D6] px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-[#1a2bb3] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  {tView('activating')}
                </>
              ) : (
                <>
                  <Power className="h-4 w-4" aria-hidden />
                  {tView('activate')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

'use client';

import { useTranslations } from 'next-intl';

export default function InstructorPublishingPolicy({ value, onChange, disabled = false }: {
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  const t = useTranslations('instructors.publishing');

  return <fieldset disabled={disabled} className="min-w-0 rounded-2xl border border-[#F1F5F9] bg-white p-6 shadow-sm">
    <legend className="px-1 text-sm font-semibold text-[#1E293B]">{t('title')}</legend>
    <p className="mb-4 text-sm leading-6 text-[#64748B]">{t('description')}</p>
    <div className="space-y-3">
      {[false, true].map(automatic => <label key={String(automatic)} className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#E2E8F0] p-4 text-start focus-within:ring-2 focus-within:ring-[#2137D6] has-[:checked]:border-[#2137D6]">
        <input type="radio" name="instructor-publishing" value={automatic ? 'automatic' : 'review'} checked={value === automatic} onChange={() => onChange(automatic)} className="mt-1 size-4 shrink-0 accent-[#2137D6]" />
        <span>
          <span className="block text-sm font-medium text-[#1E293B]">{t(automatic ? 'automatic' : 'review')}</span>
          <span className="mt-1 block text-sm leading-6 text-[#64748B]">{t(automatic ? 'automaticHint' : 'reviewHint')}</span>
        </span>
      </label>)}
    </div>
    <p className="mt-4 text-xs leading-5 text-[#64748B]">{t('existingCourses')}</p>
  </fieldset>;
}

'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import SettingsPageHeader from '@/components/settings/SettingsPageHeader';
import SettingsSection from '@/components/settings/SettingsSection';
import { useVideoSettings, useUpdateVideoSettings } from '@/src/hooks';
import { getApiErrorMessage } from '@/src/lib/api';
import {
  MAX_SLEEP_PER_MINUTE,
  MIN_SLEEP_PER_MINUTE,
  validateSleepPerMinute,
} from '@/src/lib/video-settings';
import toast, { Toaster } from 'react-hot-toast';

export default function VideoSettingsPage() {
  const t = useTranslations('videoSettings');
  const { data: sleepPerMinute, isLoading, isError, refetch, isFetching } = useVideoSettings();
  const updateVideoSettings = useUpdateVideoSettings();

  // `null` means "nothing typed yet", so the saved value is shown; a failed save keeps the draft.
  const [draft, setDraft] = useState<string | null>(null);
  const savedValue = sleepPerMinute !== undefined && sleepPerMinute !== null ? String(sleepPerMinute) : '';
  const value = draft ?? savedValue;

  const handleSave = async () => {
    const result = validateSleepPerMinute(value);
    if (!result.ok) {
      toast.error(
        result.error === 'range'
          ? t('validation.range', { min: MIN_SLEEP_PER_MINUTE, max: MAX_SLEEP_PER_MINUTE })
          : t(`validation.${result.error}`),
      );
      return;
    }

    try {
      await updateVideoSettings.mutateAsync({ sleep_per_minute: result.value });
      setDraft(null);
      toast.success(t('saved'));
    } catch (error) {
      // Surface the backend's own wording so a method/validation mismatch is visible.
      toast.error(getApiErrorMessage(error, t('saveFailed')));
    }
  };

  const handleCancel = () => {
    setDraft(null);
  };

  const isBusy = isLoading || updateVideoSettings.isPending;

  return (
    <div className="flex flex-col h-full">
      <Toaster position="top-right" />
      <SettingsPageHeader title={t('title')} description={t('description')} />

      <SettingsSection title={t('sectionTitle')}>
        {isLoading ? (
          <div className="space-y-6">
            <div className="animate-pulse">
              <div className="h-4 w-40 bg-gray-200 rounded mb-2"></div>
              <div className="h-10 w-full bg-gray-200 rounded-xl"></div>
            </div>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-start gap-3">
            <p className="text-[14px] text-[#B91C1C]">{t('loadFailed')}</p>
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className="px-5 py-2.5 text-[14px] font-semibold text-[#4B5563] bg-white border border-[#EEEEEE] hover:bg-[#F9FAFB] rounded-xl transition-colors hover:border-[#D1D5DB] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('retry')}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {sleepPerMinute === null && (
              <p className="text-[13px] text-[#92400E] bg-[#FFFBEB] border border-[#FDE68A] rounded-xl px-4 py-3">
                {t('emptyHint')}
              </p>
            )}
            <div className="grid grid-cols-1 gap-1.5">
              <label htmlFor="sleep-per-minute" className="text-[13px] font-medium text-[#4B5563]">
                {t('label')}
              </label>
              <div className="flex items-center gap-3">
                <input
                  id="sleep-per-minute"
                  type="number"
                  inputMode="numeric"
                  min={MIN_SLEEP_PER_MINUTE}
                  max={MAX_SLEEP_PER_MINUTE}
                  step={1}
                  name="sleepPerMinute"
                  value={value}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={String(MIN_SLEEP_PER_MINUTE)}
                  className="w-full px-4 py-2.5 bg-white border border-[#EEEEEE] rounded-xl text-[14px] text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2137D6]/20 focus:border-[#2137D6] transition-all hover:border-[#D1D5DB]"
                />
                <span className="text-[13px] text-[#6B7280] whitespace-nowrap">{t('unit')}</span>
              </div>
              <p className="text-[13px] text-[#6B7280] mt-1">{t('help')}</p>
              <p className="text-[12px] text-[#9CA3AF]">
                {t('rangeHint', { min: MIN_SLEEP_PER_MINUTE, max: MAX_SLEEP_PER_MINUTE })}
              </p>
            </div>
          </div>
        )}
      </SettingsSection>

      <div className="flex justify-end gap-4 mt-8 pb-8">
        <button
          type="button"
          onClick={handleCancel}
          disabled={isBusy || isError}
          className="px-5 py-2.5 text-[14px] font-semibold text-[#4B5563] bg-white border border-[#EEEEEE] hover:bg-[#F9FAFB] rounded-xl transition-colors hover:border-[#D1D5DB] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t('cancel')}
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isBusy || isError}
          className="px-5 py-2.5 text-[14px] font-semibold text-white bg-[#2137D6] hover:bg-[#1C2EB8] rounded-xl transition-colors shadow-md shadow-[#2137D6]/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {updateVideoSettings.isPending ? t('saving') : t('save')}
        </button>
      </div>
    </div>
  );
}

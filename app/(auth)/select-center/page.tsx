'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import type { Center } from '@/src/types';
import { useRegistrationOnboardingGuard } from '@/src/hooks/useRegistrationOnboardingGuard';
import {
  centerBelongsToUniversity,
  getEntityName,
} from '@/src/lib/onboarding-selection';
import AuthPageLayout from '../components/AuthLayout';

export default function SelectCenterPage() {
  const t = useTranslations('auth.selectCenter');
  const router = useRouter();

  const [centers, setCenters] = useState<Center[]>([]);
  const [selectedCenter, setSelectedCenter] = useState<Center | null>(null);
  const [universityName, setUniversityName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useRegistrationOnboardingGuard();

  useEffect(() => {
    loadData();
  }, []);

  function loadData() {
    setLoading(true);
    setError('');

    try {
      const universityId = sessionStorage.getItem('selection_universityId');
      const universityName = sessionStorage.getItem('selection_universityName');
      const allCenters = sessionStorage.getItem('selection_allCenters');

      if (!universityId || !universityName || !allCenters) {
        router.push('/select-university');
        return;
      }

      setUniversityName(universityName);

      const centersData: Center[] = JSON.parse(allCenters);
      const filteredCenters = centersData
        .filter((center): center is Center => Boolean(center))
        .filter((center) => centerBelongsToUniversity(center, universityId));

      setCenters(filteredCenters);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  const filteredCenters = centers.filter((center) =>
    getEntityName(center).toLowerCase().includes(searchQuery.toLowerCase())
  );

  function handleNext() {
    if (!selectedCenter) return;

    // Store selected center data
    sessionStorage.setItem('selection_centerId', selectedCenter.id);
    sessionStorage.setItem('selection_centerName', getEntityName(selectedCenter));

    router.push('/select-faculty');
  }

  function handleBack() {
    router.push('/select-university');
  }

  return (
    <AuthPageLayout title={t('title')} subtitle={t('subtitle')}>
      <div className="flex flex-col gap-5">
        {/* Progress Indicator */}
        <div className="flex items-center gap-2">
          <div className="flex h-8 items-center justify-center rounded-full bg-primary px-3 text-xs font-medium text-white">
            ✓
          </div>
          <div className="h-0.5 flex-1 bg-primary" />
          <div className="flex h-8 items-center justify-center rounded-full bg-primary px-3 text-xs font-medium text-white">
            2
          </div>
          <div className="h-0.5 flex-1 bg-gray-200" />
          <div className="flex h-8 items-center justify-center rounded-full bg-gray-200 px-3 text-xs font-medium text-gray-500">
            3
          </div>
        </div>

        {/* Step Label */}
        <p className="text-center font-sans text-xs font-medium text-text-muted">
          {t('step')} 2 {t('of')} 3
        </p>

        {/* Selected University Chip */}
        {universityName && (
          <div className="flex items-center justify-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2">
              <span className="font-sans text-xs font-medium text-primary">{universityName}</span>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="flex flex-col gap-2">
          <input
            type="text"
            className="h-10 w-full rounded-md border border-border-color bg-white px-3 py-[9px] font-sans text-sm leading-5 text-text-main shadow-[0px_1px_2px_rgba(0,0,0,0.05)] outline-none transition-colors placeholder:text-text-placeholder focus:border-primary focus:shadow-[0px_0px_0px_3px_rgba(33,55,214,0.1)]"
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : error ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-3">
            <p className="font-sans text-xs leading-5 text-red-600">{error}</p>
          </div>
        ) : (
          /* Center List */
          <div className="flex max-h-[300px] flex-col gap-2 overflow-y-auto">
            {filteredCenters.length === 0 ? (
              <p className="text-center font-sans text-xs text-text-muted">{t('noResults')}</p>
            ) : (
              filteredCenters.map((center) => (
                <button
                  key={center.id}
                  type="button"
                  onClick={() => setSelectedCenter(center)}
                  className={`flex items-center gap-3 rounded-md border p-3 text-left transition-colors ${
                    selectedCenter?.id === center.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border-color bg-white hover:border-primary/50'
                  }`}
                >
                  <div className="flex h-5 w-5 items-center justify-center rounded-full border-2">
                    {selectedCenter?.id === center.id && (
                      <div className="h-3 w-3 rounded-full bg-primary" />
                    )}
                  </div>
                  <span className="font-sans text-sm leading-5 text-text-main">
                    {getEntityName(center)}
                  </span>
                </button>
              ))
            )}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="h-9 flex-1 cursor-pointer rounded-lg border border-border-color bg-white font-sans text-[11.9px] font-medium leading-5 text-text-main transition-all hover:border-primary hover:text-primary active:scale-[0.99]"
          >
            {t('back')}
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={!selectedCenter || loading}
            className="h-9 flex-1 cursor-pointer rounded-lg border-none bg-primary font-sans text-[11.9px] font-medium leading-5 text-white transition-all hover:opacity-90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t('next')}
          </button>
        </div>
      </div>
    </AuthPageLayout>
  );
}

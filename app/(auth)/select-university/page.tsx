'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useRegistrationOnboardingGuard } from '@/src/hooks/useRegistrationOnboardingGuard';
import { universitiesApi, centersApi, facultiesApi } from '@/src/lib/api';
import { Center, Faculty, University } from '@/src/types';
import AuthPageLayout from '../components/AuthLayout';

export default function SelectUniversityPage() {
  const t = useTranslations('auth.selectUniversity');
  const router = useRouter();

  const [universities, setUniversities] = useState<University[]>([]);
  const [allCenters, setAllCenters] = useState<Center[]>([]);
  const [allFaculties, setAllFaculties] = useState<Faculty[]>([]);
  const [selectedUniversity, setSelectedUniversity] = useState<University | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useRegistrationOnboardingGuard();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    setError('');
    try {
      const [universitiesRes, centersRes, facultiesRes] = await Promise.all([
        universitiesApi.list(),
        centersApi.list(),
        facultiesApi.list(),
      ]);

      setUniversities(universitiesRes.data ?? []);
      setAllCenters(centersRes.data ?? []);
      setAllFaculties(facultiesRes.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  const filteredUniversities = universities.filter((uni) =>
    uni.attributes.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  function handleNext() {
    if (!selectedUniversity) return;

    // Store data in sessionStorage for next steps
    sessionStorage.setItem('selection_universityId', selectedUniversity.id);
    sessionStorage.setItem('selection_universityName', selectedUniversity.attributes.name);
    sessionStorage.setItem('selection_allCenters', JSON.stringify(allCenters));
    sessionStorage.setItem('selection_allFaculties', JSON.stringify(allFaculties));

    router.push('/select-center');
  }

  return (
    <AuthPageLayout title={t('title')} subtitle={t('subtitle')}>
      <div className="flex flex-col gap-5">
        {/* Progress Indicator */}
        <div className="flex items-center gap-2">
          <div className="flex h-8 items-center justify-center rounded-full bg-primary px-3 text-xs font-medium text-white">
            1
          </div>
          <div className="h-0.5 flex-1 bg-primary" />
          <div className="flex h-8 items-center justify-center rounded-full bg-gray-200 px-3 text-xs font-medium text-gray-500">
            2
          </div>
          <div className="h-0.5 flex-1 bg-gray-200" />
          <div className="flex h-8 items-center justify-center rounded-full bg-gray-200 px-3 text-xs font-medium text-gray-500">
            3
          </div>
        </div>

        {/* Step Label */}
        <p className="text-center font-sans text-xs font-medium text-text-muted">
          {t('step')} 1 {t('of')} 3
        </p>

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
          /* University List */
          <div className="flex max-h-[300px] flex-col gap-2 overflow-y-auto">
            {filteredUniversities.length === 0 ? (
              <p className="text-center font-sans text-xs text-text-muted">{t('noResults')}</p>
            ) : (
              filteredUniversities.map((uni) => (
                <button
                  key={uni.id}
                  type="button"
                  onClick={() => setSelectedUniversity(uni)}
                  className={`flex items-center gap-3 rounded-md border p-3 text-left transition-colors ${
                    selectedUniversity?.id === uni.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border-color bg-white hover:border-primary/50'
                  }`}
                >
                  <div className="flex h-5 w-5 items-center justify-center rounded-full border-2">
                    {selectedUniversity?.id === uni.id && (
                      <div className="h-3 w-3 rounded-full bg-primary" />
                    )}
                  </div>
                  <span className="font-sans text-sm leading-5 text-text-main">
                    {uni.attributes.name}
                  </span>
                </button>
              ))
            )}
          </div>
        )}

        {/* Next Button */}
        <button
          type="button"
          onClick={handleNext}
          disabled={!selectedUniversity || loading}
          className="mt-1 h-9 w-full cursor-pointer rounded-lg border-none bg-primary font-sans text-[11.9px] font-medium leading-5 text-white transition-all hover:opacity-90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t('next')}
        </button>
      </div>
    </AuthPageLayout>
  );
}

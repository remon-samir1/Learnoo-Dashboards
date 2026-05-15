'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { authApi } from '@/src/lib/api';
import { useRegistrationOnboardingGuard } from '@/src/hooks/useRegistrationOnboardingGuard';
import {
  clearRegistrationOnboarding,
  facultyBelongsToCenter,
  getEntityName,
} from '@/src/lib/onboarding-selection';
import { mergeOnboardingSelection } from '@/src/lib/profile-completeness';
import { useAuthActions } from '@/src/stores/authStore';
import type { Faculty } from '@/src/types';
import AuthPageLayout from '../components/AuthLayout';

export default function SelectFacultyPage() {
  const t = useTranslations('auth.selectFaculty');
  const router = useRouter();
  const locale = useLocale();
  const { updateUser } = useAuthActions();

  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [selectedFaculty, setSelectedFaculty] = useState<Faculty | null>(null);
  const [centerName, setCenterName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useRegistrationOnboardingGuard();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError('');

    try {
      const centerId = sessionStorage.getItem('selection_centerId');
      const centerName = sessionStorage.getItem('selection_centerName');
      const allFaculties = sessionStorage.getItem('selection_allFaculties');

      if (!centerId || !centerName || !allFaculties) {
        router.push('/select-university');
        return;
      }

      setCenterName(centerName);

      const facultiesData: Faculty[] = JSON.parse(allFaculties);
      const filteredFaculties = facultiesData.filter((faculty) =>
        facultyBelongsToCenter(faculty, centerId)
      );

      setFaculties(filteredFaculties);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  const filteredFaculties = faculties.filter((faculty) =>
    getEntityName(faculty).toLowerCase().includes(searchQuery.toLowerCase())
  );

  async function handleFinish() {
    if (!selectedFaculty) return;

    setSubmitting(true);
    setError('');

    try {
      const universityId = sessionStorage.getItem('selection_universityId');
      const centerId = sessionStorage.getItem('selection_centerId');

      if (!universityId || !centerId) {
        router.push('/select-university');
        return;
      }

      // Fetch current user data to preserve existing fields
      const currentUserResponse = await authApi.me();
      const currentUser = currentUserResponse.data;

      // Update user profile with selected university, center, and faculty
      await authApi.update({
        first_name: currentUser.attributes.first_name,
        last_name: currentUser.attributes.last_name,
        university_id: universityId,
        centers: [centerId],
        faculty_id: selectedFaculty.id,
      });

      // Clear session storage
      sessionStorage.removeItem('selection_universityId');
      sessionStorage.removeItem('selection_universityName');
      sessionStorage.removeItem('selection_centerId');
      sessionStorage.removeItem('selection_centerName');
      sessionStorage.removeItem('selection_allCenters');
      sessionStorage.removeItem('selection_allFaculties');
      clearRegistrationOnboarding();

      const response = await authApi.me();
      const completedUser = mergeOnboardingSelection(response.data, {
        universityId,
        centerId,
        facultyId: selectedFaculty.id,
      });
      updateUser(completedUser);

      router.replace(`/${locale}/student`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  }

  function handleBack() {
    router.push('/select-center');
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
            ✓
          </div>
          <div className="h-0.5 flex-1 bg-primary" />
          <div className="flex h-8 items-center justify-center rounded-full bg-primary px-3 text-xs font-medium text-white">
            3
          </div>
        </div>

        {/* Step Label */}
        <p className="text-center font-sans text-xs font-medium text-text-muted">
          {t('step')} 3 {t('of')} 3
        </p>

        {/* Selected Center Chip */}
        {centerName && (
          <div className="flex items-center justify-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2">
              <span className="font-sans text-xs font-medium text-primary">{centerName}</span>
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
          /* Faculty List */
          <div className="flex max-h-[300px] flex-col gap-2 overflow-y-auto">
            {filteredFaculties.length === 0 ? (
              <p className="text-center font-sans text-xs text-text-muted">{t('noResults')}</p>
            ) : (
              filteredFaculties.map((faculty) => (
                <button
                  key={faculty.id}
                  type="button"
                  onClick={() => setSelectedFaculty(faculty)}
                  className={`flex items-center gap-3 rounded-md border p-3 text-left transition-colors ${
                    selectedFaculty?.id === faculty.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border-color bg-white hover:border-primary/50'
                  }`}
                >
                  <div className="flex h-5 w-5 items-center justify-center rounded-full border-2">
                    {selectedFaculty?.id === faculty.id && (
                      <div className="h-3 w-3 rounded-full bg-primary" />
                    )}
                  </div>
                  <span className="font-sans text-sm leading-5 text-text-main">
                    {getEntityName(faculty)}
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
            disabled={submitting}
            className="h-9 flex-1 cursor-pointer rounded-lg border border-border-color bg-white font-sans text-[11.9px] font-medium leading-5 text-text-main transition-all hover:border-primary hover:text-primary active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t('back')}
          </button>
          <button
            type="button"
            onClick={handleFinish}
            disabled={!selectedFaculty || loading || submitting}
            className="h-9 flex-1 cursor-pointer rounded-lg border-none bg-primary font-sans text-[11.9px] font-medium leading-5 text-white transition-all hover:opacity-90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? t('submitting') : t('finish')}
          </button>
        </div>
      </div>
    </AuthPageLayout>
  );
}

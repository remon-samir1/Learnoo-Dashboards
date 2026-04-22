'use client';



import React, { useState, useEffect, useCallback } from 'react';

import { useTranslations } from 'next-intl';

import {

  ShieldCheck,

  Library,

  Laptop,

  Save,

  RotateCcw,

  Shield,

  Monitor,

  CameraOff,

  Maximize

} from 'lucide-react';

import { usePlatformFeature, useUpdatePlatformFeature } from '@/src/hooks';


import toast, { Toaster } from 'react-hot-toast';



interface Feature {

  id: string;

  name: string;

  description: string;

  enabled: boolean;

}



interface FeatureCategory {

  id: string;

  title: string;

  description: string;

  icon: React.ElementType;

  iconColor: string;

  iconBg: string;

  features: Feature[];

}



// Feature configurations structure (titles and descriptions use translations)

const getCategoryConfig = (t: (key: string) => string): FeatureCategory[] => [

  {

    id: 'auth',

    title: t('featureControl.categories.auth.title'),

    description: t('featureControl.categories.auth.description'),

    icon: ShieldCheck,

    iconColor: '#4F46E5',

    iconBg: '#EEF2FF',

    features: [

      { id: 'feature_otp_verification', name: t('featureControl.features.feature_otp_verification.name'), description: t('featureControl.features.feature_otp_verification.description'), enabled: true },

      { id: 'feature_login_without_otp', name: t('featureControl.features.feature_login_without_otp.name'), description: t('featureControl.features.feature_login_without_otp.description'), enabled: false },

      { id: 'feature_single_device_access', name: t('featureControl.features.feature_single_device_access.name'), description: t('featureControl.features.feature_single_device_access.description'), enabled: false },

      { id: 'feature_block_screenshots', name: t('featureControl.features.feature_block_screenshots.name'), description: t('featureControl.features.feature_block_screenshots.description'), enabled: false },

      { id: 'feature_screen_share_max_resolution', name: t('featureControl.features.feature_screen_share_max_resolution.name'), description: t('featureControl.features.feature_screen_share_max_resolution.description'), enabled: false },

    ]

  },

  {

    id: 'library',

    title: t('featureControl.categories.library.title'),

    description: t('featureControl.categories.library.description'),

    icon: Library,

    iconColor: '#10B981',

    iconBg: '#ECFDF5',

    features: [

      { id: 'feature_electronic_library', name: t('featureControl.features.feature_electronic_library.name'), description: t('featureControl.features.feature_electronic_library.description'), enabled: true },

      { id: 'feature_library_purchases', name: t('featureControl.features.feature_library_purchases.name'), description: t('featureControl.features.feature_library_purchases.description'), enabled: true },

    ]

  },

  {

    id: 'experience',

    title: t('featureControl.categories.experience.title'),

    description: t('featureControl.categories.experience.description'),

    icon: Laptop,

    iconColor: '#6366F1',

    iconBg: '#EEF2FF',

    features: [

      { id: 'feature_continue_watching', name: t('featureControl.features.feature_continue_watching.name'), description: t('featureControl.features.feature_continue_watching.description'), enabled: true },

      { id: 'feature_profile_editing', name: t('featureControl.features.feature_profile_editing.name'), description: t('featureControl.features.feature_profile_editing.description'), enabled: true },

    ]

  },


];



const Switch = ({ enabled, onChange, disabled }: { enabled: boolean; onChange: () => void; disabled?: boolean }) => (

  <button

    onClick={onChange}

    disabled={disabled}

    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${

      enabled ? 'bg-[#2137D6]' : 'bg-[#E2E8F0]'

    }`}

  >

    <span

      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${

        enabled ? 'translate-x-5' : 'translate-x-0'

      }`}

    />

  </button>

);



export default function FeatureControlPage() {

  const t = useTranslations();

  const { data: features, isLoading } = usePlatformFeature();

  const updateFeature = useUpdatePlatformFeature();



  const [categories, setCategories] = useState<FeatureCategory[]>(getCategoryConfig(t));

  const [hasChanges, setHasChanges] = useState(false);




  // Helper to get feature value by key

  const getFeatureValue = useCallback((key: string, defaultValue: string = '1'): string => {

    if (!features) return defaultValue;

    const feature = features.find((f) => f.attributes.key === key);

    return feature?.attributes.value || defaultValue;

  }, [features]);



  // Load saved feature values from backend

  useEffect(() => {

    if (features) {

      setCategories(prev => {

        // Re-apply translations to ensure they're current

        const baseCategories = getCategoryConfig(t);

        return baseCategories.map(baseCat => {

          const prevCat = prev.find(c => c.id === baseCat.id);

          return {

            ...baseCat,

            features: baseCat.features.map(baseFeat => {

              const savedValue = getFeatureValue(baseFeat.id);

              return {

                ...baseFeat,

                enabled: savedValue === '1' || savedValue === 'true'

              };

            })

          };

        });

      });

    }

  }, [features, getFeatureValue, t]);



  const toggleFeature = (categoryId: string, featureId: string) => {

    setCategories(prev => prev.map(cat => {

      if (cat.id === categoryId) {

        return {

          ...cat,

          features: cat.features.map(feat => {

            if (feat.id === featureId) {

              return { ...feat, enabled: !feat.enabled };

            }

            return feat;

          })

        };

      }

      return cat;

    }));

    setHasChanges(true);

  };



  const handleSave = async () => {

    const requests: Promise<unknown>[] = [];



    categories.forEach(category => {

      category.features.forEach(feature => {

        requests.push(

          updateFeature.mutateAsync({

            key: feature.id,

            value: feature.enabled ? '1' : '0'

          })

        );

      });

    });



    try {

      await Promise.all(requests);

      toast.success(t('featureControl.toast.saveSuccess'));

      setHasChanges(false);

    } catch (error) {

      toast.error(error instanceof Error ? error.message : t('featureControl.toast.saveError'));

    }

  };



  const handleReset = () => {

    if (features) {

      const baseCategories = getCategoryConfig(t);

      setCategories(baseCategories.map(cat => ({

        ...cat,

        features: cat.features.map(feat => {

          const savedValue = getFeatureValue(feat.id);

          return {

            ...feat,

            enabled: savedValue === '1' || savedValue === 'true'

          };

        })

      })));

    } else {

      setCategories(getCategoryConfig(t));

    }

    setHasChanges(false);

    toast.success(t('featureControl.toast.resetSuccess'));

  };






  return (

    <div className="space-y-8 animate-in fade-in duration-700">

      <Toaster position="top-right" />



      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

        <div className="flex flex-col gap-1">

          <h1 className="text-2xl font-bold text-[#1E293B]">{t('header.titles.featureControl')}</h1>

          <p className="text-sm text-[#64748B]">{t('featureControl.description')}</p>

        </div>

        <div className="flex items-center gap-3">


          <button

            onClick={handleReset}

            disabled={isLoading || updateFeature.isPending || !hasChanges}

            className="flex items-center gap-2 px-4 py-2.5 text-[14px] font-semibold text-[#4B5563] bg-white border border-[#EEEEEE] hover:bg-[#F9FAFB] rounded-xl transition-colors hover:border-[#D1D5DB] disabled:opacity-50 disabled:cursor-not-allowed"

          >

            <RotateCcw className="w-4 h-4" />

            {t('featureControl.buttons.reset')}

          </button>

          <button

            onClick={handleSave}

            disabled={isLoading || updateFeature.isPending}

            className="flex items-center gap-2 px-5 py-2.5 text-[14px] font-semibold text-white bg-[#2137D6] hover:bg-[#1C2EB8] rounded-xl transition-colors shadow-md shadow-[#2137D6]/20 disabled:opacity-50 disabled:cursor-not-allowed"

          >

            <Save className="w-4 h-4" />

            {updateFeature.isPending ? t('featureControl.buttons.saving') : t('featureControl.buttons.save')}

          </button>

        </div>

      </div>



      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {categories.map((category) => (

          <div key={category.id} className={`bg-white rounded-2xl border border-[#F1F5F9] shadow-sm overflow-hidden flex flex-col ${category.id === 'experience' ? 'md:col-span-2' : ''}`}>

            <div className="p-6 border-b border-[#F1F5F9]">

              <div className="flex items-start gap-4">

                <div

                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"

                  style={{ backgroundColor: category.iconBg }}

                >

                  <category.icon className="w-6 h-6" style={{ color: category.iconColor }} />

                </div>

                <div className="flex flex-col gap-1">

                  <h3 className="font-bold text-[#1E293B]">{category.title}</h3>

                  <p className="text-xs text-[#64748B] leading-relaxed">{category.description}</p>

                </div>

              </div>

            </div>

            <div className="p-6 flex flex-col gap-6">

              {isLoading ? (

                // Skeleton loading state

                <>

                  <div className="flex items-center justify-between gap-4 animate-pulse">

                    <div className="flex flex-col gap-2 flex-1">

                      <div className="h-4 w-32 bg-gray-200 rounded"></div>

                      <div className="h-3 w-48 bg-gray-200 rounded"></div>

                    </div>

                    <div className="h-6 w-11 bg-gray-200 rounded-full"></div>

                  </div>

                  <div className="flex items-center justify-between gap-4 animate-pulse">

                    <div className="flex flex-col gap-2 flex-1">

                      <div className="h-4 w-32 bg-gray-200 rounded"></div>

                      <div className="h-3 w-48 bg-gray-200 rounded"></div>

                    </div>

                    <div className="h-6 w-11 bg-gray-200 rounded-full"></div>

                  </div>

                </>

              ) : (

                category.features.map((feature) => (

                  <div key={feature.id} className="flex items-center justify-between gap-4">

                    <div className="flex flex-col gap-0.5">

                      <p className="text-[13px] font-semibold text-[#1E293B]">{feature.name}</p>

                      <p className="text-[11px] text-[#94A3B8]">{feature.description}</p>

                    </div>

                    <Switch

                      enabled={feature.enabled}

                      onChange={() => toggleFeature(category.id, feature.id)}

                      disabled={updateFeature.isPending}

                    />

                  </div>

                ))

              )}

            </div>

          </div>

        ))}

      </div>

    </div>

  );

}


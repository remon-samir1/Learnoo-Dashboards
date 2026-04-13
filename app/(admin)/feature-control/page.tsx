'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  Library,
  Laptop,
  Save,
  RotateCcw
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

// Default feature configurations (used when no saved values exist)
const defaultCategories: FeatureCategory[] = [
  {
    id: 'auth',
    title: 'Authentication & Security',
    description: 'Manage how students access the platform.',
    icon: ShieldCheck,
    iconColor: '#4F46E5',
    iconBg: '#EEF2FF',
    features: [
      { id: 'feature_otp_verification', name: 'Enable OTP Verification', description: 'Require One-Time Password for student login.', enabled: true },
      { id: 'feature_login_without_otp', name: 'Allow Login Without OTP', description: 'Fallback for students who cannot receive SMS.', enabled: false },
    ]
  },
  {
    id: 'library',
    title: 'Library Features',
    description: 'Control electronic library access.',
    icon: Library,
    iconColor: '#10B981',
    iconBg: '#ECFDF5',
    features: [
      { id: 'feature_electronic_library', name: 'Enable Electronic Library', description: 'Show the library tab to students.', enabled: true },
      { id: 'feature_library_purchases', name: 'Enable Purchases', description: 'Allow students to buy premium materials.', enabled: true },
    ]
  },
  {
    id: 'experience',
    title: 'Student Experience',
    description: 'Toggle UI elements in the student app.',
    icon: Laptop,
    iconColor: '#6366F1',
    iconBg: '#EEF2FF',
    features: [
      { id: 'feature_continue_watching', name: 'Enable Continue Watching', description: 'Show recently watched lectures on home.', enabled: true },
      { id: 'feature_profile_editing', name: 'Enable Profile Editing', description: 'Allow students to change their details.', enabled: true },
    ]
  }
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
  const { data: features, isLoading } = usePlatformFeature();
  const updateFeature = useUpdatePlatformFeature();

  const [categories, setCategories] = useState<FeatureCategory[]>(defaultCategories);
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
      setCategories(prev => prev.map(cat => ({
        ...cat,
        features: cat.features.map(feat => {
          const savedValue = getFeatureValue(feat.id);
          return {
            ...feat,
            enabled: savedValue === '1' || savedValue === 'true'
          };
        })
      })));
    }
  }, [features, getFeatureValue]);

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
      toast.success('Feature settings saved successfully!');
      setHasChanges(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save feature settings');
    }
  };

  const handleReset = () => {
    if (features) {
      setCategories(prev => prev.map(cat => ({
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
      setCategories(defaultCategories);
    }
    setHasChanges(false);
    toast.success('Changes reset to saved values');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <Toaster position="top-right" />

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-[#1E293B]">Feature Control Panel</h1>
          <p className="text-sm text-[#64748B]">Instantly toggle platform features on or off. Changes apply immediately to all students.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            disabled={isLoading || updateFeature.isPending || !hasChanges}
            className="flex items-center gap-2 px-4 py-2.5 text-[14px] font-semibold text-[#4B5563] bg-white border border-[#EEEEEE] hover:bg-[#F9FAFB] rounded-xl transition-colors hover:border-[#D1D5DB] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading || updateFeature.isPending}
            className="flex items-center gap-2 px-5 py-2.5 text-[14px] font-semibold text-white bg-[#2137D6] hover:bg-[#1C2EB8] rounded-xl transition-colors shadow-md shadow-[#2137D6]/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {updateFeature.isPending ? 'Saving...' : 'Save Changes'}
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

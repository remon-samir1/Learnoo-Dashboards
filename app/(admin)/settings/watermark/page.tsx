'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Save, Eye, Layers } from 'lucide-react';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';
import { usePlatformFeature, useUpdatePlatformFeature } from '@/src/hooks';

type WatermarkPosition = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | 'center' | 'full';
type WatermarkSize = 'small' | 'medium' | 'large';
type ContentType = 'chapters' | 'exams' | 'library' | 'videos' | 'liveStreams' | 'files';

interface WatermarkConfig {
  enabled: boolean;
  text: string;
  useStudentCode: boolean;
  opacity: number;
  rotation: number;
  position: WatermarkPosition;
  size: WatermarkSize;
}

interface WatermarkSettings {
  [key: string]: WatermarkConfig;
}

const contentTypes: { key: ContentType; labelKey: string }[] = [
  { key: 'chapters', labelKey: 'applyToChapters' },
  { key: 'exams', labelKey: 'applyToExams' },
  { key: 'library', labelKey: 'applyToLibrary' },
  { key: 'videos', labelKey: 'applyToVideos' },
  { key: 'liveStreams', labelKey: 'applyToLiveStreams' },
  { key: 'files', labelKey: 'applyToFiles' },
];

const defaultConfig: WatermarkConfig = {
  enabled: false,
  text: 'Learnoo',
  useStudentCode: false,
  opacity: 20,
  rotation: -12,
  position: 'full',
  size: 'medium',
};

interface PreviewSettings {
  previewText: string;
  usePreviewText: boolean;
  previewBackground: 'light' | 'dark' | 'image';
}

export default function WatermarkSettingsPage() {
  const t = useTranslations('watermarkSettings');
  const tCommon = useTranslations('common');
  const { data: features, isLoading } = usePlatformFeature();
  const updateFeature = useUpdatePlatformFeature();
  
  const [settings, setSettings] = useState<WatermarkSettings>({});
  const [activeType, setActiveType] = useState<ContentType>('chapters');
  const [isSaving, setIsSaving] = useState(false);

  // Preview-only settings (not saved)
  const [previewSettings, setPreviewSettings] = useState<PreviewSettings>({
    previewText: 'PREVIEW_TEXT',
    usePreviewText: false,
    previewBackground: 'light',
  });

  // Helper to get feature value by key
  const getFeatureValue = (key: string, defaultValue: string = ''): string => {
    if (!features) return defaultValue;
    const feature = features.find((f) => f.attributes.key === key);
    return feature?.attributes.value || defaultValue;
  };

  // Helper to get boolean feature value
  const getFeatureBool = (key: string, defaultValue: boolean = false): boolean => {
    const value = getFeatureValue(key, defaultValue ? '1' : '0');
    return value === '1' || value === 'true';
  };

  // Helper to get number feature value
  const getFeatureNumber = (key: string, defaultValue: number = 0): number => {
    const value = getFeatureValue(key, String(defaultValue));
    const num = parseInt(value);
    return isNaN(num) ? defaultValue : num;
  };

  // Load settings from platform features
  useEffect(() => {
    if (features) {
      const newSettings: WatermarkSettings = {};
      contentTypes.forEach(({ key }) => {
        newSettings[key] = {
          enabled: getFeatureBool(`watermark_${key}_enabled`, false),
          text: getFeatureValue(`watermark_${key}_text`, 'Learnoo'),
          useStudentCode: getFeatureBool(`watermark_${key}_use_student_code`, false),
          opacity: getFeatureNumber(`watermark_${key}_opacity`, 20),
          rotation: getFeatureNumber(`watermark_${key}_rotation`, -12),
          position: (getFeatureValue(`watermark_${key}_position`, 'full') as WatermarkPosition),
          size: (getFeatureValue(`watermark_${key}_size`, 'medium') as WatermarkSize),
        };
      });
      setSettings(newSettings);
    }
  }, [features]);

  const currentSettings = settings[activeType] || defaultConfig;

  const updateCurrentSettings = (updates: Partial<WatermarkConfig>) => {
    setSettings((prev) => ({
      ...prev,
      [activeType]: { ...(prev[activeType] || defaultConfig), ...updates },
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const requests: Promise<unknown>[] = [];
      
      contentTypes.forEach(({ key }) => {
        const config = settings[key] || defaultConfig;
        requests.push(updateFeature.mutateAsync({ key: `watermark_${key}_enabled`, value: config.enabled ? '1' : '0' }));
        requests.push(updateFeature.mutateAsync({ key: `watermark_${key}_text`, value: config.text }));
        requests.push(updateFeature.mutateAsync({ key: `watermark_${key}_use_student_code`, value: config.useStudentCode ? '1' : '0' }));
        requests.push(updateFeature.mutateAsync({ key: `watermark_${key}_opacity`, value: String(config.opacity) }));
        requests.push(updateFeature.mutateAsync({ key: `watermark_${key}_rotation`, value: String(config.rotation) }));
        requests.push(updateFeature.mutateAsync({ key: `watermark_${key}_position`, value: config.position }));
        requests.push(updateFeature.mutateAsync({ key: `watermark_${key}_size`, value: config.size }));
      });
      
      await Promise.all(requests);
      toast.success(t('saveSuccess'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('saveError'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <Toaster position="top-right" />
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/settings"
          className="p-2.5 bg-white border border-[#E2E8F0] rounded-xl text-[#64748B] hover:text-[#1E293B] hover:shadow-sm transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-[22px] font-bold text-[#111827]">{t('pageTitle')}</h1>
          <p className="text-[14px] text-[#6B7280] mt-1">{t('pageDescription')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Content Type Selector */}
          <section className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#F1F5F9] bg-[#F8FAFC]/50 flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#2137D6]" />
              <h2 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider">{t('selectContentType')}</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {contentTypes.map(({ key, labelKey }) => {
                  const isEnabled = settings[key]?.enabled || false;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setActiveType(key)}
                      className={`relative px-4 py-3 rounded-xl text-sm font-medium transition-all text-left ${
                        activeType === key
                          ? 'bg-[#2137D6] text-white shadow-md'
                          : isEnabled
                            ? 'bg-green-50 text-green-700 border-2 border-green-500 hover:bg-green-100'
                            : 'bg-[#F8FAFC] text-[#475569] hover:bg-[#E2E8F0] border border-[#E2E8F0]'
                      }`}
                    >
                      <span className="flex items-center justify-between">
                        {t(labelKey)}
                        {isEnabled && (
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            activeType === key ? 'bg-white text-green-600' : 'bg-green-500 text-white'
                          }`}>
                            ON
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-[#94A3B8] mt-3">{t('selectContentTypeDesc')}</p>
            </div>
          </section>

          {/* Enable Watermark */}
          <section className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#F1F5F9] bg-[#F8FAFC]/50">
              <h2 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider">{t('enableWatermark')}</h2>
            </div>
            <div className="p-6">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={currentSettings.enabled}
                  onChange={(e) => updateCurrentSettings({ enabled: e.target.checked })}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2137D6]"></div>
                <span className="ml-3 text-sm font-medium text-[#475569]">{t('enableWatermark')}</span>
              </label>
              <p className="text-xs text-[#94A3B8] mt-2">{t('enableWatermarkDesc')}</p>
            </div>
          </section>

          {/* Watermark Text */}
          <section className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#F1F5F9] bg-[#F8FAFC]/50">
              <h2 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider">{t('watermarkText')}</h2>
            </div>
            <div className="p-6 space-y-4">
              {/* Use Student ID Toggle */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={currentSettings.useStudentCode}
                  onChange={(e) => updateCurrentSettings({ useStudentCode: e.target.checked })}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2137D6]"></div>
                <span className="ml-3 text-sm font-medium text-[#475569]">{t('useStudentId')}</span>
              </label>
              <p className="text-xs text-[#94A3B8]">{t('useStudentIdDesc')}</p>

              {/* Text Input - disabled when using student ID */}
              {!currentSettings.useStudentCode && (
                <div className="pt-2">
                  <input
                    type="text"
                    value={currentSettings.text}
                    onChange={(e) => updateCurrentSettings({ text: e.target.value })}
                    placeholder={t('watermarkTextPlaceholder')}
                    className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all"
                  />
                  <p className="text-xs text-[#94A3B8] mt-2">{t('watermarkTextDesc')}</p>
                </div>
              )}
            </div>
          </section>

          {/* Opacity & Rotation */}
          <section className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#F1F5F9] bg-[#F8FAFC]/50">
              <h2 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider">{t('opacity')} & {t('rotation')}</h2>
            </div>
            <div className="p-6 space-y-6">
              {/* Opacity */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[13px] font-bold text-[#475569]">{t('opacity')}</label>
                  <span className="text-sm font-medium text-[#2137D6]">{currentSettings.opacity}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="50"
                  value={currentSettings.opacity}
                  onChange={(e) => updateCurrentSettings({ opacity: parseInt(e.target.value) })}
                  className="w-full h-2 bg-[#F1F5F9] rounded-lg appearance-none cursor-pointer accent-[#2137D6]"
                />
                <p className="text-xs text-[#94A3B8] mt-1">{t('opacityDesc')}</p>
              </div>

              {/* Rotation */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[13px] font-bold text-[#475569]">{t('rotation')}</label>
                  <span className="text-sm font-medium text-[#2137D6]">{currentSettings.rotation}°</span>
                </div>
                <input
                  type="range"
                  min="-45"
                  max="45"
                  value={currentSettings.rotation}
                  onChange={(e) => updateCurrentSettings({ rotation: parseInt(e.target.value) })}
                  className="w-full h-2 bg-[#F1F5F9] rounded-lg appearance-none cursor-pointer accent-[#2137D6]"
                />
                <p className="text-xs text-[#94A3B8] mt-1">{t('rotationDesc')}</p>
              </div>
            </div>
          </section>

          {/* Position & Size */}
          <section className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#F1F5F9] bg-[#F8FAFC]/50">
              <h2 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider">{t('positionAndSize')}</h2>
            </div>
            <div className="p-6 space-y-6">
              {/* Position */}
              <div>
                <label className="text-[13px] font-bold text-[#475569] block mb-3">{t('position')}</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['topLeft', 'topRight', 'center', 'bottomLeft', 'bottomRight', 'full'] as WatermarkPosition[]).map((pos) => (
                    <button
                      key={pos}
                      type="button"
                      onClick={() => updateCurrentSettings({ position: pos })}
                      className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                        currentSettings.position === pos
                          ? 'bg-[#2137D6] text-white'
                          : 'bg-[#F8FAFC] text-[#64748B] hover:bg-[#E2E8F0]'
                      }`}
                    >
                      {t(`position${pos.charAt(0).toUpperCase() + pos.slice(1)}`)}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-[#94A3B8] mt-2">{t('positionDesc')}</p>
              </div>

              {/* Size */}
              <div>
                <label className="text-[13px] font-bold text-[#475569] block mb-3">{t('size')}</label>
                <div className="flex gap-3">
                  {(['small', 'medium', 'large'] as WatermarkSize[]).map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => updateCurrentSettings({ size: sz })}
                      className={`flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        currentSettings.size === sz
                          ? 'bg-[#2137D6] text-white'
                          : 'bg-[#F8FAFC] text-[#64748B] hover:bg-[#E2E8F0]'
                      }`}
                    >
                      {t(`size${sz.charAt(0).toUpperCase() + sz.slice(1)}`)}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-[#94A3B8] mt-2">{t('sizeDesc')}</p>
              </div>
            </div>
          </section>

          {/* Save Button */}
          <div className="flex items-center justify-end pt-4">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-8 py-3 bg-[#2137D6] hover:bg-[#1a2bb3] text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {tCommon('save')}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {tCommon('save')}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column - Sticky Preview */}
        <div className="lg:col-span-1">
          {currentSettings.enabled && (currentSettings.text || currentSettings.useStudentCode) && (
            <div className="sticky top-4 space-y-6">
              {/* Preview Settings - Not Saved */}
              <section className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-amber-100 bg-amber-50/50 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-amber-600" />
                  <h2 className="text-sm font-bold text-amber-800 uppercase tracking-wider">{t('previewSettings')}</h2>
                  <span className="ml-auto text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-full font-medium">
                    {t('previewNotSaved')}
                  </span>
                </div>
                <div className="p-6 space-y-4">
                  {/* Preview Background */}
                  <div className="pt-2">
                    <label className="text-[13px] font-bold text-[#475569] block mb-2">{t('previewBackground')}</label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewSettings({ ...previewSettings, previewBackground: 'light' })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          previewSettings.previewBackground === 'light'
                            ? 'bg-amber-100 text-amber-700 border-2 border-amber-300'
                            : 'bg-[#F8FAFC] text-[#64748B] border-2 border-[#E2E8F0] hover:border-amber-200'
                        }`}
                      >
                        {t('backgroundLight')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewSettings({ ...previewSettings, previewBackground: 'dark' })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          previewSettings.previewBackground === 'dark'
                            ? 'bg-amber-100 text-amber-700 border-2 border-amber-300'
                            : 'bg-[#1E293B] text-white border-2 border-[#334155] hover:border-amber-200'
                        }`}
                      >
                        {t('backgroundDark')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewSettings({ ...previewSettings, previewBackground: 'image' })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          previewSettings.previewBackground === 'image'
                            ? 'bg-amber-100 text-amber-700 border-2 border-amber-300'
                            : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white border-2 border-transparent hover:opacity-90'
                        }`}
                      >
                        {t('backgroundImage')}
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              {/* Preview */}
              <section className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-[#F1F5F9] bg-[#F8FAFC]/50 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-[#4F46E5]" />
                  <h2 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider">{t('preview')}</h2>
                </div>
                <div className="p-6">
                  {/* Dynamic Preview based on selected background and position */}
                  {previewSettings.previewBackground === 'light' && (
                    <div className="relative h-40 bg-white rounded-xl overflow-hidden border border-[#E2E8F0]">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs text-[#94A3B8]">{t('previewLightBackground')}</span>
                      </div>
                      {currentSettings.position === 'full' ? (
                        <div className="absolute inset-0 flex flex-wrap content-center justify-center gap-x-12 gap-y-8 p-4 pointer-events-none" style={{ transform: `rotate(${currentSettings.rotation}deg) scale(1.1)` }}>
                          {Array.from({ length: 4 }).map((_, i) => (
                            <span
                              key={i}
                              className={`font-bold text-gray-400/40 select-none whitespace-nowrap ${
                                currentSettings.size === 'small' ? 'text-lg' : currentSettings.size === 'large' ? 'text-3xl' : 'text-2xl'
                              }`}
                              style={{ opacity: currentSettings.opacity / 100 }}
                            >
                              {currentSettings.useStudentCode ? 'STUDENT_CODE' : currentSettings.text}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div
                          className={`absolute pointer-events-none ${
                            currentSettings.position === 'topLeft' ? 'top-4 left-4' :
                            currentSettings.position === 'topRight' ? 'top-4 right-4' :
                            currentSettings.position === 'bottomLeft' ? 'bottom-4 left-4' :
                            currentSettings.position === 'bottomRight' ? 'bottom-4 right-4' :
                            currentSettings.position === 'center' ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2' : ''
                          }`}
                          style={{ transform: currentSettings.position === 'center' ? `rotate(${currentSettings.rotation}deg) translate(-50%, -50%)` : `rotate(${currentSettings.rotation}deg)` }}
                        >
                          <span
                            className={`font-bold text-gray-400/60 select-none whitespace-nowrap ${
                              currentSettings.size === 'small' ? 'text-base' : currentSettings.size === 'large' ? 'text-4xl' : 'text-2xl'
                            }`}
                            style={{ opacity: currentSettings.opacity / 100 }}
                          >
                            {currentSettings.useStudentCode ? 'STUDENT_CODE' : currentSettings.text}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {previewSettings.previewBackground === 'dark' && (
                    <div className="relative h-40 bg-[#1E293B] rounded-xl overflow-hidden border border-[#334155]">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs text-[#64748B]">{t('previewDarkBackground')}</span>
                      </div>
                      {currentSettings.position === 'full' ? (
                        <div className="absolute inset-0 flex flex-wrap content-center justify-center gap-x-12 gap-y-8 p-4 pointer-events-none" style={{ transform: `rotate(${currentSettings.rotation}deg) scale(1.1)` }}>
                          {Array.from({ length: 4 }).map((_, i) => (
                            <span
                              key={i}
                              className={`font-bold text-white/30 select-none whitespace-nowrap ${
                                currentSettings.size === 'small' ? 'text-lg' : currentSettings.size === 'large' ? 'text-3xl' : 'text-2xl'
                              }`}
                              style={{ opacity: currentSettings.opacity / 100 }}
                            >
                              {currentSettings.useStudentCode ? 'STUDENT_CODE' : currentSettings.text}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div
                          className={`absolute pointer-events-none ${
                            currentSettings.position === 'topLeft' ? 'top-4 left-4' :
                            currentSettings.position === 'topRight' ? 'top-4 right-4' :
                            currentSettings.position === 'bottomLeft' ? 'bottom-4 left-4' :
                            currentSettings.position === 'bottomRight' ? 'bottom-4 right-4' :
                            currentSettings.position === 'center' ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2' : ''
                          }`}
                          style={{ transform: currentSettings.position === 'center' ? `rotate(${currentSettings.rotation}deg) translate(-50%, -50%)` : `rotate(${currentSettings.rotation}deg)` }}
                        >
                          <span
                            className={`font-bold text-white/50 select-none whitespace-nowrap ${
                              currentSettings.size === 'small' ? 'text-base' : currentSettings.size === 'large' ? 'text-4xl' : 'text-2xl'
                            }`}
                            style={{ opacity: currentSettings.opacity / 100 }}
                          >
                            {currentSettings.useStudentCode ? 'STUDENT_CODE' : currentSettings.text}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {previewSettings.previewBackground === 'image' && (
                    <div className="relative h-40 rounded-xl overflow-hidden border border-[#E2E8F0]">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs text-white/80">{t('previewImageBackground')}</span>
                      </div>
                      {currentSettings.position === 'full' ? (
                        <div className="absolute inset-0 flex flex-wrap content-center justify-center gap-x-12 gap-y-8 p-4 pointer-events-none" style={{ transform: `rotate(${currentSettings.rotation}deg) scale(1.1)` }}>
                          {Array.from({ length: 4 }).map((_, i) => (
                            <span
                              key={i}
                              className={`font-bold text-white/50 select-none whitespace-nowrap ${
                                currentSettings.size === 'small' ? 'text-lg' : currentSettings.size === 'large' ? 'text-3xl' : 'text-2xl'
                              }`}
                              style={{ opacity: currentSettings.opacity / 100 }}
                            >
                              {currentSettings.useStudentCode ? 'STUDENT_CODE' : currentSettings.text}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div
                          className={`absolute pointer-events-none ${
                            currentSettings.position === 'topLeft' ? 'top-4 left-4' :
                            currentSettings.position === 'topRight' ? 'top-4 right-4' :
                            currentSettings.position === 'bottomLeft' ? 'bottom-4 left-4' :
                            currentSettings.position === 'bottomRight' ? 'bottom-4 right-4' :
                            currentSettings.position === 'center' ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2' : ''
                          }`}
                          style={{ transform: currentSettings.position === 'center' ? `rotate(${currentSettings.rotation}deg) translate(-50%, -50%)` : `rotate(${currentSettings.rotation}deg)` }}
                        >
                          <span
                            className={`font-bold text-white/70 select-none whitespace-nowrap ${
                              currentSettings.size === 'small' ? 'text-base' : currentSettings.size === 'large' ? 'text-4xl' : 'text-2xl'
                            }`}
                            style={{ opacity: currentSettings.opacity / 100 }}
                          >
                            {currentSettings.useStudentCode ? 'STUDENT_CODE' : currentSettings.text}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

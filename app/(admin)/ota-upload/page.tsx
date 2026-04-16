"use client";

import React, { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import {
  ArrowLeft,
  Upload,
  X,
  Smartphone,
  FileText,
  Hash,
  ToggleLeft,
  Loader2,
  Trash2,
  CheckCircle,
  AlertCircle,
  Download,
  Pencil
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppVersions, useCreateAppVersion, useUpdateAppVersion, useDeleteAppVersion } from '@/src/hooks';
import type { AppVersion } from '@/src/types';

export default function OtaUploadPage() {
  const t = useTranslations('otaUpload');
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Queries & Mutations
  const { data: appVersions, isLoading: isLoadingVersions, refetch } = useAppVersions();
  const { mutate: createAppVersion, isLoading: isCreating, error: createError, progress: uploadProgress } = useCreateAppVersion();
  const { mutate: updateAppVersion, isLoading: isUpdating } = useUpdateAppVersion();
  const { mutate: deleteAppVersion, isLoading: isDeleting } = useDeleteAppVersion();

  // Edit modal state
  const [editingVersion, setEditingVersion] = useState<AppVersion | null>(null);
  const [editFormData, setEditFormData] = useState({
    version_name: '',
    version_code: '',
    release_notes: '',
    is_force_update: false,
  });

  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    version_name: '',
    version_code: '',
    release_notes: '',
    is_force_update: false,
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.version_name.trim()) {
      errors.version_name = t('validation.versionNameRequired');
    } else if (formData.version_name.length > 255) {
      errors.version_name = t('validation.versionNameMaxLength', { max: 255 });
    }

    if (!formData.version_code.trim()) {
      errors.version_code = t('validation.versionCodeRequired');
    } else {
      const code = parseInt(formData.version_code);
      if (isNaN(code) || code < 1) {
        errors.version_code = t('validation.versionCodeInvalid');
      }
    }

    if (!selectedFile) {
      errors.apk_file = t('validation.apkRequired');
    } else {
      // Check file extension
      if (!selectedFile.name.endsWith('.apk')) {
        errors.apk_file = t('validation.apkInvalid');
      }
      // No file size limit - allow any size APK
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      // Clear error when file is selected
      setFormErrors(prev => ({ ...prev, apk_file: '' }));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setFormErrors(prev => ({ ...prev, apk_file: '' }));
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await createAppVersion({
        version_name: formData.version_name,
        version_code: parseInt(formData.version_code),
        release_notes: formData.release_notes || undefined,
        apk_file: selectedFile!,
        is_force_update: formData.is_force_update,
      });

      // Reset form
      setFormData({
        version_name: '',
        version_code: '',
        release_notes: '',
        is_force_update: false,
      });
      clearFile();

      // Refresh the list
      refetch();
    } catch (err) {
      console.error('Failed to upload APK:', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('deleteConfirm'))) {
      return;
    }

    try {
      await deleteAppVersion(id);
      refetch();
    } catch (err) {
      console.error('Failed to delete version:', err);
    }
  };

  const handleEditClick = (version: AppVersion) => {
    setEditingVersion(version);
    setEditFormData({
      version_name: version.attributes.version_name,
      version_code: version.attributes.version_code.toString(),
      release_notes: version.attributes.release_notes || '',
      is_force_update: version.attributes.is_force_update,
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVersion) return;

    try {
      await updateAppVersion({
        id: parseInt(editingVersion.id),
        data: {
          version_name: editFormData.version_name,
          version_code: parseInt(editFormData.version_code),
          release_notes: editFormData.release_notes || undefined,
          is_force_update: editFormData.is_force_update,
        },
      });
      setEditingVersion(null);
      refetch();
    } catch (err) {
      console.error('Failed to update version:', err);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard"
          className="p-2.5 bg-white border border-[#E2E8F0] rounded-xl text-[#64748B] hover:text-[#1E293B] hover:shadow-sm transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">{t('pageTitle')}</h1>
          <p className="text-sm text-[#64748B] mt-0.5">{t('pageDescription')}</p>
        </div>
      </div>

      {/* Error Display */}
      {createError && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {createError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Version Information Section */}
          <section className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#F1F5F9] bg-[#F8FAFC]/50 flex items-center gap-2">
              <Hash className="w-4 h-4 text-[#4F46E5]" />
              <h2 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider">{t('versionInfo')}</h2>
            </div>
            <div className="p-6 grid grid-cols-1 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-[#475569]">{t('versionName')} <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder={t('versionNamePlaceholder')}
                  className={`w-full px-4 py-2.5 bg-[#F8FAFC] border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all placeholder:text-[#94A3B8] ${
                    formErrors.version_name ? 'border-red-300 focus:border-red-400' : 'border-[#E2E8F0]'
                  }`}
                  value={formData.version_name}
                  onChange={(e) => {
                    setFormData({ ...formData, version_name: e.target.value });
                    if (formErrors.version_name) {
                      setFormErrors(prev => ({ ...prev, version_name: '' }));
                    }
                  }}
                />
                {formErrors.version_name && (
                  <p className="text-xs text-red-500">{formErrors.version_name}</p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-[#475569]">{t('versionCode')} <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  min="1"
                  placeholder={t('versionCodePlaceholder')}
                  className={`w-full px-4 py-2.5 bg-[#F8FAFC] border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all placeholder:text-[#94A3B8] ${
                    formErrors.version_code ? 'border-red-300 focus:border-red-400' : 'border-[#E2E8F0]'
                  }`}
                  value={formData.version_code}
                  onChange={(e) => {
                    setFormData({ ...formData, version_code: e.target.value });
                    if (formErrors.version_code) {
                      setFormErrors(prev => ({ ...prev, version_code: '' }));
                    }
                  }}
                />
                {formErrors.version_code && (
                  <p className="text-xs text-red-500">{formErrors.version_code}</p>
                )}
                <p className="text-xs text-[#94A3B8]">{t('versionCodeHint')}</p>
              </div>
            </div>
          </section>

          {/* APK File Section */}
          <section className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#F1F5F9] bg-[#F8FAFC]/50 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-[#4F46E5]" />
              <h2 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider">{t('apkFile')}</h2>
            </div>
            <div className="p-6">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  relative border-2 border-dashed rounded-2xl min-h-[200px] flex flex-col items-center justify-center gap-3 transition-all cursor-pointer overflow-hidden
                  ${isDragging ? 'border-[#4F46E5] bg-blue-50' : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1]'}
                  ${selectedFile ? 'border-emerald-500 bg-emerald-50/30' : ''}
                  ${formErrors.apk_file ? 'border-red-300 bg-red-50/30' : ''}
                `}
              >
                {selectedFile ? (
                  <div className="flex flex-col items-center gap-3 p-4">
                    <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 text-emerald-600" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-[#1E293B]">{t('selectedFile')}</p>
                      <p className="text-xs text-[#64748B] mt-1">{formatFileSize(selectedFile.size)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                      className="text-sm text-red-500 hover:text-red-600 font-medium"
                    >
                      {t('changeFile')}
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="p-4 bg-[#F8FAFC] rounded-full">
                      <Upload className="w-8 h-8 text-[#94A3B8]" />
                    </div>
                    <div className="text-center px-4">
                      <p className="text-sm font-medium text-[#1E293B]">{t('dragDropHint')}</p>
                      <p className="text-xs text-[#94A3B8] mt-1">{t('fileTypes')}</p>
                      <p className="text-xs text-[#94A3B8] mt-2">{t('apkFileSize')}</p>
                    </div>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".apk"
                  onChange={handleFileSelect}
                />
              </div>
              {formErrors.apk_file && (
                <p className="text-xs text-red-500 mt-2">{formErrors.apk_file}</p>
              )}
            </div>
          </section>

          {/* Release Notes Section */}
          <section className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#F1F5F9] bg-[#F8FAFC]/50 flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#4F46E5]" />
              <h2 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider">{t('releaseNotes')}</h2>
            </div>
            <div className="p-6">
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-[#475569]">{t('releaseNotes')}</label>
                <textarea
                  rows={4}
                  placeholder={t('releaseNotesPlaceholder')}
                  className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all placeholder:text-[#94A3B8] resize-none"
                  value={formData.release_notes}
                  onChange={(e) => setFormData({ ...formData, release_notes: e.target.value })}
                />
              </div>
            </div>
          </section>

          {/* Force Update Section */}
          <section className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#F1F5F9] bg-[#F8FAFC]/50 flex items-center gap-2">
              <ToggleLeft className="w-4 h-4 text-[#4F46E5]" />
              <h2 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider">{t('forceUpdate')}</h2>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={formData.is_force_update}
                    onChange={(e) => setFormData({ ...formData, is_force_update: e.target.checked })}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2137D6]"></div>
                  <span className="ml-3 text-sm font-medium text-[#475569]">{t('forceUpdate')}</span>
                </label>
              </div>
              <p className="text-xs text-[#94A3B8] mt-2">{t('forceUpdateHint')}</p>
            </div>
          </section>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="px-8 py-3 bg-white border border-[#E2E8F0] rounded-xl text-sm font-bold text-[#64748B] hover:bg-[#F8FAFC] hover:shadow-sm transition-all shadow-sm"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="px-8 py-3 bg-[#2137D6] hover:bg-[#1a2bb3] text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isCreating && <Loader2 className="w-4 h-4 animate-spin" />}
              {isCreating ? t('uploading') : t('uploadButton')}
            </button>
          </div>

          {/* Upload Progress */}
          {isCreating && uploadProgress > 0 && (
            <div className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-[#1E293B]">{t('uploading')}</span>
                <span className="text-sm font-bold text-[#2137D6]">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-[#F1F5F9] rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-[#2137D6] h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </form>

        {/* Version History */}
        <div className="flex flex-col gap-6">
          <section className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm overflow-hidden flex-1">
            <div className="px-6 py-4 border-b border-[#F1F5F9] bg-[#F8FAFC]/50 flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider">{t('versionHistory')}</h2>
              <span className="text-xs text-[#64748B]">{appVersions?.length || 0} versions</span>
            </div>
            <div className="p-0">
              {isLoadingVersions ? (
                <div className="p-8 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-[#94A3B8] animate-spin" />
                </div>
              ) : appVersions && appVersions.length > 0 ? (
                <div className="divide-y divide-[#F1F5F9]">
                  {appVersions.map((version: AppVersion) => (
                    <div key={version.id} className="p-4 hover:bg-[#F8FAFC] transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-[#1E293B]">{version.attributes.version_name}</h3>
                            <span className="text-xs px-2 py-0.5 bg-[#F1F5F9] rounded-full text-[#64748B]">
                              {t('code')}: {version.attributes.version_code}
                            </span>
                            <span className="text-xs px-2 py-0.5 bg-blue-50 rounded-full text-blue-600">
                              {version.attributes.file_size_human}
                            </span>
                            {version.attributes.is_force_update && (
                              <span className="text-xs px-2 py-0.5 bg-red-100 rounded-full text-red-600 font-medium">
                                {t('forceUpdate')}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#94A3B8] mt-1">
                            {t('released')} {version.attributes.released_at ? formatDate(version.attributes.released_at) : formatDate(version.attributes.created_at)}
                          </p>
                          {version.attributes.release_notes && (
                            <p className="text-sm text-[#64748B] mt-2 line-clamp-2">
                              {version.attributes.release_notes}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditClick(version)}
                            className="p-2 text-[#64748B] hover:text-[#2137D6] hover:bg-blue-50 rounded-lg transition-colors"
                            title={t('edit')}
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <a
                            href={version.attributes.download_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-[#64748B] hover:text-[#2137D6] hover:bg-blue-50 rounded-lg transition-colors"
                            title={t('download')}
                          >
                            <Download className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => handleDelete(parseInt(version.id))}
                            disabled={isDeleting}
                            className="p-2 text-[#64748B] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title={t('delete')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <Smartphone className="w-12 h-12 text-[#E2E8F0] mx-auto mb-3" />
                  <p className="text-sm text-[#64748B]">{t('noVersions')}</p>
                  <p className="text-xs text-[#94A3B8] mt-1">{t('noVersionsHint')}</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Edit Version Modal */}
      {editingVersion && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleUpdate} className="flex flex-col">
              <div className="px-6 py-4 border-b border-[#F1F5F9] flex items-center justify-between">
                <h3 className="text-lg font-bold text-[#1E293B]">{t('editVersion')}</h3>
                <button
                  type="button"
                  onClick={() => setEditingVersion(null)}
                  className="p-2 text-[#64748B] hover:text-[#1E293B] hover:bg-[#F1F5F9] rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[13px] font-bold text-[#475569]">{t('versionName')} <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all"
                    value={editFormData.version_name}
                    onChange={(e) => setEditFormData({ ...editFormData, version_name: e.target.value })}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[13px] font-bold text-[#475569]">{t('versionCode')} <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    min="1"
                    required
                    className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all"
                    value={editFormData.version_code}
                    onChange={(e) => setEditFormData({ ...editFormData, version_code: e.target.value })}
                  />
                  <p className="text-xs text-[#94A3B8]">{t('versionCodeHint')}</p>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[13px] font-bold text-[#475569]">{t('releaseNotes')}</label>
                  <textarea
                    rows={4}
                    className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all resize-none"
                    value={editFormData.release_notes}
                    onChange={(e) => setEditFormData({ ...editFormData, release_notes: e.target.value })}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={editFormData.is_force_update}
                      onChange={(e) => setEditFormData({ ...editFormData, is_force_update: e.target.checked })}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2137D6]"></div>
                    <span className="ml-3 text-sm font-medium text-[#475569]">{t('forceUpdate')}</span>
                  </label>
                  <p className="text-xs text-[#94A3B8]">{t('forceUpdateHint')}</p>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-[#F1F5F9] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingVersion(null)}
                  className="px-4 py-2 bg-white border border-[#E2E8F0] rounded-xl text-sm font-bold text-[#64748B] hover:bg-[#F8FAFC] transition-all"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-4 py-2 bg-[#2137D6] hover:bg-[#1a2bb3] text-white rounded-xl text-sm font-bold transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isUpdating && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isUpdating ? t('saving') : t('saveChanges')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

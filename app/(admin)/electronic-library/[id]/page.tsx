'use client';

import React, { useState, useRef } from 'react';
import { ArrowLeft, Edit, Trash2, BookOpen, DollarSign, Calendar, Eye, Lock, Power, Upload, CheckCircle, Search, X, Plus, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';
import { useLibrary, useDeleteLibrary } from '@/src/hooks/useLibraries';
import { useCodes, useActivateCode, useUploadPreActivation } from '@/src/hooks';
import { useStudents } from '@/src/hooks/useStudents';
import toast from 'react-hot-toast';

function formatDate(dateString: string | null): string {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString();
}

function getMaterialTypeColor(type: string): string {
  const colors: Record<string, string> = {
    'booklet': 'bg-[#EEF2FF] text-[#4F46E5] border border-indigo-100',
    'reference': 'bg-[#FEF3C7] text-[#D97706] border border-amber-100',
    'guide': 'bg-[#ECFDF5] text-[#10B981] border border-emerald-100'
  };
  return colors[type] || 'bg-[#F1F5F9] text-[#64748B] border border-slate-200';
}

export default function LibraryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const libraryId = parseInt(params.id as string);

  const { data: library, isLoading, error } = useLibrary(libraryId);
  const { mutate: deleteLibrary, isLoading: isDeleting } = useDeleteLibrary();

  // Activation State
  const [libraryActivationTab, setLibraryActivationTab] = useState<'code' | 'preactivation'>('code');
  const [selectedLibraryCode, setSelectedLibraryCode] = useState('');
  const [selectedLibraryStudent, setSelectedLibraryStudent] = useState('');
  const [libraryStudentSearch, setLibraryStudentSearch] = useState('');
  const [libraryPreactivationNumbers, setLibraryPreactivationNumbers] = useState<string[]>([]);
  const [libraryPreactivationResults, setLibraryPreactivationResults] = useState<{ success: number; failed: number; count: number } | null>(null);
  const libraryFileInputRef = useRef<HTMLInputElement>(null);

  const { data: codes, refetch: refetchCodes } = useCodes();
  const { mutate: activateCode, isLoading: isActivatingLibrary } = useActivateCode();
  const { mutate: uploadPreActivation, isLoading: isUploadingLibraryPreActivation } = useUploadPreActivation();
  const { data: students } = useStudents();

  // Filter codes for this library
  const libraryCodes = codes?.filter(
    (code) =>
      code.attributes.codeable_type === 'App\\Models\\Library' &&
      code.attributes.codeable_id === libraryId &&
      !code.attributes.is_used
  ) || [];

  const filteredLibraryStudents = students?.data?.filter((student: any) => {
    const fullName = `${student.attributes.first_name} ${student.attributes.last_name}`.toLowerCase();
    const email = student.attributes.email?.toLowerCase() || '';
    const search = libraryStudentSearch.toLowerCase();
    return fullName.includes(search) || email.includes(search);
  }) || [];

  // Activation Handlers
  const handleActivateLibrary = async () => {
    if (!selectedLibraryCode || !selectedLibraryStudent) return;

    try {
      await activateCode({
        code: selectedLibraryCode,
        item_id: libraryId,
        item_type: 'library',
        user_id: String(selectedLibraryStudent),
      });
      toast.success('Library item activated successfully!');
      setSelectedLibraryCode('');
      setSelectedLibraryStudent('');
      setLibraryStudentSearch('');
      refetchCodes();
    } catch {
      // Error handled by hook
    }
  };

  const handleLibraryPreactivationFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setLibraryPreactivationNumbers([]);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const numbers = text
        .split(/[\n,\r,;]/)
        .map((n) => n.trim())
        .filter((n) => n.length > 0);
      setLibraryPreactivationNumbers(numbers);
      setLibraryPreactivationResults(null);
      toast.success(`${numbers.length} phone numbers ready for upload`);
    };
    reader.readAsText(file);
  };

  const clearLibraryPreactivationNumbers = () => {
    setLibraryPreactivationNumbers([]);
    setLibraryPreactivationResults(null);
    if (libraryFileInputRef.current) {
      libraryFileInputRef.current.value = '';
    }
  };

  const handleLibraryPreactivationUpload = async () => {
    const file = libraryFileInputRef.current?.files?.[0];
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    try {
      const result = await uploadPreActivation({ item_id: libraryId, item_type: 'library', file });
      setLibraryPreactivationResults({
        success: result.data.count || 0,
        failed: libraryPreactivationNumbers.length - (result.data.count || 0),
        count: result.data.count || 0
      });
      toast.success(result.data.message || `Processed ${result.data.count} pre-activations`);
      refetchCodes();
      if (libraryFileInputRef.current) {
        libraryFileInputRef.current.value = '';
      }
      setLibraryPreactivationNumbers([]);
    } catch {
      toast.error('Failed to upload pre-activation file');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this library item?')) return;
    try {
      await deleteLibrary(libraryId);
      router.push('/electronic-library');
    } catch {
      // Error handled by hook
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#2137D6]" />
      </div>
    );
  }

  if (error || !library) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-[#EF4444]">Failed to load library item. Please try again.</p>
        <Link 
          href="/electronic-library"
          className="flex items-center gap-2 px-4 py-2 bg-[#2137D6] text-white rounded-xl text-sm font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Library
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link 
            href="/electronic-library"
            className="p-2.5 bg-white border border-[#E2E8F0] rounded-xl text-[#64748B] hover:text-[#1E293B] hover:shadow-sm transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#1E293B]">{library.attributes.title}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide ${getMaterialTypeColor(library.attributes.material_type)}`}>
                {library.attributes.material_type}
              </span>
              <span className="text-sm text-[#94A3B8]">{formatDate(library.attributes.created_at)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link 
            href={`/electronic-library/${library.id}/edit`}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#E2E8F0] text-[#1E293B] rounded-xl text-sm font-bold hover:bg-[#F8FAFC] transition-all"
          >
            <Edit className="w-4 h-4" />
            Edit
          </Link>
          <button 
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#EF4444] hover:bg-[#DC2626] text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-red-200 disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column - Cover Image */}
        <div className="w-full lg:w-[400px]">
          <section className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm overflow-hidden">
            <div className="relative h-80 bg-[#F8FAFC]">
              {library.attributes.cover_image ? (
                <Image
                  src={library.attributes.cover_image}
                  alt={library.attributes.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-[#94A3B8]">
                  No Cover Image
                </div>
              )}
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl font-bold text-[#2137D6]">${Number(library.attributes.price).toFixed(2)}</span>
                <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-bold tracking-wide ${
                  library.attributes.is_publish
                    ? 'bg-[#EBFDF5] text-[#10B981] border border-emerald-100'
                    : 'bg-[#F1F5F9] text-[#64748B] border border-slate-200'
                }`}>
                  {library.attributes.is_publish ? 'Published' : 'Draft'}
                </span>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column - Details */}
        <div className="flex-1">
          <section className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm overflow-hidden p-6">
            <h2 className="text-base font-bold text-[#1E293B] mb-6">Item Details</h2>
            
            <div className="flex flex-col gap-6">
              {/* Description */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#EEF2FF] rounded-xl flex items-center justify-center shrink-0 border border-indigo-50">
                  <BookOpen className="w-5 h-5 text-[#4F46E5]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[12px] text-[#64748B]">Description</span>
                  <span className="text-sm text-[#1E293B] leading-relaxed">{library.attributes.description}</span>
                </div>
              </div>

              {/* Course ID */}
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[#ECFDF5] rounded-xl flex items-center justify-center shrink-0 border border-emerald-50">
                  <DollarSign className="w-5 h-5 text-[#10B981]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[12px] text-[#64748B]">Course ID</span>
                  <span className="text-sm font-bold text-[#1E293B]">{library.attributes.course_id}</span>
                </div>
              </div>

              {/* Code Activation */}
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[#FEF3C7] rounded-xl flex items-center justify-center shrink-0 border border-amber-50">
                  <Lock className="w-5 h-5 text-[#D97706]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[12px] text-[#64748B]">Code Activation Required</span>
                  <span className="text-sm font-bold text-[#1E293B]">{library.attributes.code_activation ? 'Yes' : 'No'}</span>
                </div>
              </div>

              {/* Attachments */}
              {library.attributes.attachments && library.attributes.attachments.length > 0 && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#EEF2FF] rounded-xl flex items-center justify-center shrink-0 border border-indigo-50">
                      <svg className="w-5 h-5 text-[#4F46E5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[12px] text-[#64748B]">Attachments</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 pl-14">
                    {library.attributes.attachments.map((att) => (
                      <a
                        key={att.id}
                        href={att.attributes.path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] hover:bg-[#EEF2FF] hover:border-[#4F46E5] transition-all group"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#1E293B] truncate group-hover:text-[#4F46E5]">{att.attributes.name}</p>
                          <p className="text-xs text-[#94A3B8]">{att.attributes.extension.toUpperCase()} • {(parseInt(att.attributes.size) / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                        <svg className="w-5 h-5 text-[#64748B] group-hover:text-[#4F46E5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Created Date */}
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[#FFFBEB] rounded-xl flex items-center justify-center shrink-0 border border-amber-50">
                  <Calendar className="w-5 h-5 text-[#F59E0B]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[12px] text-[#64748B]">Created Date</span>
                  <span className="text-sm font-bold text-[#1E293B]">{formatDate(library.attributes.created_at)}</span>
                </div>
              </div>

              {/* Updated Date */}
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[#F1F5F9] rounded-xl flex items-center justify-center shrink-0 border border-slate-100">
                  <Eye className="w-5 h-5 text-[#64748B]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[12px] text-[#64748B]">Last Updated</span>
                  <span className="text-sm font-bold text-[#1E293B]">{formatDate(library.attributes.updated_at)}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Library Activation Section */}
          <section className="bg-white rounded-2xl border border-[#F1F5F9] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Power className="w-4 h-4 text-[#2137D6]" />
                <h2 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider">Library Activation</h2>
              </div>
              <Link
                href={`/activation/generate?library_id=${libraryId}`}
                className="p-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#64748B] hover:text-[#2137D6] hover:border-[#2137D6] transition-all"
                title="Generate Activation Codes"
              >
                <Plus className="w-4 h-4" />
              </Link>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 mb-4 bg-[#F8FAFC] rounded-lg p-1">
              <button
                onClick={() => setLibraryActivationTab('code')}
                className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition-all ${
                  libraryActivationTab === 'code'
                    ? 'bg-white text-[#2137D6] shadow-sm'
                    : 'text-[#64748B] hover:text-[#1E293B]'
                }`}
              >
                By Code
              </button>
              <button
                onClick={() => setLibraryActivationTab('preactivation')}
                className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition-all ${
                  libraryActivationTab === 'preactivation'
                    ? 'bg-white text-[#2137D6] shadow-sm'
                    : 'text-[#64748B] hover:text-[#1E293B]'
                }`}
              >
                Pre-activation
              </button>
            </div>

            {libraryActivationTab === 'code' ? (
              <div className="flex flex-col gap-4">
                {/* Available Codes */}
                <div>
                  <label className="text-xs font-bold text-[#64748B] mb-2 block">Available Codes ({libraryCodes.length})</label>
                  {libraryCodes.length > 0 ? (
                    <div className="max-h-32 overflow-y-auto bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2">
                      <div className="flex flex-wrap gap-2">
                        {libraryCodes.map((code) => (
                          <button
                            key={code.id}
                            onClick={() => setSelectedLibraryCode(code.attributes.code)}
                            className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                              selectedLibraryCode === code.attributes.code
                                ? 'bg-[#2137D6] text-white'
                                : 'bg-white border border-[#E2E8F0] text-[#475569] hover:border-[#2137D6]'
                            }`}
                          >
                            {code.attributes.code}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-[#94A3B8]">No available codes. Generate codes first.</p>
                  )}
                </div>

                {/* Student Selection */}
                <div>
                  <label className="text-xs font-bold text-[#64748B] mb-2 block">Select Student</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                    <input
                      type="text"
                      placeholder="Search students..."
                      value={libraryStudentSearch}
                      onChange={(e) => setLibraryStudentSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10"
                    />
                  </div>
                  {libraryStudentSearch && (
                    <div className="mt-2 max-h-32 overflow-y-auto border border-[#E2E8F0] rounded-xl p-2 flex flex-col gap-1">
                      {filteredLibraryStudents.length > 0 ? (
                        filteredLibraryStudents.map((student: any) => (
                          <label
                            key={student.id}
                            className={`flex flex-col p-2 rounded-lg cursor-pointer transition-colors ${
                              selectedLibraryStudent === String(student.id) ? 'bg-[#EEF2FF]' : 'hover:bg-[#F8FAFC]'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="radio"
                                name="library-student"
                                value={student.id}
                                checked={selectedLibraryStudent === String(student.id)}
                                onChange={(e) => {
                                  setSelectedLibraryStudent(e.target.value);
                                  setLibraryStudentSearch(`${student.attributes.first_name} ${student.attributes.last_name}`);
                                }}
                                className="w-4 h-4 text-[#2137D6]"
                              />
                              <span className="text-xs font-medium text-[#1E293B]">
                                {student.attributes.first_name} {student.attributes.last_name}
                              </span>
                            </div>
                            <span className="text-[10px] text-[#94A3B8] pl-6">{student.attributes.email}</span>
                          </label>
                        ))
                      ) : (
                        <p className="text-xs text-[#94A3B8] italic">No students found</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Activate Button */}
                <button
                  onClick={handleActivateLibrary}
                  disabled={!selectedLibraryCode || !selectedLibraryStudent || isActivatingLibrary}
                  className="w-full py-2.5 bg-[#2137D6] hover:bg-[#1a2bb3] text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isActivatingLibrary ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Activating...
                    </>
                  ) : (
                    <>
                      <Power className="w-4 h-4" />
                      Activate Library Item
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="p-3 bg-[#EEF2FF] rounded-xl border border-[#2137D6]/20">
                  <p className="text-xs text-[#2137D6]">
                    <span className="font-bold">How it works:</span> Upload phone numbers, and we will generate unique codes and immediately activate them for matching students.
                  </p>
                </div>

                {/* File Upload */}
                <div>
                  <label className="text-xs font-bold text-[#64748B] mb-2 block">Upload Phone Numbers</label>
                  <p className="text-[10px] text-[#94A3B8] mb-2">Supported: .txt, .csv (one phone per line)</p>
                  <input
                    ref={libraryFileInputRef}
                    type="file"
                    accept=".txt,.csv"
                    onChange={handleLibraryPreactivationFileSelect}
                    className="hidden"
                  />
                  <button
                    onClick={() => libraryFileInputRef.current?.click()}
                    className="w-full py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-[#EEF2FF] hover:border-[#2137D6] text-[#475569] rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Choose File
                  </button>
                </div>

                {/* Phone Numbers Preview */}
                {libraryPreactivationNumbers.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-[#64748B]">Phone Numbers ({libraryPreactivationNumbers.length})</label>
                      <button
                        onClick={clearLibraryPreactivationNumbers}
                        className="text-[10px] text-red-500 hover:text-red-600 flex items-center gap-1"
                      >
                        <X className="w-3 h-3" />
                        Clear
                      </button>
                    </div>
                    <div className="max-h-32 overflow-y-auto bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3">
                      <div className="flex flex-wrap gap-2">
                        {libraryPreactivationNumbers.map((num, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-white border border-[#E2E8F0] rounded-lg text-xs text-[#475569]"
                          >
                            {num}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Pre-activate Button */}
                <button
                  onClick={handleLibraryPreactivationUpload}
                  disabled={libraryPreactivationNumbers.length === 0 || isUploadingLibraryPreActivation}
                  className="w-full py-2.5 bg-[#10B981] hover:bg-[#059669] text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isUploadingLibraryPreActivation ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload & Process {libraryPreactivationNumbers.length > 0 && `(${libraryPreactivationNumbers.length})`}
                    </>
                  )}
                </button>

                {/* Pre-activation Results */}
                {libraryPreactivationResults && (
                  <div className="mt-2 p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                    <p className="text-xs font-bold text-[#1E293B] mb-2">Pre-activation Results:</p>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Success: {libraryPreactivationResults.success}
                      </span>
                      {libraryPreactivationResults.failed > 0 && (
                        <span className="text-xs text-red-600 flex items-center gap-1">
                          <X className="w-3.5 h-3.5" />
                          Failed: {libraryPreactivationResults.failed}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

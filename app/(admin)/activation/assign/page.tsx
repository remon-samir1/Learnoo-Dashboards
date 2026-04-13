'use client';

import React, { useState } from 'react';
import { ArrowLeft, UserPlus, Loader2, CheckCircle, Search } from 'lucide-react';
import Link from 'next/link';
import { useActivateCode, useCodes } from '@/src/hooks';
import { useStudents } from '@/src/hooks/useStudents';
import type { Student } from '@/src/types';
import toast from 'react-hot-toast';

export default function AssignCodePage() {
  const { mutate: activateCode, isLoading: isActivating } = useActivateCode();
  const { data: students, isLoading: isLoadingStudents } = useStudents();
  const { data: codes, isLoading: isLoadingCodes } = useCodes();

  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedCode, setSelectedCode] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !selectedCode) {
      toast.error('Please select both a student and a code');
      return;
    }

    const code = codes?.find((c) => c.id === selectedCode);
    if (!code) {
      toast.error('Code not found');
      return;
    }

    try {
      const itemType: 'course' | 'chapter' | 'library' =
        code.attributes.codeable_type === 'App\\Models\\Course'
          ? 'course'
          : code.attributes.codeable_type === 'App\\Models\\Chapter'
          ? 'chapter'
          : 'library';
      await activateCode({
        code: code.attributes.code,
        item_id: code.attributes.codeable_id,
        item_type: itemType,
        user_id: selectedStudent,
      });
      setSuccessMessage(`Code successfully assigned to student!`);
      setSelectedStudent('');
      setSelectedCode('');
      toast.success('Code assigned successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch {
      // Error handled by hook
    }
  };

  const studentsList = students?.data || [];
  const filteredStudents = studentsList.filter((student: Student) => {
    const fullName = `${student.attributes.first_name} ${student.attributes.last_name}`.toLowerCase();
    const email = student.attributes.email?.toLowerCase() || '';
    const search = studentSearch.toLowerCase();
    return fullName.includes(search) || email.includes(search);
  });

  const availableCodes = codes?.filter((code) => {
    // You may want to filter out already used codes here
    return true;
  });

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'App\\Models\\Course': 'Course',
      'App\\Models\\Chapter': 'Chapter',
      'App\\Models\\Library': 'Library',
    };
    return labels[type] || type;
  };

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/activation"
          className="p-2.5 bg-white border border-[#E2E8F0] rounded-xl text-[#64748B] hover:text-[#1E293B] hover:shadow-sm transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">Assign Code to User</h1>
          <p className="text-sm text-[#64748B] mt-0.5">Assign activation codes to students for course/chapter/library access.</p>
        </div>
      </div>

      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <p className="text-green-700 font-medium">{successMessage}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Student Selection */}
        <section className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#F1F5F9] bg-[#F8FAFC]/50">
            <h2 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider">Select Student</h2>
          </div>
          <div className="p-6 flex flex-col gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
              <input
                type="text"
                placeholder="Search students by name or email..."
                className="w-full pl-11 pr-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
              />
            </div>

            {/* Student List */}
            <div className="max-h-64 overflow-y-auto border border-[#E2E8F0] rounded-xl">
              {isLoadingStudents ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-[#2137D6]" />
                </div>
              ) : filteredStudents && filteredStudents.length > 0 ? (
                <div className="divide-y divide-[#E2E8F0]">
                  {filteredStudents.map((student: Student) => (
                    <label
                      key={student.id}
                      className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-[#F8FAFC] transition-colors ${
                        selectedStudent === student.id ? 'bg-[#EEF2FF]' : ''
                      }`}
                    >
                      <input
                        type="radio"
                        name="student"
                        value={student.id}
                        checked={selectedStudent === student.id}
                        onChange={(e) => setSelectedStudent(e.target.value)}
                        className="w-4 h-4 text-[#2137D6] focus:ring-[#2137D6]"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-[#1E293B]">
                          {student.attributes.first_name} {student.attributes.last_name}
                        </p>
                        <p className="text-sm text-[#64748B]">{student.attributes.email}</p>
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-[#64748B]">
                  No students found
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Code Selection */}
        <section className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#F1F5F9] bg-[#F8FAFC]/50">
            <h2 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider">Select Activation Code</h2>
          </div>
          <div className="p-6">
            {isLoadingCodes ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-[#2137D6]" />
              </div>
            ) : availableCodes && availableCodes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                {availableCodes.map((code) => (
                  <label
                    key={code.id}
                    className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all ${
                      selectedCode === code.id
                        ? 'border-[#2137D6] bg-[#EEF2FF]'
                        : 'border-[#E2E8F0] hover:border-[#CBD5E1]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="code"
                      value={code.id}
                      checked={selectedCode === code.id}
                      onChange={(e) => setSelectedCode(e.target.value)}
                      className="w-4 h-4 text-[#2137D6] focus:ring-[#2137D6]"
                    />
                    <div className="flex-1">
                      <p className="font-mono font-medium text-[#1E293B]">{code.attributes.code}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                          code.attributes.codeable_type === 'App\\Models\\Course'
                            ? 'bg-blue-100 text-blue-700'
                            : code.attributes.codeable_type === 'App\\Models\\Chapter'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-purple-100 text-purple-700'
                        }`}>
                          {getTypeLabel(code.attributes.codeable_type)}
                        </span>
                        <span className="text-xs text-[#64748B]">ID: {code.attributes.codeable_id}</span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-[#64748B]">
                No activation codes available. <Link href="/activation/generate" className="text-[#2137D6] hover:underline">Generate codes</Link>
              </div>
            )}
          </div>
        </section>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-4">
          <Link
            href="/activation"
            className="px-8 py-3 bg-white border border-[#E2E8F0] rounded-xl text-sm font-bold text-[#64748B] hover:bg-[#F8FAFC] hover:shadow-sm transition-all"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isActivating || !selectedStudent || !selectedCode}
            className="flex items-center gap-2 px-8 py-3 bg-[#2137D6] hover:bg-[#1a2bb3] text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isActivating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Assigning...
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                Assign to User
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

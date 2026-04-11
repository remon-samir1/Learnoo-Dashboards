'use client';

import React from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface EntityFormProps {
  title: string;
  description: string;
  backHref: string;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  error: string | null;
  children: React.ReactNode;
  submitLabel?: string;
  cancelLabel?: string;
}

export function EntityForm({
  title,
  description,
  backHref,
  onSubmit,
  isLoading,
  error,
  children,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
}: EntityFormProps) {
  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={backHref}
          className="p-2.5 bg-white border border-[#E2E8F0] rounded-xl text-[#64748B] hover:text-[#1E293B] hover:shadow-sm transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">{title}</h1>
          <p className="text-sm text-[#64748B] mt-0.5">{description}</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-6">
        {children}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">
            Error: {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-4 mt-4">
          <Link
            href={backHref}
            className="px-8 py-3 bg-white border border-[#E2E8F0] rounded-xl text-sm font-bold text-[#64748B] hover:bg-[#F8FAFC] hover:shadow-sm transition-all text-center"
          >
            {cancelLabel}
          </Link>
          <button
            type="submit"
            disabled={isLoading}
            className="px-8 py-3 bg-[#2137D6] hover:bg-[#1a2bb3] text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isLoading ? 'Saving...' : submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}

interface FormSectionProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export function FormSection({ title, icon, children }: FormSectionProps) {
  return (
    <section className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-[#F1F5F9] bg-[#F8FAFC]/50 flex items-center gap-2">
        {icon && <span className="text-[#4F46E5]">{icon}</span>}
        <h2 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider">{title}</h2>
      </div>
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {children}
      </div>
    </section>
  );
}

interface FormFieldProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function FormField({ label, required, children, className = '' }: FormFieldProps) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label className="text-[13px] font-bold text-[#475569]">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  required?: boolean;
}

export function FormInput({ label, required, className = '', ...props }: FormInputProps) {
  return (
    <FormField label={label} required={required}>
      <input
        {...props}
        className={`w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all placeholder:text-[#94A3B8] ${className}`}
      />
    </FormField>
  );
}

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  required?: boolean;
}

export function FormTextarea({ label, required, className = '', ...props }: FormTextareaProps) {
  return (
    <FormField label={label} required={required} className="md:col-span-2">
      <textarea
        {...props}
        className={`w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all placeholder:text-[#94A3B8] resize-none ${className}`}
      />
    </FormField>
  );
}

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  required?: boolean;
  options: { value: string; label: string }[];
}

export function FormSelect({ label, required, options, className = '', ...props }: FormSelectProps) {
  return (
    <FormField label={label} required={required} className="relative">
      <select
        {...props}
        className={`w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all appearance-none cursor-pointer ${className}`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <svg
        className="absolute right-4 top-[38px] w-4 h-4 text-[#94A3B8] pointer-events-none"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </FormField>
  );
}

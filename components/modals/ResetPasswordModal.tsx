"use client";

import React, { useState } from 'react';
import { X, ShieldAlert, Copy, Check } from 'lucide-react';

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  generatedPassword?: string;
  onConfirm: () => void;
  isLoading?: boolean;
  error?: string | null;
}

export default function ResetPasswordModal({
  isOpen,
  onClose,
  studentName,
  generatedPassword,
  onConfirm,
  isLoading = false,
  error = null
}: ResetPasswordModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Confirmation mode (no password generated yet)
  const isConfirmMode = !generatedPassword;

  const handleCopy = async () => {
    if (!generatedPassword) return;
    try {
      await navigator.clipboard.writeText(generatedPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-8 py-6 border-b border-[#F1F5F9] flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#1E293B]">Reset Password</h2>
          <button 
            onClick={onClose}
            className="p-2 text-[#94A3B8] hover:text-[#EF4444] hover:bg-red-50 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 flex flex-col gap-6">
          <div className="flex gap-4 p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-[13.5px] leading-relaxed text-[#475569]">
              {isConfirmMode ? (
                <>
                  You are about to reset the password for <span className="font-bold text-[#1E293B]">{studentName}</span>.
                  A new temporary password will be generated.
                </>
              ) : (
                <>
                  Password has been reset for <span className="font-bold text-[#1E293B]">{studentName}</span>.
                  Please copy and share the new temporary password securely.
                </>
              )}
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          {!isConfirmMode && generatedPassword && (
            <div className="flex flex-col gap-3">
              <label className="text-[13px] font-bold text-[#64748B] uppercase tracking-wider">Generated Password (Admin View Only):</label>
              <div className="bg-[#F4F7FF] border border-indigo-100 rounded-2xl p-6 flex items-center justify-between group">
                <span className="text-2xl font-mono font-bold text-[#4F46E5] tracking-widest">{generatedPassword}</span>
                <button
                  onClick={handleCopy}
                  className="p-2.5 bg-white border border-indigo-50 rounded-xl text-[#4F46E5] hover:shadow-md transition-all active:scale-95 shadow-sm"
                >
                  {copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-6 bg-[#F8FAFC]/80 border-t border-[#F1F5F9] flex items-center justify-end gap-4">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-8 py-3 bg-white border border-[#E2E8F0] rounded-xl text-sm font-bold text-[#64748B] hover:bg-white hover:shadow-sm transition-all disabled:opacity-50"
          >
            {isConfirmMode ? 'Cancel' : 'Close'}
          </button>
          {isConfirmMode && (
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="px-8 py-3 bg-[#2137D6] hover:bg-[#1a2bb3] text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-200 disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              Confirm Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

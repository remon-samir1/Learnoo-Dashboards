"use client";

import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface DeletePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeletePostModal({ isOpen, onClose, onConfirm }: DeletePostModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#0F172A]/20 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-[24px] w-[520px] max-w-[95vw] shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#F1F5F9]">
          <h2 className="text-xl font-bold text-[#1E293B]">Delete Post</h2>
          <button 
            onClick={onClose}
            className="text-[#94A3B8] hover:text-[#475569] transition-colors p-1 rounded-lg hover:bg-[#F8FAFC]"
          >
            <X className="w-[22px] h-[22px]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-start gap-5">
            <div className="w-14 h-14 rounded-full bg-[#FEE2E2] flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6 text-[#EF4444]" />
            </div>
            <p className="text-[15px] leading-relaxed text-[#475569] mt-1.5">
              Are you sure you want to permanently delete this post and all its comments?
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-5">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#475569] rounded-xl text-sm font-bold transition-all shadow-sm"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            className="px-6 py-2.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded-xl text-sm font-bold transition-all shadow-sm shadow-red-200/50"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

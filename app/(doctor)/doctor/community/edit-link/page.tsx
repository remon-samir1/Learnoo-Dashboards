"use client";

import React, { useState } from 'react';
import { ArrowLeft, Upload } from 'lucide-react';
import Link from 'next/link';

export default function EditCommunityLinkPage() {
  const [isActive, setIsActive] = useState(true);

  return (
    <div className="flex flex-col gap-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link 
          href="/community" 
          className="p-2 bg-white border border-[#E2E8F0] rounded-xl text-[#64748B] hover:text-[#1E293B] hover:bg-[#F8FAFC] transition-all shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">Edit Community Link</h1>
          <p className="text-[13px] font-semibold text-[#64748B] mt-1">Update community link information</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="p-8 flex flex-col gap-8">
          
          {/* Icon Upload Section */}
          <div>
            <h2 className="text-[15px] font-bold text-[#1E293B] mb-3">Icon</h2>
            <div className="border border-dashed border-[#CBD5E1] rounded-2xl bg-[#F8FAFC]/50 hover:bg-[#F8FAFC] transition-colors cursor-pointer group flex flex-col items-center justify-center py-10">
              <Upload className="w-8 h-8 text-[#94A3B8] group-hover:text-[#2137D6] transition-colors mb-4" />
              <p className="text-sm font-bold text-[#1E293B]">Click to upload Icon</p>
              <p className="text-xs font-semibold text-[#94A3B8] mt-1">PNG, JPG up to 5MB</p>
            </div>
          </div>

          {/* Link Information Section */}
          <div>
            <h2 className="text-[17px] font-bold text-[#1E293B] mb-5">Link Information</h2>
            
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#475569]">Title *</label>
                <input 
                  type="text" 
                  defaultValue="Join whatsApp Group"
                  className="w-full px-4 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all text-[#1E293B]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#475569]">Platform *</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all text-[#1E293B]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#475569]">URL *</label>
                <input 
                  type="text" 
                  defaultValue="https://facebook.com/learnoo"
                  className="w-full px-4 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all text-[#1E293B]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#475569]">Description</label>
                <textarea 
                  rows={4}
                  className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all text-[#1E293B] resize-none"
                />
              </div>
            </div>
          </div>

          {/* Active Status Section */}
          <div className="bg-[#F8FAFC] border border-[#F1F5F9] rounded-2xl p-5 flex items-center justify-between">
            <div>
              <h3 className="text-[14px] font-bold text-[#1E293B]">Active Status</h3>
              <p className="text-[12px] font-semibold text-[#64748B] mt-0.5">Make this link visible to students</p>
            </div>
            
            <button 
              onClick={() => setIsActive(!isActive)}
              className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out flex ${isActive ? 'bg-[#2137D6]' : 'bg-[#CBD5E1]'}`}
            >
              <div 
                className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ease-in-out ${isActive ? 'translate-x-6' : 'translate-x-0'}`}
              />
            </button>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="border-t border-[#F1F5F9] px-8 py-5 flex items-center justify-end gap-3 bg-white">
          <Link 
            href="/community"
            className="px-6 py-2.5 bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#475569] rounded-xl text-[14px] font-bold transition-all shadow-sm"
          >
            Cancel
          </Link>
          <button className="px-6 py-2.5 bg-[#2137D6] hover:bg-[#1a2bb3] text-white rounded-xl text-[14px] font-bold transition-all shadow-sm shadow-blue-200">
            Save Changes
          </button>
        </div>

      </div>
    </div>
  );
}

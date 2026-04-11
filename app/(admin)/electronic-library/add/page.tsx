"use client";

import React, { useState } from 'react';
import { ArrowLeft, Info } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FileUpload } from '@/components/FileUpload';

export default function AddLibraryItemPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    center: '',
    description: '',
    available: true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/electronic-library');
  };

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link 
          href="/electronic-library"
          className="p-2.5 bg-white border border-[#E2E8F0] rounded-xl text-[#64748B] hover:text-[#1E293B] hover:shadow-sm transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">Add Library Item</h1>
          <p className="text-sm text-[#64748B] mt-0.5">Add a new book or material to the electronic library and send a notification to students</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Item Details Section */}
        <section className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm overflow-hidden p-6 flex flex-col gap-6">
          <h2 className="text-base font-bold text-[#1E293B]">Item Details</h2>
          
          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-bold text-[#475569]">Title</label>
            <input 
              type="text" 
              placeholder="e.g., Advanced Physics Guide"
              className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all placeholder:text-[#94A3B8]"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-bold text-[#475569]">Category</label>
              <select 
                className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all appearance-none cursor-pointer text-[#475569]"
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
              >
                <option value="">Select Category</option>
                <option value="Book">Book</option>
                <option value="Video">Video</option>
                <option value="Notes">Notes</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-bold text-[#475569]">Center</label>
              <select 
                className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all appearance-none cursor-pointer text-[#475569]"
                value={formData.center}
                onChange={(e) => setFormData({...formData, center: e.target.value})}
              >
                <option value="">Select Center</option>
                <option value="Main Center">Main Center, Dokki</option>
                <option value="Nasr City">Nasr City Center</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-bold text-[#475569]">Description</label>
            <textarea 
              placeholder="Describe the item..."
              rows={4}
              className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all placeholder:text-[#94A3B8] resize-none"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>
        </section>

        {/* Cover Image Section */}
        <section className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm overflow-hidden p-6 flex flex-col gap-4">
          <h2 className="text-base font-bold text-[#1E293B]">Cover Image</h2>
          <FileUpload 
            label="Cover Image" 
            onFileSelect={(file) => console.log('Selected file:', file)}
          />
        </section>

        {/* Availability Section */}
        <section className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm overflow-hidden p-6">
          <h2 className="text-base font-bold text-[#1E293B] mb-6">Availability</h2>
          
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-[14px] font-bold text-[#1E293B]">Available to Students</span>
              <span className="text-[13px] text-[#64748B]">Show this item in the student library</span>
            </div>
            
            {/* Toggle Switch */}
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={formData.available}
                onChange={(e) => setFormData({...formData, available: e.target.checked})}
              />
              <div className="w-11 h-6 bg-[#E2E8F0] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2137D6]"></div>
            </label>
          </div>
        </section>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-4 mt-2">
          <button 
            type="button"
            onClick={() => router.push('/electronic-library')}
            className="px-6 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm font-bold text-[#64748B] hover:bg-[#F8FAFC] hover:shadow-sm transition-all"
          >
            Cancel
          </button>
          <button 
            type="submit"
            className="px-6 py-2.5 bg-[#2137D6] hover:bg-[#1a2bb3] text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-200"
          >
            Add to Library
          </button>
        </div>
      </form>
    </div>
  );
}

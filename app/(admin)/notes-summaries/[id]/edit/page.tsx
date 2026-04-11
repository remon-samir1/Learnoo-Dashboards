"use client";

import React, { useState } from 'react';
import { ArrowLeft, ChevronDown, Save } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function EditNotePage() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    title: 'Chapter 1 Summary: Kinematics',
    type: 'Summary',
    visibility: 'Public',
    course: 'Physics 101',
    lecture: 'Introduction to Motion',
    content: "Kinematics is the branch of mechanics that describes the motion of objects without considering the forces that cause the motion.\n\nKey Equations:\n- v = u + at\n- s = ut + ½at²\n- v² = u² + 2as"
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/notes-summaries/1');
  };

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link 
          href="/notes-summaries/1"
          className="p-2.5 bg-white border border-[#E2E8F0] rounded-xl text-[#64748B] hover:text-[#1E293B] hover:shadow-sm transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">Edit Note</h1>
          <p className="text-sm text-[#64748B] mt-0.5">Update note details and content.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-6">
        {/* Left Column */}
        <div className="flex-1 flex flex-col gap-6">
          {/* Note Details Section */}
          <section className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm p-6 flex flex-col gap-6">
            <h2 className="text-base font-bold text-[#1E293B]">Note Details</h2>
            
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-bold text-[#475569]">Title</label>
              <input 
                type="text" 
                className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all text-[#1E293B]"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2 relative">
                <label className="text-[13px] font-bold text-[#475569]">Type</label>
                <select 
                  className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all appearance-none cursor-pointer text-[#1E293B]"
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                >
                  <option value="Summary">Summary</option>
                  <option value="Key Points">Key Points</option>
                  <option value="Full Notes">Full Notes</option>
                </select>
                <ChevronDown className="absolute right-4 top-[38px] w-4 h-4 text-[#94A3B8] pointer-events-none" />
              </div>
              <div className="flex flex-col gap-2 relative">
                <label className="text-[13px] font-bold text-[#475569]">Visibility</label>
                <select 
                  className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all appearance-none cursor-pointer text-[#1E293B]"
                  value={formData.visibility}
                  onChange={(e) => setFormData({...formData, visibility: e.target.value})}
                >
                  <option value="Public">Public</option>
                  <option value="Private">Private</option>
                </select>
                <ChevronDown className="absolute right-4 top-[38px] w-4 h-4 text-[#94A3B8] pointer-events-none" />
              </div>
            </div>
          </section>

          {/* Content Section */}
          <section className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm p-6 flex flex-col gap-6">
            <h2 className="text-base font-bold text-[#1E293B]">Content</h2>
            <div className="flex flex-col gap-2">
              <textarea 
                rows={8}
                className="w-full px-4 py-4 bg-white border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all text-[#475569] leading-relaxed resize-y min-h-[200px]"
                value={formData.content}
                onChange={(e) => setFormData({...formData, content: e.target.value})}
              />
            </div>
          </section>
        </div>

        {/* Right Column */}
        <div className="w-full lg:w-[350px] flex flex-col gap-6">
          {/* Assignment Section */}
          <section className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm p-6 flex flex-col gap-6">
            <h2 className="text-base font-bold text-[#1E293B]">Assignment</h2>
            
            <div className="flex flex-col gap-2 relative">
              <label className="text-[13px] font-bold text-[#475569]">Course</label>
              <select 
                className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all appearance-none cursor-pointer text-[#1E293B]"
                value={formData.course}
                onChange={(e) => setFormData({...formData, course: e.target.value})}
              >
                <option value="Physics 101">Physics 101</option>
                <option value="Advanced Mathematics">Advanced Mathematics</option>
              </select>
              <ChevronDown className="absolute right-4 top-[38px] w-4 h-4 text-[#94A3B8] pointer-events-none" />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-bold text-[#475569]">Lecture</label>
              <input 
                type="text" 
                className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all text-[#1E293B]"
                value={formData.lecture}
                onChange={(e) => setFormData({...formData, lecture: e.target.value})}
              />
            </div>
          </section>

          {/* Action Buttons */}
          <div className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm p-6 flex items-center justify-between gap-4">
             <button 
              type="submit"
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#2137D6] hover:bg-[#1a2bb3] text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-200"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
            <button 
              type="button"
              onClick={() => router.push('/notes-summaries/1')}
              className="flex-1 py-3 bg-white border border-[#E2E8F0] rounded-xl text-sm font-bold text-[#64748B] hover:bg-[#F8FAFC] hover:shadow-sm transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

"use client";

import React, { useState } from 'react';
import { ArrowLeft, X, FileText, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AddNotePage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [noteType, setNoteType] = useState('summary');
  const [attachments, setAttachments] = useState<string[]>([]);

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Add New Note</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-[#E5E7EB] p-8">
        <div className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter note title"
              className="w-full px-4 py-2.5 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Note Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Note Type</label>
            <div className="flex gap-4">
              <button
                onClick={() => setNoteType('summary')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                  noteType === 'summary'
                    ? 'border-blue-600 bg-blue-50 text-blue-600'
                    : 'border-[#E5E7EB] text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  noteType === 'summary' ? 'border-blue-600' : 'border-gray-300'
                }`}>
                  {noteType === 'summary' && <div className="w-2 h-2 bg-blue-600 rounded-full" />}
                </div>
                Summary
              </button>
              <button
                onClick={() => setNoteType('keypoints')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                  noteType === 'keypoints'
                    ? 'border-blue-600 bg-blue-50 text-blue-600'
                    : 'border-[#E5E7EB] text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  noteType === 'keypoints' ? 'border-blue-600' : 'border-gray-300'
                }`}>
                  {noteType === 'keypoints' && <div className="w-2 h-2 bg-blue-600 rounded-full" />}
                </div>
                Keypoints
              </button>
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter note content..."
              rows={8}
              className="w-full px-4 py-2.5 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Attachments */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Attachments</label>
            <div className="space-y-2">
              {attachments.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{file}</p>
                      <p className="text-xs text-gray-500">1.2 MB</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => removeAttachment(index)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-[#E5E7EB] rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors">
                <Plus className="w-4 h-4" />
                Add Attachment
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E5E7EB]">
            <button 
              onClick={() => router.back()}
              className="px-6 py-2.5 text-gray-700 font-medium hover:bg-gray-50 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
              Create Note
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from 'react';
import { ArrowLeft, Clock, CheckCircle2, X, Upload, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CreateExamPage() {
  const router = useRouter();
  const [examName, setExamName] = useState('');
  const [duration, setDuration] = useState('');
  const [passingScore, setPassingScore] = useState('60');
  const [instructions, setInstructions] = useState('');
  const [questionTypes, setQuestionTypes] = useState({
    multipleChoice: true,
    essay: false,
    trueFalse: false
  });
  const [examType, setExamType] = useState('auto-graded');

  const toggleQuestionType = (type: keyof typeof questionTypes) => {
    setQuestionTypes(prev => ({ ...prev, [type]: !prev[type] }));
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
          <span className="font-medium">Create New Exam</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-[#E5E7EB] p-8">
        {/* Progress Steps */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-medium text-blue-600">Exam Details</span>
          </div>
          <div className="flex-1 h-0.5 bg-gray-200" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-sm text-gray-500">2</span>
            </div>
            <span className="text-sm text-gray-500">Add Questions</span>
          </div>
          <div className="flex-1 h-0.5 bg-gray-200" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-sm text-gray-500">3</span>
            </div>
            <span className="text-sm text-gray-500">Settings</span>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-6">
          {/* Exam Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Exam Name</label>
            <input
              type="text"
              value={examName}
              onChange={(e) => setExamName(e.target.value)}
              placeholder="Enter exam name"
              className="w-full px-4 py-2.5 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Question Types */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Question Types</label>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => toggleQuestionType('multipleChoice')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                  questionTypes.multipleChoice 
                    ? 'border-blue-600 bg-blue-50 text-blue-600' 
                    : 'border-[#E5E7EB] text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                  questionTypes.multipleChoice ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                }`}>
                  {questionTypes.multipleChoice && <CheckCircle2 className="w-3 h-3 text-white" />}
                </div>
                Multiple Choice
              </button>
              <button
                onClick={() => toggleQuestionType('essay')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                  questionTypes.essay 
                    ? 'border-blue-600 bg-blue-50 text-blue-600' 
                    : 'border-[#E5E7EB] text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                  questionTypes.essay ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                }`}>
                  {questionTypes.essay && <CheckCircle2 className="w-3 h-3 text-white" />}
                </div>
                Essay
              </button>
              <button
                onClick={() => toggleQuestionType('trueFalse')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                  questionTypes.trueFalse 
                    ? 'border-blue-600 bg-blue-50 text-blue-600' 
                    : 'border-[#E5E7EB] text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                  questionTypes.trueFalse ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                }`}>
                  {questionTypes.trueFalse && <CheckCircle2 className="w-3 h-3 text-white" />}
                </div>
                True/False
              </button>
            </div>
          </div>

          {/* Exam Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Exam Type</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="examType"
                  value="auto-graded"
                  checked={examType === 'auto-graded'}
                  onChange={(e) => setExamType(e.target.value)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm text-gray-700">Auto-graded</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="examType"
                  value="manual"
                  checked={examType === 'manual'}
                  onChange={(e) => setExamType(e.target.value)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm text-gray-700">Manual Grading Required</span>
              </label>
            </div>
          </div>

          {/* Duration and Passing Score */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes)</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="60"
                  className="w-full pl-10 pr-4 py-2.5 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Passing Score (%)</label>
              <input
                type="number"
                value={passingScore}
                onChange={(e) => setPassingScore(e.target.value)}
                placeholder="60"
                className="w-full px-4 py-2.5 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Instructions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Instructions</label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Enter exam instructions for students..."
              rows={4}
              className="w-full px-4 py-2.5 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
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
              Create Exam
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

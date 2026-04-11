"use client";

import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  ChevronDown,
  Info,
  HelpCircle
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Question {
  id: string;
  text: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
}

export default function CreateExamPage() {
  const router = useRouter();
  const [examDetails, setExamDetails] = useState({
    title: '',
    course: '',
    center: '',
    duration: '60',
    status: 'Draft'
  });

  const [questions, setQuestions] = useState<Question[]>([
    {
      id: '1',
      text: '',
      options: { A: '', B: '', C: '', D: '' },
      correctAnswer: 'A'
    }
  ]);

  const addQuestion = () => {
    const newId = (questions.length + 1).toString();
    setQuestions([...questions, {
      id: newId,
      text: '',
      options: { A: '', B: '', C: '', D: '' },
      correctAnswer: 'A'
    }]);
  };

  const removeQuestion = (id: string) => {
    if (questions.length > 1) {
      setQuestions(questions.filter(q => q.id !== id));
    }
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const updateOption = (qId: string, option: 'A' | 'B' | 'C' | 'D', value: string) => {
    setQuestions(questions.map(q => {
      if (q.id === qId) {
        return {
          ...q,
          options: { ...q.options, [option]: value }
        };
      }
      return q;
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Creating Exam:', { examDetails, questions });
    router.push('/exams');
  };

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link 
          href="/exams"
          className="p-2.5 bg-white border border-[#E2E8F0] rounded-xl text-[#64748B] hover:text-[#1E293B] hover:shadow-sm transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">Create New Exam</h1>
          <p className="text-sm text-[#64748B] mt-0.5">Build an exam with questions and answers.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Exam Details Section */}
        <section className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#F1F5F9] bg-[#F8FAFC]/50 flex items-center gap-2">
            <h2 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider">Exam Details</h2>
          </div>
          <div className="p-6 flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-bold text-[#475569]">Exam Title</label>
              <input 
                type="text" 
                placeholder="e.g., Midterm: Mechanics"
                className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all placeholder:text-[#94A3B8]"
                value={examDetails.title}
                onChange={(e) => setExamDetails({...examDetails, title: e.target.value})}
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2 relative">
                <label className="text-[13px] font-bold text-[#475569]">Course</label>
                <select 
                  className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all appearance-none cursor-pointer"
                  value={examDetails.course}
                  onChange={(e) => setExamDetails({...examDetails, course: e.target.value})}
                  required
                >
                  <option value="">Select Course</option>
                  <option value="Physics 101">Physics 101</option>
                  <option value="Advanced Mathematics">Advanced Mathematics</option>
                </select>
                <ChevronDown className="absolute right-4 top-[42px] w-4 h-4 text-[#94A3B8] pointer-events-none" />
              </div>
              
              <div className="flex flex-col gap-2 relative">
                <label className="text-[13px] font-bold text-[#475569]">Center</label>
                <select 
                  className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all appearance-none cursor-pointer"
                  value={examDetails.center}
                  onChange={(e) => setExamDetails({...examDetails, center: e.target.value})}
                  required
                >
                  <option value="">Select Center</option>
                  <option value="Main Center">Main Center, Dokki</option>
                  <option value="Nasr Center">Nasr City Center</option>
                </select>
                <ChevronDown className="absolute right-4 top-[42px] w-4 h-4 text-[#94A3B8] pointer-events-none" />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-[#475569]">Duration (minutes)</label>
                <input 
                  type="number" 
                  className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all"
                  value={examDetails.duration}
                  onChange={(e) => setExamDetails({...examDetails, duration: e.target.value})}
                />
              </div>

              <div className="flex flex-col gap-2 relative">
                <label className="text-[13px] font-bold text-[#475569]">Status</label>
                <select 
                  className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all appearance-none cursor-pointer"
                  value={examDetails.status}
                  onChange={(e) => setExamDetails({...examDetails, status: e.target.value})}
                >
                  <option value="Draft">Draft</option>
                  <option value="Active">Active</option>
                </select>
                <ChevronDown className="absolute right-4 top-[42px] w-4 h-4 text-[#94A3B8] pointer-events-none" />
              </div>
            </div>
          </div>
        </section>

        {/* Questions Section */}
        <div className="flex flex-col gap-6">
          {questions.map((q, index) => (
            <section key={q.id} className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-[#F1F5F9] bg-[#F8FAFC]/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-[#1E293B]">Question {index + 1}</h3>
                </div>
                {questions.length > 1 && (
                  <button 
                    type="button"
                    onClick={() => removeQuestion(q.id)}
                    className="p-1.5 text-[#EF4444] hover:bg-[#FEE2E2] rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="p-6 flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[13px] font-bold text-[#475569]">Question Text</label>
                  <input 
                    type="text" 
                    placeholder="Enter the question..."
                    className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all placeholder:text-[#E2E8F0]"
                    value={q.text}
                    onChange={(e) => updateQuestion(q.id, { text: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(['A', 'B', 'C', 'D'] as const).map((opt) => (
                    <div key={opt} className="flex flex-col gap-2">
                      <label className="text-[12px] font-bold text-[#64748B]">Option {opt}</label>
                      <input 
                        type="text" 
                        placeholder={`Option ${opt}`}
                        className="w-full px-4 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all placeholder:text-[#E2E8F0]"
                        value={q.options[opt]}
                        onChange={(e) => updateOption(q.id, opt, e.target.value)}
                        required
                      />
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-2 relative">
                  <label className="text-[13px] font-bold text-[#475569]">Correct Answer</label>
                  <select 
                    className="w-full px-4 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all appearance-none cursor-pointer"
                    value={q.correctAnswer}
                    onChange={(e) => updateQuestion(q.id, { correctAnswer: e.target.value as any })}
                  >
                    <option value="A text-green-500">Option A</option>
                    <option value="B text-green-500">Option B</option>
                    <option value="C text-green-500">Option C</option>
                    <option value="D text-green-500">Option D</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-[38px] w-4 h-4 text-[#94A3B8] pointer-events-none" />
                </div>
              </div>
            </section>
          ))}
        </div>

        {/* Add Question Button */}
        <button 
          type="button"
          onClick={addQuestion}
          className="flex items-center gap-2 px-6 py-3 bg-white border border-[#E2E8F0] rounded-xl text-sm font-bold text-[#1E293B] hover:bg-[#F8FAFC] hover:shadow-sm transition-all w-fit"
        >
          <Plus className="w-4 h-4" />
          Add Question
        </button>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-[#E2E8F0]">
          <button 
            type="button"
            onClick={() => router.push('/exams')}
            className="px-8 py-3 bg-white border border-[#E2E8F0] rounded-xl text-sm font-bold text-[#64748B] hover:bg-[#F8FAFC] hover:shadow-sm transition-all"
          >
            Cancel
          </button>
          <button 
            type="submit"
            className="px-10 py-3 bg-[#2137D6] hover:bg-[#1a2bb3] text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-200"
          >
            Create Exam
          </button>
        </div>
      </form>
    </div>
  );
}

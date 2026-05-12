"use client";

import React, { useState } from 'react';
import { 
  MessageCircle, 
  Search, 
  Plus, 
  ChevronUp, 
  ChevronDown, 
  Clock, 
  Eye,
  Bookmark,
  CheckCircle2,
  HelpCircle,
  User,
  Trophy,
  MoreHorizontal,
  Filter
} from 'lucide-react';

interface Question {
  id: number;
  title: string;
  votes: number;
  answers: number;
  views: number;
  author: string;
  avatar: string;
  avatarBg: string;
  course: string;
  time: string;
  tags: string[];
  hasAcceptedAnswer: boolean;
  preview?: string;
}

interface Contributor {
  id: number;
  name: string;
  avatar: string;
  avatarBg: string;
  points: number;
  rank: number;
}

const questions: Question[] = [
  {
    id: 1,
    title: 'What is the difference between Type 1 and Type 2 diabetes in terms of insulin production?',
    votes: 24,
    answers: 3,
    views: 156,
    author: 'Ahmed K.',
    avatar: 'AK',
    avatarBg: 'bg-[#4F46E5]',
    course: 'Endocrinology Basics',
    time: '2 hours ago',
    tags: ['Diabetes', 'Endocrinology'],
    hasAcceptedAnswer: true,
    preview: 'Type 1 diabetes is an autoimmune condition where the body attacks insulin-producing beta cells in the pancreas. Type 2 diabetes is characterized by insulin resistance...',
  },
  {
    id: 2,
    title: 'How does the Krebs cycle connect to the electron transport chain?',
    votes: 18,
    answers: 2,
    views: 89,
    author: 'Sara M.',
    avatar: 'SM',
    avatarBg: 'bg-[#10B981]',
    course: 'Biochemistry 101',
    time: '4 hours ago',
    tags: ['Metabolism', 'Cell Biology'],
    hasAcceptedAnswer: false,
  },
  {
    id: 3,
    title: 'What are the main clinical manifestations of hypothyroidism?',
    votes: 15,
    answers: 5,
    views: 234,
    author: 'Nour A.',
    avatar: 'NA',
    avatarBg: 'bg-[#EC4899]',
    course: 'Endocrinology Basics',
    time: '6 hours ago',
    tags: ['Thyroid', 'Clinical Medicine'],
    hasAcceptedAnswer: true,
    preview: 'Hypothyroidism presents with fatigue, weight gain, cold intolerance, dry skin, constipation, and depression. In severe cases, myxedema coma can occur...',
  },
  {
    id: 4,
    title: 'Can someone explain the difference between systolic and diastolic heart failure?',
    votes: 12,
    answers: 1,
    views: 67,
    author: 'Mohamed H.',
    avatar: 'MH',
    avatarBg: 'bg-[#F59E0B]',
    course: 'Cardiology Advanced',
    time: '8 hours ago',
    tags: ['Cardiology', 'Heart Failure'],
    hasAcceptedAnswer: false,
  },
  {
    id: 5,
    title: 'What is the mechanism of action of beta-blockers in treating hypertension?',
    votes: 31,
    answers: 4,
    views: 312,
    author: 'Yara S.',
    avatar: 'YS',
    avatarBg: 'bg-[#8B5CF6]',
    course: 'Pharmacology Review',
    time: '12 hours ago',
    tags: ['Pharmacology', 'Cardiology'],
    hasAcceptedAnswer: true,
    preview: 'Beta-blockers work by blocking beta-adrenergic receptors, which reduces heart rate, myocardial contractility, and renin release, thereby lowering blood pressure...',
  },
];

const contributors: Contributor[] = [
  { id: 1, name: 'Dr. Nada S.', avatar: 'NS', avatarBg: 'bg-[#4F46E5]', points: 2840, rank: 1 },
  { id: 2, name: 'Ahmed K.', avatar: 'AK', avatarBg: 'bg-[#10B981]', points: 2156, rank: 2 },
  { id: 3, name: 'Sara M.', avatar: 'SM', avatarBg: 'bg-[#F59E0B]', points: 1890, rank: 3 },
  { id: 4, name: 'Nour A.', avatar: 'NA', avatarBg: 'bg-[#EC4899]', points: 1543, rank: 4 },
  { id: 5, name: 'Yara S.', avatar: 'YS', avatarBg: 'bg-[#8B5CF6]', points: 1234, rank: 5 },
];

const tabs = [
  { id: 'latest', label: 'Latest', icon: Clock },
  { id: 'my-questions', label: 'My Questions', icon: User },
  { id: 'answered', label: 'Answered', icon: CheckCircle2 },
  { id: 'unanswered', label: 'Unanswered', icon: HelpCircle },
  { id: 'bookmarked', label: 'Bookmarked', icon: Bookmark },
];

export default function QAPage() {
  const [activeTab, setActiveTab] = useState('latest');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <MessageCircle className="w-6 h-6 text-[#4F46E5]" />
            <h1 className="text-2xl font-bold text-[#1E293B]">Q&A</h1>
            <span className="px-2.5 py-0.5 bg-[#FEF2F2] text-[#EF4444] text-xs font-semibold rounded-full">
              12 new
            </span>
          </div>
          <p className="text-sm text-[#64748B]">
            Ask questions, share knowledge, and learn together.
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#4F46E5] text-white text-sm font-medium rounded-lg hover:bg-[#4338CA] transition-colors">
          <Plus className="w-4 h-4" />
          Ask New Question
        </button>
      </div>

      <div className="flex gap-6">
        {/* Left Sidebar */}
        <div className="w-64 shrink-0">
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-[#4F46E5] text-white'
                      : 'text-[#64748B] hover:bg-[#F8FAFC]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Stats Card */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 mt-4">
            <h3 className="text-sm font-semibold text-[#1E293B] mb-4">Your Stats</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#64748B]">Questions Asked</span>
                <span className="text-sm font-semibold text-[#1E293B]">24</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#64748B]">Answers Given</span>
                <span className="text-sm font-semibold text-[#1E293B]">156</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#64748B]">Reputation</span>
                <span className="text-sm font-semibold text-[#1E293B]">2,840</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Search Bar */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 mb-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                <input
                  type="text"
                  placeholder="Search questions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-[#F8FAFC] border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:ring-opacity-20 placeholder:text-[#9CA3AF]"
                />
              </div>
              <button className="flex items-center gap-2 px-3 py-2 text-[#64748B] hover:bg-[#F8FAFC] rounded-lg transition-colors">
                <Filter className="w-4 h-4" />
                <span className="text-sm">Filter</span>
              </button>
            </div>
          </div>

          {/* Questions List */}
          <div className="space-y-4">
            {questions.map((question) => (
              <div
                key={question.id}
                className="bg-white rounded-xl border border-[#E5E7EB] p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex gap-4">
                  {/* Vote Section */}
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <button className="p-1 text-[#94A3B8] hover:text-[#4F46E5] transition-colors">
                      <ChevronUp className="w-5 h-5" />
                    </button>
                    <span className="text-lg font-bold text-[#1E293B]">{question.votes}</span>
                    <button className="p-1 text-[#94A3B8] hover:text-[#EF4444] transition-colors">
                      <ChevronDown className="w-5 h-5" />
                    </button>
                    {question.hasAcceptedAnswer && (
                      <CheckCircle2 className="w-5 h-5 text-[#10B981] mt-1" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-[#1E293B] mb-2 hover:text-[#4F46E5] cursor-pointer">
                      {question.title}
                    </h3>
                    
                    {/* Tags */}
                    <div className="flex items-center gap-2 mb-3">
                      {question.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-[#F1F5F9] text-[#64748B] text-xs font-medium rounded-md"
                        >
                          {tag}
                        </span>
                      ))}
                      <span className="text-xs text-[#94A3B8]">• {question.course}</span>
                    </div>

                    {/* Preview */}
                    {question.preview && (
                      <p className="text-sm text-[#64748B] mb-3 line-clamp-2">
                        {question.preview}
                      </p>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 ${question.avatarBg} rounded-full flex items-center justify-center text-white text-xs font-bold`}>
                          {question.avatar}
                        </div>
                        <span className="text-sm text-[#64748B]">{question.author}</span>
                        <span className="text-xs text-[#94A3B8]">asked {question.time}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-[#64748B]">
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-4 h-4" />
                          {question.answers} answers
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {question.views} views
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-72 shrink-0">
          {/* Top Contributors */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 mb-4">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-[#F59E0B]" />
              <h3 className="text-sm font-semibold text-[#1E293B]">Top Contributors</h3>
            </div>
            <div className="space-y-3">
              {contributors.map((contributor) => (
                <div key={contributor.id} className="flex items-center gap-3">
                  <span className="text-sm font-bold text-[#94A3B8] w-4">#{contributor.rank}</span>
                  <div className={`w-8 h-8 ${contributor.avatarBg} rounded-full flex items-center justify-center text-white text-xs font-bold`}>
                    {contributor.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1E293B] truncate">{contributor.name}</p>
                    <p className="text-xs text-[#64748B]">{contributor.points.toLocaleString()} pts</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Popular Tags */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-4">
            <h3 className="text-sm font-semibold text-[#1E293B] mb-4">Popular Tags</h3>
            <div className="flex flex-wrap gap-2">
              {['Cardiology', 'Pharmacology', 'Anatomy', 'Biochemistry', 'Endocrinology', 'Neurology', 'Pathology', 'Clinical Medicine'].map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-[#F1F5F9] text-[#64748B] text-xs font-medium rounded-md hover:bg-[#E2E8F0] cursor-pointer transition-colors"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

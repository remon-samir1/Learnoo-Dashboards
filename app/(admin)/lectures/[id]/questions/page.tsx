'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, MessageSquare, Clock, Send, Trash2, Edit2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { api, getApiErrorMessage } from '@/src/lib/api';
import type { StudentQuestion } from '@/src/types';

export default function LectureQuestionsPage() {
  const params = useParams();
  const lectureId = params.id as string;

  const [questions, setQuestions] = useState<StudentQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [editingReply, setEditingReply] = useState<string | null>(null);
  const [savingReply, setSavingReply] = useState<string | null>(null);

  useEffect(() => {
    loadQuestions();
  }, [lectureId]);

  const loadQuestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.lectureQuestions.list(parseInt(lectureId));
      setQuestions(res.data);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load questions'));
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (seconds: number | null): string => {
    if (seconds === null || seconds === undefined) return '—';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleReply = async (questionId: string) => {
    const text = replyText[questionId]?.trim();
    if (!text) return;

    setSavingReply(questionId);
    try {
      await api.lectureQuestions.reply(parseInt(questionId), text);
      toast.success('Reply sent successfully');
      setReplyText((prev) => ({ ...prev, [questionId]: '' }));
      loadQuestions();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to send reply'));
    } finally {
      setSavingReply(null);
    }
  };

  const handleDelete = async (questionId: string) => {
    if (!confirm('Delete this question?')) return;
    try {
      await api.lectureQuestions.delete(parseInt(questionId));
      toast.success('Question deleted');
      setQuestions((prev) => prev.filter((q) => q.id !== questionId));
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to delete question'));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#2137D6]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-[#EF4444]">{error}</p>
        <button
          onClick={loadQuestions}
          className="px-4 py-2 bg-[#2137D6] text-white rounded-xl text-sm font-bold"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto pb-12">
      <div className="flex items-center gap-4">
        <Link
          href={`/lectures/${lectureId}/edit`}
          className="p-2.5 bg-white border border-[#E2E8F0] rounded-xl text-[#64748B] hover:text-[#1E293B] hover:shadow-sm transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">Student Questions</h1>
          <p className="text-sm text-[#64748B] mt-0.5">
            {questions.length} question{questions.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {questions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-[#F1F5F9]">
          <MessageSquare className="w-12 h-12 text-[#94A3B8] mb-4" />
          <p className="text-sm font-bold text-[#1E293B]">No questions yet</p>
          <p className="text-xs text-[#64748B] mt-1">Student questions will appear here</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {questions.map((q) => (
            <div
              key={q.id}
              className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-bold text-[#1E293B]">{q.student_name}</span>
                      {q.video_timestamp !== null && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#EEF2FF] text-[#2137D6] rounded-full text-[11px] font-bold">
                          <Clock className="w-3 h-3" />
                          {formatTimestamp(q.video_timestamp)}
                        </span>
                      )}
                      <span className="text-xs text-[#94A3B8]">
                        {new Date(q.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-[#475569]">{q.question}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      type="button"
                      onClick={() => handleDelete(q.id)}
                      className="p-1.5 text-[#EF4444] hover:bg-[#FEE2E2] rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {q.reply && editingReply !== q.id ? (
                  <div className="mt-4 p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-[#64748B] uppercase">Your Reply</span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingReply(q.id);
                          setReplyText((prev) => ({ ...prev, [q.id]: q.reply || '' }));
                        }}
                        className="p-1 text-[#2137D6] hover:bg-[#EEF2FF] rounded-lg transition-all"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-sm text-[#475569]">{q.reply}</p>
                  </div>
                ) : (
                  <div className="mt-4 flex items-center gap-3">
                    <input
                      type="text"
                      placeholder={editingReply === q.id ? 'Edit your reply...' : 'Type your reply...'}
                      value={replyText[q.id] || ''}
                      onChange={(e) =>
                        setReplyText((prev) => ({ ...prev, [q.id]: e.target.value }))
                      }
                      className="flex-1 px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => handleReply(q.id)}
                      disabled={savingReply === q.id || !replyText[q.id]?.trim()}
                      className="p-2.5 bg-[#2137D6] text-white rounded-xl hover:bg-[#1a2bb3] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {savingReply === q.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </button>
                    {editingReply === q.id && (
                      <button
                        type="button"
                        onClick={() => setEditingReply(null)}
                        className="p-2.5 text-[#64748B] hover:bg-[#F8FAFC] rounded-xl transition-all"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

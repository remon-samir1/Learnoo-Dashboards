'use client';

import React, { useState } from 'react';
import { ArrowLeft, Check, Trash, MessageSquare, Flag, X, Loader2, Edit2 } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { usePost, useUpdatePost, useDeletePost } from '@/src/hooks/usePosts';
import { useCreateComment, useDeleteComment } from '@/src/hooks/useComments';
import type { Post } from '@/src/types';

function getTimeAgo(dateString: string): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
}

function getStatusColor(status: string): string {
  return status === 'published' 
    ? 'bg-[#DCFCE7] text-[#16A34A]' 
    : 'bg-[#F1F5F9] text-[#64748B]';
}

function getTypeColor(type: string): string {
  switch (type) {
    case 'question':
      return 'bg-[#DBEAFE] text-[#2563EB]';
    case 'summary':
      return 'bg-[#FEF3C7] text-[#D97706]';
    default:
      return 'bg-[#E0E7FF] text-[#2137D6]';
  }
}

export default function PostDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;
  
  const { data: post, isLoading, error, refetch: refetchPost } = usePost([parseInt(postId)]);
  const { mutate: updatePost } = useUpdatePost();
  const { mutate: deletePost, isLoading: isDeleting } = useDeletePost();
  const { mutate: createComment } = useCreateComment();
  const { mutate: deleteComment, isLoading: isDeletingComment } = useDeleteComment();
  
  // Get comments from post's children (nested comments)
  const comments = post?.attributes.children || [];
  
  const [reply, setReply] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', content: '', type: 'post' as 'post' | 'question' | 'summary' });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-[#2137D6]" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="text-center py-24 text-[#64748B]">
        Failed to load post. <button onClick={refetchPost} className="text-[#2137D6] hover:underline">Retry</button>
      </div>
    );
  }

  const user = post.attributes.user?.data.attributes;
  const userInitial = user?.first_name?.[0] || user?.full_name?.[0] || '?';
  const userName = user?.full_name || user?.first_name || 'Unknown';

  const handlePublish = async () => {
    if (!confirm('Are you sure you want to publish this post?')) return;
    try {
      await updatePost(parseInt(postId), { status: 'published' });
      await refetchPost();
      alert('Post published!');
    } catch {
      await refetchPost();
    }
  };

  const handleUnpublish = async () => {
    if (!confirm('Are you sure you want to unpublish this post?')) return;
    try {
      await updatePost(parseInt(postId), { status: 'draft' });
      await refetchPost();
      alert('Post unpublished!');
    } catch {
      await refetchPost();
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      await deletePost(parseInt(postId));
      router.push('/community');
      alert('Post deleted!');
    } catch {
      await refetchPost();
    }
  };

  const startEdit = () => {
    setIsEditing(true);
    setEditForm({
      title: post.attributes.title,
      content: post.attributes.content,
      type: post.attributes.type
    });
  };

  const handleUpdate = async () => {
    try {
      await updatePost(parseInt(postId), {
        title: editForm.title,
        content: editForm.content,
        type: editForm.type
      });
      await refetchPost();
      setIsEditing(false);
      alert('Post updated!');
    } catch {
      await refetchPost();
    }
  };

  const handlePostComment = async () => {
    if (!reply.trim()) return;
    try {
      await createComment(parseInt(postId), { parent_id: parseInt(postId), content: reply });
      setReply('');
      await refetchPost(); // Refresh post to get updated children
      alert('Comment posted!');
    } catch {
      await refetchPost();
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    try {
      await deleteComment(commentId);
      await refetchPost(); // Refresh post to get updated children
      alert('Comment deleted!');
    } catch {
      await refetchPost();
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            href="/community" 
            className="p-2 bg-white border border-[#E2E8F0] rounded-xl text-[#64748B] hover:text-[#1E293B] hover:bg-[#F8FAFC] transition-all shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#1E293B]">Post Details</h1>
            <p className="text-[13px] font-semibold text-[#64748B] mt-1">Community moderation view</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!isEditing && (
            <button 
              onClick={startEdit}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#475569] rounded-xl text-sm font-bold transition-all shadow-sm"
            >
              <Edit2 className="w-[18px] h-[18px]" />
              Edit
            </button>
          )}
          {post.attributes.status === 'draft' ? (
            <button 
              onClick={handlePublish}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#1E293B] rounded-xl text-sm font-bold transition-all shadow-sm"
            >
              <Check className="w-[18px] h-[18px]" />
              Publish
            </button>
          ) : (
            <button 
              onClick={handleUnpublish}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#64748B] rounded-xl text-sm font-bold transition-all shadow-sm"
            >
              <X className="w-[18px] h-[18px]" />
              Unpublish
            </button>
          )}
          <button 
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded-xl text-sm font-bold transition-all shadow-sm shadow-red-200 disabled:opacity-50"
          >
            <Trash className="w-[18px] h-[18px]" />
            Delete Post
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Main Content (Left) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Post Card */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm">
            <div className="flex items-start gap-5 flex-1">
              <div className="w-12 h-12 rounded-full bg-[#DBEAFE] text-[#2563EB] flex items-center justify-center font-bold text-lg shrink-0">
                {userInitial}
              </div>
              
              <div className="flex flex-col flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className="text-[16px] font-bold text-[#1E293B]">{userName}</span>
                  <span className="text-[13px] font-semibold text-[#94A3B8]">
                    {getTimeAgo(post.attributes.created_at || '')}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-[11px] font-bold tracking-wide ${getTypeColor(post.attributes.type)}`}>
                    {post.attributes.type}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-[11px] font-bold tracking-wide ${getStatusColor(post.attributes.status)}`}>
                    {post.attributes.status}
                  </span>
                  {post.attributes.tags.map(tag => (
                    <span key={tag} className="px-2 py-0.5 bg-[#F1F5F9] text-[#64748B] rounded text-[10px]">
                      #{tag}
                    </span>
                  ))}
                </div>
                
                {isEditing ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editForm.title}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      className="w-full px-4 py-2 border border-[#E2E8F0] rounded-lg text-[15px] font-medium text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2137D6]"
                      placeholder="Title"
                    />
                    <textarea
                      value={editForm.content}
                      onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-2 border border-[#E2E8F0] rounded-lg text-[15px] text-[#475569] focus:outline-none focus:ring-2 focus:ring-[#2137D6] resize-none"
                      placeholder="Content"
                    />
                    <select
                      value={editForm.type}
                      onChange={(e) => setEditForm({ ...editForm, type: e.target.value as 'post' | 'question' | 'summary' })}
                      className="px-4 py-2 border border-[#E2E8F0] rounded-lg text-sm text-[#475569] focus:outline-none focus:ring-2 focus:ring-[#2137D6]"
                    >
                      <option value="post">Post</option>
                      <option value="question">Question</option>
                      <option value="summary">Summary</option>
                    </select>
                    <div className="flex gap-3">
                      <button 
                        onClick={handleUpdate}
                        className="flex items-center gap-1.5 px-4 py-2 bg-[#16A34A] hover:bg-[#15803D] text-white rounded-xl text-sm font-bold transition-all"
                      >
                        <Check className="w-4 h-4" />
                        Save
                      </button>
                      <button 
                        onClick={() => setIsEditing(false)}
                        className="flex items-center gap-1.5 px-4 py-2 border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] rounded-xl text-sm font-bold transition-all"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className="text-[18px] font-bold text-[#1E293B] mb-2">{post.attributes.title}</h2>
                    <p className="text-[15px] leading-relaxed text-[#475569]">
                      {post.attributes.content}
                    </p>
                    <div className="flex items-center gap-6 mt-4">
                      <span className="flex items-center gap-1 text-[13px] text-[#64748B]">
                        {post.attributes.reactions_count} reactions
                      </span>
                      {post.attributes.user_reaction && (
                        <span className="text-[13px] text-[#2137D6]">
                          You: {post.attributes.user_reaction}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Comments Section */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-[#2137D6]" />
              <h2 className="text-lg font-bold text-[#1E293B]">
                Comments ({post?.attributes.comments_count || comments?.length || 0})
              </h2>
            </div>
            
            <div className="flex flex-col gap-4">
              {comments?.map((comment) => {
                const commentUser = comment.attributes.user?.data.attributes;
                const commentUserInitial = commentUser?.first_name?.[0] || commentUser?.full_name?.[0] || '?';
                const commentUserName = commentUser?.full_name || commentUser?.first_name || 'Unknown';
                const isInstructor = commentUser?.role === 'Admin' || commentUser?.role === 'Instructor';

                return (
                  <div key={comment.id} className={`rounded-2xl p-5 flex items-start gap-4 border ${isInstructor ? 'bg-[#F0F9FF] border-[#E0F2FE]' : 'bg-[#F8FAFC] border-[#F1F5F9]'}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${isInstructor ? 'bg-[#1E3A8A] text-white shadow-sm shadow-blue-200' : 'bg-[#E2E8F0] text-[#64748B]'}`}>
                      {commentUserInitial}
                    </div>
                    <div className="flex flex-col flex-1">
                      <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                        <span className="text-[14px] font-bold text-[#1E293B]">{commentUserName}</span>
                        {isInstructor && (
                          <span className="px-2 py-0.5 rounded-md bg-[#DBEAFE] text-[#1D4ED8] text-[10px] font-bold uppercase tracking-wide">
                            {commentUser?.role}
                          </span>
                        )}
                        <span className="text-[12px] font-semibold text-[#94A3B8]">
                          {getTimeAgo(comment.attributes.created_at || '')}
                        </span>
                      </div>
                      <p className="text-[14px] leading-relaxed text-[#475569]">
                        {comment.attributes.content}
                      </p>
                      <button
                        onClick={() => handleDeleteComment(parseInt(comment.id))}
                        disabled={isDeletingComment}
                        className="mt-2 text-[12px] text-[#EF4444] hover:text-[#DC2626] font-medium self-start disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}

              {(!comments || comments.length === 0) && (
                <div className="text-center py-8 text-[#64748B]">
                  No comments yet. Be the first to comment!
                </div>
              )}
            </div>

            {/* Admin Reply */}
            <div className="mt-2 flex flex-col gap-3">
              <textarea 
                rows={3} 
                placeholder="Reply as admin..." 
                className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all placeholder:text-[#94A3B8] resize-none"
                value={reply}
                onChange={(e) => setReply(e.target.value)}
              />
              <div className="flex justify-start">
                 <button 
                   onClick={handlePostComment}
                   disabled={!reply.trim()}
                   className="px-6 py-2.5 bg-[#2137D6] hover:bg-[#1a2bb3] text-white rounded-xl text-sm font-bold transition-all shadow-sm shadow-blue-200 disabled:opacity-50"
                 >
                   Post Reply as Admin
                 </button>
              </div>
            </div>
          </div>

        </div>

        {/* Sidebar (Right) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Moderation History */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <Flag className="w-5 h-5 text-[#EF4444]" />
              <h2 className="text-lg font-bold text-[#1E293B]">Moderation History</h2>
            </div>
            
            <div className="flex flex-col gap-3">
              <div className="bg-[#F8FAFC] border border-[#F1F5F9] rounded-xl p-4 flex flex-col gap-1.5">
                <span className="text-[14px] font-bold text-[#1E293B]">Flagged by student</span>
                <span className="text-[12px] font-medium text-[#64748B]">by Omar Tariq - 2 hours ago</span>
              </div>
              
              <div className="bg-[#F8FAFC] border border-[#F1F5F9] rounded-xl p-4 flex flex-col gap-1.5">
                <span className="text-[14px] font-bold text-[#1E293B]">Flagged by student</span>
                <span className="text-[12px] font-medium text-[#64748B]">by Sara Ibrahim - 1.5 hours ago</span>
              </div>
            </div>
          </div>
          
        </div>

      </div>
    </div>
  );
}

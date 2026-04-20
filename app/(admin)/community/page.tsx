'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { ChevronDown, MessageCircle, Send, Globe, Edit2, Trash2, MessageSquare, Pin, Check, Trash, Loader2, X, Eye, Plus } from 'lucide-react';
import { usePosts, useDeletePost, useUpdatePost, useCreatePost } from '@/src/hooks/usePosts';
import { useSocialLinks, useCreateSocialLink, useUpdateSocialLink, useDeleteSocialLink } from '@/src/hooks/useSocialLinks';
import { useCourses } from '@/src/hooks/useCourses';
import type { Post, SocialLink, CreatePostRequest } from '@/src/types';

function getTimeAgo(dateString: string, t: (key: string, params?: Record<string, string | number>) => string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return t('community.posts.timeAgo.justNow');
  if (diffMins < 60) return t('community.posts.timeAgo.minAgo', { minutes: diffMins });
  if (diffHours < 24) return t('community.posts.timeAgo.hourAgo', { hours: diffHours, plural: diffHours > 1 ? 's' : '' });
  if (diffDays < 7) return t('community.posts.timeAgo.dayAgo', { days: diffDays, plural: diffDays > 1 ? 's' : '' });
  return date.toLocaleDateString();
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'published':
      return 'bg-[#DCFCE7] text-[#16A34A]';
    case 'draft':
    default:
      return 'bg-[#F1F5F9] text-[#64748B]';
  }
}

function getTypeColor(type: string): string {
  switch (type) {
    case 'question':
      return 'bg-[#DBEAFE] text-[#2563EB]';
    case 'summary':
      return 'bg-[#FEF3C7] text-[#D97706]';
    case 'post':
    default:
      return 'bg-[#E0E7FF] text-[#2137D6]';
  }
}

export default function CommunityModerationPage() {
  const t = useTranslations();
  const { data: postsData, isLoading, error, refetch } = usePosts();
  const { mutate: deletePost, isLoading: isDeleting } = useDeletePost();
  const { mutate: updatePost } = useUpdatePost();
  const { mutate: createPost, isLoading: isCreating } = useCreatePost();
  
  // Social Links hooks
  const { data: socialLinks, isLoading: socialLinksLoading, refetch: refetchSocialLinks } = useSocialLinks();
  const { mutate: createSocialLink } = useCreateSocialLink();
  const { mutate: updateSocialLink } = useUpdateSocialLink();
  const { mutate: deleteSocialLink } = useDeleteSocialLink();
  const { data: courses, isLoading: coursesLoading } = useCourses();
  
  const [isSocialModalOpen, setIsSocialModalOpen] = useState(false);
  const [editingSocialLink, setEditingSocialLink] = useState<SocialLink | null>(null);
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('all');
  const [socialForm, setSocialForm] = useState({
    course_id: '',
    icon: null as File | null,
    iconPreview: '',
    link: '',
    title: '',
    subtitle: '',
    color: '',
    status: true as boolean
  });
  const [posts, setPosts] = useState<Post[]>([]);
  const [filter, setFilter] = useState('all');
  
  // Filter social links by course
  const filteredSocialLinks = selectedCourseFilter === 'all' 
    ? socialLinks 
    : socialLinks?.filter(link => String(link.attributes.course_id) === selectedCourseFilter);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editForm, setEditForm] = useState({ title: '', content: '', type: 'post' as 'post' | 'question' | 'summary' });
  
  // Create Post Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    content: '',
    type: 'post' as 'post' | 'question' | 'summary',
    status: 'published' as 'draft' | 'published',
    image: null as File | null
  });

  useEffect(() => {
    if (postsData) {
      setPosts(postsData);
    }
  }, [postsData]);

  const filteredPosts = filter === 'all'
    ? posts
    : posts.filter(p => p.attributes.status === filter);

  const handleDelete = async (postId: string) => {
    if (!confirm(t('community.confirmations.deletePost'))) return;

    try {
      setPosts(prev => prev.filter(p => p.id !== postId));
      await deletePost(parseInt(postId));
      await refetch();
      alert(t('community.notifications.postDeleted'));
    } catch {
      await refetch();
    }
  };

  const handlePublish = async (post: Post) => {
    if (!confirm(t('community.confirmations.publishPost', { title: post.attributes.title }))) return;

    try {
      await updatePost(parseInt(post.id), { status: 'published' });
      await refetch();
      alert(t('community.notifications.postPublished'));
    } catch {
      await refetch();
    }
  };

  const handleUnpublish = async (post: Post) => {
    if (!confirm(t('community.confirmations.unpublishPost', { title: post.attributes.title }))) return;

    try {
      await updatePost(parseInt(post.id), { status: 'draft' });
      await refetch();
      alert(t('community.notifications.postUnpublished'));
    } catch {
      await refetch();
    }
  };

  const handleCreatePost = async () => {
    if (!createForm.title.trim()) {
      alert(t('community.createPost.titleRequired'));
      return;
    }
    if (!createForm.content.trim()) {
      alert(t('community.createPost.contentRequired'));
      return;
    }

    try {
      await createPost({
        title: createForm.title,
        content: createForm.content,
        type: createForm.type,
        status: createForm.status,
        image: createForm.image || undefined
      });
      setIsCreateModalOpen(false);
      setCreateForm({
        title: '',
        content: '',
        type: 'post',
        status: 'published',
        image: null
      });
      await refetch();
      alert(t('community.notifications.postCreated'));
    } catch {
      alert(t('community.notifications.postCreateFailed'));
    }
  };

  // Social Link Handlers
  const openSocialModal = (link?: SocialLink) => {
    if (link) {
      setEditingSocialLink(link);
      setSocialForm({
        course_id: String(link.attributes.course_id),
        icon: null,
        iconPreview: link.attributes.icon || '',
        link: link.attributes.link,
        title: link.attributes.title,
        subtitle: link.attributes.subtitle,
        color: link.attributes.color,
        status: link.attributes.status
      });
    } else {
      setEditingSocialLink(null);
      setSocialForm({
        course_id: '',
        icon: null,
        iconPreview: '',
        link: '',
        title: '',
        subtitle: '',
        color: '',
        status: true
      });
    }
    setIsSocialModalOpen(true);
  };

  const closeSocialModal = () => {
    setIsSocialModalOpen(false);
    setEditingSocialLink(null);
    setSocialForm({
      course_id: '',
      icon: null,
      iconPreview: '',
      link: '',
      title: '',
      subtitle: '',
      color: '',
      status: true
    });
  };

  const handleSaveSocialLink = async () => {
    try {
      const data: Record<string, unknown> = {
        course_id: parseInt(socialForm.course_id),
        link: socialForm.link,
        title: socialForm.title,
        subtitle: socialForm.subtitle,
        color: socialForm.color,
        status: socialForm.status
      };

      // Only include icon if a new file was selected (for updates, null means "no change")
      if (socialForm.icon instanceof File) {
        data.icon = socialForm.icon;
      }

      if (editingSocialLink) {
        await updateSocialLink(parseInt(editingSocialLink.id), data);
        alert(t('community.notifications.socialLinkUpdated'));
      } else {
        await createSocialLink(data as { course_id: number; link: string; title: string; subtitle: string; color: string; status: boolean; icon?: File | null });
        alert(t('community.notifications.socialLinkCreated'));
      }
      await refetchSocialLinks();
      closeSocialModal();
    } catch {
      await refetchSocialLinks();
    }
  };

  const handleDeleteSocialLink = async (id: string) => {
    if (!confirm(t('community.confirmations.deleteSocialLink'))) return;
    try {
      await deleteSocialLink(parseInt(id));
      await refetchSocialLinks();
      alert(t('community.notifications.socialLinkDeleted'));
    } catch {
      await refetchSocialLinks();
    }
  };

  const startEdit = (post: Post) => {
    setEditingPost(post);
    setEditForm({
      title: post.attributes.title,
      content: post.attributes.content,
      type: post.attributes.type
    });
  };

  const cancelEdit = () => {
    setEditingPost(null);
    setEditForm({ title: '', content: '', type: 'post' as 'post' | 'question' | 'summary' });
  };

  const handleUpdate = async () => {
    if (!editingPost) return;

    try {
      await updatePost(parseInt(editingPost.id), {
        title: editForm.title,
        content: editForm.content,
        type: editForm.type
      });
      await refetch();
      setEditingPost(null);
      alert(t('community.notifications.postUpdated'));
    } catch {
      await refetch();
    }
  };
  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">{t('community.pageTitle')}</h1>
          <p className="text-sm text-[#64748B] mt-0.5">{t('community.pageDescription')}</p>
        </div>
        <div className="relative w-40">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="appearance-none w-full pl-4 pr-10 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm font-semibold text-[#475569] focus:outline-none cursor-pointer hover:border-[#CBD5E1] transition-colors shadow-sm"
          >
            <option value="all">{t('community.filters.all')}</option>
            <option value="draft">{t('community.filters.draft')}</option>
            <option value="published">{t('community.filters.published')}</option>
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] pointer-events-none" />
        </div>
      </div>

      {/* Community Links Header */}
      <div className="flex items-center justify-between mb-4 gap-4">
        <h2 className="text-lg font-bold text-[#1E293B]">{t('community.socialLinks.title')}</h2>
        <div className="flex items-center gap-3">
          <select
            value={selectedCourseFilter}
            onChange={(e) => setSelectedCourseFilter(e.target.value)}
            className="px-3 py-2 border border-[#E2E8F0] rounded-xl text-sm text-[#475569] focus:outline-none focus:ring-2 focus:ring-[#2137D6]"
            disabled={coursesLoading}
          >
            <option value="all">{t('community.socialLinks.allCourses')}</option>
            {courses?.map((course) => (
              <option key={course.id} value={course.id}>
                {course.attributes.title}
              </option>
            ))}
          </select>
          <button
            onClick={() => openSocialModal()}
            className="flex items-center gap-2 px-4 py-2 bg-[#2137D6] hover:bg-[#1a2bb3] text-white rounded-xl text-sm font-bold transition-all"
          >
            <Plus className="w-4 h-4" />
            {t('community.socialLinks.addLink')}
          </button>
        </div>
      </div>

      {/* Community Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {socialLinksLoading && (
          <div className="flex items-center justify-center py-8 col-span-3">
            <Loader2 className="w-6 h-6 animate-spin text-[#2137D6]" />
          </div>
        )}
        
        {!socialLinksLoading && filteredSocialLinks?.map((link) => (
          <div key={link.id} className="bg-white rounded-2xl border border-[#E2E8F0] p-6 flex flex-col shadow-sm">
            <div className="flex justify-between items-start mb-6">
              <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden" style={{ backgroundColor: link.attributes.icon ? 'transparent' : (link.attributes.color || '#E2E8F0') }}>
                {link.attributes.icon ? (
                  <img src={link.attributes.icon} alt={link.attributes.title} className="w-full h-full object-cover" />
                ) : (
                  <Globe className="w-5 h-5 text-white" />
                )}
              </div>
              <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold tracking-wide uppercase ${
                link.attributes.status
                  ? 'bg-[#DCFCE7] text-[#16A34A]'
                  : 'bg-[#F1F5F9] text-[#64748B]'
              }`}>
                {link.attributes.status ? t('community.socialLinks.status.active') : t('community.socialLinks.status.inactive')}
              </span>
            </div>
            
            <h3 className="text-[15px] font-bold text-[#475569] mb-1">{link.attributes.title}</h3>
            <p className="text-[13px] text-[#94A3B8] mb-4">{link.attributes.subtitle}</p>
            
            <div className="mt-auto pt-4 border-t border-[#F1F5F9] flex items-center gap-4">
              <button 
                onClick={() => openSocialModal(link)}
                className="text-[#94A3B8] hover:text-[#475569] transition-colors"
              >
                <Edit2 className="w-[18px] h-[18px]" />
              </button>
              <button 
                onClick={() => handleDeleteSocialLink(link.id)}
                className="text-[#94A3B8] hover:text-[#EF4444] transition-colors"
              >
                <Trash2 className="w-[18px] h-[18px]" />
              </button>
            </div>
          </div>
        ))}
        
        {!socialLinksLoading && (!filteredSocialLinks || filteredSocialLinks.length === 0) && (
          <div className="text-center py-8 text-[#64748B] col-span-3">
            {t('community.socialLinks.noLinks')}
          </div>
        )}
      </div>

      {/* Posts Header */}
      <div className="flex items-center justify-between mb-4 gap-4">
        <h2 className="text-lg font-bold text-[#1E293B]">{t('community.posts.title')}</h2>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#2137D6] hover:bg-[#1a2bb3] text-white rounded-xl text-sm font-bold transition-all"
        >
          <Plus className="w-4 h-4" />
          {t('community.posts.createPost')}
        </button>
      </div>

      {/* Posts List */}
      <div className="flex flex-col gap-5 mt-2">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#2137D6]" />
          </div>
        )}
        
        {!isLoading && filteredPosts.length === 0 && (
          <div className="text-center py-12 text-[#64748B]">
            {t('community.posts.noPosts')}
          </div>
        )}
        
        {filteredPosts.map((post) => {
          const user = post.attributes.user?.data.attributes;
          const userInitial = user?.first_name?.[0] || user?.full_name?.[0] || '?';
          const userName = user?.full_name || user?.first_name || t('community.posts.unknownUser');
          
          return (
            <div key={post.id} className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-10 h-10 rounded-full bg-[#F1F5F9] text-[#64748B] flex items-center justify-center font-bold text-[15px] shrink-0">
                    {userInitial}
                  </div>
                  
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-[15px] font-bold text-[#1E293B]">{userName}</span>
                      <span className="text-xs font-semibold text-[#94A3B8]">
                        {getTimeAgo(post.attributes.created_at || '', t)}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide ${getStatusColor(post.attributes.status)}`}>
                        {t(`community.posts.status.${post.attributes.status}`)}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide ${getTypeColor(post.attributes.type)}`}>
                        {t(`community.posts.type.${post.attributes.type}`)}
                      </span>
                      {post.attributes.tags.map(tag => (
                        <span key={tag} className="px-2 py-0.5 bg-[#F1F5F9] text-[#64748B] rounded text-[10px]">
                          #{tag}
                        </span>
                      ))}
                    </div>
                    
                    {editingPost?.id === post.id ? (
                      <div className="mt-3 space-y-3">
                        <input
                          type="text"
                          value={editForm.title}
                          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                          className="w-full px-4 py-2 border border-[#E2E8F0] rounded-lg text-[15px] font-medium text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2137D6]"
                          placeholder={t('community.posts.editForm.titlePlaceholder')}
                        />
                        <textarea
                          value={editForm.content}
                          onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                          rows={3}
                          className="w-full px-4 py-2 border border-[#E2E8F0] rounded-lg text-sm text-[#475569] focus:outline-none focus:ring-2 focus:ring-[#2137D6] resize-none"
                          placeholder={t('community.posts.editForm.contentPlaceholder')}
                        />
                        <select
                          value={editForm.type}
                          onChange={(e) => setEditForm({ ...editForm, type: e.target.value as 'post' | 'question' | 'summary' })}
                          className="px-4 py-2 border border-[#E2E8F0] rounded-lg text-sm text-[#475569] focus:outline-none focus:ring-2 focus:ring-[#2137D6]"
                        >
                          <option value="post">{t('community.posts.type.post')}</option>
                          <option value="question">{t('community.posts.type.question')}</option>
                          <option value="summary">{t('community.posts.type.summary')}</option>
                        </select>
                      </div>
                    ) : (
                      <>
                        <h3 className="block mt-3 text-[15px] font-medium text-[#1E293B]">
                          {post.attributes.title}
                        </h3>
                        <p className="mt-2 text-sm text-[#64748B]">{post.attributes.content}</p>
                      </>
                    )}

                    <div className="flex items-center gap-6 mt-5">
                      <Link
                        href={`/community/${post.id}`}
                        className="flex items-center gap-2 text-[#64748B] hover:text-[#1E293B] transition-colors"
                      >
                        <MessageSquare className="w-[18px] h-[18px]" />
                        <span className="text-[13px] font-semibold">{post.attributes.comments_count || 0} {t('community.posts.comments')}</span>
                      </Link>
                      <span className="flex items-center gap-1 text-[13px] text-[#64748B]">
                        {post.attributes.reactions_count} {t('community.posts.reactions')}
                      </span>
                      {post.attributes.user_reaction && (
                        <span className="text-[13px] text-[#2137D6]">
                          {t('community.posts.you')}{post.attributes.user_reaction}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 ml-6 pt-1">
                  {editingPost?.id === post.id ? (
                    <>
                      <button
                        onClick={handleUpdate}
                        className="flex items-center gap-1.5 px-4 py-2 bg-[#16A34A] hover:bg-[#15803D] text-white rounded-xl text-sm font-bold transition-all"
                      >
                        <Check className="w-4 h-4" />
                        {t('community.posts.editForm.save')}
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="flex items-center gap-1.5 px-4 py-2 border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] rounded-xl text-sm font-bold transition-all"
                      >
                        <X className="w-4 h-4" />
                        {t('community.posts.editForm.cancel')}
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href={`/community/${post.id}`}
                        className="flex items-center gap-1.5 px-4 py-2 border border-[#E2E8F0] text-[#2137D6] hover:bg-[#EEF2FF] rounded-xl text-sm font-bold transition-all"
                      >
                        <Eye className="w-4 h-4" />
                        {t('community.posts.actions.view')}
                      </Link>
                      <button
                        onClick={() => startEdit(post)}
                        className="flex items-center gap-1.5 px-4 py-2 border border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC] rounded-xl text-sm font-bold transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                        {t('community.posts.actions.edit')}
                      </button>
                      {post.attributes.status === 'draft' ? (
                        <button
                          onClick={() => handlePublish(post)}
                          className="flex items-center gap-1.5 px-4 py-2 border border-[#E2E8F0] text-[#1E293B] hover:bg-[#F8FAFC] rounded-xl text-sm font-bold transition-all"
                        >
                          <Check className="w-4 h-4" />
                          {t('community.posts.actions.publish')}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUnpublish(post)}
                          className="flex items-center gap-1.5 px-4 py-2 border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] rounded-xl text-sm font-bold transition-all"
                        >
                          <X className="w-4 h-4" />
                          {t('community.posts.actions.unpublish')}
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(post.id)}
                        disabled={isDeleting}
                        className="flex items-center gap-1.5 px-4 py-2 bg-[#E11D48] hover:bg-[#BE123C] text-white rounded-xl text-sm font-bold transition-all shadow-sm shadow-rose-200 disabled:opacity-50"
                      >
                        <Trash className="w-4 h-4" />
                        {t('community.posts.actions.delete')}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Social Link Modal */}
      {isSocialModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[#1E293B]">
                {editingSocialLink ? t('community.socialLinks.modal.edit') : t('community.socialLinks.modal.add')}
              </h2>
              <button onClick={closeSocialModal} className="text-[#94A3B8] hover:text-[#475569]">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-semibold text-[#475569] mb-1">{t('community.socialLinks.modal.course')}</label>
                <select
                  value={socialForm.course_id}
                  onChange={(e) => setSocialForm({ ...socialForm, course_id: e.target.value })}
                  className="w-full px-4 py-2 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6]"
                  disabled={coursesLoading}
                >
                  <option value="">{t('community.socialLinks.modal.selectCourse')}</option>
                  {courses?.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.attributes.title}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-[#475569] mb-1">{t('community.socialLinks.modal.icon')}</label>
                <div className="flex items-center gap-3">
                  {socialForm.iconPreview && (
                    <img src={socialForm.iconPreview} alt="Preview" className="w-10 h-10 rounded-full object-cover" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setSocialForm({ 
                            ...socialForm, 
                            icon: file, 
                            iconPreview: reader.result as string 
                          });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="text-sm text-[#475569] file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-[#EEF2FF] file:text-[#2137D6] hover:file:bg-[#DBEAFE]"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-[#475569] mb-1">{t('community.socialLinks.modal.linkUrl')}</label>
                <input
                  type="url"
                  value={socialForm.link}
                  onChange={(e) => setSocialForm({ ...socialForm, link: e.target.value })}
                  className="w-full px-4 py-2 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6]"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#475569] mb-1">{t('community.socialLinks.modal.title')}</label>
                <input
                  type="text"
                  value={socialForm.title}
                  onChange={(e) => setSocialForm({ ...socialForm, title: e.target.value })}
                  className="w-full px-4 py-2 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6]"
                  placeholder={t('community.socialLinks.modal.linkTitlePlaceholder')}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#475569] mb-1">{t('community.socialLinks.modal.subtitle')}</label>
                <input
                  type="text"
                  value={socialForm.subtitle}
                  onChange={(e) => setSocialForm({ ...socialForm, subtitle: e.target.value })}
                  className="w-full px-4 py-2 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6]"
                  placeholder={t('community.socialLinks.modal.linkSubtitlePlaceholder')}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#475569] mb-1">{t('community.socialLinks.modal.color')}</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={socialForm.color || '#16A34A'}
                    onChange={(e) => setSocialForm({ ...socialForm, color: e.target.value })}
                    className="w-12 h-10 p-1 border border-[#E2E8F0] rounded-xl cursor-pointer"
                  />
                  <input
                    type="text"
                    value={socialForm.color}
                    onChange={(e) => setSocialForm({ ...socialForm, color: e.target.value })}
                    className="flex-1 px-4 py-2 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6]"
                    placeholder={t('community.socialLinks.modal.color')}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-[#475569] mb-1">{t('community.socialLinks.modal.status')}</label>
                <select
                  value={socialForm.status ? 'true' : 'false'}
                  onChange={(e) => setSocialForm({ ...socialForm, status: e.target.value === 'true' })}
                  className="w-full px-4 py-2 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6]"
                >
                  <option value="true">{t('community.socialLinks.status.active')}</option>
                  <option value="false">{t('community.socialLinks.status.inactive')}</option>
                </select>
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleSaveSocialLink}
                  className="flex-1 px-4 py-2 bg-[#2137D6] hover:bg-[#1a2bb3] text-white rounded-xl text-sm font-bold transition-all"
                >
                  {editingSocialLink ? t('community.socialLinks.modal.update') : t('community.socialLinks.modal.create')}
                </button>
                <button
                  onClick={closeSocialModal}
                  className="flex-1 px-4 py-2 border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] rounded-xl text-sm font-bold transition-all"
                >
                  {t('community.socialLinks.modal.cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Post Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-[#E2E8F0]">
              <h3 className="text-lg font-bold text-[#1E293B]">
                {t('community.createPost.title')}
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 hover:bg-[#F8FAFC] rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-[#64748B]" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#475569] mb-1">
                  {t('community.createPost.titleLabel')}
                </label>
                <input
                  type="text"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  className="w-full px-4 py-2 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6]"
                  placeholder={t('community.createPost.titlePlaceholder')}
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-[#475569] mb-1">
                  {t('community.createPost.contentLabel')}
                </label>
                <textarea
                  value={createForm.content}
                  onChange={(e) => setCreateForm({ ...createForm, content: e.target.value })}
                  rows={5}
                  className="w-full px-4 py-2 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] resize-none"
                  placeholder={t('community.createPost.contentPlaceholder')}
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-[#475569] mb-1">
                  {t('community.createPost.typeLabel')}
                </label>
                <select
                  value={createForm.type}
                  onChange={(e) => setCreateForm({ ...createForm, type: e.target.value as 'post' | 'question' | 'summary' })}
                  className="w-full px-4 py-2 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6]"
                >
                  <option value="post">{t('community.postTypes.post')}</option>
                  <option value="question">{t('community.postTypes.question')}</option>
                  <option value="summary">{t('community.postTypes.summary')}</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-[#475569] mb-1">
                  {t('community.createPost.statusLabel')}
                </label>
                <select
                  value={createForm.status}
                  onChange={(e) => setCreateForm({ ...createForm, status: e.target.value as 'draft' | 'published' })}
                  className="w-full px-4 py-2 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6]"
                >
                  <option value="draft">{t('community.statuses.draft')}</option>
                  <option value="published">{t('community.statuses.published')}</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-[#475569] mb-1">
                  {t('community.createPost.imageLabel')}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCreateForm({ ...createForm, image: e.target.files?.[0] || null })}
                  className="w-full text-sm text-[#475569] file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-[#EEF2FF] file:text-[#2137D6] hover:file:bg-[#DBEAFE]"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleCreatePost}
                  disabled={isCreating}
                  className="flex-1 px-4 py-2 bg-[#2137D6] hover:bg-[#1a2bb3] text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isCreating && <Loader2 className="w-4 h-4 animate-spin" />}
                  {t('community.createPost.submit')}
                </button>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] rounded-xl text-sm font-bold transition-all"
                >
                  {t('community.createPost.cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

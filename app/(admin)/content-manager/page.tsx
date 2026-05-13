"use client";



import React, { useState, useEffect, useRef } from 'react';

import { useTranslations } from 'next-intl';

import {

  FileEdit, Plus, ChevronRight, ChevronDown, Video, Play, Settings, Trash2,

  FileText, Link as LinkIcon, Save, Eye, Building2, BookOpen, Loader2, X,

  Power, Upload, CheckCircle, Copy, Search

} from 'lucide-react';

import Link from 'next/link';

import { api } from '@/src/lib/api';

import { useCourses } from '@/src/hooks/useCourses';

import { useCodes, useActivateCode, useUploadPreActivation } from '@/src/hooks';

import { useStudents } from '@/src/hooks/useStudents';

import { useCreateChapter, useUpdateChapter, useCopyChapter } from '@/src/hooks/useChapters';

import type { Course, Lecture, Chapter } from '@/src/types';

import { toast } from 'react-hot-toast';



export default function ContentManagerPage() {

  const t = useTranslations();

  const { data: coursesData, isLoading: coursesLoading, refetch: refetchCourses } = useCourses();

  const [courses, setCourses] = useState<Course[]>([]);



  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set());

  const [expandedLectures, setExpandedLectures] = useState<Set<string>>(new Set());



  const [lecturesByCourse, setLecturesByCourse] = useState<Record<string, Lecture[]>>({});

  const [chaptersByLecture, setChaptersByLecture] = useState<Record<string, Chapter[]>>({});



  const [loadingLectures, setLoadingLectures] = useState<Set<string>>(new Set());

  const [loadingChapters, setLoadingChapters] = useState<Set<string>>(new Set());



  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);

  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);

  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);



  // Modals state

  const [isAddLectureModalOpen, setIsAddLectureModalOpen] = useState(false);

  const [isAddChapterModalOpen, setIsAddChapterModalOpen] = useState(false);

  const [isCopyChapterModalOpen, setIsCopyChapterModalOpen] = useState(false);

  const [chapterToCopy, setChapterToCopy] = useState<Chapter | null>(null);

  const [addLectureData, setAddLectureData] = useState({ title: '', description: '' });

  const [addChapterData, setAddChapterData] = useState({

    title: '',

    duration: '',

    is_free_preview: 0 as 0 | 1,

    image: null as File | null,

    video: null as File | null,

    attachments: [] as File[]

  });



  const [pendingAttachments, setPendingAttachments] = useState<File[]>([]);

  const [removedAttachments, setRemovedAttachments] = useState<string[]>([]);

  const [pendingThumbnail, setPendingThumbnail] = useState<File | null>(null);

  const [removeThumbnail, setRemoveThumbnail] = useState(false);

  const [pendingVideo, setPendingVideo] = useState<File | null>(null);

  const [isUpdating, setIsUpdating] = useState(false);

  const { mutate: createChapter, isLoading: isCreatingChapter, progress: createChapterProgress } = useCreateChapter();

  const { mutate: updateChapter, isLoading: isUpdatingChapter, progress: updateChapterProgress } = useUpdateChapter();

  const { mutate: copyChapter, isLoading: isCopyingChapter } = useCopyChapter();



  // Chapter Activation State

  const [chapterActivationTab, setChapterActivationTab] = useState<'code' | 'preactivation'>('code');

  const [selectedChapterCode, setSelectedChapterCode] = useState('');

  const [selectedChapterStudent, setSelectedChapterStudent] = useState('');

  const [chapterStudentSearch, setChapterStudentSearch] = useState('');

  const [chapterPreactivationNumbers, setChapterPreactivationNumbers] = useState<string[]>([]);

  const [chapterPreactivationResults, setChapterPreactivationResults] = useState<{ success: number; failed: number; count: number } | null>(null);

  const [copiedChapterCode, setCopiedChapterCode] = useState<string | null>(null);

  const chapterFileInputRef = useRef<HTMLInputElement>(null);



  const { data: codes, refetch: refetchCodes } = useCodes();

  const { mutate: activateCode, isLoading: isActivatingChapter } = useActivateCode();

  const { mutate: uploadPreActivation, isLoading: isUploadingChapterPreActivation } = useUploadPreActivation();

  const { data: students } = useStudents();



  const attachmentInputRef = React.useRef<HTMLInputElement>(null);

  const videoInputRef = React.useRef<HTMLInputElement>(null);

  const modalAttachmentInputRef = React.useRef<HTMLInputElement>(null);

  const modalThumbnailInputRef = React.useRef<HTMLInputElement>(null);

  const modalVideoInputRef = React.useRef<HTMLInputElement>(null);



  useEffect(() => {

    if (coursesData) {

      setCourses(coursesData);

      // Extract nested lectures and chapters from course data

      const lecturesData: Record<string, Lecture[]> = {};

      const chaptersData: Record<string, Chapter[]> = {};

      

      coursesData.forEach(course => {

        // Extract lectures from nested data

        const nestedLectures = course.attributes.lectures || [];

        if (nestedLectures.length > 0) {

          lecturesData[course.id] = nestedLectures;

          

          // Extract chapters from nested lecture data

          nestedLectures.forEach((lecture) => {

            const chapterKey = `${course.id}-${lecture.id}`;

            const nestedChapters = lecture.attributes?.chapters || [];

            if (nestedChapters.length > 0) {

              chaptersData[chapterKey] = nestedChapters;

            }

          });

        }

      });

      

      if (Object.keys(lecturesData).length > 0) {

        setLecturesByCourse(lecturesData);

      }

      if (Object.keys(chaptersData).length > 0) {

        setChaptersByLecture(chaptersData);

      }

    }

  }, [coursesData]);



  // Clear pending file states when selected chapter changes

  useEffect(() => {

    setPendingThumbnail(null);

    setPendingVideo(null);

    setPendingAttachments([]);

    setRemovedAttachments([]);

    setRemoveThumbnail(false);

  }, [selectedChapter?.id]);



  const toggleCourse = (course: Course) => {

    const courseId = course.id;

    const newExpanded = new Set(expandedCourses);

    if (newExpanded.has(courseId)) {

      newExpanded.delete(courseId);

    } else {

      newExpanded.add(courseId);

      // Extract lectures from nested data if not already loaded

      if (!lecturesByCourse[courseId]) {

        const nestedLectures = course.attributes.lectures || [];

        if (nestedLectures.length > 0) {

          setLecturesByCourse(prev => ({ ...prev, [courseId]: nestedLectures }));

          // Also extract chapters

          nestedLectures.forEach((lecture) => {

            const chapterKey = `${courseId}-${lecture.id}`;

            const nestedChapters = lecture.attributes?.chapters || [];

            if (nestedChapters.length > 0 && !chaptersByLecture[chapterKey]) {

              setChaptersByLecture(prev => ({ ...prev, [chapterKey]: nestedChapters }));

            }

          });

        }

      }

    }

    setExpandedCourses(new Set(newExpanded));

    setSelectedCourse(course);

  };



  const toggleLecture = (courseId: string, lecture: Lecture) => {

    const lectureId = lecture.id;

    const compositeKey = `${courseId}-${lectureId}`;

    const chapterKey = `${courseId}-${lectureId}`;

    const newExpanded = new Set(expandedLectures);

    if (newExpanded.has(compositeKey)) {

      newExpanded.delete(compositeKey);

    } else {

      newExpanded.add(compositeKey);

      // Extract chapters from nested lecture data if not already loaded

      if (!chaptersByLecture[chapterKey]) {

        const nestedChapters = lecture.attributes?.chapters || [];

        if (nestedChapters.length > 0) {

          setChaptersByLecture(prev => ({ ...prev, [chapterKey]: nestedChapters }));

        }

      }

    }

    setExpandedLectures(new Set(newExpanded));

    setSelectedLecture(lecture);

  };



  const selectChapter = (chapter: Chapter) => {

    setSelectedChapter(chapter);

    // Clear any pending removals when switching chapters

    setRemovedAttachments([]);

  };



  const handleCreateLecture = async () => {

    if (!selectedCourse) return;

    if (!addLectureData.title.trim()) {

      toast.error(t('contentManager.messages.titleRequired'));

      return;

    }

    try {

      await api.lectures.create({

        course_id: Number(selectedCourse.id),

        title: addLectureData.title,

        description: addLectureData.description,

      });

      toast.success(t('contentManager.messages.lectureCreated'));

      setIsAddLectureModalOpen(false);

      setAddLectureData({ title: '', description: '' });

      // Refresh courses to get updated nested data

      await refetchCourses();

    } catch (error) {

      toast.error(t('contentManager.messages.lectureCreateFailed'));

    }

  };



  const handleCreateChapter = async () => {

    if (!selectedLecture || !selectedCourse) return;

    try {

      await createChapter({

        lecture_id: Number(selectedLecture.id),

        title: addChapterData.title,

        duration: addChapterData.duration,

        thumbnail: addChapterData.image || undefined,

        video: addChapterData.video || undefined,

        is_free_preview: addChapterData.is_free_preview,

        attachments: addChapterData.attachments,

      });

      toast.success(t('contentManager.messages.chapterCreated'));

      setIsAddChapterModalOpen(false);

      setAddChapterData({

        title: '',

        duration: '',

        is_free_preview: 0,

        image: null,

        video: null,

        attachments: []

      });

      // Refresh courses to get updated nested data

      await refetchCourses();

    } catch (error) {

      toast.error(t('contentManager.messages.chapterCreateFailed'));

    }

  };



  const handleUpdateChapter = async () => {

    if (!selectedChapter || !selectedCourse) return;

    setIsUpdating(true);

    try {

      await updateChapter(Number(selectedChapter.id), {

        lecture_id: Number(selectedChapter.attributes.lecture_id),

        title: selectedChapter.attributes.title,

        duration: selectedChapter.attributes.duration,

        is_free_preview: selectedChapter.attributes.is_free_preview ? 1 : 0,

        max_views: selectedChapter.attributes.max_views,

        thumbnail: removeThumbnail ? null : (pendingThumbnail || undefined),

        video: pendingVideo || undefined,

        attachments: pendingAttachments.length > 0 ? pendingAttachments : undefined,

        removed_attachments: removedAttachments.length > 0 ? removedAttachments : undefined,

      });

      toast.success(t('contentManager.messages.chapterUpdated'));

      // Clear pending files after successful update

      setPendingThumbnail(null);

      setPendingVideo(null);

      setPendingAttachments([]);

      setRemovedAttachments([]);

      setRemoveThumbnail(false);

      // Refresh courses to get updated nested data

      await refetchCourses();

    } catch (error) {

      // Error is handled by the hook

    } finally {

      setIsUpdating(false);

    }

  };



  const handleDeleteChapter = async (chapterId: string) => {

    if (!confirm(t('contentManager.messages.deleteChapterConfirm'))) return;

    try {

      await api.chapters.delete(Number(chapterId));

      toast.success(t('contentManager.messages.chapterDeleted'));

      if (selectedChapter?.id === chapterId) setSelectedChapter(null);

      // Refresh courses to get updated nested data

      await refetchCourses();

    } catch (error) {

      toast.error(t('contentManager.messages.chapterDeleteFailed'));

    }

  };



  const handleCopyChapterClick = (chapter: Chapter) => {

    setChapterToCopy(chapter);

    setIsCopyChapterModalOpen(true);

  };



  const handleConfirmCopyChapter = async () => {

    if (!chapterToCopy) return;

    try {

      await copyChapter(Number(chapterToCopy.id), Number(chapterToCopy.attributes.lecture_id));

      toast.success(t('contentManager.messages.chapterCopied'));

      setIsCopyChapterModalOpen(false);

      setChapterToCopy(null);

      // Refresh courses to get updated nested data

      await refetchCourses();

    } catch (error) {

      toast.error(t('contentManager.messages.chapterCopyFailed'));

    }

  };



  const handleDeleteLecture = async (lectureId: string) => {

    if (!confirm(t('contentManager.messages.deleteLectureConfirm'))) return;

    try {

      await api.lectures.delete(Number(lectureId));

      toast.success(t('contentManager.messages.lectureDeleted'));

      if (selectedLecture?.id === lectureId) {

        setSelectedLecture(null);

        setSelectedChapter(null);

      }

      // Refresh courses to get updated nested data

      await refetchCourses();

    } catch (error) {

      toast.error(t('contentManager.messages.lectureDeleteFailed'));

    }

  };



  const handleToggleFreePreview = () => {

    if (!selectedChapter) return;

    setSelectedChapter({

      ...selectedChapter,

      attributes: {

        ...selectedChapter.attributes,

        is_free_preview: selectedChapter.attributes.is_free_preview ? 0 : 1

      }

    });

  };



  // Chapter Activation Handlers

  const handleCopyChapterCode = (code: string) => {

    navigator.clipboard.writeText(code);

    setCopiedChapterCode(code);

    setTimeout(() => setCopiedChapterCode(null), 2000);

    toast.success('Code copied to clipboard');

  };



  const handleActivateChapter = async () => {

    if (!selectedChapterCode || !selectedChapterStudent || !selectedChapter) return;



    try {

      await activateCode({

        code: selectedChapterCode,

        item_id: Number(selectedChapter.id),

        item_type: 'chapter',

        user_id: String(selectedChapterStudent),

      });

      toast.success('Chapter activated successfully!');

      setSelectedChapterCode('');

      setSelectedChapterStudent('');

      setChapterStudentSearch('');

      refetchCodes();

    } catch {

      // Error handled by hook

    }

  };



  const handleChapterPreactivationFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {

    const file = e.target.files?.[0];

    if (!file) {

      setChapterPreactivationNumbers([]);

      return;

    }



    const reader = new FileReader();

    reader.onload = (event) => {

      const text = event.target?.result as string;

      const numbers = text

        .split(/[\n,\r,;]/)

        .map((n) => n.trim())

        .filter((n) => n.length > 0);

      setChapterPreactivationNumbers(numbers);

      setChapterPreactivationResults(null);

      toast.success(`${numbers.length} phone numbers ready for upload`);

    };

    reader.readAsText(file);

  };



  const clearChapterPreactivationNumbers = () => {

    setChapterPreactivationNumbers([]);

    setChapterPreactivationResults(null);

    if (chapterFileInputRef.current) {

      chapterFileInputRef.current.value = '';

    }

  };



  const handleChapterPreactivationUpload = async () => {

    if (!selectedChapter) {

      toast.error('Please select a chapter first');

      return;

    }

    const file = chapterFileInputRef.current?.files?.[0];

    if (!file) {

      toast.error('Please select a file first');

      return;

    }



    try {

      const result = await uploadPreActivation({ item_id: Number(selectedChapter.id), item_type: 'chapter', file });

      setChapterPreactivationResults({

        success: result.data.count || 0,

        failed: chapterPreactivationNumbers.length - (result.data.count || 0),

        count: result.data.count || 0

      });

      toast.success(result.data.message || `Processed ${result.data.count} pre-activations`);

      refetchCodes();

      if (chapterFileInputRef.current) {

        chapterFileInputRef.current.value = '';

      }

      setChapterPreactivationNumbers([]);

    } catch {

      toast.error('Failed to upload pre-activation file');

    }

  };



  // Filter codes for this chapter

  const chapterCodes = codes?.filter(

    (code) =>

      code.attributes.codeable_type === 'App\\Models\\Chapter' &&

      code.attributes.codeable_id === Number(selectedChapter?.id) &&

      !code.attributes.is_used

  ) || [];



  const filteredChapterStudents = students?.data?.filter((student: any) => {

    const fullName = `${student.attributes.first_name} ${student.attributes.last_name}`.toLowerCase();

    const email = student.attributes.email?.toLowerCase() || '';

    const search = chapterStudentSearch.toLowerCase();

    return fullName.includes(search) || email.includes(search);

  }) || [];



  if (coursesLoading) {

    return (

      <div className="flex h-[400px] items-center justify-center">

        <Loader2 className="w-8 h-8 animate-spin text-[#4F46E5]" />

      </div>

    );

  }



  return (

    <div className="flex flex-col gap-6">

      <div className="flex items-center justify-between">

        <div>

          <h1 className="text-2xl font-bold text-[#1E293B]">{t('contentManager.pageTitle')}</h1>

          <p className="text-sm text-[#64748B] mt-1">{t('contentManager.pageDescription')}</p>

        </div>

      </div>



      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8">

        {/* Left Panel: Course Structure */}

        <div className="bg-white rounded-3xl border border-[#F1F5F9] shadow-sm p-6 flex flex-col gap-6 self-start sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto">

          <div className="flex items-center justify-between">

            <h2 className="text-[17px] font-bold text-[#1E293B]">{t('contentManager.courseStructure')}</h2>

          </div>



          <div className="flex flex-col gap-1">

            {courses.map((course) => (

              <div key={course.id} className="flex flex-col gap-1">

                <div

                  onClick={() => toggleCourse(course)}

                  className={`flex items-center gap-2 p-2 rounded-xl cursor-pointer transition-colors ${expandedCourses.has(course.id) ? 'bg-[#EEF2FF] text-[#4F46E5]' : 'hover:bg-[#F8FAFC] text-[#64748B]'}`}

                >

                  {expandedCourses.has(course.id) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}

                  <BookOpen className="w-4 h-4" />

                  <span className="text-[13px] font-bold truncate">{course.attributes.title}</span>

                </div>



                {expandedCourses.has(course.id) && (

                  <div className="pl-4 flex flex-col gap-1 mt-1">

                    {loadingLectures.has(course.id) ? (

                      <div className="p-2 text-xs text-[#94A3B8] italic flex items-center gap-2">

                        <Loader2 className="w-3 h-3 animate-spin" /> {t('contentManager.loadingLectures')}

                      </div>

                    ) : (

                      <>

                        {lecturesByCourse[course.id]?.map((lecture) => (

                          <div key={lecture.id} className="flex flex-col gap-1">

                            <div

                              onClick={() => toggleLecture(course.id, lecture)}

                              className={`flex flex-col p-2 rounded-xl cursor-pointer transition-colors group ${expandedLectures.has(`${course.id}-${lecture.id}`) ? 'bg-[#F0FDF4] text-[#10B981]' : 'hover:bg-[#F8FAFC] text-[#64748B]'}`}

                            >

                              <div className="flex items-center justify-between">

                                <div className="flex items-center gap-2 truncate">

                                  {expandedLectures.has(`${course.id}-${lecture.id}`) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}

                                  <span className="text-[13px] font-bold truncate">{lecture.attributes.title}</span>

                                </div>

                                <button

                                  onClick={(e) => {

                                    e.stopPropagation();

                                    handleDeleteLecture(lecture.id);

                                  }}

                                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-all"

                                >

                                  <Trash2 className="w-3.5 h-3.5" />

                                </button>

                              </div>

                              {lecture.attributes.description && (

                                <p className="text-[11px] text-[#94A3B8] mt-0.5 pl-6 line-clamp-2">

                                  {lecture.attributes.description}

                                </p>

                              )}

                            </div>



                            {expandedLectures.has(`${course.id}-${lecture.id}`) && (

                              <div className="pl-6 flex flex-col gap-1">

                                {loadingChapters.has(`${course.id}-${lecture.id}`) ? (

                                  <div className="p-2 text-xs text-[#94A3B8] italic flex items-center gap-2">

                                    <Loader2 className="w-3 h-3 animate-spin" /> {t('contentManager.loadingChapters')}

                                  </div>

                                ) : (

                                  <>

                                    {chaptersByLecture[`${course.id}-${lecture.id}`]?.map((chapter) => (

                                      <div

                                        key={chapter.id}

                                        onClick={() => selectChapter(chapter)}

                                        className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all group ${selectedChapter?.id === chapter.id ? 'bg-[#2137D6] text-white shadow-md shadow-indigo-100' : 'hover:bg-[#F8FAFC] text-[#64748B]'}`}

                                      >

                                        <div className="flex items-center gap-2 overflow-hidden mr-2">

                                          <Video className={`w-4 h-4 flex-shrink-0 ${selectedChapter?.id === chapter.id ? 'text-white' : 'text-[#94A3B8]'}`} />

                                          <span className={`text-[13px] truncate ${selectedChapter?.id === chapter.id ? 'font-bold' : 'font-medium'}`}>

                                            {chapter.attributes.title}

                                          </span>

                                        </div>

                                        <div className="flex items-center gap-1.5 flex-shrink-0">

                                          {chapter.attributes.is_locked && (

                                            <span className="px-1.5 py-0.5 bg-[#FEF3C7] text-[#D97706] text-[9px] font-bold rounded">{t('contentManager.locked')}</span>

                                          )}

                                          <button

                                            onClick={(e) => {

                                              e.stopPropagation();

                                              handleCopyChapterClick(chapter);

                                            }}

                                            className={`p-1 rounded hover:bg-black/10 transition-colors ${selectedChapter?.id === chapter.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 text-[#94A3B8]'}`}

                                            title={t('contentManager.copyChapter')}

                                          >

                                            <Copy className="w-3.5 h-3.5" />

                                          </button>

                                          <button

                                            onClick={(e) => {

                                              e.stopPropagation();

                                              handleDeleteChapter(chapter.id);

                                            }}

                                            className={`p-1 rounded hover:bg-black/10 transition-colors ${selectedChapter?.id === chapter.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 text-[#94A3B8]'}`}

                                          >

                                            <Trash2 className="w-3.5 h-3.5" />

                                          </button>

                                        </div>

                                      </div>

                                    ))}

                                    <button

                                      onClick={() => {

                                        setSelectedLecture(lecture);

                                        setIsAddChapterModalOpen(true);

                                      }}

                                      className="flex items-center gap-2 p-2 text-[#4F46E5] hover:bg-indigo-50 rounded-xl transition-all mt-1"

                                    >

                                      <Plus className="w-4 h-4" />

                                      <span className="text-[12px] font-bold">{t('contentManager.addChapter')}</span>

                                    </button>

                                  </>

                                )}

                              </div>

                            )}

                          </div>

                        ))}

                        <button

                          onClick={() => {

                            setSelectedCourse(course);

                            setIsAddLectureModalOpen(true);

                          }}

                          className="flex items-center gap-2 p-2 text-[#4F46E5] hover:bg-indigo-50 rounded-xl transition-all mt-1"

                        >

                          <Plus className="w-4 h-4" />

                          <span className="text-[12px] font-bold">{t('contentManager.addLecture')}</span>

                        </button>

                      </>

                    )}

                  </div>

                )}

              </div>

            ))}

          </div>

        </div>



        {/* Right Panel: Chapter Details */}

        <div className="flex flex-col gap-8">

          {selectedChapter ? (

            <>

              {/* Action Header */}

              <div className="flex flex-col md:flex-row md:items-center justify-between bg-white p-6 rounded-3xl border border-[#F1F5F9] shadow-sm gap-4">

                <div className="flex flex-col gap-1">

                  <div className="flex items-center gap-3">

                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded border uppercase tracking-tighter ${!selectedChapter.attributes.is_locked ? 'bg-[#EBFDF5] text-[#10B981] border-emerald-100' : 'bg-[#FFF7ED] text-[#F97316] border-orange-100'

                      }`}>

                      {selectedChapter.attributes.is_locked ? t('contentManager.locked') : t('contentManager.published')}

                    </span>

                    <span className="text-[11px] font-bold text-[#94A3B8]">{selectedChapter.attributes.duration}</span>

                  </div>

                  <h2 className="text-xl font-bold text-[#1E293B]">{selectedChapter.attributes.title}</h2>

                  <p className="text-[12px] text-[#64748B]">{t('contentManager.lectureId')}: {selectedChapter.attributes.lecture_id}</p>

                </div>

                <button

                  onClick={handleUpdateChapter}

                  disabled={isUpdating || isUpdatingChapter}

                  className={`px-6 py-2.5 bg-[#2137D6] hover:bg-[#1a2bb3] text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-indigo-100 flex items-center gap-2 ${(isUpdating || isUpdatingChapter) ? 'opacity-70 cursor-not-allowed' : ''}`}

                >

                  {(isUpdating || isUpdatingChapter) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}

                  {(isUpdating || isUpdatingChapter) ? t('contentManager.saving') : t('contentManager.saveChanges')}

                </button>

              </div>



              {/* Upload Progress */}

              {(isUpdating || isUpdatingChapter) && updateChapterProgress > 0 && (

                <div className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm p-6">

                  <div className="flex items-center justify-between mb-3">

                    <span className="text-sm font-bold text-[#1E293B]">{t('contentManager.uploading')}</span>

                    <span className="text-sm font-bold text-[#2137D6]">{updateChapterProgress}%</span>

                  </div>

                  <div className="w-full bg-[#F1F5F9] rounded-full h-2.5 overflow-hidden">

                    <div

                      className="bg-[#2137D6] h-2.5 rounded-full transition-all duration-300"

                      style={{ width: `${updateChapterProgress}%` }}

                    />

                  </div>

                </div>

              )}



              {/* Video Content - Uses first attachment */}

              <div className="bg-white rounded-3xl border border-[#F1F5F9] shadow-sm p-8 flex flex-col gap-6">

                <div className="flex items-center justify-between">

                  <div className="flex items-center gap-2">

                    <Video className="w-5 h-5 text-[#4F46E5]" />

                    <h3 className="text-[15px] font-bold text-[#1E293B]">{t('contentManager.videoContent')}</h3>

                  </div>

                  <button

                    onClick={() => modalVideoInputRef.current?.click()}

                    className="px-4 py-1.5 bg-[#4F46E5] text-white rounded-xl text-[12px] font-bold hover:bg-[#3730a3] transition-all flex items-center gap-1.5"

                  >

                    <Plus className="w-3.5 h-3.5" />

                    {pendingVideo ? t('contentManager.changeVideo') : t('contentManager.addVideo')}

                  </button>

                  <input

                    type="file"

                    ref={modalVideoInputRef}

                    className="hidden"

                    accept="video/*"

                    onChange={(e) => setPendingVideo(e.target.files?.[0] || null)}

                  />

                </div>

                <div className="relative aspect-video bg-[#0F172A] rounded-2xl overflow-hidden group flex items-center justify-center">

                  {pendingVideo ? (

                    <div className="relative w-full h-full">

                      <video 

                        src={URL.createObjectURL(pendingVideo)} 

                        className="w-full h-full object-cover" 

                        controls 

                      />

                      <button

                        onClick={() => setPendingVideo(null)}

                        className="absolute top-4 right-4 p-2 bg-[#EF4444] text-white rounded-lg hover:bg-red-600 transition-all"

                      >

                        <Trash2 className="w-4 h-4" />

                      </button>

                    </div>

                  ) : selectedChapter.attributes.video ? (

                    // Use video field if available

                    <video 

                      src={selectedChapter.attributes.video} 

                      className="w-full h-full object-cover" 

                      controls

                      poster={selectedChapter.attributes.thumbnail || undefined}

                    />

                  ) : selectedChapter.attributes.attachments && selectedChapter.attributes.attachments.length > 0 ? (

                    // Fall back to first attachment

                    (() => {

                      const firstAttachment = selectedChapter.attributes.attachments[0];

                      const filePath = firstAttachment.attributes?.path || '';



                      return (

                        <video

                          src={filePath}

                          className="w-full h-full object-cover"

                          controls

                          poster={selectedChapter.attributes.thumbnail || undefined}

                          onError={(e) => {

                            // If video fails to load, show download option

                            const target = e.target as HTMLVideoElement;

                            target.style.display = 'none';

                            const parent = target.parentElement;

                            if (parent) {

                              parent.innerHTML = `

                                <div class="w-full h-full bg-[#1E293B] flex flex-col items-center justify-center gap-3">

                                  <svg class="w-16 h-16 text-[#4F46E5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">

                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>

                                    <polyline points="14 2 14 8 20 8"></polyline>

                                  </svg>

                                  <p class="text-[#64748B] text-sm">${firstAttachment.attributes?.name || 'Attachment'}</p>

                                  <a href="${filePath}" target="_blank" rel="noopener noreferrer"

                                     class="px-4 py-2 bg-[#4F46E5] text-white rounded-lg text-sm font-bold hover:bg-[#3730a3] transition-all">

                                    ${t('contentManager.openFile')}

                                  </a>

                                </div>

                              `;

                            }

                          }}

                        />

                      );

                    })()

                  ) : (

                    <div className="w-full h-full bg-[#F8FAFC] flex flex-col items-center justify-center gap-3">

                      <Video className="w-16 h-16 text-[#94A3B8]" />

                      <p className="text-[#64748B] text-sm">{t('contentManager.noVideo')}</p>

                      <p className="text-[#94A3B8] text-xs">{t('contentManager.addVideoHint')}</p>

                      <button

                        onClick={() => modalVideoInputRef.current?.click()}

                        className="mt-2 px-4 py-2 bg-[#4F46E5] text-white rounded-xl text-[12px] font-bold hover:bg-[#3730a3] transition-all flex items-center gap-1.5"

                      >

                        <Plus className="w-3.5 h-3.5" />

                        {t('contentManager.addVideo')}

                      </button>

                    </div>

                  )}

                </div>

              </div>



              {/* Thumbnail */}

              <div className="bg-white rounded-3xl border border-[#F1F5F9] shadow-sm p-8 flex flex-col gap-6">

                <div className="flex items-center justify-between">

                  <div className="flex items-center gap-2">

                    <FileText className="w-5 h-5 text-[#4F46E5]" />

                    <h3 className="text-[15px] font-bold text-[#1E293B]">{t('contentManager.thumbnail')}</h3>

                  </div>

                  <button

                    onClick={() => modalThumbnailInputRef.current?.click()}

                    className="px-4 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[12px] font-bold text-[#64748B] hover:text-[#4F46E5] transition-all"

                  >

                    {pendingThumbnail ? t('contentManager.change') : (selectedChapter.attributes.thumbnail && !removeThumbnail) ? t('contentManager.replace') : t('contentManager.add')}

                  </button>

                  <input

                    type="file"

                    ref={modalThumbnailInputRef}

                    className="hidden"

                    accept="image/*"

                    onChange={(e) => {

                      const file = e.target.files?.[0] || null;

                      setPendingThumbnail(file);

                      if (file) setRemoveThumbnail(false);

                    }}

                  />

                </div>

                <div className="relative aspect-video bg-[#F8FAFC] rounded-2xl overflow-hidden border border-[#F1F5F9] flex items-center justify-center">

                  {pendingThumbnail ? (

                    <img 

                      src={URL.createObjectURL(pendingThumbnail)} 

                      alt="Thumbnail Preview" 

                      className="w-full h-full object-cover" 

                    />

                  ) : (selectedChapter.attributes.thumbnail && !removeThumbnail) ? (

                    <img 

                      src={selectedChapter.attributes.thumbnail} 

                      alt={selectedChapter.attributes.title} 

                      className="w-full h-full object-cover" 

                    />

                  ) : (

                    <div className="flex flex-col items-center justify-center gap-2">

                      <FileText className="w-12 h-12 text-[#94A3B8]" />

                      <p className="text-[#94A3B8] text-sm">{t('contentManager.noThumbnail')}</p>

                    </div>

                  )}

                </div>

                {(selectedChapter.attributes.thumbnail || pendingThumbnail) && !removeThumbnail && (

                  <button 

                    onClick={() => {

                      setPendingThumbnail(null);

                      setRemoveThumbnail(true);

                    }}

                    className="self-start px-4 py-2 bg-[#EF4444]/10 text-[#EF4444] rounded-xl text-[12px] font-bold hover:bg-[#EF4444]/20 transition-all flex items-center gap-2"

                  >

                    <Trash2 className="w-4 h-4" />

                    {t('contentManager.removeThumbnail')}

                  </button>

                )}

                {removeThumbnail && (

                  <button 

                    onClick={() => {

                      setRemoveThumbnail(false);

                    }}

                    className="self-start px-4 py-2 bg-[#4F46E5]/10 text-[#4F46E5] rounded-xl text-[12px] font-bold hover:bg-[#4F46E5]/20 transition-all flex items-center gap-2"

                  >

                    <Settings className="w-4 h-4" />

                    {t('contentManager.undoRemove')}

                  </button>

                )}

              </div>



              {/* Chapter Settings */}

              <div className="bg-white rounded-3xl border border-[#F1F5F9] shadow-sm p-8 flex flex-col gap-8">

                <div className="flex items-center gap-2">

                  <Settings className="w-5 h-5 text-[#4F46E5]" />

                  <h3 className="text-[15px] font-bold text-[#1E293B]">{t('contentManager.chapterSettings')}</h3>

                </div>



                <div className="grid grid-cols-1 gap-8">

                  <div className="flex items-center justify-between group">

                    <div className="flex flex-col gap-0.5">

                      <p className="text-[13px] font-bold text-[#1E293B]">{t('contentManager.freePreview')}</p>

                      <p className="text-[12px] text-[#94A3B8]">{t('contentManager.freePreviewDescription')}</p>

                    </div>

                    <div

                      onClick={handleToggleFreePreview}

                      className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${selectedChapter.attributes.is_free_preview ? 'bg-[#2137D6]' : 'bg-[#E2E8F0]'}`}

                    >

                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${selectedChapter.attributes.is_free_preview ? 'right-1' : 'left-1'}`}></div>

                    </div>

                  </div>



                  <div className="flex items-center justify-between group">

                    <div className="flex flex-col gap-0.5">

                      <p className="text-[13px] font-bold text-[#1E293B]">{t('contentManager.maxViews')}</p>

                      <p className="text-[12px] text-[#94A3B8]">{t('contentManager.maxViewsDescription')}</p>

                    </div>

                    <input

                      type="number"

                      min="0"

                      value={selectedChapter.attributes.max_views}

                      onChange={(e) => setSelectedChapter({

                        ...selectedChapter,

                        attributes: {

                          ...selectedChapter.attributes,

                          max_views: parseInt(e.target.value) || 0

                        }

                      })}

                      className="w-20 h-10 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-center font-bold text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] transition-all"

                    />

                  </div>

                </div>

              </div>



              {/* Attachments */}

              <div className="bg-white rounded-3xl border border-[#F1F5F9] shadow-sm p-8 flex flex-col gap-6">

                <div className="flex items-center justify-between">

                  <div className="flex items-center gap-2">

                    <FileText className="w-5 h-5 text-[#4F46E5]" />

                    <h3 className="text-[15px] font-bold text-[#1E293B]">{t('contentManager.attachments')}</h3>

                  </div>

                  <button

                    onClick={() => attachmentInputRef.current?.click()}

                    className="px-4 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[12px] font-bold text-[#64748B] hover:text-[#4F46E5] transition-all flex items-center gap-1.5"

                  >

                    <Plus className="w-3.5 h-3.5" />

                    {t('contentManager.add')}

                  </button>

                  <input

                    type="file"

                    ref={attachmentInputRef}

                    className="hidden"

                    multiple

                    onChange={(e) => {

                      const files = Array.from(e.target.files || []);

                      setPendingAttachments(prev => [...prev, ...files]);

                    }}

                  />

                </div>



                <div className="flex flex-col gap-3">

                  {/* Existing Attachments */}

                  {selectedChapter.attributes.attachments?.filter(att => !removedAttachments.includes(att.id)).map((attachment) => (

                    <div key={attachment.id} className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-2xl border border-[#F1F5F9]">

                      <div className="flex items-center gap-3">

                        <FileText className="w-4 h-4 text-[#4F46E5]" />

                        <div className="flex flex-col">

                          <span className="text-[13px] font-medium text-[#1E293B]">{attachment.attributes.name || attachment.attributes.path?.split('/').pop() || 'Untitled'}</span>

                          <button

                            onClick={() => window.open(attachment.attributes.path, '_blank', 'noopener,noreferrer')}

                            className="text-[11px] text-left text-[#64748B] hover:text-[#4F46E5] transition-colors cursor-pointer"

                          >

                            {t('contentManager.openFile')}

                          </button>

                        </div>

                      </div>

                      <button

                        onClick={() => setRemovedAttachments(prev => [...prev, attachment.id])}

                        className="p-1 text-[#94A3B8] hover:text-red-500 transition-colors"

                      >

                        <Trash2 className="w-4 h-4" />

                      </button>

                    </div>

                  ))}



                  {/* Pending New Attachments */}

                  {pendingAttachments.map((file, idx) => (

                    <div key={`pending-${idx}`} className="flex items-center justify-between p-3 bg-[#EEF2FF] rounded-2xl border border-[#4F46E5]/20">

                      <div className="flex items-center gap-3">

                        <FileText className="w-4 h-4 text-[#4F46E5]" />

                        <span className="text-[13px] font-medium text-[#1E293B]">{file.name}</span>

                        <span className="text-[11px] text-[#64748B] bg-[#4F46E5]/10 px-2 py-0.5 rounded-full">{t('contentManager.new')}</span>

                      </div>

                      <button

                        onClick={() => setPendingAttachments(prev => prev.filter((_, i) => i !== idx))}

                        className="p-1 text-[#94A3B8] hover:text-red-500 transition-colors"

                      >

                        <Trash2 className="w-4 h-4" />

                      </button>

                    </div>

                  ))}



                  {/* Empty State */}

                  {(!selectedChapter.attributes.attachments || selectedChapter.attributes.attachments.filter(att => !removedAttachments.includes(att.id)).length === 0) && pendingAttachments.length === 0 && (

                    <p className="text-sm text-[#94A3B8] italic">{t('contentManager.noAttachments')}</p>

                  )}

                </div>

              </div>



              {/* Chapter Activation Section */}

              <section className="bg-white rounded-3xl border border-[#F1F5F9] p-6 shadow-sm">

                <div className="flex items-center justify-between mb-4">

                  <div className="flex items-center gap-2">

                    <Power className="w-4 h-4 text-[#2137D6]" />

                    <h2 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider">{t('contentManager.chapterActivation')}</h2>

                  </div>

                  <Link

                    href={`/activation/generate?chapter_id=${selectedChapter.id}`}

                    className="p-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#64748B] hover:text-[#2137D6] hover:border-[#2137D6] transition-all"

                    title={t('courses.view.generateCodes')}

                  >

                    <Plus className="w-4 h-4" />

                  </Link>

                </div>



                {/* Tabs */}

                <div className="flex items-center gap-1 mb-4 bg-[#F8FAFC] rounded-lg p-1">

                  <button

                    onClick={() => setChapterActivationTab('code')}

                    className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition-all ${

                      chapterActivationTab === 'code'

                        ? 'bg-white text-[#2137D6] shadow-sm'

                        : 'text-[#64748B] hover:text-[#1E293B]'

                    }`}

                  >

                    {t('courses.view.activationTabs.byCode')}

                  </button>

                  <button

                    onClick={() => setChapterActivationTab('preactivation')}

                    className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition-all ${

                      chapterActivationTab === 'preactivation'

                        ? 'bg-white text-[#2137D6] shadow-sm'

                        : 'text-[#64748B] hover:text-[#1E293B]'

                    }`}

                  >

                    {t('courses.view.activationTabs.preactivation')}

                  </button>

                </div>



                {chapterActivationTab === 'code' ? (

                  <div className="flex flex-col gap-4">

                    {/* Available Codes */}

                    <div>

                      <label className="text-xs font-bold text-[#64748B] mb-2 block">{t('courses.view.availableCodes')} ({chapterCodes.length})</label>

                      {chapterCodes.length > 0 ? (

                        <div className="max-h-32 overflow-y-auto bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2">

                          <div className="flex flex-wrap gap-2">

                            {chapterCodes.map((code) => (

                              <button

                                key={code.id}

                                onClick={() => setSelectedChapterCode(code.attributes.code)}

                                className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${

                                  selectedChapterCode === code.attributes.code

                                    ? 'bg-[#2137D6] text-white'

                                    : 'bg-white border border-[#E2E8F0] text-[#475569] hover:border-[#2137D6]'

                                }`}

                              >

                                {code.attributes.code}

                              </button>

                            ))}

                          </div>

                        </div>

                      ) : (

                        <p className="text-xs text-[#94A3B8]">{t('activation.messages.noCodesAvailable')}</p>

                      )}

                    </div>



                    {/* Student Selection */}

                    <div>

                      <label className="text-xs font-bold text-[#64748B] mb-2 block">{t('courses.view.selectStudent')}</label>

                      <div className="relative">

                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />

                        <input

                          type="text"

                          placeholder={t('courses.view.searchStudents')}

                          value={chapterStudentSearch}

                          onChange={(e) => setChapterStudentSearch(e.target.value)}

                          className="w-full pl-9 pr-4 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10"

                        />

                      </div>

                      {chapterStudentSearch && (

                        <div className="mt-2 max-h-32 overflow-y-auto border border-[#E2E8F0] rounded-xl p-2 flex flex-col gap-1">

                          {filteredChapterStudents.length > 0 ? (

                            filteredChapterStudents.map((student: any) => (

                              <label

                                key={student.id}

                                className={`flex flex-col p-2 rounded-lg cursor-pointer transition-colors ${

                                  selectedChapterStudent === String(student.id) ? 'bg-[#EEF2FF]' : 'hover:bg-[#F8FAFC]'

                                }`}

                              >

                                <div className="flex items-center gap-2">

                                  <input

                                    type="radio"

                                    name="chapter-student"

                                    value={student.id}

                                    checked={selectedChapterStudent === String(student.id)}

                                    onChange={(e) => {

                                      setSelectedChapterStudent(e.target.value);

                                      setChapterStudentSearch(`${student.attributes.first_name} ${student.attributes.last_name}`);

                                    }}

                                    className="w-4 h-4 text-[#2137D6]"

                                  />

                                  <span className="text-xs font-medium text-[#1E293B]">

                                    {student.attributes.first_name} {student.attributes.last_name}

                                  </span>

                                </div>

                                <span className="text-[10px] text-[#94A3B8] pl-6">{student.attributes.email}</span>

                              </label>

                            ))

                          ) : (

                            <p className="text-xs text-[#94A3B8] italic">{t('courses.view.noStudentsFound')}</p>

                          )}

                        </div>

                      )}

                    </div>



                    {/* Activate Button */}

                    <button

                      onClick={handleActivateChapter}

                      disabled={!selectedChapterCode || !selectedChapterStudent || isActivatingChapter}

                      className="w-full py-2.5 bg-[#2137D6] hover:bg-[#1a2bb3] text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"

                    >

                      {isActivatingChapter ? (

                        <>

                          <Loader2 className="w-4 h-4 animate-spin" />

                          {t('courses.view.activating')}

                        </>

                      ) : (

                        <>

                          <Power className="w-4 h-4" />

                          {t('courses.view.activate')}

                        </>

                      )}

                    </button>

                  </div>

                ) : (

                  <div className="flex flex-col gap-4">

                    <div className="p-3 bg-[#EEF2FF] rounded-xl border border-[#2137D6]/20">

                      <p className="text-xs text-[#2137D6]">

                        <span className="font-bold">{t('courses.view.preactivation.title')}:</span> {t('courses.view.preactivation.description')}

                      </p>

                    </div>



                    {/* File Upload */}

                    <div>

                      <label className="text-xs font-bold text-[#64748B] mb-2 block">{t('courses.view.preactivation.title')}</label>

                      <p className="text-[10px] text-[#94A3B8] mb-2">Supported: .txt, .csv (one phone per line)</p>

                      <input

                        ref={chapterFileInputRef}

                        type="file"

                        accept=".txt,.csv"

                        onChange={handleChapterPreactivationFileSelect}

                        className="hidden"

                      />

                      <button

                        onClick={() => chapterFileInputRef.current?.click()}

                        className="w-full py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-[#EEF2FF] hover:border-[#2137D6] text-[#475569] rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2"

                      >

                        <Upload className="w-4 h-4" />

                        {t('students.import.selectFile')}

                      </button>

                    </div>

                    {/* Phone Numbers Preview */}

                    {chapterPreactivationNumbers.length > 0 && (

                      <div>

                        <div className="flex items-center justify-between mb-2">

                          <label className="text-xs font-bold text-[#64748B]">{t('courses.view.preactivation.title')} ({chapterPreactivationNumbers.length})</label>

                          <button

                            onClick={clearChapterPreactivationNumbers}

                            className="text-[10px] text-red-500 hover:text-red-600 flex items-center gap-1"

                          >

                            <X className="w-3 h-3" />

                            {t('courses.view.preactivation.clear')}

                          </button>

                        </div>

                        <div className="max-h-32 overflow-y-auto bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3">

                          <div className="flex flex-wrap gap-2">

                            {chapterPreactivationNumbers.map((num, idx) => (

                              <span

                                key={idx}

                                className="px-2 py-1 bg-white border border-[#E2E8F0] rounded-lg text-xs text-[#475569]"

                              >

                                {num}

                              </span>

                            ))}

                          </div>

                        </div>

                      </div>

                    )}



                    {/* Pre-activate Button */}

                    <button

                      onClick={handleChapterPreactivationUpload}

                      disabled={chapterPreactivationNumbers.length === 0 || isUploadingChapterPreActivation}

                      className="w-full py-2.5 bg-[#10B981] hover:bg-[#059669] text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"

                    >

                      {isUploadingChapterPreActivation ? (

                        <>

                          <Loader2 className="w-4 h-4 animate-spin" />

                          {t('students.import.uploading')}

                        </>

                      ) : (

                        <>

                          <Upload className="w-4 h-4" />

                          {t('courses.view.preactivation.upload')} {chapterPreactivationNumbers.length > 0 && `(${chapterPreactivationNumbers.length})`}

                        </>

                      )}

                    </button>



                    {/* Pre-activation Results */}

                    {chapterPreactivationResults && (

                      <div className="mt-2 p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">

                        <p className="text-xs font-bold text-[#1E293B] mb-2">{t('courses.view.preactivation.title')}:</p>

                        <div className="flex items-center gap-4">

                          <span className="text-xs text-green-600 flex items-center gap-1">

                            <CheckCircle className="w-3.5 h-3.5" />

                            {t('students.import.success')}: {chapterPreactivationResults.success}

                          </span>

                          {chapterPreactivationResults.failed > 0 && (

                            <span className="text-xs text-red-600 flex items-center gap-1">

                              <X className="w-3.5 h-3.5" />

                              {t('students.import.failed')}: {chapterPreactivationResults.failed}

                            </span>

                          )}

                        </div>

                      </div>

                    )}

                  </div>

                )}

              </section>

            </>

          ) : (

            <div className="bg-white rounded-3xl border border-[#F1F5F9] shadow-sm p-12 flex flex-col items-center justify-center text-center gap-4">

              <div className="w-16 h-16 bg-[#F8FAFC] rounded-2xl flex items-center justify-center">

                <Video className="w-8 h-8 text-[#94A3B8]" />

              </div>

              <div>

                <h3 className="text-lg font-bold text-[#1E293B]">{t('contentManager.selectChapter')}</h3>

                <p className="text-sm text-[#64748B] max-w-[280px]">{t('contentManager.selectChapterHint')}</p>

              </div>

            </div>

          )}

        </div>

      </div>



      {/* Add Lecture Modal */}

      {isAddLectureModalOpen && (

        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">

          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8 flex flex-col gap-6">

            <div className="flex items-center justify-between">

              <h3 className="text-xl font-bold text-[#1E293B]">{t('contentManager.modal.addLecture')}</h3>

              <button onClick={() => setIsAddLectureModalOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>

            </div>

            <div className="flex flex-col gap-4">

              <div className="flex flex-col gap-1.5">

                <label className="text-[13px] font-bold text-[#64748B]">{t('contentManager.modal.title')}</label>

                <input

                  type="text"

                  value={addLectureData.title}

                  onChange={(e) => setAddLectureData({ ...addLectureData, title: e.target.value })}

                  required

                  className="px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] transition-all"

                  placeholder={t('contentManager.modal.title')}

                />

              </div>

              <div className="flex flex-col gap-1.5">

                <label className="text-[13px] font-bold text-[#64748B]">{t('contentManager.modal.description')}</label>

                <textarea

                  value={addLectureData.description}

                  onChange={(e) => setAddLectureData({ ...addLectureData, description: e.target.value })}

                  className="px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] transition-all resize-none h-24"

                  placeholder={t('contentManager.modal.description')}

                />

              </div>

            </div>

            <div className="flex gap-3">

              <button

                onClick={() => setIsAddLectureModalOpen(false)}

                className="flex-1 px-6 py-3 bg-white border border-[#E2E8F0] rounded-2xl text-sm font-bold text-[#64748B] hover:bg-gray-50 transition-all"

              >

                {t('contentManager.modal.cancel')}

              </button>

              <button

                onClick={handleCreateLecture}

                disabled={!addLectureData.title.trim()}

                className="flex-1 px-6 py-3 bg-[#2137D6] hover:bg-[#1a2bb3] text-white rounded-2xl text-sm font-bold transition-all shadow-md shadow-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed"

              >

                {t('contentManager.modal.createLecture')}

              </button>

            </div>

          </div>

        </div>

      )}



      {/* Add Chapter Modal */}

      {isAddChapterModalOpen && (

        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">

          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8 flex flex-col gap-6">

            <div className="flex items-center justify-between">

              <h3 className="text-xl font-bold text-[#1E293B]">{t('contentManager.modal.addChapter')}</h3>

              <button onClick={() => setIsAddChapterModalOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>

            </div>

            <div className="flex flex-col gap-4">

              <div className="flex flex-col gap-1.5">

                <label className="text-[13px] font-bold text-[#64748B]">{t('contentManager.modal.title')}</label>

                <input

                  type="text"

                  value={addChapterData.title}

                  onChange={(e) => setAddChapterData({ ...addChapterData, title: e.target.value })}

                  disabled={isCreatingChapter}

                  className="px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] transition-all disabled:opacity-50 disabled:cursor-not-allowed"

                  placeholder={t('contentManager.modal.title')}

                />

              </div>

              <div className="flex flex-col gap-1.5">

                <label className="text-[13px] font-bold text-[#64748B]">{t('contentManager.modal.duration')}</label>

                <input

                  type="text"

                  value={addChapterData.duration}

                  onChange={(e) => setAddChapterData({ ...addChapterData, duration: e.target.value })}

                  disabled={isCreatingChapter}

                  className="px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] transition-all disabled:opacity-50 disabled:cursor-not-allowed"

                  placeholder="00:00"

                />

              </div>

              <div className="flex flex-col gap-1.5">

                <label className="text-[13px] font-bold text-[#64748B]">{t('contentManager.modal.thumbnailImage')}</label>

                <button

                  onClick={() => modalThumbnailInputRef.current?.click()}

                  disabled={isCreatingChapter}

                  className="px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-left text-sm text-[#94A3B8] hover:bg-gray-50 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"

                >

                  {addChapterData.image ? addChapterData.image.name : t('contentManager.modal.selectImage')}

                </button>

                <input

                  type="file"

                  ref={modalThumbnailInputRef}

                  className="hidden"

                  accept="image/*"

                  onChange={(e) => setAddChapterData({ ...addChapterData, image: e.target.files?.[0] || null })}

                />

              </div>

              <div className="flex flex-col gap-1.5">

                <label className="text-[13px] font-bold text-[#64748B]">{t('contentManager.modal.videoFile')}</label>

                <button

                  onClick={() => modalVideoInputRef.current?.click()}

                  disabled={isCreatingChapter}

                  className="px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-left text-sm text-[#94A3B8] hover:bg-gray-50 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"

                >

                  {addChapterData.video ? addChapterData.video.name : t('contentManager.modal.selectVideo')}

                </button>

                <input

                  type="file"

                  ref={modalVideoInputRef}

                  className="hidden"

                  accept="video/*"

                  onChange={(e) => setAddChapterData({ ...addChapterData, video: e.target.files?.[0] || null })}

                />

              </div>

              <div className="flex flex-col gap-1.5">

                <label className="text-[13px] font-bold text-[#64748B]">{t('contentManager.modal.otherAttachments')}</label>

                <button

                  onClick={() => modalAttachmentInputRef.current?.click()}

                  disabled={isCreatingChapter}

                  className="px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-left text-sm text-[#94A3B8] hover:bg-gray-50 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"

                >

                  {addChapterData.attachments.length > 0 ? t('contentManager.modal.filesSelected', { count: addChapterData.attachments.length }) : t('contentManager.modal.selectFiles')}

                </button>

                <input

                  type="file"

                  ref={modalAttachmentInputRef}

                  className="hidden"

                  multiple

                  onChange={(e) => setAddChapterData({ ...addChapterData, attachments: Array.from(e.target.files || []) })}

                />

              </div>

              <div className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0]">

                <span className={`text-[13px] font-bold ${isCreatingChapter ? 'text-[#94A3B8]' : 'text-[#1E293B]'}`}>{t('contentManager.freePreview')}</span>

                <div

                  onClick={() => !isCreatingChapter && setAddChapterData({ ...addChapterData, is_free_preview: addChapterData.is_free_preview ? 0 : 1 })}

                  className={`w-12 h-6 rounded-full relative transition-colors ${addChapterData.is_free_preview ? 'bg-[#2137D6]' : 'bg-[#E2E8F0]'} ${isCreatingChapter ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}

                >

                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${addChapterData.is_free_preview ? 'right-1' : 'left-1'}`}></div>

                </div>

              </div>



              {/* Upload Progress */}

              {isCreatingChapter && createChapterProgress > 0 && (

                <div className="p-4 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0]">

                  <div className="flex items-center justify-between mb-2">

                    <span className="text-[13px] font-bold text-[#1E293B]">{t('contentManager.modal.uploading')}</span>

                    <span className="text-[13px] font-bold text-[#2137D6]">{createChapterProgress}%</span>

                  </div>

                  <div className="w-full bg-[#E2E8F0] rounded-full h-2 overflow-hidden">

                    <div

                      className="bg-[#2137D6] h-2 rounded-full transition-all duration-300"

                      style={{ width: `${createChapterProgress}%` }}

                    />

                  </div>

                </div>

              )}

            </div>

            <div className="flex gap-3">

              <button

                onClick={() => setIsAddChapterModalOpen(false)}

                className="flex-1 px-6 py-3 bg-white border border-[#E2E8F0] rounded-2xl text-sm font-bold text-[#64748B] hover:bg-gray-50 transition-all"

              >

                {t('contentManager.modal.cancel')}

              </button>

              <button

                onClick={handleCreateChapter}

                disabled={isCreatingChapter}

                className="flex-1 px-6 py-3 bg-[#2137D6] hover:bg-[#1a2bb3] text-white rounded-2xl text-sm font-bold transition-all shadow-md shadow-indigo-100 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"

              >

                {isCreatingChapter ? (

                  <>

                    <Loader2 className="w-4 h-4 animate-spin" />

                    {t('contentManager.modal.creating')}

                  </>

                ) : (

                  t('contentManager.modal.createChapter')

                )}

              </button>

            </div>

          </div>

        </div>

      )}



      {/* Copy Chapter Confirmation Modal */}

      {isCopyChapterModalOpen && chapterToCopy && (

        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">

          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8 flex flex-col gap-6">

            <div className="flex items-center gap-4">

              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">

                <Copy className="w-6 h-6 text-[#2137D6]" />

              </div>

              <div>

                <h3 className="text-xl font-bold text-[#1E293B]">{t('contentManager.copyChapter')}</h3>

                <p className="text-sm text-[#64748B]">{t('contentManager.copyChapterConfirm') || 'Are you sure you want to copy this chapter?'}</p>

              </div>

            </div>



            <div className="bg-[#F8FAFC] rounded-xl p-4">

              <p className="text-sm font-medium text-[#1E293B]">{chapterToCopy.attributes.title}</p>

              <p className="text-xs text-[#64748B] mt-1">{t('contentManager.lectureId')}: {chapterToCopy.attributes.lecture_id}</p>

            </div>



            <div className="flex gap-3">

              <button

                onClick={() => {

                  setIsCopyChapterModalOpen(false);

                  setChapterToCopy(null);

                }}

                className="flex-1 px-6 py-3 bg-white border border-[#E2E8F0] rounded-2xl text-sm font-bold text-[#64748B] hover:bg-gray-50 transition-all"

              >

                {t('contentManager.modal.cancel')}

              </button>

              <button

                onClick={handleConfirmCopyChapter}

                disabled={isCopyingChapter}

                className="flex-1 px-6 py-3 bg-[#2137D6] hover:bg-[#1a2bb3] text-white rounded-2xl text-sm font-bold transition-all shadow-md shadow-indigo-100 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"

              >

                {isCopyingChapter ? (

                  <>

                    <Loader2 className="w-4 h-4 animate-spin" />

                    {t('contentManager.copying') || 'Copying...'}

                  </>

                ) : (

                  t('contentManager.copyChapter')

                )}

              </button>

            </div>

          </div>

        </div>

      )}

    </div>

  );

}


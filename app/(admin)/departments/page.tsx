'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useDepartments, useDeleteDepartment, useCreateDepartment, useUpdateDepartment } from '@/src/hooks/useDepartments';
import { useCourses, useDeleteCourse, useCreateCourse, useUpdateCourse } from '@/src/hooks/useCourses';
import { useCreateLecture, useUpdateLecture } from '@/src/hooks/useLectures';
import { useCreateChapter, useUpdateChapter, useCopyChapter } from '@/src/hooks/useChapters';
import { api } from '@/src/lib/api';
import {
  GraduationCap, ChevronRight, ChevronDown, GitBranch, Edit2, Trash2, Users, BookOpen, FolderOpen, PlayCircle, Plus, X, Upload,
  Copy, ArrowRightLeft, FileVideo, Image as ImageIcon, CheckCircle2, Loader2
} from 'lucide-react';
import { DeleteModal } from '@/src/components/ui/DeleteModal';
import { toast } from 'react-hot-toast';
import type { Department, Course, Lecture, Chapter } from '@/src/types';

type NodeType = 'department' | 'course' | 'lecture' | 'chapter';

interface TreeNode {
  id: string;
  type: NodeType;
  name: string;
  data: Department | Course | Lecture | Chapter;
  children: TreeNode[];
  level: number;
  parentId?: string | null;
  stats?: {
    courses?: number;
    students?: number;
    lectures?: number;
    chapters?: number;
  };
  meta?: {
    code?: string;
    status?: string;
    thumbnail?: string;
    duration?: string;
    isFree?: boolean;
  };
}

// Build unified tree structure
function buildUnifiedTree(
  departments: Department[],
  courses: Course[],
  lecturesByCourse: Record<string, Lecture[]>,
  chaptersByLecture: Record<string, Chapter[]>
): TreeNode[] {
  const departmentMap = new Map<string, TreeNode>();
  const courseMap = new Map<string, TreeNode>();

  // Create department nodes
  departments.forEach(dept => {
    const deptNode: TreeNode = {
      id: `dept-${dept.id}`,
      type: 'department',
      name: dept.attributes.name,
      data: dept,
      children: [],
      level: 0,
      stats: {
        courses: dept.attributes.stats?.courses || 0,
        students: dept.attributes.stats?.students || 0,
      },
      meta: {
        code: dept.attributes.code || undefined,
      }
    };
    departmentMap.set(dept.id, deptNode);
  });

  // Build department hierarchy
  const rootNodes: TreeNode[] = [];
  departments.forEach(dept => {
    const node = departmentMap.get(dept.id)!;
    const parentId = dept.attributes.parent?.data?.id;
    
    if (parentId && departmentMap.has(parentId)) {
      const parent = departmentMap.get(parentId)!;
      node.level = parent.level + 1;
      parent.children.push(node);
    } else {
      node.level = 0;
      rootNodes.push(node);
    }
  });

  // Add courses to their departments
  courses.forEach(course => {
    const courseNode: TreeNode = {
      id: `course-${course.id}`,
      type: 'course',
      name: course.attributes.title,
      data: course,
      children: [],
      level: 0,
      stats: {
        lectures: course.attributes.stats?.lectures || 0,
        students: course.attributes.stats?.students || 0,
      },
      meta: {
        status: course.attributes.status === 1 ? 'active' : 'draft',
        thumbnail: course.attributes.thumbnail,
      }
    };
    courseMap.set(course.id, courseNode);

    const deptId = course.attributes.department?.data?.id || 
                   course.attributes.category?.data?.id;
    if (deptId && departmentMap.has(deptId)) {
      const dept = departmentMap.get(deptId)!;
      courseNode.level = dept.level + 1;
      courseNode.parentId = dept.id;
      dept.children.push(courseNode);
    }
  });

  // Add lectures to their courses
  Object.entries(lecturesByCourse).forEach(([courseId, lectures]) => {
    const courseNode = courseMap.get(courseId);
    if (!courseNode) return;

    lectures.forEach(lecture => {
      const lectureNode: TreeNode = {
        id: `lecture-${courseId}-${lecture.id}`,
        type: 'lecture',
        name: lecture.attributes.title,
        data: lecture,
        children: [],
        level: courseNode.level + 1,
        parentId: courseNode.id,
        stats: {
          chapters: lecture.attributes.chapters?.length || 0,
        }
      };
      courseNode.children.push(lectureNode);

      const chapterKey = `${courseId}-${lecture.id}`;
      const chapters = chaptersByLecture[chapterKey] || [];
      chapters.forEach(chapter => {
        const chapterNode: TreeNode = {
          id: `chapter-${chapterKey}-${chapter.id}`,
          type: 'chapter',
          name: chapter.attributes.title,
          data: chapter,
          children: [],
          level: lectureNode.level + 1,
          parentId: lectureNode.id,
          meta: {
            duration: chapter.attributes.duration,
            isFree: chapter.attributes.is_free_preview === 1,
          }
        };
        lectureNode.children.push(chapterNode);
      });
    });
  });

  return rootNodes;
}

// Filter tree based on search query
function filterTree(nodes: TreeNode[], query: string): TreeNode[] {
  if (!query.trim()) return nodes;
  const lowerQuery = query.toLowerCase();

  return nodes.reduce<TreeNode[]>((acc, node) => {
    const matchesNode = node.name.toLowerCase().includes(lowerQuery) ||
      (node.meta?.code?.toLowerCase() || '').includes(lowerQuery);

    const filteredChildren = filterTree(node.children, query);

    if (matchesNode || filteredChildren.length > 0) {
      acc.push({
        ...node,
        children: matchesNode ? node.children : filteredChildren
      });
    }
    return acc;
  }, []);
}

// Type icons and colors
const typeIcons: Record<NodeType, React.ReactNode> = {
  department: <GraduationCap className="w-4 h-4" />,
  course: <BookOpen className="w-4 h-4" />,
  lecture: <FolderOpen className="w-4 h-4" />,
  chapter: <PlayCircle className="w-4 h-4" />,
};

const typeColors: Record<NodeType, string> = {
  department: 'text-blue-600 bg-blue-50 border-blue-200',
  course: 'text-green-600 bg-green-50 border-green-200',
  lecture: 'text-purple-600 bg-purple-50 border-purple-200',
  chapter: 'text-orange-600 bg-orange-50 border-orange-200',
};

// Tree Item Component
interface TreeItemProps {
  node: TreeNode;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  onDelete: (node: TreeNode) => void;
  onSelect: (node: TreeNode) => void;
  onEdit: (node: TreeNode) => void;
  onAdd: (type: NodeType, parentId: string) => void;
  onCopyMove?: (node: TreeNode, mode: 'copy' | 'move') => void;
  isSelected: boolean;
}

function TreeItem({ node, expanded, onToggle, onDelete, onSelect, onEdit, onAdd, onCopyMove, isSelected }: TreeItemProps) {
  const t = useTranslations();
  const isExpanded = expanded.has(node.id);
  const hasChildren = node.children.length > 0;
  const isSubDepartment = node.type === 'department' && node.level > 0;
  const isDraft = node.meta?.status === 'draft';

  return (
    <div className="select-none">
      <div
        onClick={() => onSelect(node)}
        className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all hover:shadow-sm cursor-pointer ${
          isSelected ? 'bg-blue-50 border-blue-300 shadow-sm' : 'bg-white border-gray-200 hover:border-gray-300'
        }`}
        style={{ marginLeft: `${node.level * 24}px` }}
      >
        {/* Expand/Collapse */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            hasChildren && onToggle(node.id);
          }}
          className={`p-1 rounded transition-colors ${
            hasChildren ? 'hover:bg-gray-100 text-gray-500' : 'text-transparent cursor-default'
          }`}
        >
          {hasChildren ? (
            isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
          ) : (
            <span className="w-4 h-4" />
          )}
        </button>

        {/* Type Icon or Image */}
        {node.type === 'department' && (node.data as Department).attributes.image ? (
          <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
            <img
              src={(node.data as Department).attributes.image || undefined}
              alt={node.name}
              className="w-full h-full object-cover"
            />
          </div>
        ) : node.type === 'course' && (node.data as Course).attributes.thumbnail ? (
          <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
            <img
              src={(node.data as Course).attributes.thumbnail || undefined}
              alt={node.name}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${typeColors[node.type]}`}>
            {typeIcons[node.type]}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate text-sm text-gray-900">
              {node.name}
            </span>
            {isDraft && (
              <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">
                {t('courses.draft')}
              </span>
            )}
            {node.meta?.isFree && (
              <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-600 rounded">
                Free
              </span>
            )}
            {isSubDepartment && (
              <>
                <GitBranch className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                  {t('departments.subDepartment')}
                </span>
              </>
            )}
          </div>
          
          {/* Meta info */}
          <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
            {node.meta?.code && <span>{node.meta.code}</span>}
            {node.meta?.duration && <span>{node.meta.duration}</span>}
            {node.type === 'lecture' && (node.data as Lecture).attributes.description && (
              <span className="truncate max-w-[200px]">{(node.data as Lecture).attributes.description}</span>
            )}
            {node.stats && (
              <>
                {node.stats.courses !== undefined && (
                  <span className="flex items-center gap-1 text-blue-600">
                    <BookOpen className="w-3 h-3" /> {node.stats.courses}
                  </span>
                )}
                {node.stats.lectures !== undefined && (
                  <span className="flex items-center gap-1 text-purple-600">
                    <FolderOpen className="w-3 h-3" /> {node.stats.lectures}
                  </span>
                )}
                {node.stats.chapters !== undefined && (
                  <span className="flex items-center gap-1 text-orange-600">
                    <PlayCircle className="w-3 h-3" /> {node.stats.chapters}
                  </span>
                )}
                {node.stats.students !== undefined && (
                  <span className="flex items-center gap-1 text-green-600">
                    <Users className="w-3 h-3" /> {node.stats.students}
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {/* Add child buttons */}
          {node.type === 'department' && (
            <>
              <button
                onClick={() => onAdd('department', node.id)}
                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                title="Add sub-department"
              >
                <GraduationCap className="w-4 h-4" />
              </button>
              <button
                onClick={() => onAdd('course', node.id)}
                className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                title="Add course"
              >
                <BookOpen className="w-4 h-4" />
              </button>
            </>
          )}
          {node.type === 'course' && (
            <button
              onClick={() => onAdd('lecture', node.id)}
              className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
              title="Add lecture"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
          {node.type === 'lecture' && (
            <button
              onClick={() => onAdd('chapter', node.id)}
              className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
              title="Add chapter"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
          {node.type === 'chapter' && onCopyMove && (
            <>
              <button
                onClick={() => onCopyMove(node, 'copy')}
                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                title="Copy chapter"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                onClick={() => onCopyMove(node, 'move')}
                className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                title="Move chapter"
              >
                <ArrowRightLeft className="w-4 h-4" />
              </button>
            </>
          )}
          {/* Edit button */}
          <button
            onClick={() => onEdit(node)}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
            title={t('common.edit')}
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(node)}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
            title={t('common.delete')}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="mt-1 space-y-1">
          {node.children.map(child => (
            <TreeItem
              key={child.id}
              node={child}
              expanded={expanded}
              onToggle={onToggle}
              onDelete={onDelete}
              onSelect={onSelect}
              onEdit={onEdit}
              onAdd={onAdd}
              onCopyMove={onCopyMove}
              isSelected={isSelected}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function DepartmentsPage() {
  const t = useTranslations();
  const [searchQuery, setSearchQuery] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [viewNode, setViewNode] = useState<TreeNode | null>(null);
  const [lecturesByCourse, setLecturesByCourse] = useState<Record<string, Lecture[]>>({});
  const [chaptersByLecture, setChaptersByLecture] = useState<Record<string, Chapter[]>>({});

  // Modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addType, setAddType] = useState<NodeType | null>(null);
  const [addParentId, setAddParentId] = useState<string | null>(null);

  const { data: departments, isLoading: deptsLoading, error, refetch: refetchDepts } = useDepartments();
  const { data: courses, isLoading: coursesLoading, refetch: refetchCourses } = useCourses({});
  const { mutate: deleteDepartment } = useDeleteDepartment();
  const { mutate: deleteCourse } = useDeleteCourse();

  // Create/Update hooks
  const { mutate: createDepartment, isLoading: isCreatingDept } = useCreateDepartment();
  const { mutate: updateDepartment, isLoading: isUpdatingDept } = useUpdateDepartment();
  const { mutate: createCourse, isLoading: isCreatingCourse } = useCreateCourse();
  const { mutate: updateCourse, isLoading: isUpdatingCourse } = useUpdateCourse();
  const { mutate: createLecture, isLoading: isCreatingLecture } = useCreateLecture();
  const { mutate: updateLecture, isLoading: isUpdatingLecture } = useUpdateLecture();
  const { mutate: createChapter, isLoading: isCreatingChapter, progress: createChapterProgress } = useCreateChapter();
  const { mutate: updateChapter, isLoading: isUpdatingChapter, progress: updateChapterProgress } = useUpdateChapter();
  const { mutate: copyChapter, isLoading: isCopyingChapter } = useCopyChapter();

  // Copy/Move modal state
  const [copyMoveModalOpen, setCopyMoveModalOpen] = useState(false);
  const [copyMoveNode, setCopyMoveNode] = useState<TreeNode | null>(null);
  const [copyMoveMode, setCopyMoveMode] = useState<'copy' | 'move'>('copy');
  const [selectedTargetLecture, setSelectedTargetLecture] = useState<string>('');

  // Extract nested data from courses
  useEffect(() => {
    if (courses) {
      const lecturesData: Record<string, Lecture[]> = {};
      const chaptersData: Record<string, Chapter[]> = {};

      courses.forEach(course => {
        const nestedLectures = course.attributes.lectures || [];
        if (nestedLectures.length > 0) {
          lecturesData[course.id] = nestedLectures;
          
          nestedLectures.forEach(lecture => {
            const chapterKey = `${course.id}-${lecture.id}`;
            const nestedChapters = lecture.attributes?.chapters || [];
            if (nestedChapters.length > 0) {
              chaptersData[chapterKey] = nestedChapters;
            }
          });
        }
      });

      setLecturesByCourse(lecturesData);
      setChaptersByLecture(chaptersData);
    }
  }, [courses]);

  // Build unified tree
  const treeData = useMemo(() => {
    if (!departments || !courses) return [];
    const tree = buildUnifiedTree(departments, courses, lecturesByCourse, chaptersByLecture);
    return filterTree(tree, searchQuery);
  }, [departments, courses, lecturesByCourse, chaptersByLecture, searchQuery]);

  // Auto-expand when searching
  useMemo(() => {
    if (searchQuery.trim() && treeData.length > 0) {
      const allIds = new Set<string>();
      const collectIds = (nodes: TreeNode[]) => {
        nodes.forEach(node => {
          allIds.add(node.id);
          collectIds(node.children);
        });
      };
      collectIds(treeData);
      setExpanded(allIds);
    }
  }, [searchQuery, treeData]);

  const handleToggle = (id: string) => {
    setExpanded(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const isLoading = deptsLoading || coursesLoading;
  const refetchAll = () => {
    refetchDepts();
    refetchCourses();
  };

  const handleDelete = (node: TreeNode) => {
    setSelectedNode(node);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedNode) return;

    try {
      const rawId = parseInt(selectedNode.data.id);
      switch (selectedNode.type) {
        case 'department':
          await deleteDepartment(rawId);
          break;
        case 'course':
          await deleteCourse(rawId);
          break;
        case 'lecture':
          await api.lectures.delete(rawId);
          break;
        case 'chapter':
          await api.chapters.delete(rawId);
          break;
      }
      toast.success(t('common.deleteSuccess'));
      setDeleteModalOpen(false);
      setSelectedNode(null);
      refetchDepts();
      refetchCourses();
    } catch {
      toast.error(t('common.deleteError'));
    }
  };

  // Open edit modal
  const handleEdit = (node: TreeNode) => {
    setSelectedNode(node);
    setEditModalOpen(true);
  };

  // Open add modal
  const handleAdd = (type: NodeType, parentId?: string) => {
    setAddType(type);
    setAddParentId(parentId || null);
    setAddModalOpen(true);
  };

  // Open copy/move modal
  const handleCopyMove = (node: TreeNode, mode: 'copy' | 'move') => {
    setCopyMoveNode(node);
    setCopyMoveMode(mode);
    setSelectedTargetLecture('');
    setCopyMoveModalOpen(true);
  };

  // Handle copy/move submit
  const handleCopyMoveSubmit = async () => {
    if (!copyMoveNode || !selectedTargetLecture) return;
    
    const chapterId = parseInt(copyMoveNode.data.id);
    const targetLectureId = parseInt(selectedTargetLecture);
    
    try {
      await copyChapter(chapterId, targetLectureId);
      
      if (copyMoveMode === 'move') {
        // Delete original after successful copy
        await api.chapters.delete(chapterId);
      }
      
      toast.success(copyMoveMode === 'copy' ? 'Chapter copied successfully' : 'Chapter moved successfully');
      setCopyMoveModalOpen(false);
      setCopyMoveNode(null);
      setSelectedTargetLecture('');
      refetchAll();
    } catch {
      toast.error(`Failed to ${copyMoveMode} chapter`);
    }
  };

  // Form submissions
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const handleEditSubmit = async (formData: any) => {
    if (!selectedNode) return;
    const rawId = parseInt(selectedNode.data.id);

    try {
      switch (selectedNode.type) {
        case 'department':
          const deptData = { ...formData };
          if (!deptData.image) delete deptData.image;
          await updateDepartment(rawId, deptData, (progress) => setUploadProgress(progress));
          break;
        case 'course':
          const course = selectedNode.data as Course;
          // Get category_id from relationship data or parent department
          const categoryId = course.attributes.category?.data?.id 
            ? parseInt(course.attributes.category.data.id) 
            : course.attributes.category_id || (selectedNode.parentId ? parseInt(selectedNode.parentId.replace('dept-', '')) : 1);
          await updateCourse(rawId, {
            ...formData,
            category_id: categoryId,
            price: parseFloat(formData.price) || 0,
            max_views_per_student: parseInt(formData.max_views_per_student) || 10,
          }, (progress) => setUploadProgress(progress));
          break;
        case 'lecture':
          const lecture = selectedNode.data as Lecture;
          await updateLecture(rawId, {
            ...formData,
            course_id: lecture.attributes.course_id,
          });
          break;
        case 'chapter':
          const chapter = selectedNode.data as Chapter;
          await updateChapter(rawId, {
            title: formData.title,
            duration: formData.duration,
            is_free_preview: formData.is_free_preview ?? 0,
            lecture_id: chapter.attributes.lecture_id,
            view_detection_timestamp: formData.view_detection_timestamp,
            thumbnail: formData.thumbnail,
            video: formData.video,
          });
          break;
      }
      toast.success('Updated successfully');
      setEditModalOpen(false);
      setSelectedNode(null);
      setUploadProgress(0);
      refetchAll();
    } catch {
      toast.error('Failed to update');
      setUploadProgress(0);
    }
  };

  const handleAddSubmit = async (formData: any) => {
    if (!addType) return;

    try {
      switch (addType) {
        case 'department':
          await createDepartment({
            ...formData,
            parent_id: addParentId ? parseInt(addParentId.replace('dept-', '')) : undefined
          }, (progress) => setUploadProgress(progress));
          break;
        case 'course':
          await createCourse({
            ...formData,
            category_id: addParentId ? parseInt(addParentId.replace('dept-', '')) : undefined,
            price: parseFloat(formData.price) || 0,
            max_views_per_student: parseInt(formData.max_views_per_student) || 10,
            status: formData.status ?? 0
          }, (progress) => setUploadProgress(progress));
          break;
        case 'lecture':
          await createLecture({ ...formData, course_id: addParentId ? parseInt(addParentId.replace('course-', '')) : undefined });
          break;
        case 'chapter':
          const [courseId, lectureId] = addParentId?.replace('lecture-', '').split('-') || [];
          await createChapter({
            title: formData.title,
            duration: formData.duration,
            is_free_preview: formData.is_free_preview ?? 0,
            lecture_id: lectureId ? parseInt(lectureId) : undefined,
            thumbnail: formData.thumbnail,
            video: formData.video,
            attachments: formData.attachments || [],
            view_detection_timestamp: formData.view_detection_timestamp,
          }, (progress) => setUploadProgress(progress));
          break;
      }
      toast.success('Created successfully');
      setAddModalOpen(false);
      setAddType(null);
      setAddParentId(null);
      setUploadProgress(0);
      refetchAll();
    } catch {
      toast.error('Failed to create');
      setUploadProgress(0);
    }
  };

  // Expand all / Collapse all
  const expandAll = () => {
    const allIds = new Set<string>();
    const collectIds = (nodes: TreeNode[]) => {
      nodes.forEach(node => {
        allIds.add(node.id);
        collectIds(node.children);
      });
    };
    collectIds(treeData);
    setExpanded(allIds);
  };

  const collapseAll = () => {
    setExpanded(new Set());
  };

  if (error) {
    return (
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1E293B]">Content Manager</h1>
            <p className="text-sm text-[#64748B] mt-0.5">Departments, Courses, Lectures & Chapters</p>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <p className="text-red-600">{t('departments.loadError')}: {error}</p>
          <button
            onClick={refetchAll}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            {t('departments.retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">Content Manager</h1>
          <p className="text-sm text-[#64748B] mt-0.5">Departments, Courses, Lectures & Chapters</p>
        </div>
        <button
          onClick={() => handleAdd('department')}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#2137D6] hover:bg-[#1a2bb3] text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-200"
        >
          <Plus className="w-4 h-4" />
          Add Department
        </button>
      </div>

      {/* Search and Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-96">
          <input
            type="text"
            placeholder={t('departments.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2.5 pl-10 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={expandAll}
            className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
          >
            {t('departments.tree.expandAll') || 'Expand All'}
          </button>
          <button
            onClick={collapseAll}
            className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
          >
            {t('departments.tree.collapseAll') || 'Collapse All'}
          </button>
        </div>
      </div>

      {/* Tree View */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-500">{t('departments.loading') || 'Loading...'}</p>
            </div>
          </div>
        ) : treeData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <GraduationCap className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 text-center">
              {searchQuery ? t('departments.noSearchResults') || 'No departments match your search' : t('departments.noDepartments')}
            </p>
          </div>
        ) : (
          <div className="flex gap-6 items-start">
            {/* Tree View */}
            <div className={`p-4 space-y-2 ${viewNode ? 'flex-1' : 'w-full'}`}>
              {treeData.map(node => (
                <TreeItem
                  key={node.id}
                  node={node}
                  expanded={expanded}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                  onSelect={setViewNode}
                  onEdit={handleEdit}
                  onAdd={handleAdd}
                  onCopyMove={handleCopyMove}
                  isSelected={viewNode?.id === node.id}
                />
              ))}
            </div>

            {/* Side Panel - Details View */}
            {viewNode && (
              <div className="w-96 bg-white border border-gray-200 rounded-xl shadow-sm sticky top-4 self-start max-h-[calc(100vh-100px)] flex flex-col mr-4 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 capitalize">{viewNode.type} Details</h3>
                  <button
                    onClick={() => setViewNode(null)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {/* Name */}
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">Name</label>
                    <p className="text-sm font-medium text-gray-900 mt-1">{viewNode.name}</p>
                  </div>

                  {/* Type-specific details */}
                  {viewNode.type === 'department' && (
                    <>
                      {viewNode.meta?.code && (
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase">Code</label>
                          <p className="text-sm text-gray-700 mt-1">{viewNode.meta.code}</p>
                        </div>
                      )}
                      <div className="flex gap-4">
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase">Courses</label>
                          <p className="text-lg font-semibold text-blue-600">{viewNode.stats?.courses || 0}</p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase">Students</label>
                          <p className="text-lg font-semibold text-green-600">{viewNode.stats?.students || 0}</p>
                        </div>
                      </div>
                    </>
                  )}

                  {viewNode.type === 'course' && (
                    <>
                      {/* Thumbnail */}
                      {(viewNode.data as Course).attributes.thumbnail && (
                        <div className="mb-4">
                          <img 
                            src={(viewNode.data as Course).attributes.thumbnail} 
                            alt="Course thumbnail"
                            className="w-full h-32 object-cover rounded-lg"
                          />
                        </div>
                      )}

                      {/* Title */}
                      <div className="mb-3">
                        <p className="text-base font-bold text-gray-900">{(viewNode.data as Course).attributes.title}</p>
                        {(viewNode.data as Course).attributes.sub_title && (
                          <p className="text-xs text-gray-500 mt-0.5">{(viewNode.data as Course).attributes.sub_title}</p>
                        )}
                      </div>

                      {/* Grid Layout for Details */}
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        {/* Status */}
                        <div>
                          <label className="text-[10px] font-medium text-gray-400 uppercase">Status</label>
                          <span className={`inline-block px-2 py-0.5 text-[10px] font-medium rounded-full ${
                            viewNode.meta?.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {viewNode.meta?.status === 'active' ? 'Active' : 'Draft'}
                          </span>
                        </div>

                        {/* Visibility */}
                        <div>
                          <label className="text-[10px] font-medium text-gray-400 uppercase">Visibility</label>
                          <p className="text-xs text-gray-700 capitalize">{(viewNode.data as Course).attributes.visibility}</p>
                        </div>

                        {/* Price */}
                        <div>
                          <label className="text-[10px] font-medium text-gray-400 uppercase">Price</label>
                          <p className="text-sm font-semibold text-blue-600">${(viewNode.data as Course).attributes.price}</p>
                        </div>

                        {/* Max Views */}
                        <div>
                          <label className="text-[10px] font-medium text-gray-400 uppercase">Max Views</label>
                          <p className="text-xs text-gray-700">{(viewNode.data as Course).attributes.max_views_per_student}</p>
                        </div>

                        {/* Lectures */}
                        <div>
                          <label className="text-[10px] font-medium text-gray-400 uppercase">Lectures</label>
                          <p className="text-sm font-semibold text-purple-600">{viewNode.stats?.lectures || 0}</p>
                        </div>

                        {/* Students */}
                        <div>
                          <label className="text-[10px] font-medium text-gray-400 uppercase">Students</label>
                          <p className="text-sm font-semibold text-green-600">{viewNode.stats?.students || 0}</p>
                        </div>
                      </div>

                      {/* Instructor */}
                      {(viewNode.data as Course).attributes.instructor?.data?.attributes?.full_name && (
                        <div className="mb-2">
                          <label className="text-[10px] font-medium text-gray-400 uppercase">Instructor</label>
                          <p className="text-xs text-gray-700">{(viewNode.data as Course).attributes.instructor?.data?.attributes?.full_name}</p>
                        </div>
                      )}

                      {/* Description */}
                      {(viewNode.data as Course).attributes.description && (
                        <div className="mb-2">
                          <label className="text-[10px] font-medium text-gray-400 uppercase">Description</label>
                          <p className="text-xs text-gray-600 line-clamp-2">{(viewNode.data as Course).attributes.description}</p>
                        </div>
                      )}

                      {/* Objectives */}
                      {(viewNode.data as Course).attributes.objectives && (
                        <div>
                          <label className="text-[10px] font-medium text-gray-400 uppercase">Objectives</label>
                          <p className="text-xs text-gray-600 line-clamp-2">{(viewNode.data as Course).attributes.objectives}</p>
                        </div>
                      )}
                    </>
                  )}

                  {viewNode.type === 'lecture' && (
                    <>
                      {/* Description */}
                      {(viewNode.data as Lecture).attributes.description && (
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase">Description</label>
                          <p className="text-sm text-gray-700 mt-1 line-clamp-3">
                            {(viewNode.data as Lecture).attributes.description}
                          </p>
                        </div>
                      )}
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase">Chapters</label>
                        <p className="text-lg font-semibold text-orange-600">{viewNode.stats?.chapters || 0}</p>
                      </div>
                    </>
                  )}

                  {viewNode.type === 'chapter' && (
                    <div className="space-y-4">
                      {/* Title */}
                      <div className="mb-4">
                        <label className="text-xs font-medium text-gray-500 uppercase">Title</label>
                        <p className="text-lg font-semibold text-gray-900">{(viewNode.data as Chapter).attributes.title}</p>
                      </div>

                      {/* Media Section */}
                      <div className="mb-4">
                        <label className="text-xs font-medium text-gray-500 uppercase mb-2 block">Media</label>
                        <div className="space-y-3">
                          {/* Video Preview */}
                          {(viewNode.data as Chapter).attributes.video && (
                            <div>
                              <label className="text-xs text-gray-400 mb-1 block">Video</label>
                              <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-900">
                                <video
                                  src={(viewNode.data as Chapter).attributes.video}
                                  controls
                                  className="w-full h-40 object-contain"
                                />
                              </div>
                            </div>
                          )}

                          {/* Thumbnail */}
                          {(viewNode.data as Chapter).attributes.thumbnail && (
                            <div>
                              <label className="text-xs text-gray-400 mb-1 block">Thumbnail</label>
                              <img
                                src={(viewNode.data as Chapter).attributes.thumbnail}
                                alt="Chapter thumbnail"
                                className="w-full h-32 object-cover rounded-lg border border-gray-200 mx-auto"
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Chapter Settings */}
                      <div className="mb-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <label className="text-xs font-medium text-gray-700 uppercase mb-3 block">Chapter Settings</label>
                        <div className="space-y-3">
                          {/* View Detection Timestamp */}
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">View Detection (sec)</span>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                defaultValue={(viewNode.data as Chapter).attributes.view_detection_timestamp || 0}
                                className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                min="0"
                              />
                              <button
                                onClick={() => handleEdit(viewNode)}
                                className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                                title="Save changes"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </button>
                            </div>
                          </div>

                          {/* Free Preview */}
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Free Preview</span>
                            <button
                              onClick={() => handleEdit(viewNode)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                (viewNode.data as Chapter).attributes.is_free_preview === 1
                                  ? 'bg-blue-600'
                                  : 'bg-gray-300'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  (viewNode.data as Chapter).attributes.is_free_preview === 1
                                    ? 'translate-x-6'
                                    : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </div>

                          {/* Max Views */}
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Max Views</span>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                defaultValue={(viewNode.data as Chapter).attributes.max_views}
                                className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                min="0"
                              />
                              <button
                                onClick={() => handleEdit(viewNode)}
                                className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                                title="Save changes"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 pt-3 border-t border-gray-200">
                          <button
                            onClick={() => handleEdit(viewNode)}
                            className="w-full px-3 py-2 bg-white border border-gray-300 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            Edit All Settings
                          </button>
                        </div>
                      </div>

                      {/* Attachments & Resources */}
                      {(viewNode.data as Chapter).attributes.attachments && (viewNode.data as Chapter).attributes.attachments!.length > 0 && (
                        <div className="mb-4">
                          <label className="text-xs font-medium text-gray-500 uppercase">Attachments & Resources</label>
                          <div className="mt-1 space-y-2">
                            {(viewNode.data as Chapter).attributes.attachments!.map((attachment) => (
                              <div key={attachment.id} className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 p-2 rounded">
                                <span className="truncate">{attachment.attributes.name || 'Unnamed file'}</span>
                                <span className="text-xs text-gray-400">({attachment.attributes.size || 'Unknown size'})</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {viewNode.meta?.duration && (
                        <div className="mb-4">
                          <label className="text-xs font-medium text-gray-500 uppercase">Duration</label>
                          <p className="text-sm text-gray-700 mt-1">{viewNode.meta.duration}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="pt-4 border-t border-gray-200">
                    {/* Footer Actions */}
                    <div className="flex gap-2 pt-4 mt-4 border-t border-gray-200 flex-wrap">
                      {viewNode.type === 'chapter' && (
                        <>
                          <button
                            onClick={() => handleCopyMove(viewNode, 'copy')}
                            className="px-3 py-2 bg-blue-50 text-blue-600 text-sm font-medium rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1"
                          >
                            <Copy className="w-4 h-4" />
                            Copy
                          </button>
                          <button
                            onClick={() => handleCopyMove(viewNode, 'move')}
                            className="px-3 py-2 bg-purple-50 text-purple-600 text-sm font-medium rounded-lg hover:bg-purple-100 transition-colors flex items-center gap-1"
                          >
                            <ArrowRightLeft className="w-4 h-4" />
                            Move
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleEdit(viewNode)}
                        className={`flex-1 px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors ${
                          viewNode.type === 'department' ? 'bg-blue-600 hover:bg-blue-700' :
                          viewNode.type === 'course' ? 'bg-green-600 hover:bg-green-700' :
                          viewNode.type === 'lecture' ? 'bg-purple-600 hover:bg-purple-700' :
                          'bg-orange-600 hover:bg-orange-700'
                        }`}
                      >
                        Edit {viewNode.type.charAt(0).toUpperCase() + viewNode.type.slice(1)}
                      </button>
                      <button
                        onClick={() => handleDelete(viewNode)}
                        className="px-4 py-2 bg-red-50 text-red-600 text-sm font-medium rounded-lg hover:bg-red-100 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-sm text-gray-500 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded flex items-center justify-center text-blue-600 bg-blue-50 border border-blue-200">
            <GraduationCap className="w-3 h-3" />
          </div>
          <span>Department</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded flex items-center justify-center text-green-600 bg-green-50 border border-green-200">
            <BookOpen className="w-3 h-3" />
          </div>
          <span>Course</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded flex items-center justify-center text-purple-600 bg-purple-50 border border-purple-200">
            <FolderOpen className="w-3 h-3" />
          </div>
          <span>Lecture</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded flex items-center justify-center text-orange-600 bg-orange-50 border border-orange-200">
            <PlayCircle className="w-3 h-3" />
          </div>
          <span>Chapter</span>
        </div>
      </div>

      {/* Edit Modal */}
      {editModalOpen && selectedNode && (
        <EditModal
          node={selectedNode}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedNode(null);
          }}
          onSubmit={handleEditSubmit}
          isLoading={isUpdatingDept || isUpdatingCourse || isUpdatingLecture || isUpdatingChapter}
        />
      )}

      {/* Add Modal */}
      {addModalOpen && addType && (
        <AddModal
          type={addType}
          parentId={addParentId}
          onClose={() => {
            setAddModalOpen(false);
            setAddType(null);
            setAddParentId(null);
          }}
          onSubmit={handleAddSubmit}
          isLoading={isCreatingDept || isCreatingCourse || isCreatingLecture || isCreatingChapter}
        />
      )}

      {/* Copy/Move Modal */}
      {copyMoveModalOpen && copyMoveNode && (
        <CopyMoveModal
          node={copyMoveNode}
          mode={copyMoveMode}
          courses={courses || []}
          lecturesByCourse={lecturesByCourse}
          selectedTarget={selectedTargetLecture}
          onSelectTarget={setSelectedTargetLecture}
          onClose={() => {
            setCopyMoveModalOpen(false);
            setCopyMoveNode(null);
            setSelectedTargetLecture('');
          }}
          onConfirm={handleCopyMoveSubmit}
          isLoading={isCopyingChapter}
        />
      )}

      <DeleteModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedNode(null);
        }}
        onConfirm={handleConfirmDelete}
        title={selectedNode ? `${t('common.delete')} ${selectedNode.type}` : t('departments.deleteTitle')}
        itemName={selectedNode?.name || ''}
        isLoading={false}
      />
    </div>
  );
}

// Edit Modal Component
interface EditModalProps {
  node: TreeNode;
  onClose: () => void;
  onSubmit: (data: any) => void;
  isLoading: boolean;
  progress?: number;
}

function EditModal({ node, onClose, onSubmit, isLoading, progress = 0 }: EditModalProps) {
  const [formData, setFormData] = useState<Record<string, any>>(() => {
    switch (node.type) {
      case 'department':
        const dept = node.data as Department;
        return {
          name: dept.attributes.name,
          image: null,
        };
      case 'course':
        const course = node.data as Course;
        return {
          title: course.attributes.title,
          sub_title: course.attributes.sub_title || '',
          description: course.attributes.description || '',
          objectives: course.attributes.objectives || '',
          status: course.attributes.status,
          price: course.attributes.price?.toString() || '0',
          max_views_per_student: course.attributes.max_views_per_student?.toString() || '10',
          visibility: course.attributes.visibility || 'public',
          thumbnail: null,
        };
      case 'lecture':
        const lecture = node.data as Lecture;
        return {
          title: lecture.attributes.title,
          description: lecture.attributes.description || '',
        };
      case 'chapter':
        const chapter = node.data as Chapter;
        return {
          title: chapter.attributes.title,
          duration: chapter.attributes.duration || '',
          is_free_preview: chapter.attributes.is_free_preview ?? 0,
          max_views: chapter.attributes.max_views,
          view_detection_timestamp: chapter.attributes.view_detection_timestamp,
          thumbnail: null,
        };
      default:
        return {};
    }
  });
  const [imagePreview, setImagePreview] = useState<string | null>(() => {
    if (node.type === 'department') {
      const dept = node.data as Department;
      return dept.attributes.image || null;
    }
    return null;
  });

  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(() => {
    if (node.type === 'course') {
      const course = node.data as Course;
      return course.attributes.thumbnail || null;
    }
    if (node.type === 'chapter') {
      const chapter = node.data as Chapter;
      return chapter.attributes.thumbnail || null;
    }
    return null;
  });

  const [videoPreview, setVideoPreview] = useState<string | null>(() => {
    if (node.type === 'chapter') {
      const chapter = node.data as Chapter;
      return chapter.attributes.video || null;
    }
    return null;
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, image: file });
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, thumbnail: file });
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, video: file });
      setVideoPreview(URL.createObjectURL(file));
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleThumbnailClick = () => {
    thumbnailInputRef.current?.click();
  };

  const handleVideoClick = () => {
    videoInputRef.current?.click();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Edit {node.type}</h3>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Department fields */}
          {node.type === 'department' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                {imagePreview ? (
                  <div
                    onClick={handleImageClick}
                    className="mt-2 flex justify-center cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-xl border-2 border-gray-200 shadow-sm"
                    />
                  </div>
                ) : (
                  <div
                    onClick={handleImageClick}
                    className="mt-2 w-32 h-32 bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center mx-auto cursor-pointer hover:bg-gray-200 hover:border-gray-400 transition-colors"
                  >
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-gray-400 text-xs">Click to upload</span>
                  </div>
                )}
                {progress > 0 && progress < 100 && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Uploading...</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </>
          )}

          {/* Course fields */}
          {node.type === 'course' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle *</label>
                <input
                  type="text"
                  value={formData.sub_title || ''}
                  onChange={(e) => setFormData({ ...formData, sub_title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows={2}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Objectives *</label>
                  <textarea
                    value={formData.objectives || ''}
                    onChange={(e) => setFormData({ ...formData, objectives: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows={2}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail</label>
                  <input
                    ref={thumbnailInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailChange}
                    className="hidden"
                  />
                  {thumbnailPreview ? (
                    <div
                      onClick={handleThumbnailClick}
                      className="mt-1 flex justify-center cursor-pointer hover:opacity-80 transition-opacity"
                    >
                      <img
                        src={thumbnailPreview}
                        alt="Preview"
                        className="w-24 h-24 object-cover rounded-lg border-2 border-gray-200 shadow-sm"
                      />
                    </div>
                  ) : (
                    <div
                      onClick={handleThumbnailClick}
                      className="mt-1 w-24 h-24 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center mx-auto cursor-pointer hover:bg-gray-200 hover:border-gray-400 transition-colors"
                    >
                      <Upload className="w-6 h-6 text-gray-400 mb-1" />
                      <span className="text-gray-400 text-xs text-center leading-tight">Click to<br/>upload</span>
                    </div>
                  )}
                  {progress > 0 && progress < 100 && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Uploading...</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-full rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                <div className="col-span-2 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Visibility</label>
                    <select
                      value={formData.visibility || 'public'}
                      onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="public">Public</option>
                      <option value="private">Private</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={formData.status || 0}
                      onChange={(e) => setFormData({ ...formData, status: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value={0}>Draft</option>
                      <option value={1}>Active</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price || '0'}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Views</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.max_views_per_student || '10'}
                    onChange={(e) => setFormData({ ...formData, max_views_per_student: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
            </>
          )}

          {/* Lecture fields */}
          {node.type === 'lecture' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows={3}
                />
              </div>
            </>
          )}

          {/* Chapter fields */}
          {node.type === 'chapter' && (
            <>
              {/* Media Upload Section */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-4">
                <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <FileVideo className="w-4 h-4 text-orange-500" />
                  Media Files
                </h4>

                {/* Video Upload */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase mb-2">Video</label>
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleVideoChange}
                    className="hidden"
                  />
                  {videoPreview ? (
                    <div className="relative group">
                      <div
                        onClick={handleVideoClick}
                        className="cursor-pointer rounded-xl overflow-hidden border-2 border-orange-200 shadow-sm"
                      >
                        <video
                          src={videoPreview}
                          className="w-full h-40 object-cover"
                        />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-white text-sm font-medium">Change Video</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setVideoPreview(null);
                          setFormData({ ...formData, video: null });
                        }}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-md"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={handleVideoClick}
                      className="w-full h-40 bg-white rounded-xl border-2 border-dashed border-orange-300 flex flex-col items-center justify-center cursor-pointer hover:bg-orange-50 hover:border-orange-400 transition-all group"
                    >
                      <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <Upload className="w-7 h-7 text-orange-500" />
                      </div>
                      <span className="text-sm font-medium text-gray-600">Click to upload video</span>
                      <span className="text-xs text-gray-400 mt-1">MP4, WebM, MOV up to 500MB</span>
                    </div>
                  )}
                  {progress > 0 && progress < 100 && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Uploading...</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-orange-600 h-full rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Thumbnail Upload */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase mb-2">Thumbnail</label>
                  <input
                    ref={thumbnailInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailChange}
                    className="hidden"
                  />
                  {thumbnailPreview ? (
                    <div className="relative group mx-auto">
                      <div
                        onClick={handleThumbnailClick}
                        className="cursor-pointer rounded-xl overflow-hidden border-2 border-gray-200 shadow-sm w-32 h-24"
                      >
                        <img
                          src={thumbnailPreview}
                          alt="Thumbnail"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <ImageIcon className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setThumbnailPreview(null);
                          setFormData({ ...formData, thumbnail: null });
                        }}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-md"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={handleThumbnailClick}
                      className="w-32 h-24 bg-white rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-gray-400 transition-all mx-auto"
                    >
                      <ImageIcon className="w-6 h-6 text-gray-400 mb-1" />
                      <span className="text-xs text-gray-500">Add thumbnail</span>
                    </div>
                  )}
                  {progress > 0 && progress < 100 && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Uploading...</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-orange-600 h-full rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Chapter Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={formData.title || ''}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                  <input
                    type="text"
                    value={formData.duration || ''}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="e.g. 10:30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Views</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.max_views || '10'}
                    onChange={(e) => setFormData({ ...formData, max_views: parseInt(e.target.value) || 10 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div className="flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <div className={`w-11 h-6 rounded-full transition-colors relative ${formData.is_free_preview === 1 ? 'bg-orange-500' : 'bg-gray-200'}`}>
                      <input
                        type="checkbox"
                        checked={formData.is_free_preview === 1}
                        onChange={(e) => setFormData({ ...formData, is_free_preview: e.target.checked ? 1 : 0 })}
                        className="sr-only"
                      />
                      <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.is_free_preview === 1 ? 'translate-x-5' : ''}`} />
                    </div>
                    <span className="text-sm font-medium text-gray-700">Free Preview</span>
                  </label>
                </div>
              </div>

              {/* View Detection Timestamp */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <label className="block text-sm font-medium text-blue-700 mb-2 flex items-center gap-2">
                  <PlayCircle className="w-4 h-4" />
                  View Detection Timestamp
                </label>
                <p className="text-xs text-gray-500 mb-2">Set the specific moment (in seconds) when the view API should be triggered</p>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={formData.view_detection_timestamp || ''}
                  onChange={(e) => setFormData({ ...formData, view_detection_timestamp: e.target.value ? parseInt(e.target.value) : null })}
                  className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  placeholder="e.g. 30 (seconds)"
                />
              </div>
            </>
          )}

          {/* Enhanced Upload Progress */}
          {progress > 0 && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {progress < 100 ? 'Uploading files...' : 'Upload complete!'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {progress < 100 ? 'Please wait while we upload your files' : 'Your files have been uploaded successfully'}
                  </p>
                </div>
                <span className="text-lg font-bold text-blue-600">{progress}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? `Saving... ${progress > 0 ? `${progress}%` : ''}` : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Add Modal Component
interface AddModalProps {
  type: NodeType;
  parentId: string | null;
  onClose: () => void;
  onSubmit: (data: any) => void;
  isLoading: boolean;
  progress?: number;
}

function AddModal({ type, parentId, onClose, onSubmit, isLoading, progress = 0 }: AddModalProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, image: file });
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, thumbnail: file });
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, video: file });
      setVideoPreview(URL.createObjectURL(file));
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleThumbnailClick = () => {
    thumbnailInputRef.current?.click();
  };

  const handleVideoClick = () => {
    videoInputRef.current?.click();
  };

  const getTitle = () => {
    if (type === 'department' && parentId) return 'Add Sub-department';
    return `Add ${type.charAt(0).toUpperCase() + type.slice(1)}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{getTitle()}</h3>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Department fields */}
          {type === 'department' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                {imagePreview ? (
                  <div
                    onClick={handleImageClick}
                    className="mt-2 flex justify-center cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-xl border-2 border-gray-200 shadow-sm"
                    />
                  </div>
                ) : (
                  <div
                    onClick={handleImageClick}
                    className="mt-2 w-32 h-32 bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center mx-auto cursor-pointer hover:bg-gray-200 hover:border-gray-400 transition-colors"
                  >
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-gray-400 text-xs">Click to upload</span>
                  </div>
                )}
                {progress > 0 && progress < 100 && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Uploading...</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </>
          )}

          {/* Course fields */}
          {type === 'course' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle *</label>
                <input
                  type="text"
                  value={formData.sub_title || ''}
                  onChange={(e) => setFormData({ ...formData, sub_title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows={2}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Objectives *</label>
                  <textarea
                    value={formData.objectives || ''}
                    onChange={(e) => setFormData({ ...formData, objectives: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows={2}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail *</label>
                  <input
                    ref={thumbnailInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailChange}
                    className="hidden"
                  />
                  {thumbnailPreview ? (
                    <div
                      onClick={handleThumbnailClick}
                      className="mt-1 flex justify-center cursor-pointer hover:opacity-80 transition-opacity"
                    >
                      <img
                        src={thumbnailPreview}
                        alt="Preview"
                        className="w-24 h-24 object-cover rounded-lg border-2 border-gray-200 shadow-sm"
                      />
                    </div>
                  ) : (
                    <div
                      onClick={handleThumbnailClick}
                      className="mt-1 w-24 h-24 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center mx-auto cursor-pointer hover:bg-gray-200 hover:border-gray-400 transition-colors"
                    >
                      <Upload className="w-6 h-6 text-gray-400 mb-1" />
                      <span className="text-gray-400 text-xs text-center leading-tight">Click to<br/>upload</span>
                    </div>
                  )}
                  {progress > 0 && progress < 100 && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Uploading...</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-full rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                <div className="col-span-2 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Visibility</label>
                    <select
                      value={formData.visibility || 'public'}
                      onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="public">Public</option>
                      <option value="private">Private</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={formData.status || 0}
                      onChange={(e) => setFormData({ ...formData, status: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value={0}>Draft</option>
                      <option value={1}>Active</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price || '0'}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Views</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.max_views_per_student || '10'}
                    onChange={(e) => setFormData({ ...formData, max_views_per_student: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
            </>
          )}

          {/* Lecture fields */}
          {type === 'lecture' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows={3}
                />
              </div>
            </>
          )}

          {/* Chapter fields */}
          {type === 'chapter' && (
            <>
              {/* Media Upload Section */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-4">
                <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <FileVideo className="w-4 h-4 text-orange-500" />
                  Media Files
                </h4>

                {/* Video Upload */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase mb-2">Video</label>
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleVideoChange}
                    className="hidden"
                  />
                  {videoPreview ? (
                    <div className="relative group">
                      <div
                        onClick={handleVideoClick}
                        className="cursor-pointer rounded-xl overflow-hidden border-2 border-orange-200 shadow-sm"
                      >
                        <video
                          src={videoPreview}
                          className="w-full h-40 object-cover"
                        />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-white text-sm font-medium">Change Video</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setVideoPreview(null);
                          setFormData({ ...formData, video: null });
                        }}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-md"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={handleVideoClick}
                      className="w-full h-40 bg-white rounded-xl border-2 border-dashed border-orange-300 flex flex-col items-center justify-center cursor-pointer hover:bg-orange-50 hover:border-orange-400 transition-all group"
                    >
                      <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <Upload className="w-7 h-7 text-orange-500" />
                      </div>
                      <span className="text-sm font-medium text-gray-600">Click to upload video</span>
                      <span className="text-xs text-gray-400 mt-1">MP4, WebM, MOV up to 500MB</span>
                    </div>
                  )}
                  {progress > 0 && progress < 100 && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Uploading...</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-orange-600 h-full rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Thumbnail Upload */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase mb-2">Thumbnail</label>
                  <input
                    ref={thumbnailInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailChange}
                    className="hidden"
                  />
                  {thumbnailPreview ? (
                    <div className="relative group mx-auto">
                      <div
                        onClick={handleThumbnailClick}
                        className="cursor-pointer rounded-xl overflow-hidden border-2 border-gray-200 shadow-sm w-32 h-24"
                      >
                        <img
                          src={thumbnailPreview}
                          alt="Thumbnail"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <ImageIcon className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setThumbnailPreview(null);
                          setFormData({ ...formData, thumbnail: null });
                        }}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-md"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={handleThumbnailClick}
                      className="w-32 h-24 bg-white rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-gray-400 transition-all mx-auto"
                    >
                      <ImageIcon className="w-6 h-6 text-gray-400 mb-1" />
                      <span className="text-xs text-gray-500">Add thumbnail</span>
                    </div>
                  )}
                  {progress > 0 && progress < 100 && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Uploading...</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-orange-600 h-full rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Chapter Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    type="text"
                    value={formData.title || ''}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (e.g. 45:00) *</label>
                  <input
                    type="text"
                    value={formData.duration || ''}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="00:00"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-lg">
                <label htmlFor="add_is_free_preview" className="text-sm font-medium text-gray-700">Free Preview</label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <div className={`w-11 h-6 rounded-full transition-colors relative ${formData.is_free_preview === 1 ? 'bg-orange-500' : 'bg-gray-200'}`}>
                    <input
                      type="checkbox"
                      id="add_is_free_preview"
                      checked={formData.is_free_preview === 1}
                      onChange={(e) => setFormData({ ...formData, is_free_preview: e.target.checked ? 1 : 0 })}
                      className="sr-only"
                    />
                    <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.is_free_preview === 1 ? 'translate-x-5' : ''}`} />
                  </div>
                </label>
              </div>

              {/* View Detection Timestamp */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <label className="block text-sm font-medium text-blue-700 mb-2 flex items-center gap-2">
                  <PlayCircle className="w-4 h-4" />
                  View Detection Timestamp
                </label>
                <p className="text-xs text-gray-500 mb-2">Set the specific moment (in seconds) when the view API should be triggered</p>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={formData.view_detection_timestamp || ''}
                  onChange={(e) => setFormData({ ...formData, view_detection_timestamp: e.target.value ? parseInt(e.target.value) : null })}
                  className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  placeholder="e.g. 30 (seconds)"
                />
              </div>
            </>
          )}

          {progress > 0 && progress < 100 && (
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Uploading...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Enhanced Upload Progress for Add Modal */}
          {progress > 0 && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {progress < 100 ? 'Uploading files...' : 'Upload complete!'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {progress < 100 ? 'Please wait while we upload your files' : 'Your files have been uploaded successfully'}
                  </p>
                </div>
                <span className="text-lg font-bold text-blue-600">{progress}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? `Creating... ${progress > 0 ? `${progress}%` : ''}` : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Copy/Move Modal Component
interface CopyMoveModalProps {
  node: TreeNode;
  mode: 'copy' | 'move';
  courses: Course[];
  lecturesByCourse: Record<string, Lecture[]>;
  selectedTarget: string;
  onSelectTarget: (lectureId: string) => void;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}

function CopyMoveModal({
  node,
  mode,
  courses,
  lecturesByCourse,
  selectedTarget,
  onSelectTarget,
  onClose,
  onConfirm,
  isLoading
}: CopyMoveModalProps) {
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set());
  const chapter = node.data as Chapter;

  const toggleCourse = (courseId: string) => {
    const newExpanded = new Set(expandedCourses);
    if (newExpanded.has(courseId)) {
      newExpanded.delete(courseId);
    } else {
      newExpanded.add(courseId);
    }
    setExpandedCourses(newExpanded);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {mode === 'copy' ? 'Copy Chapter' : 'Move Chapter'}
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {mode === 'copy' ? `Copy "${chapter.attributes.title}" to another lecture` : `Move "${chapter.attributes.title}" to another lecture`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Target Lecture
          </label>

          <div className="space-y-2 border border-gray-200 rounded-lg p-2 max-h-64 overflow-y-auto">
            {courses.map((course) => {
              const courseLectures = lecturesByCourse[course.id] || [];
              const isExpanded = expandedCourses.has(course.id);

              return (
                <div key={course.id} className="border border-gray-100 rounded-lg overflow-hidden">
                  {/* Course Header */}
                  <button
                    onClick={() => toggleCourse(course.id)}
                    className="w-full flex items-center justify-between p-2 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-gray-700">
                        {course.attributes.title}
                      </span>
                    </div>
                    {courseLectures.length > 0 && (
                      isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      )
                    )}
                  </button>

                  {/* Lectures List */}
                  {isExpanded && courseLectures.length > 0 && (
                    <div className="bg-white">
                      {courseLectures.map((lecture) => {
                        const isCurrentLecture = String(lecture.id) === String(chapter.attributes.lecture_id);
                        const isSelected = selectedTarget === lecture.id;

                        return (
                          <button
                            key={lecture.id}
                            onClick={() => !isCurrentLecture && onSelectTarget(lecture.id)}
                            disabled={isCurrentLecture}
                            className={`w-full flex items-center gap-2 p-2 pl-8 text-left transition-colors ${
                              isCurrentLecture
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : isSelected
                                ? 'bg-orange-50 text-orange-700'
                                : 'hover:bg-gray-50 text-gray-700'
                            }`}
                          >
                            <FolderOpen className={`w-4 h-4 ${
                              isCurrentLecture ? 'text-gray-400' : 'text-purple-500'
                            }`} />
                            <span className="text-sm flex-1">{lecture.attributes.title}</span>
                            {isCurrentLecture && (
                              <span className="text-xs text-gray-400">(Current)</span>
                            )}
                            {isSelected && (
                              <CheckCircle2 className="w-4 h-4 text-orange-600" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {selectedTarget && (
            <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-orange-800">
                <span className="font-medium">Target:</span>{' '}
                {(() => {
                  for (const course of courses) {
                    const lectures = lecturesByCourse[course.id] || [];
                    const lecture = lectures.find(l => l.id === selectedTarget);
                    if (lecture) {
                      return `${course.attributes.title} > ${lecture.attributes.title}`;
                    }
                  }
                  return 'Selected Lecture';
                })()}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!selectedTarget || isLoading}
            className={`flex-1 px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${
              mode === 'copy'
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-purple-600 hover:bg-purple-700'
            }`}
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isLoading
              ? mode === 'copy' ? 'Copying...' : 'Moving...'
              : mode === 'copy' ? 'Copy Chapter' : 'Move Chapter'}
          </button>
        </div>
      </div>
    </div>
  );
}

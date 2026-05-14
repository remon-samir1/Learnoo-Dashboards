'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import {
  ClipboardList,
  Plus,
  CheckCircle2,
  XCircle,
  Reply,
  Trash2,
  Edit,
  BarChart3,
  Copy,
  ChevronDown,
  ChevronRight,
  FolderOpen,
  BookOpen
} from 'lucide-react';
import Link from 'next/link';
import { useQuizzes, useDeleteQuiz, useUpdateQuiz, useCreateQuiz, useCreateQuizWithoutFiles } from '@/src/hooks/useQuizzes';
import { useChapters } from '@/src/hooks/useChapters';
import { useCourses } from '@/src/hooks/useCourses';
import { useUniversities } from '@/src/hooks/useUniversities';
import { useFaculties } from '@/src/hooks/useFaculties';
import { useCenters } from '@/src/hooks/useCenters';
import { useDepartments } from '@/src/hooks/useDepartments';
import { AdminPageHeader } from '@/src/components/admin/AdminPageHeader';
import { DataTable, Column } from '@/src/components/ui/DataTable';
import { DeleteModal } from '@/src/components/ui/DeleteModal';
import type { Quiz, University, Faculty, Center, Department, Course } from '@/src/types';

type NodeType = 'university' | 'faculty' | 'center' | 'department' | 'course';

interface TreeNode {
  id: string;
  type: NodeType;
  name: string;
  data: University | Faculty | Center | Department | Course;
  children: TreeNode[];
  level: number;
  parentId?: string | null;
}

function buildCourseTree(
  universities: University[],
  faculties: Faculty[],
  centers: Center[],
  departments: Department[],
  courses: Course[]
): TreeNode[] {
  const universityMap = new Map<string, TreeNode>();
  const facultyMap = new Map<string, TreeNode>();
  const centerMap = new Map<string, TreeNode>();
  const departmentMap = new Map<string, TreeNode>();
  const courseMap = new Map<string, TreeNode>();

  universities.forEach((univ) => {
    const univNode: TreeNode = {
      id: `univ-${univ.id}`,
      type: 'university',
      name: univ.attributes.name,
      data: univ,
      children: [],
      level: 0,
    };
    universityMap.set(univ.id, univNode);
  });

  faculties.forEach((faculty) => {
    const facultyNode: TreeNode = {
      id: `faculty-${faculty.id}`,
      type: 'faculty',
      name: faculty.attributes.name,
      data: faculty,
      children: [],
      level: 0,
    };
    facultyMap.set(faculty.id, facultyNode);
  });

  centers.forEach((center) => {
    const centerNode: TreeNode = {
      id: `center-${center.id}`,
      type: 'center',
      name: center.name,
      data: center,
      children: [],
      level: 0,
    };
    centerMap.set(center.id, centerNode);

    if (center.childrens && Array.isArray(center.childrens)) {
      center.childrens.forEach((child) => {
        const childType = child.type || "department";
        if (childType === "faculty") {
          const facultyNode: TreeNode = {
            id: `faculty-${child.id}`,
            type: "faculty",
            name: child.attributes.name,
            data: { id: child.id, type: "faculty", attributes: child.attributes } as Faculty,
            children: [],
            level: centerNode.level + 1,
            parentId: centerNode.id,
          };
          facultyMap.set(child.id, facultyNode);
          centerNode.children.push(facultyNode);
        }
      });

      center.childrens.forEach((child) => {
        const childType = child.type || "department";
        if (childType !== "faculty") {
          const deptNode: TreeNode = {
            id: `dept-${child.id}`,
            type: "department",
            name: child.attributes.name,
            data: { id: child.id, type: "department", attributes: child.attributes } as Department,
            children: [],
            level: centerNode.level + 1,
            parentId: centerNode.id,
          };
          const parentFacultyId = (child.attributes as any).parent?.data?.id;
          if (parentFacultyId && facultyMap.has(String(parentFacultyId))) {
            const parentFaculty = facultyMap.get(String(parentFacultyId))!;
            deptNode.level = parentFaculty.level + 1;
            deptNode.parentId = parentFaculty.id;
            parentFaculty.children.push(deptNode);
          } else {
            centerNode.children.push(deptNode);
          }
          departmentMap.set(child.id, deptNode);
        }
      });
    }
  });

  departments.forEach((dept) => {
    if (departmentMap.has(dept.id)) return;
    const deptNode: TreeNode = {
      id: `dept-${dept.id}`,
      type: 'department',
      name: dept.attributes.name,
      data: dept,
      children: [],
      level: 0,
    };
    departmentMap.set(dept.id, deptNode);
  });

  courses.forEach((course) => {
    const courseNode: TreeNode = {
      id: `course-${course.id}`,
      type: 'course',
      name: course.attributes.title,
      data: course,
      children: [],
      level: 0,
    };
    courseMap.set(course.id, courseNode);
  });

  const rootNodes: TreeNode[] = [];

  universityMap.forEach((univ) => {
    rootNodes.push(univ);
  });

  centers.forEach((center) => {
    const node = centerMap.get(center.id);
    if (!node) return;
    const parentId = center.parent?.data?.id || center.parent_id;
    if (parentId && universityMap.has(String(parentId))) {
      universityMap.get(String(parentId))!.children.push(node);
      node.level = 1;
    } else {
      node.level = 0;
      rootNodes.push(node);
    }
  });

  facultyMap.forEach((faculty) => {
    if (faculty.parentId) return;
    const parentId = (faculty.data as Faculty).attributes.parent?.data?.id;
    if (parentId && universityMap.has(parentId)) {
      universityMap.get(parentId)!.children.push(faculty);
      faculty.level = 1;
    }
  });

  const processedDeptIds = new Set<string>();
  departmentMap.forEach((dept) => {
    if (processedDeptIds.has(dept.id)) return;
    processedDeptIds.add(dept.id);
    if (dept.parentId) return;
    const parentId = (dept.data as Department).attributes.parent?.data?.id;
    const centerId = (dept.data as Department).attributes.center_id;
    if (parentId && facultyMap.has(parentId)) {
      facultyMap.get(parentId)!.children.push(dept);
      dept.level = 2;
      dept.parentId = facultyMap.get(parentId)!.id;
    } else if (centerId) {
      let centerNode = centerMap.get(String(centerId));
      if (!centerNode) centerNode = centerMap.get(`center-${centerId}`);
      if (centerNode) {
        centerNode.children.push(dept);
        dept.level = 2;
        dept.parentId = centerNode.id;
      }
    } else if (parentId) {
      let parentDept = departmentMap.get(parentId);
      if (!parentDept) parentDept = departmentMap.get(`dept-${parentId}`);
      if (!parentDept) {
        for (const [key, d] of departmentMap) {
          if (key === parentId || key === `dept-${parentId}` || d.id === parentId || d.id === `dept-${parentId}`) {
            parentDept = d;
            break;
          }
        }
      }
      if (parentDept) {
        parentDept.children.push(dept);
        dept.level = parentDept.level + 1;
        dept.parentId = parentDept.id;
      }
    } else {
      dept.level = 1;
      rootNodes.push(dept);
    }
  });

  courseMap.forEach((course) => {
    const deptId =
      (course.data as Course).attributes.department?.data?.id ||
      (course.data as Course).attributes.category?.data?.id;
    if (deptId && departmentMap.has(String(deptId))) {
      const dept = departmentMap.get(String(deptId))!;
      course.level = dept.level + 1;
      course.parentId = dept.id;
      dept.children.push(course);
    }
  });

  return rootNodes;
}

interface CourseTreeItemProps {
  node: TreeNode;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  onSelect: (node: TreeNode) => void;
  selectedCourseId: string;
}

function CourseTreeItem({ node, expanded, onToggle, onSelect, selectedCourseId }: CourseTreeItemProps) {
  const isExpanded = expanded.has(node.id);
  const hasChildren = node.children.length > 0;
  const isSelected = node.type === 'course' && selectedCourseId === node.id.replace('course-', '');

  const getNodeIcon = (type: NodeType) => {
    switch (type) {
      case 'university': return <FolderOpen className="w-4 h-4 text-blue-500" />;
      case 'faculty': return <FolderOpen className="w-4 h-4 text-purple-500" />;
      case 'center': return <FolderOpen className="w-4 h-4 text-green-500" />;
      case 'department': return <FolderOpen className="w-4 h-4 text-orange-500" />;
      case 'course': return <BookOpen className="w-4 h-4 text-indigo-500" />;
      default: return <FolderOpen className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="select-none">
      <div
        className={`flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors ${
          isSelected ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700'
        }`}
        style={{ paddingLeft: `${node.level * 24 + 12}px` }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (node.type === 'course') {
            onSelect(node);
          } else {
            onToggle(node.id);
          }
        }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggle(node.id);
            }}
            className="flex-shrink-0 w-5 h-5 flex items-center justify-center"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )}
          </button>
        ) : (
          <div className="w-5" />
        )}
        {getNodeIcon(node.type)}
        <span className="text-sm">{node.name}</span>
      </div>
      {hasChildren && isExpanded && (
        <div>
          {node.children.map((child) => (
            <CourseTreeItem
              key={child.id}
              node={child}
              expanded={expanded}
              onToggle={onToggle}
              onSelect={onSelect}
              selectedCourseId={selectedCourseId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ExamsPage() {
  const t = useTranslations();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [selectedCourseForCopy, setSelectedCourseForCopy] = useState<string>('');

  const { data: quizzesData, isLoading, error, refetch } = useQuizzes();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);

  // Sync local state with API data
  useEffect(() => {
    if (quizzesData) {
      setQuizzes(quizzesData);
    }
  }, [quizzesData]);
  const { data: chapters } = useChapters();
  const { mutate: deleteQuiz, isLoading: isDeleting } = useDeleteQuiz();
  const { mutate: updateQuiz } = useUpdateQuiz();
  const { data: courses } = useCourses();
  const { data: universities } = useUniversities();
  const { data: faculties } = useFaculties();
  const { data: centers } = useCenters();
  const { data: departments } = useDepartments();

  // Tree selection state for copy modal
  const [courseTreeExpanded, setCourseTreeExpanded] = useState<Set<string>>(new Set());

  const handleDelete = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedQuiz) return;

    const deletedId = selectedQuiz.id;

    try {
      // Immediately remove from UI
      setQuizzes(prev => prev.filter(q => q.id !== deletedId));
      setDeleteModalOpen(false);
      setSelectedQuiz(null);

      // Then delete on server
      await deleteQuiz(parseInt(deletedId));
      await refetch();

      alert(t('exams.deleteSuccess'));
    } catch {
      // Restore on error
      await refetch();
    }
  };

  const { mutate: createQuiz } = useCreateQuiz();
  const { mutate: createQuizWithoutFiles } = useCreateQuizWithoutFiles();

  const handleCopy = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setSelectedCourseForCopy('');
    setCopyModalOpen(true);
  };

  const handleConfirmCopy = async () => {
    if (!selectedQuiz || !selectedCourseForCopy) {
      alert('Please select a course for the copy');
      return;
    }

    try {
      // Convert course_id to integer properly
      const courseId = parseInt(selectedCourseForCopy);

      // Validate the conversion
      if (isNaN(courseId)) {
        alert('Invalid course selection');
        return;
      }

      // Create a copy of the quiz with a new title and selected course
      const copyData = {
        title: `${selectedQuiz.attributes.title} (Copy)`,
        course_id: courseId,
        type: selectedQuiz.attributes.type,
        duration: selectedQuiz.attributes.duration,
        total_marks: selectedQuiz.attributes.total_marks,
        passing_marks: selectedQuiz.attributes.passing_marks,
        max_attempts: selectedQuiz.attributes.max_attempts,
        is_public: selectedQuiz.attributes.is_public,
        status: 'draft' as const,
        start_time: selectedQuiz.attributes.start_time,
        end_time: selectedQuiz.attributes.end_time,
        reason: selectedQuiz.attributes.reason || undefined,
        // Reset chapter since course changed
        chapter_id: null,
        // Copy questions if they exist
        questions: selectedQuiz.attributes.questions?.map((q) => ({
          text: q.attributes.text,
          type: q.attributes.type,
          score: q.attributes.score,
          auto_correct: q.attributes.auto_correct,
          answers: q.attributes.answers?.map((ans) => ({
            text: ans.attributes.text,
            is_correct: ans.attributes.is_correct,
          })),
        })),
      };

      console.log('Copy data being sent:', copyData);
      console.log('Course ID type:', typeof copyData.course_id, copyData.course_id);
      
      // Use createQuiz instead of createQuizWithoutFiles to avoid potential auth issues
      await createQuiz(copyData as any);
      await refetch();
      setCopyModalOpen(false);
      setSelectedQuiz(null);
      setSelectedCourseForCopy('');
      alert('Exam copied successfully!');
    } catch (error) {
      console.error('Error copying exam:', error);
      alert('Failed to copy exam. Please try again.');
    }
  };

  // Build course tree for copy modal
  const courseTree = useMemo(() => {
    if (!universities || !faculties || !centers || !departments || !courses) {
      return [];
    }
    return buildCourseTree(universities, faculties, centers, departments, courses);
  }, [universities, faculties, centers, departments, courses]);

  // Handle tree node toggle for copy modal
  const handleCourseTreeToggle = (nodeId: string) => {
    setCourseTreeExpanded((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  // Handle tree node selection for copy modal
  const handleCourseTreeSelect = (node: TreeNode) => {
    if (node.type === 'course') {
      const courseId = node.id.replace('course-', '');
      console.log('Selected course from tree:', courseId, typeof courseId);
      setSelectedCourseForCopy(courseId);
    }
  };

  const getChapterName = (chapterId: number | null) => {
    if (!chapterId) return '-';
    const chapter = chapters?.find(c => parseInt(c.id) === chapterId);
    return chapter?.attributes.title || '-';
  };

  const columns: Column<Quiz>[] = [
    {
      key: 'title',
      header: t('exams.columns.title'),
      render: (item) => item.attributes.title,
    },
    {
      key: 'type',
      header: t('exams.columns.type'),
      render: (item) => (
        <span className="capitalize">{item.attributes.type}</span>
      ),
    },
    {
      key: 'chapter',
      header: t('exams.columns.chapter'),
      render: (item) => getChapterName(item.attributes.chapter_id),
    },
    {
      key: 'duration',
      header: t('exams.columns.duration'),
      render: (item) => `${item.attributes.duration} ${t('exams.minutes')}`,
    },
    {
      key: 'questions',
      header: t('exams.columns.questions'),
      render: (item) => (
        <span className="text-sm text-[#475569]">
          {item.attributes.questions?.length || 0} {t('exams.questions')}
        </span>
      ),
    },
    {
      key: 'status',
      header: t('exams.columns.status'),
      render: (item) => (
        <button
          onClick={async () => {
            try {
              await updateQuiz(parseInt(item.id), {
                status: item.attributes.status === 'active' ? 'draft' : 'active'
              });
              refetch();
            } catch {
              // Error handled by hook
            }
          }}
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-all hover:opacity-80 ${item.attributes.status === 'active'
            ? 'bg-[#E1FCEF] text-[#059669]'
            : 'bg-[#F1F5F9] text-[#64748B]'
            }`}
        >
          {item.attributes.status === 'active' ? t('exams.status.active') : t('exams.status.draft')}
        </button>
      ),
    },
    {
      key: 'visibility',
      header: t('exams.columns.visibility'),
      render: (item) => (
        <button
          onClick={async () => {
            try {
              await updateQuiz(parseInt(item.id), {
                is_public: !item.attributes.is_public
              });
              refetch();
            } catch {
              // Error handled by hook
            }
          }}
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-all hover:opacity-80 ${item.attributes.is_public
            ? 'bg-[#E0E7FF] text-[#2137D6]'
            : 'bg-[#F1F5F9] text-[#64748B]'
            }`}
        >
          {item.attributes.is_public ? t('exams.visibility.public') : t('exams.visibility.private')}
        </button>
      ),
    },
    {
      key: 'results',
      header: 'Results',
      render: (item) => (
        <Link
          href={`/exams/${item.id}/results`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#EFF6FF] text-[#2137D6] rounded-lg text-[10px] font-bold hover:bg-[#E0E7FF] transition-all"
        >
          <BarChart3 className="w-3.5 h-3.5" />
          Results
        </Link>
      ),
    }
  ];

  return (
    <div className="flex flex-col gap-6 pb-12">
      <AdminPageHeader
        title={t('exams.pageTitle')}
        description={t('exams.pageDescription')}
        actionLabel={t('exams.createExam')}
        actionHref="/exams/create"
      />

      {/* Content */}
      <div className="mt-2">
        <DataTable
          data={quizzes || []}
          columns={columns}
          isLoading={isLoading}
          keyExtractor={(item) => item.id}
          onDelete={handleDelete}
          onCopy={handleCopy}
          editHref={(item) => `/exams/edit/${item.id}`}
          emptyMessage={t('exams.noExams')}
        />
        <DeleteModal
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setSelectedQuiz(null);
          }}
          onConfirm={handleConfirmDelete}
          title={t('exams.pageTitle')}
          itemName={selectedQuiz?.attributes.title || ''}
          isLoading={isDeleting}
        />
        
        {/* Copy Modal */}
        {copyModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
              <div className="px-6 py-4 border-b border-[#F1F5F9]">
                <h2 className="text-lg font-bold text-[#1E293B]">Copy Exam to Course</h2>
                <p className="text-sm text-[#64748B] mt-1">
                  Select a course to copy "{selectedQuiz?.attributes.title}" to
                </p>
              </div>
              
              <div className="p-6">
                <div className="flex flex-col gap-2 mb-4">
                  <label className="text-[13px] font-bold text-[#475569]">Select Course <span className="text-[#EF4444]">*</span></label>
                  <div className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl min-h-[200px] max-h-[300px] overflow-y-auto">
                    {courseTree.map((node) => (
                      <CourseTreeItem
                        key={node.id}
                        node={node}
                        expanded={courseTreeExpanded}
                        onToggle={handleCourseTreeToggle}
                        onSelect={handleCourseTreeSelect}
                        selectedCourseId={selectedCourseForCopy}
                      />
                    ))}
                  </div>
                  {selectedCourseForCopy && (
                    <p className="text-sm text-[#10B981] mt-2">
                      Selected: {courses?.find(c => c.id === selectedCourseForCopy)?.attributes.title}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="px-6 py-4 border-t border-[#F1F5F9] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setCopyModalOpen(false);
                    setSelectedQuiz(null);
                    setSelectedCourseForCopy('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-[#64748B] hover:text-[#1E293B] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCopy}
                  disabled={!selectedCourseForCopy}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#2137D6] hover:bg-[#1E2EB8] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  Copy Exam
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";

import { useTranslations } from "next-intl";

import {
  useDepartments,
  useDeleteDepartment,
  useCreateDepartment,
  useUpdateDepartment,
} from "@/src/hooks/useDepartments";

import {
  useUniversities,
  useDeleteUniversity,
  useCreateUniversity,
  useUpdateUniversity,
} from "@/src/hooks/useUniversities";

import {
  useFaculties,
  useDeleteFaculty,
  useCreateFaculty,
  useUpdateFaculty,
} from "@/src/hooks/useFaculties";

import {
  useCenters,
  useDeleteCenter,
  useCreateCenter,
  useUpdateCenter,
} from "@/src/hooks/useCenters";

import {
  useCourses,
  useDeleteCourse,
  useCreateCourse,
  useUpdateCourse,
} from "@/src/hooks/useCourses";

import { useCreateLecture, useUpdateLecture } from "@/src/hooks/useLectures";

import {
  useCreateChapter,
  useUpdateChapter,
  useCopyChapter,
} from "@/src/hooks/useChapters";

import { useCreateNote, useUpdateNote, useNotes } from "@/src/hooks/useNotes";

import {
  useCodes,
  useDeleteCode,
  useActivateCode,
  useUploadPreActivation,
  useCreateCode,
} from "@/src/hooks";

import { useStudents } from "@/src/hooks/useStudents";

import { api } from "@/src/lib/api";

import {
  GraduationCap,
  ChevronRight,
  ChevronDown,
  GitBranch,
  Edit2,
  Trash2,
  Users,
  BookOpen,
  FolderOpen,
  PlayCircle,
  Key,
  Plus,
  X,
  Upload,
  Copy,
  ArrowRightLeft,
  FileVideo,
  Image as ImageIcon,
  CheckCircle2,
  Loader2,
  Building2,
  Award,
  MapPin,
  FileText,
  Power,
  Search,
} from "lucide-react";

import { DeleteModal } from "@/src/components/ui/DeleteModal";

import { toast } from "react-hot-toast";

import Link from "next/link";

import type {
  Department,
  Course,
  Lecture,
  Chapter,
  University,
  Faculty,
  Center,
  Note,
} from "@/src/types";

type NodeType =
  | "university"
  | "faculty"
  | "center"
  | "department"
  | "course"
  | "lecture"
  | "chapter"
  | "note";

interface TreeNode {
  id: string;

  type: NodeType;

  name: string;

  data:
    | University
    | Faculty
    | Center
    | Department
    | Course
    | Lecture
    | Chapter
    | Note;

  children: TreeNode[];

  level: number;

  parentId?: string | null;

  stats?: {
    courses?: number;

    students?: number;

    lectures?: number;

    chapters?: number;

    notes?: number;
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
  universities: University[],

  faculties: Faculty[],

  centers: Center[],

  departments: Department[],

  courses: Course[],

  lecturesByCourse: Record<string, Lecture[]>,

  chaptersByLecture: Record<string, Chapter[]>,

  notes: Note[],
): TreeNode[] {
  const universityMap = new Map<string, TreeNode>();

  const facultyMap = new Map<string, TreeNode>();

  const centerMap = new Map<string, TreeNode>();

  const departmentMap = new Map<string, TreeNode>();

  const courseMap = new Map<string, TreeNode>();

  // Create university nodes

  universities.forEach((univ) => {
    const univNode: TreeNode = {
      id: `univ-${univ.id}`,

      type: "university",

      name: univ.attributes.name,

      data: univ,

      children: [],

      level: 0,

      meta: {
        code: univ.attributes.code || undefined,
      },
    };

    universityMap.set(univ.id, univNode);
  });

  // Create faculty nodes

  faculties.forEach((faculty) => {
    const facultyNode: TreeNode = {
      id: `faculty-${faculty.id}`,

      type: "faculty",

      name: faculty.attributes.name,

      data: faculty,

      children: [],

      level: 0,

      stats: {
        courses: faculty.attributes.stats?.courses || 0,

        students: faculty.attributes.stats?.students || 0,
      },
    };

    facultyMap.set(faculty.id, facultyNode);
  });

  // Create center nodes and process their childrens (departments or faculties)

  centers.forEach((center) => {
    const centerNode: TreeNode = {
      id: `center-${center.id}`,

      type: "center",

      name: center.name,

      data: center,

      children: [],

      level: 0,
    };

    centerMap.set(center.id, centerNode);

    // Process center's childrens (departments or faculties) if available

    if (center.childrens && Array.isArray(center.childrens)) {
      // First pass: create all faculty nodes and add to center

      center.childrens.forEach((child) => {
        const childType = child.type || "department";

        if (childType === "faculty") {
          const facultyNode: TreeNode = {
            id: `faculty-${child.id}`,

            type: "faculty",

            name: child.attributes.name,

            data: {
              id: child.id,

              type: "faculty",

              attributes: child.attributes,
            } as Faculty,

            children: [],

            level: centerNode.level + 1,

            parentId: centerNode.id,

            stats: {
              courses: child.attributes.stats?.courses || 0,

              students: child.attributes.stats?.students || 0,
            },
          };

          facultyMap.set(child.id, facultyNode);

          centerNode.children.push(facultyNode);
        }
      });

      // Second pass: create department nodes and assign to correct parent

      center.childrens.forEach((child) => {
        const childType = child.type || "department";

        if (childType !== "faculty") {
          const deptNode: TreeNode = {
            id: `dept-${child.id}`,

            type: "department",

            name: child.attributes.name,

            data: {
              id: child.id,

              type: "department",

              attributes: child.attributes,
            } as Department,

            children: [],

            level: centerNode.level + 1,

            parentId: centerNode.id,

            stats: {
              courses: child.attributes.stats?.courses || 0,

              students: child.attributes.stats?.students || 0,
            },

            meta: {
              code: child.attributes.code || undefined,
            },
          };

          // Check if department has a faculty parent and nest it there

          const parentFacultyId = (child.attributes as any).parent?.data?.id;

          if (parentFacultyId && facultyMap.has(String(parentFacultyId))) {
            const parentFaculty = facultyMap.get(String(parentFacultyId))!;

            deptNode.level = parentFaculty.level + 1;

            deptNode.parentId = parentFaculty.id;

            parentFaculty.children.push(deptNode);
          } else {
            // No faculty parent, add to center

            centerNode.children.push(deptNode);
          }

          departmentMap.set(child.id, deptNode);
        }
      });
    }
  });

  // Create department nodes

  departments.forEach((dept) => {
    const deptNode: TreeNode = {
      id: `dept-${dept.id}`,

      type: "department",

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
      },
    };

    departmentMap.set(dept.id, deptNode);
  });

  // Build strict hierarchy: Universities -> Centers -> Faculties -> Departments -> Sub-departments

  const rootNodes: TreeNode[] = [];

  // Add universities as root nodes (level 0)

  universityMap.forEach((univ) => {
    rootNodes.push(univ);
  });

  // Build center hierarchy under universities (level 1), with fallback to root

  centers.forEach((center) => {
    const node = centerMap.get(center.id)!;

    const parentId = center.parent?.data?.id || center.parent_id;

    if (parentId && universityMap.has(String(parentId))) {
      const parent = universityMap.get(String(parentId))!;

      node.level = parent.level + 1;

      node.parentId = parent.id;

      parent.children.push(node);
    } else {
      // Root-level center (if no university parent)

      node.level = 0;

      rootNodes.push(node);
    }
  });

  // Update faculty levels for faculties created from center.childrens

  // They were created with level=centerNode.level+1 when centerNode.level was 0

  function updateChildLevels(parent: TreeNode) {
    parent.children.forEach((child) => {
      child.level = parent.level + 1;

      updateChildLevels(child);
    });
  }

  centerMap.forEach((centerNode) => {
    updateChildLevels(centerNode);
  });

  // Build faculty hierarchy under centers (level 2)

  faculties.forEach((faculty) => {
    const node = facultyMap.get(faculty.id)!;

    const parentId = faculty.attributes.parent?.data?.id;

    if (parentId && centerMap.has(String(parentId))) {
      const parent = centerMap.get(String(parentId))!;

      node.level = parent.level + 1;

      node.parentId = parent.id;

      parent.children.push(node);
    }

    // Faculties without center parent are not added (must be under center)
  });

  // Build department hierarchy under faculties (level 3) or sub-departments (level 4+)

  departments.forEach((dept) => {
    const node = departmentMap.get(dept.id)!;

    const parentId = dept.attributes.parent?.data?.id;

    if (parentId) {
      // First try faculty parent (departments under faculties)

      if (facultyMap.has(String(parentId))) {
        const parent = facultyMap.get(String(parentId))!;

        node.level = parent.level + 1;

        node.parentId = parent.id;

        parent.children.push(node);
      } else if (departmentMap.has(String(parentId))) {
        // Parent is another department (sub-department)

        const parent = departmentMap.get(String(parentId))!;

        node.level = parent.level + 1;

        node.parentId = parent.id;

        parent.children.push(node);
      }
    }

    // Departments without faculty or department parent are not added (must be under faculty or department)
  });

  // Sort department children by order field

  const sortDepartmentsByOrder = (node: TreeNode) => {
    if (node.children.length === 0) return;

    // Sort department children by order

    node.children.sort((a, b) => {
      if (a.type === "department" && b.type === "department") {
        const orderA = (a.data as Department).attributes.order || 0;

        const orderB = (b.data as Department).attributes.order || 0;

        return orderA - orderB;
      }

      return 0;
    });

    // Recursively sort children

    node.children.forEach(sortDepartmentsByOrder);
  };

  // Apply sorting to all nodes

  rootNodes.forEach(sortDepartmentsByOrder);

  // Add courses to their departments

  courses.forEach((course) => {
    const courseNode: TreeNode = {
      id: `course-${course.id}`,

      type: "course",

      name: course.attributes.title,

      data: course,

      children: [],

      level: 0,

      stats: {
        lectures: course.attributes.stats?.lectures || 0,

        students: course.attributes.stats?.students || 0,
      },

      meta: {
        status: course.attributes.status === 1 ? "active" : "draft",

        thumbnail: course.attributes.thumbnail,
      },
    };

    courseMap.set(course.id, courseNode);

    const deptId =
      course.attributes.department?.data?.id ||
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

    lectures.forEach((lecture) => {
      const lectureNode: TreeNode = {
        id: `lecture-${courseId}-${lecture.id}`,

        type: "lecture",

        name: lecture.attributes.title,

        data: lecture,

        children: [],

        level: courseNode.level + 1,

        parentId: courseNode.id,

        stats: {
          chapters: lecture.attributes.chapters?.length || 0,
        },
      };

      courseNode.children.push(lectureNode);

      const chapterKey = `${courseId}-${lecture.id}`;

      const chapters = chaptersByLecture[chapterKey] || [];

      chapters.forEach((chapter) => {
        const chapterNode: TreeNode = {
          id: `chapter-${chapterKey}-${chapter.id}`,

          type: "chapter",

          name: chapter.attributes.title,

          data: chapter,

          children: [],

          level: lectureNode.level + 1,

          parentId: lectureNode.id,

          meta: {
            duration: chapter.attributes.duration,

            isFree: chapter.attributes.is_free_preview === 1,
          },
        };

        lectureNode.children.push(chapterNode);
      });
    });
  });

  // Add notes to their courses

  notes.forEach((note) => {
    const courseId = note.attributes.course_id?.toString();

    if (!courseId) return;

    const courseNode = courseMap.get(courseId);

    if (!courseNode) return;

    const noteNode: TreeNode = {
      id: `note-${note.id}`,

      type: "note",

      name: note.attributes.title,

      data: note,

      children: [],

      level: courseNode.level + 1,

      parentId: courseNode.id,

      meta: {
        status: note.attributes.is_publish ? "published" : "draft",
      },
    };

    courseNode.children.push(noteNode);
  });

  return rootNodes;
}

// Filter tree based on search query

function filterTree(nodes: TreeNode[], query: string): TreeNode[] {
  if (!query.trim()) return nodes;

  const lowerQuery = query.toLowerCase();

  return nodes.reduce<TreeNode[]>((acc, node) => {
    const matchesNode =
      node.name.toLowerCase().includes(lowerQuery) ||
      (node.meta?.code?.toLowerCase() || "").includes(lowerQuery);

    const filteredChildren = filterTree(node.children, query);

    if (matchesNode || filteredChildren.length > 0) {
      acc.push({
        ...node,

        children: matchesNode ? node.children : filteredChildren,
      });
    }

    return acc;
  }, []);
}

// Type icons and colors

const typeIcons: Record<NodeType, React.ReactNode> = {
  university: <Building2 className="w-4 h-4" />,

  faculty: <Award className="w-4 h-4" />,

  center: <MapPin className="w-4 h-4" />,

  department: <GraduationCap className="w-4 h-4" />,

  course: <BookOpen className="w-4 h-4" />,

  lecture: <FolderOpen className="w-4 h-4" />,

  chapter: <PlayCircle className="w-4 h-4" />,

  note: <FileText className="w-4 h-4" />,
};

const typeColors: Record<NodeType, string> = {
  university: "text-indigo-600 bg-indigo-50 border-indigo-200",

  faculty: "text-pink-600 bg-pink-50 border-pink-200",

  center: "text-teal-600 bg-teal-50 border-teal-200",

  department: "text-blue-600 bg-blue-50 border-blue-200",

  course: "text-green-600 bg-green-50 border-green-200",

  lecture: "text-purple-600 bg-purple-50 border-purple-200",

  chapter: "text-orange-600 bg-orange-50 border-orange-200",

  note: "text-cyan-600 bg-cyan-50 border-cyan-200",
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

  onCopyMove?: (node: TreeNode, mode: "copy" | "move") => void;

  onDrop?: (draggedNode: TreeNode, targetNode: TreeNode) => void;

  draggedNodeId?: string | null;

  isSelected: boolean;
}

function TreeItem({
  node,
  expanded,
  onToggle,
  onDelete,
  onSelect,
  onEdit,
  onAdd,
  onCopyMove,
  onDrop,
  draggedNodeId,
  isSelected,
}: TreeItemProps) {
  const t = useTranslations();

  const isExpanded = expanded.has(node.id);

  const hasChildren = node.children.length > 0;

  // Sub-department only when parent is a department (not when parent is center)

  const isSubDepartment =
    node.type === "department" && node.parentId?.startsWith("dept-");

  const isDraft = node.meta?.status === "draft";

  const isDraggable = node.type === "department";

  const isDragging = draggedNodeId === node.id;

  const handleDragStart = (e: React.DragEvent) => {
    if (!isDraggable) return;

    e.dataTransfer.setData("text/plain", node.id);

    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!isDraggable || node.id === draggedNodeId) return;

    e.preventDefault();

    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent) => {
    if (!isDraggable || !onDrop) return;

    e.preventDefault();

    const draggedId = e.dataTransfer.getData("text/plain");

    if (draggedId === node.id) return;

    // The dragged node data should be available via the parent's state

    // Pass the dragged ID and let the parent find the actual node

    onDrop({ id: draggedId, type: "department" } as TreeNode, node);
  };

  return (
    <div className="select-none">
      <div
        onClick={() => onSelect(node)}
        draggable={isDraggable}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all hover:shadow-sm cursor-pointer ${isDragging ? "opacity-50 border-dashed border-blue-400" : ""} ${
          isSelected
            ? "bg-blue-50 border-blue-300 shadow-sm"
            : "bg-white border-gray-200 hover:border-gray-300"
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
            hasChildren
              ? "hover:bg-gray-100 text-gray-500"
              : "text-transparent cursor-default"
          }`}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )
          ) : (
            <span className="w-4 h-4" />
          )}
        </button>

        {/* Type Icon or Image */}

        {node.type === "university" &&
        (node.data as University).attributes.image ? (
          <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
            <img
              src={(node.data as University).attributes.image || undefined}
              alt={node.name}
              className="w-full h-full object-cover"
            />
          </div>
        ) : node.type === "faculty" &&
          (node.data as Faculty).attributes.image ? (
          <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
            <img
              src={(node.data as Faculty).attributes.image || undefined}
              alt={node.name}
              className="w-full h-full object-cover"
            />
          </div>
        ) : node.type === "center" && (node.data as Center).image ? (
          <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
            <img
              src={(node.data as Center).image || undefined}
              alt={node.name}
              className="w-full h-full object-cover"
            />
          </div>
        ) : node.type === "department" &&
          (node.data as Department).attributes.image ? (
          <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
            <img
              src={(node.data as Department).attributes.image || undefined}
              alt={node.name}
              className="w-full h-full object-cover"
            />
          </div>
        ) : node.type === "course" &&
          (node.data as Course).attributes.thumbnail ? (
          <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
            <img
              src={(node.data as Course).attributes.thumbnail || undefined}
              alt={node.name}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${typeColors[node.type]}`}
          >
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
                {t("courses.draft")}
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
                  {t("departments.subDepartment")}
                </span>
              </>
            )}
          </div>

          {/* Meta info */}

          <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
            {node.meta?.code && <span>{node.meta.code}</span>}

            {node.meta?.duration && <span>{node.meta.duration}</span>}

            {node.type === "lecture" &&
              (node.data as Lecture).attributes.description && (
                <span className="truncate max-w-[200px]">
                  {(node.data as Lecture).attributes.description}
                </span>
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

        <div
          className="flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Add child buttons */}

          {node.type === "university" && (
            <button
              onClick={() => onAdd("center", node.id)}
              className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all"
              title="Add center"
            >
              <MapPin className="w-4 h-4" />
            </button>
          )}

          {node.type === "center" && (
            <button
              onClick={() => onAdd("faculty", node.id)}
              className="p-1.5 text-gray-400 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-all"
              title="Add faculty"
            >
              <Award className="w-4 h-4" />
            </button>
          )}

          {node.type === "faculty" && (
            <button
              onClick={() => onAdd("department", node.id)}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
              title="Add department"
            >
              <GraduationCap className="w-4 h-4" />
            </button>
          )}

          {node.type === "department" && (
            <>
              <button
                onClick={() => onAdd("department", node.id)}
                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                title="Add sub-department"
              >
                <GraduationCap className="w-4 h-4" />
              </button>

              <button
                onClick={() => onAdd("course", node.id)}
                className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                title="Add course"
              >
                <BookOpen className="w-4 h-4" />
              </button>
            </>
          )}

          {node.type === "course" && (
            <>
              <button
                onClick={() => onAdd("note", node.id)}
                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                title="Add note/summary"
              >
                <FileText className="w-4 h-4" />
              </button>

              <button
                onClick={() => onAdd("lecture", node.id)}
                className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                title="Add lecture"
              >
                <Plus className="w-4 h-4" />
              </button>
            </>
          )}

          {node.type === "lecture" && (
            <button
              onClick={() => onAdd("chapter", node.id)}
              className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
              title="Add lesson"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}

          {node.type === "chapter" && onCopyMove && (
            <>
              <button
                onClick={() => onCopyMove(node, "copy")}
                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                title="Copy lesson"
              >
                <Copy className="w-4 h-4" />
              </button>

              <button
                onClick={() => onCopyMove(node, "move")}
                className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                title="Move lesson"
              >
                <ArrowRightLeft className="w-4 h-4" />
              </button>
            </>
          )}

          {/* Edit button */}

          <button
            onClick={() => onEdit(node)}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
            title={t("common.edit")}
          >
            <Edit2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => onDelete(node)}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
            title={t("common.delete")}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Children */}

      {hasChildren && isExpanded && (
        <div className="mt-1 space-y-1">
          {node.children.map((child) => (
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
              onDrop={onDrop}
              draggedNodeId={draggedNodeId}
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

  const [searchQuery, setSearchQuery] = useState("");

  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);

  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);

  const [viewNode, setViewNode] = useState<TreeNode | null>(null);

  const [lecturesByCourse, setLecturesByCourse] = useState<
    Record<string, Lecture[]>
  >({});

  const [chaptersByLecture, setChaptersByLecture] = useState<
    Record<string, Chapter[]>
  >({});

  // Modal states

  const [editModalOpen, setEditModalOpen] = useState(false);

  const [addModalOpen, setAddModalOpen] = useState(false);

  const [addType, setAddType] = useState<NodeType | null>(null);

  const [addParentId, setAddParentId] = useState<string | null>(null);

  const {
    data: universities,
    isLoading: univsLoading,
    refetch: refetchUnivs,
  } = useUniversities();

  const {
    data: faculties,
    isLoading: facultiesLoading,
    refetch: refetchFaculties,
  } = useFaculties();

  const {
    data: centers,
    isLoading: centersLoading,
    refetch: refetchCenters,
  } = useCenters();

  const {
    data: departments,
    isLoading: deptsLoading,
    error,
    refetch: refetchDepts,
  } = useDepartments();

  const {
    data: courses,
    isLoading: coursesLoading,
    refetch: refetchCourses,
  } = useCourses({});

  const { data: notes, isLoading: notesLoading } = useNotes();

  const {
    data: codes,
    isLoading: codesLoading,
    refetch: refetchCodes,
  } = useCodes();

  const { mutate: deleteCode } = useDeleteCode();

  const { mutate: activateCode, isLoading: isActivating } = useActivateCode();

  const { mutate: uploadPreActivation, isLoading: isUploadingPreActivation } =
    useUploadPreActivation();

  const { data: students } = useStudents();

  const { mutate: deleteDepartment } = useDeleteDepartment();

  const { mutate: deleteCourse } = useDeleteCourse();

  const { mutate: deleteUniversity } = useDeleteUniversity();

  const { mutate: deleteFaculty } = useDeleteFaculty();

  const { mutate: deleteCenter } = useDeleteCenter();

  // Create/Update hooks

  const { mutate: createUniversity, isLoading: isCreatingUniv } =
    useCreateUniversity();

  const { mutate: updateUniversity, isLoading: isUpdatingUniv } =
    useUpdateUniversity();

  const { mutate: createFaculty, isLoading: isCreatingFaculty } =
    useCreateFaculty();

  const { mutate: updateFaculty, isLoading: isUpdatingFaculty } =
    useUpdateFaculty();

  const { mutate: createCenter, isLoading: isCreatingCenter } =
    useCreateCenter();

  const { mutate: updateCenter, isLoading: isUpdatingCenter } =
    useUpdateCenter();

  const { mutate: createDepartment, isLoading: isCreatingDept } =
    useCreateDepartment();

  const { mutate: updateDepartment, isLoading: isUpdatingDept } =
    useUpdateDepartment();

  const { mutate: createCourse, isLoading: isCreatingCourse } =
    useCreateCourse();

  const { mutate: updateCourse, isLoading: isUpdatingCourse } =
    useUpdateCourse();

  const { mutate: createLecture, isLoading: isCreatingLecture } =
    useCreateLecture();

  const { mutate: updateLecture, isLoading: isUpdatingLecture } =
    useUpdateLecture();

  const {
    mutate: createChapter,
    isLoading: isCreatingChapter,
    progress: createChapterProgress,
    reset: resetCreateChapter,
  } = useCreateChapter();

  const {
    mutate: updateChapter,
    isLoading: isUpdatingChapter,
    progress: updateChapterProgress,
    reset: resetUpdateChapter,
  } = useUpdateChapter();

  const { mutate: copyChapter, isLoading: isCopyingChapter } = useCopyChapter();

  const { mutate: createCode, isLoading: isCreatingCode } = useCreateCode();

  const { mutate: createNote, isLoading: isCreatingNote } = useCreateNote();

  const { mutate: updateNote, isLoading: isUpdatingNote } = useUpdateNote();

  // Handle department reordering via drag and drop

  const handleDrop = async (draggedNode: TreeNode, targetNode: TreeNode) => {
    if (draggedNode.type !== "department" || targetNode.type !== "department")
      return;

    // Find the actual dragged department from the data

    const draggedDept = departments?.find(
      (dept) => dept.id === draggedNode.id.replace("dept-", ""),
    );

    const targetDept = targetNode.data as Department;

    if (!draggedDept) return;

    // Initialize order values for departments that don't have them

    const siblings =
      departments?.filter((dept) => {
        const draggedParentId = draggedDept.attributes.parent?.data?.id;

        const targetParentId = targetDept.attributes.parent?.data?.id;

        const draggedCenterId = draggedDept.attributes.center_id;

        const targetCenterId = targetDept.attributes.center_id;

        if (draggedParentId && targetParentId) {
          return dept.attributes.parent?.data?.id === draggedParentId;
        }

        if (draggedCenterId && targetCenterId) {
          return (
            dept.attributes.center_id === draggedCenterId &&
            !dept.attributes.parent?.data?.id
          );
        }

        return false;
      }) || [];

    // If siblings don't have order values, initialize them

    const hasNoOrder = siblings.some(
      (s) => s.attributes.order === undefined || s.attributes.order === null,
    );

    if (hasNoOrder) {
      try {
        for (let i = 0; i < siblings.length; i++) {
          const dept = siblings[i];

          if (
            dept.attributes.order === undefined ||
            dept.attributes.order === null
          ) {
            await updateDepartment(parseInt(dept.id), {
              name: dept.attributes.name,
              order: i + 1,
            });
          }
        }

        await refetchDepts();

        return; // Wait for refetch before proceeding with reorder
      } catch (error) {
        toast.error("Failed to initialize department orders");

        return;
      }
    }

    // Calculate new order for dragged department

    const targetOrder = targetDept.attributes.order || 0;

    const draggedOrder = draggedDept.attributes.order || 0;

    // If both orders are 0, set the first one to 1 to enable drag and drop

    let adjustedTargetOrder = targetOrder;

    let adjustedDraggedOrder = draggedOrder;

    if (targetOrder === 0 && draggedOrder === 0) {
      adjustedDraggedOrder = 1;
    }

    // Update order values for all affected departments

    const updates = siblings.map((dept) => {
      const deptOrder = dept.attributes.order || 0;

      let newOrder = deptOrder;

      if (dept.id === draggedDept.id) {
        newOrder = adjustedTargetOrder;
      } else if (adjustedDraggedOrder < adjustedTargetOrder) {
        // Moving down: increment departments between old and new position

        if (
          deptOrder > adjustedDraggedOrder &&
          deptOrder <= adjustedTargetOrder
        ) {
          newOrder = deptOrder - 1;
        }
      } else {
        // Moving up: decrement departments between old and new position

        if (
          deptOrder >= adjustedTargetOrder &&
          deptOrder < adjustedDraggedOrder
        ) {
          newOrder = deptOrder + 1;
        }
      }

      return {
        id: dept.id,

        order: newOrder,
      };
    });

    // Update departments via API

    try {
      for (const update of updates) {
        const dept = departments?.find((d) => d.id === update.id);

        if (!dept) continue;

        await updateDepartment(parseInt(update.id), {
          name: dept.attributes.name,
          order: update.order,
        });
      }

      toast.success("Department order updated successfully");

      refetchDepts();
    } catch (error) {
      toast.error("Failed to update department order");
    }
  };

  // Copy/Move modal state

  const [copyMoveModalOpen, setCopyMoveModalOpen] = useState(false);

  const [copyMoveNode, setCopyMoveNode] = useState<TreeNode | null>(null);

  const [copyMoveMode, setCopyMoveMode] = useState<"copy" | "move">("copy");

  const [selectedTargetLecture, setSelectedTargetLecture] = useState("");

  // Notes modal state

  const [noteModalOpen, setNoteModalOpen] = useState(false);

  const [isEditMode, setIsEditMode] = useState(false);

  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  const [noteCourseId, setNoteCourseId] = useState<string>("");

  const [noteTitle, setNoteTitle] = useState("");

  const [noteType, setNoteType] = useState("summary");

  const [noteContent, setNoteContent] = useState("");

  const [noteLinkedLecture, setNoteLinkedLecture] = useState("");

  const [noteIsPublish, setNoteIsPublish] = useState(false);

  const [noteAttachment, setNoteAttachment] = useState<File | null>(null);

  const [noteAttachmentPreview, setNoteAttachmentPreview] = useState<string>("");

  const [noteErrors, setNoteErrors] = useState<Record<string, string>>({});

  const noteAttachmentInputRef = useRef<HTMLInputElement>(null);

  // Activation state

  const [selectedCode, setSelectedCode] = useState("");

  const [selectedStudent, setSelectedStudent] = useState("");

  const [studentSearch, setStudentSearch] = useState("");

  const [activationTab, setActivationTab] = useState<"code" | "preactivation">(
    "code",
  );

  const [preactivationNumbers, setPreactivationNumbers] = useState<string[]>(
    [],
  );

  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const [preactivationResults, setPreactivationResults] = useState<{
    success: number;
    failed: number;
    count: number;
  } | null>(null);

  const preactivationFileRef = useRef<HTMLInputElement>(null);

  // Generate Code Modal state

  const [generateCodeModalOpen, setGenerateCodeModalOpen] = useState(false);

  const [generateCodeItemType, setGenerateCodeItemType] = useState<
    "course" | "chapter" | "department"
  >("course");

  const [generateCodeItemId, setGenerateCodeItemId] = useState<string>("");

  // Extract nested data from courses

  useEffect(() => {
    if (courses) {
      const lecturesData: Record<string, Lecture[]> = {};

      const chaptersData: Record<string, Chapter[]> = {};

      courses.forEach((course) => {
        const nestedLectures = course.attributes.lectures || [];

        if (nestedLectures.length > 0) {
          lecturesData[course.id] = nestedLectures;

          nestedLectures.forEach((lecture) => {
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
    if (!departments || !courses || !universities || !faculties || !centers)
      return [];

    const tree = buildUnifiedTree(
      universities,
      faculties,
      centers,
      departments,
      courses,
      lecturesByCourse,
      chaptersByLecture,
      notes || [],
    );

    return filterTree(tree, searchQuery);
  }, [
    universities,
    faculties,
    centers,
    departments,
    courses,
    lecturesByCourse,
    chaptersByLecture,
    notes,
    searchQuery,
  ]);

  // Auto-expand when searching

  useMemo(() => {
    if (searchQuery.trim() && treeData.length > 0) {
      const allIds = new Set<string>();

      const collectIds = (nodes: TreeNode[]) => {
        nodes.forEach((node) => {
          allIds.add(node.id);

          collectIds(node.children);
        });
      };

      collectIds(treeData);

      setExpanded(allIds);
    }
  }, [searchQuery, treeData]);

  const handleToggle = (id: string) => {
    setExpanded((prev) => {
      const newSet = new Set(prev);

      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }

      return newSet;
    });
  };

  const isLoading =
    univsLoading ||
    facultiesLoading ||
    centersLoading ||
    deptsLoading ||
    coursesLoading ||
    notesLoading;

  const refetchAll = () => {
    refetchUnivs();

    refetchFaculties();

    refetchCenters();

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
        case "university":
          await deleteUniversity(rawId);

          break;

        case "faculty":
          await deleteFaculty(rawId);

          break;

        case "center":
          await deleteCenter(rawId);

          break;

        case "department":
          await deleteDepartment(rawId);

          break;

        case "course":
          await deleteCourse(rawId);

          break;

        case "lecture":
          await api.lectures.delete(rawId);

          break;

        case "chapter":
          await api.chapters.delete(rawId);

          break;
      }

      toast.success(t("common.deleteSuccess"));

      setDeleteModalOpen(false);

      setSelectedNode(null);

      refetchAll();
    } catch {
      toast.error(t("common.deleteError"));
    }
  };

  // Open edit modal

  const handleEdit = (node: TreeNode) => {
    if (node.type === "note") {
      const note = node.data as Note;

      setNoteCourseId(note.attributes.course_id?.toString() || "");

      setNoteTitle(note.attributes.title || "");

      setNoteType(note.attributes.type || "summary");

      setNoteContent(note.attributes.content || "");

      setNoteLinkedLecture(note.attributes.linked_lecture || "");

      setNoteIsPublish(note.attributes.is_publish || false);

      setNoteAttachment(null);

      setNoteAttachmentPreview(note.attributes.attachment?.url || "");

      setNoteErrors({});

      setIsEditMode(true);

      setEditingNoteId(note.id);

      setNoteModalOpen(true);
    } else {
      setSelectedNode(node);

      setEditModalOpen(true);
    }
  };

  // Open add modal

  const handleAdd = (type: NodeType, parentId?: string) => {
    if (type === "note") {
      const courseId = parentId?.replace("course-", "") || "";

      setNoteCourseId(courseId);

      setNoteTitle("");

      setNoteType("summary");

      setNoteContent("");

      setNoteLinkedLecture("");

      setNoteIsPublish(false);

      setNoteAttachment(null);

      setNoteAttachmentPreview("");

      setNoteErrors({});

      setIsEditMode(false);

      setEditingNoteId(null);

      setNoteModalOpen(true);
    } else {
      setAddType(type);

      setAddParentId(parentId || null);

      setAddModalOpen(true);
    }
  };

  // Note form handlers

  const validateNote = () => {
    const newErrors: Record<string, string> = {};

    if (!noteTitle.trim()) {
      newErrors.title = "Title is required";
    }

    if (!noteType.trim()) {
      newErrors.type = "Type is required";
    }

    setNoteErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateNote()) return;

    try {
      const validCourseId = noteCourseId ? parseInt(noteCourseId) : null;
      const finalCourseId = validCourseId && !isNaN(validCourseId) ? validCourseId : null;

      const noteData: any = {
        title: noteTitle.trim(),
        type: noteType as any,
        content: noteContent.trim() || "",
        course_id: finalCourseId,
        linked_lecture: noteLinkedLecture.trim() || null,
        is_publish: noteIsPublish,
      };

      // Include file attachment if present
      if (noteAttachment) {
        noteData.attachment = noteAttachment;
      }

      if (isEditMode && editingNoteId) {
        await updateNote(parseInt(editingNoteId), noteData);
        toast.success("Note updated successfully");
      } else {
        await createNote(noteData);
        toast.success("Note created successfully");
      }

      setNoteModalOpen(false);

      setNoteTitle("");

      setNoteType("summary");

      setNoteContent("");

      setNoteLinkedLecture("");

      setNoteIsPublish(false);

      setNoteAttachment(null);

      setNoteAttachmentPreview("");

      setNoteErrors({});

      setIsEditMode(false);

      setEditingNoteId(null);
    } catch {
      toast.error(
        isEditMode ? "Failed to update note" : "Failed to create note",
      );
    }
  };

  const getNoteTypes = () => {
    return [
      { value: "summary", label: "Summary" },

      { value: "highlight", label: "Highlight" },

      { value: "key_point", label: "Key Point" },

      { value: "important_notice", label: "Important Notice" },
    ];
  };

  const handleNoteAttachmentClick = () => {
    noteAttachmentInputRef.current?.click();
  };

  const handleNoteAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNoteAttachment(file);
      setNoteAttachmentPreview(URL.createObjectURL(file));
    }
  };

  const handleNoteAttachmentRemove = () => {
    setNoteAttachment(null);
    setNoteAttachmentPreview("");
    if (noteAttachmentInputRef.current) {
      noteAttachmentInputRef.current.value = "";
    }
  };

  // Helper functions for codes

  const getCodesForItem = (itemType: "course" | "chapter" | "department", itemId: number) => {
    if (!codes) return [];

    return codes.filter((code) => {
      const codeableType =
        itemType === "course" ? "App\\Models\\Course" :
        itemType === "chapter" ? "App\\Models\\Chapter" :
        "App\\Models\\Department";

      return (
        code.attributes.codeable_type === codeableType &&
        code.attributes.codeable_id === itemId
      );
    });
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);

    setCopiedCode(code);

    toast.success("Code copied to clipboard");

    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleDeleteCode = async (codeId: string) => {
    try {
      await deleteCode(parseInt(codeId));

      toast.success("Code deleted successfully");

      refetchCodes();
    } catch {
      toast.error("Failed to delete code");
    }
  };

  const handleActivate = async (
    itemId: number,
    itemType: "course" | "chapter",
  ) => {
    if (!selectedCode || !selectedStudent) {
      toast.error("Please select a code and student");

      return;
    }

    const code = codes?.find((c) => c.id === selectedCode);

    if (!code) return;

    try {
      await activateCode({
        code: code.attributes.code,

        item_id: itemId,

        item_type: itemType,

        user_id: selectedStudent,
      });

      toast.success("Activated successfully");

      setSelectedCode("");

      setSelectedStudent("");

      setStudentSearch("");

      refetchCodes();
    } catch {
      // Error handled by hook
    }
  };

  const handlePreactivationFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];

    if (!file) {
      setPreactivationNumbers([]);

      return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      const text = event.target?.result as string;

      const numbers = text

        .split(/[\n,\r,;]/)

        .map((n) => n.trim())

        .filter((n) => n.length > 0);

      setPreactivationNumbers(numbers);

      setPreactivationResults(null);

      toast.success(`${numbers.length} numbers ready`);
    };

    reader.readAsText(file);
  };

  const clearPreactivationNumbers = () => {
    setPreactivationNumbers([]);

    setPreactivationResults(null);

    if (preactivationFileRef.current) {
      preactivationFileRef.current.value = "";
    }
  };

  const handlePreactivationUpload = async (
    itemId: number,
    itemType: "course" | "chapter" | "category",
    fileOverride?: File,
  ) => {
    const file = fileOverride || preactivationFileRef.current?.files?.[0];

    if (!file) {
      toast.error("Please select a file or add phone numbers");

      return;
    }

    try {
      const result = await uploadPreActivation({
        item_id: itemId,
        item_type: itemType,
        file,
      });

      setPreactivationResults({
        success: result.data.count || 0,

        failed: preactivationNumbers.length - (result.data.count || 0),

        count: result.data.count || 0,
      });

      toast.success(result.data.message || `Success: ${result.data.count}`);

      refetchCodes();

      if (preactivationFileRef.current) {
        preactivationFileRef.current.value = "";
      }

      setPreactivationNumbers([]);
    } catch {
      toast.error("Upload failed");
    }
  };

  // Open copy/move modal

  const handleCopyMove = (node: TreeNode, mode: "copy" | "move") => {
    setCopyMoveNode(node);

    setCopyMoveMode(mode);

    setSelectedTargetLecture("");

    setCopyMoveModalOpen(true);
  };

  // Handle copy/move submit

  const handleCopyMoveSubmit = async () => {
    if (!copyMoveNode || !selectedTargetLecture) return;

    const chapterId = parseInt(copyMoveNode.data.id);

    const targetLectureId = parseInt(selectedTargetLecture);

    try {
      await copyChapter(chapterId, targetLectureId);

      if (copyMoveMode === "move") {
        // Delete original after successful copy

        await api.chapters.delete(chapterId);
      }

      toast.success(
        copyMoveMode === "copy"
          ? "Lesson copied successfully"
          : "Lesson moved successfully",
      );

      setCopyMoveModalOpen(false);

      setCopyMoveNode(null);

      setSelectedTargetLecture("");

      refetchAll();
    } catch {
      toast.error(`Failed to ${copyMoveMode} lesson`);
    }
  };

  // Form submissions

  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const handleEditSubmit = async (formData: any) => {
    if (!selectedNode) return;

    const rawId = parseInt(selectedNode.data.id);

    try {
      switch (selectedNode.type) {
        case "university":
          const univData = { ...formData };

          if (!univData.image) delete univData.image;

          await updateUniversity(rawId, univData);

          break;

        case "faculty":
          const facultyData = { ...formData };

          if (!facultyData.image) delete facultyData.image;

          await updateFaculty(rawId, facultyData);

          break;

        case "center":
          const centerData = { ...formData };

          if (!centerData.image) delete centerData.image;

          await updateCenter(rawId, centerData);

          break;

        case "department":
          const deptData = { ...formData };

          if (!deptData.image) delete deptData.image;

          await updateDepartment(rawId, deptData, (progress) =>
            setUploadProgress(progress),
          );

          break;

        case "course":
          const course = selectedNode.data as Course;

          // Get category_id from relationship data or parent department

          const categoryId = course.attributes.category?.data?.id
            ? parseInt(course.attributes.category.data.id)
            : course.attributes.category_id ||
              (selectedNode.parentId
                ? parseInt(selectedNode.parentId.replace("dept-", ""))
                : 1);

          await updateCourse(
            rawId,
            {
              ...formData,

              category_id: categoryId,

              price: parseFloat(formData.price) || 0,

              max_views_per_student:
                parseInt(formData.max_views_per_student) || 10,
            },
            (progress) => setUploadProgress(progress),
          );

          break;

        case "lecture":
          const lecture = selectedNode.data as Lecture;

          await updateLecture(rawId, {
            ...formData,

            course_id: lecture.attributes.course_id,
          });

          break;

        case "chapter":
          const chapter = selectedNode.data as Chapter;

          await updateChapter(rawId, {
            title: formData.title,

            duration: formData.duration,

            is_free_preview: formData.is_free_preview ?? false,

            lecture_id: chapter.attributes.lecture_id,

            view_by_minute: formData.view_by_minute,

            max_views: formData.max_views,

            thumbnail: formData.thumbnail,

            video: formData.video,
          });

          resetUpdateChapter();

          break;
      }

      toast.success("Updated successfully");

      setEditModalOpen(false);

      setSelectedNode(null);

      setUploadProgress(0);

      refetchAll();
    } catch {
      toast.error("Failed to update");

      setUploadProgress(0);
    }
  };

  const handleAddSubmit = async (formData: any) => {
    if (!addType) return;

    try {
      switch (addType) {
        case "university":
          await createUniversity(formData);

          break;

        case "center":
          await createCenter({
            ...formData,

            parent_id: addParentId
              ? parseInt(addParentId.replace("univ-", ""))
              : undefined,
          });

          break;

        case "faculty":
          await createFaculty({
            ...formData,

            parent_id: addParentId
              ? parseInt(addParentId.replace("center-", ""))
              : undefined,
          });

          break;

        case "department":
          // Calculate initial order for new department

          const parentId = addParentId
            ? parseInt(addParentId.replace("faculty-", "").replace("dept-", ""))
            : undefined;

          const siblings =
            departments?.filter((dept) => {
              if (parentId) {
                return dept.attributes.parent?.data?.id === String(parentId);
              }

              return (
                !dept.attributes.parent?.data?.id &&
                dept.attributes.center_id === formData.center_id
              );
            }) || [];

          const maxOrder =
            siblings.length > 0
              ? Math.max(...siblings.map((s) => s.attributes.order || 0))
              : 0;

          await createDepartment(
            {
              ...formData,

              parent_id: parentId,

              order: maxOrder + 1,
            },
            (progress) => setUploadProgress(progress),
          );

          break;

        case "course":
          await createCourse(
            {
              ...formData,

              category_id: addParentId
                ? parseInt(addParentId.replace("dept-", ""))
                : undefined,

              price: parseFloat(formData.price) || 0,

              max_views_per_student:
                parseInt(formData.max_views_per_student) || 10,

              status: formData.status ?? 0,
            },
            (progress) => setUploadProgress(progress),
          );

          break;

        case "lecture":
          await createLecture({
            ...formData,
            course_id: addParentId
              ? parseInt(addParentId.replace("course-", ""))
              : undefined,
          });

          break;

        case "chapter":
          const [courseId, lectureId] =
            addParentId?.replace("lecture-", "").split("-") || [];

          await createChapter(
            {
              title: formData.title,

              duration: formData.duration,

              is_free_preview: formData.is_free_preview ?? false,

              lecture_id: lectureId ? parseInt(lectureId) : undefined,

              thumbnail: formData.thumbnail,

              video: formData.video,

              attachments: formData.attachments || [],

              view_by_minute: formData.view_by_minute,

              max_views: formData.max_views,
            },
            (progress) => setUploadProgress(progress),
          );

          resetCreateChapter();

          break;
      }

      toast.success("Created successfully");

      setAddModalOpen(false);

      setAddType(null);

      setAddParentId(null);

      setUploadProgress(0);

      refetchAll();
    } catch {
      toast.error("Failed to create");

      setUploadProgress(0);
    }
  };

  // Expand all / Collapse all

  const expandAll = () => {
    const allIds = new Set<string>();

    const collectIds = (nodes: TreeNode[]) => {
      nodes.forEach((node) => {
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
            <h1 className="text-2xl font-bold text-[#1E293B]">
              Content Manager
            </h1>

            <p className="text-sm text-[#64748B] mt-0.5">
              Departments, Courses, Lectures & Lessons
            </p>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <p className="text-red-600">
            {t("departments.loadError")}: {error}
          </p>

          <button
            onClick={refetchAll}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            {t("departments.retry")}
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

          <p className="text-sm text-[#64748B] mt-0.5">
            Universities, Faculties, Centers, Departments, Courses, Lectures &
            Lessons
          </p>
        </div>

        <button
          onClick={() => handleAdd("university")}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#2137D6] hover:bg-[#1a2bb3] text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-200"
        >
          <Plus className="w-4 h-4" />
          Add University
        </button>
      </div>

      {/* Search and Controls */}

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-96">
          <input
            type="text"
            placeholder={t("departments.searchPlaceholder")}
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
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={expandAll}
            className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
          >
            {t("departments.tree.expandAll") || "Expand All"}
          </button>

          <button
            onClick={collapseAll}
            className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
          >
            {t("departments.tree.collapseAll") || "Collapse All"}
          </button>
        </div>
      </div>

      {/* Tree View and Details Panel Container */}

      <div className="flex gap-6 items-start">
        {/* Tree View */}

        <div className={`flex-1 ${viewNode ? "" : "w-full"}`}>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />

                  <p className="text-sm text-gray-500">
                    {t("departments.loading") || "Loading..."}
                  </p>
                </div>
              </div>
            ) : treeData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <GraduationCap className="w-8 h-8 text-gray-400" />
                </div>

                <p className="text-gray-500 text-center">
                  {searchQuery
                    ? t("departments.noSearchResults") ||
                      "No departments match your search"
                    : t("departments.noDepartments")}
                </p>
              </div>
            ) : (
              <div className="p-4 space-y-2">
                {treeData.map((node) => (
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
                    onDrop={handleDrop}
                    draggedNodeId={draggedNodeId}
                    isSelected={viewNode?.id === node.id}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Legend */}

          <div className="flex items-center gap-6 text-sm text-gray-500 flex-wrap mt-4">
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

              <span>Lesson</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded flex items-center justify-center text-cyan-600 bg-cyan-50 border border-cyan-200">
                <FileText className="w-3 h-3" />
              </div>

              <span>Note</span>
            </div>
          </div>
        </div>

        {/* Side Panel - Details View */}

        {viewNode && (
          <div className="w-96 bg-white border border-gray-200 rounded-xl shadow-sm sticky top-4 self-start max-h-[calc(100vh-100px)] flex flex-col overflow-hidden">
            {/* Header */}

            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 capitalize">
                {viewNode.type} Details
              </h3>

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
                <label className="text-xs font-medium text-gray-500 uppercase">
                  Name
                </label>

                <p className="text-sm font-medium text-gray-900 mt-1">
                  {viewNode.name}
                </p>
              </div>

              {/* Type-specific details */}

              {viewNode.type === "department" && (
                <>
                  {viewNode.meta?.code && (
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase">
                        Code
                      </label>

                      <p className="text-sm text-gray-700 mt-1">
                        {viewNode.meta.code}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-4">
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase">
                        Courses
                      </label>

                      <p className="text-lg font-semibold text-blue-600">
                        {viewNode.stats?.courses || 0}
                      </p>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase">
                        Students
                      </label>

                      <p className="text-lg font-semibold text-green-600">
                        {viewNode.stats?.students || 0}
                      </p>
                    </div>
                  </div>

                  {/* Activation Codes Section */}
                  <div className="mt-4 pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Power className="w-4 h-4 text-[#2137D6]" />

                        <label className="text-xs font-bold text-[#1E293B] uppercase tracking-wider">
                          Activation
                        </label>
                      </div>

                      <button
                        onClick={() => {
                          setGenerateCodeItemType("department");
                          setGenerateCodeItemId(viewNode.data.id);
                          setGenerateCodeModalOpen(true);
                        }}
                        className="p-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#64748B] hover:text-[#2137D6] hover:border-[#2137D6] transition-all"
                        title="Generate Codes"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex items-center gap-1 mb-4 bg-[#F8FAFC] rounded-lg p-1">
                      <button
                        onClick={() => setActivationTab("code")}
                        className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition-all ${
                          activationTab === "code"
                            ? "bg-white text-[#2137D6] shadow-sm"
                            : "text-[#64748B] hover:text-[#1E293B]"
                        }`}
                      >
                        By Code
                      </button>

                      <button
                        onClick={() => setActivationTab("preactivation")}
                        className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition-all ${
                          activationTab === "preactivation"
                            ? "bg-white text-[#2137D6] shadow-sm"
                            : "text-[#64748B] hover:text-[#1E293B]"
                        }`}
                      >
                        Preactivation
                      </button>
                    </div>

                    {activationTab === "code" ? (
                      <div className="flex flex-col gap-4">
                        {/* Available Codes */}
                        <div>
                          <label className="text-xs font-bold text-[#64748B] mb-2 block">
                            Available Codes (
                            {(() => {
                              const departmentCodes = getCodesForItem(
                                "department",
                                parseInt(viewNode.data.id),
                              );
                              return departmentCodes.filter(
                                (c) => !c.attributes.is_used,
                              ).length;
                            })()}
                            )
                          </label>

                          {codesLoading ? (
                            <div className="flex items-center justify-center py-4">
                              <Loader2 className="w-5 h-5 animate-spin text-[#2137D6]" />
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {(() => {
                                const departmentCodes = getCodesForItem(
                                  "department",
                                  parseInt(viewNode.data.id),
                                );
                                return departmentCodes.filter(
                                  (c) => !c.attributes.is_used,
                                ).map((code) => (
                                  <label
                                    key={code.id}
                                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                                      selectedCode === code.id
                                        ? "bg-[#EEF2FF] border border-[#2137D6]"
                                        : "hover:bg-[#F8FAFC] border border-transparent"
                                    }`}
                                  >
                                    <input
                                      type="radio"
                                      name="code"
                                      value={code.id}
                                      checked={selectedCode === code.id}
                                      onChange={(e) =>
                                        setSelectedCode(e.target.value)
                                      }
                                      className="w-4 h-4 text-[#2137D6]"
                                    />
                                    <Key className="w-4 h-4 text-[#2137D6]" />
                                    <span className="text-sm font-mono text-gray-900">
                                      {code.attributes.code}
                                    </span>
                                  </label>
                                ));
                              })()}

                              {(() => {
                                const departmentCodes = getCodesForItem(
                                  "department",
                                  parseInt(viewNode.data.id),
                                );
                                if (departmentCodes.filter((c) => !c.attributes.is_used).length === 0) {
                                  return (
                                    <p className="text-sm text-gray-400 text-center py-4">
                                      No available codes
                                    </p>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                          )}
                        </div>

                      </div>
                    ) : (
                      <div className="flex flex-col gap-4">
                        <div className="p-3 bg-[#EEF2FF] rounded-xl border border-[#2137D6]/20">
                          <p className="text-xs text-[#2137D6]">
                            <span className="font-bold">Preactivation:</span>{" "}
                            Enter phone numbers manually or upload a file to pre-activate students
                          </p>
                        </div>

                        {/* Manual Entry */}
                        <div>
                          <label className="text-xs font-bold text-[#64748B] mb-2 block">
                            Enter Phone Numbers Manually
                          </label>

                          <p className="text-[10px] text-[#94A3B8] mb-2">
                            Add phone numbers one by one
                          </p>

                          <div className="space-y-2">
                            {preactivationNumbers.map((num, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={num}
                                  onChange={(e) => {
                                    const newNumbers = [...preactivationNumbers];
                                    newNumbers[idx] = e.target.value;
                                    setPreactivationNumbers(newNumbers);
                                    setPreactivationResults(null);
                                  }}
                                  placeholder="+1234567890"
                                  className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newNumbers = preactivationNumbers.filter((_, i) => i !== idx);
                                    setPreactivationNumbers(newNumbers);
                                    setPreactivationResults(null);
                                  }}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => {
                                setPreactivationNumbers([...preactivationNumbers, ""]);
                                setPreactivationResults(null);
                              }}
                              className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-2"
                            >
                              <Plus className="w-4 h-4" />
                              Add Phone Number
                            </button>
                          </div>
                        </div>

                        {/* Divider */}
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-px bg-gray-200"></div>
                          <span className="text-xs text-gray-400">OR</span>
                          <div className="flex-1 h-px bg-gray-200"></div>
                        </div>

                        {/* File Upload */}
                        <div>
                          <label className="text-xs font-bold text-[#64748B] mb-2 block">
                            Upload Phone Numbers File
                          </label>

                          <p className="text-[10px] text-[#94A3B8] mb-2">
                            Supported: .txt, .csv (one phone per line)
                          </p>

                          <input
                            ref={preactivationFileRef}
                            type="file"
                            accept=".txt,.csv"
                            onChange={handlePreactivationFileSelect}
                            className="hidden"
                          />

                          <button
                            onClick={() => preactivationFileRef.current?.click()}
                            className="w-full py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-[#EEF2FF] hover:border-[#2137D6] text-[#475569] rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2"
                          >
                            <Upload className="w-4 h-4" />
                            Select File
                          </button>
                        </div>

                        {/* Phone Numbers Preview */}
                        {preactivationNumbers.length > 0 && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-xs font-bold text-[#64748B]">
                                Phone Numbers ({preactivationNumbers.length})
                              </label>

                              <button
                                onClick={clearPreactivationNumbers}
                                className="text-[10px] text-red-500 hover:text-red-600 flex items-center gap-1"
                              >
                                <X className="w-3 h-3" />
                                Clear
                              </button>
                            </div>

                            <div className="max-h-32 overflow-y-auto bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3">
                              <div className="flex flex-wrap gap-2">
                                {preactivationNumbers.map((num, idx) => (
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
                          onClick={() => {
                            // Create a file from the repeater fields
                            const phoneNumbersContent = preactivationNumbers
                              .filter(n => n.trim().length > 0)
                              .join('\n');
                            
                            if (phoneNumbersContent.length === 0) {
                              toast.error("Please add at least one phone number");
                              return;
                            }

                            const blob = new Blob([phoneNumbersContent], { type: 'text/plain' });
                            const file = new File([blob], 'phone_numbers.txt', { type: 'text/plain' });

                            handlePreactivationUpload(
                              parseInt(viewNode.data.id),
                              "category",
                              file,
                            );
                          }}
                          disabled={
                            preactivationNumbers.filter(n => n.trim().length > 0).length === 0 ||
                            isUploadingPreActivation
                          }
                          className="w-full py-2.5 bg-[#10B981] hover:bg-[#059669] text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {isUploadingPreActivation ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4" />
                              Upload{" "}
                              {preactivationNumbers.filter(n => n.trim().length > 0).length > 0 &&
                                `(${preactivationNumbers.filter(n => n.trim().length > 0).length})`}
                            </>
                          )}
                        </button>

                        {/* Pre-activation Results */}
                        {preactivationResults && (
                          <div className="mt-2 p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                            <p className="text-xs font-bold text-[#1E293B] mb-2">
                              Results:
                            </p>

                            <div className="flex items-center gap-4 mb-3">
                              <span className="text-xs text-green-600 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Success: {preactivationResults.success}
                              </span>

                              {preactivationResults.failed > 0 && (
                                <span className="text-xs text-red-600 flex items-center gap-1">
                                  <X className="w-3.5 h-3.5" />
                                  Failed: {preactivationResults.failed}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}

              {viewNode.type === "course" && (
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
                    <p className="text-base font-bold text-gray-900">
                      {(viewNode.data as Course).attributes.title}
                    </p>

                    {(viewNode.data as Course).attributes.sub_title && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {(viewNode.data as Course).attributes.sub_title}
                      </p>
                    )}
                  </div>

                  {/* Grid Layout for Details */}

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    {/* Status */}

                    <div>
                      <label className="text-[10px] font-medium text-gray-400 uppercase">
                        Status
                      </label>

                      <span
                        className={`inline-block px-2 py-0.5 text-[10px] font-medium rounded-full ${
                          viewNode.meta?.status === "active"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {viewNode.meta?.status === "active"
                          ? "Active"
                          : "Draft"}
                      </span>
                    </div>

                    {/* Visibility */}

                    <div>
                      <label className="text-[10px] font-medium text-gray-400 uppercase">
                        Visibility
                      </label>

                      <p className="text-xs text-gray-700 capitalize">
                        {(viewNode.data as Course).attributes.visibility}
                      </p>
                    </div>

                    {/* Price */}

                    <div>
                      <label className="text-[10px] font-medium text-gray-400 uppercase">
                        Price
                      </label>

                      <p className="text-sm font-semibold text-blue-600">
                        ${(viewNode.data as Course).attributes.price}
                      </p>
                    </div>

                    {/* Max Views */}

                    <div>
                      <label className="text-[10px] font-medium text-gray-400 uppercase">
                        Max Views
                      </label>

                      <p className="text-xs text-gray-700">
                        {
                          (viewNode.data as Course).attributes
                            .max_views_per_student
                        }
                      </p>
                    </div>

                    {/* Lectures */}

                    <div>
                      <label className="text-[10px] font-medium text-gray-400 uppercase">
                        Lectures
                      </label>

                      <p className="text-sm font-semibold text-purple-600">
                        {viewNode.stats?.lectures || 0}
                      </p>
                    </div>

                    {/* Students */}

                    <div>
                      <label className="text-[10px] font-medium text-gray-400 uppercase">
                        Students
                      </label>

                      <p className="text-sm font-semibold text-green-600">
                        {viewNode.stats?.students || 0}
                      </p>
                    </div>
                  </div>

                  {/* Instructor */}

                  {(viewNode.data as Course).attributes.instructor?.data
                    ?.attributes?.full_name && (
                    <div className="mb-2">
                      <label className="text-[10px] font-medium text-gray-400 uppercase">
                        Instructor
                      </label>

                      <p className="text-xs text-gray-700">
                        {
                          (viewNode.data as Course).attributes.instructor?.data
                            ?.attributes?.full_name
                        }
                      </p>
                    </div>
                  )}

                  {/* Description */}

                  {(viewNode.data as Course).attributes.description && (
                    <div className="mb-2">
                      <label className="text-[10px] font-medium text-gray-400 uppercase">
                        Description
                      </label>

                      <p className="text-xs text-gray-600 line-clamp-2">
                        {(viewNode.data as Course).attributes.description}
                      </p>
                    </div>
                  )}

                  {/* Activation Codes Section */}

                  <div className="mt-4 pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Power className="w-4 h-4 text-[#2137D6]" />

                        <label className="text-xs font-bold text-[#1E293B] uppercase tracking-wider">
                          Activation
                        </label>
                      </div>

                      <button
                        onClick={() => {
                          setGenerateCodeItemType("course");

                          setGenerateCodeItemId(
                            parseInt(viewNode.data.id).toString(),
                          );

                          setGenerateCodeModalOpen(true);
                        }}
                        className="p-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#64748B] hover:text-[#2137D6] hover:border-[#2137D6] transition-all"
                        title="Generate Codes"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Tabs */}

                    <div className="flex items-center gap-1 mb-4 bg-[#F8FAFC] rounded-lg p-1">
                      <button
                        onClick={() => setActivationTab("code")}
                        className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition-all ${
                          activationTab === "code"
                            ? "bg-white text-[#2137D6] shadow-sm"
                            : "text-[#64748B] hover:text-[#1E293B]"
                        }`}
                      >
                        By Code
                      </button>

                      <button
                        onClick={() => setActivationTab("preactivation")}
                        className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition-all ${
                          activationTab === "preactivation"
                            ? "bg-white text-[#2137D6] shadow-sm"
                            : "text-[#64748B] hover:text-[#1E293B]"
                        }`}
                      >
                        Preactivation
                      </button>
                    </div>

                    {activationTab === "code" ? (
                      <div className="flex flex-col gap-4">
                        {/* Available Codes */}

                        <div>
                          <label className="text-xs font-bold text-[#64748B] mb-2 block">
                            Available Codes (
                            {(() => {
                              const courseCodes = getCodesForItem(
                                "course",
                                parseInt(viewNode.data.id),
                              );

                              return courseCodes.filter(
                                (c) => !c.attributes.is_used,
                              ).length;
                            })()}
                            )
                          </label>

                          {codesLoading ? (
                            <div className="flex items-center justify-center py-4">
                              <Loader2 className="w-5 h-5 animate-spin text-[#2137D6]" />
                            </div>
                          ) : (
                            (() => {
                              const courseCodes = getCodesForItem(
                                "course",
                                parseInt(viewNode.data.id),
                              );

                              const availableCodes = courseCodes.filter(
                                (c) => !c.attributes.is_used,
                              );

                              return availableCodes.length > 0 ? (
                                <div className="max-h-32 overflow-y-auto border border-[#E2E8F0] rounded-xl p-2 flex flex-col gap-1">
                                  {availableCodes.map((code) => (
                                    <label
                                      key={code.id}
                                      className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                                        selectedCode === code.id
                                          ? "bg-[#EEF2FF] border border-[#2137D6]"
                                          : "hover:bg-[#F8FAFC] border border-transparent"
                                      }`}
                                    >
                                      <input
                                        type="radio"
                                        name="code"
                                        value={code.id}
                                        checked={selectedCode === code.id}
                                        onChange={(e) =>
                                          setSelectedCode(e.target.value)
                                        }
                                        className="w-4 h-4 text-[#2137D6]"
                                      />

                                      <span className="flex-1 font-mono text-xs text-[#1E293B]">
                                        {code.attributes.code}
                                      </span>

                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();

                                          handleCopyCode(code.attributes.code);
                                        }}
                                        className="p-1 hover:bg-[#EEF2FF] rounded transition-colors"
                                      >
                                        {copiedCode === code.attributes.code ? (
                                          <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                                        ) : (
                                          <Copy className="w-3.5 h-3.5 text-[#94A3B8]" />
                                        )}
                                      </button>
                                    </label>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-[#94A3B8] italic">
                                  No codes available
                                </p>
                              );
                            })()
                          )}
                        </div>

                        {/* Student Selection */}

                        <div>
                          <label className="text-xs font-bold text-[#64748B] mb-2 block">
                            Select Student
                          </label>

                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />

                            <input
                              type="text"
                              placeholder="Search students"
                              value={studentSearch}
                              onChange={(e) => setStudentSearch(e.target.value)}
                              className="w-full pl-9 pr-4 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10"
                            />
                          </div>

                          {studentSearch && students && (
                            <div className="mt-2 max-h-32 overflow-y-auto border border-[#E2E8F0] rounded-xl p-2 flex flex-col gap-1">
                              {students.data?.filter((student: any) => {
                                const fullName =
                                  `${student.attributes.first_name} ${student.attributes.last_name}`.toLowerCase();

                                const email =
                                  student.attributes.email?.toLowerCase() || "";

                                const search = studentSearch.toLowerCase();

                                return (
                                  fullName.includes(search) ||
                                  email.includes(search)
                                );
                              }).length > 0 ? (
                                students.data
                                  .filter((student: any) => {
                                    const fullName =
                                      `${student.attributes.first_name} ${student.attributes.last_name}`.toLowerCase();

                                    const email =
                                      student.attributes.email?.toLowerCase() ||
                                      "";

                                    const search = studentSearch.toLowerCase();

                                    return (
                                      fullName.includes(search) ||
                                      email.includes(search)
                                    );
                                  })
                                  .map((student: any) => (
                                    <label
                                      key={student.id}
                                      className={`flex flex-col p-2 rounded-lg cursor-pointer transition-colors ${
                                        selectedStudent === student.id
                                          ? "bg-[#EEF2FF]"
                                          : "hover:bg-[#F8FAFC]"
                                      }`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <input
                                          type="radio"
                                          name="student"
                                          value={student.id}
                                          checked={
                                            selectedStudent === student.id
                                          }
                                          onChange={(e) => {
                                            setSelectedStudent(e.target.value);

                                            setStudentSearch(
                                              `${student.attributes.first_name} ${student.attributes.last_name}`,
                                            );
                                          }}
                                          className="w-4 h-4 text-[#2137D6]"
                                        />

                                        <span className="text-xs font-medium text-[#1E293B]">
                                          {student.attributes.first_name}{" "}
                                          {student.attributes.last_name}
                                        </span>
                                      </div>

                                      <span className="text-[10px] text-[#94A3B8] pl-6">
                                        {student.attributes.email}
                                      </span>
                                    </label>
                                  ))
                              ) : (
                                <p className="text-xs text-[#94A3B8] italic">
                                  No students found
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Activate Button */}

                        <button
                          onClick={() =>
                            handleActivate(parseInt(viewNode.data.id), "course")
                          }
                          disabled={
                            isActivating || !selectedCode || !selectedStudent
                          }
                          className="w-full py-2.5 bg-[#2137D6] hover:bg-[#1a2bb3] text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {isActivating ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Activating...
                            </>
                          ) : (
                            <>
                              <Power className="w-4 h-4" />
                              Activate
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4">
                        <div className="p-3 bg-[#EEF2FF] rounded-xl border border-[#2137D6]/20">
                          <p className="text-xs text-[#2137D6]">
                            <span className="font-bold">Preactivation:</span>{" "}
                            Enter phone numbers manually or upload a file to pre-activate students
                          </p>
                        </div>

                        {/* Manual Entry */}
                        <div>
                          <label className="text-xs font-bold text-[#64748B] mb-2 block">
                            Enter Phone Numbers Manually
                          </label>

                          <p className="text-[10px] text-[#94A3B8] mb-2">
                            Add phone numbers one by one
                          </p>

                          <div className="space-y-2">
                            {preactivationNumbers.map((num, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={num}
                                  onChange={(e) => {
                                    const newNumbers = [...preactivationNumbers];
                                    newNumbers[idx] = e.target.value;
                                    setPreactivationNumbers(newNumbers);
                                    setPreactivationResults(null);
                                  }}
                                  placeholder="+1234567890"
                                  className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newNumbers = preactivationNumbers.filter((_, i) => i !== idx);
                                    setPreactivationNumbers(newNumbers);
                                    setPreactivationResults(null);
                                  }}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => {
                                setPreactivationNumbers([...preactivationNumbers, ""]);
                                setPreactivationResults(null);
                              }}
                              className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-2"
                            >
                              <Plus className="w-4 h-4" />
                              Add Phone Number
                            </button>
                          </div>
                        </div>

                        {/* Divider */}
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-px bg-gray-200"></div>
                          <span className="text-xs text-gray-400">OR</span>
                          <div className="flex-1 h-px bg-gray-200"></div>
                        </div>

                        {/* File Upload */}

                        <div>
                          <label className="text-xs font-bold text-[#64748B] mb-2 block">
                            Upload Phone Numbers File
                          </label>

                          <p className="text-[10px] text-[#94A3B8] mb-2">
                            Supported: .txt, .csv (one phone per line)
                          </p>

                          <input
                            ref={preactivationFileRef}
                            type="file"
                            accept=".txt,.csv"
                            onChange={handlePreactivationFileSelect}
                            className="hidden"
                          />

                          <button
                            onClick={() =>
                              preactivationFileRef.current?.click()
                            }
                            className="w-full py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-[#EEF2FF] hover:border-[#2137D6] text-[#475569] rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2"
                          >
                            <Upload className="w-4 h-4" />
                            Select File
                          </button>
                        </div>

                        {/* Phone Numbers Preview */}

                        {preactivationNumbers.length > 0 && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-xs font-bold text-[#64748B]">
                                Phone Numbers ({preactivationNumbers.length})
                              </label>

                              <button
                                onClick={clearPreactivationNumbers}
                                className="text-[10px] text-red-500 hover:text-red-600 flex items-center gap-1"
                              >
                                <X className="w-3 h-3" />
                                Clear
                              </button>
                            </div>

                            <div className="max-h-32 overflow-y-auto bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3">
                              <div className="flex flex-wrap gap-2">
                                {preactivationNumbers.map((num, idx) => (
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
                          onClick={() => {
                            // Create a file from the repeater fields
                            const phoneNumbersContent = preactivationNumbers
                              .filter(n => n.trim().length > 0)
                              .join('\n');
                             
                            if (phoneNumbersContent.length === 0) {
                              toast.error("Please add at least one phone number");
                              return;
                            }

                            const blob = new Blob([phoneNumbersContent], { type: 'text/plain' });
                            const file = new File([blob], 'phone_numbers.txt', { type: 'text/plain' });

                            handlePreactivationUpload(
                              parseInt(viewNode.data.id),
                              "course",
                              file,
                            );
                          }}
                          disabled={
                            preactivationNumbers.filter(n => n.trim().length > 0).length === 0 ||
                            isUploadingPreActivation
                          }
                          className="w-full py-2.5 bg-[#10B981] hover:bg-[#059669] text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {isUploadingPreActivation ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4" />
                              Upload{" "}
                              {preactivationNumbers.filter(n => n.trim().length > 0).length > 0 &&
                                `(${preactivationNumbers.filter(n => n.trim().length > 0).length})`}
                            </>
                          )}
                        </button>

                        {/* Pre-activation Results */}

                        {preactivationResults && (
                          <div className="mt-2 p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                            <p className="text-xs font-bold text-[#1E293B] mb-2">
                              Results:
                            </p>

                            <div className="flex items-center gap-4 mb-3">
                              <span className="text-xs text-green-600 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Success: {preactivationResults.success}
                              </span>

                              {preactivationResults.failed > 0 && (
                                <span className="text-xs text-red-600 flex items-center gap-1">
                                  <X className="w-3.5 h-3.5" />
                                  Failed: {preactivationResults.failed}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Objectives */}

                  {(viewNode.data as Course).attributes.objectives && (
                    <div>
                      <label className="text-[10px] font-medium text-gray-400 uppercase">
                        Objectives
                      </label>

                      <p className="text-xs text-gray-600 line-clamp-2">
                        {(viewNode.data as Course).attributes.objectives}
                      </p>
                    </div>
                  )}
                </>
              )}

              {viewNode.type === "lecture" && (
                <>
                  {/* Description */}

                  {(viewNode.data as Lecture).attributes.description && (
                    <div className="mb-4">
                      <label className="text-xs font-medium text-gray-500 uppercase">
                        Description
                      </label>

                      <p className="text-sm text-gray-600 mt-1">
                        {(viewNode.data as Lecture).attributes.description}
                      </p>
                    </div>
                  )}
                </>
              )}

              {viewNode.type === "chapter" && (
                <div className="space-y-4">
                  {/* Title */}

                  <div className="mb-4">
                    <label className="text-xs font-medium text-gray-500 uppercase">
                      Title
                    </label>

                    <p className="text-lg font-semibold text-gray-900">
                      {(viewNode.data as Chapter).attributes.title}
                    </p>
                  </div>

                  {/* Media Section */}

                  <div className="mb-4">
                    <label className="text-xs font-medium text-gray-500 uppercase mb-2 block">
                      Media
                    </label>

                    <div className="space-y-3">
                      {/* Video Preview */}

                      {(viewNode.data as Chapter).attributes.video && (
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">
                            Video
                          </label>

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
                          <label className="text-xs text-gray-400 mb-1 block">
                            Thumbnail
                          </label>

                          <img
                            src={
                              (viewNode.data as Chapter).attributes.thumbnail
                            }
                            alt="Lesson thumbnail"
                            className="w-full h-32 object-cover rounded-lg border border-gray-200 mx-auto"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Attachments Section */}

                  {((viewNode.data as Chapter).attributes.attachments?.length ?? 0) >
                    0 && (
                      <div className="mb-4">
                        <label className="text-xs font-medium text-gray-500 uppercase mb-2 block">
                          Attachments
                        </label>

                        <div className="space-y-2">
                          {(viewNode.data as Chapter).attributes.attachments?.map(
                            (attachment: any) => (
                              <a
                                key={attachment.id}
                                href={attachment.attributes?.path}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors"
                              >
                                <div className="flex items-center gap-2">
                                  <FileText className="w-4 h-4 text-blue-500" />
                                  <span className="text-sm text-gray-700">
                                    {attachment.attributes?.name}
                                  </span>
                                  <span className="text-xs text-gray-400">
                                    ({(parseInt(attachment.attributes?.size || "0") / 1024).toFixed(1)} KB)
                                  </span>
                                </div>

                                <ChevronRight className="w-4 h-4 text-gray-400" />
                              </a>
                            ),
                          )}
                        </div>
                      </div>
                    )}

                  {/* Activation Codes Section */}

                  <div className="mt-4 pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Power className="w-4 h-4 text-[#2137D6]" />

                        <label className="text-xs font-bold text-[#1E293B] uppercase tracking-wider">
                          Activation
                        </label>
                      </div>

                      <button
                        onClick={() => {
                          setGenerateCodeItemType("chapter");

                          setGenerateCodeItemId(
                            parseInt(viewNode.data.id).toString(),
                          );

                          setGenerateCodeModalOpen(true);
                        }}
                        className="p-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#64748B] hover:text-[#2137D6] hover:border-[#2137D6] transition-all"
                        title="Generate Codes"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Tabs */}

                    <div className="flex items-center gap-1 mb-4 bg-[#F8FAFC] rounded-lg p-1">
                      <button
                        onClick={() => setActivationTab("code")}
                        className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition-all ${
                          activationTab === "code"
                            ? "bg-white text-[#2137D6] shadow-sm"
                            : "text-[#64748B] hover:text-[#1E293B]"
                        }`}
                      >
                        By Code
                      </button>

                      <button
                        onClick={() => setActivationTab("preactivation")}
                        className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition-all ${
                          activationTab === "preactivation"
                            ? "bg-white text-[#2137D6] shadow-sm"
                            : "text-[#64748B] hover:text-[#1E293B]"
                        }`}
                      >
                        Preactivation
                      </button>
                    </div>

                    {activationTab === "code" ? (
                      <div className="flex flex-col gap-4">
                        {/* Available Codes */}

                        <div>
                          <label className="text-xs font-bold text-[#64748B] mb-2 block">
                            Available Codes (
                            {(() => {
                              const chapterCodes = getCodesForItem(
                                "chapter",
                                parseInt(viewNode.data.id),
                              );

                              return chapterCodes.filter(
                                (c) => !c.attributes.is_used,
                              ).length;
                            })()}
                            )
                          </label>

                          {codesLoading ? (
                            <div className="flex items-center justify-center py-4">
                              <Loader2 className="w-5 h-5 animate-spin text-[#2137D6]" />
                            </div>
                          ) : (
                            (() => {
                              const chapterCodes = getCodesForItem(
                                "chapter",
                                parseInt(viewNode.data.id),
                              );

                              const availableCodes = chapterCodes.filter(
                                (c) => !c.attributes.is_used,
                              );

                              return availableCodes.length > 0 ? (
                                <div className="max-h-32 overflow-y-auto border border-[#E2E8F0] rounded-xl p-2 flex flex-col gap-1">
                                  {availableCodes.map((code) => (
                                    <label
                                      key={code.id}
                                      className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                                        selectedCode === code.id
                                          ? "bg-[#EEF2FF] border border-[#2137D6]"
                                          : "hover:bg-[#F8FAFC] border border-transparent"
                                      }`}
                                    >
                                      <input
                                        type="radio"
                                        name="code"
                                        value={code.id}
                                        checked={selectedCode === code.id}
                                        onChange={(e) =>
                                          setSelectedCode(e.target.value)
                                        }
                                        className="w-4 h-4 text-[#2137D6]"
                                      />

                                      <span className="flex-1 font-mono text-xs text-[#1E293B]">
                                        {code.attributes.code}
                                      </span>

                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();

                                          handleCopyCode(code.attributes.code);
                                        }}
                                        className="p-1 hover:bg-[#EEF2FF] rounded transition-colors"
                                      >
                                        {copiedCode === code.attributes.code ? (
                                          <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                                        ) : (
                                          <Copy className="w-3.5 h-3.5 text-[#94A3B8]" />
                                        )}
                                      </button>
                                    </label>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-[#94A3B8] italic">
                                  No codes available
                                </p>
                              );
                            })()
                          )}
                        </div>

                        {/* Student Selection */}

                        <div>
                          <label className="text-xs font-bold text-[#64748B] mb-2 block">
                            Select Student
                          </label>

                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />

                            <input
                              type="text"
                              placeholder="Search students"
                              value={studentSearch}
                              onChange={(e) => setStudentSearch(e.target.value)}
                              className="w-full pl-9 pr-4 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10"
                            />
                          </div>

                          {studentSearch && students && (
                            <div className="mt-2 max-h-32 overflow-y-auto border border-[#E2E8F0] rounded-xl p-2 flex flex-col gap-1">
                              {students.data?.filter((student: any) => {
                                const fullName =
                                  `${student.attributes.first_name} ${student.attributes.last_name}`.toLowerCase();

                                const email =
                                  student.attributes.email?.toLowerCase() || "";

                                const search = studentSearch.toLowerCase();

                                return (
                                  fullName.includes(search) ||
                                  email.includes(search)
                                );
                              }).length > 0 ? (
                                students.data
                                  .filter((student: any) => {
                                    const fullName =
                                      `${student.attributes.first_name} ${student.attributes.last_name}`.toLowerCase();

                                    const email =
                                      student.attributes.email?.toLowerCase() ||
                                      "";

                                    const search = studentSearch.toLowerCase();

                                    return (
                                      fullName.includes(search) ||
                                      email.includes(search)
                                    );
                                  })
                                  .map((student: any) => (
                                    <label
                                      key={student.id}
                                      className={`flex flex-col p-2 rounded-lg cursor-pointer transition-colors ${
                                        selectedStudent === student.id
                                          ? "bg-[#EEF2FF]"
                                          : "hover:bg-[#F8FAFC]"
                                      }`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <input
                                          type="radio"
                                          name="student"
                                          value={student.id}
                                          checked={
                                            selectedStudent === student.id
                                          }
                                          onChange={(e) => {
                                            setSelectedStudent(e.target.value);

                                            setStudentSearch(
                                              `${student.attributes.first_name} ${student.attributes.last_name}`,
                                            );
                                          }}
                                          className="w-4 h-4 text-[#2137D6]"
                                        />

                                        <span className="text-xs font-medium text-[#1E293B]">
                                          {student.attributes.first_name}{" "}
                                          {student.attributes.last_name}
                                        </span>
                                      </div>

                                      <span className="text-[10px] text-[#94A3B8] pl-6">
                                        {student.attributes.email}
                                      </span>
                                    </label>
                                  ))
                              ) : (
                                <p className="text-xs text-[#94A3B8] italic">
                                  No students found
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Activate Button */}

                        <button
                          onClick={() =>
                            handleActivate(
                              parseInt(viewNode.data.id),
                              "chapter",
                            )
                          }
                          disabled={
                            isActivating || !selectedCode || !selectedStudent
                          }
                          className="w-full py-2.5 bg-[#2137D6] hover:bg-[#1a2bb3] text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {isActivating ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Activating...
                            </>
                          ) : (
                            <>
                              <Power className="w-4 h-4" />
                              Activate
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4">
                        <div className="p-3 bg-[#EEF2FF] rounded-xl border border-[#2137D6]/20">
                          <p className="text-xs text-[#2137D6]">
                            <span className="font-bold">Preactivation:</span>{" "}
                            Enter phone numbers manually or upload a file to pre-activate students
                          </p>
                        </div>

                        {/* Manual Entry */}
                        <div>
                          <label className="text-xs font-bold text-[#64748B] mb-2 block">
                            Enter Phone Numbers Manually
                          </label>

                          <p className="text-[10px] text-[#94A3B8] mb-2">
                            Add phone numbers one by one
                          </p>

                          <div className="space-y-2">
                            {preactivationNumbers.map((num, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={num}
                                  onChange={(e) => {
                                    const newNumbers = [...preactivationNumbers];
                                    newNumbers[idx] = e.target.value;
                                    setPreactivationNumbers(newNumbers);
                                    setPreactivationResults(null);
                                  }}
                                  placeholder="+1234567890"
                                  className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newNumbers = preactivationNumbers.filter((_, i) => i !== idx);
                                    setPreactivationNumbers(newNumbers);
                                    setPreactivationResults(null);
                                  }}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => {
                                setPreactivationNumbers([...preactivationNumbers, ""]);
                                setPreactivationResults(null);
                              }}
                              className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-2"
                            >
                              <Plus className="w-4 h-4" />
                              Add Phone Number
                            </button>
                          </div>
                        </div>

                        {/* Divider */}
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-px bg-gray-200"></div>
                          <span className="text-xs text-gray-400">OR</span>
                          <div className="flex-1 h-px bg-gray-200"></div>
                        </div>

                        {/* File Upload */}

                        <div>
                          <label className="text-xs font-bold text-[#64748B] mb-2 block">
                            Upload Phone Numbers File
                          </label>

                          <p className="text-[10px] text-[#94A3B8] mb-2">
                            Supported: .txt, .csv (one phone per line)
                          </p>

                          <input
                            ref={preactivationFileRef}
                            type="file"
                            accept=".txt,.csv"
                            onChange={handlePreactivationFileSelect}
                            className="hidden"
                          />

                          <button
                            onClick={() =>
                              preactivationFileRef.current?.click()
                            }
                            className="w-full py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-[#EEF2FF] hover:border-[#2137D6] text-[#475569] rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2"
                          >
                            <Upload className="w-4 h-4" />
                            Select File
                          </button>
                        </div>

                        {/* Phone Numbers Preview */}

                        {preactivationNumbers.length > 0 && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-xs font-bold text-[#64748B]">
                                Phone Numbers ({preactivationNumbers.length})
                              </label>

                              <button
                                onClick={clearPreactivationNumbers}
                                className="text-[10px] text-red-500 hover:text-red-600 flex items-center gap-1"
                              >
                                <X className="w-3 h-3" />
                                Clear
                              </button>
                            </div>

                            <div className="max-h-32 overflow-y-auto bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3">
                              <div className="flex flex-wrap gap-2">
                                {preactivationNumbers.map((num, idx) => (
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
                          onClick={() => {
                            // Create a file from the repeater fields
                            const phoneNumbersContent = preactivationNumbers
                              .filter(n => n.trim().length > 0)
                              .join('\n');
                             
                            if (phoneNumbersContent.length === 0) {
                              toast.error("Please add at least one phone number");
                              return;
                            }

                            const blob = new Blob([phoneNumbersContent], { type: 'text/plain' });
                            const file = new File([blob], 'phone_numbers.txt', { type: 'text/plain' });

                            handlePreactivationUpload(
                              parseInt(viewNode.data.id),
                              "chapter",
                              file,
                            );
                          }}
                          disabled={
                            preactivationNumbers.filter(n => n.trim().length > 0).length === 0 ||
                            isUploadingPreActivation
                          }
                          className="w-full py-2.5 bg-[#10B981] hover:bg-[#059669] text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {isUploadingPreActivation ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4" />
                              Upload{" "}
                              {preactivationNumbers.filter(n => n.trim().length > 0).length > 0 &&
                                `(${preactivationNumbers.filter(n => n.trim().length > 0).length})`}
                            </>
                          )}
                        </button>

                        {/* Pre-activation Results */}

                        {preactivationResults && (
                          <div className="mt-2 p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                            <p className="text-xs font-bold text-[#1E293B] mb-2">
                              Results:
                            </p>

                            <div className="flex items-center gap-4 mb-3">
                              <span className="text-xs text-green-600 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Success: {preactivationResults.success}
                              </span>

                              {preactivationResults.failed > 0 && (
                                <span className="text-xs text-red-600 flex items-center gap-1">
                                  <X className="w-3.5 h-3.5" />
                                  Failed: {preactivationResults.failed}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Attachments & Resources */}

                  {(viewNode.data as Chapter).attributes.attachments &&
                    (viewNode.data as Chapter).attributes.attachments!.length >
                      0 && (
                      <div className="mb-4">
                        <label className="text-xs font-medium text-gray-500 uppercase">
                          Attachments & Resources
                        </label>

                        <div className="mt-1 space-y-2">
                          {(
                            viewNode.data as Chapter
                          ).attributes.attachments!.map((attachment) => (
                            <div
                              key={attachment.id}
                              className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 p-2 rounded"
                            >
                              <span className="truncate">
                                {attachment.attributes.name || "Unnamed file"}
                              </span>

                              <span className="text-xs text-gray-400">
                                ({attachment.attributes.size || "Unknown size"})
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {viewNode.meta?.duration && (
                    <div className="mb-4">
                      <label className="text-xs font-medium text-gray-500 uppercase">
                        Duration
                      </label>

                      <p className="text-sm text-gray-700 mt-1">
                        {viewNode.meta.duration}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {viewNode.type === "note" && (
                <div className="space-y-4">
                  {/* Title */}

                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">
                      Title
                    </label>

                    <p className="text-lg font-semibold text-gray-900 mt-1">
                      {(viewNode.data as Note).attributes.title}
                    </p>
                  </div>

                  {/* Type */}

                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">
                      Type
                    </label>

                    <p className="text-sm text-gray-700 mt-1 capitalize">
                      {(viewNode.data as Note).attributes.type}
                    </p>
                  </div>

                  {/* Content */}

                  {(viewNode.data as Note).attributes.content && (
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase">
                        Content
                      </label>

                      <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">
                        {(viewNode.data as Note).attributes.content}
                      </p>
                    </div>
                  )}

                  {/* Linked Lecture */}

                  {(viewNode.data as Note).attributes.linked_lecture && (
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase">
                        Linked Lecture
                      </label>

                      <p className="text-sm text-gray-700 mt-1">
                        {(viewNode.data as Note).attributes.linked_lecture}
                      </p>
                    </div>
                  )}

                  {/* Attachment */}

                  {(viewNode.data as Note).attributes.attachment && (
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase mb-2 block">
                        Attachment
                      </label>

                      <a
                        href={(viewNode.data as Note).attributes.attachment?.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-500" />
                          <span className="text-sm text-gray-700">
                            {(viewNode.data as Note).attributes.attachment?.name}
                          </span>
                          <span className="text-xs text-gray-400">
                            ({(parseInt((viewNode.data as Note).attributes.attachment?.size || "0") / 1024).toFixed(1)} KB)
                          </span>
                        </div>

                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </a>
                    </div>
                  )}

                  {/* Publish Status */}

                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">
                      Status
                    </label>

                    <span
                      className={`inline-block px-2 py-0.5 text-[10px] font-medium rounded-full mt-1 ${
                        (viewNode.data as Note).attributes.is_publish
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {(viewNode.data as Note).attributes.is_publish
                        ? "Published"
                        : "Draft"}
                    </span>
                  </div>
                </div>
              )}

              {/* Actions */}

              <div className="pt-4 border-t border-gray-200">
                {/* Footer Actions */}

                <div className="flex gap-2 pt-4 mt-4 border-t border-gray-200 flex-wrap">
                  {viewNode.type === "chapter" && (
                    <>
                      <button
                        onClick={() => handleCopyMove(viewNode, "copy")}
                        className="px-3 py-2 bg-blue-50 text-blue-600 text-sm font-medium rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1"
                      >
                        <Copy className="w-4 h-4" />
                        Copy
                      </button>

                      <button
                        onClick={() => handleCopyMove(viewNode, "move")}
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
                      viewNode.type === "department"
                        ? "bg-blue-600 hover:bg-blue-700"
                        : viewNode.type === "course"
                          ? "bg-green-600 hover:bg-green-700"
                          : viewNode.type === "lecture"
                            ? "bg-purple-600 hover:bg-purple-700"
                            : "bg-orange-600 hover:bg-orange-700"
                    }`}
                  >
                    Edit{" "}
                    {viewNode.type.charAt(0).toUpperCase() +
                      viewNode.type.slice(1)}
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

      {/* Edit Modal */}

      {editModalOpen && selectedNode && (
        <EditModal
          node={selectedNode}
          onClose={() => {
            setEditModalOpen(false);

            setSelectedNode(null);
          }}
          onSubmit={handleEditSubmit}
          isLoading={
            isUpdatingDept ||
            isUpdatingCourse ||
            isUpdatingLecture ||
            isUpdatingChapter
          }
          progress={
            selectedNode?.type === "chapter" ? updateChapterProgress : 0
          }
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

            setUploadProgress(0);
          }}
          onSubmit={handleAddSubmit}
          isLoading={
            isCreatingDept ||
            isCreatingCourse ||
            isCreatingLecture ||
            isCreatingChapter
          }
          progress={addType === "chapter" ? createChapterProgress : 0}
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

            setSelectedTargetLecture("");
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
        title={
          selectedNode
            ? `${t("common.delete")} ${selectedNode.type}`
            : t("departments.deleteTitle")
        }
        itemName={selectedNode?.name || ""}
        isLoading={false}
      />

      {/* Generate Code Modal */}

      {generateCodeModalOpen && (
        <GenerateCodeModal
          itemType={generateCodeItemType}
          itemId={generateCodeItemId}
          onClose={() => {
            setGenerateCodeModalOpen(false);

            setGenerateCodeItemType("course");

            setGenerateCodeItemId("");

            refetchCodes();
          }}
        />
      )}

      {/* Note/Summary Modal */}

      {noteModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl shadow-xl max-h-[90vh] overflow-y-auto">
            {/* Header */}

            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-[#1E293B]">
                  {isEditMode ? "Edit Note/Summary" : "Add Note/Summary"}
                </h2>

                <p className="text-sm text-[#64748B] mt-0.5">
                  {isEditMode
                    ? "Update this note or summary"
                    : "Create a new note or summary for this course"}
                </p>
              </div>

              <button
                onClick={() => setNoteModalOpen(false)}
                className="p-2.5 bg-white border border-[#E2E8F0] rounded-xl text-[#64748B] hover:text-[#1E293B] hover:shadow-sm transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleNoteSubmit} className="space-y-4">
              {/* Title */}

              <div>
                <label className="block text-sm font-semibold text-[#475569] mb-2">
                  Title <span className="text-[#EF4444]">*</span>
                </label>

                <input
                  type="text"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="Enter note title"
                  className={`w-full px-4 py-3 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all placeholder:text-[#94A3B8] ${
                    noteErrors.title ? "border-[#EF4444]" : "border-[#E2E8F0]"
                  }`}
                />

                {noteErrors.title && (
                  <p className="mt-1 text-sm text-[#EF4444]">
                    {noteErrors.title}
                  </p>
                )}
              </div>

              {/* Type */}

              <div>
                <label className="block text-sm font-semibold text-[#475569] mb-2">
                  Type <span className="text-[#EF4444]">*</span>
                </label>

                <select
                  value={noteType}
                  onChange={(e) => setNoteType(e.target.value)}
                  className={`w-full px-4 py-3 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all ${
                    noteErrors.type ? "border-[#EF4444]" : "border-[#E2E8F0]"
                  }`}
                >
                  {getNoteTypes().map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>

                {noteErrors.type && (
                  <p className="mt-1 text-sm text-[#EF4444]">
                    {noteErrors.type}
                  </p>
                )}
              </div>

              {/* Course (pre-filled) */}

              <div>
                <label className="block text-sm font-semibold text-[#475569] mb-2">
                  Course
                </label>

                <div className="relative">
                  <select
                    value={noteCourseId}
                    disabled
                    className="w-full px-4 py-3 bg-gray-50 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all appearance-none cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Select course</option>

                    {courses?.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.attributes.title}
                      </option>
                    ))}
                  </select>

                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] pointer-events-none" />
                </div>
              </div>

              {/* Linked Lecture */}

              <div>
                <label className="block text-sm font-semibold text-[#475569] mb-2">
                  Linked Lecture
                </label>

                <input
                  type="text"
                  value={noteLinkedLecture}
                  onChange={(e) => setNoteLinkedLecture(e.target.value)}
                  placeholder="Enter linked lecture"
                  className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all placeholder:text-[#94A3B8]"
                />
              </div>

              {/* Content */}

              <div>
                <label className="block text-sm font-semibold text-[#475569] mb-2">
                  Content
                </label>

                <div className="relative">
                  <FileText className="absolute left-4 top-4 w-5 h-5 text-[#94A3B8]" />

                  <textarea
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="Enter note content"
                    rows={8}
                    className="w-full pl-12 pr-4 py-4 bg-white border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all placeholder:text-[#94A3B8] resize-none"
                  />
                </div>

                <p className="mt-2 text-xs text-[#94A3B8]">
                  Characters: {noteContent.length}
                </p>
              </div>

              {/* Attachment */}

              <div>
                <label className="block text-sm font-semibold text-[#475569] mb-2">
                  Attachment
                </label>

                <input
                  ref={noteAttachmentInputRef}
                  type="file"
                  accept="*/*"
                  onChange={handleNoteAttachmentChange}
                  className="hidden"
                />

                {noteAttachment || noteAttachmentPreview ? (
                  <div className="flex items-center gap-4 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {noteAttachment?.name || "Current attachment"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {noteAttachment
                          ? `${(noteAttachment.size / 1024).toFixed(2)} KB`
                          : "Existing file"}
                      </p>
                      {noteAttachmentPreview && !noteAttachment && (
                        <a
                          href={noteAttachmentPreview}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Download attachment
                        </a>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleNoteAttachmentRemove}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove attachment"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={handleNoteAttachmentClick}
                    className="p-8 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex flex-col items-center">
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <span className="text-sm font-medium text-gray-600">
                        Click to upload attachment
                      </span>
                      <span className="text-xs text-gray-400 mt-1">
                        Any file type supported
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Publish Status */}

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isPublish"
                  checked={noteIsPublish}
                  onChange={(e) => setNoteIsPublish(e.target.checked)}
                  className="w-5 h-5 rounded border-[#E2E8F0] text-[#2137D6] focus:ring-[#2137D6]"
                />

                <label
                  htmlFor="isPublish"
                  className="text-sm font-semibold text-[#475569]"
                >
                  Publish immediately
                </label>
              </div>

              {/* Actions */}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setNoteModalOpen(false)}
                  className="px-5 py-2.5 text-sm font-bold text-[#64748B] hover:text-[#1E293B] transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isCreatingNote || isUpdatingNote}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#2137D6] hover:bg-[#1a2bb3] text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreatingNote || isUpdatingNote ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />

                      {isEditMode ? "Updating..." : "Creating..."}
                    </>
                  ) : isEditMode ? (
                    "Update Note"
                  ) : (
                    "Create Note"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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

function EditModal({
  node,
  onClose,
  onSubmit,
  isLoading,
  progress = 0,
}: EditModalProps) {
  const [formData, setFormData] = useState<Record<string, any>>(() => {
    switch (node.type) {
      case "university":
        const univ = node.data as University;

        return {
          name: univ.attributes.name,

          image: null,
        };

      case "center":
        const center = node.data as Center;

        return {
          name: center.name,

          image: null,
        };

      case "faculty":
        const faculty = node.data as Faculty;

        return {
          name: faculty.attributes.name,

          image: null,
        };

      case "department":
        const dept = node.data as Department;

        return {
          name: dept.attributes.name,

          image: null,
        };

      case "course":
        const course = node.data as Course;

        return {
          title: course.attributes.title,

          sub_title: course.attributes.sub_title || "",

          description: course.attributes.description || "",

          objectives: course.attributes.objectives || "",

          status: course.attributes.status,

          price: course.attributes.price?.toString() || "0",

          max_views_per_student:
            course.attributes.max_views_per_student?.toString() || "10",

          thumbnail: null,
        };

      case "lecture":
        const lecture = node.data as Lecture;

        return {
          title: lecture.attributes.title,

          description: lecture.attributes.description || "",
        };

      case "chapter":
        const chapter = node.data as Chapter;

        return {
          title: chapter.attributes.title,

          duration: chapter.attributes.duration || "",

          is_free_preview: chapter.attributes.is_free_preview ?? false,

          max_views: chapter.attributes.max_views,

          view_by_minute: chapter.attributes.view_by_minute,

          thumbnail: null,
        };

      default:
        return {};
    }
  });

  const [imagePreview, setImagePreview] = useState<string | null>(() => {
    if (node.type === "university") {
      const univ = node.data as University;

      return univ.attributes.image || null;
    }

    if (node.type === "center") {
      const center = node.data as Center;

      return center.image || null;
    }

    if (node.type === "faculty") {
      const faculty = node.data as Faculty;

      return faculty.attributes.image || null;
    }

    if (node.type === "department") {
      const dept = node.data as Department;

      return dept.attributes.image || null;
    }

    return null;
  });

  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(
    () => {
      if (node.type === "course") {
        const course = node.data as Course;

        return course.attributes.thumbnail || null;
      }

      if (node.type === "chapter") {
        const chapter = node.data as Chapter;

        return chapter.attributes.thumbnail || null;
      }

      return null;
    },
  );

  const [videoPreview, setVideoPreview] = useState<string | null>(() => {
    if (node.type === "chapter") {
      const chapter = node.data as Chapter;

      return chapter.attributes.video || null;
    }

    return null;
  });

  const [attachments, setAttachments] = useState<any[]>(() => {
    if (node.type === "chapter") {
      const chapter = node.data as Chapter;
      return chapter.attributes.attachments || [];
    }
    return [];
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const videoInputRef = useRef<HTMLInputElement>(null);

  const attachmentInputRef = useRef<HTMLInputElement>(null);

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

      // Extract video duration

      const video = document.createElement("video");

      video.preload = "metadata";

      video.onloadedmetadata = () => {
        const duration = video.duration;

        const minutes = Math.floor(duration / 60);

        const seconds = Math.floor(duration % 60);

        const formattedDuration = `${minutes}:${seconds.toString().padStart(2, "0")}`;

        setFormData((prev) => ({ ...prev, duration: formattedDuration }));

        URL.revokeObjectURL(video.src);
      };

      video.src = URL.createObjectURL(file);
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

  const handleAttachmentClick = () => {
    attachmentInputRef.current?.click();
  };

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newAttachments = Array.from(files);
      setAttachments((prev) => [...prev, ...newAttachments]);
      setFormData({ ...formData, attachments: [...attachments, ...newAttachments] });
    }
  };

  const handleRemoveAttachment = (index: number) => {
    const newAttachments = attachments.filter((_, i) => i !== index);
    setAttachments(newAttachments);
    setFormData({ ...formData, attachments: newAttachments });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-4 w-full max-w-lg max-h-[80vh] overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            Edit {node.type === "chapter" ? "Lesson" : node.type}
          </h3>

          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* University fields */}

          {node.type === "university" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image
                </label>

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

                    <span className="text-gray-400 text-xs">
                      Click to upload
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>

                <input
                  type="text"
                  value={formData.name || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            </>
          )}

          {/* Center fields */}

          {node.type === "center" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image
                </label>

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

                    <span className="text-gray-400 text-xs">
                      Click to upload
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>

                <input
                  type="text"
                  value={formData.name || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>
            </>
          )}

          {/* Faculty fields */}

          {node.type === "faculty" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image
                </label>

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

                    <span className="text-gray-400 text-xs">
                      Click to upload
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>

                <input
                  type="text"
                  value={formData.name || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  required
                />
              </div>
            </>
          )}

          {/* Department fields */}

          {node.type === "department" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image
                </label>

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

                    <span className="text-gray-400 text-xs">
                      Click to upload
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>

                <input
                  type="text"
                  value={formData.name || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </>
          )}

          {/* Course fields */}

          {node.type === "course" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>

                <input
                  type="text"
                  value={formData.title || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subtitle
                </label>

                <input
                  type="text"
                  value={formData.sub_title || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, sub_title: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>

                  <textarea
                    value={formData.description || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Objectives
                  </label>

                  <textarea
                    value={formData.objectives || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, objectives: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows={2}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Thumbnail
                  </label>

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

                      <span className="text-gray-400 text-xs text-center leading-tight">
                        Click to
                        <br />
                        upload
                      </span>
                    </div>
                  )}
                </div>

                <div className="col-span-2 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>

                    <select
                      value={formData.status || 0}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          status: parseInt(e.target.value),
                        })
                      }
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price || "0"}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Views
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={formData.max_views_per_student || "10"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        max_views_per_student: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
            </>
          )}

          {/* Lecture fields */}

          {node.type === "lecture" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>

                <input
                  type="text"
                  value={formData.title || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>

                <textarea
                  value={formData.description || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows={3}
                />
              </div>
            </>
          )}

          {/* Lesson fields */}

          {node.type === "chapter" && (
            <>
              {/* Media Upload Section */}

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-4">
                <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <FileVideo className="w-4 h-4 text-orange-500" />
                  Media Files
                </h4>

                {/* Video Upload */}

                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase mb-2">
                    Video
                  </label>

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
                          <span className="text-white text-sm font-medium">
                            Change Video
                          </span>
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

                      <span className="text-sm font-medium text-gray-600">
                        Click to upload video
                      </span>

                      <span className="text-xs text-gray-400 mt-1">
                        MP4, WebM, MOV up to 500MB
                      </span>
                    </div>
                  )}
                </div>

                {/* Thumbnail Upload */}

                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase mb-2">
                    Thumbnail
                  </label>

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

                      <span className="text-xs text-gray-500">
                        Add thumbnail
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Lesson Details */}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>

                  <input
                    type="text"
                    value={formData.title || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Views
                  </label>

                  <input
                    type="number"
                    min="0"
                    defaultValue={
                      (node.data as Chapter).attributes.max_views ?? 5
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration
                  </label>

                  <input
                    type="text"
                    value={formData.duration || ""}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50"
                    placeholder="Auto-extracted from video"
                  />
                </div>
              </div>

              {/* Attachments Upload */}

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-4">
                <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-500" />
                  Attachments
                </h4>

                <input
                  ref={attachmentInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt,.zip,.rar"
                  onChange={handleAttachmentChange}
                  className="hidden"
                />

                <div
                  onClick={handleAttachmentClick}
                  className="w-full bg-white rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-gray-400 transition-all group p-6"
                >
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Upload className="w-6 h-6 text-blue-500" />
                  </div>

                  <span className="text-sm font-medium text-gray-600">
                    Click to upload attachments
                  </span>

                  <span className="text-xs text-gray-400 mt-1">
                    PDF, DOC, DOCX, TXT, ZIP, RAR (multiple files allowed)
                  </span>
                </div>

                {attachments.length > 0 && (
                  <div className="space-y-2">
                    {attachments.map((attachment, index) => {
                      const isExistingAttachment = attachment.attributes;
                      const fileName = isExistingAttachment
                        ? attachment.attributes.name
                        : attachment.name;
                      const fileSize = isExistingAttachment
                        ? attachment.attributes.size
                        : attachment.size;

                      return (
                        <div
                          key={isExistingAttachment ? attachment.id : index}
                          className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-2"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-500" />
                            <span className="text-sm text-gray-700 truncate max-w-[200px]">
                              {fileName}
                            </span>
                            <span className="text-xs text-gray-400">
                              ({(parseInt(fileSize) / 1024).toFixed(1)} KB)
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveAttachment(index)}
                            className="text-red-500 hover:text-red-600 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-lg">
                <label
                  htmlFor="edit_is_free_preview"
                  className="text-sm font-medium text-gray-700"
                >
                  Free Preview
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <div
                    className={`w-11 h-6 rounded-full transition-colors relative ${formData.is_free_preview ? "bg-orange-500" : "bg-gray-200"}`}
                  >
                    <input
                      type="checkbox"
                      id="edit_is_free_preview"
                      checked={formData.is_free_preview}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          is_free_preview: e.target.checked,
                        })
                      }
                      className="sr-only"
                    />

                    <span
                      className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.is_free_preview ? "translate-x-5" : ""}`}
                    />
                  </div>
                </label>
              </div>

              {/* View Detection Timestamp */}

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <label className="block text-sm font-medium text-blue-700 mb-2 flex items-center gap-2">
                  <PlayCircle className="w-4 h-4" />
                  View Detection Timestamp
                </label>

                <p className="text-xs text-gray-500 mb-2">
                  Set the specific moment (in minutes) when the view API should
                  be triggered
                </p>

                <input
                  type="number"
                  min="0"
                  step="1"
                  value={
                    formData.view_by_minute ??
                    (node.data as Chapter).attributes.view_by_minute ??
                    0
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      view_by_minute: e.target.value
                        ? parseInt(e.target.value)
                        : null,
                    })
                  }
                  className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. 30 (minutes)"
                />
              </div>
            </>
          )}

          {/* Footer Buttons */}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Close
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-[#2137D6] text-white rounded-lg hover:bg-[#1a2bb3] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
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

function AddModal({
  type,
  parentId,
  onClose,
  onSubmit,
  isLoading,
  progress = 0,
}: AddModalProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});

  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  const [videoPreview, setVideoPreview] = useState<string | null>(null);

  const [attachments, setAttachments] = useState<File[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const videoInputRef = useRef<HTMLInputElement>(null);

  const attachmentInputRef = useRef<HTMLInputElement>(null);

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

      // Extract video duration

      const video = document.createElement("video");

      video.preload = "metadata";

      video.onloadedmetadata = () => {
        const duration = video.duration;

        const minutes = Math.floor(duration / 60);

        const seconds = Math.floor(duration % 60);

        const formattedDuration = `${minutes}:${seconds.toString().padStart(2, "0")}`;

        setFormData((prev) => ({ ...prev, duration: formattedDuration }));

        URL.revokeObjectURL(video.src);
      };

      video.src = URL.createObjectURL(file);
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

  const handleAttachmentClick = () => {
    attachmentInputRef.current?.click();
  };

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newAttachments = Array.from(files);
      setAttachments((prev) => [...prev, ...newAttachments]);
      setFormData({ ...formData, attachments: [...attachments, ...newAttachments] });
    }
  };

  const handleRemoveAttachment = (index: number) => {
    const newAttachments = attachments.filter((_, i) => i !== index);
    setAttachments(newAttachments);
    setFormData({ ...formData, attachments: newAttachments });
  };

  const getTitle = () => {
    if (type === "department" && parentId) return "Add Sub-department";

    if (type === "chapter") return "Add Lesson";

    return `Add ${type.charAt(0).toUpperCase() + type.slice(1)}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-4 w-full max-w-md max-h-[80vh] overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{getTitle()}</h3>

          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* University fields */}

          {type === "university" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image
                </label>

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

                    <span className="text-gray-400 text-xs">
                      Click to upload
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>

                <input
                  type="text"
                  value={formData.name || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            </>
          )}

          {/* Center fields */}

          {type === "center" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image
                </label>

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

                    <span className="text-gray-400 text-xs">
                      Click to upload
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>

                <input
                  type="text"
                  value={formData.name || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>
            </>
          )}

          {/* Faculty fields */}

          {type === "faculty" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image
                </label>

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

                    <span className="text-gray-400 text-xs">
                      Click to upload
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>

                <input
                  type="text"
                  value={formData.name || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  required
                />
              </div>
            </>
          )}

          {/* Department fields */}

          {type === "department" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image
                </label>

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

                    <span className="text-gray-400 text-xs">
                      Click to upload
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>

                <input
                  type="text"
                  value={formData.name || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </>
          )}

          {/* Course fields */}

          {type === "course" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Thumbnail *
                </label>

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

                    <span className="text-gray-400 text-xs">
                      Click to upload
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>

                <input
                  type="text"
                  value={formData.title || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sub Title
                </label>

                <input
                  type="text"
                  value={formData.sub_title || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, sub_title: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>

                <textarea
                  value={formData.description || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Objectives
                </label>

                <textarea
                  value={formData.objectives || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, objectives: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price || "0"}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Views
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={formData.max_views_per_student || "10"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        max_views_per_student: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>

                  <select
                    value={formData.status ?? 0}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value={0}>Draft</option>

                    <option value={1}>Active</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {/* Lecture fields */}

          {type === "lecture" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Thumbnail
                </label>

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

                    <span className="text-gray-400 text-xs">
                      Click to upload
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>

                <input
                  type="text"
                  value={formData.title || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>

                <textarea
                  value={formData.description || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows={3}
                />
              </div>
            </>
          )}

          {/* Lesson fields */}

          {type === "chapter" && (
            <>
              {/* Media Upload Section */}

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-4">
                <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <FileVideo className="w-4 h-4 text-orange-500" />
                  Media Files
                </h4>

                {/* Video Upload */}

                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase mb-2">
                    Video
                  </label>

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
                          <span className="text-white text-sm font-medium">
                            Change Video
                          </span>
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

                      <span className="text-sm font-medium text-gray-600">
                        Click to upload video
                      </span>

                      <span className="text-xs text-gray-400 mt-1">
                        MP4, WebM, MOV up to 500MB
                      </span>
                    </div>
                  )}
                </div>

                {/* Thumbnail Upload */}

                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase mb-2">
                    Thumbnail
                  </label>

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

                      <span className="text-xs text-gray-500">
                        Add thumbnail
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Lesson Details */}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>

                  <input
                    type="text"
                    value={formData.title || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Views
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={formData.max_views}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        max_views: e.target.value
                          ? parseInt(e.target.value)
                          : undefined,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration
                  </label>

                  <input
                    type="text"
                    value={formData.duration || ""}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50"
                    placeholder="Auto-extracted from video"
                  />
                </div>
              </div>

              {/* Attachments Upload */}

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-4">
                <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-500" />
                  Attachments
                </h4>

                <input
                  ref={attachmentInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt,.zip,.rar"
                  onChange={handleAttachmentChange}
                  className="hidden"
                />

                <div
                  onClick={handleAttachmentClick}
                  className="w-full bg-white rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-gray-400 transition-all group p-6"
                >
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Upload className="w-6 h-6 text-blue-500" />
                  </div>

                  <span className="text-sm font-medium text-gray-600">
                    Click to upload attachments
                  </span>

                  <span className="text-xs text-gray-400 mt-1">
                    PDF, DOC, DOCX, TXT, ZIP, RAR (multiple files allowed)
                  </span>
                </div>

                {attachments.length > 0 && (
                  <div className="space-y-2">
                    {attachments.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-2"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-500" />
                          <span className="text-sm text-gray-700 truncate max-w-[200px]">
                            {file.name}
                          </span>
                          <span className="text-xs text-gray-400">
                            ({(file.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(index)}
                          className="text-red-500 hover:text-red-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-lg">
                <label
                  htmlFor="add_is_free_preview"
                  className="text-sm font-medium text-gray-700"
                >
                  Free Preview
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <div
                    className={`w-11 h-6 rounded-full transition-colors relative ${formData.is_free_preview ? "bg-orange-500" : "bg-gray-200"}`}
                  >
                    <input
                      type="checkbox"
                      id="add_is_free_preview"
                      checked={formData.is_free_preview}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          is_free_preview: e.target.checked,
                        })
                      }
                      className="sr-only"
                    />

                    <span
                      className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.is_free_preview ? "translate-x-5" : ""}`}
                    />
                  </div>
                </label>
              </div>

              {/* View Detection Timestamp */}

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <label className="block text-sm font-medium text-blue-700 mb-2 flex items-center gap-2">
                  <PlayCircle className="w-4 h-4" />
                  View Detection Timestamp
                </label>

                <p className="text-xs text-gray-500 mb-2">
                  Set the specific moment (in minutes) when the view API should
                  be triggered
                </p>

                <input
                  type="number"
                  min="0"
                  step="1"
                  value={formData.view_by_minute || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      view_by_minute: e.target.value
                        ? parseInt(e.target.value)
                        : null,
                    })
                  }
                  className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  placeholder="e.g. 30 (minutes)"
                />
              </div>
            </>
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
                    {progress < 100 ? "Uploading files..." : "Upload complete!"}
                  </p>

                  <p className="text-xs text-gray-500">
                    {progress < 100
                      ? "Please wait while we upload your files"
                      : "Your files have been uploaded successfully"}
                  </p>
                </div>

                <span className="text-lg font-bold text-blue-600">
                  {progress}%
                </span>
              </div>

              <div className="w-full bg-blue-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Close
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-[#2137D6] text-white rounded-lg hover:bg-[#1a2bb3] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />

                  {progress > 0 ? `Creating... ${progress}%` : "Creating..."}
                </>
              ) : (
                "Save"
              )}
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

  mode: "copy" | "move";

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

  isLoading,
}: CopyMoveModalProps) {
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(
    new Set(),
  );

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
              {mode === "copy" ? "Copy Lesson" : "Move Lesson"}
            </h3>

            <p className="text-sm text-gray-500 mt-0.5">
              {mode === "copy"
                ? `Copy "${chapter.attributes.title}" to another lecture`
                : `Move "${chapter.attributes.title}" to another lecture`}
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
                <div
                  key={course.id}
                  className="border border-gray-100 rounded-lg overflow-hidden"
                >
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

                    {courseLectures.length > 0 &&
                      (isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      ))}
                  </button>

                  {/* Lectures List */}

                  {isExpanded && courseLectures.length > 0 && (
                    <div className="bg-white">
                      {courseLectures.map((lecture) => {
                        const isCurrentLecture =
                          String(lecture.id) ===
                          String(chapter.attributes.lecture_id);

                        const isSelected = selectedTarget === lecture.id;

                        return (
                          <button
                            key={lecture.id}
                            onClick={() =>
                              !isCurrentLecture && onSelectTarget(lecture.id)
                            }
                            disabled={isCurrentLecture}
                            className={`w-full flex items-center gap-2 p-2 pl-8 text-left transition-colors ${
                              isCurrentLecture
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : isSelected
                                  ? "bg-orange-50 text-orange-700"
                                  : "hover:bg-gray-50 text-gray-700"
                            }`}
                          >
                            <FolderOpen
                              className={`w-4 h-4 ${
                                isCurrentLecture
                                  ? "text-gray-400"
                                  : "text-purple-500"
                              }`}
                            />

                            <span className="text-sm flex-1">
                              {lecture.attributes.title}
                            </span>

                            {isCurrentLecture && (
                              <span className="text-xs text-gray-400">
                                (Current)
                              </span>
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
                <span className="font-medium">Target:</span>{" "}
                {(() => {
                  for (const course of courses) {
                    const lectures = lecturesByCourse[course.id] || [];

                    const lecture = lectures.find(
                      (l) => l.id === selectedTarget,
                    );

                    if (lecture) {
                      return `${course.attributes.title} > ${lecture.attributes.title}`;
                    }
                  }

                  return "Selected Lecture";
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
              mode === "copy"
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-purple-600 hover:bg-purple-700"
            }`}
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}

            {isLoading
              ? mode === "copy"
                ? "Copying..."
                : "Moving..."
              : mode === "copy"
                ? "Copy Lesson"
                : "Move Lesson"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Generate Code Modal Component

interface GenerateCodeModalProps {
  itemType: "course" | "chapter" | "department";

  itemId: string;

  onClose: () => void;
}

function GenerateCodeModal({
  itemType,
  itemId,
  onClose,
}: GenerateCodeModalProps) {
  const t = useTranslations();

  const { mutate: createCode, isLoading: isGenerating } = useCreateCode();

  const [quantity, setQuantity] = useState(1);

  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);

  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Generate a random 8-character alphanumeric code

  const generateRandomCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    let code = "";

    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return code;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!itemId) {
      toast.error("Please select an item");

      return;
    }

    try {
      // Generate the requested number of codes

      const codesToGenerate: string[] = [];

      for (let i = 0; i < quantity; i++) {
        codesToGenerate.push(generateRandomCode());
      }

      const codeableType =
        itemType === "course" ? "App\\Models\\Course" :
        itemType === "chapter" ? "App\\Models\\Chapter" :
        "App\\Models\\Department";

      const result = await createCode({
        codeable_id: parseInt(itemId),

        codeable_type: codeableType,

        codes: codesToGenerate,
      });

      if (result && Array.isArray(result)) {
        const returnedCodes = result.map((c) => c.attributes.code);

        setGeneratedCodes(returnedCodes);

        toast.success(`${quantity} codes generated successfully`);
      }
    } catch {
      // Error handled by hook
    }
  };

  const handleCopy = (code: string, index: number) => {
    navigator.clipboard.writeText(code);

    setCopiedIndex(index);

    toast.success("Code copied");

    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
        {/* Header */}

        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Generate Activation Codes
            </h3>

            <p className="text-sm text-gray-500 mt-0.5">
              For {itemType === "course" ? "Course" : itemType === "chapter" ? "Lesson" : "Department"} #{itemId}
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
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Quantity */}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity <span className="text-red-500">*</span>
              </label>

              <input
                type="number"
                min={1}
                max={100}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all"
                required
              />

              <p className="text-xs text-[#94A3B8] mt-1">
                Maximum 100 codes per generation
              </p>
            </div>

            {/* Generated Codes Display */}

            {generatedCodes.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <h4 className="text-sm font-bold text-green-700 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Generated Codes ({generatedCodes.length})
                </h4>

                <div className="grid grid-cols-2 gap-2">
                  {generatedCodes.map((code, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2 bg-white border border-green-200 rounded-lg"
                    >
                      <span className="font-mono text-xs font-medium text-gray-900 flex-1">
                        {code}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleCopy(code, index)}
                        className="p-1 hover:bg-green-50 rounded transition-colors"
                        title="Copy code"
                      >
                        {copiedIndex === index ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-gray-500" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}

        <div className="flex gap-3 p-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>

          <button
            onClick={handleSubmit}
            disabled={isGenerating || !itemId}
            className="flex-1 px-4 py-2 bg-[#2137D6] text-white text-sm font-medium rounded-lg hover:bg-[#1a2bb3] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

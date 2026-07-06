import type {
  University,
  Faculty,
  Center,
  Department,
  Course,
  Lecture,
  Chapter,
  Note,
} from "@/src/types";
import type { TreeNode } from "./useMillerState";

export function buildUnifiedTree(
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

  // Create center nodes and process their children
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

      // Second pass: create department nodes
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

  const rootNodes: TreeNode[] = [];

  // Add universities as root nodes (level 0)
  universityMap.forEach((univ) => {
    rootNodes.push(univ);
  });

  // Build center hierarchy under universities (level 1)
  centers.forEach((center) => {
    const node = centerMap.get(center.id)!;
    const parentId = center.parent?.data?.id || center.parent_id;

    if (parentId && universityMap.has(String(parentId))) {
      const parent = universityMap.get(String(parentId))!;
      node.level = parent.level + 1;
      node.parentId = parent.id;
      parent.children.push(node);
    } else {
      node.level = 0;
      rootNodes.push(node);
    }
  });

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
  });

  // Build department hierarchy under faculties (level 3) or sub-departments (level 4+)
  departments.forEach((dept) => {
    const node = departmentMap.get(dept.id)!;
    const parentId = dept.attributes.parent?.data?.id;

    if (parentId) {
      if (facultyMap.has(String(parentId))) {
        const parent = facultyMap.get(String(parentId))!;
        node.level = parent.level + 1;
        node.parentId = parent.id;
        parent.children.push(node);
      } else if (departmentMap.has(String(parentId))) {
        const parent = departmentMap.get(String(parentId))!;
        node.level = parent.level + 1;
        node.parentId = parent.id;
        parent.children.push(node);
      }
    }
  });

  const sortDepartmentsByOrder = (node: TreeNode) => {
    if (node.children.length === 0) return;

    node.children.sort((a, b) => {
      if (a.type === "department" && b.type === "department") {
        const orderA = (a.data as Department).attributes.order || 0;
        const orderB = (b.data as Department).attributes.order || 0;
        return orderA - orderB;
      }
      return 0;
    });

    node.children.forEach(sortDepartmentsByOrder);
  };

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
      course.attributes.category?.data?.id ||
      course.attributes.department?.data?.id ||
      course.attributes.category_id?.toString();

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

export function filterTree(nodes: TreeNode[], query: string): TreeNode[] {
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

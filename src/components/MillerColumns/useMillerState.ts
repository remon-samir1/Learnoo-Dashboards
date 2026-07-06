import { useState, useCallback, useMemo } from "react";
import type {
  University,
  Faculty,
  Center,
  Department,
  Course,
  Lecture,
  Chapter,
} from "@/src/types";

export type NodeType =
  | "university"
  | "faculty"
  | "center"
  | "department"
  | "course"
  | "lecture"
  | "chapter"
  | "note";

export interface TreeNode {
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
    | any; // note typings might differ
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

export type SelectionPath = {
  university?: University;
  center?: Center;
  faculty?: Faculty;
  department?: Department;
  course?: Course;
  lecture?: Lecture;
  chapter?: Chapter;
};

// Maps node type to the key in SelectionPath
const typeToPathKey: Record<string, keyof SelectionPath> = {
  university: "university",
  center: "center",
  faculty: "faculty",
  department: "department",
  course: "course",
  lecture: "lecture",
  chapter: "chapter",
};

export function useMillerState() {
  const [selectedNodes, setSelectedNodes] = useState<TreeNode[]>([]);

  // Derived state: SelectionPath matching the request spec
  const path = useMemo(() => {
    const p: SelectionPath = {};
    selectedNodes.forEach((node) => {
      const key = typeToPathKey[node.type];
      if (key) {
        p[key] = node.data as any;
      }
    });
    return p;
  }, [selectedNodes]);

  // selectAt for jumping to a specific level/breadcrumb segment, clearing deeper levels.
  // When level is null, resets to root.
  const selectAt = useCallback(
    (level: keyof SelectionPath | null) => {
      if (level === null) {
        setSelectedNodes([]);
        return;
      }

      const levels: (keyof SelectionPath)[] = [
        "university",
        "center",
        "faculty",
        "department",
        "course",
        "lecture",
        "chapter",
      ];
      const idx = levels.indexOf(level);
      if (idx === -1) return;

      setSelectedNodes((prev) => {
        const newNodes: TreeNode[] = [];
        for (let i = 0; i < prev.length; i++) {
          const node = prev[i];
          const nodeKey = typeToPathKey[node.type];
          const nodeLevelIdx = levels.indexOf(nodeKey);
          if (nodeLevelIdx <= idx) {
            newNodes.push(node);
          } else {
            break;
          }
        }
        return newNodes;
      });
    },
    []
  );

  // Directly select a TreeNode at a specific column index
  const selectNode = useCallback((node: TreeNode, colIndex: number) => {
    setSelectedNodes((prev) => {
      const updated = prev.slice(0, colIndex);
      updated.push(node);
      return updated;
    });
  }, []);

  const resetPath = useCallback(() => {
    setSelectedNodes([]);
  }, []);

  return {
    selectedNodes,
    path,
    selectNode,
    selectAt,
    resetPath,
    setSelectedNodes,
  };
}

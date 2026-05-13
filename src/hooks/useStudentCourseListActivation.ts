"use client";

import { useCallback, useState } from "react";
import type { Course } from "@/src/types";

/**
 * Shared open/close + course target state for {@link StudentCourseActivationModal}
 * from course list UIs (home “My courses”, `/student/courses`, etc.).
 */
export function useStudentCourseListActivation() {
  const [open, setOpen] = useState(false);
  const [courseId, setCourseId] = useState("");
  const [courseTitle, setCourseTitle] = useState("");

  const openForCourse = useCallback((course: Course) => {
    setCourseId(course.id);
    setCourseTitle(course.attributes.title ?? "");
    setOpen(true);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setCourseId("");
    setCourseTitle("");
  }, []);

  return { open, courseId, courseTitle, openForCourse, close };
}

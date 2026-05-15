/**
 * Student payload for the video watermark overlay.
 * Replace `getStudentInfo` with a real API call when wiring to production.
 */
export type StudentInfo = {
  name: string;
  id: string;
  course: string;
};

/**
 * Mock student fetch — swap for `fetch('/api/student/me')` or similar.
 */
export async function getStudentInfo(): Promise<StudentInfo> {
  await new Promise((r) => setTimeout(r, 120));
  return {
    name: 'Ali',
    id: 'STU-12345',
    course: 'React Advanced',
  };
}

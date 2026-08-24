import NotesSummariesClient from "@/components/student/notes-summaries/NotesSummariesClient";
import { getStudentNotes, getStudentCourses } from "@/src/services/student/user.service";

export default async function StudentNotesPage() {
  const notesResponse = await getStudentNotes();

  const notes = Array.isArray(notesResponse?.data)
    ? notesResponse.data
    : notesResponse?.data?.data || [];

  const coursesResult = await getStudentCourses();
  const courses = coursesResult.success ? coursesResult.data?.data ?? [] : [];

  const enrolledCourseIds = new Set(
    (courses || []).map((c: { id: string | number }) => String(c.id))
  );

  const enrolledNotes = (notes || []).filter(
    (note: any) =>
      note.attributes?.course_id &&
      enrolledCourseIds.has(String(note.attributes.course_id))
  );

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <NotesSummariesClient notes={enrolledNotes} />
    </div>
  );
}

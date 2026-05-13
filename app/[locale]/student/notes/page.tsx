import NotesSummariesClient from "@/components/student/notes-summaries/NotesSummariesClient";
import { getStudentNotes } from "@/src/services/student/user.service";

export default async function StudentNotesPage() {
  const notesResponse = await getStudentNotes();

  const notes = Array.isArray(notesResponse?.data)
    ? notesResponse.data
    : notesResponse?.data?.data || [];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <NotesSummariesClient notes={notes} />
    </div>
  );
}

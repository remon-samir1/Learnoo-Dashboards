import NotesSummariesClient from "@/components/student/notes-summaries/NotesSummariesClient";
import { getStudentNotes } from "@/src/services/student/user.service";

export default async function StudentNotesPage() {
  const notesResponse = await getStudentNotes();

  const notes = Array.isArray(notesResponse?.data)
    ? notesResponse.data
    : notesResponse?.data?.data || [];

  return <NotesSummariesClient notes={notes} />;
}

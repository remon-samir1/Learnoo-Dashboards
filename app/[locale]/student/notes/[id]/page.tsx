import { notFound } from "next/navigation";
import { getStudentNoteById } from "@/src/services/student/note.service";
import NoteDetailsClient from "../../../../../components/student/notes-summaries/NoteDetailsClient";

type PageProps = {
  params: Promise<{
    locale: string;
    id: string;
  }>;
};

export default async function StudentNoteDetailsPage({ params }: PageProps) {
  const { id } = await params;

  const response = await getStudentNoteById(id);

  const note = response?.data?.data;

  if (!response.success || !note) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <NoteDetailsClient note={note} />
    </div>
  );
}

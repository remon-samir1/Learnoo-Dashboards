import ContinueWatchingSection from "@/src/components/student/home/ContinueWatchingSection";
import GetStudentNotes from "@/src/components/student/home/GetStudentNotes";
import LatestPostsSection from "@/src/components/student/home/LatestPostsSection";
import LibrarySection from "@/src/components/student/home/LibrarySection";
import UpcomingLiveClasses from "@/src/components/student/home/LiveSessions";
import MyCoursesSection from "@/src/components/student/home/MyCoursesSection";
import MySubjectSection from "@/src/components/student/home/MySubjectSection";
import NewestExams from "@/src/components/student/home/NewestExams";
import QuickActivationCard from "@/src/components/student/home/QuickActiviation";
import WelcomeSection from "@/src/components/student/home/WelcomeSection";
import { getCourseById } from "@/src/services/student/course.service";
import { getCategories } from "@/src/services/student/department.service";
import { getLatestStudentExams } from "@/src/services/student/exam.service";
import { getLibrary } from "@/src/services/student/library.service";
import { getLatestGeneralPosts } from "@/src/services/student/post.service";
import { getStudentLiveRooms } from "@/src/services/student/live-room.service";
import {
  getStudentCourses,
  getStudentData,
  getStudentNotes,
  getStudentNotifications,
  getStudentProgression,
} from "@/src/services/student/user.service";
export default async function StudentPage() {
  const studentResult = await getStudentData();
  const student = studentResult.success ? studentResult.data?.data?.attributes ?? null : null;

  const progressResult = await getStudentProgression();
  const progress = progressResult.success ? progressResult.data?.data ?? [] : [];

  const coursesResult = await getStudentCourses();
  const courses = coursesResult.success ? coursesResult.data?.data ?? [] : [];

  const liveRoomsResult = await getStudentLiveRooms();
  const liveSessions = liveRoomsResult.success ? liveRoomsResult.data ?? [] : [];

  const notesResult = await getStudentNotes();
  const notes = notesResult.success ? notesResult.data?.data ?? [] : [];

  const libraryResult = await getLibrary();
  const library = libraryResult.success ? libraryResult.data?.data ?? [] : [];
  const categoryResult = await getCategories();
  const category = categoryResult.success ? categoryResult.data?.data ?? [] : [];
  const postsResult = await getLatestGeneralPosts(3);
  const latestPosts = postsResult.success ? postsResult.data?.data ?? [] : [];

  const examsResult = await getLatestStudentExams(4);
  const latestExams = examsResult.success ? examsResult.data ?? [] : [];

  const coursesCount = courses?.length;
  const progressCount = progress?.length;
  const liveSessionsCount = liveSessions?.length;

  const enrolledCourseIds = new Set(
    (courses || []).map((c: { id: string | number }) => String(c.id))
  );
  const enrolledNotes = (notes || []).filter(
    (note: { attributes?: { course_id?: string | number | null } }) =>
      note.attributes?.course_id &&
      enrolledCourseIds.has(String(note.attributes.course_id))
  );

  return (
    <div className="flex max-w-full flex-col gap-4 sm:gap-6">
      <WelcomeSection
        coursesCount={coursesCount}
        progressCount={progressCount}
        student={student}
        liveSessionsCount={liveSessionsCount}
      />

      <ContinueWatchingSection progress={progress ?? []} />

      <MySubjectSection categories={category} />

      <MyCoursesSection />
      <LatestPostsSection posts={latestPosts} />
      <NewestExams exams={latestExams} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
        <div className="min-w-0">
          <UpcomingLiveClasses sessions={liveSessions} />
        </div>
        <div className="flex min-w-0 w-full flex-col gap-4">
          <GetStudentNotes notes={enrolledNotes} />
          <LibrarySection library={library} />
        </div>
      </div>
    </div>
  );
}

import ContinueWatchingSection from "@/src/components/student/home/ContinueWatchingSection";
import GetStudentNotes from "@/src/components/student/home/GetStudentNotes";
import LibrarySection from "@/src/components/student/home/LibrarySection";
import UpcomingLiveClasses from "@/src/components/student/home/LiveSessions";
import MyCoursesSection from "@/src/components/student/home/MyCoursesSection";
import MySubjectSection from "@/src/components/student/home/MySubjectSection";
import QuickActivationCard from "@/src/components/student/home/QuickActiviation";
import WelcomeSection from "@/src/components/student/home/WelcomeSection";
import { getCourseById } from "@/src/services/student/course.service";
import { getCategories } from "@/src/services/student/department.service";
import { getLibrary } from "@/src/services/student/library.service";
import { getStudentLiveRooms } from "@/src/services/student/live-room.service";
import {
  getStudentCourses,
  getStudentData,
  getStudentNotes,
  getStudentNotifications,
  getStudentProgression,
} from "@/src/services/student/user.service";

export default async function StudentPage() {
  const {
    data: {
      data: { attributes: student },
    },
  } = await getStudentData();
  const {
    data: { data: progress },
  } = await getStudentProgression();
  const {
    data: { data: courses },
  } = await getStudentCourses();
  const liveRoomsResult = await getStudentLiveRooms();
  const liveSessions = liveRoomsResult.success ? liveRoomsResult.data ?? [] : [];
  const {
    data: { data: notes },
  } = await getStudentNotes();

  const {
    data: { data: library },
  } = await getLibrary();
  const {
    data: { data: category },
  } = await getCategories();

  const coursesCount = courses?.length;
  const progressCount = progress?.length;
  const liveSessionsCount = liveSessions?.length;
const studentData = student?.data?.data?.attributes ?? null;

  return (
    <div className="flex max-w-full flex-col gap-4 sm:gap-6">
      <WelcomeSection
        coursesCount={coursesCount}
        progressCount={progressCount}
        student={studentData}
        liveSessionsCount={liveSessionsCount}
      />

      <ContinueWatchingSection progress={progress ?? []} />
      <MySubjectSection categories={category} />
      <MyCoursesSection />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
        <div className="min-w-0">
          <UpcomingLiveClasses sessions={liveSessions} />
        </div>
        <div className="flex min-w-0 w-full flex-col gap-4">
          <GetStudentNotes notes={notes} />
          <LibrarySection library={library} />
        </div>
      </div>
    </div>
  );
}

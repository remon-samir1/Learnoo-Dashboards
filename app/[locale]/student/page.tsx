import ContinueWatchingSection from "@/src/components/student/home/ContinueWatchingSection";
import WelcomeSection from "@/src/components/student/home/WelcomeSection";
import {
  getStudentCourses,
  getStudentData,
  getStudentLiveSessions,
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
  const {
    data: { data: liveSessions },
  } = await getStudentLiveSessions();

  const coursesCount = courses?.length;
  const progressCount = progress?.length;
  const liveSessionsCount = liveSessions?.length;

  return (
    <div className="flex flex-col gap-6">
      <WelcomeSection
        coursesCount={coursesCount}
        progressCount={progressCount}
        student={student}
        liveSessionsCount={liveSessionsCount}
      />
      <ContinueWatchingSection liveSessions={liveSessions} />
    </div>
  );
}

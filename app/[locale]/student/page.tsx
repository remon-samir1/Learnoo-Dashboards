import ContinueWatchingSection from "@/src/components/student/home/ContinueWatchingSection";
import GetStudentNotes from "@/src/components/student/home/GetStudentNotes";
import LatestPostsSection from "@/src/components/student/home/LatestPostsSection";
import LibrarySection from "@/src/components/student/home/LibrarySection";
import UpcomingLiveClasses from "@/src/components/student/home/LiveSessions";
import MyCoursesSection from "@/src/components/student/home/MyCoursesSection";
import MySubjectSection from "@/src/components/student/home/MySubjectSection";
import NewestExams from "@/src/components/student/home/NewestExams";
import WelcomeSection from "@/src/components/student/home/WelcomeSection";
import { getCategories } from "@/src/services/student/department.service";
import { getLatestStudentExams } from "@/src/services/student/exam.service";
import { getLibrary } from "@/src/services/student/library.service";
import { getCommunityPosts } from "@/src/services/student/post.service";
import { getStudentLiveRooms } from "@/src/services/student/live-room.service";
import { getLiveRoomCourseIds } from "@/src/lib/student-live-room";
import { isCommunityPostInStudentCourses } from "@/src/lib/student-community-posts";
import {
  isWithinStudentCourses,
  readRowCourseIds,
  studentCourseTitleMap,
} from "@/src/lib/student-course-scope";
import {
  getStudentCourses,
  getStudentData,
  getStudentNotes,
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
  const rawLiveSessions = liveRoomsResult.success ? liveRoomsResult.data ?? [] : [];

  const notesResult = await getStudentNotes();
  const notes = notesResult.success ? notesResult.data?.data ?? [] : [];

  const libraryResult = await getLibrary();
  const rawLibrary = libraryResult.success
    ? (Array.isArray(libraryResult.data)
        ? libraryResult.data
        : (libraryResult.data as any)?.data ?? [])
    : [];

  const categoryResult = await getCategories();
  const category = categoryResult.success ? categoryResult.data?.data ?? [] : [];

  const postsResult = await getCommunityPosts();
  const communityPosts = postsResult.success ? postsResult.data?.data ?? [] : [];

  const examsResult = await getLatestStudentExams(4);
  const latestExams = examsResult.success ? examsResult.data ?? [] : [];

  // `getStudentCourses` already drops courses that are not active (draft), so
  // this set is the same "enrolled + published course" scope the community
  // page derives on the client.
  const enrolledCourseIds = new Set<string>(
    (courses || []).map((c: { id: string | number }) => String(c.id))
  );
  const courseTitleById = studentCourseTitleMap(courses);

  // 1. Filter continue watching progress by enrolled courses
  const filteredProgress = (progress || []).filter((p: any) => {
    const cid = p?.attributes?.chapter?.data?.attributes?.course_id;
    return cid != null && enrolledCourseIds.has(String(cid));
  });

  // 2. Filter category tree courses by enrolled courses
  const filteredCategories = (category || []).map((cat: any) => {
    const rawCourses = cat.attributes?.courses || cat.courses || [];
    const filteredCourses = (Array.isArray(rawCourses) ? rawCourses : []).filter(
      (c: any) => enrolledCourseIds.has(String(c.id))
    );
    return {
      ...cat,
      attributes: {
        ...cat.attributes,
        courses: filteredCourses,
        stats: {
          ...cat.attributes?.stats,
          courses: filteredCourses.length,
        },
      },
    };
  });

  // 3. Filter live sessions strictly by enrolled courses
  const filteredLiveSessions = (rawLiveSessions || []).filter((room) => {
    const cids = getLiveRoomCourseIds(room);
    if (cids.length === 0) return false;
    return cids.some((cid) => enrolledCourseIds.has(String(cid)));
  });

  // 4. Filter notes by enrolled courses
  const enrolledNotes = (notes || []).filter(
    (note: { attributes?: { course_id?: string | number | null } }) =>
      note.attributes?.course_id &&
      enrolledCourseIds.has(String(note.attributes.course_id))
  );

  // 5. Filter library materials by enrolled courses. Materials are attached to
  // several courses at once, so the ids live in `course_ids` / `courses` and
  // only older rows carry a single `course_id`.
  const filteredLibrary = rawLibrary.filter((item: unknown) =>
    isWithinStudentCourses(readRowCourseIds(item), enrolledCourseIds)
  );

  // 6. Filter exams by enrolled courses
  const filteredLatestExams = latestExams.filter((exam) => {
    const examCids = [
      ...(exam.courses_ids || []),
      ...(exam.course_id ? [exam.course_id] : []),
    ];
    if (examCids.length === 0) return false;
    return examCids.some((cid) => enrolledCourseIds.has(String(cid)));
  });

  // 7. Only show community posts published under one of the student's own
  // courses. Replies and drafts were already dropped by the service.
  const latestPosts = communityPosts
    .filter((post) => isCommunityPostInStudentCourses(post, enrolledCourseIds))
    .slice(0, 3);

  const coursesCount = courses?.length ?? 0;
  const liveSessionsCount = filteredLiveSessions.length;

  return (
    <div className="flex max-w-full flex-col gap-4 sm:gap-6">
      <WelcomeSection
        coursesCount={coursesCount}
        notesCount={enrolledNotes.length}
        student={student}
        liveSessionsCount={liveSessionsCount}
      />

      <ContinueWatchingSection progress={filteredProgress} />

      <MySubjectSection categories={category} />

      <MyCoursesSection />
      <LatestPostsSection posts={latestPosts} courseTitleById={courseTitleById} />
      <NewestExams exams={filteredLatestExams} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
        <div className="min-w-0">
          <UpcomingLiveClasses sessions={filteredLiveSessions} />
        </div>
        <div className="flex min-w-0 w-full flex-col gap-4">
          <GetStudentNotes notes={enrolledNotes} />
          <LibrarySection library={filteredLibrary} />
        </div>
      </div>
    </div>
  );
}


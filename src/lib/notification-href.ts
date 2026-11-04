import { buildStudentStartExamHref } from './student-start-exam-href';

export function notificationHref(data: Record<string, unknown>, pathname: string, locale: string): string | null {
  if (pathname.startsWith('/doctor/')) return null;
  const student = pathname.includes('/student/');
  const prefix = pathname.includes('/doctor/') ? '/doctor' : '';
  const base = student ? `/${locale}/student` : prefix;
  const id = String(data.content_id ?? '');
  const post = String(data.post_id ?? '');
  const chapter = String(data.chapter_id ?? '');
  const discussion = String(data.discussion_id ?? '');
  const course = String(data.course_id ?? '');
  if (data.type === 'student-account' && typeof data.student_id === 'string' && /^[\w-]+$/.test(data.student_id)) return student ? `${base}/profile` : `${prefix}/students/${data.student_id}`;
  if (data.type === 'instructor-account' && typeof data.student_id === 'string' && /^[\w-]+$/.test(data.student_id) && !student && !prefix) return `/instructors/${data.student_id}/edit`;
  if (data.action === 'unavailable') return `${base}/courses`;
  if (data.action === 'deleted') return data.type !== 'course' && /^\d+$/.test(course)
    ? `${base}/courses/${student ? 'course-details/' : ''}${course}` : `${base}/courses`;
  if (data.type === 'device-transfer' && typeof data.student_id === 'string' && /^[\w-]+$/.test(data.student_id)) return `/activity#device-${data.student_id}`;
  if (data.type === 'support-issue' && typeof data.url === 'string' && /^\/(?:issues\/inbox|support\/issues)\?issue=\d+$/.test(data.url)) return data.url;
  if (data.type === 'community' && /^\d+$/.test(post)) return `${base}/community?post=${post}#post-${post}`;
  if (data.type === 'discussion' && /^\d+$/.test(chapter) && /^\d+$/.test(discussion)) return student
    ? `${base}/courses/watch/${chapter}?discussion=${discussion}#discussion-${discussion}`
    : `${base}/discussions?discussion=${discussion}`;
  if (data.type === 'feedback' && typeof data.student_id === 'string' && /^[\w-]+$/.test(data.student_id)) return pathname.includes('/parent/')
    ? `/parent/students/${data.student_id}/feedback` : `${prefix}/guardians`;
  if (!/^\d+$/.test(id)) return null;
  switch (data.type) {
    case 'course': return `${base}/courses/${student ? 'course-details/' : ''}${id}${!student && data.action === 'reviewed' ? '#course-review' : ''}`;
    case 'lecture': return /^\d+$/.test(course) ? `${base}/courses/${student ? 'course-details/' : ''}${course}` : null;
    case 'lesson': return student ? `${base}/courses/watch/${id}` : `${prefix}/departments`;
    case 'exam': return student ? buildStudentStartExamHref(locale, id, String(data.course_id ?? '')) : `${prefix}/exams/${id}/edit`;
    case 'live': return `${base}/live-sessions/${id}${student ? '' : '/edit'}`;
    case 'note': return `${base}/${student ? 'notes' : 'notes-summaries'}/${id}`;
    case 'library': return `${base}/${student ? 'library' : 'electronic-library'}/${id}`;
    case 'timetable': return `${base}/schedules`;
    default: return null;
  }
}

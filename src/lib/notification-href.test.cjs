const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const ts = require('typescript');
const loaded = { exports: {} };
new Function('require', 'module', 'exports', ts.transpileModule(readFileSync(`${__dirname}/notification-href.ts`, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText)(() => require('./student-start-exam-href.ts'), loaded, loaded.exports);
const { notificationHref } = loaded.exports;

test('activity notifications open reviews, parent courses and affected accounts without linking deleted content', () => {
  assert.equal(notificationHref({ type: 'course', content_id: 6, action: 'reviewed' }, '/notifications', 'ar'), '/courses/6#course-review');
  assert.equal(notificationHref({ type: 'course', content_id: 6, action: 'reviewed' }, '/doctor/notifications', 'ar'), '/doctor/courses/6#course-review');
  assert.equal(notificationHref({ type: 'lecture', content_id: 9, course_id: 6 }, '/ar/student/notifications', 'ar'), '/ar/student/courses/course-details/6');
  assert.equal(notificationHref({ type: 'lesson', content_id: 9, course_id: 6, action: 'deleted' }, '/doctor/notifications', 'ar'), '/doctor/courses/6');
  assert.equal(notificationHref({ type: 'course', content_id: 6, action: 'deleted' }, '/ar/student/notifications', 'ar'), '/ar/student/courses');
  assert.equal(notificationHref({ type: 'course', content_id: 6, action: 'unavailable' }, '/ar/student/notifications', 'ar'), '/ar/student/courses');
  assert.equal(notificationHref({ type: 'student-account', student_id: 'student-uuid' }, '/notifications', 'ar'), '/students/student-uuid');
  assert.equal(notificationHref({ type: 'student-account', student_id: 'student-uuid' }, '/doctor/notifications', 'ar'), '/doctor/students/student-uuid');
  assert.equal(notificationHref({ type: 'instructor-account', student_id: 'teacher-uuid' }, '/notifications', 'ar'), '/instructors/teacher-uuid');
  assert.equal(notificationHref({ type: 'lecture', content_id: 9, course_id: 'javascript:alert(1)' }, '/notifications', 'ar'), null);
  assert.equal(notificationHref({ type: 'lesson', course_id: 'javascript:alert(1)', action: 'deleted' }, '/notifications', 'ar'), '/courses');
});

test('notifications open the correct content for students, teachers and parents without trusting external URLs', () => {
  assert.equal(notificationHref({ type: 'community', post_id: 42 }, '/ar/student/notifications', 'ar'), '/ar/student/community?post=42#post-42');
  assert.equal(notificationHref({ type: 'discussion', chapter_id: 12, discussion_id: 99 }, '/ar/student/notifications', 'ar'), '/ar/student/courses/watch/12?discussion=99#discussion-99');
  assert.equal(notificationHref({ type: 'discussion', chapter_id: 12, discussion_id: 99 }, '/doctor/notifications', 'ar'), '/doctor/discussions?discussion=99');
  assert.equal(notificationHref({ type: 'exam', content_id: 6 }, '/ar/student/notifications', 'ar'), '/ar/student/exams/start-exam/6');
  assert.equal(notificationHref({ type: 'exam', content_id: 6, course_id: 12 }, '/en/student/notifications', 'en'), '/en/student/exams/start-exam/6?course=12');
  assert.equal(notificationHref({ type: 'device-transfer', student_id: 'student-uuid' }, '/notifications', 'ar'), '/activity#device-student-uuid');
  assert.equal(notificationHref({ type: 'course', content_id: 6 }, '/ar/student/notifications', 'ar'), '/ar/student/courses/course-details/6');
  assert.equal(notificationHref({ type: 'feedback', student_id: 'student-uuid' }, '/parent/notifications', 'ar'), '/parent/students/student-uuid/feedback');
  assert.equal(notificationHref({ type: 'general', url: 'https://external.example' }, '/notifications', 'ar'), null);
  assert.equal(notificationHref({ type: 'support-issue', url: '/issues/inbox?issue=12' }, '/notifications', 'ar'), '/issues/inbox?issue=12');
  assert.equal(notificationHref({ type: 'community', post_id: 'javascript:alert(1)' }, '/notifications', 'ar'), null);
});

test('a discussion destination retains nested replies and deduplicates replies also present in a flat list', () => {
  const tree = { exports: {} };
  new Function('module', 'exports', ts.transpileModule(readFileSync(`${__dirname}/../../components/student/watch/watchChapterDiscussionUtils.ts`, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText)(tree, tree.exports);
  const reply = { id: 2, attributes: { parent_id: 1, content: 'Reply' } };
  const root = { id: 1, attributes: { parent_id: null, replies: [reply] } };
  const result = tree.exports.buildDiscussionTree([root, reply]);
  assert.equal(result.length, 1);
  assert.equal(result[0].replies.length, 1);
  assert.equal(result[0].replies[0].id, 2);
});

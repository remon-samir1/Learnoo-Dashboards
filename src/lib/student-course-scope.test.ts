import assert from 'node:assert/strict';
import test from 'node:test';

import {
  isWithinStudentCourses,
  readRecordCourseIds,
  readRowCourseIds,
  studentCourseIdSet,
  studentCourseTitleMap,
} from './student-course-scope.ts';

test('reads the owning course ids whichever shape the API used', () => {
  assert.deepEqual(readRecordCourseIds({ course_id: 12 }), ['12']);
  assert.deepEqual(readRecordCourseIds({ courses_ids: [3, '4'] }), ['3', '4']);
  assert.deepEqual(readRecordCourseIds({ course_ids: '7,8' }), ['7', '8']);
  assert.deepEqual(
    readRecordCourseIds({ courses: { data: [{ id: '9' }, { id: 10 }] } }),
    ['9', '10'],
  );
  // 0 / "" / null are "no course", not course zero.
  assert.deepEqual(readRecordCourseIds({ course_id: 0, courses: [] }), []);
});

test('falls back to the chapter relation for chapter-scoped rows', () => {
  assert.deepEqual(
    readRecordCourseIds({ chapter: { data: { attributes: { course_id: 55 } } } }),
    ['55'],
  );
  // A direct course id always wins over the chapter fallback.
  assert.deepEqual(
    readRecordCourseIds({ course_id: 5, chapter: { data: { attributes: { course_id: 55 } } } }),
    ['5'],
  );
});

test('reads ids from a JSON:API row whether they sit on the root or in attributes', () => {
  assert.deepEqual(readRowCourseIds({ id: '1', attributes: { course_ids: [2] } }), ['2']);
  assert.deepEqual(readRowCourseIds({ id: '1', course_id: 3 }), ['3']);
  assert.deepEqual(readRowCourseIds(null), []);
});

test('a row naming no course is out of the student scope', () => {
  const enrolled = new Set(['1', '2']);
  assert.equal(isWithinStudentCourses(['2'], enrolled), true);
  assert.equal(isWithinStudentCourses(['9'], enrolled), false);
  // Platform-wide rows must not leak into a student list.
  assert.equal(isWithinStudentCourses([], enrolled), false);
});

test('builds the enrolled id set and the id -> title map from a course list', () => {
  const courses = [
    { id: 1, attributes: { title: 'Anatomy' } },
    { id: '2', name: 'Physiology' },
    { id: 0, attributes: { title: 'Ignored' } },
  ];

  assert.deepEqual([...studentCourseIdSet(courses)], ['1', '2']);
  assert.deepEqual(studentCourseTitleMap(courses), { '1': 'Anatomy', '2': 'Physiology' });
  assert.deepEqual(studentCourseTitleMap(null), {});
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { isCompletedAttemptForEnrolledCourses } from './student-quiz-attempt-display.ts';

test('completed exam history follows current enrolled courses while stored results stay intact', () => {
  const attempt = { id: '1', attributes: { finished_at: '2026-10-01T10:00:00Z', quiz: { data: { attributes: { course_id: 271, courses_ids: [271] } } } } };
  assert.equal(isCompletedAttemptForEnrolledCourses(attempt as any, new Set(['271'])), true);
  assert.equal(isCompletedAttemptForEnrolledCourses(attempt as any, new Set(['272'])), false);
  assert.equal(isCompletedAttemptForEnrolledCourses({ ...attempt, attributes: { ...attempt.attributes, finished_at: null } } as any, new Set(['271'])), false);
});

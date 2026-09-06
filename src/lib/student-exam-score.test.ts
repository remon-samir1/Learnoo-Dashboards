import assert from 'node:assert/strict';
import test from 'node:test';
import { isExamPassed } from './student-exam-score.ts';

test('derives a pass only when the API omits the result', () => {
  assert.equal(isExamPassed(undefined, 100, 50), true);
  assert.equal(isExamPassed(undefined, 40, 50), false);
  assert.equal(isExamPassed(false, 100, 50), false);
});

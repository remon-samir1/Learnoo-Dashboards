import assert from 'node:assert/strict';
import test from 'node:test';
import { classifyHubQuizRow } from './student-exam-hub-quiz.ts';

test('draft exams stay hidden regardless of activation or schedule', () => {
  const now = Date.parse('2026-10-04T12:00:00Z');
  for (const is_public of ['true', 'false', 'included']) {
    assert.equal(classifyHubQuizRow({ id: '1', attributes: {
      status: 'draft', is_public, has_activation: true,
      start_time: '2026-10-05T12:00:00Z',
    } }, now, new Set(['1'])), 'hidden');
  }
});

test('active exams respect activation, schedule and remaining attempts', () => {
  const now = Date.parse('2026-10-04T12:00:00Z');
  const row = { id: '1', attributes: { status: 'active', is_public: 'true' } };
  assert.equal(classifyHubQuizRow(row, now), 'available');
  assert.equal(classifyHubQuizRow({ ...row, attributes: { ...row.attributes, start_time: '2026-10-05T12:00:00Z' } }, now), 'upcoming');
  assert.equal(classifyHubQuizRow({ ...row, attributes: { ...row.attributes, end_time: '2026-10-03T12:00:00Z' } }, now), 'expired');
  assert.equal(classifyHubQuizRow({ ...row, attributes: { ...row.attributes, remaining_attempts: 0 } }, now), 'locked');
  assert.equal(classifyHubQuizRow({ ...row, attributes: { status: 'active', is_public: 'false' } }, now), 'locked');
});

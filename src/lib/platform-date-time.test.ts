import assert from 'node:assert/strict';
import test from 'node:test';
import { toApiDateTime } from './platform-date-time.ts';

test('schedule submissions preserve Cairo summer and winter times', () => {
  assert.equal(toApiDateTime('2026-07-01T17:00:00Z'), '2026-07-01 20:00:00');
  assert.equal(toApiDateTime('2026-12-01T17:00:00Z'), '2026-12-01 19:00:00');
  assert.equal(toApiDateTime(''), '');
});

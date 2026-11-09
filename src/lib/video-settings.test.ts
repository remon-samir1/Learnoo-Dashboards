import assert from 'node:assert/strict';
import test from 'node:test';

import {
  MAX_SLEEP_PER_MINUTE,
  MIN_SLEEP_PER_MINUTE,
  parseSleepPerMinute,
  validateSleepPerMinute,
} from './video-settings.ts';

test('reads the flat payload the live API documents', () => {
  assert.equal(parseSleepPerMinute({ sleep_per_minute: 5 }), 5);
  // Laravel often serializes integers as strings.
  assert.equal(parseSleepPerMinute({ sleep_per_minute: '7' }), 7);
});

test('also reads the value out of a data envelope', () => {
  assert.equal(parseSleepPerMinute({ data: { sleep_per_minute: 9 } }), 9);
  assert.equal(parseSleepPerMinute({ data: { attributes: { sleep_per_minute: 12 } } }), 12);
});

test('returns null when no usable value is present', () => {
  assert.equal(parseSleepPerMinute(undefined), null);
  assert.equal(parseSleepPerMinute(null), null);
  assert.equal(parseSleepPerMinute({}), null);
  assert.equal(parseSleepPerMinute({ sleep_per_minute: null }), null);
  assert.equal(parseSleepPerMinute({ sleep_per_minute: 'abc' }), null);
  assert.equal(parseSleepPerMinute('5'), null);
});

test('accepts a whole number of minutes inside the allowed range', () => {
  assert.deepEqual(validateSleepPerMinute('5'), { ok: true, value: 5 });
  assert.deepEqual(validateSleepPerMinute(MIN_SLEEP_PER_MINUTE), { ok: true, value: 1 });
  assert.deepEqual(validateSleepPerMinute(MAX_SLEEP_PER_MINUTE), { ok: true, value: 180 });
});

test('rejects empty, fractional and out-of-range values before sending', () => {
  assert.deepEqual(validateSleepPerMinute(''), { ok: false, error: 'required' });
  assert.deepEqual(validateSleepPerMinute('   '), { ok: false, error: 'required' });
  assert.deepEqual(validateSleepPerMinute('2.5'), { ok: false, error: 'integer' });
  assert.deepEqual(validateSleepPerMinute('abc'), { ok: false, error: 'integer' });
  assert.deepEqual(validateSleepPerMinute('0'), { ok: false, error: 'range' });
  assert.deepEqual(validateSleepPerMinute('-3'), { ok: false, error: 'range' });
  assert.deepEqual(validateSleepPerMinute(MAX_SLEEP_PER_MINUTE + 1), { ok: false, error: 'range' });
});

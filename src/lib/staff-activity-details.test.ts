import assert from 'node:assert/strict';
import test from 'node:test';

import {
  auditFieldChanged,
  auditFieldKeys,
  auditFieldLabel,
  auditFieldValue,
} from './staff-activity-details.ts';

/** The chapter snapshot shape the activity endpoint sends. */
const before = {
  id: 892,
  title: 'test',
  video: null,
  status: 1,
  course_id: null,
  max_views: 5,
  lecture_id: 250,
  view_by_minute: 30,
};

test('lists every key a snapshot carries, known fields first', () => {
  assert.deepEqual(auditFieldKeys(before, null), [
    'id',
    'title',
    'video',
    'lecture_id',
    'course_id',
    'status',
    'max_views',
    'view_by_minute',
  ]);
});

test('an update that changed nothing still lists its fields', () => {
  // The regression: the table only ever held the fields that differed, so this
  // payload rendered an empty body and the entry showed just its title.
  assert.equal(auditFieldKeys(before, { ...before }).length, 8);
});

test('takes the union of both snapshots, and keeps keys we have no label for', () => {
  const keys = auditFieldKeys({ title: 'a' }, { title: 'b', is_free: true, slug: 'x' });
  assert.deepEqual(keys, ['title', 'is_free', 'slug']);
});

test('a key with no label of its own still reads as words', () => {
  assert.equal(auditFieldLabel('title', 'ar'), 'العنوان');
  assert.equal(auditFieldLabel('title', 'en'), 'Title');
  assert.equal(auditFieldLabel('view_by_minute', 'en'), 'View threshold (seconds)');
  assert.equal(auditFieldLabel('some_new_field', 'en'), 'Some new field');
});

test('a video path shows its file name, not the whole upload path', () => {
  assert.equal(
    auditFieldValue('video', 'uploads/chapters/videos/CZrqZIA5.stream.3ef4bef8.mp4', 'en'),
    'CZrqZIA5.stream.3ef4bef8.mp4',
  );
  assert.equal(auditFieldValue('video', 'a/b/c.mp4?token=x', 'en'), 'c.mp4');
});

test('publish status reads as a word', () => {
  assert.equal(auditFieldValue('status', 1, 'ar'), 'منشور');
  assert.equal(auditFieldValue('status', 0, 'en'), 'Draft');
  // An unknown status is shown rather than swallowed.
  assert.equal(auditFieldValue('status', 7, 'en'), '7');
});

test('an empty value is a dash, and a number of zero is not', () => {
  for (const empty of [null, undefined, '']) {
    assert.equal(auditFieldValue('title', empty, 'en'), '—');
  }
  assert.equal(auditFieldValue('max_views', 0, 'en'), '0');
});

test('booleans and objects are readable', () => {
  assert.equal(auditFieldValue('is_free', true, 'ar'), 'نعم');
  assert.equal(auditFieldValue('is_free', false, 'en'), 'No');
  assert.equal(auditFieldValue('meta', { a: 1 }, 'en'), '{"a":1}');
});

test('marks only the fields that actually differ', () => {
  const after = { ...before, max_views: 9 };
  assert.equal(auditFieldChanged('max_views', before, after), true);
  assert.equal(auditFieldChanged('title', before, after), false);
  // A delete has no `after`, so nothing is a change.
  assert.equal(auditFieldChanged('title', before, null), false);
});

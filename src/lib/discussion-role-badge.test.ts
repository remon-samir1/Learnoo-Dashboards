import assert from 'node:assert/strict';
import test from 'node:test';

import { discussionRoleBadgeKey } from './discussion-role-badge.ts';

test('maps the title-case role names the API sends', () => {
  assert.equal(discussionRoleBadgeKey('Student'), 'student');
  assert.equal(discussionRoleBadgeKey('Instructor'), 'instructor');
  assert.equal(discussionRoleBadgeKey('Admin'), 'admin');
  assert.equal(discussionRoleBadgeKey('Super Admin'), 'superAdmin');
  assert.equal(discussionRoleBadgeKey('Support'), 'support');
  assert.equal(discussionRoleBadgeKey('Parent'), 'parent');
});

test('ignores casing and surrounding space', () => {
  assert.equal(discussionRoleBadgeKey('  instructor '), 'instructor');
  assert.equal(discussionRoleBadgeKey('SUPER ADMIN'), 'superAdmin');
});

test('a role with no badge of its own falls back to the student key', () => {
  // The bug this guards: an unmapped role used to reach `t()` verbatim and
  // render the key path (`DISCUSSIONS.BADGES.INSTRUCTOR`) in the UI.
  for (const role of ['Moderator', '', '   ', undefined, null, 42, {}]) {
    assert.equal(discussionRoleBadgeKey(role), 'student');
  }
});

test('the older doctor role keeps its own badge', () => {
  assert.equal(discussionRoleBadgeKey('Doctor'), 'doctor');
});

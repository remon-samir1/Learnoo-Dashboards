import assert from 'node:assert/strict';
import test from 'node:test';
import { isStudentAcademicProfileComplete } from './student-profile-completeness.ts';

test('academic profile checks accept the API relation shape and still require all three selections', () => {
  const profile = { university: { data: { id: '173' } }, faculty: { data: { id: '176' } }, centers: [{ id: '174' }] };
  assert.equal(isStudentAcademicProfileComplete(profile), true);
  assert.equal(isStudentAcademicProfileComplete({ ...profile, university: null }), false);
  assert.equal(isStudentAcademicProfileComplete({ ...profile, faculty: null }), false);
  assert.equal(isStudentAcademicProfileComplete({ ...profile, centers: [] }), false);
  assert.equal(isStudentAcademicProfileComplete(null), false);
});

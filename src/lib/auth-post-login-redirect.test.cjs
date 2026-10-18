const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const ts = require('typescript');
const compiled = ts.transpileModule(readFileSync(join(__dirname, 'auth-post-login-redirect.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
}).outputText;
const moduleUnderTest = { exports: {} };
new Function('require', 'module', 'exports', compiled)(
  id => id === '@/src/lib/student-profile-completeness' ? require('./student-profile-completeness.ts') : { isAppRole: role => role === 'Student', isStudentLikeRole: role => role === 'Student' },
  moduleUnderTest, moduleUnderTest.exports,
);

test('Student routing checks known incomplete profiles and defers missing cached details to the live profile', () => {
  const getHref = attributes => moduleUnderTest.exports.getPostAuthHref('en', 'Student', { attributes: { role: 'Student', ...attributes } });
  assert.equal(getHref({}), '/en/student');
  assert.equal(getHref({ university: null, faculty: null, centers: [] }), '/en/student/complete-profile');
  assert.equal(getHref({ university: { data: { id: '173' } }, faculty: { data: { id: '176' } }, centers: [{ id: '174' }] }), '/en/student');
});

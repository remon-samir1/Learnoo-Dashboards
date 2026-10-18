const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const ts = require('typescript');

const compiled = ts.transpileModule(readFileSync(join(__dirname, 'post.service.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
}).outputText;

test('Student home shows complete enrolled-course posts and excludes general posts drafts and replies', async () => {
  const post = (id, attributes) => ({ id, attributes: { title: 'Full post title', content: 'Full post body', parent_id: null, status: 'published', course_id: null, created_at: '2026-10-05T12:00:00Z', ...attributes } });
  const data = [post(1, {}), post(2, { course_id: 271 }), post(3, { course_id: 272 }), post(4, { course_id: 271, parent_id: 2, content: 'Admin reply only' }), post(5, { course_id: 271, status: 'draft' }), post(6, { courses: { data: [{ id: '271' }, { id: '272' }] }, created_at: '2026-10-05T13:00:00Z' }), post(7, { courses: [{ id: '271', attributes: { title: 'QA course' } }], created_at: '2026-10-05T14:00:00Z' })];
  const module = { exports: {} };
  new Function('require', 'module', 'exports', 'fetch', compiled)(
    (id) => id === '@/lib/server.utils' ? async () => ({ token: 'test-token' }) : { API_BASE_URL: 'https://api.example.test' },
    module, module.exports, async () => ({ ok: true, json: async () => ({ data }) }),
  );
  const result = await module.exports.getLatestStudentPosts(new Set(['271']), 3);
  assert.equal(result.success, true);
  assert.deepEqual(result.data.data.map(post => post.id), [7, 6, 2]);
  assert.equal(result.data.data[2].attributes.title, 'Full post title');
  assert.equal(result.data.data[2].attributes.content, 'Full post body');
  assert.equal(result.data.data[0].attributes.courses.data[0].attributes.title, 'QA course');
  const empty = await module.exports.getLatestStudentPosts(new Set(), 3);
  assert.deepEqual(empty.data.data, []);
});

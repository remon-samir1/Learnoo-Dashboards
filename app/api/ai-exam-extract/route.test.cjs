const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const ts = require('typescript');
const { NextRequest } = require('next/server');

function load(path) {
  const module = { exports: {} };
  new Function('require', 'module', 'exports', ts.transpileModule(readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText)((id) => id === '@/src/lib/exam-ai' ? load(`${__dirname}/../../../src/lib/exam-ai.ts`) : require(id), module, module.exports);
  return module.exports;
}
const { GET, POST } = load(`${__dirname}/route.ts`);
const id = '00000000-0000-0000-0000-000000000001';

test('AI proxy forwards the queued ID, authenticated polling and the complete result', async (t) => {
  const questions = Array.from({ length: 20 }, () => ({ text: 'سؤال', type: 'single_choice', score: 1,
    answers: [{ text: 'أ', is_correct: true }, { text: 'ب', is_correct: false }] }));
  const calls = [];
  const responses = [Response.json({ id, status: 'pending' }, { status: 202 }),
    Response.json({ status: 'processing' }, { status: 202 }),
    Response.json({ status: 'completed', questions, requested_count: 20 })];
  t.mock.method(globalThis, 'fetch', async (...args) => { calls.push(args); return responses.shift(); });
  const form = new FormData();
  form.set('file', new File(['%PDF-1.7'], 'lesson.pdf', { type: 'application/pdf' }));
  form.set('count', '20');
  form.set('language', 'ar');
  const response = await POST(new NextRequest('https://learnoo.app/api/ai-exam-extract', {
    method: 'POST', headers: { Authorization: 'Bearer test-token' }, body: form,
  }));
  assert.equal(response.status, 202);
  assert.equal((await response.json()).id, id);
  const request = () => new NextRequest(`https://learnoo.app/api/ai-exam-extract?id=${id}`, { headers: { Authorization: 'Bearer test-token' } });
  assert.equal((await GET(request())).status, 202);
  const completed = await GET(request());
  assert.equal(completed.status, 200);
  assert.equal((await completed.json())[0].output.length, 20);
  assert.equal(calls[0][1].body.get('questions_count'), '20');
  assert.equal(calls[0][1].body.get('language'), 'ar');
  assert.equal(calls[1][1].headers.Authorization, 'Bearer test-token');
  assert.ok(calls[1][0].endsWith(`/v1/ai-exam/${id}`));
  assert.equal(completed.headers.get('Cache-Control'), 'no-store');
});

test('AI polling rejects unauthenticated and malformed IDs without contacting the backend', async (t) => {
  t.mock.method(globalThis, 'fetch', () => { throw new Error('Must not contact backend'); });
  assert.equal((await GET(new NextRequest(`https://learnoo.app/api/ai-exam-extract?id=${id}`))).status, 401);
  assert.equal((await GET(new NextRequest('https://learnoo.app/api/ai-exam-extract?id=../../feature', {
    headers: { Authorization: 'Bearer test-token' },
  }))).status, 400);
});

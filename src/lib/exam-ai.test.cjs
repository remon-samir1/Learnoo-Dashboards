const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const ts = require('typescript');
const moduleUnderTest = { exports: {} };
new Function('module', 'exports', ts.transpileModule(readFileSync(`${__dirname}/exam-ai.ts`, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText)(moduleUnderTest, moduleUnderTest.exports);
const { parseGeneratedExamQuestions, requestExamExtraction } = moduleUnderTest.exports;
const question = () => ({ text: 'ما الإجابة الصحيحة؟', type: 'single_choice', score: 1, auto_correct: true,
  answers: [{ text: 'أ', is_correct: true }, { text: 'ب', is_correct: false }] });

test('all requested questions and correct answers must be valid; partial results are rejected', () => {
  const output = Array.from({ length: 20 }, question);
  assert.equal(parseGeneratedExamQuestions([{ output }], 20).length, 20);
  assert.throws(() => parseGeneratedExamQuestions([{ output }], 21), /INVALID_AI_RESPONSE/);
  for (const invalid of [
    { ...question(), text: '' }, { ...question(), type: 'unknown' },
    { ...question(), answers: [{ text: 'أ', is_correct: false }, { text: 'ب', is_correct: false }] },
    { ...question(), answers: [{ text: 'أ', is_correct: true }, { text: 'ب', is_correct: true }] },
    { ...question(), answers: [{ text: '', is_correct: true }, { text: 'ب', is_correct: false }] },
  ]) assert.throws(() => parseGeneratedExamQuestions([{ output: [question(), invalid] }], 2), /INVALID_AI_RESPONSE/);
});

test('queued extraction uploads once and polls until the real result arrives', async (t) => {
  const id = '00000000-0000-0000-0000-000000000001';
  const calls = [];
  const responses = [Response.json({ id, status: 'pending' }, { status: 202 }),
    Response.json({ status: 'processing' }, { status: 202 }), Response.json([{ output: [question()] }])];
  t.mock.method(globalThis, 'fetch', async (...args) => { calls.push(args); return responses.shift(); });
  t.mock.method(globalThis, 'setTimeout', resolve => { resolve(); return 0; });
  const form = new FormData();
  form.set('count', '20');
  const response = await requestExamExtraction(form);
  assert.equal(response.status, 200);
  assert.equal(parseGeneratedExamQuestions(await response.json(), 1).length, 1);
  assert.equal(calls.filter(([, options]) => options.method === 'POST').length, 1);
  assert.equal(calls[1][0], `/api/ai-exam-extract?id=${id}`);
  assert.equal(form.get('count'), '20');
});

test('queued extraction returns provider errors and stops polling at the deadline', async (t) => {
  const id = '00000000-0000-0000-0000-000000000001';
  let calls = 0;
  t.mock.method(globalThis, 'setTimeout', resolve => { resolve(); return 0; });
  t.mock.method(globalThis, 'fetch', async () => ++calls === 1
    ? Response.json({ id }, { status: 202 }) : Response.json({ message: 'rate limit' }, { status: 429 }));
  assert.equal((await requestExamExtraction(new FormData())).status, 429);
  calls = 0;
  t.mock.method(globalThis, 'fetch', async () => Response.json({ id }, { status: 202 }));
  let now = 0;
  t.mock.method(Date, 'now', () => now += 400_000);
  await assert.rejects(requestExamExtraction(new FormData()), /وقتًا طويلًا/);
});


test('Arabic output rejects corrupt Latin fragments and normalizes choice labels while keeping technical acronyms', () => {
  for (const fragment of ['Conspiracyات', 'تتistar', 'يُeasy', 'accounts', 'تأ renting']) {
    assert.throws(() => parseGeneratedExamQuestions([{ output: [{ ...question(), text: `كيف تُعالج الشركة ${fragment} في المحاسبة؟` }] }], 1), /INVALID_AI_RESPONSE/);
  }
  const output = parseGeneratedExamQuestions([{ output: [{ ...question(), text: 'ما المقصود بالمعيار IFRS؟',
    answers: [{ text: 'أ) معيار التقارير المالية', is_correct: true }, { text: 'ب) عقد الإيجار', is_correct: false }] }] }], 1);
  assert.equal(output[0].answers[0].text, 'معيار التقارير المالية');
  assert.equal(parseGeneratedExamQuestions([{ output: [{ ...question(), text: 'What is an asset?',
    answers: [{ text: 'A) A resource', is_correct: true }, { text: 'B) A debt', is_correct: false }] }] }], 1)[0].answers[0].text, 'A resource');
});

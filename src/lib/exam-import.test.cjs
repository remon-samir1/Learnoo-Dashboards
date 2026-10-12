const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const ts = require('typescript');
const loaded = { exports: {} };
new Function('require', 'module', 'exports', ts.transpileModule(readFileSync(`${__dirname}/exam-import.ts`, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText)(require, loaded, loaded.exports);
const { importedQuestion, importedTrueFalseQuestion, finishImportedExam, parseWordExam, readWordExam } = loaded.exports;

test('true/false answer marks preserve the statement and require review when missing or ambiguous', () => {
  for (const mark of ['✓', '✔', '✘', '✕', '×', '✗', '', '✓✗']) {
    const question = importedTrueFalseQuestion('١. تكلفة الأجور 200000 ج', mark, 'توضيح');
    assert.equal(question.type, 'true_false');
    assert.equal(question.text, 'تكلفة الأجور 200000 ج');
    assert.deepEqual(question.answers.map(a => a.text), ['صح', 'خطأ']);
    assert.equal(question.answers.filter(a => a.isCorrect).length, mark.length === 1 ? 1 : mark.length);
    assert.deepEqual(finishImportedExam([question]).review, mark.length === 1 ? [] : [1]);
    if (mark === '✓' || mark === '✔') assert.equal(question.answers[0].isCorrect, true);
    if (['✘', '✕', '×', '✗'].includes(mark)) assert.equal(question.answers[1].isCorrect, true);
    assert.ok(question.answers.every(a => a.reason === 'توضيح'));
  }
});

test('import preserves Arabic and mixed text, assigns new IDs, and flags missing answers without guessing', () => {
  const questions = [importedQuestion('١. ما الفرق بين E-HRM و HRM؟', 'short_answer'),
    importedQuestion('2) Question', 'single_choice', [{ text: '', isCorrect: false }, { text: 'Answer', isCorrect: false }]),
    importedQuestion('3. Solved', 'true_false', [{ text: 'صح', isCorrect: true }, { text: 'خطأ', isCorrect: false }])];
  const exam = finishImportedExam(questions, ['Shared case']);
  assert.equal(exam.questions[0].text, 'ما الفرق بين E-HRM و HRM؟');
  assert.equal(exam.questions[0].autoCorrect, false);
  assert.equal(importedQuestion('2026 هو العام المقصود', 'short_answer').text, '2026 هو العام المقصود');
  assert.deepEqual(exam.review, [2]);
  assert.deepEqual(exam.contexts, ['Shared case']);
  assert.ok(exam.questions.every(q => q.id.startsWith('new-')));
  assert.equal(new Set(exam.questions.flatMap(q => q.answers.map(a => a.id))).size, 4);
  assert.equal(exam.questions[1].answers.filter(a => a.isCorrect).length, 0);
});

test('ambiguous and empty imports cannot silently pass review', () => {
  const q = importedQuestion('Question', 'single_choice', [{ text: 'One', isCorrect: true }, { text: 'Two', isCorrect: true }]);
  assert.deepEqual(finishImportedExam([q]).review, [1]);
  assert.throws(() => finishImportedExam([]), /NO_IMPORTABLE/);
  assert.throws(() => finishImportedExam(Array(501).fill(q)), /NO_IMPORTABLE/);
});

test('untrusted XML declarations and oversized expanded archives are rejected before parsing', async () => {
  assert.throws(() => parseWordExam('<!DOCTYPE x [<!ENTITY x "secret">]>'), /INVALID_IMPORT_FILE/);
  const data = new ArrayBuffer(46), view = new DataView(data);
  view.setUint32(0, 0x02014b50, true); view.setUint32(24, 50_000_001, true);
  await assert.rejects(readWordExam(data), /INVALID_IMPORT_FILE/);
});

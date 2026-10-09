const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const ts = require('typescript');
const loaded = { exports: {} };
new Function('require', 'module', 'exports', ts.transpileModule(readFileSync(`${__dirname}/exam-form.ts`, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText)(() => ({ toApiDateTime: value => value }), loaded, loaded.exports);

test('correcting an answer advances focus to the next invalid question even with repeated local answer IDs', () => {
  const question = id => ({ id, text: 'Question', type: 'single_choice', score: 1, autoCorrect: true,
    answers: [{ id: '1', text: '', isCorrect: true, reason: '' }, { id: '2', text: 'Answer', isCorrect: false, reason: '' }] });
  const questions = [question('first'), question('second')];
  const { validateExamQuestions } = loaded.exports;
  assert.equal(validateExamQuestions(questions).firstInvalid.id, 'first');
  questions[0].answers[0].text = 'Corrected';
  const errors = validateExamQuestions(questions);
  assert.equal(errors.firstInvalid.id, 'second');
  assert.deepEqual([...errors.answerIds], ['second:1']);
  questions[1].answers[0].text = 'Corrected';
  assert.equal(validateExamQuestions(questions).firstInvalid, undefined);
});

test('cleared exam dates are submitted explicitly so edits remove the stored schedule', () => {
  const data = loaded.exports.buildExamFormData({ title: 'Exam', courses: ['1'], chapter: '', type: 'exam', duration: '10',
    totalMarks: '1', passingMarks: '50', maxAttempts: '1', status: 'Draft', startTime: '', endTime: '', is_public: 'false' }, [], 'edit');
  assert.equal(data.get('start_time'), '');
  assert.equal(data.get('end_time'), '');
});

test('validation identifies the actual blank answer and maps server errors to its field', () => {
  const question = { id: 'q1', text: 'Question', type: 'single_choice', score: 1,
    answers: [{ id: 'a1', text: 'Answer', isCorrect: true }, { id: 'a2', text: '', isCorrect: false }] };
  const { validateExamQuestions, getExamErrorField, focusExamField } = loaded.exports;
  assert.equal(validateExamQuestions([question]).firstInvalidField, 'answer-q1-a2');
  assert.equal(getExamErrorField({ 'questions.0.answers.1.text': ['Required'] }, [question]), 'answer-q1-a2');
  assert.equal(getExamErrorField({ total_marks: ['Invalid total'] }, [question]), 'exam-totalMarks');
  assert.equal(getExamErrorField({ 'course_ids.0': ['Required'] }, [question]), 'exam-courses');
  let focused = false; let scrolled = false;
  global.requestAnimationFrame = callback => callback();
  global.document = { getElementById: id => { assert.equal(id, 'answer-q1-a2'); return { matches: () => true, focus: () => { focused = true; }, scrollIntoView: () => { scrolled = true; } }; } };
  focusExamField(validateExamQuestions([question]).firstInvalidField);
  assert.ok(focused && scrolled);
  delete global.requestAnimationFrame; delete global.document;
});

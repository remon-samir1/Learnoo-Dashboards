const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const React = require('react');
const ts = require('typescript');
const root = resolve(__dirname, '../..');
function load(path, mocks = {}) {
  const module = { exports: {} };
  const code = ts.transpileModule(readFileSync(resolve(root, path), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  new Function('require', 'module', 'exports', code)(name => mocks[name] || require(name), module, module.exports);
  return module.exports;
}
function elements(node) { return !node || typeof node !== 'object' ? [] : [node, ...React.Children.toArray(node.props?.children).flatMap(elements)]; }
function button(tree, label) { return elements(tree).find(node => node.type === 'button' && elements(node).some(child => [].concat(child.props?.children).includes(label))); }
const phones = load('src/lib/preactivation-phones.ts');

test('phone import reads text CSV XLS and XLSX while retaining phone formatting and supports editable results', async () => {
  assert.deepEqual(await phones.readPreactivationPhones(new File(['01010000001\n01010000002'], 'phones.txt')), ['01010000001', '01010000002']);
  assert.deepEqual(await phones.readPreactivationPhones(new File(['01010000001,01010000002;01010000003'], 'phones.csv')), ['01010000001', '01010000002', '01010000003']);
  const XLSX = require('xlsx');
  const book = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([['01010000001'], ['01010000002']]), 'Phones');
  for (const bookType of ['xls', 'xlsx']) {
    const file = new File([XLSX.write(book, { type: 'buffer', bookType })], `phones.${bookType}`);
    assert.deepEqual(await phones.readPreactivationPhones(file), ['01010000001', '01010000002']);
  }
  await assert.rejects(phones.readPreactivationPhones({ name: 'phones.txt', text: async () => { throw new Error('Read failure'); } }));
});

function coursePage(role = 'Admin', permission = true, fail = false) {
  const states = [], uploads = [], messages = []; let cursor = 0;
  const hooks = {
    useCodes: () => ({ data: [], refetch() {} }), useActivateCode: () => ({ isLoading: false }),
    useUploadPreActivation: () => ({ isLoading: false, mutate: async data => { uploads.push(data); if (fail) throw new Error('Upload failed'); return { activated: 1, pending: 1, skipped: 0, total_phones: 2 }; } }),
  };
  const Page = load('app/(admin)/courses/[id]/page.tsx', {
    react: { ...React, useRef: () => ({ current: null }), useState: initial => { const i = cursor++; if (!(i in states)) states[i] = initial; return [states[i], value => { states[i] = typeof value === 'function' ? value(states[i]) : value; }]; } },
    'next-intl': { useTranslations: () => key => key }, 'next/navigation': { useParams: () => ({ id: '12' }) },
    'next/link': { default: () => null }, 'react-hot-toast': { success: value => messages.push(['success', value]), error: value => messages.push(['error', value]) },
    '@/src/lib/preactivation-phones': phones,
    '@/src/hooks/useCourses': { useCourse: () => ({ data: { id: '12', attributes: { title: 'Course', price: 0, status: 1, stats: {}, lectures: [] } }, refetch() {} }) },
    '@/src/hooks/useLectures': { useLectures: () => ({ data: [] }) }, '@/src/hooks/useStudents': { useStudents: () => ({ data: { data: [] } }) },
    '@/src/hooks/useAuth': { useCurrentUser: () => ({ role, canUseActivations: permission }) }, '@/src/hooks': hooks,
    '@/components/StatCard': { StatCard: () => null }, '@/components/ProgressBar': { ProgressBar: () => null }, '@/components/CourseApprovalPanel': { default: () => null },
  }).default;
  return { uploads, messages, render: () => { cursor = 0; return Page(); } };
}

for (const role of ['Admin', 'Super Admin']) test(`${role} can manually enter one number in course details and upload the edited list`, async () => {
  const s = coursePage(role); let tree = s.render();
  button(tree, 'courses.view.activationTabs.preactivation').props.onClick(); tree = s.render();
  assert.equal(button(tree, 'courses.view.preactivation.upload').props.disabled, true);
  button(tree, 'courses.detailPanel.addNumber').props.onClick(); tree = s.render();
  elements(tree).find(node => node.type === 'input' && node.props.type === 'tel').props.onChange({ target: { value: '01010000001' } }); tree = s.render();
  const upload = button(tree, 'courses.view.preactivation.upload'); assert.equal(upload.props.disabled, false);
  await upload.props.onClick(); tree = s.render();
  assert.equal(s.uploads[0].item_id, 12); assert.equal(s.uploads[0].item_type, 'course');
  assert.equal(await s.uploads[0].file.text(), '01010000001');
  assert.equal(elements(tree).filter(node => node.type === 'input' && node.props.type === 'tel').length, 0);
});

test('course details preserves numbers on upload failure and hides activation when permission is disabled', async () => {
  const s = coursePage('Admin', true, true); let tree = s.render();
  button(tree, 'courses.view.activationTabs.preactivation').props.onClick(); tree = s.render();
  const input = elements(tree).find(node => node.type === 'input' && node.props.type === 'file' && node.props.accept.includes('.csv'));
  await input.props.onChange({ target: { files: [new File(['01010000001'], 'phones.csv')] } }); tree = s.render();
  const phone = elements(tree).find(node => node.type === 'input' && node.props.type === 'tel');
  phone.props.onChange({ target: { value: '01010000002' } }); tree = s.render();
  await button(tree, 'courses.view.preactivation.upload').props.onClick(); tree = s.render();
  assert.equal(await s.uploads[0].file.text(), '01010000002');
  assert.equal(elements(tree).find(node => node.type === 'input' && node.props.type === 'tel').props.value, '01010000002');
  assert.equal(s.messages.at(-1)[0], 'error');
  assert.equal(button(coursePage('Admin', false).render(), 'courses.view.activationTabs.preactivation'), undefined);
});

function lesson(locale = 'en', fail = false, deferred = false) {
  const states = [], effects = [], pending = [], requests = []; const cache = new Map(); let cursor = 0;
  const Page = load('components/dashboard/LessonViewers.tsx', {
    react: { ...React, useState: initial => { const i = cursor++; if (!(i in states)) states[i] = initial; return [states[i], value => { states[i] = value; }]; },
    },
    '@tanstack/react-query': { useQuery: ({ queryKey, queryFn }) => {
      const key = JSON.stringify(queryKey);
      if (!cache.has(key)) {
        const entry = { isLoading: true }; cache.set(key, entry);
        effects.push(() => queryFn().then(data => Object.assign(entry, { data, isLoading: false })).catch(error => Object.assign(entry, { error, isLoading: false })));
      }
      return cache.get(key);
    } },
    'next-intl': { useLocale: () => locale }, '@/src/lib/api': { chapters: { viewers: (id, page) => {
      requests.push({ id, page }); const data = { data: [{ id: 1, user: { first_name: 'Student', last_name: 'One', student_code: 'STU-01' }, count: 2, remaining_views: 3 }], max_views: 5, last_page: 2 };
      if (deferred) return new Promise((resolve, reject) => pending.push({ resolve, reject, data }));
      return fail ? Promise.reject(new Error('Unavailable')) : Promise.resolve(data);
    } } },
  }).default;
  let chapterId = 12;
  const render = () => { cursor = 0; return Page({ chapterId }); };
  return { render, requests, pending, chapter: value => { chapterId = value; }, settle: async () => { render(); while (effects.length) effects.shift()(); await new Promise(resolve => setImmediate(resolve)); return render(); } };
}
for (const locale of ['ar', 'en']) test(`${locale} lesson viewers shows independent counters and read-only pagination`, async () => {
  const s = lesson(locale); let tree = await s.settle();
  const { renderToStaticMarkup } = require('react-dom/server');
  const html = renderToStaticMarkup(tree); assert.match(html, /STU-01/); assert.match(html, /: 2</); assert.match(html, /: 3</);
  assert.doesNotMatch(html, /checkbox|Remove|حذف|إلغاء/);
  button(tree, locale === 'ar' ? 'التالي' : 'Next').props.onClick(); tree = await s.settle();
  assert.deepEqual(s.requests.at(-1), { id: 12, page: 2 });
});
test('lesson viewers handles errors and stale results without showing unrelated lesson data', async () => {
  const failed = lesson('en', true); const failedTree = await failed.settle();
  assert.ok(elements(failedTree).some(node => node.props.role === 'alert'));
  const s = lesson('en', false, true); await s.settle(); s.chapter(13); await s.settle();
  s.pending[1].resolve({ data: [], max_views: 0, last_page: 1 }); let tree = await s.settle();
  s.pending[0].resolve(s.pending[0].data); tree = await s.settle();
  const { renderToStaticMarkup } = require('react-dom/server');
  assert.match(renderToStaticMarkup(tree), /Unlimited/); assert.doesNotMatch(renderToStaticMarkup(tree), /STU-01/);
});


for (const type of ['course', 'chapter']) test(`AcademicTree ${type} accepts an Excel sheet and uploads manually edited phone numbers`, async () => {
  const XLSX = require('xlsx'); const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([['01010000001']]), 'Phones');
  const file = new File([XLSX.write(book, { type: 'buffer', bookType: 'xlsx' })], 'phones.xlsx');
  let numbers = [], uploaded;
  const Detail = load('src/components/MillerColumns/DetailPanel.tsx', {
    'next-intl': { useLocale: () => 'en', useTranslations: () => key => key },
    '@/src/lib/preactivation-phones': phones, './ChapterPreview': { ChapterPreview: () => null }, './StudentSelector': { StudentSelector: () => null },
  }).DetailPanel;
  const render = () => Detail({ node: { type, name: 'Selected', data: { id: '12', attributes: {} } }, isAdmin: true, isOwner: false, isInstructor: false, canUseActivations: true,
    activationTab: 'preactivation', preactivationNumbers: numbers, setPreactivationNumbers: value => { numbers = value; },
    preactivationFileRef: { current: null }, isUploadingPreActivation: false, handlePreactivationUpload: (...args) => { uploaded = args; } });
  let tree = render();
  await elements(tree).find(node => node.type === 'input' && node.props.type === 'file').props.onChange({ target: { files: [file] } });
  tree = render(); assert.deepEqual(numbers, ['01010000001']);
  elements(tree).find(node => node.type === 'input' && node.props.type === 'text').props.onChange({ target: { value: '01010000002' } }); tree = render();
  const upload = button(tree, 'uploadPreactivations'); assert.equal(upload.props.disabled, false); upload.props.onClick();
  assert.deepEqual(uploaded.slice(0, 2), [12, type]); assert.equal(await uploaded[2].text(), '01010000002');
});

test('academic tree derives the same lecture and lesson hierarchy without state updates during rendering', () => {
  const source = readFileSync(resolve(root, 'app/(admin)/departments/page.tsx'), 'utf8');
  const ast = ts.createSourceFile('page.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let callback;
  function visit(node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(ast).includes('lecturesByCourse') && node.initializer?.expression?.getText(ast) === 'useMemo') callback = node.initializer.arguments[0].getText(ast);
    ts.forEachChild(node, visit);
  }
  visit(ast); assert.ok(callback);
  const compiled = ts.transpileModule(`module.exports = ${callback}`, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
  const chapter = { id: '3', attributes: {} }, lecture = { id: '2', attributes: { chapters: [chapter] } };
  const courses = [{ id: '1', attributes: { lectures: [lecture] } }, { id: '4', attributes: {} }];
  const module = { exports: {} }; new Function('courses', 'module', compiled)(courses, module);
  const result = module.exports();
  assert.deepEqual(result, { lecturesByCourse: { 1: [lecture], 4: [] }, chaptersByLecture: { '1-2': [chapter] } });
  assert.equal(courses[0].attributes.lectures[0].attributes.chapters[0], chapter);
  assert.doesNotMatch(callback, /setLecturesByCourse|setChaptersByLecture|setExpanded/);
});

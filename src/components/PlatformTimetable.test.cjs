const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const ts = require('typescript');

function render(entries, search = '', page = 1, canUpload = false) {
  const compiled = ts.transpileModule(readFileSync(join(__dirname, 'PlatformTimetable.tsx'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  const state = [entries, [], search, page, false, false, false, null];
  let index = 0;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', compiled)(id => {
    if (id === 'react') return { ...React, useState: () => [state[index++], () => {}], useEffect: () => {} };
    if (id === 'next-intl') return { useLocale: () => 'ar' };
    if (id === 'next/dynamic') return () => () => null;
    if (id === '@/src/hooks/useCourses') return { useCourses: () => ({ data: [] }) };
    if (id === '@/src/components/admin/CourseTreeSelect') return { CourseTreeSelect: () => React.createElement('div', null, 'Course tree') };
    if (id === '@/src/lib/api') return {};
    return require(id);
  }, module, module.exports);
  return renderToStaticMarkup(React.createElement(module.exports.default, { canUpload }));
}

test('timetable shows courses only, groups their documents and searches document names', () => {
  const entries = [{ kind: 'course', id: 1, title: 'Biology', start: null, end: null,
    documents: [{ id: '7', attributes: { name: 'Weekly plan.pdf' } }] },
    { kind: 'live', id: 2, title: 'Hidden live category' }, { kind: 'course', id: 3, title: 'Other course' }];
  const html = render(entries, 'weekly', 1, true);
  assert.match(html, /Biology[\s\S]*Weekly plan.pdf[\s\S]*استبدال الملف[\s\S]*<\/article>/);
  assert.match(html, /Course tree/);
  assert.doesNotMatch(html, /بدون موعد محدد|No scheduled date/);
  assert.doesNotMatch(html, /Hidden live category|Other course/);
  assert.match(render(entries, 'unmatched'), /لا توجد جداول مطابقة للبحث/);
});

test('timetable paginates courses and student pages do not expose upload controls', () => {
  const entries = Array.from({ length: 11 }, (_, id) => ({ kind: 'course', id, title: `Course-${id}`, start: null, end: null }));
  const html = render(entries, '', 2);
  assert.match(html, /Course-10/);
  assert.doesNotMatch(html, /Course-0<|Course tree|type="file"/);
  assert.match(html, /2 \/ 2/);
});

test('dated courses retain their date range while undated courses retain their documents only', () => {
  const html = render([{ kind: 'course', id: 1, title: 'Biology', start: '2026-10-10T12:00:00Z', end: '2026-10-10T13:00:00Z' }]);
  assert.match(html, /<p class="text-sm">[^<]+ — [^<]+<\/p>/);
  const undated = render([{ kind: 'course', id: 2, title: 'History', documents: [{ id: '3', attributes: { name: 'Schedule.png' } }] }]);
  assert.match(undated, /Schedule.png/);
  assert.doesNotMatch(undated, /<p class="text-sm">/);
});

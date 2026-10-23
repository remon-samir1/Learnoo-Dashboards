/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS test harness. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const React = require('react');
const ts = require('typescript');
const compile = file => ts.transpileModule(readFileSync(`${__dirname}/${file}`, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
}).outputText;
const href = { exports: {} };
new Function('require', 'module', 'exports', compile('../lib/notification-href.ts'))(() => ({ buildStudentStartExamHref: () => '' }), href, href.exports);
const code = compile('PlatformNotifications.tsx');
const courses = [
  { id: '1', attributes: { title: 'محاسبة انتظام Accounting' } },
  { id: '2', attributes: { title: 'محاسبة انتساب Finance' } },
  { id: '3', attributes: { title: 'إدارة Business' } },
];
function setup(path = '/notifications', locale = 'ar', sent = 1) {
  const state = [[{ id: 'notice', data: { type: 'student-account', student_id: 'student-id', title: 'Access', message: 'Activated' }, read_at: null, created_at: '2026-10-23T12:00:00Z' }], 1, 1, false];
  let cursor = 0;
  const calls = [], toasts = [];
  const loadedModule = { exports: {} };
  const mocks = {
    react: { ...React, useEffect() {}, useState: initial => { const index = cursor++; if (!(index in state)) state[index] = initial; return [state[index], value => { state[index] = typeof value === 'function' ? value(state[index]) : value; }]; } },
    'next-intl': { useLocale: () => locale },
    'next/navigation': { usePathname: () => path },
    'next/link': () => null,
    '@/src/lib/notification-href': href.exports,
    '@/src/hooks/useCourses': { useCourses: () => ({ data: courses }) },
    '@/src/lib/api': { notifications: { send: async payload => { calls.push(payload); return { sent }; }, read: async id => { calls.push(id); }, readAll: async () => {} } },
    sonner: { toast: { success: message => toasts.push(['success', message]), warning: message => toasts.push(['warning', message]), error: message => toasts.push(['error', message]) } },
  };
  new Function('require', 'module', 'exports', code)(id => mocks[id] || require(id), loadedModule, loadedModule.exports);
  return { calls, toasts, render: () => { cursor = 0; return loadedModule.exports.default({ canSend: !path.includes('/student/') }); } };
}
function elements(node) { return !React.isValidElement(node) ? [] : [node, ...React.Children.toArray(node.props.children).flatMap(elements)]; }
function find(s, type) { return elements(s.render()).find(node => node.type === type); }
function text(node) { return React.Children.toArray(node).map(child => typeof child === 'object' ? text(child.props.children) : String(child)).join(''); }

for (const path of ['/notifications', '/doctor/notifications']) for (const locale of ['ar', 'en']) {
  test(`${path} course search and selected recipient work in ${locale}`, async () => {
    const s = setup(path, locale);
    const search = () => elements(s.render()).find(node => node.type === 'input' && node.props.type === 'search');
    search().props.onChange({ target: { value: 'انتساب' } });
    assert.deepEqual(elements(find(s, 'select')).filter(node => node.type === 'option').map(node => String(node.props.value)), ['', '2']);
    find(s, 'select').props.onChange({ target: { value: '2' } });
    search().props.onChange({ target: { value: ' Business ' } });
    assert.equal(find(s, 'select').props.value, '2');
    assert.deepEqual(elements(find(s, 'select')).filter(node => node.type === 'option').map(node => String(node.props.value)), ['', '2', '3']);
    assert.equal(find(s, 'select').props.required, path.startsWith('/doctor/'));
    search().props.onChange({ target: { value: 'no match' } });
    assert.ok(elements(s.render()).some(node => node.props.role === 'status'));
    const title = elements(s.render()).find(node => node.type === 'input' && !node.props.type);
    title.props.onChange({ target: { value: 'Notice' } });
    find(s, 'textarea').props.onChange({ target: { value: 'Message' } });
    await find(s, 'form').props.onSubmit({ preventDefault() {} });
    assert.deepEqual(s.calls, [{ title: 'Notice', message: 'Message', course_id: 2 }]);
    assert.equal(s.toasts[0][0], 'success');
  });
}

test('instructor inbox hides content links and retains mark-as-read', async () => {
  const s = setup('/doctor/notifications');
  assert.equal(elements(s.render()).filter(node => node.props.href).length, 0);
  const button = elements(s.render()).find(node => node.type === 'button' && text(node.props.children) === 'تحديد كمقروء');
  await button.props.onClick();
  assert.deepEqual(s.calls, ['notice']);
  assert.equal(elements(s.render()).filter(node => node.type === 'button' && text(node.props.children) === 'تحديد كمقروء').length, 0);
  assert.ok(elements(setup('/notifications').render()).some(node => node.props.href === '/students/student-id'));
});

test('zero recipients show a warning and preserve the unsent message', async () => {
  const s = setup('/notifications', 'ar', 0);
  elements(s.render()).find(node => node.type === 'input' && !node.props.type).props.onChange({ target: { value: 'Notice' } });
  find(s, 'textarea').props.onChange({ target: { value: 'Message' } });
  await find(s, 'form').props.onSubmit({ preventDefault() {} });
  assert.equal(s.toasts[0][0], 'warning');
  assert.equal(find(s, 'textarea').props.value, 'Message');
});

test('student inbox cannot render a sender form', () => {
  const s = setup('/ar/student/notifications');
  assert.equal(find(s, 'form'), undefined);
});

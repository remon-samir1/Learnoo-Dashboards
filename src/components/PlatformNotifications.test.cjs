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
const CourseTreeSelect = () => null;
const courses = [
  { id: 1, title: 'محاسبة انتظام Accounting', label: 'الأولى / محاسبة انتظام Accounting', department_ids: [10], sendable: true },
  { id: 2, title: 'محاسبة انتساب Finance', label: 'الثانية / محاسبة انتساب Finance', department_ids: [20], sendable: true },
  { id: 3, title: 'إدارة Business', label: 'الأولى / إدارة Business', department_ids: [10], sendable: true },
];
function setup(path = '/notifications', locale = 'ar', sent = 1) {
  const state = [], effects = [], pending = [];
  let cursor = 0, effectCursor = 0, read = false;
  const calls = [], requests = [], toasts = [];
  const loadedModule = { exports: {} };
  const mocks = {
    react: { ...React,
      useEffect(fn, deps) { const index = effectCursor++; if (!effects[index] || deps.some((v, i) => effects[index][i] !== v)) { effects[index] = deps; pending.push(fn); } },
      useState(initial) { const index = cursor++; if (!(index in state)) state[index] = initial; return [state[index], value => { state[index] = typeof value === 'function' ? value(state[index]) : value; }]; },
    },
    'next-intl': { useLocale: () => locale },
    'next/navigation': { usePathname: () => path },
    'next/link': () => null,
    '@/src/lib/notification-href': href.exports,
    '@/src/components/admin/CourseTreeSelect': { CourseTreeSelect },
    '@/src/lib/api': { notifications: {
      options: async () => ({ courses, departments: [{ id: 10, name: 'الأولى' }, { id: 20, name: 'الثانية' }] }),
      list: async (page, filters) => {
        requests.push({ page, filters });
        return { data: [{ id: 'notice', data: { type: 'student-account', student_id: 'student-id', title: 'Access', message: 'Activated' }, recipient_count: 5, read_at: read ? '2026-10-23' : null, created_at: '2026-10-23T12:00:00Z' }], meta: { total: 25, last_page: 2 } };
      },
      send: async payload => { calls.push(payload); return { sent }; },
      read: async id => { read = true; calls.push(id); }, readAll: async () => { read = true; calls.push('all'); },
    } },
    sonner: { toast: { success: message => toasts.push(['success', message]), warning: message => toasts.push(['warning', message]), error: message => toasts.push(['error', message]) } },
  };
  new Function('require', 'module', 'exports', 'setInterval', 'clearInterval', code)(id => mocks[id] || require(id), loadedModule, loadedModule.exports, () => 0, () => {});
  const render = () => { cursor = effectCursor = 0; const result = loadedModule.exports.default({ canSend: !path.includes('/student/') }); pending.splice(0).forEach(fn => fn()); return result; };
  return { calls, requests, toasts, render, async ready() { render(); await new Promise(setImmediate); return render(); } };
}
function elements(node) { return !React.isValidElement(node) ? [] : [node, ...React.Children.toArray(node.props.children).flatMap(elements)]; }
function find(s, type) { return elements(s.render()).find(node => node.type === type); }
function text(node) { return React.Children.toArray(node).map(child => typeof child === 'object' ? text(child.props.children) : String(child)).join(''); }
function label(s, name) { return elements(s.render()).find(node => node.type === 'label' && text(node.props.children).startsWith(name)); }
function control(s, name) { return elements(label(s, name)).find(node => ['input', 'select', 'textarea'].includes(node.type)); }
function button(s, name) { return elements(s.render()).find(node => node.type === 'button' && text(node.props.children) === name); }

for (const path of ['/notifications/add', '/doctor/notifications/add']) for (const locale of ['ar', 'en']) {
  test(`${path} uses the academic tree and requires a course in ${locale}`, async () => {
    const s = setup(path, locale); await s.ready();
    assert.equal(find(s, 'select'), undefined);
    assert.equal(elements(s.render()).find(node => node.type === 'input' && node.props.type === 'search'), undefined);
    assert.equal(find(s, CourseTreeSelect).props.required, true);
    assert.equal(elements(s.render()).filter(node => node.props.name === 'audience').length, path.startsWith('/doctor/') ? 0 : 2);
    elements(s.render()).find(node => node.type === 'input' && !node.props.type).props.onChange({ target: { value: 'Notice' } });
    find(s, 'textarea').props.onChange({ target: { value: 'Message' } });
    await find(s, 'form').props.onSubmit({ preventDefault() {} });
    assert.deepEqual(s.calls, []);
    assert.equal(s.toasts[0][0], 'error');
    find(s, CourseTreeSelect).props.onChange('2');
    assert.equal(find(s, CourseTreeSelect).props.value, '2');
    await find(s, 'form').props.onSubmit({ preventDefault() {} });
    assert.deepEqual(s.calls, [{ title: 'Notice', message: 'Message', course_id: 2 }]);
    assert.equal(s.toasts.at(-1)[0], 'success');
  });
}

test('instructor inbox hides content links and retains mark-as-read', async () => {
  const s = setup('/doctor/notifications'); await s.ready();
  assert.equal(elements(s.render()).filter(node => node.props.href && node.props.href !== '/doctor/notifications/add').length, 0);
  await button(s, 'تحديد كمقروء').props.onClick(); await s.ready();
  assert.deepEqual(s.calls, ['notice']);
  assert.equal(button(s, 'تحديد كمقروء'), undefined);
  const owner = setup('/notifications'); await owner.ready();
  assert.ok(elements(owner.render()).some(node => node.props.href === '/students/student-id'));
});

test('administration explicitly selects all students and preserves an unsent message', async () => {
  const s = setup('/notifications/add', 'ar', 0); await s.ready();
  find(s, CourseTreeSelect).props.onChange('2');
  elements(s.render()).find(n => n.props.name === 'audience' && n.props.value === 'all').props.onChange();
  assert.equal(find(s, CourseTreeSelect), undefined);
  elements(s.render()).find(node => node.type === 'input' && !node.props.type).props.onChange({ target: { value: 'Notice' } });
  find(s, 'textarea').props.onChange({ target: { value: 'Message' } });
  await find(s, 'form').props.onSubmit({ preventDefault() {} });
  assert.deepEqual(s.calls, [{ title: 'Notice', message: 'Message', course_id: undefined }]);
  assert.equal(s.toasts[0][0], 'warning');
  assert.equal(find(s, 'textarea').props.value, 'Message');
});

test('student inbox has search filters but cannot render sender or sent view', async () => {
  const s = setup('/ar/student/notifications'); await s.ready();
  assert.equal(find(s, 'textarea'), undefined);
  assert.equal(button(s, 'المرسل'), undefined);
  assert.ok(control(s, 'حالة القراءة'));
});

test('combined filters reach the server, narrow courses and reset pagination', async () => {
  const s = setup('/notifications', 'en'); await s.ready();
  button(s, 'Next').props.onClick(); await s.ready();
  assert.equal(s.requests.at(-1).page, 2);
  control(s, 'Search notifications').props.onChange({ target: { value: 'Anatomy' } });
  control(s, 'Academic year').props.onChange({ target: { value: '20' } });
  assert.deepEqual(elements(control(s, 'Course')).filter(n => n.type === 'option').map(n => String(n.props.value)), ['', '2']);
  for (const [name, value] of [['Course', '2'], ['Notification type', 'exam'], ['Read status', 'unread'], ['From date', '2026-10-21'], ['To date', '2026-10-23']]) control(s, name).props.onChange({ target: { value } });
  find(s, 'form').props.onSubmit({ preventDefault() {} }); await s.ready();
  assert.deepEqual(s.requests.at(-1), { page: 1, filters: { search: 'Anatomy', department_id: '20', course_id: '2', type: 'exam', status: 'unread', from: '2026-10-21', to: '2026-10-23' } });
  control(s, 'Academic year').props.onChange({ target: { value: '10' } });
  assert.equal(control(s, 'Course').props.value, '');
  button(s, 'Reset filters').props.onClick(); await s.ready();
  assert.deepEqual(s.requests.at(-1), { page: 1, filters: {} });
  assert.equal(control(s, 'Search notifications').props.value, '');
});

for (const path of ['/notifications', '/doctor/notifications']) {
  test(`${path} puts filters above received items without a sender form or Sent tab`, async () => {
    const s = setup(path, 'en'); await s.ready();
    assert.equal(find(s, 'textarea'), undefined);
    assert.equal(button(s, 'Sent'), undefined);
    assert.equal(button(s, 'Received'), undefined);
    assert.ok(control(s, 'Search notifications'));
    assert.ok(control(s, 'Academic year'));
    const nodes = elements(s.render());
    assert.ok(nodes.findIndex(n => n.type === 'form') < nodes.findIndex(n => n.type === 'article'));
    assert.ok(nodes.some(n => n.props.href === `${path}/add`));
  });
}

test('the separate sender page uses the academic tree without inbox filters', async () => {
  const s = setup('/doctor/notifications/add', 'en'); await s.ready();
  assert.ok(find(s, 'textarea'));
  assert.equal(control(s, 'Search notifications'), undefined);
  assert.equal(control(s, 'Academic year'), undefined);
  assert.equal(button(s, 'Sent'), undefined);
  assert.ok(find(s, CourseTreeSelect));
  assert.equal(find(s, 'select'), undefined);
  assert.ok(elements(s.render()).some(n => n.props.href === '/doctor/notifications'));
});

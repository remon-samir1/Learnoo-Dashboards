const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const React = require('react');
const ts = require('typescript');

function elements(node) {
  return !React.isValidElement(node) ? [] : [node, ...React.Children.toArray(node.props.children).flatMap(elements)];
}

function setup(role, locale, fail = false) {
  let cursor = 0;
  const states = [], events = [];
  const module = { exports: {} };
  const mocks = {
    react: { ...React, useEffect: () => {}, useState: initial => {
      const i = cursor++;
      if (!(i in states)) states[i] = i === 1 ? [{ id: 'student-1', first_name: 'QA', last_name: 'Student', phone: '123', current_device: null, requested_device: null }] : initial;
      return [states[i], value => { states[i] = typeof value === 'function' ? value(states[i]) : value; }];
    } },
    'next-intl': { useLocale: () => locale },
    '@/src/hooks/useAuth': { useCurrentUser: () => ({ role }) },
    '@/components/dashboard/StaffActivityDetails': { default: () => null },
    '@/src/lib/staff-activity': { formatStaffActivity: value => value },
    '@/src/lib/api': { ownerOperations: Object.fromEntries(['approve', 'cancel'].map(action => [action, async id => { events.push([action, id]); if (fail) throw new Error('Request failed'); }])) },
    sonner: { toast: { success: text => events.push(['success', text]), error: text => events.push(['error', text]) } },
  };
  const compiled = ts.transpileModule(readFileSync(`${__dirname}/../../app/(admin)/activity/page.tsx`, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  new Function('require', 'module', 'exports', compiled)(name => mocks[name] || require(name), module, module.exports);
  return { events, render: () => { cursor = 0; return module.exports.default(); } };
}

for (const role of ['Admin', 'Super Admin']) for (const locale of ['ar', 'en']) test(`${role} can cancel a transfer in ${locale} and remove it from the list`, async () => {
  const s = setup(role, locale); const tree = s.render();
  const cancel = elements(tree).find(node => node.type === 'button' && node.props.children === (locale === 'ar' ? 'إلغاء الطلب' : 'Cancel request'));
  assert.equal(cancel.props.type, 'button');
  const previous = global.window;
  try {
    global.window = { confirm: () => false };
    await cancel.props.onClick(); assert.deepEqual(s.events, []);
    global.window.confirm = message => { assert.match(message, locale === 'ar' ? /الجلسات الحالية/ : /current sessions/); return true; };
    await cancel.props.onClick();
    assert.deepEqual(s.events.map(event => event[0]), ['cancel', 'success']);
    assert.equal(elements(s.render()).filter(node => node.type === 'article').length, 0);
  } finally { global.window = previous; }
});

test('failed cancellation leaves the pending request visible and approval still calls its existing endpoint', async () => {
  const previous = global.window; global.window = { confirm: () => true };
  try {
    const s = setup('Admin', 'en', true);
    await elements(s.render()).find(node => node.type === 'button' && node.props.children === 'Cancel request').props.onClick();
    assert.deepEqual(s.events.map(event => event[0]), ['cancel', 'error']);
    assert.equal(elements(s.render()).filter(node => node.type === 'article').length, 1);
    const approved = setup('Admin', 'en');
    await elements(approved.render()).find(node => node.type === 'button' && node.props.children === 'Approve new device').props.onClick();
    assert.deepEqual(approved.events.map(event => event[0]), ['approve', 'success']);
  } finally { global.window = previous; }
});

test('other roles have no transfer actions', () => {
  for (const role of ['Instructor', 'Student', 'Parent', 'Support']) {
    assert.equal(elements(setup(role, 'en').render()).filter(node => node.type === 'button').length, 0);
  }
});

test('device reset lives below account status on the edit page and is removed from the read-only profile', () => {
  const edit = readFileSync(`${__dirname}/../../app/(admin)/students/[id]/edit/page.tsx`, 'utf8');
  const view = readFileSync(`${__dirname}/../../app/(admin)/students/[id]/page.tsx`, 'utf8');
  assert.doesNotMatch(view, /StudentDeviceReset/);
  assert.match(edit, /<StudentDeviceReset studentId=\{studentId\}/);
  assert.ok(edit.indexOf('<StudentDeviceReset') > edit.indexOf('value={formData.feedback}'));
  assert.ok(edit.indexOf('<StudentDeviceReset') < edit.indexOf('{/* Action Buttons */}'));
});

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const React = require('react');
const ts = require('typescript');

function load(role, locale, events, fail = false) {
  const module = { exports: {} };
  const mocks = {
    react: { ...React, useState: () => [false, value => events.push(['busy', value])] },
    'next-intl': { useLocale: () => locale },
    '@/src/hooks/useAuth': { useCurrentUser: () => ({ role }) },
    '@/src/lib/api': { ownerOperationsApi: { resetDevice: async id => { events.push(['reset', id]); if (fail) throw new Error('Request failed'); } } },
    sonner: { toast: { success: text => events.push(['success', text]), error: text => events.push(['error', text]) } },
  };
  const compiled = ts.transpileModule(readFileSync(`${__dirname}/StudentDeviceReset.tsx`, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  new Function('require', 'module', 'exports', compiled)(id => mocks[id] || require(id), module, module.exports);
  return module.exports.default({ studentId: 'student-123' });
}

test('only Owner and Admin see device reset, with a clear confirmation in both languages', async () => {
  for (const role of ['Student', 'Instructor', 'Parent', 'Support', null]) assert.equal(load(role, 'ar', []), null);
  const previous = global.window;
  try {
    for (const role of ['Admin', 'Super Admin']) for (const locale of ['ar', 'en']) {
      const events = [];
      const tree = load(role, locale, events);
      const button = tree.props.children.find(node => node.type === 'button');
      assert.equal(button.props.children, locale === 'ar' ? 'السماح بتغيير الجهاز' : 'Allow device change');
      global.window = { confirm: message => { assert.match(message, locale === 'ar' ? /أول جهاز/ : /first device/); return false; } };
      await button.props.onClick();
      assert.deepEqual(events, []);
      global.window.confirm = () => true;
      await button.props.onClick();
      assert.deepEqual(events.slice(0, 2), [['busy', true], ['reset', 'student-123']]);
      assert.equal(events[2][0], 'success');
      assert.deepEqual(events[3], ['busy', false]);
    }
  } finally { global.window = previous; }
});

test('a failed reset does not claim success and releases the busy state', async () => {
  const events = [];
  const tree = load('Admin', 'en', events, true);
  const previous = global.window;
  global.window = { confirm: () => true };
  try { await tree.props.children.find(node => node.type === 'button').props.onClick(); }
  finally { global.window = previous; }
  assert.deepEqual(events.map(event => event[0]), ['busy', 'reset', 'error', 'busy']);
  assert.deepEqual(events.at(-1), ['busy', false]);
});

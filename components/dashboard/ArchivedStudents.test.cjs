const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const React = require('react');
const ts = require('typescript');

test('restoring or releasing an archive refreshes both the archive and the active student list', async () => {
  const events = [];
  const module = { exports: {} };
  const mocks = {
    react: { ...React, useState: value => [value, () => {}] },
    'next-intl': { useLocale: () => 'en' },
    '@tanstack/react-query': { useQuery: () => ({ data: { data: [{ id: 'qa', first_name: 'QA', last_name: 'Student', phone: '123' }] }, refetch: async () => events.push('archives') }) },
    '@/src/hooks/useAuth': { useCurrentUser: () => ({ role: 'Admin' }) },
    '@/src/lib/api': { archivedStudentsApi: { recover: async (id, mode) => events.push([id, mode]) } },
    sonner: { toast: { success: () => events.push('success'), error: () => assert.fail('Recovery failed') } },
  };
  const compiled = ts.transpileModule(readFileSync(`${__dirname}/ArchivedStudents.tsx`, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  new Function('require', 'module', 'exports', compiled)(id => mocks[id] || require(id), module, module.exports);
  const tree = module.exports.default({ onRecovered: async () => events.push('students') });
  const buttons = [];
  function walk(node) {
    React.Children.forEach(node, child => {
      if (!React.isValidElement(child)) return;
      if (child.type === 'button' && child.props.onClick) buttons.push(child);
      walk(child.props.children);
    });
  }
  walk(tree);
  const previous = global.window;
  global.window = { confirm: () => true };
  try {
    for (const [i, mode] of ['restore', 'new'].entries()) {
      events.length = 0;
      await buttons[i].props.onClick();
      assert.deepEqual(events, [['qa', mode], 'archives', 'students', 'success']);
    }
  } finally { global.window = previous; }
});

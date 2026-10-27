const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const React = require('react');
const ts = require('typescript');
const elements = node => React.isValidElement(node) ? [node, ...React.Children.toArray(node.props.children).flatMap(elements)] : [];
const code = ts.transpileModule(readFileSync(`${__dirname}/../../../app/[locale]/student/profile/page.tsx`, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
}).outputText;
for (const locale of ['ar', 'en']) for (const remaining of [0, 1, 2]) test(`${locale}: student profile shows ${remaining} remaining device changes`, async () => {
  const messages = require(`../../../messages/${locale}.json`).studentProfile;
  const loaded = { exports: {} };
  const mocks = {
    'next-intl/server': { getTranslations: async () => (key, values = {}) => Object.entries(values).reduce((message, [name, value]) => message.replace(`{${name}}`, value), messages[key] || key) },
    '@/src/services/student/user.service': { getUserProfileData: async () => ({ success: true, data: { data: { attributes: { full_name: 'QA Student', device_transfers: { remaining, used: 2 - remaining, limit: 2 } } } } }) },
  };
  new Function('require', 'module', 'exports', code)(id => mocks[id] || (id.startsWith('@/components/') ? { default: () => null } : require(id)), loaded, loaded.exports);
  const tree = await loaded.exports.default();
  const text = elements(tree).filter(node => node.type === 'p').map(node => node.props.children);
  assert.ok(text.includes(messages.deviceTransferRemaining.replace('{remaining}', remaining).replace('{limit}', 2)));
  assert.equal(text.includes(messages.deviceTransferSupport), remaining === 0);
});

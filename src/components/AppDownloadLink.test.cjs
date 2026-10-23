/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS test harness. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const React = require('react');
const ts = require('typescript');
const code = ts.transpileModule(readFileSync(`${__dirname}/AppDownloadLink.tsx`, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
const elements = node => !React.isValidElement(node) ? [] : [node, ...React.Children.toArray(node.props.children).flatMap(elements)];

for (const locale of ['ar', 'en']) test(`download footer links to Google Play and Huawei without floating in ${locale}`, () => {
  const loaded = { exports: {} };
  new Function('require', 'module', 'exports', code)(id => id === 'next-intl' ? { useLocale: () => locale } : require(id), loaded, loaded.exports);
  const footer = loaded.exports.default();
  assert.equal(footer.type, 'footer');
  const nodes = elements(footer);
  assert.ok(nodes.every(n => !/\b(fixed|absolute|sticky)\b/.test(n.props.className || '')));
  const links = nodes.filter(n => n.type === 'a');
  assert.deepEqual(links.map(n => n.props.href), [
    'https://play.google.com/store/apps/details?id=com.sunmed.learnoo',
    'https://appgallery.huawei.com/app/C119233749',
  ]);
  for (const link of links) {
    assert.equal(link.props.target, '_blank');
    assert.equal(link.props.rel, 'noopener noreferrer');
    assert.ok(link.props['aria-label'].includes(link.props.children));
  }
});

test('downloads are mounted in student and auth layouts, not the global staff dashboard layout', () => {
  assert.ok(!readFileSync(`${__dirname}/../../app/layout.tsx`, 'utf8').includes('AppDownloadLink'));
  assert.ok(readFileSync(`${__dirname}/../../components/student/StudentLayoutShell.tsx`, 'utf8').includes('<AppDownloadLink />'));
  assert.ok(readFileSync(`${__dirname}/../../app/(auth)/components/AuthLayout.tsx`, 'utf8').includes('<AppDownloadLink />'));
});

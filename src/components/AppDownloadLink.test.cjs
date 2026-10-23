/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS test harness. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const ts = require('typescript');
const code = ts.transpileModule(readFileSync(`${__dirname}/AppDownloadLink.tsx`, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText;

for (const locale of ['ar', 'en']) test(`download links use the verified listing without duplicating auth links in ${locale}`, () => {
  let segments = ['(admin)', 'notifications'];
  const loaded = { exports: {} };
  const mocks = {
    'next-intl': { useLocale: () => locale },
    'next/navigation': { useSelectedLayoutSegments: () => segments },
    'lucide-react': { Download: () => null },
  };
  new Function('require', 'module', 'exports', code)(id => mocks[id] || require(id), loaded, loaded.exports);
  const DownloadLink = loaded.exports.default;
  const link = DownloadLink({ floating: true });
  assert.equal(link.props.href, 'https://play.google.com/store/apps/details?id=com.sunmed.learnoo');
  assert.equal(link.props.target, '_blank');
  assert.equal(link.props.rel, 'noopener noreferrer');
  assert.ok(link.props['aria-label'].includes('Google Play'));
  assert.ok(link.props.className.includes('fixed'));
  segments = ['(auth)', 'login'];
  assert.equal(DownloadLink({ floating: true }), null);
  assert.equal(DownloadLink({}).props.href, link.props.href);
  assert.ok(!DownloadLink({}).props.className.includes('fixed'));
});

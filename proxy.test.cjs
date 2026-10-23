/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS test harness. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const ts = require('typescript');
const loaded = { exports: {} };
new Function('require', 'module', 'exports', ts.transpileModule(readFileSync(`${__dirname}/proxy.ts`, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText)(() => ({}), loaded, loaded.exports);

test('the generated icon stays public while application pages remain authenticated', () => {
  const matcher = new RegExp(`^${loaded.exports.config.matcher[0]}$`);
  for (const path of ['/icon', '/Logo.jpeg', '/favicon.ico', '/_next/static/chunk.js', '/api/auth/session-end']) assert.equal(matcher.test(path), false, path);
  for (const path of ['/notifications', '/doctor/notifications', '/ar/student/notifications', '/icon/settings']) assert.equal(matcher.test(path), true, path);
});

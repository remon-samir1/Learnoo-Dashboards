const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const React = require('react');
const ts = require('typescript');
const moduleUnderTest = { exports: {} };
const code = ts.transpileModule(readFileSync(`${__dirname}/Breadcrumb.tsx`, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
}).outputText;
new Function('require', 'module', 'exports', code)(id => id === 'next-intl'
  ? { useTranslations: () => () => 'إدارة المحتوى' } : require(id), moduleUnderTest, moduleUnderTest.exports);
const elements = node => React.isValidElement(node) ? [node, ...React.Children.toArray(node.props.children).flatMap(elements)] : [];

test('breadcrumb keeps every nested academic category and jumps to the exact selected ancestor', () => {
  const names = ['جامعة', 'سنتر', 'كلية', 'الترم الأول', 'انتساب', 'الفرقة الثانية', 'محاسبة', 'فيديوهات'];
  const nodes = names.map((name, index) => ({ id: `node-${index}`, name, type: index >= 3 && index < 6 ? 'department' : 'course' }));
  const jumps = [];
  const tree = moduleUnderTest.exports.Breadcrumb({ nodes, onJump: index => jumps.push(index) });
  const buttons = elements(tree).filter(node => node.type === 'button');
  assert.deepEqual(buttons.map(node => node.props.children), ['إدارة المحتوى', ...names]);
  for (const button of buttons) button.props.onClick();
  assert.deepEqual(jumps, [null, 0, 1, 2, 3, 4, 5, 6, 7]);
  assert.ok(tree.props.className.includes('overflow-x-auto'));
});

test('breadcrumb root is usable without a current selection', () => {
  let clicked = false;
  const tree = moduleUnderTest.exports.Breadcrumb({ nodes: [], onJump: value => { assert.equal(value, null); clicked = true; } });
  const buttons = elements(tree).filter(node => node.type === 'button');
  assert.equal(buttons.length, 1);
  buttons[0].props.onClick(); assert.equal(clicked, true);
});

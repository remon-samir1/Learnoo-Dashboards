const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const ts = require('typescript');
const component = { exports: {} };
new Function('require', 'module', 'exports', ts.transpileModule(readFileSync(`${__dirname}/DetailPanel.tsx`, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
}).outputText)(name => name === 'next-intl' ? { useTranslations: () => key => key, useLocale: () => 'ar' }
  : name === './ChapterPreview' ? { ChapterPreview: () => null }
  : name === './StudentSelector' ? { StudentSelector: () => null } : require(name), component, component.exports);

test('course count opens its subscriber list and a hidden count has no action', () => {
  const node = { type: 'course', name: 'Course', data: { id: '12', attributes: {} }, stats: { students: 31 } };
  let clicked;
  const props = { node, openViewers: value => { clicked = value; }, canUseActivations: false };
  function buttons(element) {
    if (!element || typeof element !== 'object') return [];
    return [...(element.type === 'button' && element.props['aria-label'] ? [element] : []),
      ...[].concat(element.props?.children || []).flatMap(buttons)];
  }
  const [button] = buttons(component.exports.DetailPanel(props));
  assert.equal(button.props.children, 31);
  button.props.onClick();
  assert.equal(clicked, node);
  assert.equal(buttons(component.exports.DetailPanel({ ...props, node: { ...node, stats: {} } })).length, 0);
});

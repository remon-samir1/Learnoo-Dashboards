const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const React = require('react');
const ts = require('typescript');
const nodes = node => React.isValidElement(node) ? [node, ...React.Children.toArray(node.props.children).flatMap(nodes)] : [];
const CourseTreeSelect = () => null;
function setup(role) {
  const state = [], queries = [], requests = [];
  let cursor = 0;
  const loaded = { exports: {} };
  const mocks = {
    react: { ...React, useState: initial => { const i = cursor++; if (!(i in state)) state[i] = initial; return [state[i], value => { state[i] = typeof value === 'function' ? value(state[i]) : value; }]; } },
    'next-intl': { useLocale: () => 'en' },
    '@/src/hooks/useAuth': { useCurrentUser: () => ({ role }) },
    '@tanstack/react-query': { useQuery: query => { queries.push(query); return { isPending: false, isError: false, refetch() {}, data: { total: 31, last_page: 2, data: [{ id: 1, phone: '201010000001', title: 'QA course', item_type: 'course', category_path: ['Second year', 'انتساب'], created_at: null }] } }; } },
    '@/src/components/admin/CourseTreeSelect': { CourseTreeSelect },
    '@/src/lib/api': { ownerOperationsApi: { pendingActivations: async (...params) => { requests.push(params); } } },
  };
  const code = ts.transpileModule(readFileSync(`${__dirname}/page.tsx`, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  new Function('require', 'module', 'exports', code)(id => mocks[id] || require(id), loaded, loaded.exports);
  return { queries, requests, render: () => { cursor = 0; return loaded.exports.default(); } };
}
for (const role of ['Admin', 'Instructor', 'Student', 'Parent', undefined]) test(`${role}: pending number data stays hidden even if a cached result exists`, () => {
  const s = setup(role); const tree = s.render();
  assert.equal(s.queries.at(-1).enabled, false);
  assert.equal(nodes(tree).filter(node => node.type === 'article').length, 0);
});
test('Owner phone and course filters are applied together and a new search resets pagination', async () => {
  const s = setup('Super Admin'); let tree = s.render();
  nodes(tree).filter(node => node.type === 'button').at(-1).props.onClick();
  tree = s.render(); assert.equal(s.queries.at(-1).queryKey[1], 2);
  nodes(tree).find(node => node.type === 'input').props.onChange({ target: { value: '01010000001' } });
  nodes(tree).find(node => node.type === CourseTreeSelect).props.onChange('329');
  tree = s.render(); nodes(tree).find(node => node.type === 'form').props.onSubmit({ preventDefault() {} });
  tree = s.render(); await s.queries.at(-1).queryFn();
  assert.deepEqual(s.requests.at(-1), [1, { phone: '01010000001', item_type: 'course', course_id: 329 }]);
  assert.equal(nodes(tree).filter(node => node.type === 'article').length, 1);
});

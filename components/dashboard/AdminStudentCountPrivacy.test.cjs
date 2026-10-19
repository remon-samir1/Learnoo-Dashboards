const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const React = require('react');
const ts = require('typescript');
const root = resolve(__dirname, '../..');
function load(path, role, mocks = {}) {
  const module = { exports: {} };
  const Stub = () => null;
  const hooks = { ...React, useState: value => [value, () => {}], useEffect() {}, useMemo: fn => fn() };
  const defaults = {
    react: hooks,
    'next-intl': { useLocale: () => 'en', useTranslations: namespace => key => `${namespace}.${key}` },
    'next/navigation': { useParams: () => ({ id: '12' }), useRouter: () => ({ back() {} }) },
    'next/link': Stub,
    '@/src/hooks/useAuth': { useCurrentUser: () => ({ role }) },
    '@/src/types': { StudentStatusLabels: {} },
  };
  const code = ts.transpileModule(readFileSync(resolve(root, path), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  new Function('require', 'module', 'exports', code)(name => mocks[name] || defaults[name] || (name.startsWith('@/components/') || name.startsWith('@/src/components/') ? { default: Stub, StatCardSkeleton: Stub, QuickActionSkeleton: Stub, ChartSkeleton: Stub, ActivityItemSkeleton: Stub, Skeleton: Stub, TableSkeleton: Stub } : require(name)), module, module.exports);
  return module.exports.default;
}
function elements(node) { return !node || typeof node !== 'object' ? [] : [node, ...React.Children.toArray(node.props?.children).flatMap(elements)]; }
function text(node) { return React.Children.toArray(node).map(child => typeof child === 'object' ? text(child.props?.children) : String(child)).join(' '); }

for (const role of ['Admin', 'Super Admin', undefined]) {
  test(`${role || 'Loading'} dashboard student total is Owner-only despite cached response`, () => {
    const Page = load('app/(admin)/dashboard/page.tsx', role, {
      '@/src/hooks/useDashboard': {
        useDashboardStats: () => ({ data: { data: { total_students: { value: 42 }, active_courses: { value: 3 } } } }),
        useActivityData: () => ({}), useEngagementData: () => ({}), useRecentActivity: () => ({}),
      },
    });
    const tree = Page();
    assert.equal(elements(tree).filter(node => node.props?.label === 'dashboard.stats.totalStudents').length, role === 'Super Admin' ? 1 : 0);
    assert.equal(elements(tree).filter(node => node.props?.label === 'dashboard.stats.activeCourses').length, 1);
    assert.ok(elements(tree).some(node => node.props?.href === '/students/add'));
  });
  test(`${role || 'Loading'} center hides student and enrollment counts while preserving content`, () => {
    const tree = load('app/(admin)/centers/[id]/page.tsx', role)();
    assert.equal(text(tree).includes('4,500'), role === 'Super Admin');
    assert.equal(text(tree).includes('students enrolled'), role === 'Super Admin');
    assert.match(text(tree), /Physics 101/);
    assert.match(text(tree), /Live Sessions/);
  });
}

for (const role of ['Admin', 'Super Admin']) test(`${role} student list keeps search and navigation with appropriate total visibility`, () => {
  const requests = [], pages = [];
  const states = ['', 'all', '', 1]; let cursor = 0;
  const Page = load('app/(admin)/students/page.tsx', role, {
    react: { ...React, useState: () => [states[cursor++], value => pages.push(value)], useEffect() {}, useMemo: fn => fn() },
    '@tanstack/react-query': { useQueryClient: () => ({}) },
    '@/src/hooks/useStudents': {
      useStudents: filter => { requests.push(filter); return { data: { data: [{ id: 'one', attributes: { first_name: 'Student', last_name: 'One', phone: '01010000001', status: 1, centers: [] } }], meta: { from: 1, to: 10, total: 42, last_page: 5 }, links: { next: '/v1/student?page=2' } } }; },
      useDeleteStudent: () => ({}),
    },
  });
  const tree = Page();
  assert.equal(text(tree).includes('42'), role === 'Super Admin');
  assert.equal(elements(tree).some(node => node.props?.href === '/students/one/edit'), true);
  const next = elements(tree).find(node => node.type === 'button' && text(node) === 'common.next');
  assert.equal(next.props.disabled, false); next.props.onClick(); assert.deepEqual(pages, [2]);
  const search = elements(tree).find(node => node.type === 'input');
  search.props.onChange({ target: { value: 'Student' } }); assert.equal(pages.at(-1), 'Student');
  assert.equal(requests[0].role, 0);
});

for (const role of ['Admin', 'Super Admin']) test(`${role} archive paging preserves recovery controls without exposing Admin page totals`, () => {
  const pages = []; let cursor = 0;
  const Page = load('components/dashboard/ArchivedStudents.tsx', role, {
    react: { ...React, useState: () => [['', 1, ''][cursor++], value => pages.push(value)] },
    '@tanstack/react-query': { useQuery: () => ({ data: { data: [{ id: 'one', first_name: 'Student', phone: '123' }], last_page: 42, next_page_url: '/v1/student-archives?page=2' } }) },
    '@/src/lib/api': { archivedStudentsApi: {} }, sonner: { toast: {} },
  });
  const tree = Page({ onRecovered() {} });
  assert.equal(text(tree).includes('42'), role === 'Super Admin');
  assert.match(text(tree), /Restore previous account/);
  assert.match(text(tree), /Allow new account/);
  const next = elements(tree).find(node => node.type === 'button' && text(node) === 'Next');
  assert.equal(next.props.disabled, false); next.props.onClick(); assert.deepEqual(pages, [2]);
});

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const ts = require('typescript');
const root = resolve(__dirname, '../../..');
const translations = require(resolve(root, 'messages/ar.json'));
const i18n = {
  useLocale: () => 'ar',
  useTranslations: namespace => (key, values = {}) => {
    const value = `${namespace ? namespace + '.' : ''}${key}`.split('.').reduce((value, part) => value?.[part], translations);
    return typeof value === 'string' ? value.replace(/\{(\w+)\}/g, (_, key) => values[key] ?? `{${key}}`) : key;
  },
};
function load(path, mocks = {}) {
  const module = { exports: {} };
  const compiled = ts.transpileModule(readFileSync(resolve(root, path), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  new Function('require', 'module', 'exports', compiled)(id => mocks[id] || (id === 'next-intl' ? i18n : require(id)), module, module.exports);
  return module.exports;
}
function elements(node) {
  return !node || typeof node !== 'object' ? [] : [node, ...React.Children.toArray(node.props?.children).flatMap(elements)];
}

test('numbered pagination has bounded buttons, current-page semantics and working navigation', () => {
  const { Pagination } = load('src/components/ui/DataTable.tsx');
  const pages = [];
  for (const currentPage of [1, 5, 100]) {
    const tree = Pagination({ currentPage, totalPages: 100, onPageChange: page => pages.push(page), totalItems: 1000, itemsPerPage: 10 });
    const buttons = elements(tree).filter(node => node.type === 'button');
    const numbers = buttons.filter(node => typeof node.props.children === 'number');
    assert.ok(numbers.length <= 7);
    assert.equal(numbers.find(node => node.props['aria-current'] === 'page').props.children, currentPage);
    assert.equal(buttons[0].props.disabled, currentPage === 1);
    assert.equal(buttons.at(-1).props.disabled, currentPage === 100);
    numbers.find(node => node.props.children === 100).props.onClick();
    assert.equal(pages.at(-1), 100);
  }
});

test('Owner draft link filters Arabic course cards and shows the actual recorded actor', () => {
  let states = [], cursor = 0;
  const effects = [];
  const courses = [
    { id: '1', attributes: { title: 'Active course', status: 1 } },
    { id: '2', attributes: { title: 'Draft course', status: 0, drafted_by: { first_name: 'Ahmed', last_name: 'Admin' } } },
    { id: '3', attributes: { title: 'Old draft', status: 0, drafted_by: null } },
  ];
  const { CourseCard } = load('components/CourseCard.tsx');
  const { default: Courses } = load('app/(admin)/courses/page.tsx', {
    react: { ...React, useState: initial => {
      const index = cursor++;
      states[index] ??= initial;
      return [states[index], value => { states[index] = value; }];
    }, useEffect: effect => effects.push(effect) },
    'next/link': { __esModule: true, default: props => React.createElement('a', props) },
    '@/components/CourseCard': { CourseCard },
    '@/src/hooks/useCourses': { useCourses: () => ({ data: courses }), useDeleteCourse: () => ({ mutate() {} }) },
    '@/src/components/ui/Skeleton': { CourseCardSkeleton: () => null },
  });
  const previousWindow = global.window;
  global.window = { location: { search: '?status=draft' } };
  try {
    Courses();
    effects.forEach(effect => effect());
    cursor = 0;
    const markup = renderToStaticMarkup(Courses());
    assert.ok(!markup.includes('Active course'));
    assert.match(markup, /Draft course/);
    assert.match(markup, /حوّلها لمسودة: Ahmed Admin/);
    assert.match(markup, /حوّلها لمسودة: غير مسجّل/);
  } finally {
    global.window = previousWindow;
  }
});

test('direct teacher authoring routes redirect before rendering content', () => {
  let pathname, redirected;
  const { default: Layout } = load('app/(doctor)/layout.tsx', {
    react: { ...React, useState: value => [value, () => {}], useEffect: effect => effect() },
    '../../components/DoctorSidebar': { __esModule: true, default: () => null },
    '../../components/DoctorHeader': { __esModule: true, default: () => null },
    'next/navigation': { usePathname: () => pathname, useRouter: () => ({ replace: value => { redirected = value; } }) },
  });
  for (pathname of ['/doctor/courses/add', '/doctor/courses/12/edit', '/doctor/chapters/5/edit', '/doctor/courses/12/lectures/create', '/doctor/courses/12/notes/create', '/doctor/notes-summaries/add', '/doctor/content-manager']) {
    redirected = null;
    assert.equal(Layout({ children: 'Protected form' }), null);
    assert.equal(redirected, '/doctor/departments');
  }
  for (pathname of ['/doctor/courses/12', '/doctor/exams/create', '/doctor/discussions']) {
    redirected = null;
    assert.ok(Layout({ children: 'Allowed content' }));
    assert.equal(redirected, null);
  }
});

test('teacher tree has no mutation buttons while administration retains them', () => {
  const { ColumnItem } = load('src/components/MillerColumns/ColumnItem.tsx');
  const { DetailPanel } = load('src/components/MillerColumns/DetailPanel.tsx', {
    './ChapterPreview': { ChapterPreview: () => null }, './StudentSelector': { StudentSelector: () => null },
  });
  for (const type of ['university', 'center', 'faculty', 'department', 'course', 'lecture', 'chapter', 'note']) {
    const item = { type, id: '1', name: 'Course', children: [], data: { id: '1', attributes: {} }, meta: {}, stats: {} };
    const actions = { onEdit() { throw new Error('Cannot edit'); }, onDelete() { throw new Error('Cannot delete'); }, onAdd() { throw new Error('Cannot create'); }, onCopyMove() { throw new Error('Cannot copy'); } };
    const markup = renderToStaticMarkup(React.createElement(ColumnItem, { item, isInstructor: true, searchQuery: '', ...actions }));
    assert.ok(!/title="(Edit|Delete|Copy|Move|Add [^"]+)"/.test(markup), type);
    const panel = DetailPanel({ node: item, isInstructor: true, canUseActivations: false, ...actions });
    const buttons = elements(panel).filter(node => node.type === 'button');
    assert.ok(buttons.every(node => !['edit', 'delete', 'copy', 'move'].includes(node.props.children)), type);
  }
  const item = { type: 'course', id: '1', name: 'Course', children: [], data: { attributes: {} } };
  assert.match(renderToStaticMarkup(React.createElement(ColumnItem, { item, searchQuery: '', isInstructor: false })), /title="Edit"/);
});

test('teacher grid and list expose enrolled course counts without course authoring', () => {
  let mode = 'grid';
  const course = { id: '12', attributes: { doctor_id: 'teacher', title: 'Accounting', status: 1, stats: { students: 31 } } };
  const { default: Courses } = load('app/(doctor)/doctor/courses/page.tsx', {
    react: { ...React, useMemo: fn => fn(), useState: initial => [initial === 'grid' ? mode : initial, () => {}] },
    'next/navigation': { useRouter: () => ({ push() {} }) },
    '@/src/hooks/useCourses': { useCourses: () => ({ data: [course] }) },
    '@/src/hooks/useAuth': { useCurrentUser: () => ({ user: { id: 'teacher' } }) },
  });
  for (mode of ['grid', 'list']) {
    const markup = renderToStaticMarkup(React.createElement(Courses));
    assert.match(markup, />31</);
    assert.ok(!markup.includes(i18n.useTranslations('doctorCourses')('createCourse')));
    assert.ok(!markup.includes('lucide-pencil'));
    assert.ok(!markup.includes('lucide-trash'));
  }
});

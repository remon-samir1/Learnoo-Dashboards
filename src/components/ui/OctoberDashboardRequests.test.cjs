const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const ts = require('typescript');
const root = resolve(__dirname, '../../..');
const translations = require(resolve(root, 'messages/ar.json'));
test('Arabic community ages use Arabic plurals without English suffixes', () => {
  const { createTranslator } = require('next-intl');
  const t = createTranslator({ locale: 'ar', messages: translations });
  assert.equal(t('community.posts.timeAgo.hourAgo', { hours: 4, plural: 's' }), 'منذ 4 ساعات');
  assert.equal(t('community.posts.timeAgo.dayAgo', { days: 2, plural: 's' }), 'منذ يومين');
});
const i18n = {
  useLocale: () => 'ar',
  useTranslations: namespace => (key, values = {}) => {
    const value = `${namespace ? namespace + '.' : ''}${key}`.split('.').reduce((value, part) => value?.[part], translations);
    return typeof value === 'string' ? value.replace(/\{(\w+)\}/g, (_, key) => values[key] ?? `{${key}}`) : key;
  },
};
function load(path, mocks = {}, source = readFileSync(resolve(root, path), 'utf8')) {
  const module = { exports: {} };
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  new Function('require', 'module', 'exports', compiled)(id => mocks[id] || (id === 'next-intl' ? i18n : require(id)), module, module.exports);
  return module.exports;
}
function elements(node) {
  return !node || typeof node !== 'object' ? [] : [node, ...React.Children.toArray(node.props?.children).flatMap(elements)];
}

test('teacher dashboard shows separate active and draft course totals in both languages', () => {
  for (const locale of ['ar', 'en']) {
    const messages = require(resolve(root, `messages/${locale}.json`));
    const data = [{ summary: { pending_questions: 99, pending_discussions: 7 } }, { courses: { value: 12 }, draft_courses: { value: 3 } }, null, null, null, null, null, false, 'month'];
    let cursor = 0;
    const { default: Dashboard } = load('app/(doctor)/doctor/dashboard/page.tsx', {
      react: { ...React, useState: () => [data[cursor++], () => {}], useEffect: () => {} },
      'next-intl': { useTranslations: namespace => key => `${namespace}.${key}`.split('.').reduce((value, part) => value[part], messages) },
      '@/src/hooks/useAuth': { useCurrentUser: () => ({ user: { attributes: { first_name: 'Teacher' } }, isLoading: false }) },
      '@/src/lib/api': { instructorDashboardApi: {} },
    });
    const tree = Dashboard();
    const cards = elements(tree).filter(node => node.props?.label);
    assert.equal(cards.find(node => node.props.label === messages.doctorDashboard.stats.activeCourses).props.value, '12');
    assert.equal(cards.find(node => node.props.label === messages.doctorDashboard.stats.draftCourses).props.value, '3');
    assert.equal(cards.find(node => node.props.label === messages.doctorDashboard.stats.draftCourses).props.subtext, messages.doctorDashboard.stats.unpublished);
    assert.equal(cards.find(node => node.props.label === messages.doctorDashboard.stats.pendingQuestions).props.value, '7');
    assert.ok(elements(tree).some(node => node.props?.href === '/doctor/discussions?unanswered=1'));
  }
});

test('teacher unanswered discussion link waits for its filter and can return to all discussions', () => {
  const states = [], effects = [], requests = [];
  let cursor = 0;
  const { default: Discussions } = load('app/(doctor)/doctor/discussions/page.tsx', {
    react: { ...React, useState: initial => { const i = cursor++; if (!(i in states)) states[i] = initial; return [states[i], value => { states[i] = value; }]; }, useEffect: effect => effects.push(effect), useMemo: fn => fn() },
    '@/src/hooks/useDiscussions': { useDiscussions: (params, options) => { requests.push({ params, options }); return { data: { data: [] }, isLoading: false }; }, useDeleteDiscussion: () => ({}), useCreateDiscussion: () => ({}) },
    '@/src/lib/api': { API_BASE_URL: 'https://fixture.test' },
    '@/components/student/watch/watchChapterDiscussionUtils': { buildDiscussionTree: rows => rows },
  });
  const previousWindow = global.window;
  global.window = { location: { search: '?unanswered=1' } };
  try {
    assert.match(renderToStaticMarkup(Discussions()), /animate-spin/);
    assert.equal(requests.at(-1).options.enabled, false);
    effects[0](); cursor = 0;
    const tree = Discussions();
    assert.equal(requests.at(-1).params.unanswered, 1);
    assert.equal(requests.at(-1).options.enabled, true);
    assert.match(renderToStaticMarkup(tree), /أسئلة الطلاب التي تحتاج إلى رد/);
    elements(tree).find(node => node.type === 'button' && node.props.children === 'عرض كل النقاشات').props.onClick();
    cursor = 0; Discussions();
    assert.equal(requests.at(-1).params.unanswered, undefined);
    assert.equal(requests.at(-1).params.page, 1);
  } finally {
    global.window = previousWindow;
  }
});

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
  for (pathname of ['/doctor/departments/add', '/doctor/courses/12/edit']) {
    redirected = null;
    assert.equal(Layout({ children: 'Protected form' }), null);
    assert.equal(redirected, '/doctor/departments');
  }
  for (pathname of ['/doctor/courses/add', '/doctor/courses/12', '/doctor/exams/create', '/doctor/discussions', '/doctor/chapters/5/edit', '/doctor/courses/12/lectures/create', '/doctor/courses/12/notes/create', '/doctor/content-manager', '/doctor/notes-summaries/add']) {
    redirected = null;
    assert.ok(Layout({ children: 'Allowed content' }));
    assert.equal(redirected, null);
  }
});

test('teacher edits course details and manages descendants while academic branches remain protected', () => {
  const { ColumnItem } = load('src/components/MillerColumns/ColumnItem.tsx');
  const { DetailPanel } = load('src/components/MillerColumns/DetailPanel.tsx', {
    '@/src/lib/preactivation-phones': { readPreactivationPhones: async () => [] },
    './ChapterPreview': { ChapterPreview: () => null }, './StudentSelector': { StudentSelector: () => null },
  });
  for (const type of ['university', 'center', 'faculty', 'department', 'course', 'lecture', 'chapter', 'note']) {
    const item = { type, id: '1', name: 'Course', children: [], data: { id: '1', attributes: {} }, meta: {}, stats: {} };
    const actions = { onEdit() { throw new Error('Cannot edit'); }, onDelete() { throw new Error('Cannot delete'); }, onAdd() { throw new Error('Cannot create'); }, onCopyMove() { throw new Error('Cannot copy'); } };
    const markup = renderToStaticMarkup(React.createElement(ColumnItem, { item, isInstructor: true, searchQuery: '', ...actions }));
    const editable = ['course', 'lecture', 'chapter', 'note'].includes(type);
    assert.equal(markup.includes('title="Edit"'), editable, type);
    assert.equal(markup.includes('title="Delete"'), ['lecture', 'chapter', 'note'].includes(type), type);
    assert.equal(markup.includes('title="Copy"'), type === 'chapter', type);
    const panel = DetailPanel({ node: item, isInstructor: true, canUseActivations: false, ...actions });
    const buttons = elements(panel).filter(node => node.type === 'button');
    const actionText = buttons.map(node => React.Children.toArray(node.props.children).filter(child => typeof child === 'string').join(''));
    assert.equal(actionText.some(text => text.startsWith(i18n.useTranslations('courses.detailPanel')('edit'))), editable, type);
    assert.equal(actionText.includes(i18n.useTranslations('courses.detailPanel')('delete')), ['lecture', 'chapter', 'note'].includes(type), type);
  }
  const item = { type: 'course', id: '1', name: 'Course', children: [], data: { attributes: {} } };
  assert.match(renderToStaticMarkup(React.createElement(ColumnItem, { item, searchQuery: '', isInstructor: false })), /title="Edit"/);
});

test('teacher grid and list expose enrolled course counts and course submission', () => {
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
    assert.ok(markup.includes(i18n.useTranslations('doctorCourses')('createCourse')));
    assert.ok(!markup.includes('lucide-pencil'));
    assert.ok(!markup.includes('lucide-trash'));
  }
});

test('student community shows their pending notification target but hides other pending posts and replies', () => {
  const post = (id, user, status = 'draft', parent_id = null) => ({ id, attributes: { title: `Post ${id}`, content: 'Question', type: 'post', status, parent_id, user: { data: { id: user, attributes: { first_name: 'Student' } } } } });
  const { default: Feed } = load('components/student/community/StudentCommunityFeed.tsx', {
    react: { ...React, useEffect: () => {} },
    '@/components/student/community/StudentCommunityCreatePostModal': { __esModule: true, default: () => null },
    '@/components/student/community/StudentCommunityPostComments': { __esModule: true, default: ({ postId }) => React.createElement('span', null, `Replies for ${postId}`) },
    '@/src/lib/community-post-display': { communityPostRelativeTime: () => '', communityPostTypeBadgeClasses: () => '' },
    '@/src/lib/community-post-media': { pickPostImageUrl: () => null },
    '@/src/hooks/useComments': { useCreateComment: () => ({}) },
    '@/src/hooks/usePosts': { usePosts: () => ({}), useCreatePost: () => ({}), useReactToPost: () => ({}) },
    '@/src/hooks/useCourses': { useCourses: () => ({ data: [] }) },
    '@/src/stores/authStore': { useAuth: () => ({ user: { id: '7' } }) },
  });
  const markup = renderToStaticMarkup(React.createElement(Feed, { postsFromCourse: [post('100', '7'), post('101', '8'), post('102', '7', 'published', 100), post('103', '8', 'published')] }));
  assert.match(markup, /id="post-100"/);
  assert.match(markup, /Replies for 100/);
  assert.match(markup, /قيد الانتظار/);
  assert.match(markup, /id="post-103"/);
  assert.ok(!markup.includes('id="post-101"'));
  assert.ok(!markup.includes('id="post-102"'));
});

test('student community renders replies of every accepted post type only for their parent', () => {
  const reply = (id, type, parent_id) => ({ id, attributes: { type, parent_id, content: `Reply ${id}` } });
  const { default: Comments } = load('components/student/community/StudentCommunityPostComments.tsx', {
    react: { ...React, useState: value => [value === false ? true : value, () => {}] },
    '@/src/hooks/useComments': { useComments: () => ({ data: [reply(1, 'post', 104), reply(2, 'question', 104), reply(3, 'summary', 104), reply(4, 'post', 105), reply(5, 'post', null)] }), useDeleteComment: () => ({}) },
    '@/src/hooks/usePosts': { useReactToPost: () => ({}) },
    '@/src/stores/authStore': { useAuth: () => ({ user: null }) },
  });
  const markup = renderToStaticMarkup(React.createElement(Comments, { postId: 104, commentsCount: 3 }));
  for (const id of [1, 2, 3]) assert.ok(markup.includes(`Reply ${id}`));
  for (const id of [4, 5]) assert.ok(!markup.includes(`Reply ${id}`));
});

test('teacher course editor hides management fields and submits only the allowed details', () => {
  const file = readFileSync(resolve(root, 'app/(doctor)/doctor/departments/page.tsx'), 'utf8');
  const source = `import React, { useState, useRef } from 'react';
    import { useTranslations } from 'next-intl';
    import { X, Upload, ChevronDown, Loader2 } from 'lucide-react';
    const toLocalDateTime = () => '';
    ${file.slice(file.indexOf('function EditModal('), file.indexOf('// Add Modal Component'))}
    export default EditModal;`;
  const { default: Editor } = load('editor.tsx', {
    react: { ...React, useState: value => [typeof value === 'function' ? value() : value, () => {}], useRef: () => ({ current: null }) },
  }, source);
  let submitted;
  const tree = Editor({ node: { type: 'course', data: { attributes: { title: 'Accounting', price: 50, status: 1, show_in: 'app' } } }, isInstructor: true, onClose() {}, onSubmit: data => { submitted = data; } });
  const markup = renderToStaticMarkup(tree);
  for (const field of ['Title', 'Subtitle', 'Description', 'Objectives', 'Thumbnail', 'Status']) assert.ok(markup.includes(field), field);
  for (const field of ['Instructor', 'Price', 'Max Views', 'Show In', 'Schedule Start']) assert.ok(!markup.includes(field), field);
  elements(tree).find(node => node.type === 'form').props.onSubmit({ preventDefault() {} });
  assert.deepEqual(Object.keys(submitted).sort(), ['title', 'sub_title', 'description', 'objectives', 'thumbnail', 'status'].sort());
});

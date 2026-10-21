/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS test harness. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const ts = require('typescript');
const root = resolve(__dirname, '../..');
const roleKeys = { Student: 'student', Instructor: 'instructor', Admin: 'admin', 'Super Admin': 'owner' };
const compile = source => ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
}).outputText;
function load(path, mocks = {}) {
  const loaded = { exports: {} };
  new Function('require', 'module', 'exports', compile(readFileSync(resolve(root, path), 'utf8')))(
    name => mocks[name] || require(name), loaded, loaded.exports);
  return loaded.exports;
}
function translations(locale) {
  const messages = JSON.parse(readFileSync(resolve(root, `messages/${locale}.json`), 'utf8'));
  return { messages, useLocale: () => locale, useTranslations: (namespace = '') => key => {
    const value = `${namespace}.${key}`.replace(/^\./, '').split('.').reduce((obj, part) => obj?.[part], messages);
    return typeof value === 'string' ? value : key;
  } };
}
function authors() {
  return Object.keys(roleKeys).map((role, i) => ({ id: String(i + 1), attributes: {
    content: `Message ${i}`, title: `Post ${i}`, type: 'post', status: 'published', parent_id: 90,
    created_at: '2026-10-21T15:24:00Z', comments_count: 0,
    user: { data: { id: String(i + 10), attributes: { full_name: 'دكتور فلان', first_name: 'دكتور', role } } },
  } }));
}
function assertRoles(html, labels) {
  for (const key of Object.values(roleKeys)) assert.ok(html.includes(`>${labels[key]}</span>`), `Missing author role ${labels[key]}`);
}
function loadDiscussionNode(AuthorRoleBadge) {
  const source = readFileSync(resolve(root, 'components/student/ChapterWatchView.tsx'), 'utf8');
  const ast = ts.createSourceFile('view.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const functions = ast.statements.filter(node => ts.isFunctionDeclaration(node)
    && ['DiscussionNode', 'formatDiscussionTime', 'formatMomentSeconds'].includes(node.name?.text)).map(node => node.getText(ast));
  const loaded = { exports: {} };
  const bindings = { ...require('lucide-react'), ...load('components/student/watch/watchChapterDiscussionUtils.ts'),
    useState: () => [true, () => {}], AuthorRoleBadge, API_BASE_URL: 'https://api.example.test' };
  new Function('require', 'module', 'exports', ...Object.keys(bindings), compile(`${functions.join('\n')}\nmodule.exports = DiscussionNode;`))(
    require, loaded, loaded.exports, ...Object.values(bindings));
  return loaded.exports;
}

for (const locale of ['ar', 'en']) {
  const intl = translations(locale);
  const { AuthorRoleBadge } = load('components/student/AuthorRoleBadge.tsx', { 'next-intl': intl });
  test(`${locale} exact account roles have distinct labels in both themes; unknown roles receive no badge`, () => {
    for (const dark of [false, true]) {
      for (const [role, key] of Object.entries({ ...roleKeys, Support: 'support', Parent: 'parent' })) {
        const html = renderToStaticMarkup(React.createElement(AuthorRoleBadge, { role, dark }));
        assert.ok(html.includes(`>${intl.messages.common.authorRoles[key]}</span>`));
      }
    }
    for (const role of [undefined, '', 'Doctor', 'Fake Instructor', 'constructor']) {
      assert.equal(renderToStaticMarkup(React.createElement(AuthorRoleBadge, { role })), '');
    }
  });

  test(`${locale} lesson discussions and their replies display the actual role without changing type or media`, () => {
    const DiscussionNode = loadDiscussionNode(AuthorRoleBadge);
    const replyItems = authors().map((item, i) => ({ ...item, attributes: { ...item.attributes, parent_id: 99,
      type: i === 1 ? 'voice' : 'text', image: i === 0 ? '/screenshot.png' : null } }));
    const discussion = { id: '99', attributes: { type: 'text', content: 'Question', moment: 4415, user: authors()[0].attributes.user }, replies: replyItems };
    const html = renderToStaticMarkup(React.createElement(DiscussionNode, { discussion, locale,
      t: intl.useTranslations('courses.watch'), replyToId: null, setReplyToId() {}, replyText: '', setReplyText() {},
      replySubmitting: false, onSubmitReply() {}, onPreviewImage() {} }));
    assertRoles(html, intl.messages.common.authorRoles);
    assert.match(html, /73:35/); assert.match(html, /<audio/); assert.match(html, /screenshot.png/);
    assert.match(html, /discussion-99/); assert.match(html, /دكتور فلان/);
  });

  test(`${locale} post comments distinguish students, teachers, Admin and Owner and retain reactions`, () => {
    let cursor = 0;
    const Comments = load('components/student/community/StudentCommunityPostComments.tsx', {
      react: { ...React, useState: initial => [cursor++ === 0 ? true : initial, () => {}] },
      'next-intl': intl, '@/components/student/AuthorRoleBadge': { AuthorRoleBadge },
      '@/src/hooks/useComments': { useComments: () => ({ data: authors(), refetch() {} }), useDeleteComment: () => ({}) },
      '@/src/hooks/usePosts': { useReactToPost: () => ({}) }, '@/src/stores/authStore': { useAuth: () => ({ user: { id: 'viewer' } }) },
    }).default;
    const html = renderToStaticMarkup(React.createElement(Comments, { postId: 90, commentsCount: 4 }));
    assertRoles(html, intl.messages.common.authorRoles);
    assert.equal((html.match(/Message [0-3]/g) || []).length, 4);
    assert.equal((html.match(/<button/g) || []).length, 5);
    cursor = 0;
    const readOnly = renderToStaticMarkup(React.createElement(Comments, { postId: 90, commentsCount: 4, readOnly: true }));
    assertRoles(readOnly, intl.messages.common.authorRoles);
    assert.equal((readOnly.match(/<button/g) || []).length, 1);
  });

  test(`${locale} student home post previews use the same author roles beside author names`, () => {
    const Latest = load('src/components/student/home/LatestPostsSection.tsx', {
      'next-intl': intl, 'next/link': ({ children, ...props }) => React.createElement('a', props, children),
      '@/components/student/AuthorRoleBadge': { AuthorRoleBadge },
    }).default;
    for (const post of authors()) {
      const html = renderToStaticMarkup(React.createElement(Latest, { posts: [post] }));
      assert.ok(html.includes(`>${intl.messages.common.authorRoles[roleKeys[post.attributes.user.data.attributes.role]]}</span>`));
      assert.match(html, /دكتور فلان/);
    }
  });

  test(`${locale} course and main community feeds show localized roles for all post authors`, () => {
    const Feed = load('components/student/community/StudentCommunityFeed.tsx', {
      react: { ...React, useState: initial => [initial, () => {}], useMemo: fn => fn(), useCallback: fn => fn, useEffect() {} },
      'next-intl': intl, '@/components/student/AuthorRoleBadge': { AuthorRoleBadge },
      '@/components/student/community/StudentCommunityCreatePostModal': () => null,
      '@/components/student/community/StudentCommunityPostComments': () => null,
      '@/src/lib/community-post-display': { communityPostRelativeTime: () => 'Today', communityPostTypeBadgeClasses: () => '' },
      '@/src/lib/community-post-media': { pickPostImageUrl: () => null },
      '@/src/hooks/useComments': { useCreateComment: () => ({}) },
      '@/src/hooks/usePosts': { usePosts: () => ({ data: [] }), useCreatePost: () => ({}), useReactToPost: () => ({}) },
      '@/src/hooks/useCourses': { useCourses: () => ({ data: [] }) },
      '@/src/stores/authStore': { useAuth: () => ({ user: { id: 'viewer' } }) },
    }).default;
    const posts = authors().map(post => ({ ...post, attributes: { ...post.attributes, parent_id: null } }));
    for (const courseId of [undefined, 10]) {
      const html = renderToStaticMarkup(React.createElement(Feed, { postsFromCourse: posts, courseId, readOnly: true }));
      assertRoles(html, intl.messages.common.authorRoles);
      assert.equal((html.match(/دكتور فلان/g) || []).length, 4);
    }
  });
}

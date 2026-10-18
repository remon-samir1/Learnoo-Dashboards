const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const ts = require('typescript');
const root = resolve(__dirname, '..');

function load(file, mocks) {
  const module = { exports: {} };
  const code = ts.transpileModule(readFileSync(resolve(root, file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  new Function('require', 'module', 'exports', code)(id => mocks[id] || require(id), module, module.exports);
  return module.exports;
}

function elements(node) {
  return !node || typeof node !== 'object' ? [] : [node, ...React.Children.toArray(node.props?.children).flatMap(elements)];
}

function setup(role, locale = 'ar', approval = 0, fail = false) {
  let cursor = 0, refreshed = 0;
  const states = [], requests = [];
  const messages = require(resolve(root, `messages/${locale}.json`));
  const mocks = {
    react: { ...React, useState: initial => { const i = cursor++; if (!(i in states)) states[i] = initial; return [states[i], value => { states[i] = value; }]; } },
    'next-intl': { useTranslations: namespace => key => `${namespace}.${key}`.split('.').reduce((value, part) => value[part], messages) },
    '@/src/hooks/useAuth': { useCurrentUser: () => ({ role }) },
    '@/src/lib/api': { coursesApi: { review: async (...args) => { requests.push(args); if (fail) throw new Error('Review request failed'); } } },
  };
  const { default: Panel } = load('components/CourseApprovalPanel.tsx', mocks);
  const course = { id: '41', attributes: { approval, reason: approval === 2 ? 'Add an introduction' : null } };
  return { messages, requests, refreshed: () => refreshed, render: () => { cursor = 0; return Panel({ course, onReviewed: () => { refreshed++; } }); } };
}

for (const role of ['Admin', 'Super Admin']) {
  for (const locale of ['ar', 'en']) {
    test(`${role} can approve and decline from the ${locale} course review panel`, async () => {
      const s = setup(role, locale);
      let tree = s.render();
      const buttons = elements(tree).filter(node => node.type === 'button');
      assert.equal(buttons.length, 3);
      await buttons[0].props.onClick();
      assert.deepEqual(s.requests[0], [41, 1, undefined]);
      assert.equal(s.refreshed(), 1);
      elements(tree).find(node => node.type === 'textarea').props.onChange({ target: { value: 'Fix lesson title' } });
      tree = s.render();
      await elements(tree).find(node => node.type === 'button' && node.props.children === s.messages.courses.review.reject).props.onClick();
      assert.deepEqual(s.requests[1], [41, 2, 'Fix lesson title']);
      assert.equal(s.refreshed(), 2);
      assert.match(renderToStaticMarkup(s.render()), locale === 'ar' ? /مخفي عن الطلاب/ : /Hidden from students/);
    });
  }
}

for (const role of ['Instructor', 'Support', 'Student']) {
  test(`${role} sees the review status and rejection reason without review controls`, () => {
    const s = setup(role, 'en', 2);
    const markup = renderToStaticMarkup(s.render());
    assert.match(markup, /Declined/);
    assert.match(markup, /Add an introduction/);
    assert.ok(!markup.includes('<button'));
    assert.ok(!markup.includes('<textarea'));
  });
}

test('a failed review stays on the page and shows the API error without pretending it saved', async () => {
  const s = setup('Admin', 'en', 0, true);
  await elements(s.render()).find(node => node.type === 'button').props.onClick();
  assert.equal(s.refreshed(), 0);
  assert.match(renderToStaticMarkup(s.render()), /role="alert"[^>]*>Review request failed/);
});

test('approval action sends the actual PATCH JSON request and keeps notification PATCH callers working', async (t) => {
  const requests = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => { requests.push({ url, ...options }); return Response.json({ data: {} }); });
  const { coursesApi, notificationsApi } = load('src/lib/api.ts', {
    'js-cookie': { get: () => 'test-token' }, './device-id': { getDeviceId: () => 'test-browser-device' },
  });
  await coursesApi.review(41, 2, 'Missing lesson');
  assert.equal(requests[0].method, 'PATCH');
  assert.ok(requests[0].url.endsWith('/v1/course/41/approval'));
  assert.deepEqual(JSON.parse(requests[0].body), { approval: 2, reason: 'Missing lesson' });
  await notificationsApi.readAll();
  assert.equal(requests[1].method, 'PATCH');
  assert.equal(requests[1].body, undefined);
});

for (const automatic of [false, true]) test(`instructor form follows publishing permission ${automatic} without submitting privileged fields`, async () => {
  const states = [], requests = [], redirects = [];
  let cursor = 0;
  const messages = require(resolve(root, 'messages/en.json'));
  const { default: Form } = load('app/(doctor)/doctor/courses/add/page.tsx', {
    react: { ...React, useState: initial => { const i = cursor++; if (!(i in states)) states[i] = initial; return [states[i], value => { states[i] = value; }]; } },
    'next-intl': { useTranslations: namespace => key => `${namespace}.${key}`.split('.').reduce((value, part) => value[part], messages) },
    'next/navigation': { useRouter: () => ({ push: value => redirects.push(value) }) },
    'next/link': { __esModule: true, default: props => React.createElement('a', props) },
    '@/src/hooks/useDepartments': { useDepartments: () => ({ data: [{ id: '4', attributes: { name: 'Assigned department' } }] }) },
    '@/src/hooks/useAuth': { useCurrentUser: () => ({ user: { attributes: { can_publish_without_approval: automatic } } }) },
    '@/src/hooks/useCourses': { useCreateCourse: () => ({ mutate: async data => { requests.push(data); } }) },
  });
  const render = () => { cursor = 0; return Form(); };
  let tree = render();
  assert.match(renderToStaticMarkup(tree), new RegExp(automatic ? messages.courses.review.publish : messages.courses.review.submit));
  elements(tree).find(node => node.type === 'input' && node.props.maxLength === 255).props.onChange({ target: { value: 'New accounting course' } });
  elements(tree).find(node => node.type === 'select').props.onChange({ target: { value: '4' } });
  elements(tree).find(node => node.type === 'input' && node.props.type === 'file').props.onChange({ target: { files: [new File(['photo'], 'course.png', { type: 'image/png' })] } });
  tree = render();
  tree.props.onSubmit({ preventDefault() {} });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(requests.length, 1);
  assert.equal(requests[0].category_id, 4);
  assert.equal(requests[0].status, 1);
  for (const key of ['approval', 'instructor_id', 'price']) assert.ok(!(key in requests[0]));
  assert.deepEqual(redirects, ['/doctor/courses']);
});

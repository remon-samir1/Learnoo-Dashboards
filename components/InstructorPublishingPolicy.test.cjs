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

for (const locale of ['ar', 'en']) for (const automatic of [false, true]) {
  test(`publishing policy ${locale} selects ${automatic} and exposes two labelled radio choices`, () => {
    const messages = require(resolve(root, `messages/${locale}.json`)).instructors.publishing;
    const changes = [];
    const { default: Policy } = load('components/InstructorPublishingPolicy.tsx', {
      'next-intl': { useTranslations: () => key => messages[key] },
    });
    const tree = Policy({ value: automatic, onChange: value => changes.push(value) });
    const radios = elements(tree).filter(node => node.type === 'input');
    assert.equal(radios.length, 2);
    assert.equal(radios.filter(node => node.props.checked).length, 1);
    assert.equal(radios[automatic ? 1 : 0].props.checked, true);
    radios[0].props.onChange();
    radios[1].props.onChange();
    assert.deepEqual(changes, [false, true]);
    const html = renderToStaticMarkup(tree);
    assert.ok(html.includes(messages.title));
    assert.ok(html.includes(messages.existingCourses));
    assert.ok(html.includes('<legend'));
    assert.ok(renderToStaticMarkup(Policy({ value: automatic, onChange() {}, disabled: true })).includes('disabled'));
  });
}

test('instructor create and update requests retain both true and false publishing permission values', async t => {
  const requests = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    requests.push({ url, ...options });
    return Response.json({ data: {} });
  });
  const { instructorsApi } = load('src/lib/api.ts', {
    'js-cookie': { get: () => 'test-token' }, './device-id': { getDeviceId: () => 'test-device' },
  });
  await instructorsApi.create({ first_name: 'Test', last_name: 'Instructor', email: 'test@example.test', can_publish_without_approval: true });
  await instructorsApi.update('teacher-id', { can_publish_without_approval: false });
  assert.equal(requests[0].body.get('can_publish_without_approval'), '1');
  assert.equal(requests[0].body.get('role'), '1');
  assert.equal(requests[1].body.get('can_publish_without_approval'), '0');
  assert.ok(requests[1].url.endsWith('/v1/student/teacher-id'));
});

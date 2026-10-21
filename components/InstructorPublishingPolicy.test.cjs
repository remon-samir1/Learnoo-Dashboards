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

for (const role of ['Admin', 'Super Admin']) for (const automatic of [false, true]) {
  test(`${role} instructor forms and list respect publishing policy ownership (${automatic})`, async () => {
    const requests = [];
    const teacher = { id: 'teacher-id', attributes: { first_name: 'Teacher', last_name: 'Test', email: 'teacher@example.test',
      status: 1, can_publish_without_approval: automatic } };
    const Policy = () => React.createElement('fieldset', { 'data-publishing-policy': true });
    const mutation = { mutate: async (...args) => requests.push(args), isLoading: false };
    const mocks = {
      react: { ...React, useEffect() {}, useMemo: fn => fn(), useState: initial => [initial && typeof initial === 'object' && 'first_name' in initial
        ? { ...initial, ...teacher.attributes, password: 'password123', confirmPassword: 'password123' } : initial, () => {}] },
      'next-intl': { useTranslations: namespace => key => namespace ? `${namespace}.${key}` : key },
      'next/navigation': { useRouter: () => ({ push() {} }), useParams: () => ({ id: teacher.id }) },
      'next/link': { __esModule: true, default: props => React.createElement('a', props) },
      '@/src/hooks/useAuth': { useCurrentUser: () => ({ role }) },
      '@/src/hooks': { useCreateInstructor: () => mutation, useUpdateInstructor: () => mutation,
        useInstructor: () => ({ data: { data: teacher }, isLoading: false }) },
      '@/components/FileUpload': { FileUpload: () => null },
      '@/components/InstructorPublishingPolicy': { __esModule: true, default: Policy },
      '@/src/types': { StudentStatusLabels: { 1: 'Active' } },
      '@/src/components/ui/Skeleton': { TableSkeleton: () => null },
      '@/src/hooks/useInstructors': { useInstructors: () => ({ data: { data: [teacher], meta: { current_page: 1, last_page: 1 } } }),
        useDeleteInstructor: () => mutation, useResetInstructorPassword: () => mutation, useToggleCanUseActivations: () => mutation },
    };
    for (const file of ['app/(admin)/instructors/add/page.tsx', 'app/(admin)/instructors/[id]/edit/page.tsx']) {
      const { default: Page } = load(file, mocks);
      const tree = Page();
      assert.equal(elements(tree).some(node => node.type === Policy), role === 'Super Admin');
      await elements(tree).find(node => node.type === 'form').props.onSubmit({ preventDefault() {} });
      assert.equal(requests.at(-1).at(-1).can_publish_without_approval, role === 'Super Admin' ? automatic : undefined);
    }
    const { default: List } = load('app/(admin)/instructors/page.tsx', mocks);
    assert.equal(renderToStaticMarkup(List()).includes('instructors.publishing.title'), role === 'Super Admin');
  });
}

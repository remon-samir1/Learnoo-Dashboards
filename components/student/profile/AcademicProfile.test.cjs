const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync, existsSync } = require('node:fs');
const { resolve } = require('node:path');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const ts = require('typescript');
const root = resolve(__dirname, '../../..');

function load(file, mocks = {}) {
  const module = { exports: {} };
  const compiled = ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  new Function('require', 'module', 'exports', compiled)(id => {
    if (id in mocks) return mocks[id];
    if (id.startsWith('@/') || id.startsWith('.')) {
      const path = id.startsWith('@/') ? resolve(root, id.slice(2)) : resolve(file, '..', id);
      return load(path + (existsSync(path + '.tsx') ? '.tsx' : '.ts'), mocks);
    }
    return require(id);
  }, module, module.exports);
  return module.exports;
}

function translations(locale) {
  const messages = require(resolve(root, `messages/${locale}.json`));
  return { useLocale: () => locale, useTranslations: namespace => key =>
    `${namespace}.${key}`.split('.').reduce((value, part) => value[part], messages) };
}

test('the university, center and faculty labels match filtered API options in Arabic and English', () => {
  for (const locale of ['ar', 'en']) {
    const universities = [{ id: '1', attributes: { name: 'Capital' } }];
    const faculties = [
      { id: '3', attributes: { name: 'Commerce', parent_id: 2, parent: { data: { id: '2', attributes: { name: 'MOGA', parent_id: 1 } } }, childrens: [] } },
      { id: '5', attributes: { name: 'Engineering', parent_id: 4, parent: { data: { id: '4', attributes: { name: 'Other center', parent_id: 9 } } }, childrens: [] } },
    ];
    const state = [universities, faculties, false, false, '', {}, null];
    let index = 0;
    const { default: Fields } = load(resolve(__dirname, 'UniversityFacultyFields.tsx'), {
      react: { ...React, useState: () => [state[index++], () => {}], useEffect: () => {}, useMemo: fn => fn(), useRef: value => ({ current: value }) },
      'next-intl': translations(locale), '@/src/lib/api': {},
    });
    const changes = [];
    const tree = Fields({ universityId: '1', centerId: '2', facultyId: '3',
      onUniversityChange: value => changes.push(['university', value]),
      onCenterChange: value => changes.push(['center', value]),
      onFacultyChange: value => changes.push(['faculty', value]),
    });
    const html = renderToStaticMarkup(tree);
    const labels = require(resolve(root, `messages/${locale}.json`)).studentProfile.academic;
    assert.ok(html.indexOf(labels.university) < html.indexOf(labels.center));
    assert.ok(html.indexOf(labels.center) < html.indexOf(labels.faculty));
    assert.match(html, /value="2" selected="">MOGA/);
    assert.match(html, /value="3" selected="">Commerce/);
    assert.doesNotMatch(html, /Other center|Engineering/);
    const universityField = React.Children.toArray(tree.props.children).find(child => child.props?.children?.some?.(node => node?.type === 'select' && node.props.value === '1'));
    const select = universityField.props.children.find(node => node?.type === 'select');
    select.props.onChange({ target: { value: '9' } });
    assert.deepEqual(changes, [['university', '9'], ['center', ''], ['faculty', '']]);
  }
});

test('profile completion saves the original API IDs, synchronizes the user without unmounting and loads a fresh dashboard', async () => {
  const events = [];
  const user = { id: 'student', attributes: { university_id: 1, faculty_id: 3, centers: ['2'] } };
  const { default: Form } = load(resolve(__dirname, 'CompleteProfileForm.tsx'), {
    react: { ...React, useState: value => [value, () => {}] },
    'next-intl': translations('ar'),
    '@/components/student/profile/UniversityFacultyFields': () => null,
    '@/components/ui/LoadingOverlay': () => null,
    '@/src/lib/api': { authApi: {
      update: async payload => { events.push(['save', payload]); },
      me: async () => ({ data: user }),
    } },
    '@/src/stores/authStore': { useAuthActions: () => ({ updateUser: value => events.push(['user', value]), fetchCurrentUser: () => { throw Error('Must not unmount the saving form'); } }) },
    sonner: { toast: { success: () => {}, error: error => { throw Error(error); } } },
  });
  const tree = Form({ defaultUniversityId: '1', defaultCenterId: '2', defaultFacultyId: '3', firstName: 'Test', lastName: 'Student' });
  const form = React.Children.toArray(tree.props.children).find(child => child.type === 'form');
  const previousWindow = global.window;
  global.window = { location: { replace: href => events.push(['navigate', href]) } };
  try { await form.props.onSubmit({ preventDefault() {} }); }
  finally { global.window = previousWindow; }
  assert.equal(events[0][1].university_id, '1');
  assert.equal(events[0][1].center_id, '2');
  assert.equal(events[0][1].faculty_id, '3');
  assert.deepEqual(events[0][1].centers, ['2']);
  assert.deepEqual(events.slice(1), [['user', user], ['navigate', '/ar/student']]);
});

test('an Admin can see and load device approvals without loading Owner staff activity', async () => {
  const { getRouteZone, roleCanAccessZone } = load(resolve(root, 'src/lib/auth-routes.ts'), {
    '@/src/lib/proxy-auth': {},
  });
  assert.equal(getRouteZone('/activity'), 'admin');
  assert.equal(roleCanAccessZone('Admin', 'admin'), true);
  assert.equal(roleCanAccessZone('Student', 'admin'), false);
  const state = [[], [{ id: 'student', first_name: 'Test', last_name: 'Student', phone: '01000000000', current_device: null, requested_device: null }], 1, '', '', 1, false, null];
  let index = 0;
  const effects = [];
  const calls = [];
  const { default: Page } = load(resolve(root, 'app/(admin)/activity/page.tsx'), {
    react: { ...React, useState: () => [state[index++], () => {}], useEffect: fn => effects.push(fn) },
    'next-intl': translations('en'),
    '@/src/hooks/useAuth': { useCurrentUser: () => ({ role: 'Admin' }) },
    '@/src/lib/api': { __esModule: true, default: { ownerOperations: {
      devices: async () => { calls.push('devices'); return { data: [] }; },
      activity: () => { throw Error('Owner activity must stay private'); },
    } } },
  });
  const html = renderToStaticMarkup(React.createElement(Page));
  assert.match(html, /Device approvals|Approve new device/);
  assert.doesNotMatch(html, /Activity over the past 90 days|Staff activity and device approvals/);
  const previousWindow = global.window;
  global.window = { setInterval: () => 1, clearInterval: () => {} };
  try {
    const cleanups = effects.map(fn => fn());
    await Promise.resolve();
    cleanups.forEach(fn => fn?.());
  } finally { global.window = previousWindow; }
  assert.deepEqual(calls, ['devices']);
});

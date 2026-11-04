const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const ts = require('typescript');
const component = { exports: {} };
new Function('require', 'module', 'exports', ts.transpileModule(readFileSync(`${__dirname}/DetailPanel.tsx`, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
}).outputText)(name => name === 'next-intl' ? { useTranslations: () => key => key, useLocale: () => 'ar' }
  : name === '@/src/lib/preactivation-phones' ? { readPreactivationPhones: async file => (await file.text()).split('\n') }
  : name === './ChapterPreview' ? { ChapterPreview: () => null }
  : name === './StudentSelector' ? { StudentSelector: () => null } : require(name), component, component.exports);

test('course count opens its subscriber list and a hidden count has no action', () => {
  const node = { type: 'course', name: 'Course', data: { id: '12', attributes: {} }, stats: { students: 31 } };
  let clicked;
  const props = { node, openViewers: value => { clicked = value; }, canUseActivations: false, isOwner: true };
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
  assert.equal(buttons(component.exports.DetailPanel({ ...props, isOwner: false })).length, 0);
});

test('AcademicTree keeps subscriptions and view details Owner-only', () => {
  const { renderToStaticMarkup } = require('react-dom/server');
  const props = { canUseActivations: true, activationTab: 'code', getCodesForItem: () => [],
    selectedCode: '', selectedStudent: '', preactivationNumbers: [], isOwner: true,
    node: { type: 'course', name: 'Course', data: { id: '12', attributes: { max_views_per_student: 19 } }, stats: { students: 31, lectures: 4 } } };
  const html = renderToStaticMarkup(component.exports.DetailPanel(props));
  assert.match(html, /maxViews/); assert.match(html, /activateStudent/); assert.match(html, /availableCodes/);
  for (const isInstructor of [false, true]) {
    const hidden = renderToStaticMarkup(component.exports.DetailPanel({ ...props, isOwner: false, isInstructor }));
    assert.doesNotMatch(hidden, /maxViews|View subscribers|عرض الطلاب المشتركين/);
    if (isInstructor) assert.doesNotMatch(hidden, /availableCodes|activateStudent/);
    assert.match(hidden, /lectures/);
    const chapter = renderToStaticMarkup(component.exports.DetailPanel({ ...props, isOwner: false, isInstructor,
      node: { type: 'chapter', name: 'Lesson', data: { id: '13', attributes: {} } } }));
    assert.doesNotMatch(chapter, /viewers|availableCodes|activateStudent/);
  }
});


function elements(node) {
  if (!node || typeof node !== 'object') return [];
  return [node, ...[].concat(node.props?.children || []).flatMap(elements)];
}

test('course review link is hidden for Admin and retained for Owner and Instructor', () => {
  const props = { node: { type: 'course', name: 'Course', data: { id: '12', attributes: {} } }, canUseActivations: false };
  const reviewLink = roles => elements(component.exports.DetailPanel({ ...props, ...roles }))
    .find(node => node.type === 'a' && node.props.href.endsWith('#course-review'));
  assert.equal(reviewLink({ isAdmin: true, isOwner: false, isInstructor: false }), undefined);
  assert.equal(reviewLink({ isAdmin: false, isOwner: true, isInstructor: false }).props.href, '/courses/12#course-review');
  assert.equal(reviewLink({ isAdmin: false, isOwner: false, isInstructor: true }).props.href, '/doctor/courses/12#course-review');
});

for (const type of ['course', 'chapter']) test(`Admin can activate a ${type} by code or phone list when permitted`, async () => {
  const { renderToStaticMarkup } = require('react-dom/server');
  const events = [];
  const props = { node: { type, name: 'Content', data: { id: '12', attributes: { max_views_per_student: 19 } }, stats: { students: 31 } },
    isOwner: false, isAdmin: true, isInstructor: false, canUseActivations: true, activationTab: 'code',
    isActivating: false, isUploadingPreActivation: false,
    selectedCode: 'code-1', selectedStudent: 'student-1', preactivationNumbers: ['01010000001'],
    getCodesForItem: () => [{ id: 'code-1', attributes: { code: 'TEST-CODE', is_used: false } }],
    onGenerateCodes: (...args) => events.push(['generate', ...args]),
    handleActivate: (...args) => events.push(['activate', ...args]),
    handlePreactivationUpload: (...args) => events.push(['upload', ...args]),
    setActivationTab: value => events.push(['tab', value]),
  };
  const tree = component.exports.DetailPanel(props);
  const html = renderToStaticMarkup(tree);
  assert.match(html, type === 'course' ? /activateCourse/ : /activateLesson/);
  assert.match(html, /availableCodes/); assert.match(html, /TEST-CODE/);
  assert.doesNotMatch(html, /maxViews|View subscribers|عرض الطلاب المشتركين/);
  assert.equal(/>\s*viewers</.test(html), type === 'chapter');
  const ownerHtml = renderToStaticMarkup(component.exports.DetailPanel({ ...props, isOwner: true, isAdmin: false }));
  assert.match(ownerHtml, /availableCodes|activateStudent/);
  assert.match(ownerHtml, type === 'course' ? /maxViews/ : />\s*viewers</);
  const unselected = component.exports.DetailPanel({ ...props, selectedStudent: '' });
  assert.equal(elements(unselected).find(node => node.type === 'button' && node.props.children === 'activateStudent').props.disabled, true);
  const buttons = elements(tree).filter(node => node.type === 'button');
  buttons.find(node => node.props.title === 'generateCodes').props.onClick();
  const activate = buttons.find(node => node.props.children === 'activateStudent');
  assert.equal(activate.props.disabled, false); activate.props.onClick();
  buttons.find(node => node.props.children === 'preactivation').props.onClick();
  const phoneTree = component.exports.DetailPanel({ ...props, activationTab: 'preactivation' });
  const upload = elements(phoneTree).find(node => node.type === 'button' && node.props.children === 'uploadPreactivations');
  assert.equal(upload.props.disabled, false); upload.props.onClick();
  assert.deepEqual(events.slice(0, 3), [['generate', type, '12'], ['activate', 12, type], ['tab', 'preactivation']]);
  assert.deepEqual(events[3].slice(0, 3), ['upload', 12, type]);
  assert.equal(await events[3][3].text(), '01010000001');
  for (const state of [
    { isAdmin: true, canUseActivations: false },
    { isOwner: true, isAdmin: false, canUseActivations: false },
    { isAdmin: false, isInstructor: true },
    { isAdmin: false, isInstructor: false },
  ]) {
    const hidden = renderToStaticMarkup(component.exports.DetailPanel({ ...props, ...state }));
    assert.doesNotMatch(hidden, /activateCourse|activateLesson|availableCodes|activateStudent|generateCodes/);
  }
});


test('Admin lesson viewers opens only the selected lesson and course subscribers remain Owner-only', () => {
  let selected;
  for (const type of ['course', 'chapter']) {
    const node = { type, name: 'Selected', data: { id: '12', attributes: {} }, stats: { students: 31 } };
    const props = { node, isOwner: false, isAdmin: true, canUseActivations: false, openViewers: value => { selected = value; } };
    const viewers = elements(component.exports.DetailPanel(props)).find(node => node.type === 'button' && Array.isArray(node.props.children) && node.props.children.includes('viewers'));
    if (type === 'chapter') { assert.ok(viewers); viewers.props.onClick(); assert.equal(selected, node); }
    else assert.equal(viewers, undefined);
  }
});

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

test('sessions stay loading until profile and enrollment finish and ignore stale list responses', async () => {
  const state = [], effects = [], refs = [], requests = [];
  let hi = 0, ei = 0, ri = 0, coursesLoading = true, courses = null;
  const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
  const profile = deferred();
  const hooks = { ...React, useState: initial => { const i = hi++; if (!(i in state)) state[i] = initial; return [state[i], value => { state[i] = typeof value === 'function' ? value(state[i]) : value; }]; },
    useMemo: callback => callback(), useRef: initial => refs[ri++] ?? (refs[ri - 1] = { current: initial }),
    useEffect: (callback, deps) => { const i = ei++; if (!effects[i] || JSON.stringify(effects[i].deps) !== JSON.stringify(deps)) { effects[i]?.cleanup?.(); effects[i] = { callback, deps, pending: true }; } } };
  const mocks = { react: hooks, 'next-intl': { useLocale: () => 'en' }, 'next/link': ({ children }) => children,
    'js-cookie': { get: () => 'token' }, '@/src/lib/api': { API_BASE_URL: 'https://fixture.test' },
    '@/src/hooks/useCourses': { useCourses: () => ({ data: courses, isLoading: coursesLoading }) },
    '@/src/lib/student-course-lock': { courseIsLocked: () => false },
    '@/src/lib/student-faculty-tree': { extractFacultyTreeCourses: () => ({ allCourseIds: new Set(['1']), unlockedCourseIds: new Set(['1']) }), filterLiveRoomsByFacultyCourses: rooms => rooms, resolveLiveRoomAccessState: () => 'available' },
    '@/src/lib/student-live-room': { isLiveOrStarted: () => true, isUpcoming: () => false, isEnded: () => false, getCourseTitle: () => 'Course', getInstructorDisplayName: () => 'Teacher', getLiveRoomCourseIds: () => ['1'] },
    '@/src/services/student/live-room.service': { getStudentLiveRooms: () => { const req = deferred(); requests.push(req); return req.promise; } },
    '@/components/student/StudentCourseActivationModal': { StudentCourseActivationModal: () => null },
  };
  const loaded = { exports: {} };
  const compiled = ts.transpileModule(readFileSync(`${__dirname}/../../app/[locale]/student/live-sessions/page.tsx`, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  new Function('require', 'module', 'exports', 'fetch', compiled)(id => id in mocks ? mocks[id] : require(id), loaded, loaded.exports,
    () => profile.promise.then(() => ({ ok: true, json: async () => ({ data: [] }) })));
  const render = () => { hi = ei = ri = 0; const tree = loaded.exports.default(); effects.forEach(effect => { if (effect.pending) { effect.pending = false; effect.cleanup = effect.callback(); } }); return tree; };
  const settle = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };
  const html = () => renderToStaticMarkup(render());
  assert.match(html(), /Loading/); assert.equal(requests.length, 0);
  profile.resolve(); await settle(); assert.match(html(), /Loading/); assert.equal(requests.length, 0);
  coursesLoading = false; courses = []; render(); assert.equal(requests.length, 1);
  requests[0].resolve({ success: true, data: [{ id: '1', attributes: { title: 'Ready session' } }], meta: { last_page: 2 } }); await settle();
  assert.match(html(), /Ready session/);
  coursesLoading = true; assert.match(html(), /Ready session/); assert.doesNotMatch(html(), /Loading/);
  coursesLoading = false; render(); assert.equal(requests.length, 2);
  assert.match(html(), /Ready session/); assert.doesNotMatch(html(), /Loading/);
  requests[1].resolve({ success: true, data: [{ id: '1', attributes: { title: 'Ready session' } }] }); await settle();
  const modal = render().props.children.at(-1);
  modal.props.onActivated(); modal.props.onActivated(); assert.equal(requests.length, 4);
  requests[2].resolve({ success: true, data: [{ id: '2', attributes: { title: 'Stale session' } }] }); await settle();
  assert.match(html(), /Ready session/); assert.doesNotMatch(html(), /Loading|Stale session/);
  requests[3].resolve({ success: true, data: [{ id: '3', attributes: { title: 'Latest session' } }] }); await settle();
  assert.match(html(), /Latest session/); assert.doesNotMatch(html(), /Stale session/);
  render().props.children.at(-1).props.onActivated();
  requests[4].resolve({ success: false, message: 'Connection interrupted' }); await settle();
  assert.match(html(), /Latest session/); assert.match(html(), /Connection interrupted/);
  const elements = node => !node || typeof node !== 'object' ? [] : [node, ...React.Children.toArray(node.props?.children).flatMap(elements)];
  elements(render()).find(node => node.type === 'button' && React.Children.toArray(node.props.children).includes('Next')).props.onClick();
  assert.match(html(), /Loading/); assert.doesNotMatch(html(), /Latest session/);
  requests[5].resolve({ success: true, data: [{ id: '4', attributes: { title: 'Page two session' } }] }); await settle();
  assert.match(html(), /Page two session/); assert.doesNotMatch(html(), /Latest session/);
  effects.forEach(effect => effect.cleanup?.());
});

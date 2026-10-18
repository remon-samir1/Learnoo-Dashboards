const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const ts = require('typescript');
const { NextRequest } = require('next/server');

function load(path, mocks = {}) {
  const module = { exports: {} };
  new Function('require', 'module', 'exports', ts.transpileModule(readFileSync(resolve(__dirname, path), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText)(id => id in mocks ? mocks[id] : require(id), module, module.exports);
  return module.exports;
}

test('blocked login exposes the request action and only an explicit click submits the ticket', async (t) => {
  global.window = {};
  t.after(() => { delete global.window; });
  const api = load('api.ts', { 'js-cookie': { get: () => 'ar' }, './device-id': { getDeviceId: () => 'phone-test-device-id' } });
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    calls.push([url, options]);
    return calls.length === 1 ? Response.json({ message: 'Signed in on another device', code: 'device_transfer_required', transfer_token: 'request-only-ticket' }, { status: 422 }) : Response.json({ message: 'Request sent' });
  });
  await assert.rejects(api.authApi.login({ phone: '201012345678' }), error => {
    assert.equal(error.code, 'device_transfer_required');
    assert.equal(error.transferToken, 'request-only-ticket');
    return true;
  });
  assert.equal(calls.length, 1);
  await api.authApi.requestDeviceTransfer('request-only-ticket');
  assert.ok(calls[1][0].endsWith('/v1/auth/device-transfer'));
  assert.equal(JSON.parse(calls[1][1].body).transfer_token, 'request-only-ticket');
  assert.equal(calls[1][1].headers['X-Device-ID'], 'phone-test-device-id');
  assert.equal(calls[1][1].headers.Authorization, undefined);
});

test('revoked client sessions and HTML 401 responses redirect through cookie cleanup', async (t) => {
  const redirects = [];
  global.window = { location: { replace: url => redirects.push(url) } };
  t.after(() => { delete global.window; });
  const api = load('api.ts', { 'js-cookie': { get: key => key === 'token' ? 'old-token' : 'ar' }, './device-id': { getDeviceId: () => 'laptop-device-id' } });
  const responses = [Response.json({ code: 'device_session_revoked', message: 'Device changed' }, { status: 401 }), new Response('<!DOCTYPE html>', { status: 401 })];
  t.mock.method(globalThis, 'fetch', async () => responses.shift());
  await assert.rejects(api.authApi.me(), error => error.status === 401 && error.message === 'Device changed');
  await assert.rejects(api.authApi.me(), error => error.status === 401 && !error.message.includes('Unexpected token'));
  assert.deepEqual(redirects, ['/api/auth/session-end?reason=device-changed', '/api/auth/session-end?reason=expired']);
});

test('session cleanup redirects to login with the notice and preserves the device cookie', () => {
  const { GET } = load('../../app/api/auth/session-end/route.ts');
  const response = GET(new NextRequest('http://localhost:3000/api/auth/session-end?reason=device-changed', {
    headers: { cookie: 'token=old-token; user_role=Student; learnoo_device_id=laptop-device-id; locale=en' },
  }));
  assert.equal(response.status, 307);
  assert.equal(response.headers.get('location'), '/login?session=device-changed');
  assert.equal(response.cookies.get('token').value, '');
  assert.equal(response.cookies.get('user_role').value, '');
  assert.equal(response.cookies.get('user_data').value, '');
  assert.equal(response.cookies.get('learnoo_device_id'), undefined);
  assert.equal(response.cookies.get('locale'), undefined);
  assert.equal(response.headers.get('cache-control'), 'no-store');
});

test('inactive accounts keep their reason through server rendering and cookie cleanup', async (t) => {
  const { getCurrentUser } = load('../services/auth/me.service.ts', {
    '@/lib/server.utils': async () => ({ token: 'old-token' }), '@/src/lib/api': { API_BASE_URL: 'https://api.learnoo.app' },
  });
  t.mock.method(globalThis, 'fetch', async () => Response.json({ code: 'account_inactive' }, { status: 401 }));
  assert.equal((await getCurrentUser()).sessionReason, 'inactive');
  const { GET } = load('../../app/api/auth/session-end/route.ts');
  const response = GET(new NextRequest('http://localhost/api/auth/session-end?reason=inactive'));
  assert.equal(response.headers.get('location'), '/login?session=inactive');
  assert.equal(response.cookies.get('token').value, '');
});

test('an open student page checks access every five seconds and on focus without a logout click', () => {
  const effects = [];
  const listeners = {};
  let checked = 0;
  let interval;
  global.document = { visibilityState: 'visible', addEventListener: (name, fn) => { listeners[name] = fn; }, removeEventListener: () => {} };
  global.window = { setInterval: (fn, ms) => { interval = { fn, ms }; return 1; }, clearInterval: () => {}, addEventListener: (name, fn) => { listeners[name] = fn; }, removeEventListener: () => {} };
  try {
    const { default: ProtectedRoute } = load('../../components/ProtectedRoute.tsx', {
      react: { useEffect: effect => effects.push(effect) },
      'next/navigation': { useRouter: () => ({ replace: () => {} }) },
      '@/src/stores/authStore': { useAuth: () => ({ isInitialized: true, isAuthenticated: true, isLoading: false, user: { attributes: { role: 'Student' } } }) },
      '@/src/lib/profile-completeness': { isProfileComplete: () => true },
      '@/src/lib/api': { authApi: { me: () => { checked++; return Promise.resolve(); } } },
    });
    ProtectedRoute({ children: null });
    const cleanup = effects[0]();
    assert.equal(checked, 1);
    assert.equal(interval.ms, 5000);
    interval.fn();
    listeners.focus();
    assert.equal(checked, 3);
    cleanup();
  } finally {
    delete global.window;
    delete global.document;
  }
});

test('the student server layout redirects a revoked session instead of rendering the profile error', async (t) => {
  const { getCurrentUser } = load('../services/auth/me.service.ts', {
    '@/lib/server.utils': async () => ({ token: 'old-token' }), '@/src/lib/api': { API_BASE_URL: 'https://api.learnoo.app' },
  });
  t.mock.method(globalThis, 'fetch', async () => Response.json({ code: 'device_session_revoked' }, { status: 401 }));
  const userResponse = await getCurrentUser();
  assert.equal(userResponse.sessionReason, 'device-changed');
  const layout = load('../../app/[locale]/student/layout.tsx', {
    '@/components/student/StudentLayoutShell': () => null,
    '@/components/ProtectedRoute': () => null,
    '@/src/services/auth/me.service': { getCurrentUser: async () => userResponse },
    '@/src/services/student/user.service': { getStudentNotifications: async () => ({ success: false }), getUserProfileData: async () => ({ success: false, message: 'Unexpected token' }) },
    '@/src/lib/student-profile-completeness': { isStudentAcademicProfileComplete: () => { throw new Error('Should redirect first'); } },
    'next/navigation': { redirect: url => { throw new Error(url); } },
  });
  await assert.rejects(layout.default({ params: Promise.resolve({ locale: 'en' }), children: null }), { message: '/api/auth/session-end?reason=device-changed' });
});

test('an unavailable exam keeps its HTTP status and shows access guidance instead of a JSON parser error', async (t) => {
  const { getQuizById } = load('../services/student/quiz.service.ts', {
    '@/lib/server.utils': async () => ({ token: 'student-token' }), '@/src/lib/api': { API_BASE_URL: 'https://api.learnoo.app' },
  });
  const { isLikelyQuizAccessDeniedError } = load('student-start-exam-href.ts');
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, 'https://api.learnoo.app/v1/quiz/6');
    assert.equal(options.headers.Accept, 'application/json');
    assert.equal(options.cache, 'no-store');
    return new Response('<!DOCTYPE html>', { status: 404 });
  });
  const result = await getQuizById(6);
  assert.equal(result.httpStatus, 404);
  assert.equal(result.success, false);
  assert.equal(isLikelyQuizAccessDeniedError(result), true);
  assert.ok(!result.message.includes('Unexpected token'));
  const React = require('react');
  const { renderToStaticMarkup } = require('react-dom/server');
  const page = load('../../app/[locale]/student/exams/start-exam/[id]/page.tsx', {
    'next/link': props => React.createElement('a', props),
    'next-intl/server': { getTranslations: async () => key => key },
    '@/components/student/exams/StartExamIntro': () => null,
    '@/src/lib/student-quiz-activation-lock': {},
    '@/src/lib/student-start-exam-href': load('student-start-exam-href.ts'),
    '@/src/services/student/quiz.service': { getQuizById: async () => result },
    '@/src/services/student/course.service': { getCourses: async () => ({ success: true, data: { data: [{ id: '12' }] } }) },
  });
  const markup = renderToStaticMarkup(await page.default({ params: Promise.resolve({ locale: 'en', id: '6' }), searchParams: Promise.resolve({ course: '12' }) }));
  assert.ok(markup.includes('/en/student/courses/course-details/12?tab=exams'));
  assert.ok(markup.includes('examAccessDeniedTitle'));
  assert.ok(!markup.includes('Unexpected token'));
});

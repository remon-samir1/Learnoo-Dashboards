const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const ts = require('typescript');

function loadApi() {
  const module = { exports: {} };
  new Function('require', 'module', 'exports', ts.transpileModule(readFileSync(resolve(__dirname, 'api.ts'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText)(id => id === 'js-cookie' ? { get: () => 'test-token' } : id === './device-id' ? { getDeviceId: () => 'student-test-device' } : require(id), module, module.exports);
  return module.exports;
}

for (const remaining of [[], [11], [11, 22]]) {
  test(`student updates explicitly submit ${remaining.length} remaining courses`, async (t) => {
    let submitted;
    t.mock.method(globalThis, 'fetch', async (_url, options) => {
      submitted = options.body instanceof FormData
        ? options.body.has('course_ids') ? [] : [...options.body].filter(([key]) => key.startsWith('course_ids[')).map(([, value]) => Number(value))
        : JSON.parse(options.body).course_ids;
      if (remaining.length === 0 && options.body instanceof FormData) assert.ok(options.body.has('course_ids'), 'an empty selection must not be omitted');
      return Response.json({ data: {} });
    });
    await loadApi().studentsApi.update('student-id', { status: 0, course_ids: remaining });
    assert.deepEqual(submitted, remaining);
  });
}

test('clearing courses also survives a student profile photo upload', async (t) => {
  t.mock.method(globalThis, 'fetch', async (_url, options) => {
    assert.ok(options.body instanceof FormData);
    assert.equal(options.body.get('course_ids'), '');
    assert.equal(options.body.get('image').name, 'profile.png');
    return Response.json({ data: {} });
  });
  await loadApi().studentsApi.update('student-id', { course_ids: [], image: new File(['image'], 'profile.png', { type: 'image/png' }) });
});

test('an inactive session stops playing media and leaves the student page without manual logout', async (t) => {
  let paused = 0;
  const redirects = [];
  global.window = { location: { replace: url => redirects.push(url) } };
  global.document = { querySelectorAll: () => [{ pause: () => paused++ }] };
  t.after(() => { delete global.window; delete global.document; });
  t.mock.method(globalThis, 'fetch', async () => Response.json({ code: 'account_inactive', message: 'Account disabled' }, { status: 401 }));
  await assert.rejects(loadApi().authApi.me(), error => error.status === 401);
  assert.equal(paused, 1);
  assert.deepEqual(redirects, ['/api/auth/session-end?reason=inactive']);
});

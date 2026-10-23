const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const ts = require('typescript');

const loaded = { exports: {} };
new Function('require', 'module', 'exports', ts.transpileModule(readFileSync(`${__dirname}/api.ts`, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText)(id => id === 'js-cookie' ? { get: () => 'test-token' }
  : id === './device-id' ? { getDeviceId: () => 'test-device' } : require(id), loaded, loaded.exports);
const { departmentsApi, ApiError } = loaded.exports;

test('department loading stays pending, waits one second, then recovers after a connection failure', async (t) => {
  const requests = [];
  const data = { data: [{ id: '1', attributes: { name: 'Department' } }] };
  let resume;
  t.mock.method(globalThis, 'setTimeout', (callback, delay) => {
    assert.equal(delay, 1000);
    resume = callback;
    return 0;
  });
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    requests.push({ url, options });
    if (requests.length === 1) throw new TypeError('Failed to fetch');
    return Response.json(data);
  });
  const pending = departmentsApi.list();
  let settled = false;
  pending.then(() => { settled = true; }, () => { settled = true; });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(typeof resume, 'function');
  assert.equal(requests.length, 1);
  assert.equal(settled, false);
  resume();
  assert.deepEqual(await pending, data);
  assert.equal(requests.length, 2);
  assert.deepEqual(requests[1], requests[0]);
  assert.equal(new URL(requests[0].url).pathname, '/v1/department');
  assert.equal(requests[0].options.method, 'GET');
});

test('a persistent connection failure stops after the second attempt and preserves the error', async (t) => {
  let calls = 0;
  const error = new TypeError('Failed to fetch');
  t.mock.method(globalThis, 'setTimeout', callback => { callback(); return 0; });
  t.mock.method(globalThis, 'fetch', async () => { calls++; throw error; });
  await assert.rejects(departmentsApi.list(), failure => failure === error);
  assert.equal(calls, 2);
});

for (const status of [401, 403, 422, 500]) {
  test(`HTTP ${status} is returned without retrying`, async (t) => {
    let calls = 0;
    t.mock.method(globalThis, 'setTimeout', () => assert.fail('HTTP errors must not be retried'));
    t.mock.method(globalThis, 'fetch', async () => { calls++; return Response.json({ message: 'Request rejected' }, { status }); });
    await assert.rejects(departmentsApi.list(), error => error instanceof ApiError && error.status === status);
    assert.equal(calls, 1);
  });
}

for (const error of [new SyntaxError('Invalid JSON'), new DOMException('Cancelled', 'AbortError')]) {
  test(`${error.name} is returned without retrying`, async (t) => {
    let calls = 0;
    t.mock.method(globalThis, 'setTimeout', () => assert.fail('Only connection failures should retry'));
    t.mock.method(globalThis, 'fetch', async () => { calls++; return { ok: true, status: 200, json: async () => { throw error; } }; });
    await assert.rejects(departmentsApi.list(), failure => failure === error);
    assert.equal(calls, 1);
  });
}

test('a successful list, department detail reads, and deletions are not retried', async (t) => {
  let calls = 0;
  t.mock.method(globalThis, 'setTimeout', () => assert.fail('No retry expected'));
  t.mock.method(globalThis, 'fetch', async () => { calls++; return Response.json({ data: [] }); });
  assert.deepEqual(await departmentsApi.list(), { data: [] });
  assert.equal(calls, 1);
  t.mock.method(globalThis, 'fetch', async () => { calls++; throw new TypeError('Failed to fetch'); });
  await assert.rejects(departmentsApi.get(42), TypeError);
  await assert.rejects(departmentsApi.delete(42), TypeError);
  assert.equal(calls, 3);
});

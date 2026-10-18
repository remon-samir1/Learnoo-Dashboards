const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const ts = require('typescript');

test('device identity survives logout storage changes and is shared between www and the main domain', () => {
  const cookie = {}; const local = new Map([['learnoo_device_id', 'existing-iphone-device-id']]);
  let options;
  const cookies = { get: key => cookie[key], set: (key, value, config) => { cookie[key] = value; options = config; } };
  const loaded = { exports: {} };
  global.localStorage = { getItem: key => local.get(key), setItem: (key, value) => local.set(key, value) };
  global.location = { hostname: 'www.learnoo.app', protocol: 'https:' };
  new Function('require', 'module', 'exports', ts.transpileModule(readFileSync(`${__dirname}/device-id.ts`, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText)(() => ({ default: cookies }), loaded, loaded.exports);
  assert.equal(loaded.exports.getDeviceId(), 'existing-iphone-device-id');
  assert.equal(options.domain, '.learnoo.app');
  local.clear(); global.location.hostname = 'learnoo.app';
  assert.equal(loaded.exports.getDeviceId(), 'existing-iphone-device-id');
  assert.equal(local.get('learnoo_device_id'), 'existing-iphone-device-id');
  delete global.localStorage; delete global.location;
});

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const ts = require('typescript');

test('scheduled countdown updates every second, handles days, expires and clears its timer', () => {
  const effects = [], updates = [];
  let tick, cleared, now = Date.parse('2026-10-12T12:00:00Z');
  const loaded = { exports: {} };
  const compiled = ts.transpileModule(readFileSync(`${__dirname}/useCountdown.ts`, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  new Function('require', 'module', 'exports', 'Date', 'setInterval', 'clearInterval', compiled)(
    () => ({ useEffect: effect => effects.push(effect), useState: initial => [initial, value => updates.push(value)] }), loaded, loaded.exports,
    class extends Date { static now() { return now; } }, (callback, delay) => { tick = callback; assert.equal(delay, 1000); return 9; }, timer => { cleared = timer; },
  );
  loaded.exports.useCountdown('2026-10-13T12:00:05Z', { dayLabel: 'يوم' });
  const cleanup = effects[0]();
  assert.equal(updates.at(-1).formatted, '1 يوم 00:00:05');
  now += 1000; tick(); assert.equal(updates.at(-1).formatted, '1 يوم 00:00:04');
  now += 86404_000; tick(); assert.equal(updates.at(-1).isPast, true);
  cleanup(); assert.equal(cleared, 9);
});

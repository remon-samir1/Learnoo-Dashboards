const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const ts = require('typescript');

test('voice watermark speaks during playback and cancels on pause and unmount', () => {
  const effects = [], handlers = {}, spoken = [];
  let canceled = 0;
  const video = { paused: true, addEventListener: (event, callback) => handlers[event] = callback, removeEventListener: () => {} };
  const compiled = ts.transpileModule(readFileSync(join(__dirname, 'useVoiceWatermark.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', 'window', 'document', 'SpeechSynthesisUtterance', 'setInterval', 'clearInterval', compiled)(
    () => ({ useEffect: callback => effects.push(callback), useRef: value => ({ current: value }), useCallback: callback => callback }), module, module.exports,
    { speechSynthesis: { speaking: false, getVoices: () => [{ lang: 'ar-EG' }], speak: item => spoken.push(item), cancel: () => canceled++ }, addEventListener: () => {}, removeEventListener: () => {} },
    { hidden: false, addEventListener: () => {}, removeEventListener: () => {} }, function(text) { this.text = text; }, () => 1, () => {},
  );
  module.exports.useVoiceWatermark({ enabled: true, text: 'رمز الطالب', interval: 1, videoRef: { current: video } });
  const cleanup = effects.map(callback => callback());
  assert.equal(spoken.length, 0);
  handlers.play();
  assert.equal(spoken.length, 1);
  assert.equal(spoken[0].lang, 'ar-EG');
  assert.equal(spoken[0].volume > 0, true);
  handlers.pause();
  assert.equal(canceled > 0, true);
  cleanup.forEach(callback => callback?.());
});

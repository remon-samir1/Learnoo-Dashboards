const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const ts = require('typescript');

function recorderView({ audio = true, micDenied = false, supported = true, enabled = true, joined = true, locale = 'ar' } = {}) {
  const states = [], refs = [], effects = [], recordings = [], saved = [], revoked = [], blobs = [], warnings = new Map();
  let cursor, refCursor, tree, markup, captures = 0;
  const track = kind => ({ kind, readyState: 'live', stop() { this.readyState = 'ended'; }, addEventListener(name, callback) { this[name] = callback; } });
  const video = track('video'), tabAudio = track('audio'), micAudio = track('audio');
  class Stream {
    constructor(tracks) { this.tracks = tracks; }
    getTracks() { return this.tracks; }
    getAudioTracks() { return this.tracks.filter(t => t.kind === 'audio'); }
    getVideoTracks() { return this.tracks.filter(t => t.kind === 'video'); }
  }
  const display = new Stream(audio ? [video, tabAudio] : [video]);
  const microphone = new Stream([micAudio]);
  const sources = [];
  class Audio {
    async resume() {}
    createMediaStreamDestination() { return { stream: new Stream([track('audio')]) }; }
    createMediaStreamSource(stream) { sources.push(stream); return { connect() {} }; }
    close() { this.closed = true; }
  }
  class Recorder {
    static isTypeSupported(type) { return type === 'video/webm;codecs=vp8,opus'; }
    constructor(stream, options) { this.stream = stream; this.mimeType = options.mimeType; this.state = 'inactive'; recordings.push(this); }
    start() { this.state = 'recording'; this.onstart(); }
    stop() { this.ondataavailable({ data: new Blob(['recorded-video-and-audio']) }); this.state = 'inactive'; this.onstop(); }
  }
  const module = { exports: {} };
  const compiled = ts.transpileModule(readFileSync(join(__dirname, 'LocalSessionRecording.tsx'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  new Function('require', 'module', 'exports', 'navigator', 'MediaRecorder', 'AudioContext', 'MediaStream', 'URL', 'document', 'window', compiled)(id => {
    if (id === 'react') return { ...React,
      useEffect: (callback, deps) => effects.push({ callback, deps }),
      useRef: value => refs[refCursor++] ??= { current: value },
      useState: value => { const index = cursor++; if (!(index in states)) states[index] = value; return [states[index], next => states[index] = next]; },
    };
    if (id === 'next-intl') return { useLocale: () => locale };
    return require(id);
  }, module, module.exports, { mediaDevices: {
    getDisplayMedia: supported ? async () => { captures++; return display; } : undefined,
    getUserMedia: async () => { if (micDenied) throw new Error('permission-denied'); return microphone; },
  } }, Recorder, Audio, Stream, {
    createObjectURL: blob => { blobs.push(blob); return 'blob:local-recording'; }, revokeObjectURL: url => revoked.push(url),
  }, { createElement: () => ({ click() { saved.push({ url: this.href, name: this.download }); } }) }, {
    addEventListener: (name, fn) => warnings.set(name, fn), removeEventListener: name => warnings.delete(name),
  });
  const render = () => { cursor = refCursor = 0; effects.length = 0; tree = module.exports.default({ roomId: '70', enabled, joined }); markup = renderToStaticMarkup(tree); return markup; };
  const elements = (node = tree) => !node || typeof node !== 'object' ? [] : [node, ...React.Children.toArray(node.props?.children).flatMap(child => elements(child))];
  render();
  effects[0].callback();
  render();
  return { render, effects, recordings, saved, revoked, blobs, sources, video, tabAudio, micAudio, get markup() { return markup; }, get captures() { return captures; },
    click: () => elements().find(node => node.type === 'button').props.onClick(),
    button: () => elements().find(node => node.type === 'button'),
    setJoined(value) { joined = value; render(); effects[2].callback(); }, warnings,
  };
}

test('records tab video plus mixed tab and host audio, downloads locally and retains a save link', async () => {
  const view = recorderView();
  await view.click(); view.render();
  assert.equal(view.recordings.length, 1);
  assert.equal(view.sources.length, 2);
  assert.deepEqual(view.recordings[0].stream.getTracks().map(t => t.kind), ['video', 'audio']);
  assert.ok(view.markup.includes('إيقاف وحفظ التسجيل'));
  view.effects[3].callback();
  const event = { preventDefault() { this.prevented = true; } };
  view.warnings.get('beforeunload')(event);
  assert.equal(event.prevented, true);
  await view.click(); view.render();
  assert.equal(view.saved.length, 1);
  assert.equal(view.saved[0].url, 'blob:local-recording');
  assert.match(view.saved[0].name, /^Learnoo-70-.*\.webm$/);
  assert.equal(await view.blobs[0].text(), 'recorded-video-and-audio');
  assert.ok(view.markup.includes('حفظ آخر تسجيل على جهازي'));
  assert.ok([view.video, view.tabAudio, view.micAudio].every(t => t.readyState === 'ended'));
  view.effects[1].callback()();
  assert.deepEqual(view.revoked, ['blob:local-recording']);
});

test('refuses silent tab capture and releases screen or microphone permissions on failure', async () => {
  for (const options of [{ audio: false }, { micDenied: true }]) {
    const view = recorderView(options);
    await view.click(); view.render();
    assert.equal(view.recordings.length, 0);
    assert.equal(view.video.readyState, 'ended');
    assert.equal(view.saved.length, 0);
    assert.ok(view.markup.includes('role="alert"'));
    assert.ok(!view.markup.includes('إيقاف وحفظ التسجيل'));
  }
});

test('browser stop-sharing and leaving the meeting both finalize the device recording', async () => {
  for (const end of ['capture', 'meeting']) {
    const view = recorderView({ locale: 'en' });
    await view.click(); view.render();
    if (end === 'capture') view.video.ended(); else view.setJoined(false);
    view.render();
    assert.equal(view.saved.length, 1);
    assert.ok(view.markup.includes('Save last recording to my device'));
  }
});

test('honors session permissions, join readiness and unsupported devices', async () => {
  for (const options of [{ enabled: false }, { supported: false }]) {
    const view = recorderView(options);
    assert.equal(view.button(), undefined);
    assert.equal(view.captures, 0);
  }
  const view = recorderView({ joined: false });
  assert.equal(view.button().props.disabled, true);
  await view.click();
  assert.equal(view.captures, 0);
});

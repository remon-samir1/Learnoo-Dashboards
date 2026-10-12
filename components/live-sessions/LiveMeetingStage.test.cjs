const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const React = require('react');
const ts = require('typescript');

test('host, tablet and phone retain one canvas without clipping, including resizing and cleanup', () => {
  let scale = 0, resize, observed, disconnected = false;
  const element = { clientWidth: 2056, clientHeight: 980 };
  const module = { exports: {} };
  const compiled = ts.transpileModule(readFileSync(join(__dirname, 'LiveMeetingStage.tsx'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  class Observer {
    constructor(callback) { resize = callback; }
    observe(target) { observed = target; }
    disconnect() { disconnected = true; }
  }
  let effect;
  new Function('require', 'module', 'exports', 'ResizeObserver', compiled)(id => id === 'react' ? {
    useRef: () => ({ current: element }),
    useState: () => [scale, value => { scale = value; }],
    useEffect: callback => { effect = callback; },
  } : require(id), module, module.exports, Observer);
  const child = React.createElement('iframe');
  let chatOpen = false;
  const render = () => module.exports.default({ children: child, chatOpen }).props.children;
  assert.equal(render().props.style.visibility, 'hidden');
  const cleanup = effect();
  assert.equal(observed, element);
  for (const [width, height] of [[2056, 980], [846, 640], [300, 520], [720, 300]]) {
    element.clientWidth = width; element.clientHeight = height;
    resize();
    const stage = render();
    assert.equal(stage.props.children, child);
    assert.equal(stage.props.style.width, 960);
    assert.equal(stage.props.style.height, 640);
    assert.equal(stage.props.style.visibility, 'visible');
    assert.ok(960 * scale <= width && 640 * scale <= height);
    assert.equal(stage.props.style.zoom, scale);
    assert.equal(stage.props.style.transform, 'translate(-50%, -50%)');
  }
  chatOpen = true;
  render();
  const chatCleanup = effect();
  resize();
  assert.equal(render().props.style.width, 1275);
  assert.ok(1275 * scale <= element.clientWidth);
  chatCleanup();
  cleanup();
  assert.equal(disconnected, true);
});

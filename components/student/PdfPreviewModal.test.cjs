const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const React = require('react');
const ts = require('typescript');

test('long PDFs render only nearby pages, preserve navigation and bound canvas memory when zoomed', async () => {
  const state = [], refs = [], effects = [], cleanups = [];
  let cursor, refCursor, effectCursor, observer, tree, nodes, scrollTarget;
  const props = { proxiedPdfUrl: '/protected.pdf', scale: 1, currentPage: 150, onPagesLoaded: () => {} };
  const module = { exports: {} };
  const source = readFileSync(join(__dirname, 'PdfPreviewModal.tsx'), 'utf8').replaceAll('import.meta.url', '"file:///test/viewer.tsx"');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  new Function('require', 'module', 'exports', 'fetch', 'window', 'IntersectionObserver', 'ResizeObserver', compiled + '\nexports.content = PdfPreviewContent;')(
    id => {
      if (id === 'react') return { ...React,
        useState: initial => {
          const index = cursor++;
          if (!(index in state)) state[index] = typeof initial === 'function' ? initial() : initial;
          return [state[index], next => state[index] = typeof next === 'function' ? next(state[index]) : next];
        },
        useRef: initial => refs[refCursor++] ??= { current: initial },
        useEffect: (run, deps) => {
          const index = effectCursor++;
          if (!effects[index] || deps.some((dep, i) => !Object.is(dep, effects[index].deps[i]))) effects[index] = { run, deps, pending: true };
        },
      };
      if (id === 'react-pdf') return { Document: 'pdf-document', Page: 'pdf-page', pdfjs: { GlobalWorkerOptions: {} } };
      if (id === '@/src/lib/api' || id.endsWith('.css')) return {};
      return require(id);
    }, module, module.exports,
    async () => ({ ok: true, blob: async () => new Blob(['pdf']) }),
    { devicePixelRatio: 3 },
    class { constructor(callback) { observer = callback; } observe() {} disconnect() {} },
    class { observe() {} disconnect() {} },
  );
  const elements = node => !node || typeof node !== 'object' ? [] : [node, ...React.Children.toArray(node.props?.children).flatMap(elements)];
  const render = () => {
    cursor = refCursor = effectCursor = 0;
    tree = module.exports.content(props);
    nodes = elements(tree);
    for (const node of nodes) if (node.props.ref) node.props.ref.current = {
      clientWidth: 400, querySelectorAll: () => nodes.filter(n => n.props['data-pdf-page']),
      scrollIntoView: () => scrollTarget = node.props['data-pdf-page'],
    };
    effects.forEach((effect, index) => {
      if (effect.pending) {
        cleanups[index]?.(); effect.pending = false; cleanups[index] = effect.run();
      }
    });
  };
  const pages = () => nodes.filter(node => node.type === 'pdf-page');
  render();
  await new Promise(setImmediate);
  render();
  nodes.find(node => node.type === 'pdf-document').props.onLoadSuccess({ numPages: 1000 });
  render();
  assert.equal(scrollTarget, 150, 'navigation requested before document load must still run');
  assert.equal(pages().length, 1, 'do not allocate all 1000 page canvases');
  const intersections = visible => observer(nodes.filter(n => n.props['data-pdf-page']).map(node => ({
    target: { dataset: { pdfPage: String(node.props['data-pdf-page']) } },
    isIntersecting: visible.includes(node.props['data-pdf-page']),
  })));
  intersections([150, 151]); render();
  assert.deepEqual(pages().map(page => page.props.pageNumber), [150, 151]);
  pages()[0].props.onLoadSuccess({ width: 100, height: 10000 });
  props.scale = 2.5; render(); render();
  const page = pages()[0].props;
  assert.ok(page.width ** 2 * 100 * page.devicePixelRatio ** 2 <= 4_000_001, 'zoom and long pages must respect the pixel budget');
  assert.equal(nodes.find(node => node.props['data-pdf-page'] === 150).props.style.minHeight, page.width * 100);
  intersections([200]); render();
  assert.deepEqual(pages().map(page => page.props.pageNumber), [200], 'offscreen canvases must unmount');
  assert.ok(nodes.find(node => node.props['data-pdf-page'] === 150).props.style.minHeight > 0, 'offscreen pages keep their scroll space');
  cleanups.forEach(cleanup => cleanup?.());
});

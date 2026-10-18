const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const React = require('react');
const ts = require('typescript');

function nodes(tree) {
  return !React.isValidElement(tree) ? [] : [tree, ...React.Children.toArray(tree.props.children).flatMap(nodes)];
}

function setup(locale = 'en') {
  const states = [], deps = [], effects = [], requests = [], events = [];
  let cursor = 0, effectCursor = 0, failLoad = false, failRemove = false, pendingOnly = false;
  const module = { exports: {} };
  const mocks = {
    react: { ...React,
      useState: initial => { const i = cursor++; if (!(i in states)) states[i] = initial; return [states[i], value => { states[i] = typeof value === 'function' ? value(states[i]) : value; }]; },
      useEffect: (fn, values) => { const i = effectCursor++; if (!deps[i] || values.some((value, index) => value !== deps[i][index])) { deps[i] = values; effects.push(fn); } },
    },
    'next-intl': { useLocale: () => locale },
    sonner: { toast: { success: text => events.push(['success', text]), error: text => events.push(['error', text]) } },
    '@/src/lib/api': { coursesApi: {
      subscribers: async (id, page) => {
        requests.push(['list', id, page]);
        if (failLoad) throw new Error('Load failed');
        if (pendingOnly) return { data: [], total: 0, pending_count: 1, last_page: 1 };
        return { data: [{ id: `student-${page}`, first_name: 'Student', last_name: String(page), phone: `0100000000${page}` }], total: 31, pending_count: 0, last_page: 2 };
      },
      removeSubscribers: async (id, selection) => { requests.push(['remove', id, selection]); if (failRemove) throw new Error('Remove failed'); return { removed: selection.all ? 31 : selection.student_ids.length, pending_removed: 0 }; },
    } },
  };
  const compiled = ts.transpileModule(readFileSync(`${__dirname}/CourseSubscribers.tsx`, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  new Function('require', 'module', 'exports', compiled)(name => mocks[name] || require(name), module, module.exports);
  const render = () => { cursor = effectCursor = 0; return module.exports.default({ courseId: 12, title: 'Physics', onRemoved: () => events.push(['refresh']) }); };
  return { render, requests, events, failLoad: value => { failLoad = value; }, failRemove: value => { failRemove = value; },
    pendingOnly: () => { pendingOnly = true; },
    settle: async () => { while (effects.length) effects.shift()(); await new Promise(resolve => setImmediate(resolve)); return render(); },
  };
}

function button(tree, text) { return nodes(tree).find(node => node.type === 'button' && node.props.children === text); }

for (const locale of ['ar', 'en']) test(`${locale} selects across pages and removes selected students with confirmation`, async () => {
  const s = setup(locale);
  assert.equal(s.render().props.role, 'status');
  let tree = await s.settle();
  nodes(tree).find(node => node.type === 'input').props.onChange({ target: { checked: true } });
  tree = s.render();
  button(tree, locale === 'ar' ? 'التالي' : 'Next').props.onClick();
  s.render(); tree = await s.settle();
  assert.equal(nodes(tree).find(node => node.type === 'input').props.checked, false);
  button(tree, locale === 'ar' ? 'تحديد الصفحة' : 'Select page').props.onClick();
  tree = s.render();
  const previous = global.window;
  try {
    global.window = { confirm: message => { assert.match(message, /2/); return false; } };
    await button(tree, locale === 'ar' ? 'إلغاء تفعيل المحددين' : 'Remove selected access').props.onClick();
    assert.equal(s.requests.filter(request => request[0] === 'remove').length, 0);
    global.window.confirm = () => true;
    await button(tree, locale === 'ar' ? 'إلغاء تفعيل المحددين' : 'Remove selected access').props.onClick();
    assert.deepEqual(s.requests.at(-1), ['remove', 12, { student_ids: ['student-1', 'student-2'] }]);
    assert.deepEqual(s.events.map(event => event[0]), ['refresh', 'success']);
    tree = s.render();
    assert.equal(button(tree, locale === 'ar' ? 'إلغاء تفعيل المحددين' : 'Remove selected access').props.disabled, true);
  } finally { global.window = previous; }
});

test('select all covers the entire course and a failed removal keeps selection for retry', async () => {
  const s = setup(); s.render(); let tree = await s.settle();
  button(tree, 'Select all subscriptions (31)').props.onClick(); tree = s.render();
  assert.equal(nodes(tree).find(node => node.type === 'input').props.checked, true);
  assert.equal(nodes(tree).find(node => node.type === 'input').props.disabled, true);
  const previous = global.window; global.window = { confirm: () => true };
  try {
    s.failRemove(true);
    await button(tree, 'Remove selected access').props.onClick();
    assert.deepEqual(s.requests.at(-1), ['remove', 12, { all: true }]);
    assert.deepEqual(s.events.map(event => event[0]), ['error']);
    tree = s.render(); assert.equal(button(tree, 'Remove selected access').props.disabled, false);
    s.failRemove(false);
    await button(tree, 'Remove selected access').props.onClick();
    assert.deepEqual(s.events.map(event => event[0]), ['error', 'refresh', 'success']);
  } finally { global.window = previous; }
});

test('failed loading is visible and retry loads the list without allowing a blind removal', async () => {
  const s = setup(); s.failLoad(true); s.render(); let tree = await s.settle();
  assert.equal(tree.props.role, 'alert'); assert.equal(button(tree, 'Remove selected access'), undefined);
  s.failLoad(false); button(tree, 'Retry').props.onClick(); s.render(); tree = await s.settle();
  assert.equal(button(tree, 'Remove selected access').props.disabled, true);
});

test('the course subscriber component is wired to the academic tree and refreshes its totals', () => {
  const page = readFileSync(`${__dirname}/../../app/(admin)/departments/page.tsx`, 'utf8');
  assert.match(page, /<CourseSubscribers[^>]+onRemoved=\{refetchAll\}/);
});

test('pending numbers can be selected for cancellation even before any students have registered', async () => {
  const s = setup(); s.pendingOnly(); s.render(); let tree = await s.settle();
  button(tree, 'Select all subscriptions (1)').props.onClick(); tree = s.render();
  const previous = global.window;
  global.window = { confirm: message => { assert.match(message, /pending pre-activation numbers/); return true; } };
  try {
    await button(tree, 'Remove selected access').props.onClick();
    assert.deepEqual(s.requests.at(-1), ['remove', 12, { all: true }]);
  } finally { global.window = previous; }
});

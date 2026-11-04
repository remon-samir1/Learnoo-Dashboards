const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const React = require('react');
const ts = require('typescript');

function nodes(tree) {
  return !React.isValidElement(tree) ? [] : [tree, ...React.Children.toArray(tree.props.children).flatMap(nodes)];
}

function setup(locale = 'en', role = 'Super Admin', deferred = false) {
  const states = [], dependencies = [], effects = [], cleanups = [], requests = [], pending = [];
  let cursor = 0, effectCursor = 0, fail = false, empty = false;
  const module = { exports: {} };
  const mocks = {
    react: { ...React,
      useState: initial => { const i = cursor++; if (!(i in states)) states[i] = initial; return [states[i], value => { states[i] = typeof value === 'function' ? value(states[i]) : value; }]; },
      useEffect: (fn, deps) => {
        const i = effectCursor++;
        if (i !== 0) return;
        if (!dependencies[i] || deps.some((value, index) => value !== dependencies[i][index])) {
          dependencies[i] = deps;
          effects.push(() => { cleanups[i]?.(); cleanups[i] = fn(); });
        }
      },
    },
    'next-intl': { useLocale: () => locale },
    '@/src/hooks/useAuth': { useCurrentUser: () => ({ role }) },
    '@/components/dashboard/StaffActivityDetails': { default: () => null },
    '@/src/lib/staff-activity': { formatStaffActivity: value => value },
    sonner: { toast: {} },
    '@/src/lib/api': { ownerOperations: { activity: (page, filters) => {
      requests.push({ page, ...filters });
      const result = { data: empty ? [] : [{ id: page, first_name: filters.role || 'All', last_name: String(page), action: 'POST auth/login', created_at: '2026-10-19T00:00:00Z' }], last_page: empty ? 1 : 3 };
      if (deferred) return new Promise((resolve, reject) => pending.push({ resolve, reject, result }));
      return fail ? Promise.reject(new Error('Request failed')) : Promise.resolve(result);
    } } },
  };
  const compiled = ts.transpileModule(readFileSync(`${__dirname}/../../app/(admin)/activity/page.tsx`, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  new Function('require', 'module', 'exports', compiled)(name => mocks[name] || require(name), module, module.exports);
  const render = () => { cursor = effectCursor = 0; return module.exports.default(); };
  return { render, requests, pending, fail: value => { fail = value; }, empty: value => { empty = value; },
    settle: async () => { while (effects.length) effects.shift()(); await new Promise(resolve => setImmediate(resolve)); return render(); },
  };
}

function button(tree, label) { return nodes(tree).find(node => node.type === 'button' && node.props.children === label); }
function select(tree) { return nodes(tree).find(node => node.type === 'select'); }

for (const locale of ['ar', 'en']) test(`${locale} role filter resets the page and combines with date filters`, async () => {
  const s = setup(locale); s.render(); let tree = await s.settle();
  assert.deepEqual(nodes(select(tree)).filter(node => node.type === 'option').map(node => node.props.children), locale === 'ar' ? ['كل العمليات', 'المدرسون', 'الأدمن'] : ['All activity', 'Instructors', 'Admins']);
  button(tree, locale === 'ar' ? 'التالي' : 'Next').props.onClick(); s.render(); tree = await s.settle();
  assert.equal(s.requests.at(-1).page, 2);
  select(tree).props.onChange({ target: { value: 'Instructor' } }); s.render(); tree = await s.settle();
  assert.deepEqual(s.requests.at(-1), { page: 1, from: undefined, to: undefined, role: 'Instructor', type: undefined });
  const dates = nodes(tree).filter(node => node.type === 'input' && node.props.type === 'date');
  dates[0].props.onChange({ target: { value: '2026-10-18' } });
  dates[1].props.onChange({ target: { value: '2026-10-19' } }); s.render(); tree = await s.settle();
  assert.deepEqual(s.requests.at(-1), { page: 1, from: '2026-10-18', to: '2026-10-19', role: 'Instructor', type: undefined });
  button(tree, locale === 'ar' ? 'التالي' : 'Next').props.onClick(); s.render(); tree = await s.settle();
  assert.equal(s.requests.at(-1).role, 'Instructor'); assert.equal(s.requests.at(-1).page, 2);
  select(tree).props.onChange({ target: { value: 'Admin' } }); s.render(); tree = await s.settle();
  assert.equal(s.requests.at(-1).role, 'Admin'); assert.equal(s.requests.at(-1).page, 1);
  select(tree).props.onChange({ target: { value: '' } }); s.render(); await s.settle();
  assert.deepEqual(s.requests.at(-1), { page: 1, from: '2026-10-18', to: '2026-10-19', role: undefined, type: undefined });
});

test('a late response from the previous filter cannot overwrite the selected view', async () => {
  const s = setup('en', 'Super Admin', true); s.render(); let tree = await s.settle();
  assert.ok(nodes(tree).some(node => node.props.role === 'status'));
  assert.equal(button(tree, 'Next').props.disabled, true);
  select(tree).props.onChange({ target: { value: 'Admin' } }); s.render(); await s.settle();
  s.pending[1].resolve(s.pending[1].result); tree = await s.settle();
  assert.ok(nodes(tree).some(node => node.type === 'p' && node.props.children?.includes('Admin')));
  s.pending[0].resolve(s.pending[0].result); tree = await s.settle();
  assert.equal(select(tree).props.value, 'Admin');
  assert.ok(nodes(tree).some(node => node.type === 'p' && node.props.children?.includes('Admin')));
  assert.ok(!nodes(tree).some(node => node.type === 'p' && node.props.children?.includes('All')));
});

test('a failed filter request shows an error instead of old results or a false empty result', async () => {
  const s = setup(); s.render(); let tree = await s.settle();
  s.fail(true); select(tree).props.onChange({ target: { value: 'Instructor' } }); s.render(); tree = await s.settle();
  assert.ok(nodes(tree).some(node => node.props.role === 'alert'));
  assert.equal(nodes(tree).filter(node => node.type === 'article').length, 0);
  assert.ok(!nodes(tree).some(node => node.props.children === 'No activity matches these filters'));
});

test('an empty filter has an accurate empty state', async () => {
  const s = setup(); s.empty(true); s.render(); const tree = await s.settle();
  assert.ok(nodes(tree).some(node => node.props.children === 'No activity matches these filters'));
});

test('non-Owner roles have no activity filter and never request the audit feed', async () => {
  for (const role of ['Admin', 'Instructor', 'Support', 'Student', 'Parent']) {
    const s = setup('en', role); s.render(); const tree = await s.settle();
    assert.equal(select(tree), undefined); assert.deepEqual(s.requests, []);
  }
});


for (const locale of ['ar', 'en']) test(`${locale} activity types combine with roles and dates and reset pagination`, async () => {
  const s = setup(locale); s.render(); let tree = await s.settle();
  const typeSelect = () => nodes(tree).filter(node => node.type === 'select')[1];
  assert.deepEqual(nodes(typeSelect()).filter(node => node.type === 'option').map(node => node.props.value),
    ['', 'device-requests', 'device-decisions', 'courses', 'lessons', 'accounts', 'activations']);
  assert.equal(nodes(typeSelect()).find(node => node.props.value === 'device-requests').props.children,
    locale === 'ar' ? 'طلبات نقل الأجهزة' : 'Device transfer requests');
  const next = locale === 'ar' ? 'التالي' : 'Next';
  select(tree).props.onChange({ target: { value: 'Admin' } }); s.render(); tree = await s.settle();
  const dates = nodes(tree).filter(node => node.type === 'input' && node.props.type === 'date');
  dates[0].props.onChange({ target: { value: '2026-10-18' } }); s.render(); tree = await s.settle();
  for (const type of ['device-requests', 'device-decisions', 'courses', 'lessons', 'accounts', 'activations', '']) {
    button(tree, next).props.onClick(); s.render(); tree = await s.settle();
    assert.equal(s.requests.at(-1).page, 2);
    typeSelect().props.onChange({ target: { value: type } }); s.render(); tree = await s.settle();
    assert.deepEqual(s.requests.at(-1), { page: 1, from: '2026-10-18', to: undefined, role: 'Admin', type: type || undefined });
  }
});

test('a late response cannot overwrite a newer activity type', async () => {
  const s = setup('en', 'Super Admin', true); s.render(); let tree = await s.settle();
  nodes(tree).filter(node => node.type === 'select')[1].props.onChange({ target: { value: 'device-requests' } }); s.render(); await s.settle();
  s.pending[1].resolve({ data: [], last_page: 1 }); tree = await s.settle();
  s.pending[0].resolve(s.pending[0].result); tree = await s.settle();
  assert.equal(nodes(tree).filter(node => node.type === 'article').length, 0);
  assert.equal(nodes(tree).filter(node => node.type === 'select')[1].props.value, 'device-requests');
});

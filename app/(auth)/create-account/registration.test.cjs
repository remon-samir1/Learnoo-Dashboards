const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const React = require('react');
const ts = require('typescript');

function elements(node) {
  return !React.isValidElement(node) ? [] : [node, ...React.Children.toArray(node.props.children).flatMap(elements)];
}

function setup(locale, fail = false) {
  let cursor = 0;
  const states = [], calls = [], destinations = [];
  const messages = require(`../../../messages/${locale}.json`).auth.createAccount;
  const module = { exports: {} };
  const mocks = {
    react: { ...React, useState: initial => {
      const index = cursor++;
      if (!(index in states)) states[index] = initial;
      return [states[index], value => { states[index] = value; }];
    } },
    'next-intl': { useTranslations: () => key => key.split('.').reduce((value, part) => value[part], messages) },
    'next/navigation': { useRouter: () => ({ push: path => destinations.push(path) }) },
    'next/link': { default: 'a' },
    sonner: { toast: { error: () => {} } },
    '@/src/lib/api': { ApiError: class extends Error {}, getApiErrorMessage: error => error.message },
    '@/src/stores/authStore': { useAuthActions: () => ({ register: async data => { calls.push(data); if (fail) throw new Error('Registration failed'); } }) },
    '@/lib/cookies': { default: { set: () => {} } },
    '../components/AuthLayout': { default: ({ children }) => children },
    '../components/CountryCodeSelect': { default: () => null, DEFAULT_COUNTRY: { iso: 'EG', code: '20' } },
    '@/src/lib/local-phone': { normalizeLocalPhone: value => value.replace(/^0/, ''), isValidLocalPhone: (_country, value) => /^01\d{9}$/.test(value) },
    '@/components/modals/TermsModal': { default: () => null },
  };
  const compiled = ts.transpileModule(readFileSync(`${__dirname}/page.tsx`, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  new Function('require', 'module', 'exports', compiled)(id => mocks[id] || require(id), module, module.exports);
  return { calls, destinations, render: () => { cursor = 0; return module.exports.default(); } };
}

for (const locale of ['ar', 'en']) test(`${locale}: signup offers student registration and submits to phone verification`, async () => {
  const view = setup(locale);
  const nodes = elements(view.render());
  assert.equal(nodes.filter(node => node.type === 'input' && node.props.type === 'password').length, 0);
  assert.equal(nodes.filter(node => node.type === 'button' && /^(ولي أمر|ولي الأمر|Parent|Student|طالب)$/.test(node.props.children)).length, 0);
  for (const [name, value] of Object.entries({ firstName: 'QA', lastName: 'Student', email: 'qa@gmail.com', phone: '01012345678' })) {
    nodes.find(node => node.type === 'input' && node.props.name === name).props.onChange({ target: { value } });
  }
  nodes.find(node => node.type === 'input' && node.props.type === 'checkbox').props.onChange({ target: { checked: true } });
  await elements(view.render()).find(node => node.type === 'button' && node.props.disabled === false).props.onClick();
  assert.deepEqual(view.calls, [{ first_name: 'QA', last_name: 'Student', email: 'qa@gmail.com', phone: '201012345678', role: 0, device_name: 'learnoo-web' }]);
  assert.deepEqual(view.destinations, ['/verification-code']);
});

test('registration failure keeps the student on the form with their inputs', async () => {
  const view = setup('en', true);
  for (const node of elements(view.render())) {
    if (node.type === 'input' && node.props.name) node.props.onChange({ target: { value: node.props.name === 'phone' ? '01012345678' : 'Student' } });
    if (node.type === 'input' && node.props.type === 'checkbox') node.props.onChange({ target: { checked: true } });
  }
  await elements(view.render()).find(node => node.type === 'button' && node.props.disabled === false).props.onClick();
  assert.equal(view.calls.length, 1);
  assert.deepEqual(view.destinations, []);
  assert.equal(elements(view.render()).find(node => node.type === 'input' && node.props.name === 'firstName').props.value, 'Student');
});

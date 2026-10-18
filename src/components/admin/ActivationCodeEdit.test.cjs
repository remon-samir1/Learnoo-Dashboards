const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const ts = require('typescript');

test('admin and instructor code editors support Quiz and retain an exam outside the first search page', () => {
  for (const folder of ['(admin)', '(doctor)/doctor']) {
    const source = readFileSync(resolve(__dirname, `../../../app/${folder}/activation/[id]/edit/page.tsx`), 'utf8');
    const loaded = { exports: {} };
    const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
    const state = ['App\\Models\\Quiz', '99', 'CODE', ''];
    let index = 0;
    new Function('require', 'module', 'exports', compiled)(id => {
      if (id === 'react') return { ...React, useState: () => [state[index++], () => {}], useEffect: () => {} };
      if (id === 'next-intl') return { useTranslations: () => key => key };
      if (id === 'next/navigation') return { useRouter: () => ({}), useParams: () => ({ id: '7' }) };
      if (id === 'next/link') return ({ children, ...props }) => React.createElement('a', props, children);
      if (id === 'use-debounce') return { useDebounce: value => [value] };
      if (id === '@/src/hooks') return { useCode: () => ({ data: { attributes: {} }, isLoading: false }), useUpdateCode: () => ({}) };
      if (id === '@/src/hooks/useQuizzes') return {
        useQuizzes: () => ({ data: [{ id: '1', attributes: { title: 'First-page exam' } }] }),
        useQuiz: (id, options) => { assert.equal(id, 99); assert.equal(options.enabled, true); return { data: { id: '99', attributes: { title: 'Selected last-page exam' } } }; },
      };
      if (id.startsWith('@/src/hooks/')) return new Proxy({}, { get: () => () => ({ data: [], isLoading: false }) });
      if (id === '@/src/components/admin/CourseTreeSelect') return { CourseTreeSelect: () => null };
      return require(id);
    }, loaded, loaded.exports);
    const html = renderToStaticMarkup(React.createElement(loaded.exports.default));
    assert.match(html, /activation.types.quiz/);
    assert.match(html, /value="99"[^>]*>Selected last-page exam/);
  }
});

test('activation pages expose the exam filter and assign exam and live codes with the correct API type', async () => {
  for (const folder of ['(admin)', '(doctor)/doctor']) {
    for (const [model, itemType] of [['Quiz', 'quiz'], ['LiveRoom', 'live_room']]) {
      const source = readFileSync(resolve(__dirname, `../../../app/${folder}/activation/page.tsx`), 'utf8');
      const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
      const code = { id: '7', attributes: { code: 'TEST', codeable_type: `App\\Models\\${model}`, codeable_id: 99 } };
      let assigned;
      let query;
      let index = 0;
      let tab = 'codes';
      const loaded = { exports: {} };
      new Function('require', 'module', 'exports', compiled)(id => {
        if (id === 'react') return { ...React, useState: initial => {
          const position = index++;
          return [position === 0 ? tab : position === 2 ? 'Quiz' : position === 9 ? 'student-id' : position === 10 ? '7' : initial, () => {}];
        }, useEffect: () => {} };
        if (id === 'next-intl') return { useTranslations: () => key => `ar:${key}` };
        if (id === 'next/link') return () => null;
        if (id === 'use-debounce') return { useDebounce: value => [value] };
        if (id === 'react-hot-toast') return { success: () => {}, error: message => assert.fail(message) };
        if (id === '@/src/hooks') return {
          useCodes: () => ({ data: [code] }), usePaginatedCodes: params => { query = params; return {}; },
          useDeleteCode: () => ({}), useActivateCode: () => ({ mutateAsync: async data => { assigned = data; } }),
        };
        if (id.startsWith('@/src/hooks/')) return new Proxy({}, { get: () => () => ({ data: [], isLoading: false }) });
        if (id.startsWith('@/src/components/')) return new Proxy({}, { get: () => () => null });
        return require(id);
      }, loaded, loaded.exports);
      const elements = [];
      const walk = element => {
        if (Array.isArray(element)) return element.forEach(walk);
        if (!React.isValidElement(element)) return;
        elements.push(element);
        walk(element.props.children);
      };
      walk(loaded.exports.default());
      assert.equal(query.codeable_type, 'App\\Models\\Quiz');
      const filter = elements.find(element => element.props.filters);
      assert.ok(filter.props.filters[0].options.some(option => option.value === 'Quiz'));
      tab = 'assign'; index = 0; elements.length = 0;
      walk(loaded.exports.default());
      const form = elements.find(element => element.type === 'form');
      const timeout = global.setTimeout;
      global.setTimeout = () => 0;
      try {
        await form.props.onSubmit({ preventDefault() {} });
      } finally {
        global.setTimeout = timeout;
      }
      assert.deepEqual(assigned, { code: 'TEST', item_id: 99, item_type: itemType, user_id: 'student-id' });
    }
  }
});

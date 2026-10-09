const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const ts = require('typescript');

test('Owner exam deletion accepts a successful empty response and refreshes the list', async () => {
  const calls = [];
  const loaded = { exports: {} };
  const compiled = ts.transpileModule(readFileSync(`${__dirname}/useQuizzes.ts`, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  new Function('require', 'module', 'exports', compiled)(id => {
    if (id === '@/src/lib/api') return { api: { quizzes: { delete: async id => { calls.push(['delete', id]); return undefined; } } } };
    if (id === '@tanstack/react-query') return {
      useQueryClient: () => ({ removeQueries: options => calls.push(['remove', options.queryKey]), invalidateQueries: async options => calls.push(['refresh', options.queryKey]) }),
      useMutation: options => ({ mutateAsync: async id => { const result = await options.mutationFn(id); await options.onSuccess(result, id); return result; } }),
    };
    return require(id);
  }, loaded, loaded.exports);
  await loaded.exports.useDeleteQuiz().mutateAsync(42);
  assert.deepEqual(calls, [['delete', 42], ['remove', ['quizzes', 'detail', 42]], ['refresh', ['quizzes', 'list']]]);
});

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const ts = require('typescript');
const root = resolve(__dirname, '../../..');
const compile = source => ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const apiModule = { exports: {} };
new Function('require', 'module', 'exports', compile(readFileSync(resolve(root, 'src/lib/api.ts'), 'utf8')))(
  id => id === './device-id' ? { getDeviceId: () => 'test' } : require(id), apiModule, apiModule.exports,
);
const { ApiError, getApiErrorMessage } = apiModule.exports;

test('academic create and edit show the API validation message and keep the form open in both dashboards', async () => {
  for (const path of ['app/(admin)/departments/page.tsx', 'app/(doctor)/doctor/departments/page.tsx']) {
    const source = ts.createSourceFile(path, readFileSync(resolve(root, path), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const handlers = {};
    function visit(node) {
      if (ts.isVariableDeclaration(node) && ['handleAddSubmit', 'handleEditSubmit'].includes(node.name.getText(source))) {
        handlers[node.name.getText(source)] = node.initializer.getText(source);
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
    for (const language of ['ar', 'en']) {
      const message = language === 'ar' ? 'قيمة حقل الاسم مُستخدمة من قبل.' : 'The name has already been taken.';
      for (const type of ['university', 'center', 'faculty', 'department']) {
        for (const name of ['handleAddSubmit', 'handleEditSubmit']) {
          const messages = [];
          const calls = [];
          const context = {
            selectedNode: { type, data: { id: '10' } }, addType: type, addParentId: null, departments: [],
            getApiErrorMessage,
            toast: { error: text => messages.push(text), success: () => assert.fail('Must not report success') },
            setUploadProgress: () => {},
            setEditModalOpen: () => assert.fail('Keep edit form open'),
            setAddModalOpen: () => assert.fail('Keep create form open'),
            refetchAll: () => assert.fail('Do not reload the tree after a rejected save'),
          };
          for (const action of ['create', 'update']) {
            for (const entity of ['University', 'Center', 'Faculty', 'Department']) {
              context[action + entity] = async (...args) => {
                calls.push(args);
                throw new ApiError(422, 'Validation failed', { name: [message] });
              };
            }
          }
          const handler = new Function(...Object.keys(context), compile(`const handler = ${handlers[name]};`) + '\nreturn handler;')(...Object.values(context));
          await handler({ name: 'Commerce' });
          assert.equal(calls.length, 1, `${path}: ${type} ${name}`);
          assert.deepEqual(messages, [message]);
        }
      }
    }
  }
});

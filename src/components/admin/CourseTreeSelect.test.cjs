/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS test harness. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const React = require('react');
const ts = require('typescript');

const courses = [
  { id: '10', attributes: { title: 'إدارة الإنتاج الثانية انتظام', category_id: 4 } },
  { id: '11', attributes: { title: 'إدارة الإنتاج الثانية انتساب', category_id: 4 } },
  { id: '12', attributes: { title: 'محاسبة مالية', category_id: 4 } },
];
const lectures = [
  { id: '20', attributes: { title: 'فيديوهات انتظام', course_id: 10 } },
  { id: '21', attributes: { title: 'الجزء الخاص بفيديوهات الشرح', course_id: 11 } },
  { id: '22', attributes: { title: 'مراجعة نهائية', course_id: 11 } },
  { id: '23', attributes: { title: 'فيديوهات المحاسبة', course_id: 12 } },
];
const chapters = [{ id: '30', attributes: { title: 'الحصة الأولى', course_id: 11 } }];
const data = {
  useUniversities: [{ id: '1', attributes: { name: 'University' } }],
  useCenters: [{ id: '2', attributes: { name: 'Center', university_id: 1 } }],
  useFaculties: [{ id: '3', attributes: { name: 'Faculty', center_id: 2 } }],
  useDepartments: [{ id: '4', attributes: { name: 'الفرقة الثانية', faculty_id: 3 } }],
  useCourses: courses,
  useChapters: chapters,
};
const source = readFileSync(resolve(__dirname, 'CourseTreeSelect.tsx'), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
}).outputText;

function selector(options = {}) {
  const state = [], memos = [], effects = [], changes = [];
  let stateIndex, memoIndex, effectIndex, pending, dirty;
  const props = { value: [], inline: true, multiple: true, selectLectures: true, coursesData: courses, lecturesData: lectures, ...options };
  props.onMultiChange = value => { changes.push(value); props.value = value; options.onMultiChange?.(value); };
  props.onChange = value => { changes.push(value); props.value = value; };
  const same = (a, b) => a && b && a.length === b.length && a.every((value, index) => Object.is(value, b[index]));
  const loaded = { exports: {} };
  new Function('require', 'module', 'exports', 'document', compiled)(id => {
    if (id === 'react') return {
      ...React,
      useState: initial => {
        const index = stateIndex++;
        if (!(index in state)) state[index] = typeof initial === 'function' ? initial() : initial;
        return [state[index], update => {
          const value = typeof update === 'function' ? update(state[index]) : update;
          if (!Object.is(state[index], value)) { state[index] = value; dirty = true; }
        }];
      },
      useMemo: (fn, deps) => {
        const index = memoIndex++;
        if (!same(memos[index]?.deps, deps)) memos[index] = { deps, value: fn() };
        return memos[index].value;
      },
      useEffect: (fn, deps) => {
        const index = effectIndex++;
        if (!same(effects[index], deps)) { effects[index] = deps; pending.push(fn); }
      },
      useRef: () => ({ current: null }),
    };
    if (id.startsWith('@/src/hooks/')) {
      const hook = id.split('/').at(-1);
      return { [hook]: () => ({ data: data[hook], isLoading: false }) };
    }
    return require(id);
  }, loaded, loaded.exports, { addEventListener() {}, removeEventListener() {} });
  const render = () => {
    for (let pass = 0; pass < 10; pass++) {
      stateIndex = memoIndex = effectIndex = 0; pending = []; dirty = false;
      const tree = loaded.exports.CourseTreeSelect(props);
      pending.forEach(fn => fn());
      if (!dirty) return tree;
    }
    assert.fail('Selector did not settle');
  };
  const search = query => {
    elements(render()).find(node => node.type === 'input' && node.props.type === 'text').props.onChange({ target: { value: query } });
    return render();
  };
  return { render, search, changes };
}

function elements(node) {
  return !React.isValidElement(node) ? [] : [node, ...React.Children.toArray(node.props.children).flatMap(elements)];
}
function row(tree, name) {
  return elements(tree).find(node => node.type === 'div' && typeof node.props.onClick === 'function'
    && React.Children.toArray(node.props.children).some(child => child.props?.children === name));
}
const click = { stopPropagation() {} };

test('course search retains selectable video sections for copying and moving between both study tracks', () => {
  const s = selector({ excludeIds: ['20'] });
  let tree = s.search('إنتاج');
  assert.ok(row(tree, courses[0].attributes.title));
  assert.ok(row(tree, courses[1].attributes.title));
  assert.equal(row(tree, courses[2].attributes.title), undefined);
  const target = row(tree, lectures[1].attributes.title);
  assert.ok(target, 'Matching course must keep its selectable video section');
  assert.ok(elements(target).some(node => node.props.className?.includes('border-2')));
  row(tree, lectures[0].attributes.title).props.onClick(click);
  assert.deepEqual(s.changes, [], 'The source lecture remains excluded');
  target.props.onClick(click);
  tree = s.render();
  row(tree, lectures[2].attributes.title).props.onClick(click);
  assert.deepEqual(s.changes.at(-1), ['21', '22']);
  tree = s.search('محاسبة');
  assert.ok(row(tree, lectures[3].attributes.title));
  assert.deepEqual(s.changes.at(-1), ['21', '22'], 'Searching preserves selected targets');
  tree = s.search('');
  assert.ok(row(tree, lectures[0].attributes.title));
  assert.ok(row(tree, lectures[3].attributes.title));
});

test('matching a parent expands descendants in a dropdown opened without prior manual navigation', () => {
  const s = selector({ inline: false });
  elements(s.render()).find(node => node.type === 'button').props.onClick();
  const tree = s.search('الفرقة الثانية');
  for (const lecture of lectures) assert.ok(row(tree, lecture.attributes.title));
});

test('lecture search retains its ancestors while hiding unrelated sibling sections', () => {
  const s = selector();
  const tree = s.search('مراجعة');
  assert.ok(row(tree, 'University'));
  assert.ok(row(tree, courses[1].attributes.title));
  assert.ok(row(tree, lectures[2].attributes.title));
  assert.equal(row(tree, lectures[1].attributes.title), undefined);
  assert.equal(row(tree, courses[2].attributes.title), undefined);
  assert.match(require('react-dom/server').renderToStaticMarkup(s.search('missing-query')), /No matching lectures found/);
});

test('course search keeps chapter targets and single selection working', () => {
  const s = selector({ selectLectures: false, selectChapters: true, multiple: false, value: '' });
  const tree = s.search('إنتاج');
  row(tree, chapters[0].attributes.title).props.onClick(click);
  assert.equal(s.changes.at(-1), '30');
});

test('ordinary course selection still supports parent search, select and deselect', () => {
  const s = selector({ selectLectures: false });
  let tree = s.search('الفرقة الثانية');
  row(tree, courses[1].attributes.title).props.onClick(click);
  assert.deepEqual(s.changes.at(-1), ['11']);
  tree = s.render();
  row(tree, courses[1].attributes.title).props.onClick(click);
  assert.deepEqual(s.changes.at(-1), []);
});

for (const folder of ['(admin)', '(doctor)/doctor']) {
  const page = readFileSync(resolve(__dirname, `../../../app/${folder}/departments/page.tsx`), 'utf8');
  const ast = ts.createSourceFile('page.tsx', page, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let modal, submit;
  function visit(node) {
    if (ts.isFunctionDeclaration(node) && node.name?.text === 'CopyMoveModal') modal = node.getText(ast);
    if (ts.isVariableDeclaration(node) && node.name.getText(ast) === 'handleCopyMoveSubmit') submit = node.getText(ast);
    ts.forEachChild(node, visit);
  }
  visit(ast);

  for (const mode of ['copy', 'move']) test(`${folder} ${mode} modal sends searched selections to the existing lesson API flow`, async () => {
    const vm = require('node:vm');
    const marker = () => null;
    const loaded = { exports: {} };
    const compile = code => ts.transpileModule(code, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
    }).outputText;
    vm.runInNewContext(compile(`${modal}\nmodule.exports = CopyMoveModal;`), {
      module: loaded, exports: loaded.exports, require, useLocale: () => 'ar', useMemo: fn => fn(), CourseTreeSelect: marker,
      X: () => null, Loader2: () => null,
    });
    const node = { data: { id: '99', attributes: { title: 'Source lesson', lecture_id: 20 } } };
    let selectedTargets = [], confirmed = false;
    const renderModal = () => loaded.exports({ node, mode, courses,
      lecturesByCourse: { 10: [lectures[0]], 11: lectures.slice(1, 3), 12: [lectures[3]] },
      selectedTargets, onSelectTargets: value => { selectedTargets = value; }, onClose() {}, onConfirm: () => { confirmed = true; }, isLoading: false });
    let tree = renderModal();
    const confirm = view => elements(view).filter(element => element.type === 'button').at(-1);
    assert.equal(confirm(tree).props.disabled, true);
    const picker = elements(tree).find(element => element.type === marker);
    const s = selector(picker.props);
    let results = s.search('إنتاج');
    row(results, lectures[1].attributes.title).props.onClick(click);
    results = s.render();
    row(results, lectures[2].attributes.title).props.onClick(click);
    assert.deepEqual(selectedTargets, ['21', '22']);
    tree = renderModal();
    assert.equal(confirm(tree).props.disabled, false);
    confirm(tree).props.onClick(); assert.equal(confirmed, true);

    const requests = [], output = { exports: {} };
    let refetched = false, closed = false;
    vm.runInNewContext(compile(`const ${submit};\nmodule.exports = handleCopyMoveSubmit;`), {
      module: output, exports: output.exports, copyMoveNode: node, selectedTargetLectures: selectedTargets, copyMoveMode: mode,
      api: { chapters: { get: async id => { assert.equal(id, 99); return { data: { attributes: { attachments: [] } } }; }, delete: async id => requests.push(['delete', id]) } },
      copyChapter: async (id, target) => { requests.push(['copy', id, target]); return { id: String(target), attributes: {} }; },
      toast: { success() {}, error: message => assert.fail(message) },
      setCopyMoveModalOpen: value => { closed = value === false; }, setCopyMoveNode() {}, setSelectedTargetLectures() {},
      refetchAll: () => { refetched = true; },
    });
    await output.exports();
    assert.deepEqual(requests, [['copy', 99, 21], ['copy', 99, 22], ...(mode === 'move' ? [['delete', 99]] : [])]);
    assert.equal(closed, true); assert.equal(refetched, true);
  });
}

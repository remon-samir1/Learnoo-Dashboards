const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const ts = require('typescript');

function renderChart(name, data) {
  const compiled = ts.transpileModule(readFileSync(join(__dirname, `${name}.tsx`), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  const chart = { exports: {} };
  new Function('require', 'module', 'exports', compiled)(
    (id) => id === 'next-intl' ? { useLocale: () => 'en' } : require(id), chart, chart.exports,
  );
  return renderToStaticMarkup(React.createElement(chart.exports.default, { data }));
}

test('Owner charts render the dashboard API labels and datasets without crashing or clipping large values', () => {
  const activity = renderChart('ActivityChart', {
    labels: ['Mon', 'Tue'],
    datasets: [{ label: 'Student Activity', data: [5000, 100] }, { label: 'Revenue (EGP)', data: [12000, 600] }],
  });
  assert.match(activity, /Mon/);
  assert.match(activity, /Tue/);
  assert.match(activity, /viewBox="0 0 640 200"/);
  assert.match(activity, />5000</);
  assert.match(activity, />12000</);
  assert.doesNotMatch(activity, /NaN|Invalid Date|cy="-/);
  const engagement = renderChart('EngagementChart', {
    labels: ['Mon', 'Tue'], datasets: [{ label: 'Course Engagement', data: [2000, 1000] }],
  });
  assert.match(engagement, /height:100%/);
  assert.match(engagement, /height:50%/);
  assert.match(engagement, />2000</);
});

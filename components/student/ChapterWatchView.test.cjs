const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const ts = require('typescript');

test('a preparing video can become ready without refreshing an established source', () => {
  const source = readFileSync(join(__dirname, 'ChapterWatchView.tsx'), 'utf8');
  const effect = source.match(/useEffect\(\(\) => \{\n    if \(videoChapterIdRef[\s\S]*?\n  \}, \[[^\]]*\]\);/)[0];
  const compiled = ts.transpileModule(effect, {}).outputText;
  const ref = { current: '57' };
  let stable = '';
  const run = new Function('useEffect', 'videoChapterIdRef', 'chapter', 'stableVideoSrc', 'videoSrc', 'setStableVideoSrc', compiled);
  const update = (id, url) => run(fn => fn(), ref, { id }, stable, url, value => { stable = value; });
  update('57', '/ready.m3u8');
  assert.equal(stable, '/ready.m3u8');
  update('57', '/renewed-signature.m3u8');
  assert.equal(stable, '/ready.m3u8');
  update('58', '');
  assert.equal(stable, '');
  update('58', '/next-ready.m3u8');
  assert.equal(stable, '/next-ready.m3u8');
});

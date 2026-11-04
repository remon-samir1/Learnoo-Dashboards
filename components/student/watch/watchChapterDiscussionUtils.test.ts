import assert from 'node:assert/strict';
import test from 'node:test';

import { buildDiscussionTree } from './watchChapterDiscussionUtils.ts';

type Row = {
  id?: string | number;
  attributes?: { parent_id?: number | null; replies?: Row[] };
  replies?: Row[];
};

/** `root > reply > reply`, the thread the bug report showed. */
function depths(nodes: Row[]): Array<string | number | undefined> {
  const out: Array<string | number | undefined> = [];
  const walk = (rows: Row[]) => {
    for (const row of rows) {
      out.push(row.id);
      walk(row.replies ?? []);
    }
  };
  walk(nodes);
  return out;
}

test('threads a chapter payload, where every level is its own row', () => {
  const tree = buildDiscussionTree<Row>([
    { id: 1, attributes: { parent_id: null } },
    { id: 2, attributes: { parent_id: 1 } },
    { id: 3, attributes: { parent_id: 2 } },
  ]);

  assert.equal(tree.length, 1);
  assert.deepEqual(depths(tree), [1, 2, 3]);
});

test('threads a list payload, where the staff endpoint nests the replies', () => {
  // The regression: the reply to the reply stayed in `attributes.replies` of a
  // nested node, and the staff pages render `replies`, so it never showed.
  const tree = buildDiscussionTree<Row>([
    {
      id: 1,
      attributes: {
        parent_id: null,
        replies: [
          { id: 2, attributes: { parent_id: 1, replies: [{ id: 3, attributes: { parent_id: 2 } }] } },
        ],
      },
    },
  ]);

  assert.equal(tree.length, 1);
  assert.deepEqual(depths(tree), [1, 2, 3]);
  assert.equal(tree[0].replies?.[0]?.replies?.length, 1);
});

test('a reply whose parent arrived only nested still finds it', () => {
  const tree = buildDiscussionTree<Row>([
    { id: 1, attributes: { parent_id: null, replies: [{ id: 2, attributes: { parent_id: 1 } }] } },
    { id: 3, attributes: { parent_id: 2 } },
  ]);

  assert.deepEqual(depths(tree), [1, 2, 3]);
});

test('no row is both a root and somebody’s reply', () => {
  const tree = buildDiscussionTree<Row>([
    { id: 1, attributes: { parent_id: null, replies: [{ id: 2, attributes: { parent_id: 1 } }] } },
    // The same reply, repeated as a row of its own by a payload that sends both.
    { id: 2, attributes: { parent_id: 1 } },
  ]);

  assert.equal(tree.length, 1);
  assert.deepEqual(depths(tree), [1, 2]);
});

test('a nested reply that names no parent is not duplicated as a root', () => {
  const tree = buildDiscussionTree<Row>([
    { id: 1, attributes: { parent_id: null, replies: [{ id: 2, attributes: {} }] } },
  ]);

  assert.deepEqual(depths(tree), [1, 2]);
});

test('a row nested inside itself does not hang the walk', () => {
  const loop: Row = { id: 1, attributes: { parent_id: null } };
  loop.attributes!.replies = [loop];

  assert.deepEqual(depths(buildDiscussionTree<Row>([loop])), [1]);
});

test('a discussion with no replies stays a bare root', () => {
  assert.deepEqual(depths(buildDiscussionTree<Row>([{ id: 1, attributes: { parent_id: null } }])), [1]);
  assert.deepEqual(buildDiscussionTree<Row>([]), []);
});

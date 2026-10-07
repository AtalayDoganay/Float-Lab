import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildIndex, search } from '../src/renderer/logic/search.mjs';
import { HANDBOOK_ENTRIES, ALIAS_GROUPS } from '../src/renderer/content/handbook.mjs';

const index = buildIndex(HANDBOOK_ENTRIES, ALIAS_GROUPS);

test('an empty or whitespace query asks for a search term instead of returning everything', () => {
  for (const q of ['', '   ', '\t']) {
    const r = search(index, q);
    assert.equal(r.kind, 'empty');
    assert.deepEqual(r.results, []);
  }
});

test('netmask finds the subnet-mask concept through its alias and shows where it matched', () => {
  const r = search(index, 'netmask');
  assert.equal(r.kind, 'results');
  const ids = r.results.map((x) => x.id);
  assert.ok(ids.includes('concept:netmask'), `got ${ids.slice(0, 5).join(', ')}`);
  const top = r.results[0];
  assert.ok(top.excerpt.length > 0);
  assert.ok(top.matchedTerms.length > 0);
});

test('pc mac finds entries about PC•MACs despite the bullet and spacing', () => {
  const r = search(index, 'pc mac');
  assert.equal(r.kind, 'results');
  assert.ok(r.results.map((x) => x.id).includes('concept:pcmacs'));
  const bullet = search(index, 'PC•MACs');
  assert.ok(bullet.results.map((x) => x.id).includes('concept:pcmacs'));
});

test('dmx finds the channel concept and the axis selector control', () => {
  const r = search(index, 'dmx');
  const ids = r.results.map((x) => x.id);
  assert.ok(ids.includes('concept:channel'));
  assert.ok(ids.includes('control:axis-select'));
});

test('gibberish reports no results', () => {
  const r = search(index, 'zxqvwkplm');
  assert.equal(r.kind, 'none');
  assert.deepEqual(r.results, []);
});

test('title matches outrank body-only matches', () => {
  const small = buildIndex(
    [
      { id: 'a', type: 'concept', title: 'Gateway', body: 'Routes traffic to other networks.', evidence: 'manual' },
      { id: 'b', type: 'concept', title: 'IP address', body: 'The gateway is the exit toward other networks.', evidence: 'manual' },
    ],
    [],
  );
  const r = search(small, 'gateway');
  assert.deepEqual(r.results.map((x) => x.id), ['a', 'b']);
  assert.ok(r.results[0].score > r.results[1].score);
});

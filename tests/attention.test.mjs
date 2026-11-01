import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAttention } from '../src/renderer/logic/attention.mjs';

const make = (opts) => createAttention({ dwellMs: 350, repeatMs: 4000, speakAfterMs: 1500, ...opts });

test('a reaction fires only after the pointer has dwelt on the element', () => {
  const a = make();
  a.enter('start', 'start-btn', 0);
  assert.equal(a.update(0.3).react, null, 'not before the dwell (seconds)');
  const r = a.update(0.36).react;
  assert.ok(r && r.kind === 'start' && r.expression === 'alertness' && r.line === null, JSON.stringify(r));
  assert.equal(a.update(0.5).react, null, 'a reaction is delivered once');
});

test('leaving before the dwell cancels the reaction', () => {
  const a = make();
  a.enter('continue', 'c', 0);
  a.leave(0.2);
  assert.equal(a.update(0.4).react, null);
});

test('the same element never reacts twice within the repeat gap', () => {
  const a = make();
  a.enter('start', 's', 0);
  assert.ok(a.update(0.4).react);
  a.leave(0.5);
  a.enter('start', 's', 1);
  assert.equal(a.update(1.4).react, null, 'too soon');
  a.leave(1.5);
  a.enter('start', 's', 4.5);
  assert.ok(a.update(4.9).react, 'after the gap it reacts again');
});

test('a disabled Continue only earns a glance, never a line or a sound', () => {
  const a = make();
  a.enter('continue-disabled', 'c', 0);
  const r = a.update(0.4).react;
  assert.ok(r && r.kind === 'continue-disabled' && r.expression === 'neutral' && r.line === null && r.chirp === false, JSON.stringify(r));
  assert.equal(a.update(3).react, null, 'no later line either');
});

test('a photo gets a look, then its caption after a long dwell', () => {
  const a = make();
  a.enter('photo', 'p', 0, { caption: '2025 · Nessie’s Lakeside Laughs · Leishman Public Spirit Award' });
  const look = a.update(0.4).react;
  assert.ok(look && look.expression === 'wonder' && look.line === null && look.chirp === false);
  assert.equal(a.update(1.4).react, null);
  const say = a.update(1.6).react;
  assert.ok(say && say.line === '2025 · Nessie’s Lakeside Laughs · Leishman Public Spirit Award' && say.chirp === true, JSON.stringify(say));
  assert.equal(a.update(5).react, null, 'said once');
});

test('kinds map to the brief’s reactions: Start eager, Continue welcoming, Help reassuring', () => {
  const kinds = { start: 'alertness', continue: 'satisfaction', help: 'reassuring', photo: 'wonder', 'continue-disabled': 'neutral' };
  for (const [kind, expression] of Object.entries(kinds)) {
    const a = make();
    a.enter(kind, kind, 0);
    assert.equal(a.update(0.4).react.expression, expression, kind);
  }
  const chirps = { start: true, continue: true, help: true, 'continue-disabled': false };
  for (const [kind, chirp] of Object.entries(chirps)) {
    const a = make();
    a.enter(kind, kind, 0);
    assert.equal(a.update(0.4).react.chirp, chirp, `${kind} chirp`);
  }
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRestartGuard, GUARD_LINES } from '../src/renderer/logic/restart-guard.mjs';

function clock(start = 0) {
  let t = start;
  return { now: () => t, set: (v) => { t = v; }, add: (ms) => { t += ms; } };
}
const make = (c, opts = {}) => createRestartGuard({ now: c.now, unlockMs: 5000, ...opts });
// Tickle her and let her finish moving away.
const reveal = (g) => { g.tickle(); g.cleared(); };

test('opens guarded with the initial line and the hint; Restart cannot be activated', () => {
  const c = clock();
  const g = make(c);
  g.open();
  const s = g.state();
  assert.equal(s.phase, 'guarded');
  assert.equal(s.line.id, 'initial');
  assert.equal(s.line.text, 'Hold on! You’ve already made progress. Are you sure you want to start your training over?');
  assert.equal(s.hint, 'Tickle Rosie to reveal Restart.');
  assert.equal(s.deadline, null);
  assert.deepEqual(g.activate(), { ok: false, reason: 'guarded' });
});

test('a tickle consumes the click, and the window opens only once she has cleared the button', () => {
  const c = clock(100);
  const g = make(c);
  g.open();
  g.tickle();
  assert.equal(g.state().phase, 'tickling');
  assert.deepEqual(g.activate(), { ok: false, reason: 'tickling' }, 'the tickle itself never restarts');
  c.add(700);
  g.cleared();
  const s = g.state();
  assert.equal(s.phase, 'unlocked');
  assert.equal(s.deadline, 800 + 5000, 'five seconds from the moment the button is exposed');
  assert.equal(s.remainingMs, 5000);
});

test('activation is valid while now < deadline: 4.9 s yes, 5.0 s no, 5.1 s no', () => {
  for (const [at, ok] of [[4900, true], [5000, false], [5100, false]]) {
    const c = clock(0);
    const g = make(c);
    g.open();
    reveal(g);
    c.set(at);
    const r = g.activate();
    assert.equal(r.ok, ok, `at ${at} ms`);
    if (!ok) assert.equal(r.reason, 'expired');
  }
});

test('a confirmed restart happens once: a second activation is refused', () => {
  const c = clock();
  const g = make(c);
  g.open();
  reveal(g);
  c.add(1000);
  assert.deepEqual(g.activate(), { ok: true });
  assert.equal(g.state().phase, 'done');
  assert.deepEqual(g.activate(), { ok: false, reason: 'done' });
});

test('after the window passes, tick re-guards, counts the timeout, and picks the first-timeout lines', () => {
  const c = clock();
  const g = make(c);
  g.open();
  reveal(g);
  c.set(5001);
  g.tick();
  let s = g.state();
  assert.equal(s.phase, 'guarded');
  assert.equal(s.timeouts, 1);
  assert.equal(s.line.text, 'Hey—are you really sure? I can still take you back to where you left off.');
  g.tickle();
  assert.equal(g.state().line.text, 'Hehe! Okay, five seconds. Your call!');
  g.cleared();
  assert.equal(g.state().phase, 'unlocked');
  c.set(5001 + 6000);
  g.tick();
  s = g.state();
  assert.equal(s.timeouts, 2);
  assert.equal(s.line.text, 'Another tickle? I think you’ve discovered my weakness, not the Restart button.');
  g.tickle();
  assert.equal(g.state().line.text, 'All right, all right—button’s clear!');
  g.cleared();
  c.set(5001 + 6000 + 6000);
  g.tick();
  const third = g.state().line.id;
  assert.notEqual(third, s.line.id, 'the same line is never repeated immediately');
  assert.ok(third.startsWith('timeout'), third);
});

test('tick before the deadline changes nothing', () => {
  const c = clock();
  const g = make(c);
  g.open();
  reveal(g);
  c.set(4000);
  g.tick();
  assert.equal(g.state().phase, 'unlocked');
  assert.equal(g.state().remainingMs, 1000);
});

test('losing focus re-locks at once without counting a timeout', () => {
  const c = clock();
  const g = make(c);
  g.open();
  reveal(g);
  g.blur();
  const s = g.state();
  assert.equal(s.phase, 'guarded');
  assert.equal(s.timeouts, 0);
  assert.equal(s.deadline, null);
  assert.deepEqual(g.activate(), { ok: false, reason: 'guarded' });
});

test('a later separate restart attempt opens with the real last-activity date; a finished course is acknowledged', () => {
  const c = clock();
  const when = '2026-10-31T14:02:00.000Z';
  const again = make(c, { restarts: { count: 1, lastAt: '2026-10-30T10:00:00.000Z' }, lastActivityAt: when });
  again.open();
  assert.equal(again.state().line.id, 'again');
  assert.equal(again.state().line.text, `Back at the beginning again? Your last training activity was ${new Date(when).toLocaleString()}. Want a fresh run, or shall we continue?`);
  again.tickle();
  assert.equal(again.state().line.text, 'Fresh start, fresh notebook. You’ve got five seconds!');
  const finished = make(c, { completed: true });
  finished.open();
  assert.equal(finished.state().line.text, 'Finished already and coming back for another run? I like your enthusiasm!');
  const first = make(c, { restarts: { count: 0, lastAt: null } });
  first.open();
  assert.equal(first.state().line.id, 'initial', 'a learner who never restarted is not told they did');
});

test('close cancels everything and a reopen starts guarded again', () => {
  const c = clock();
  const g = make(c);
  g.open();
  reveal(g);
  g.close();
  assert.equal(g.state().phase, 'closed');
  g.open();
  assert.equal(g.state().phase, 'guarded');
  assert.equal(g.state().deadline, null);
  assert.ok(Object.keys(GUARD_LINES).length >= 8);
});

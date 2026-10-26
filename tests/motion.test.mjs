import { test } from 'node:test';
import assert from 'node:assert/strict';
import { springStep, bank, squashAt, nextBlinkDelay, blinkAmount, talkEnvelope, idleBob, settled } from '../src/renderer/logic/motion.mjs';

test('the spring converges on its target within two seconds without overshooting', () => {
  let s = { x: 0, v: 0 };
  let maxX = 0;
  for (let i = 0; i < 120; i += 1) {
    s = springStep(s, 100, 1 / 60);
    maxX = Math.max(maxX, s.x);
  }
  assert.ok(Math.abs(s.x - 100) < 0.5, `settles: ${s.x}`);
  assert.ok(maxX <= 101, `never overshoots by more than 1: ${maxX}`);
});

test('the spring clamps a long frame to 50 ms', () => {
  const a = springStep({ x: 0, v: 0 }, 100, 5);
  const b = springStep({ x: 0, v: 0 }, 100, 0.05);
  assert.deepEqual(a, b);
});

test('banking leans into the motion and is clamped', () => {
  const r = bank(400, 0);
  assert.ok(r.roll < 0 && r.roll >= -0.35, `rolls into a rightward move: ${r.roll}`);
  assert.equal(r.pitch, 0);
  const c = bank(-9999, 9999);
  assert.equal(c.roll, 0.35);
  assert.equal(c.pitch, 0.35);
});

test('the arrival squash is a brief bounce', () => {
  assert.deepEqual(squashAt(0), { sx: 1, sy: 1 });
  assert.deepEqual(squashAt(0.3), { sx: 1, sy: 1 });
  const mid = squashAt(0.1);
  assert.ok(mid.sy < 1 && mid.sx > 1, JSON.stringify(mid));
});

test('blinks come every 2.5 to 5 seconds and last 160 ms', () => {
  assert.equal(nextBlinkDelay(() => 0), 2.5);
  assert.ok(nextBlinkDelay(() => 0.999) < 5);
  assert.equal(blinkAmount(0), 0);
  assert.equal(blinkAmount(0.08), 1);
  assert.equal(blinkAmount(0.2), 0);
});

test('talking lasts about a second and then stops', () => {
  const mid = talkEnvelope(0.5);
  assert.equal(mid.active, true);
  assert.ok(mid.mouth >= 0 && mid.mouth <= 1);
  const end = talkEnvelope(1.1);
  assert.equal(end.active, false);
  assert.equal(end.mouth, 0);
  assert.equal(end.nod, 0);
  assert.equal(talkEnvelope(-1).active, false);
});

test('the idle bob starts at rest and stays small', () => {
  assert.deepEqual(idleBob(0), { y: 0, yaw: 0 });
  const b = idleBob(1);
  assert.ok(Math.abs(b.y) <= 0.06 && Math.abs(b.yaw) <= 0.08);
});

test('settled means close and slow', () => {
  assert.equal(settled({ x: 100.2, v: 0 }, 100), true);
  assert.equal(settled({ x: 90, v: 0 }, 100), false);
  assert.equal(settled({ x: 100, v: 50 }, 100), false);
});

test('springAdvance covers a long frame in real time by sub-stepping', async () => {
  const { springAdvance } = await import('../src/renderer/logic/motion.mjs');
  const a = springAdvance({ x: 0, v: 0 }, 100, 0.5);
  let b = { x: 0, v: 0 };
  for (let i = 0; i < 10; i += 1) b = springStep(b, 100, 0.05);
  assert.ok(Math.abs(a.x - b.x) < 1e-9 && Math.abs(a.v - b.v) < 1e-9, 'ten 50 ms steps');
  assert.ok(Math.abs(springAdvance({ x: 0, v: 0 }, 100, 1.5).x - 100) < 0.05, 'settles within 1.5 s even in one call');
  assert.deepEqual(springAdvance({ x: 0, v: 0 }, 100, 1 / 60), springStep({ x: 0, v: 0 }, 100, 1 / 60));
});

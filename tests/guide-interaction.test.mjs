import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInteraction, SLEEP_AFTER, BOOP_FOR, GIGGLE_FOR, DIZZY_FOR, STARTLE_FOR, PET_LINGER, IDLE_ACTIONS } from '../src/renderer/logic/guide-interaction.mjs';

const BOX = { x: 100, y: 100, w: 228, h: 268 };
const ON = { x: 214, y: 200 }; // on her head
const OFF = { x: 900, y: 900 }; // far away
const make = (random = () => 0.5) => createInteraction({ random });

test('she rests, notices a near pointer, and perks up when it rests on her', () => {
  const it = make();
  assert.equal(it.update(0).mood, 'none');
  it.pointerMove({ x: BOX.x + BOX.w + 60, y: 200, clock: 1, box: BOX });
  const near = it.update(1);
  assert.equal(near.mood, 'notice');
  assert.ok(near.near > 0.35 && near.near < 1, `near: ${near.near}`);
  assert.ok(near.toward.x > 0, 'she turns toward the pointer on her right');
  it.pointerMove({ ...ON, clock: 2, box: BOX });
  const hover = it.update(2);
  assert.equal(hover.mood, 'hover');
  assert.equal(hover.hover, true);
  assert.equal(hover.near, 1);
  it.pointerMove({ ...OFF, clock: 3, box: BOX });
  assert.equal(it.update(3).mood, 'none');
  it.pointerMove({ ...ON, clock: 4, box: BOX });
  it.pointerLeave();
  assert.equal(it.update(4).mood, 'none', 'the pointer leaving the window ends the hover');
  it.pointerMove({ ...ON, clock: 5, box: null });
  assert.equal(it.update(5).mood, 'none', 'before she is placed nothing is near her');
});

test('a press on her is a boop, then a giggle; a press on a control is not', () => {
  const it = make();
  assert.equal(it.pointerDown({ ...ON, clock: 1, box: BOX, interactive: true }), false, 'a control under the pointer keeps the click');
  assert.equal(it.update(1).mood, 'none');
  assert.equal(it.pointerDown({ ...OFF, clock: 1, box: BOX }), false);
  assert.equal(it.pointerDown({ ...ON, clock: 2, box: BOX }), true);
  const boop = it.update(2.1);
  assert.equal(boop.mood, 'boop');
  assert.ok(Math.abs(boop.since - 0.1) < 1e-9);
  assert.equal(it.update(2 + BOOP_FOR + 0.01).mood, 'giggle');
  assert.equal(it.update(2 + BOOP_FOR + GIGGLE_FOR + 0.02).mood, 'none');
});

test('three quick boops make her dizzy until it wears off', () => {
  const it = make();
  it.pointerDown({ ...ON, clock: 1, box: BOX });
  it.pointerDown({ ...ON, clock: 1.4, box: BOX });
  assert.equal(it.update(1.5).mood, 'boop', 'a second boop restarts the boop');
  it.pointerDown({ ...ON, clock: 1.8, box: BOX });
  assert.equal(it.update(1.9).mood, 'dizzy');
  assert.equal(it.pointerDown({ ...ON, clock: 2, box: BOX }), false, 'no boops while dizzy');
  assert.equal(it.update(1.8 + DIZZY_FOR - 0.1).mood, 'dizzy');
  assert.equal(it.update(1.8 + DIZZY_FOR + 0.1).mood, 'none');
  // Spread out, boops never add up to dizzy.
  const slow = make();
  for (const t of [10, 12, 14]) slow.pointerDown({ ...ON, clock: t, box: BOX });
  assert.equal(slow.update(14.1).mood, 'boop');
});

test('stroking back and forth across her head is petting', () => {
  const it = make();
  let clock = 1;
  const xs = [180, 220, 180, 220, 180];
  for (const x of xs) { it.pointerMove({ x, y: 160, clock, box: BOX }); clock += 0.1; }
  const last = clock - 0.1; // the last stroke
  const pet = it.update(clock);
  assert.equal(pet.mood, 'pet');
  assert.equal(it.update(last + PET_LINGER - 0.1).mood, 'pet', 'it lingers a moment after the last stroke');
  assert.equal(it.update(last + PET_LINGER + 0.1).mood, 'hover', 'then she is back to a hover: the pointer still rests on her');
  // Strokes low on her (her body) do not count; a hover does not either.
  const body = make();
  clock = 1;
  for (const x of xs) { body.pointerMove({ x, y: 340, clock, box: BOX }); clock += 0.1; }
  assert.equal(body.update(clock).mood, 'hover');
  // One direction only is not petting.
  const slide = make();
  clock = 1;
  for (const x of [150, 180, 210, 240, 270]) { slide.pointerMove({ x, y: 160, clock, box: BOX }); clock += 0.1; }
  assert.equal(slide.update(clock).mood, 'hover');
});

test('she dozes after a long quiet spell and wakes with a startle', () => {
  const it = make();
  it.pointerMove({ ...OFF, clock: 0, box: BOX });
  assert.equal(it.update(SLEEP_AFTER - 1).mood, 'none');
  assert.equal(it.update(SLEEP_AFTER + 1).mood, 'sleep');
  it.pointerMove({ ...OFF, clock: SLEEP_AFTER + 2, box: BOX });
  assert.equal(it.update(SLEEP_AFTER + 2).mood, 'startle');
  assert.equal(it.update(SLEEP_AFTER + 2 + STARTLE_FOR + 0.1).mood, 'none');
  // New words or a new place keep her awake too.
  const busy = make();
  busy.activity(SLEEP_AFTER - 5);
  assert.equal(busy.update(SLEEP_AFTER + 5).mood, 'none');
  assert.equal(busy.update(SLEEP_AFTER * 2).mood, 'sleep');
  busy.activity(SLEEP_AFTER * 2 + 1);
  assert.equal(busy.update(SLEEP_AFTER * 2 + 1).mood, 'startle');
});

test('idle actions play now and then while she is calm, never under reduced motion', () => {
  const picks = [0.5, 0.0, 0.99, 0.5, 0.5, 0.5];
  let i = 0;
  const it = createInteraction({ random: () => picks[i++ % picks.length] });
  it.pointerMove({ ...OFF, clock: 0, box: BOX });
  const first = it.update(0);
  assert.equal(first.idle, null, 'not at once');
  // The first gap is 6 + 0.5 * 6 = 9 s; the next random (0.0) picks the first action.
  assert.equal(it.update(8.9).idle, null);
  const idle = it.update(9.1).idle;
  assert.ok(idle && idle.action === 'glance', JSON.stringify(idle));
  assert.ok(idle.since < 1e-9, 'it starts on the frame that picks it');
  assert.equal(it.update(9.1 + IDLE_ACTIONS.glance + 0.01).idle, null, 'it ends on time');
  // A boop interrupts any idle action and reduced motion suppresses them.
  const r = make(() => 0);
  r.pointerMove({ ...OFF, clock: 0, box: BOX });
  r.update(0);
  assert.equal(r.update(6.1, { reduced: true }).idle, null);
  const b = make(() => 0);
  b.pointerMove({ ...OFF, clock: 0, box: BOX });
  b.update(0);
  assert.ok(b.update(6.1).idle, 'an action is playing');
  b.pointerDown({ ...ON, clock: 6.2, box: BOX });
  assert.equal(b.update(6.2).idle, null, 'the boop ends it');
});

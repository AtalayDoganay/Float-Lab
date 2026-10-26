import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ROSIE_BOX, placeBeside, placeAtDock, placeAtCenter, placeAtCorner, visibleBox, intersects, clampRect } from '../src/renderer/logic/guide-placement.mjs';

const VIEW = { w: 1440, h: 900 };
const SMALL = { w: 1024, h: 680 };
const BUBBLE = { w: 320, h: 120 };
const inside = (r, v) => r.x >= 0 && r.y >= 0 && r.x + r.w <= v.w && r.y + r.h <= v.h;
const bubbleRect = (r) => ({ x: r.bubble.x, y: r.bubble.y, w: BUBBLE.w, h: BUBBLE.h });

test('her box is 300 by 340 with a 36 px transparent inset, and the helpers agree', () => {
  assert.deepEqual(ROSIE_BOX, { w: 300, h: 340, inset: 36 });
  assert.deepEqual(visibleBox({ x: 100, y: 50 }), { x: 136, y: 86, w: 228, h: 268 });
  assert.equal(intersects({ x: 0, y: 0, w: 10, h: 10 }, { x: 9, y: 9, w: 5, h: 5 }), true);
  assert.equal(intersects({ x: 0, y: 0, w: 10, h: 10 }, { x: 10, y: 0, w: 5, h: 5 }), false);
  assert.deepEqual(clampRect({ x: -5, y: 890, w: 100, h: 50 }, VIEW), { x: 0, y: 850, w: 100, h: 50 });
});

test('stands to the right of a target with room, facing left, bubble on her right', () => {
  const target = { x: 600, y: 400, w: 80, h: 30 };
  const r = placeBeside({ viewport: VIEW, target, bubble: BUBBLE });
  assert.equal(r.side, 'right');
  assert.equal(r.facing, 'left');
  assert.equal(r.overlapsTarget, false);
  assert.equal(intersects(visibleBox(r), target), false);
  assert.equal(r.bubble.side, 'right');
  assert.ok(inside(bubbleRect(r), VIEW), JSON.stringify(r.bubble));
  assert.equal(intersects(bubbleRect(r), target), false);
  assert.ok(inside(visibleBox(r), VIEW));
});

test('stands to the left when the right has no room', () => {
  const target = { x: 1300, y: 400, w: 120, h: 30 };
  const r = placeBeside({ viewport: VIEW, target, bubble: BUBBLE });
  assert.equal(r.side, 'left');
  assert.equal(r.facing, 'right');
  assert.equal(r.bubble.side, 'left');
  assert.equal(intersects(visibleBox(r), target), false);
  assert.ok(inside(bubbleRect(r), VIEW));
});

test('stands below when neither side has room', () => {
  const target = { x: 40, y: 300, w: 944, h: 40 };
  const r = placeBeside({ viewport: SMALL, target, bubble: BUBBLE });
  assert.equal(r.side, 'below');
  assert.equal(intersects(visibleBox(r), target), false);
  assert.ok(inside(visibleBox(r), SMALL));
  assert.ok(inside(bubbleRect(r), SMALL));
  assert.equal(intersects(bubbleRect(r), target), false);
});

test('flips the bubble when the outer side has no room', () => {
  // She fits to the right of the target, but a bubble on her right would leave the window.
  const target = { x: 560, y: 200, w: 120, h: 40 };
  const r = placeBeside({ viewport: SMALL, target, bubble: BUBBLE });
  assert.equal(r.side, 'right');
  assert.notEqual(r.bubble.side, 'right');
  assert.ok(inside(bubbleRect(r), SMALL), JSON.stringify(r.bubble));
  assert.equal(intersects(bubbleRect(r), target), false);
});

test('avoids the lesson panel when it can', () => {
  const target = { x: 380, y: 300, w: 900, h: 30 };
  const panel = { x: 0, y: 0, w: 360, h: 900 };
  const r = placeBeside({ viewport: VIEW, target, bubble: BUBBLE, avoid: [panel] });
  assert.equal(r.side, 'below');
  assert.equal(intersects(visibleBox(r), panel), false);
  assert.equal(intersects(visibleBox(r), target), false);
});

test('reports when no placement can avoid the target', () => {
  const r = placeBeside({ viewport: SMALL, target: { x: 0, y: 0, w: 1024, h: 680 }, bubble: BUBBLE });
  assert.equal(r.overlapsTarget, true);
  assert.equal(r.side, 'right');
  assert.ok(inside(visibleBox(r), SMALL));
});

test('the dock centres her and puts the bubble to her right', () => {
  const dock = { x: 20, y: 100, w: 320, h: 220 };
  const r = placeAtDock({ dock, viewport: VIEW, bubble: BUBBLE });
  assert.equal(r.side, 'dock');
  assert.equal(r.facing, 'right');
  assert.ok(Math.abs(r.x + 150 - 180) < 1, `centred: ${r.x}`);
  assert.ok(Math.abs(r.y + 170 - 210) < 1, `centred: ${r.y}`);
  assert.equal(r.bubble.side, 'right');
  assert.ok(r.bubble.x >= r.x + 300 - 36);
  assert.ok(inside(bubbleRect(r), VIEW));
});

test('centre and corner placements stay inside the viewport', () => {
  const c = placeAtCenter({ viewport: SMALL, bubble: BUBBLE });
  assert.equal(c.side, 'center');
  assert.ok(inside(visibleBox(c), SMALL) && inside(bubbleRect(c), SMALL), JSON.stringify(c));
  assert.ok(Math.abs(visibleBox(c).x + visibleBox(c).w / 2 - SMALL.w / 2) < 1, 'horizontally centred');
  const k = placeAtCorner({ viewport: SMALL, bubble: BUBBLE });
  assert.equal(k.side, 'corner');
  assert.equal(k.bubble.side, 'left');
  assert.ok(inside(visibleBox(k), SMALL) && inside(bubbleRect(k), SMALL), JSON.stringify(k));
  assert.ok(visibleBox(k).x + visibleBox(k).w > SMALL.w - 60, 'at the right edge');
  assert.ok(visibleBox(k).y + visibleBox(k).h > SMALL.h - 60, 'at the bottom edge');
});

test('stands beside the window that holds the target when beside the target would cover that window', () => {
  const target = { x: 640, y: 205, w: 1090, h: 75 };
  const win = { x: 470, y: 128, w: 1290, h: 240 };
  const panel = { x: 0, y: 0, w: 360, h: 900 };
  const r = placeBeside({ viewport: VIEW, target, bubble: BUBBLE, avoid: [panel, win], clear: win });
  assert.equal(r.side, 'below');
  assert.equal(intersects(visibleBox(r), win), false, 'clear of the window');
  assert.equal(intersects(visibleBox(r), panel), false);
  assert.ok(visibleBox(r).y >= win.y + win.h + 10);
});

test('when nothing is clear she takes the candidate that overlaps the least', () => {
  const target = { x: 640, y: 205, w: 570, h: 100 };
  const win = { x: 470, y: 128, w: 780, h: 330 };
  const panel = { x: 0, y: 0, w: 360, h: 680 };
  const r = placeBeside({ viewport: SMALL, target, bubble: BUBBLE, avoid: [panel, win], clear: win });
  assert.equal(r.side, 'below', JSON.stringify(r));
  assert.equal(intersects(visibleBox(r), target), false);
});

test('when no bubble side is clear the bubble takes the least overlap and never sits on her', () => {
  const view = { w: 1783, h: 974 };
  const target = { x: 495, y: 175, w: 990, h: 460 };
  const bubble = { w: 351, h: 170 };
  const r = placeBeside({ viewport: view, target, bubble });
  assert.equal(r.side, 'right');
  assert.equal(r.bubble.side, 'below', JSON.stringify(r.bubble));
  const b = { x: r.bubble.x, y: r.bubble.y, w: bubble.w, h: bubble.h };
  assert.equal(intersects(b, visibleBox(r)), false, 'the bubble does not cover her');
  assert.ok(inside(b, view));
});

test('the bubble keeps off the panel and the target’s window when another side is clear', () => {
  // She stands below the window that holds the target; a bubble on her left would cover the panel,
  // and the right side is clear, so the bubble goes right even though the left has more room.
  const target = { x: 380, y: 205, w: 400, h: 75 };
  const win = { x: 370, y: 128, w: 840, h: 300 };
  const panel = { x: 0, y: 0, w: 360, h: 900 };
  const bubble = { w: 331, h: 170 };
  const r = placeBeside({ viewport: VIEW, target, bubble, avoid: [panel, win], clear: win });
  assert.equal(r.side, 'below');
  const b = { x: r.bubble.x, y: r.bubble.y, w: bubble.w, h: bubble.h };
  assert.equal(r.bubble.side, 'right', JSON.stringify(r.bubble));
  assert.equal(intersects(b, panel), false, 'bubble off the panel');
  assert.equal(intersects(b, win), false, 'bubble off the window');
  assert.equal(intersects(b, visibleBox(r)), false);
  assert.ok(inside(b, VIEW));
});

test('a stacked bubble slides sideways rather than clip a target that fills the desk', () => {
  // The smallest window with the terminal filling the desk: she can only stand left of it, over the panel,
  // and a bubble below her must slide left so it does not clip the terminal.
  const view = { w: 1012, h: 643 };
  const target = { x: 396, y: 160, w: 564, h: 360 };
  const panel = { x: 0, y: 0, w: 360, h: 643 };
  const bubble = { w: 300, h: 140 };
  const r = placeBeside({ viewport: view, target, bubble, avoid: [panel] });
  assert.equal(r.side, 'left');
  const b = { x: r.bubble.x, y: r.bubble.y, w: bubble.w, h: bubble.h };
  assert.equal(intersects(b, target), false, `bubble off the target: ${JSON.stringify(r.bubble)}`);
  assert.equal(intersects(b, visibleBox(r)), false, 'bubble off her');
  assert.ok(inside(b, view), JSON.stringify(b));
});

test('the bubble keeps off the panel’s action rows (a heavier avoid) when every side costs something', () => {
  // The smallest window with the terminal filling the desk: she stands over the panel; the bubble must
  // not land on the Check / Back / Next rows, so it goes above her instead of below.
  const view = { w: 1012, h: 643 };
  const target = { x: 396, y: 160, w: 564, h: 360 };
  const panel = { x: 0, y: 0, w: 360, h: 643, weight: 1 };
  const rows = { x: 24, y: 470, w: 400, h: 150, weight: 4 };
  const bubble = { w: 300, h: 140 };
  const r = placeBeside({ viewport: view, target, bubble, avoid: [panel, rows] });
  const b = { x: r.bubble.x, y: r.bubble.y, w: bubble.w, h: bubble.h };
  assert.equal(r.bubble.side, 'above', JSON.stringify(r.bubble));
  assert.equal(intersects(b, rows), false, 'off the action rows');
  assert.equal(intersects(b, target), false);
  assert.ok(inside(b, view));
});

test('she keeps off the other recreated windows when a spot beside the target’s window is clear', () => {
  const target = { x: 850, y: 600, w: 190, h: 60 };
  const own = { x: 600, y: 560, w: 450, h: 300 };
  const other = { x: 600, y: 100, w: 900, h: 440 };
  const panel = { x: 0, y: 0, w: 360, h: 900 };
  const withOther = placeBeside({ viewport: VIEW, target, bubble: BUBBLE, avoid: [panel, own, other], clear: own });
  assert.ok(visibleBox(withOther).y >= other.y + other.h, `stands clear of the other window: ${JSON.stringify(visibleBox(withOther))}`);
  assert.equal(intersects(visibleBox(withOther), own), false);
  const without = placeBeside({ viewport: VIEW, target, bubble: BUBBLE, avoid: [panel, own], clear: own });
  assert.ok(visibleBox(without).y < other.y + other.h, 'without it in the list she stands beside the target itself');
});

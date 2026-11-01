import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FACE_SIZE, faceParams, drawFace } from '../src/renderer/guide/face.mjs';

// A 2D context stand-in that records every drawing call and refuses any
// property the real context does not have, so the face never relies on
// something a canvas cannot do.
function stubCtx() {
  const calls = [];
  const allowed = new Set(['fillStyle', 'strokeStyle', 'lineWidth', 'lineCap', 'lineJoin', 'globalAlpha', 'shadowBlur', 'shadowColor', 'font', 'textAlign', 'textBaseline', 'globalCompositeOperation']);
  const state = {};
  const ctx = new Proxy({}, {
    get(_, prop) {
      if (typeof prop === 'symbol') return undefined;
      if (prop === 'createRadialGradient' || prop === 'createLinearGradient') return () => ({ addColorStop() {} });
      if (prop === 'measureText') return () => ({ width: 0 });
      if (prop === 'canvas') return { width: FACE_SIZE, height: FACE_SIZE };
      if (allowed.has(prop)) return state[prop];
      return (...args) => { calls.push({ name: prop, args }); };
    },
    set(_, prop, value) {
      if (!allowed.has(prop)) throw new Error(`unexpected context property ${String(prop)}`);
      state[prop] = value;
      return true;
    },
  });
  return { ctx, calls };
}

const count = (calls, ...names) => calls.filter((c) => names.includes(c.name)).length;
const EXPRESSIONS = ['wave', 'point', 'happy', 'cheer', 'oops', 'idle'];
const MOODS = ['none', 'notice', 'hover', 'boop', 'giggle', 'dizzy', 'pet', 'sleep', 'startle'];

test('the legacy names each map to one face of the palette', () => {
  assert.equal(FACE_SIZE, 512);
  assert.deepEqual(faceParams('wave'), faceParams('joy'));
  assert.deepEqual(faceParams('point'), faceParams('alertness'));
  assert.deepEqual(faceParams('happy'), faceParams('satisfaction'));
  assert.deepEqual(faceParams('cheer'), faceParams('laughter'));
  assert.deepEqual(faceParams('oops'), faceParams('anxiety'));
  assert.deepEqual(faceParams('idle'), faceParams('neutral'));
  assert.deepEqual(faceParams('whatever'), faceParams('neutral'));
  assert.equal(faceParams('cheer').eyeShape, 'closed');
  assert.equal(faceParams('oops').mouth, 'wobble');
});

test('a mood lays its own eyes and mouth over the expression', () => {
  assert.deepEqual(faceParams('point', 'none'), faceParams('point'));
  const hover = faceParams('point', 'hover');
  assert.equal(hover.eyeShape, 'sparkle');
  assert.equal(hover.mouth, 'grin');
  assert.equal(hover.blush, 0.8);
  assert.equal(faceParams('point', 'boop').eyeShape, 'squeeze');
  assert.equal(faceParams('point', 'dizzy').eyeShape, 'dizzy');
  assert.equal(faceParams('point', 'pet').mouth, 'cat');
  assert.equal(faceParams('point', 'sleep').eyeShape, 'sleep');
  assert.equal(faceParams('point', 'startle').eyeShape, 'wide');
  const notice = faceParams('point', 'notice');
  assert.equal(notice.eyeShape, 'round', 'noticing keeps the expression’s eyes');
  assert.ok(notice.blush > faceParams('point').blush, 'with a touch more blush');
});

test('open eyes are drawn as ellipses with highlights, happy eyes as arcs', () => {
  const open = stubCtx();
  drawFace(open.ctx, faceParams('point'), { look: { x: 0, y: 0 }, blink: 0, mouthOpen: 0 });
  assert.ok(count(open.calls, 'ellipse', 'arc') >= 8, `eyes, irises, pupils and highlights: ${count(open.calls, 'ellipse', 'arc')}`);
  const happy = stubCtx();
  drawFace(happy.ctx, faceParams('happy'), { look: { x: 0, y: 0 }, blink: 0, mouthOpen: 0 });
  assert.ok(count(happy.calls, 'arc', 'quadraticCurveTo', 'bezierCurveTo') >= 2, 'curved happy eyes');
  const sparkle = stubCtx();
  drawFace(sparkle.ctx, faceParams('point', 'hover'), { look: { x: 0, y: 0 }, blink: 0, mouthOpen: 0 });
  assert.ok(count(sparkle.calls, 'lineTo') > count(open.calls, 'lineTo'), 'sparkling eyes add a star glint');
});

test('a blink closes the eyes', () => {
  const open = stubCtx();
  drawFace(open.ctx, faceParams('point'), { look: { x: 0, y: 0 }, blink: 0, mouthOpen: 0 });
  const shut = stubCtx();
  drawFace(shut.ctx, faceParams('point'), { look: { x: 0, y: 0 }, blink: 1, mouthOpen: 0 });
  assert.ok(count(shut.calls, 'ellipse') < count(open.calls, 'ellipse'), 'fewer eye ellipses when shut');
  assert.ok(count(shut.calls, 'quadraticCurveTo', 'arc', 'bezierCurveTo') >= 2, 'closed lids are drawn as curves');
});

test('every expression and mood draws without touching anything a canvas lacks', () => {
  for (const name of EXPRESSIONS) {
    for (const mood of MOODS) {
      const { ctx, calls } = stubCtx();
      assert.doesNotThrow(() => drawFace(ctx, faceParams(name, mood), { look: { x: 0.7, y: -0.4 }, blink: 0.3, mouthOpen: 0.8, t: 1.3 }), `${name}/${mood}`);
      assert.ok(count(calls, 'fill', 'stroke') >= 4, `${name}/${mood}: paints something`);
    }
  }
  const { ctx } = stubCtx();
  assert.doesNotThrow(() => drawFace(ctx, faceParams('oops')));
});

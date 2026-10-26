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

test('each expression maps to one face', () => {
  assert.equal(FACE_SIZE, 512);
  assert.deepEqual(faceParams('wave'), { eye: 'open', brow: 'up', mouth: 'grin', blush: 0.5 });
  assert.deepEqual(faceParams('point'), { eye: 'open', brow: 'determined', mouth: 'smile', blush: 0.35 });
  assert.deepEqual(faceParams('happy'), { eye: 'happy', brow: 'none', mouth: 'smile', blush: 0.5 });
  assert.deepEqual(faceParams('cheer'), { eye: 'closed', brow: 'up', mouth: 'open', blush: 1 });
  assert.deepEqual(faceParams('oops'), { eye: 'wide', brow: 'worried', mouth: 'wobble', blush: 0.2 });
  assert.deepEqual(faceParams('idle'), { eye: 'open', brow: 'none', mouth: 'smile', blush: 0.35 });
  assert.deepEqual(faceParams('whatever'), faceParams('idle'));
});

test('open eyes are drawn as ellipses with highlights, happy eyes as arcs', () => {
  const open = stubCtx();
  drawFace(open.ctx, faceParams('point'), { look: { x: 0, y: 0 }, blink: 0, mouthOpen: 0 });
  assert.ok(count(open.calls, 'ellipse', 'arc') >= 4, `eyes and highlights: ${count(open.calls, 'ellipse', 'arc')}`);
  const happy = stubCtx();
  drawFace(happy.ctx, faceParams('happy'), { look: { x: 0, y: 0 }, blink: 0, mouthOpen: 0 });
  assert.ok(count(happy.calls, 'arc', 'quadraticCurveTo', 'bezierCurveTo') >= 2, 'curved happy eyes');
});

test('a blink closes the eyes', () => {
  const open = stubCtx();
  drawFace(open.ctx, faceParams('point'), { look: { x: 0, y: 0 }, blink: 0, mouthOpen: 0 });
  const shut = stubCtx();
  drawFace(shut.ctx, faceParams('point'), { look: { x: 0, y: 0 }, blink: 1, mouthOpen: 0 });
  assert.ok(count(shut.calls, 'ellipse') < count(open.calls, 'ellipse'), 'fewer eye ellipses when shut');
  assert.ok(count(shut.calls, 'quadraticCurveTo', 'arc', 'bezierCurveTo') >= 2, 'closed lids are drawn as curves');
});

test('every expression draws without touching anything a canvas lacks', () => {
  for (const name of ['wave', 'point', 'happy', 'cheer', 'oops', 'idle']) {
    const { ctx, calls } = stubCtx();
    assert.doesNotThrow(() => drawFace(ctx, faceParams(name), { look: { x: 0.7, y: -0.4 }, blink: 0.3, mouthOpen: 0.8, t: 1.3 }), name);
    assert.ok(count(calls, 'fill', 'stroke') >= 4, `${name}: paints something`);
  }
  const { ctx } = stubCtx();
  assert.doesNotThrow(() => drawFace(ctx, faceParams('oops')));
});

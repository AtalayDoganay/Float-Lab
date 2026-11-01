import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../src/renderer/vendor/three/three.module.js';
import { EXPRESSION_NAMES, EXPRESSION_FAMILIES, EXTRA_EXPRESSIONS, faceParams, drawFace, FACE_SIZE } from '../src/renderer/guide/face.mjs';
import { buildRosie, poseFor, applyPose } from '../src/renderer/guide/rosie-model.mjs';

// The brief's chart: six families of four, in intensity order.
const FAMILIES = {
  firmness: ['sternness', 'indignation', 'anger', 'rage'],
  dislike: ['disdain', 'aversion', 'disgust', 'revulsion'],
  worry: ['concern', 'anxiety', 'fear', 'terror'],
  happiness: ['satisfaction', 'amusement', 'joy', 'laughter'],
  sadness: ['dejection', 'melancholy', 'sadness', 'grief'],
  discovery: ['alertness', 'wonder', 'surprise', 'shock'],
};
const NUMERIC = ['browAngle', 'browHeight', 'browCurve', 'eyeOpen', 'pupil', 'mouthWidth', 'mouthOpen', 'blush'];

// Two faces are distinct when a shape differs, a mark differs, or two numeric params differ by at least 0.25.
function distinct(a, b) {
  if (a.eyeShape !== b.eyeShape || a.mouth !== b.mouth) return true;
  if (a.tears !== b.tears || a.sweat !== b.sweat || a.veins !== b.veins || a.teeth !== b.teeth) return true;
  return NUMERIC.filter((k) => Math.abs((a[k] || 0) - (b[k] || 0)) >= 0.25).length >= 2;
}

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
    set(_, prop, value) { if (!allowed.has(prop)) throw new Error(`unexpected context property ${String(prop)}`); state[prop] = value; return true; },
  });
  return { ctx, calls };
}
const count = (calls, ...names) => calls.filter((c) => names.includes(c.name)).length;

test('the palette is the brief’s twenty-four, in six families, plus the five extras', () => {
  assert.deepEqual(EXPRESSION_FAMILIES, FAMILIES);
  assert.deepEqual(EXTRA_EXPRESSIONS, ['neutral', 'curious', 'reassuring', 'sheepish', 'nerdy']);
  assert.equal(EXPRESSION_NAMES.length, 29);
  for (const name of EXPRESSION_NAMES) {
    const p = faceParams(name);
    assert.ok(p && typeof p.eyeShape === 'string' && typeof p.mouth === 'string', name);
  }
});

test('neighbouring intensities differ visibly, and all twenty-four are mutually distinct', () => {
  for (const [family, names] of Object.entries(FAMILIES)) {
    for (let i = 1; i < names.length; i += 1) assert.ok(distinct(faceParams(names[i - 1]), faceParams(names[i])), `${family}: ${names[i - 1]} vs ${names[i]}`);
  }
  const all = Object.values(FAMILIES).flat();
  for (let i = 0; i < all.length; i += 1) {
    for (let j = i + 1; j < all.length; j += 1) assert.ok(distinct(faceParams(all[i]), faceParams(all[j])), `${all[i]} vs ${all[j]}`);
  }
});

test('the families read as described: laughter is open-mouthed with eyes shut, grief has tears, rage shows teeth and veins', () => {
  assert.equal(faceParams('laughter').mouth, 'open');
  assert.equal(faceParams('laughter').eyeShape, 'closed');
  assert.equal(faceParams('grief').tears, true);
  assert.equal(faceParams('rage').teeth, true);
  assert.equal(faceParams('rage').veins, true);
  assert.equal(faceParams('terror').sweat, true);
  assert.ok(faceParams('shock').eyeOpen > faceParams('alertness').eyeOpen, 'eyes widen along the discovery family');
  assert.ok(faceParams('revulsion').browAngle < faceParams('disdain').browAngle, 'brows knit along the dislike family');
});

test('legacy names map onto the palette and old moods still overlay', () => {
  assert.deepEqual(faceParams('cheer'), faceParams('laughter'));
  assert.deepEqual(faceParams('oops'), faceParams('anxiety'));
  assert.deepEqual(faceParams('happy'), faceParams('satisfaction'));
  assert.deepEqual(faceParams('wave'), faceParams('joy'));
  assert.deepEqual(faceParams('point'), faceParams('alertness'));
  assert.deepEqual(faceParams('idle'), faceParams('neutral'));
  assert.equal(faceParams('joy', 'dizzy').eyeShape, 'dizzy');
  assert.equal(faceParams('joy', 'sleep').eyeShape, 'sleep');
});

test('every expression draws silent and speaking, and the speaking face paints more', () => {
  for (const name of EXPRESSION_NAMES) {
    const silent = stubCtx();
    const speaking = stubCtx();
    assert.doesNotThrow(() => drawFace(silent.ctx, faceParams(name), { look: { x: 0.3, y: -0.2 }, blink: 0, mouthOpen: 0 }), name);
    assert.doesNotThrow(() => drawFace(speaking.ctx, faceParams(name), { look: { x: 0.3, y: -0.2 }, blink: 0, mouthOpen: 0.9 }), name);
    assert.ok(count(silent.calls, 'fill', 'stroke') >= 4, `${name} paints`);
    assert.ok(count(speaking.calls, 'fill') > count(silent.calls, 'fill'), `${name}: the speaking mouth paints more`);
  }
});

test('glasses are an accessory on her head, toggled by the pose, never an expression', () => {
  const { parts } = buildRosie(THREE, { faceTexture: new THREE.Texture() });
  assert.ok(parts.glasses, 'a glasses group');
  assert.equal(parts.glasses.parent, parts.head, 'attached to her head so they move with it');
  applyPose(parts, poseFor({ expression: 'alertness', glasses: true }));
  assert.equal(parts.glasses.visible, true);
  applyPose(parts, poseFor({ expression: 'alertness', glasses: false }));
  assert.equal(parts.glasses.visible, false);
  assert.deepEqual(faceParams('nerdy', 'none'), faceParams('nerdy', 'none'), 'glasses do not alter the face table');
  assert.equal(poseFor({ expression: 'joy' }).glasses, false);
});

test('her body is rounder: a broad torso, short rounded arms, and she still fits her canvas', () => {
  const { root, parts } = buildRosie(THREE, { faceTexture: new THREE.Texture() });
  root.updateMatrixWorld(true);
  const torso = new THREE.Box3().setFromObject(parts.body);
  const width = torso.max.x - torso.min.x;
  assert.ok(width >= 0.8, `broad torso: ${width}`);
  const box = new THREE.Box3().setFromObject(root);
  assert.ok(box.max.x - box.min.x <= 2.3 && box.max.y - box.min.y >= 2.3 && box.max.y - box.min.y <= 3.0, `fits: ${box.max.x - box.min.x} × ${box.max.y - box.min.y}`);
  let capsules = 0;
  parts.armL.traverse((o) => { if (o.isMesh && o.geometry instanceof THREE.CapsuleGeometry) capsules += 1; });
  assert.ok(capsules >= 1, 'arms are rounded capsules');
});

test('families carry body language: firmness akimbo, worry hugs in, discovery opens up, sadness droops', () => {
  const rest = poseFor({ expression: 'neutral', reduced: true });
  const stern = poseFor({ expression: 'rage', reduced: true });
  assert.ok(stern.head.pitch > rest.head.pitch, 'chin down');
  const fear = poseFor({ expression: 'fear', reduced: true });
  assert.ok(fear.armL.z > rest.armL.z && fear.armR.z < rest.armR.z, 'arms hugged in');
  const shock = poseFor({ expression: 'shock', reduced: true });
  assert.ok(shock.armL.z > 0.5 && shock.armR.z < -0.5, 'arms thrown out');
  const grief = poseFor({ expression: 'grief', reduced: true });
  assert.ok(grief.root.pitch > 0.15 && grief.head.pitch > 0.1, 'droops');
  assert.ok(poseFor({ expression: 'grief', reduced: true }).root.pitch > poseFor({ expression: 'dejection', reduced: true }).root.pitch, 'the droop grows with intensity');
});

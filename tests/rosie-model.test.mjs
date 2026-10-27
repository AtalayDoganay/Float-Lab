import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../src/renderer/vendor/three/three.module.js';
import { COLORS, BASE_Y, OUTLINE, buildRosie, poseFor, applyPose, makeGradientMap } from '../src/renderer/guide/rosie-model.mjs';

const PARTS = ['head', 'bloom', 'face', 'body', 'armL', 'armR', 'shoulderL', 'shoulderR', 'leaves', 'feet', 'drop'];
const build = () => buildRosie(THREE, { faceTexture: new THREE.Texture() });

test('builds every named part from rounded primitives, cel shaded and inked', () => {
  const { root, parts } = build();
  for (const name of PARTS) {
    assert.ok(parts[name], `part ${name}`);
    assert.equal(root.getObjectByName(name), parts[name], `${name} is named in the tree`);
  }
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  const height = box.max.y - box.min.y;
  const width = box.max.x - box.min.x;
  assert.ok(height >= 2.3 && height <= 3.0, `about 2.7 tall: ${height}`);
  assert.ok(width <= 2.3, `fits her canvas: ${width} wide`);
  assert.ok(Math.abs(box.min.y - root.position.y) <= 0.1, `feet on the ground in her own frame: ${box.min.y - root.position.y}`);
  // Chibi: the bloom (petals included, the lowest of which sit behind her body) is well over half her height.
  const headBox = new THREE.Box3().setFromObject(parts.head);
  const headShare = (headBox.max.y - headBox.min.y) / height;
  assert.ok(headShare >= 0.6 && headShare <= 0.82, `head share: ${headShare}`);
  assert.ok(parts.bloom.children.length >= 15, 'core, two rings of petals, and the curl');
  assert.equal(parts.drop.visible, false);
  assert.ok(typeof COLORS.bloom[0] === 'string' && COLORS.leaf.startsWith('#'));
  assert.ok(OUTLINE > 0.01 && OUTLINE < 0.06);

  let toonMeshes = 0;
  let inked = 0;
  const toons = new Set();
  root.traverse((o) => {
    if (!o.isMesh) return;
    const g = o.geometry;
    assert.ok(!(g instanceof THREE.BoxGeometry), 'no boxes');
    assert.ok(!(g instanceof THREE.PlaneGeometry), 'no flat planes');
    if (g instanceof THREE.CylinderGeometry && !(g instanceof THREE.ConeGeometry)) assert.notEqual(g.parameters.radiusTop, g.parameters.radiusBottom, 'no straight cylinders');
    if (o.material.isMeshToonMaterial) {
      toonMeshes += 1;
      toons.add(o.material);
      assert.ok(o.material.gradientMap && o.material.gradientMap.isTexture, 'every toon material has the band gradient');
      const line = o.children.find((c) => c.isMesh && c.name === 'ink');
      assert.ok(line, 'every shaded piece carries its ink outline');
      assert.equal(line.geometry, o.geometry, 'the outline is the same shape inside out');
      assert.equal(line.material.side, THREE.BackSide);
      assert.ok(line.material.userData.outline, 'marked as an outline');
      inked += 1;
    } else if (o.material.userData.outline) {
      assert.equal(o.name, 'ink');
    } else {
      assert.ok(o.material.isMeshBasicMaterial, 'the face plate and the sweat drop are unlit');
    }
  });
  assert.ok(toonMeshes >= 25, `enough pieces to read as a rose: ${toonMeshes}`);
  assert.equal(inked, toonMeshes);
  assert.ok(toons.size >= 5, `distinct flat colours: ${toons.size}`);
  assert.ok(parts.face.material.map && parts.face.material.transparent, 'the face plate shows the drawn face');
  const grad = makeGradientMap(THREE);
  assert.equal(grad.magFilter, THREE.NearestFilter, 'hard bands');
});

test('poses follow the expression table', () => {
  assert.ok(poseFor({ expression: 'wave', t: 0.3 }).armR.z < -0.5, 'the right arm is raised while waving');
  const pr = poseFor({ expression: 'point', t: 0.5, facing: 'right', reduced: true });
  assert.ok(pr.armR.z < -0.5 && pr.armR.x < -0.5 && pr.root.yaw > 0.2 && pr.head.yaw > 0.1, `points right: ${JSON.stringify(pr)}`);
  const pl = poseFor({ expression: 'point', t: 0.5, facing: 'left', reduced: true });
  assert.ok(pl.armL.z > 0.5 && pl.armL.x < -0.5 && pl.root.yaw < -0.2 && pl.head.yaw < -0.1, `points left: ${JSON.stringify(pl)}`);
  const c = poseFor({ expression: 'cheer', t: 0.6 });
  assert.ok(c.root.y > 0.2, 'hops');
  assert.ok(Math.abs(c.root.yaw - Math.PI) < 0.3, `half way round the spin: ${c.root.yaw}`);
  assert.ok(c.armL.z > 0.8 && c.armR.z < -0.8, 'arms up');
  assert.ok(c.sparkle > 0, 'sparkles while cheering');
  const late = poseFor({ expression: 'cheer', t: 3 });
  assert.ok(late.armL.z > 0.8 && late.armR.z < -0.8 && late.sparkle === 0, 'arms stay up, sparkles stop');
  const o = poseFor({ expression: 'oops', t: 0.5 });
  assert.ok(o.root.pitch > 0.2 && o.drop === true, 'droops with a sweat drop');
  assert.equal(poseFor({ expression: 'happy', t: 0.5 }).drop, false);
  const moving = poseFor({ expression: 'happy', t: 0, phase: 1 });
  const still = poseFor({ expression: 'happy', t: 0, phase: 1, reduced: true });
  assert.notEqual(moving.root.yaw, still.root.yaw, 'reduced motion removes the idle sway');
  assert.equal(poseFor({ expression: 'idle', t: 0, phase: 0, look: { x: 1, y: 0 }, reduced: true }).head.yaw, 0.18, 'the head follows the look');
  assert.equal(poseFor({ expression: 'idle', t: 0, phase: 0, look: { x: 0, y: 1 }, reduced: true }).head.pitch, -0.12);
});

test('moods lay a reaction over the expression', () => {
  const base = { expression: 'idle', t: 1, phase: 0, reduced: true };
  const rest = poseFor(base);
  const notice = poseFor({ ...base, mood: 'notice', toward: { x: 1, y: 0 }, near: 1 });
  assert.ok(notice.root.yaw > rest.root.yaw, 'she turns toward a near pointer');
  const hover = poseFor({ ...base, reduced: false, mood: 'hover', moodT: 1 });
  assert.ok(hover.root.sy > 1.03 && hover.head.pitch < rest.head.pitch && hover.armL.z > rest.armL.z, `perks up: ${JSON.stringify(hover)}`);
  const boop = poseFor({ ...base, reduced: false, mood: 'boop', moodT: 0.22 });
  assert.ok(boop.root.sy < 0.9 && boop.root.sx > 1.08, `squashes: ${JSON.stringify(boop.root)}`);
  const giggle = poseFor({ ...base, reduced: false, mood: 'giggle', moodT: 0.12 });
  assert.ok(giggle.root.y > rest.root.y, 'bounces');
  const dizzy = poseFor({ ...base, reduced: false, mood: 'dizzy', moodT: 0.3 });
  assert.ok(Math.abs(dizzy.root.yaw) > 0.05 && dizzy.armL.z < -1.2 && dizzy.armR.z > 1.2, 'wobbles with arms down');
  const pet = poseFor({ ...base, mood: 'pet', moodT: 0.5 });
  assert.ok(pet.head.pitch > rest.head.pitch, 'leans into the hand');
  const sleep = poseFor({ ...base, mood: 'sleep', moodT: 3 });
  assert.ok(sleep.head.pitch > 0.15, 'the head droops');
  const startle = poseFor({ ...base, reduced: false, mood: 'startle', moodT: 0.3 });
  assert.ok(startle.root.y > 0.1, 'hops awake');
  // Reduced motion keeps the pose still: the face alone carries the mood.
  const quiet = poseFor({ ...base, mood: 'boop', moodT: 0.22 });
  assert.equal(quiet.root.sy, 1);
  assert.equal(quiet.root.sx, 1);
  assert.equal(poseFor({ ...base, mood: 'dizzy', moodT: 0.3 }).root.yaw, 0);
  assert.equal(poseFor({ ...base, mood: 'startle', moodT: 0.3 }).root.y, 0);
});

test('idle actions: a stretch and a wiggle move her, never under reduced motion', () => {
  const rest = poseFor({ expression: 'idle', t: 1, phase: 0, reduced: true });
  const stretch = poseFor({ expression: 'idle', t: 1, phase: 0, idle: { action: 'stretch', since: 0.4 } });
  assert.ok(stretch.root.sy > 1.05 && stretch.armL.z > rest.armL.z, JSON.stringify(stretch));
  const wiggle = poseFor({ expression: 'idle', t: 1, phase: 0, idle: { action: 'wiggle', since: 0.1 } });
  assert.notEqual(wiggle.root.roll, rest.root.roll);
  const quiet = poseFor({ expression: 'idle', t: 1, phase: 0, reduced: true, idle: { action: 'stretch', since: 0.4 } });
  assert.equal(quiet.root.sy, 1);
  const glance = poseFor({ expression: 'idle', t: 1, phase: 0, reduced: true, idle: { action: 'glance', since: 0.4 } });
  assert.deepEqual(glance.root, rest.root, 'a glance is the eyes alone');
});

test('applyPose writes the pose into the parts', () => {
  const { parts } = build();
  applyPose(parts, poseFor({ expression: 'cheer', t: 0.6 }));
  assert.ok(parts.shoulderL.rotation.z > 0.8, `left shoulder raised: ${parts.shoulderL.rotation.z}`);
  assert.ok(parts.shoulderR.rotation.z < -0.8, 'right shoulder raised');
  assert.ok(parts.root.position.y > BASE_Y + 0.2, 'the root hops');
  applyPose(parts, poseFor({ expression: 'oops', t: 0.5, reduced: true }));
  assert.equal(parts.drop.visible, true);
  assert.ok(parts.root.rotation.x > 0.2, 'droops forward');
  applyPose(parts, poseFor({ expression: 'idle', mood: 'boop', moodT: 0.22 }));
  assert.ok(parts.root.scale.y < 0.9 && parts.root.scale.x > 1.08, 'the squash reaches the root');
});

test('reduced motion removes the cheer hop and spin and the wave oscillation', () => {
  const c = poseFor({ expression: 'cheer', t: 0.6, reduced: true });
  assert.equal(c.root.y, 0, 'no hop');
  assert.equal(c.root.yaw, 0, 'no spin');
  assert.ok(c.armL.z > 0.8 && c.armR.z < -0.8, 'arms still up');
  assert.equal(c.sparkle, 0, 'no sparkle burst');
  const w1 = poseFor({ expression: 'wave', t: 0.3, reduced: true });
  const w2 = poseFor({ expression: 'wave', t: 1.0, reduced: true });
  assert.equal(w1.armR.z, w2.armR.z, 'the raised arm holds still');
  assert.ok(w1.armR.z < -0.5, 'but it is raised');
  assert.equal(w1.root.pitch, 0, 'no lean');
});

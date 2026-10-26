import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../src/renderer/vendor/three/three.module.js';
import { COLORS, BASE_Y, buildRosie, poseFor, applyPose } from '../src/renderer/guide/rosie-model.mjs';

const PARTS = ['head', 'bloom', 'face', 'body', 'armL', 'armR', 'shoulderL', 'shoulderR', 'leaves', 'feet', 'tag', 'drop', 'seam'];
const build = () => buildRosie(THREE, { faceTexture: new THREE.Texture() });
const under = (o, ancestor) => { for (let p = o; p; p = p.parent) if (p === ancestor) return true; return false; };

test('builds every named part from soft primitives', () => {
  const { root, parts } = build();
  for (const name of PARTS) {
    assert.ok(parts[name], `part ${name}`);
    assert.equal(root.getObjectByName(name), parts[name], `${name} is named in the tree`);
  }
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  const height = box.max.y - box.min.y;
  assert.ok(height >= 2.3 && height <= 3.0, `about 2.6 tall: ${height}`);
  assert.ok(Math.abs(box.min.y - root.position.y) <= 0.1, `feet on the ground in her own frame: ${box.min.y - root.position.y}`);
  assert.ok(parts.bloom.children.length >= 13, 'core, two rings of petals, and a bud');
  assert.equal(parts.drop.visible, false);
  assert.ok(typeof COLORS.bloom[0] === 'string' && COLORS.leaf.startsWith('#'));

  let meshes = 0;
  const fabrics = new Set();
  root.traverse((o) => {
    if (!o.isMesh) return;
    meshes += 1;
    const g = o.geometry;
    assert.ok(!(g instanceof THREE.BoxGeometry), 'no boxes');
    if (g instanceof THREE.CylinderGeometry && !(g instanceof THREE.ConeGeometry)) assert.notEqual(g.parameters.radiusTop, g.parameters.radiusBottom, 'no straight cylinders (cones taper, capsules are rounded)');
    if (g instanceof THREE.PlaneGeometry) assert.ok(under(o, parts.tag), 'flat planes only on the tag');
    assert.ok(o.material.isMeshPhysicalMaterial || o.material.isMeshStandardMaterial || o.material.isMeshBasicMaterial, 'a known material');
    if (o.material.userData && o.material.userData.fabric) fabrics.add(o.material);
  });
  assert.ok(meshes >= 25, `enough pieces to read as plush: ${meshes}`);
  assert.ok(fabrics.size >= 6, `fabric materials: ${fabrics.size}`);
  for (const m of fabrics) {
    assert.ok(m.isMeshPhysicalMaterial && m.sheen === 1, 'every fabric has full sheen');
    assert.ok(m.roughness >= 0.85, 'fabric is matte');
  }
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

test('applyPose writes the pose into the parts', () => {
  const { parts } = build();
  applyPose(parts, poseFor({ expression: 'cheer', t: 0.6 }));
  assert.ok(parts.shoulderL.rotation.z > 0.8, `left shoulder raised: ${parts.shoulderL.rotation.z}`);
  assert.ok(parts.shoulderR.rotation.z < -0.8, 'right shoulder raised');
  assert.ok(parts.root.position.y > BASE_Y + 0.2, 'the root hops');
  applyPose(parts, poseFor({ expression: 'oops', t: 0.5, reduced: true }));
  assert.equal(parts.drop.visible, true);
  assert.ok(parts.root.rotation.x > 0.2, 'droops forward');
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

import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../src/renderer/vendor/three/three.module.js';
import { buildRobot, robotPose, OPEN_ANGLE } from '../src/renderer/guide/robot-model.mjs';
import { ROBOT_MAPPING, ROBOT_MAPPING_NOTE, robotReadout } from '../src/renderer/content/robot-mapping.mjs';

const outputs = (on) => ({ source: 'show', analogs: [0, 0, 0, 0], lights: { 'light-1': on, 'light-2': false } });

test('the mapping of Digital 0 is a labelled proposal, not a confirmed mechanism', () => {
  assert.equal(ROBOT_MAPPING['light-1'].part, 'petals');
  assert.equal(ROBOT_MAPPING['light-1'].status, 'proposed');
  assert.equal(ROBOT_MAPPING['light-1'].on, 'petals open');
  assert.equal(ROBOT_MAPPING['light-1'].off, 'petals closed');
  assert.equal(ROBOT_MAPPING['light-2'], null);
  assert.ok(/proposed/i.test(ROBOT_MAPPING_NOTE) && /not confirmed/i.test(ROBOT_MAPPING_NOTE) && /Atalay/.test(ROBOT_MAPPING_NOTE));
});

test('the robot follows the simulated output of Digital 0 and nothing else', () => {
  const on = robotPose({ outputs: outputs(true), t: 1 });
  const off = robotPose({ outputs: outputs(false), t: 1 });
  assert.equal(on.petalAngle, OPEN_ANGLE);
  assert.equal(off.petalAngle, 0);
  assert.equal(on.eyeLamp, true);
  assert.equal(off.eyeLamp, false);
  const distracted = robotPose({ outputs: outputs(false), t: 1, selection: { from: 30, to: 60, channels: ['light-1'] }, zoom: 4, pointer: { x: 1, y: 1 } });
  assert.equal(distracted.petalAngle, 0, 'selection, zoom and the pointer never actuate her');
  assert.ok(on.hum >= 0 && on.hum <= 1);
});

test('the readout names the channel, its logical value and the source of the output', () => {
  assert.equal(robotReadout({ outputs: outputs(true), source: 'show', frame: 42 }).value, 'Digital 0: ON (1)');
  assert.equal(robotReadout({ outputs: outputs(false), source: 'hold', frame: 0 }).value, 'Digital 0: OFF (0)');
  assert.equal(robotReadout({ outputs: outputs(true), source: 'show', frame: 42 }).source, 'Following the show at 00:00:01.12');
  assert.equal(robotReadout({ outputs: outputs(false), source: 'hold', frame: 90 }).source, 'Stopped: holding frame 00:00:03.00');
  assert.equal(robotReadout({ outputs: outputs(false), source: 'manual', frame: 0 }).source, 'Manual mode: the Soft Console drives the outputs');
});

test('she is a boxy riveted machine with six hinged petals and no face drawing', () => {
  const { root, parts } = buildRobot(THREE);
  assert.equal(parts.petals.length, 6);
  for (const p of parts.petals) assert.ok(p.isGroup || p.isObject3D, 'each petal is a hinge pivot');
  assert.ok(parts.chassis && parts.head && parts.eyeLamp);
  let boxes = 0;
  let faces = 0;
  root.traverse((o) => {
    if (!o.isMesh) return;
    if (o.geometry instanceof THREE.BoxGeometry) boxes += 1;
    if (o.material && o.material.userData && o.material.userData.face) faces += 1;
    assert.ok(!o.material.isMeshToonMaterial, 'metal, not the guide’s cel shading');
  });
  assert.ok(boxes >= 4, `riveted boxes: ${boxes}`);
  assert.equal(faces, 0);
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  assert.ok(box.max.x - box.min.x <= 2.4, `fits her canvas: ${box.max.x - box.min.x}`);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../src/renderer/vendor/three/three.module.js';
import { createEffects } from '../src/renderer/guide/effects.mjs';

const makeTexture = () => new THREE.Texture();
const POOL = 24 + 10 + 6 + 4;
const setup = () => {
  const parent = new THREE.Group();
  const fx = createEffects(THREE, parent, { makeTexture });
  return { parent, fx, sprites: parent.children.filter((o) => o.isSprite) };
};

test('pools 24 petals, 10 sparkles, 6 hearts and 4 z’s as sprites, all hidden at rest', () => {
  const { parent, fx, sprites } = setup();
  assert.equal(sprites.length, POOL);
  assert.equal(parent.children.length, POOL, 'nothing but sprites');
  assert.ok(sprites.every((s) => s instanceof THREE.Sprite && s.visible === false));
  assert.equal(fx.count(), 0);
});

test('a trail call spawns exactly one petal', () => {
  const { fx } = setup();
  fx.trail(0, 0, 0, 300, 0);
  assert.equal(fx.count(), 1);
  fx.trail(0, 0, 0, 300, 0);
  assert.equal(fx.count(), 2);
});

test('a burst spawns ten sparkles and eight petals', () => {
  const { fx } = setup();
  fx.burst(0, 1, 0);
  assert.equal(fx.count(), 18);
});

test('a boop puffs six sparkles and four petals; petting floats three hearts; dozing one z', () => {
  const { fx, sprites } = setup();
  fx.puff(0, 1, 0);
  assert.equal(fx.count(), 10);
  fx.hearts(0, 1, 0);
  assert.equal(fx.count(), 13);
  const hearts = sprites.filter((s) => s.visible && s.userData.p.kind === 'heart');
  assert.equal(hearts.length, 3);
  assert.ok(hearts.every((h) => h.userData.p.vy > 0 && h.userData.p.gravity === 0), 'hearts rise');
  fx.doze(0, 1, 0);
  assert.equal(fx.count(), 14);
  const z = sprites.find((s) => s.visible && s.userData.p.kind === 'zzz');
  assert.ok(z.userData.p.vx > 0 && z.userData.p.vy > 0, 'the z drifts up and to the right');
  const s0 = z.scale.x;
  fx.update(1);
  assert.ok(z.scale.x > s0, 'and grows as it goes');
});

test('particles fall, fade, and are hidden again within two seconds', () => {
  const { fx, sprites } = setup();
  fx.trail(0, 0, 0, 0, 0);
  const petal = sprites.find((s) => s.visible);
  const y0 = petal.position.y;
  fx.update(0.3);
  assert.ok(petal.position.y < y0, 'gravity pulls the petal down');
  assert.ok(petal.material.opacity < 1, 'it fades');
  fx.burst(0, 1, 0);
  assert.equal(fx.count(), 19);
  fx.hearts(0, 1, 0);
  fx.doze(0, 1, 0);
  fx.update(1);
  fx.update(1);
  fx.update(0.1);
  assert.equal(fx.count(), 0);
  assert.ok(sprites.every((s) => s.visible === false), 'dead particles are hidden');
});

test('the pool never grows past its size', () => {
  const { fx, parent } = setup();
  for (let i = 0; i < 60; i += 1) fx.trail(0, 0, 0, 100, 0);
  fx.burst(0, 0, 0);
  fx.burst(0, 0, 0);
  for (let i = 0; i < 5; i += 1) { fx.hearts(0, 0, 0); fx.doze(0, 0, 0); fx.puff(0, 0, 0); }
  assert.equal(parent.children.length, POOL);
  assert.ok(fx.count() <= POOL);
});

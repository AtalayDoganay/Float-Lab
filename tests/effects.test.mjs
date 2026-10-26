import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../src/renderer/vendor/three/three.module.js';
import { createEffects } from '../src/renderer/guide/effects.mjs';

const makeTexture = () => new THREE.Texture();
const setup = () => {
  const parent = new THREE.Group();
  const fx = createEffects(THREE, parent, { makeTexture });
  return { parent, fx, sprites: parent.children.filter((o) => o.isSprite) };
};

test('pools 24 petals and 10 sparkles as sprites, all hidden at rest', () => {
  const { parent, fx, sprites } = setup();
  assert.equal(sprites.length, 34);
  assert.equal(parent.children.length, 34, 'nothing but sprites');
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
  fx.update(1);
  fx.update(1);
  assert.equal(fx.count(), 0);
  assert.ok(sprites.every((s) => s.visible === false), 'dead particles are hidden');
});

test('the pool never grows past its size', () => {
  const { fx, parent } = setup();
  for (let i = 0; i < 60; i += 1) fx.trail(0, 0, 0, 100, 0);
  fx.burst(0, 0, 0);
  fx.burst(0, 0, 0);
  assert.equal(parent.children.length, 34);
  assert.ok(fx.count() <= 34);
});

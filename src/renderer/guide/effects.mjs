// Rosie's particles: a pool of petal sprites for the trail she leaves in
// flight and the confetti of a cheer, a pool of sparkle sprites for the
// cheer burst and the puff of a boop, hearts for when she is petted, and
// little z's for when she dozes. Everything is pre-allocated and hidden at
// rest; `update(dt)` moves, fades, and retires what is alive. Pure Three.js
// objects, no DOM.
import { COLORS } from './rosie-model.mjs';

const PETALS = 24;
const SPARKLES = 10;
const HEARTS = 6;
const ZS = 4;
const PETAL_GRAVITY = 1.5;

export function createEffects(THREE, parent, { makeTexture }) {
  const petalTexture = makeTexture('petal');
  const sparkleTexture = makeTexture('sparkle');
  const heartTexture = makeTexture('heart');
  const zTexture = makeTexture('zzz');

  const make = (texture, color, size, kind) => {
    const material = new THREE.SpriteMaterial({ map: texture, color: new THREE.Color(color), transparent: true, depthWrite: false, opacity: 1 });
    const sprite = new THREE.Sprite(material);
    sprite.visible = false;
    sprite.scale.set(size, size, 1);
    sprite.userData.p = { kind, size, age: 0, life: 0, vx: 0, vy: 0, vz: 0, spin: 0, gravity: 0 };
    parent.add(sprite);
    return sprite;
  };
  const petals = Array.from({ length: PETALS }, (_, i) => make(petalTexture, COLORS.bloom[i % COLORS.bloom.length], 0.16, 'petal'));
  const sparkles = Array.from({ length: SPARKLES }, () => make(sparkleTexture, COLORS.sparkle, 0.22, 'sparkle'));
  const heartPool = Array.from({ length: HEARTS }, () => make(heartTexture, COLORS.heart, 0.2, 'heart'));
  const zPool = Array.from({ length: ZS }, () => make(zTexture, COLORS.zzz, 0.26, 'zzz'));
  const all = [...petals, ...sparkles, ...heartPool, ...zPool];

  const spawn = (pool, x, y, z, vx, vy, vz, life, gravity, spin = (Math.random() - 0.5) * 5) => {
    const sprite = pool.find((s) => !s.visible);
    if (!sprite) return null;
    const p = sprite.userData.p;
    Object.assign(p, { age: 0, life, vx, vy, vz, gravity, spin });
    sprite.position.set(x, y, z);
    sprite.material.opacity = 1;
    sprite.material.rotation = spin === 0 ? 0 : Math.random() * Math.PI * 2;
    sprite.scale.set(p.size, p.size, 1);
    sprite.visible = true;
    return sprite;
  };

  // One petal shed behind her as she flies; `vx`/`vy` are her velocity in
  // screen pixels per second, so the petal drifts the other way, slowly.
  function trail(x, y, z, vx, vy) {
    const jitter = () => (Math.random() - 0.5) * 0.2;
    spawn(petals, x, y, z, -vx * 0.0015 + jitter(), vy * 0.0015 + jitter(), 0.1, 0.9, PETAL_GRAVITY);
  }

  function burst(x, y, z) {
    for (let i = 0; i < SPARKLES; i += 1) {
      const a = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 1.5;
      spawn(sparkles, x, y, z + 0.2, Math.cos(a) * speed, Math.sin(a) * speed, 0, 1.2, 0);
    }
    for (let i = 0; i < 8; i += 1) {
      const a = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random();
      spawn(petals, x, y, z + 0.1, Math.cos(a) * speed, Math.abs(Math.sin(a)) * speed + 0.8, 0, 1.4, PETAL_GRAVITY);
    }
  }

  // A small puff when she is booped: a few sparkles and petals.
  function puff(x, y, z) {
    for (let i = 0; i < 6; i += 1) {
      const a = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random();
      spawn(sparkles, x, y, z + 0.2, Math.cos(a) * speed, Math.sin(a) * speed + 0.4, 0, 0.7, 0);
    }
    for (let i = 0; i < 4; i += 1) {
      const a = Math.random() * Math.PI;
      spawn(petals, x, y, z + 0.1, Math.cos(a) * 0.8, Math.sin(a) * 1.2 + 0.4, 0, 1.0, PETAL_GRAVITY);
    }
  }

  // Three hearts floating up from her head while she is petted.
  function hearts(x, y, z) {
    for (let i = 0; i < 3; i += 1) {
      spawn(heartPool, x + (Math.random() - 0.5) * 0.6, y + Math.random() * 0.2, z, (Math.random() - 0.5) * 0.3, 0.8 + Math.random() * 0.4, 0, 1.3, 0, 0);
    }
  }

  // One little z drifting up and to the right while she dozes.
  function doze(x, y, z) {
    spawn(zPool, x, y, z, 0.28, 0.45, 0, 2.0, 0, 0);
  }

  function update(dt) {
    for (const sprite of all) {
      if (!sprite.visible) continue;
      const p = sprite.userData.p;
      p.age += dt;
      if (p.age >= p.life) { sprite.visible = false; continue; }
      p.vy -= p.gravity * dt;
      sprite.position.x += p.vx * dt;
      sprite.position.y += p.vy * dt;
      sprite.position.z += p.vz * dt;
      const left = 1 - p.age / p.life;
      sprite.material.opacity = left;
      sprite.material.rotation += p.spin * dt;
      if (p.kind === 'sparkle') {
        const s = p.size * (0.6 + 0.6 * Math.abs(Math.sin(p.age * 18)));
        sprite.scale.set(s, s, 1);
      } else if (p.kind === 'heart') {
        sprite.position.x += Math.sin(p.age * 7) * 0.35 * dt;
        const s = p.size * (0.7 + 0.5 * Math.min(1, p.age * 4));
        sprite.scale.set(s, s, 1);
      } else if (p.kind === 'zzz') {
        const s = p.size * (1 + 0.8 * (p.age / p.life));
        sprite.scale.set(s, s, 1);
      }
    }
  }

  const count = () => all.reduce((n, s) => n + (s.visible ? 1 : 0), 0);

  return { trail, burst, puff, hearts, doze, update, count };
}

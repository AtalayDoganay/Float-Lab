import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';

// Three.js is bundled with the app as the exact files from the npm registry
// tarball three-0.186.1.tgz. Replace both files together and update these
// hashes and src/renderer/vendor/three/README.md.
const dir = new URL('../src/renderer/vendor/three/', import.meta.url);
const HASHES = {
  'three.module.js': '9052042d676cb0fdc1ddfefe193053f34b7ac0513a616fdac4535d49987812ea',
  'three.core.js': '9edde002b066a9a05676a6127f67735b62baf399bdea529f2f7e31657da769e6',
};
const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');

test('Three.js 0.186.1 is vendored byte for byte, with its licence and provenance', async () => {
  for (const [file, hash] of Object.entries(HASHES)) {
    const buf = await fs.readFile(new URL(file, dir));
    assert.equal(sha256(buf), hash, `${file} matches the npm tarball`);
    const text = buf.toString('utf8');
    assert.ok(!text.includes('eval(') && !text.includes('new Function('), `${file}: no dynamic code`);
  }
  const module = await fs.readFile(new URL('three.module.js', dir), 'utf8');
  assert.ok(/from '\.\/three\.core\.js'/.test(module), 'the module imports its core from the same folder');
  const licence = await fs.readFile(new URL('LICENSE', dir), 'utf8');
  assert.ok(/MIT License/.test(licence), 'MIT licence shipped');
  const readme = await fs.readFile(new URL('README.md', dir), 'utf8');
  assert.ok(readme.includes('three@0.186.1'), 'README names the version');
  for (const hash of Object.values(HASHES)) assert.ok(readme.includes(hash), 'README records each hash');
});

test('the vendored module loads in Node and exposes what the guide needs', async () => {
  const THREE = await import('../src/renderer/vendor/three/three.module.js');
  assert.equal(THREE.REVISION, '186');
  const needed = ['WebGLRenderer', 'Scene', 'PerspectiveCamera', 'MeshPhysicalMaterial', 'SphereGeometry', 'CapsuleGeometry', 'LatheGeometry', 'TorusGeometry', 'ExtrudeGeometry', 'Shape', 'CanvasTexture', 'Sprite', 'SpriteMaterial', 'PMREMGenerator', 'HemisphereLight', 'DirectionalLight', 'Group', 'Box3'];
  for (const name of needed) assert.equal(typeof THREE[name], 'function', name);
});

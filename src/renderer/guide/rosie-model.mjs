// Rosie as a chibi toon character: a big round rose head (about three
// fifths of her height) with a huge drawn face framed by chunky petals, on a
// tiny green body with a leaf collar, stubby leaf-mitten arms and little
// feet. Every piece is a rounded primitive (spheres, ellipsoids, capsules)
// with a flat cel-shaded material and a coloured ink outline, so she reads
// as an illustration rather than as shaded plastic. `poseFor` turns an
// expression, the clock and the interaction mood into rotations and offsets;
// `applyPose` writes them into the parts. The Three.js module is passed in
// so the layer and the tests share one copy.
import { idleBob } from '../logic/motion.mjs';

export const COLORS = Object.freeze({
  bloom: Object.freeze(['#e8435f', '#d11e42', '#aa1333']), // light, base, deep
  bloomLine: '#5a0c20',
  face: '#ffe6eb',
  faceLine: '#5a0c20',
  stem: '#55c67f',
  stemDeep: '#2a8a4e',
  leaf: '#2fa35b',
  arm: '#44b86f',
  leafLine: '#15482b',
  blush: '#ff9fb3',
  iris: Object.freeze(['#1d6b3d', '#62d394']),
  pupil: '#1c1822',
  ink: '#5a0c20',
  drop: '#9fd8ff',
  sparkle: '#ffd34d',
  heart: '#ff6f8a',
  zzz: '#9bb9ff',
});

// The root's resting height in the stage: her middle sits near the origin.
export const BASE_Y = -1.3;
// Ink outline thickness in world units (about 2.5 px at her on-screen size).
export const OUTLINE = 0.028;

const HEAD_Y = 1.7;
const REST_ARM = 1.0; // arms hang down-and-out at rest (left: -, right: +)

// A hard three-band gradient: shadow, mid, light. Nearest filtering keeps the
// bands crisp, which is what makes the shading read as cel art.
export function makeGradientMap(THREE) {
  const data = new Uint8Array([100, 190, 255, 255]);
  const t = new THREE.DataTexture(data, 4, 1, THREE.RedFormat);
  t.minFilter = THREE.NearestFilter;
  t.magFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  t.needsUpdate = true;
  return t;
}

function toon(THREE, color, gradientMap) {
  const m = new THREE.MeshToonMaterial({ color: new THREE.Color(color), gradientMap });
  m.userData.toon = true;
  return m;
}

// The ink line: the same geometry drawn inside-out and pushed out along the
// view-space normal, so the line is the same thickness whatever the piece's
// scale (the classic inverted hull).
function ink(THREE, color) {
  const m = new THREE.MeshBasicMaterial({ color: new THREE.Color(color), side: THREE.BackSide });
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uOutline = { value: OUTLINE };
    shader.vertexShader = `uniform float uOutline;\n${shader.vertexShader}`.replace(
      '#include <project_vertex>',
      'vec4 mvPosition = modelViewMatrix * vec4( transformed, 1.0 );\nmvPosition.xyz += normalize( normalMatrix * normal ) * uOutline;\ngl_Position = projectionMatrix * mvPosition;',
    );
  };
  m.userData.outline = true;
  return m;
}

export function buildRosie(THREE, { faceTexture, gradientMap = makeGradientMap(THREE) }) {
  const mats = {
    bloom: COLORS.bloom.map((c) => toon(THREE, c, gradientMap)),
    bloomInk: ink(THREE, COLORS.bloomLine),
    stem: toon(THREE, COLORS.stem, gradientMap),
    stemDeep: toon(THREE, COLORS.stemDeep, gradientMap),
    leaf: toon(THREE, COLORS.leaf, gradientMap),
    arm: toon(THREE, COLORS.arm, gradientMap),
    leafInk: ink(THREE, COLORS.leafLine),
    // The face is a printed plate, unlit, so the drawing stays flat and crisp.
    face: new THREE.MeshBasicMaterial({ map: faceTexture, transparent: true, depthWrite: false }),
    drop: new THREE.MeshBasicMaterial({ color: new THREE.Color(COLORS.drop), transparent: true, opacity: 0.9 }),
  };
  mats.face.userData.face = true;

  const sphere = new THREE.SphereGeometry(1, 32, 24);
  const capsule = new THREE.CapsuleGeometry(1, 1.6, 6, 18);

  // A rounded piece with its ink outline as a child (which inherits the scale).
  const piece = (geometry, material, inkMaterial, { pos = [0, 0, 0], scale = [1, 1, 1], rot = [0, 0, 0], name = '' } = {}) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...pos);
    mesh.scale.set(...scale);
    mesh.rotation.set(...rot);
    if (name) mesh.name = name;
    const line = new THREE.Mesh(geometry, inkMaterial);
    line.name = 'ink';
    line.renderOrder = -1;
    mesh.add(line);
    return mesh;
  };
  const ball = (material, inkMaterial, r, opts = {}) => piece(sphere, material, inkMaterial, { ...opts, scale: (opts.scale || [1, 1, 1]).map((s) => s * r) });

  const root = new THREE.Group();
  root.name = 'root';
  root.position.y = BASE_Y;

  // ---- body: a short stem with two rounded thorn nubs
  const body = new THREE.Group();
  body.name = 'body';
  body.add(piece(capsule, mats.stem, mats.leafInk, { pos: [0, 0.64, 0], scale: [0.23, 0.23, 0.23], name: 'stem' }));
  body.add(ball(mats.stemDeep, mats.leafInk, 0.06, { pos: [0.22, 0.5, 0.08], scale: [1, 0.7, 0.7], rot: [0, 0, -0.6] }));
  body.add(ball(mats.stemDeep, mats.leafInk, 0.05, { pos: [-0.21, 0.7, 0.1], scale: [1, 0.7, 0.7], rot: [0, 0, 0.7] }));
  root.add(body);

  // ---- leaf collar under the head
  const leaves = new THREE.Group();
  leaves.name = 'leaves';
  for (let i = 0; i < 6; i += 1) {
    const pivot = new THREE.Group();
    pivot.position.set(0, 1.03, 0);
    pivot.rotation.set(0.8, (i * Math.PI * 2) / 6 + 0.5, 0, 'YXZ');
    pivot.add(ball(mats.leaf, mats.leafInk, 1, { pos: [0, 0, 0.27], scale: [0.16, 0.06, 0.27] }));
    leaves.add(pivot);
  }
  root.add(leaves);

  // ---- feet
  const feet = new THREE.Group();
  feet.name = 'feet';
  for (const x of [-0.17, 0.17]) feet.add(ball(mats.stemDeep, mats.leafInk, 1, { pos: [x, 0.1, 0.1], scale: [0.15, 0.1, 0.19] }));
  root.add(feet);

  // ---- arms: stubby leaf mittens on shoulder pivots. Each shoulder sits in
  // a frame turned half a turn about y, so a positive z rotation raises the
  // left arm and a negative one raises the right.
  const shoulder = (name, x, dir) => {
    const mirror = new THREE.Group();
    mirror.position.set(x, 0.93, 0.15);
    mirror.rotation.y = Math.PI;
    const pivot = new THREE.Group();
    pivot.name = name;
    const arm = new THREE.Group();
    arm.name = name === 'shoulderL' ? 'armL' : 'armR';
    arm.add(ball(mats.arm, mats.leafInk, 1, { pos: [dir * 0.22, 0, 0], scale: [0.24, 0.1, 0.13] }));
    arm.add(ball(mats.arm, mats.leafInk, 0.11, { pos: [dir * 0.43, 0.01, 0], scale: [1, 0.95, 0.9] }));
    pivot.add(arm);
    mirror.add(pivot);
    root.add(mirror);
    return { pivot, arm };
  };
  const left = shoulder('shoulderL', -0.26, 1);
  const right = shoulder('shoulderR', 0.26, -1);

  // ---- head: the bloom (core, two rings of chunky petals, a curl on top)
  const head = new THREE.Group();
  head.name = 'head';
  head.position.y = HEAD_Y;
  const bloom = new THREE.Group();
  bloom.name = 'bloom';
  bloom.add(ball(mats.bloom[1], mats.bloomInk, 0.78, { scale: [1, 0.97, 0.95], name: 'core' }));
  const ring = (count, radius, z, size, tilt, shade, offset) => {
    for (let i = 0; i < count; i += 1) {
      const a = offset + (i * Math.PI * 2) / count;
      const pivot = new THREE.Group();
      pivot.position.set(Math.cos(a) * radius, Math.sin(a) * radius, z);
      // Point the petal's long axis outward, then fan it away from the face.
      pivot.rotation.set(0, 0, a - Math.PI / 2, 'ZYX');
      const petal = ball(mats.bloom[shade(i)], mats.bloomInk, 1, { scale: size, rot: [-tilt, 0, 0] });
      pivot.add(petal);
      bloom.add(pivot);
    }
  };
  ring(8, 0.6, 0.02, [0.36, 0.46, 0.2], 0.25, (i) => 2 - (i % 2), Math.PI / 2);
  ring(8, 0.56, 0.3, [0.3, 0.4, 0.16], 0.75, (i) => (i % 2), Math.PI / 2 + Math.PI / 8);
  // The curl at the crown.
  bloom.add(ball(mats.bloom[0], mats.bloomInk, 0.19, { pos: [0.02, 0.8, 0.06], scale: [1, 0.9, 0.9] }));
  bloom.add(ball(mats.bloom[0], mats.bloomInk, 0.14, { pos: [0.2, 0.9, 0.02] }));
  bloom.add(ball(mats.bloom[1], mats.bloomInk, 0.11, { pos: [-0.12, 0.95, 0.06] }));
  head.add(bloom);

  // The face plate: a shallow spherical cap a little proud of the core, with
  // the whole drawing (disc, outline, eyes, mouth) on its texture.
  const face = new THREE.Mesh(new THREE.SphereGeometry(0.82, 48, 36, Math.PI / 2 - 0.98, 1.96, Math.PI / 2 - 0.96, 1.92), mats.face);
  face.name = 'face';
  face.scale.set(1, 0.95, 0.96);
  face.position.y = -0.04;
  face.renderOrder = 2;
  head.add(face);

  const drop = new THREE.Group();
  drop.name = 'drop';
  const dropBall = new THREE.Mesh(new THREE.SphereGeometry(0.07, 20, 16), mats.drop);
  const dropTip = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.13, 20), mats.drop);
  dropTip.position.y = 0.09;
  drop.add(dropBall, dropTip);
  drop.position.set(0.7, 0.3, 0.5);
  drop.visible = false;
  head.add(drop);
  root.add(head);

  const parts = { root, head, bloom, face, body, armL: left.arm, armR: right.arm, shoulderL: left.pivot, shoulderR: right.pivot, leaves, feet, drop };
  return { root, parts, materials: mats };
}

// A bell from 0 to 1 and back over `d` seconds, 0 outside it.
const bell = (t, d) => (t >= 0 && t < d ? Math.sin((Math.PI * t) / d) : 0);

export function poseFor({ expression, t = 0, phase = 0, look = { x: 0, y: 0 }, facing = 'right', reduced = false, mood = 'none', moodT = 0, idle = null, toward = { x: 0, y: 0 }, near = 0 }) {
  const bob = reduced ? { y: 0, yaw: 0 } : idleBob(phase);
  const pose = {
    root: { y: bob.y, yaw: bob.yaw, pitch: 0, roll: 0, sx: 1, sy: 1 },
    head: { yaw: 0, pitch: 0, roll: 0 },
    armL: { x: 0, z: -REST_ARM },
    armR: { x: 0, z: REST_ARM },
    drop: false,
    sparkle: 0,
  };
  const dir = facing === 'left' ? -1 : 1;
  switch (expression) {
    case 'wave':
      // Raised arms swing outward and forward so they show beside her big head.
      pose.armR.z = reduced ? -1.1 : (t < 2 ? -0.85 + 0.25 * Math.sin(t * 14) : -0.8);
      pose.armR.x = -1.0;
      pose.root.pitch = reduced ? 0 : -0.05;
      break;
    case 'point':
      if (dir > 0) { pose.armR.z = -0.6; pose.armR.x = -0.9; } else { pose.armL.z = 0.6; pose.armL.x = -0.9; }
      pose.root.yaw += 0.35 * dir;
      pose.root.roll = -0.06 * dir;
      pose.head.yaw += 0.25 * dir;
      break;
    case 'happy':
      pose.root.y += reduced ? 0 : 0.04 * Math.abs(Math.sin(t * Math.PI * 2.2));
      pose.root.roll = reduced ? 0 : 0.05 * Math.sin(t * 2.5);
      break;
    case 'cheer':
      if (reduced) {
        // No hop, no spin, no sparkles: arms up and a smile are the whole cheer.
      } else if (t < 1.2) {
        pose.root.y += 0.45 * Math.sin((Math.PI * t) / 1.2);
        pose.root.yaw += (Math.PI * 2 * t) / 1.2;
      } else {
        pose.root.y += 0.03 * Math.abs(Math.sin(t * Math.PI * 2));
      }
      pose.armL.z = 0.95;
      pose.armR.z = -0.95;
      pose.armL.x = -0.9;
      pose.armR.x = -0.9;
      pose.sparkle = reduced ? 0 : Math.max(0, 1 - t / 1.5);
      break;
    case 'oops':
      pose.root.pitch = 0.25;
      pose.armL.z = -1.3;
      pose.armR.z = 1.3;
      if (t < 1 && !reduced) pose.head.yaw += 0.12 * Math.sin(t * Math.PI * 12) * (1 - t);
      pose.drop = true;
      break;
    default:
      break;
  }
  // What the pointer is doing to her, laid over the expression.
  switch (mood) {
    case 'notice':
      pose.root.yaw += toward.x * 0.14 * near;
      break;
    case 'hover': {
      const k = Math.min(1, moodT / 0.25);
      if (!reduced) { pose.root.sy *= 1 + 0.05 * k; pose.root.sx *= 1 - 0.02 * k; }
      pose.head.pitch -= 0.06 * k;
      pose.armL.z += 0.35 * k;
      pose.armR.z -= 0.35 * k;
      break;
    }
    case 'boop': {
      const b = reduced ? 0 : bell(moodT, 0.45);
      pose.root.sy *= 1 - 0.18 * b;
      pose.root.sx *= 1 + 0.14 * b;
      pose.head.pitch += 0.1 * b;
      break;
    }
    case 'giggle':
      if (!reduced) {
        pose.root.y += 0.05 * Math.abs(Math.sin(moodT * Math.PI * 4));
        pose.root.roll += 0.08 * Math.sin(moodT * 18) * Math.max(0, 1 - moodT / 0.9);
      }
      pose.armL.z += 0.5;
      pose.armR.z -= 0.5;
      break;
    case 'dizzy':
      if (!reduced) {
        pose.root.yaw += 0.22 * Math.sin(moodT * 7);
        pose.root.roll += 0.1 * Math.sin(moodT * 5);
        pose.head.roll += 0.18 * Math.sin(moodT * 7 + 1);
      }
      pose.armL.z = -1.3;
      pose.armR.z = 1.3;
      break;
    case 'pet':
      pose.head.pitch += 0.12;
      if (!reduced) pose.root.roll += 0.05 * Math.sin(moodT * 3);
      pose.armL.z += 0.4;
      pose.armR.z -= 0.4;
      break;
    case 'sleep':
      pose.head.pitch += 0.2;
      pose.head.roll += 0.08;
      if (!reduced) pose.root.sy *= 1 + 0.02 * Math.sin(moodT * 1.8);
      break;
    case 'startle': {
      const b = reduced ? 0 : bell(moodT, 0.6);
      pose.root.y += 0.12 * b;
      pose.root.sy *= 1 + 0.06 * b;
      pose.root.sx *= 1 - 0.03 * b;
      pose.head.pitch -= 0.1 * b;
      break;
    }
    default:
      break;
  }
  // The small idle actions (a glance and a double blink are the layer's: they move her eyes).
  if (idle && !reduced) {
    if (idle.action === 'stretch') {
      const b = bell(idle.since, 0.8);
      pose.root.sy *= 1 + 0.08 * b;
      pose.armL.z += 0.5 * b;
      pose.armR.z -= 0.5 * b;
      pose.head.pitch -= 0.1 * b;
    } else if (idle.action === 'wiggle') {
      pose.root.roll += 0.08 * Math.sin(idle.since * 16) * Math.max(0, 1 - idle.since / 0.9);
    }
  }
  pose.head.yaw += look.x * 0.18;
  pose.head.pitch += -look.y * 0.12;
  return pose;
}

export function applyPose(parts, pose) {
  parts.root.position.y = BASE_Y + pose.root.y;
  parts.root.rotation.set(pose.root.pitch, pose.root.yaw, pose.root.roll);
  parts.root.scale.set(pose.root.sx, pose.root.sy, pose.root.sx);
  parts.head.rotation.set(pose.head.pitch, pose.head.yaw, pose.head.roll);
  parts.shoulderL.rotation.set(pose.armL.x, 0, pose.armL.z);
  parts.shoulderR.rotation.set(pose.armR.x, 0, pose.armR.z);
  parts.drop.visible = pose.drop;
}

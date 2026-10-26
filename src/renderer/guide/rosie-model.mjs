// Rosie as a plush toy, built from soft primitives only (spheres and
// ellipsoids, capsules, a lathe for the stem, a torus for the face seam, a
// bevelled tag). The red bloom is her head with a drawn face on a curved
// plate; the leaves are her arms and skirt; the thorned stem is her body;
// the green badge is a little tag. `poseFor` turns an expression and a clock
// into rotations and offsets; `applyPose` writes them into the parts. The
// Three.js module is passed in so the layer and the tests share one copy.
import { idleBob } from '../logic/motion.mjs';

export const COLORS = Object.freeze({
  bloom: Object.freeze(['#c8102e', '#a50f24', '#d9344f']),
  bloomSheen: '#ff9aa8',
  face: '#ffd6dc',
  seam: '#ffc9d2',
  stem: '#3b8f5c',
  thorn: '#2a6b45',
  leaf: '#2e8b57',
  leafVein: '#8fd6a3',
  leafSheen: '#9fe0b0',
  tag: '#1f6f3f',
  tagRim: '#e8f5e9',
  drop: '#a7d8f5',
  sparkle: '#ffe28a',
});

// The root's resting height in the stage: her middle sits near the origin.
export const BASE_Y = -1.3;

const HEAD_Y = 1.75;
const REST_ARM = 1.0; // arms hang down-and-out at rest (left: -, right: +)

function fabric(THREE, color, sheenColor, fuzz, extra = {}) {
  const m = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(color),
    roughness: 0.95,
    metalness: 0,
    sheen: 1,
    sheenRoughness: 0.55,
    sheenColor: new THREE.Color(sheenColor),
    normalMap: fuzz || null,
    normalScale: new THREE.Vector2(0.3, 0.3),
    ...extra,
  });
  m.userData.fabric = true;
  return m;
}

function ellipsoid(THREE, material, r, sx, sy, sz, name = '') {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, 32, 24), material);
  mesh.scale.set(sx, sy, sz);
  if (name) mesh.name = name;
  return mesh;
}

function roundedRect(THREE, w, h, r) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2 + r, -h / 2);
  s.lineTo(w / 2 - r, -h / 2);
  s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  s.lineTo(w / 2, h / 2 - r);
  s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
  s.lineTo(-w / 2 + r, h / 2);
  s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
  s.lineTo(-w / 2, -h / 2 + r);
  s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  return s;
}

function buildBloom(THREE, mats) {
  const bloom = new THREE.Group();
  bloom.name = 'bloom';
  bloom.add(ellipsoid(THREE, mats.bloom[0], 0.72, 1, 0.92, 0.96, 'core'));
  // Two rings of petals around the head, open at the front so the face shows.
  const ring = (count, from, to, radius, y, size, tilt, lift) => {
    for (let i = 0; i < count; i += 1) {
      const a = from + ((to - from) * i) / (count - 1);
      const pivot = new THREE.Group();
      pivot.position.y = y;
      pivot.rotation.set(tilt, a, 0, 'YXZ');
      const petal = ellipsoid(THREE, mats.bloom[1 + (i % 2)], size, 1, 0.8, 0.38);
      petal.position.set(0, lift, radius);
      pivot.add(petal);
      bloom.add(pivot);
    }
  };
  const d = (deg) => (deg * Math.PI) / 180;
  ring(5, d(92), d(268), 0.54, 0.24, 0.42, -0.6, 0.06);
  ring(7, d(66), d(294), 0.64, -0.04, 0.47, 0.12, 0);
  // The bud at the crown.
  const bud = [[0, 0.7, 0.02, 0.17, 1], [0.13, 0.63, -0.08, 0.14, 2], [-0.11, 0.62, 0.1, 0.12, 1]];
  for (const [x, y, z, r, c] of bud) {
    const b = ellipsoid(THREE, mats.bloom[c], r, 1, 0.9, 1);
    b.position.set(x, y, z);
    bloom.add(b);
  }
  return bloom;
}

function buildArm(THREE, mats, dir) {
  // Built along local x in the direction `dir`; the shoulder's mirror frame
  // makes the same pose values raise either arm.
  const arm = new THREE.Group();
  const lobeA = ellipsoid(THREE, mats.leaf, 1, 0.3, 0.1, 0.17);
  lobeA.position.set(dir * 0.28, 0, 0);
  const lobeB = ellipsoid(THREE, mats.leaf, 1, 0.19, 0.085, 0.13);
  lobeB.position.set(dir * 0.5, 0.02, 0);
  const vein = new THREE.Mesh(new THREE.CapsuleGeometry(0.016, 0.5, 4, 10), mats.vein);
  vein.rotation.z = Math.PI / 2;
  vein.position.set(dir * 0.32, 0.075, 0);
  arm.add(lobeA, lobeB, vein);
  return arm;
}

export function buildRosie(THREE, { faceTexture, fuzzTexture = null }) {
  const fuzz = fuzzTexture;
  const mats = {
    bloom: COLORS.bloom.map((c) => fabric(THREE, c, COLORS.bloomSheen, fuzz)),
    face: fabric(THREE, '#ffffff', COLORS.bloomSheen, null, { map: faceTexture, transparent: true, sheen: 0.35, sheenRoughness: 0.9, roughness: 1 }),
    seam: fabric(THREE, COLORS.seam, '#ffffff', fuzz),
    stem: fabric(THREE, COLORS.stem, COLORS.leafSheen, fuzz),
    thorn: fabric(THREE, COLORS.thorn, COLORS.leafSheen, fuzz),
    leaf: fabric(THREE, COLORS.leaf, COLORS.leafSheen, fuzz),
    vein: fabric(THREE, COLORS.leafVein, '#ffffff', null),
    tag: fabric(THREE, COLORS.tag, COLORS.leafSheen, fuzz),
    tagRim: fabric(THREE, COLORS.tagRim, '#ffffff', null),
    drop: new THREE.MeshPhysicalMaterial({ color: new THREE.Color(COLORS.drop), transparent: true, opacity: 0.85, roughness: 0.2, metalness: 0, clearcoat: 1 }),
  };
  // The face is a printed plate, not velvet: little sheen, so the drawing stays crisp.
  mats.face.userData.fabric = false;

  const root = new THREE.Group();
  root.name = 'root';
  root.position.y = BASE_Y;

  // Body: a tapered, rounded stem with two thorns and the badge tag.
  const body = new THREE.Group();
  body.name = 'body';
  const profile = [[0, 0.24], [0.17, 0.25], [0.24, 0.36], [0.25, 0.62], [0.225, 0.95], [0.2, 1.12], [0.12, 1.17], [0, 1.18]].map(([x, y]) => new THREE.Vector2(x, y));
  body.add(new THREE.Mesh(new THREE.LatheGeometry(profile, 36), mats.stem));
  for (const [x, y, z, rz] of [[0.23, 0.56, 0.06, -1.25], [-0.21, 0.84, 0.07, 1.2]]) {
    const thorn = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.1, 4, 10), mats.thorn);
    thorn.position.set(x, y, z);
    thorn.rotation.z = rz;
    body.add(thorn);
  }
  const tag = new THREE.Group();
  tag.name = 'tag';
  const rim = new THREE.Mesh(new THREE.ExtrudeGeometry(roundedRect(THREE, 0.22, 0.28, 0.05), { depth: 0.02, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 3 }), mats.tagRim);
  const badge = new THREE.Mesh(new THREE.ExtrudeGeometry(roundedRect(THREE, 0.17, 0.23, 0.04), { depth: 0.02, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 3 }), mats.tag);
  badge.position.z = 0.03;
  tag.add(rim, badge);
  // Hangs beside her right foot, where the leaf skirt and the arms do not hide it.
  tag.position.set(0.4, 0.22, 0.2);
  tag.rotation.set(0.1, -0.45, 0.25);
  body.add(tag);
  root.add(body);

  // Leaf skirt around the top of the stem.
  const leaves = new THREE.Group();
  leaves.name = 'leaves';
  for (let i = 0; i < 5; i += 1) {
    const pivot = new THREE.Group();
    pivot.position.set(0, 1.1, 0);
    pivot.rotation.set(0.8, (i * Math.PI * 2) / 5 + 0.3, 0, 'YXZ');
    const leaf = ellipsoid(THREE, mats.leaf, 0.3, 1, 0.28, 1.6);
    leaf.position.set(0, 0, 0.42);
    pivot.add(leaf);
    leaves.add(pivot);
  }
  root.add(leaves);

  // Feet.
  const feet = new THREE.Group();
  feet.name = 'feet';
  for (const x of [-0.17, 0.17]) {
    const foot = ellipsoid(THREE, mats.leaf, 0.16, 1.1, 0.75, 1.3);
    foot.position.set(x, 0.12, 0.08);
    feet.add(foot);
  }
  root.add(feet);

  // Arms on shoulder pivots. Each shoulder sits in a frame turned half a
  // turn about y, so a positive z rotation raises the left arm and a
  // negative one raises the right.
  const shoulder = (name, x, dir) => {
    const mirror = new THREE.Group();
    mirror.position.set(x, 1.06, 0.1);
    mirror.rotation.y = Math.PI;
    const pivot = new THREE.Group();
    pivot.name = name;
    const arm = buildArm(THREE, mats, dir);
    arm.name = name === 'shoulderL' ? 'armL' : 'armR';
    pivot.add(arm);
    mirror.add(pivot);
    root.add(mirror);
    return { pivot, arm };
  };
  const left = shoulder('shoulderL', -0.3, 1);
  const right = shoulder('shoulderR', 0.3, -1);

  // Head: the bloom, the face plate, the seam, the sweat drop.
  const head = new THREE.Group();
  head.name = 'head';
  head.position.y = HEAD_Y;
  const bloom = buildBloom(THREE, mats);
  head.add(bloom);
  const face = new THREE.Mesh(new THREE.SphereGeometry(0.745, 48, 36, Math.PI / 2 - 0.96, 1.92, Math.PI / 2 - 0.95, 1.9), mats.face);
  face.name = 'face';
  face.scale.set(1, 0.93, 0.97);
  face.renderOrder = 1;
  head.add(face);
  const seam = new THREE.Mesh(new THREE.TorusGeometry(0.615, 0.014, 10, 72), mats.seam);
  seam.name = 'seam';
  seam.position.z = 0.41;
  seam.scale.set(1, 0.93, 1);
  head.add(seam);
  const drop = new THREE.Group();
  drop.name = 'drop';
  const dropBall = new THREE.Mesh(new THREE.SphereGeometry(0.065, 20, 16), mats.drop);
  const dropTip = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.12, 20), mats.drop);
  dropTip.position.y = 0.08;
  drop.add(dropBall, dropTip);
  drop.position.set(0.66, 0.2, 0.42);
  drop.visible = false;
  head.add(drop);
  root.add(head);

  const parts = { root, head, bloom, face, body, armL: left.arm, armR: right.arm, shoulderL: left.pivot, shoulderR: right.pivot, leaves, feet, tag, drop, seam };
  return { root, parts };
}

export function poseFor({ expression, t = 0, phase = 0, look = { x: 0, y: 0 }, facing = 'right', reduced = false }) {
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

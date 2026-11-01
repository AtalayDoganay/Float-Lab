// Robot Rosie: a small mechanical rose-inspired robot, deliberately unlike
// the guide (boxes, rivets, a hinge ring, flat petal plates, an unlit lamp,
// no drawn face). `robotPose` reads only the simulated outputs: Digital 0 ON
// opens the six petal plates on their hinges and lights the lamp; nothing
// else (selection, zoom, the pointer) moves her. Three.js is passed in.

export const OPEN_ANGLE = 1.1; // radians each petal plate swings out when ON
export const COLORS = Object.freeze({ metal: '#8f9aa3', metalDark: '#5c666e', base: '#2f6b4a', petal: '#c8233f', petalEdge: '#7d1226', lampOn: '#ffd166', lampOff: '#3b2f23', rivet: '#d9dde1' });

export function buildRobot(THREE) {
  const metal = new THREE.MeshStandardMaterial({ color: new THREE.Color(COLORS.metal), metalness: 0.6, roughness: 0.45 });
  const metalDark = new THREE.MeshStandardMaterial({ color: new THREE.Color(COLORS.metalDark), metalness: 0.7, roughness: 0.4 });
  const base = new THREE.MeshStandardMaterial({ color: new THREE.Color(COLORS.base), metalness: 0.3, roughness: 0.7 });
  const petal = new THREE.MeshStandardMaterial({ color: new THREE.Color(COLORS.petal), metalness: 0.35, roughness: 0.5, side: THREE.DoubleSide });
  const rivet = new THREE.MeshStandardMaterial({ color: new THREE.Color(COLORS.rivet), metalness: 0.8, roughness: 0.3 });
  const lamp = new THREE.MeshBasicMaterial({ color: new THREE.Color(COLORS.lampOff) });
  lamp.userData.lamp = true;

  const mesh = (geometry, material, [x, y, z] = [0, 0, 0], rot = [0, 0, 0]) => {
    const m = new THREE.Mesh(geometry, material);
    m.position.set(x, y, z);
    m.rotation.set(...rot);
    return m;
  };

  const root = new THREE.Group();
  root.name = 'robot';
  root.position.y = -1.0;

  // Treads and a base plate.
  root.add(mesh(new THREE.BoxGeometry(0.34, 0.26, 0.9), metalDark, [-0.42, 0.13, 0]));
  root.add(mesh(new THREE.BoxGeometry(0.34, 0.26, 0.9), metalDark, [0.42, 0.13, 0]));
  root.add(mesh(new THREE.BoxGeometry(1.1, 0.12, 0.8), base, [0, 0.32, 0]));

  // The chassis: a riveted box with a dark panel.
  const chassis = mesh(new THREE.BoxGeometry(0.8, 0.62, 0.6), metal, [0, 0.69, 0]);
  chassis.name = 'chassis';
  root.add(chassis);
  root.add(mesh(new THREE.BoxGeometry(0.5, 0.3, 0.04), metalDark, [0, 0.66, 0.31]));
  const bolts = [];
  for (const [x, y] of [[-0.32, 0.9], [0.32, 0.9], [-0.32, 0.48], [0.32, 0.48]]) {
    const b = mesh(new THREE.SphereGeometry(0.035, 10, 8), rivet, [x, y, 0.31]);
    bolts.push(b);
    root.add(b);
  }

  // A neck with a visible hinge ring, then the head drum.
  root.add(mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.22, 16), metalDark, [0, 1.11, 0]));
  const head = new THREE.Group();
  head.name = 'head';
  head.position.y = 1.5;
  head.add(mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.5, 24), metal));
  head.add(mesh(new THREE.TorusGeometry(0.41, 0.03, 8, 32), metalDark, [0, 0.25, 0], [Math.PI / 2, 0, 0]));
  const eyeLamp = mesh(new THREE.SphereGeometry(0.09, 16, 12), lamp, [0, 0.02, 0.4]);
  eyeLamp.name = 'eyeLamp';
  head.add(eyeLamp);
  head.add(mesh(new THREE.TorusGeometry(0.12, 0.025, 8, 24), metalDark, [0, 0.02, 0.4]));

  // Six flat petal plates on hinge pivots around the top of the drum.
  const petals = [];
  const plate = new THREE.BoxGeometry(0.16, 0.5, 0.03);
  for (let i = 0; i < 6; i += 1) {
    const a = (i * Math.PI * 2) / 6;
    const pivot = new THREE.Group();
    pivot.name = `petal-${i}`;
    pivot.position.set(Math.cos(a) * 0.3, 0.27, Math.sin(a) * 0.3);
    pivot.rotation.y = -a;
    const hinge = mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.18, 10), metalDark, [0, 0, 0], [0, 0, Math.PI / 2]);
    const leaf = mesh(plate, petal, [0, 0.25, 0]);
    leaf.add(mesh(new THREE.BoxGeometry(0.17, 0.05, 0.035), new THREE.MeshStandardMaterial({ color: new THREE.Color(COLORS.petalEdge), metalness: 0.4, roughness: 0.5 }), [0, 0.23, 0]));
    pivot.add(hinge, leaf);
    head.add(pivot);
    petals.push(pivot);
  }
  root.add(head);

  return { root, parts: { chassis, head, petals, eyeLamp, bolts }, materials: { lamp } };
}

export function robotPose({ outputs, t = 0 }) {
  const on = Boolean(outputs && outputs.lights && outputs.lights['light-1']);
  return {
    petalAngle: on ? OPEN_ANGLE : 0,
    eyeLamp: on,
    hum: ((1 + Math.sin(t * 30)) / 2) * (on ? 1 : 0.15),
  };
}

// Petals swing out on their hinges (the x axis of each pivot points along the hinge).
export function applyRobotPose(parts, materials, pose, THREE) {
  for (const p of parts.petals) p.rotation.x = -pose.petalAngle;
  materials.lamp.color.set(pose.eyeLamp ? COLORS.lampOn : COLORS.lampOff);
  parts.head.position.y = 1.5 + 0.004 * pose.hum;
  if (THREE) parts.eyeLamp.scale.setScalar(pose.eyeLamp ? 1.15 : 1);
}

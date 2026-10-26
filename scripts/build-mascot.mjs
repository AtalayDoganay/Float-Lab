#!/usr/bin/env node
// Generates Rosie, the trainer's guide, as five SVG files (one per
// expression) under src/renderer/assets/mascot/. Rosie is a chibi rose
// adapted from the Cal Poly Rose Float logo: the red bloom is her head, the
// serrated green leaves are her arms and skirt, the thorned stem is her body,
// and she stands in front of the logo's rounded-square green badge outline.
// Presentation attributes only (the app's CSP forbids inline styles), no
// scripts, no references, so the files load offline through <img>.
//
//   node scripts/build-mascot.mjs
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'renderer', 'assets', 'mascot');
const EXPRESSIONS = ['wave', 'point', 'happy', 'cheer', 'oops'];

// The logo's palette (sampled from the Cal Poly Rose Float logo), plus the
// face tones that make big anime eyes read on red petals.
const C = {
  red: '#c8102e', redDeep: '#a50f24', redFace: '#e23a52', redLight: '#ef5a6e',
  green: '#2e8b57', greenDeep: '#1f6f3f', greenPale: '#eef7f1',
  ink: '#3a1420', iris: '#2a6b4a', pupil: '#14281e', white: '#ffffff',
  blush: '#ff8fa3', gold: '#ffd34d', drop: '#9fd8ff', dropEdge: '#4aa3df',
};

const n = (v) => (Math.round(v * 100) / 100).toString();

// A serrated leaf growing from (ax, ay) in the direction `angle` (degrees,
// 0 = right, 90 = down), `length` long and `width` wide, with a midrib.
function leaf(ax, ay, angle, length, width, { teeth = 16, tooth = 0.07, fill = C.green } = {}) {
  const rad = (angle * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const a = length / 2;
  const b = width / 2;
  const pts = [];
  const steps = 72;
  for (let i = 0; i < steps; i += 1) {
    const t = (i / steps) * Math.PI * 2;
    // A pointed ellipse (tip at t = 0), serrated along both edges.
    const edge = 1 + tooth * (Math.sin(teeth * t) > 0 ? 1 : -1) * Math.abs(Math.sin(t));
    const x0 = a + a * Math.cos(t) * edge;
    const y0 = b * Math.sin(t) * edge * (0.75 + 0.25 * Math.abs(Math.cos(t)));
    pts.push([ax + x0 * cos - y0 * sin, ay + x0 * sin + y0 * cos]);
  }
  const d = `M${pts.map(([x, y]) => `${n(x)} ${n(y)}`).join('L')}Z`;
  const tipX = ax + length * cos;
  const tipY = ay + length * sin;
  const veins = [0.35, 0.6].map((f) => {
    const vx = ax + length * f * cos;
    const vy = ay + length * f * sin;
    const vl = width * 0.28;
    const va = rad + Math.PI / 3;
    const vb = rad - Math.PI / 3;
    return `<path d="M${n(vx)} ${n(vy)}l${n(vl * Math.cos(va))} ${n(vl * Math.sin(va))}M${n(vx)} ${n(vy)}l${n(vl * Math.cos(vb))} ${n(vl * Math.sin(vb))}" stroke="${C.greenDeep}" stroke-width="1.5" fill="none" stroke-linecap="round" opacity="0.7"/>`;
  }).join('');
  return `<g><path d="${d}" fill="${fill}" stroke="${C.greenDeep}" stroke-width="2.2" stroke-linejoin="round"/>` +
    `<path d="M${n(ax)} ${n(ay)}L${n(tipX)} ${n(tipY)}" stroke="${C.greenDeep}" stroke-width="2" fill="none" stroke-linecap="round"/>${veins}</g>`;
}

function star(cx, cy, r) {
  const s = r * 0.32;
  return `<path d="M${n(cx)} ${n(cy - r)}L${n(cx + s)} ${n(cy - s)}L${n(cx + r)} ${n(cy)}L${n(cx + s)} ${n(cy + s)}L${n(cx)} ${n(cy + r)}L${n(cx - s)} ${n(cy + s)}L${n(cx - r)} ${n(cy)}L${n(cx - s)} ${n(cy - s)}Z" fill="${C.gold}" stroke="#e0a800" stroke-width="1"/>`;
}

// The logo's rounded-square badge: a thick outer line and a thin inner one.
const badge = () =>
  `<rect x="46" y="78" width="148" height="148" rx="30" fill="${C.greenPale}" stroke="${C.greenDeep}" stroke-width="7"/>` +
  `<rect x="56" y="88" width="128" height="128" rx="23" fill="none" stroke="${C.greenDeep}" stroke-width="2"/>`;

const feet = () =>
  `<ellipse cx="106" cy="233" rx="14" ry="6.5" fill="${C.greenDeep}"/><ellipse cx="134" cy="233" rx="14" ry="6.5" fill="${C.greenDeep}"/>`;

// A short thorned stem.
const stem = () =>
  `<rect x="113" y="160" width="14" height="70" rx="7" fill="${C.green}" stroke="${C.greenDeep}" stroke-width="2.2"/>` +
  `<path d="M113 190l-9 -4l9 -4z" fill="${C.greenDeep}"/><path d="M127 206l9 -4l-9 -4z" fill="${C.greenDeep}"/>`;

// Two serrated leaves make a skirt at the hips.
const skirt = () => leaf(118, 196, 200, 52, 28) + leaf(122, 196, -20, 52, 28);

// The rose's centre: a tight spiral of petal edges, as on the logo's bloom.
function spiral(cx, cy, turns = 2.6, growth = 2.6) {
  const pts = [];
  for (let i = 0; i <= 64; i += 1) {
    const t = (i / 64) * turns * Math.PI * 2;
    const r = 1.5 + growth * t;
    pts.push(`${n(cx + r * Math.cos(t))} ${n(cy + r * Math.sin(t) * 0.8)}`);
  }
  return `<path d="M${pts.join('L')}" stroke="${C.redDeep}" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
}

// Outer petals peek out around the head in two reds with visible edges; the
// crown is the bloom's spiral centre.
function head() {
  const petals = [-150, -115, -90, -65, -30, 180, 0]
    .map((deg, i) => {
      const r = (deg * Math.PI) / 180;
      const cx = 120 + 50 * Math.cos(r);
      const cy = 110 + 50 * Math.sin(r);
      const fill = i % 2 ? '#b8142b' : C.redDeep;
      return `<ellipse cx="${n(cx)}" cy="${n(cy)}" rx="21" ry="29" transform="rotate(${deg + 90} ${n(cx)} ${n(cy)})" fill="${fill}" stroke="#8a0c1f" stroke-width="1.6"/>`;
    })
    .join('');
  return petals +
    `<circle cx="120" cy="110" r="60" fill="${C.red}" stroke="${C.redDeep}" stroke-width="2"/>` +
    // petal folds on the cheeks
    `<path d="M66 118q12 -18 30 -16" stroke="${C.redDeep}" stroke-width="2.5" fill="none" stroke-linecap="round" opacity="0.8"/>` +
    `<path d="M174 118q-12 -18 -30 -16" stroke="${C.redDeep}" stroke-width="2.5" fill="none" stroke-linecap="round" opacity="0.8"/>` +
    // the face sits on the lighter inner petals
    `<ellipse cx="120" cy="121" rx="47" ry="40" fill="${C.redFace}"/>` +
    // crown: a rolled petal with the spiral centre
    `<ellipse cx="120" cy="64" rx="30" ry="17" fill="#d81e3c" stroke="${C.redDeep}" stroke-width="2.2"/>` +
    spiral(120, 63) +
    `<path d="M92 70q10 -16 28 -18" stroke="${C.redLight}" stroke-width="2.5" fill="none" stroke-linecap="round" opacity="0.9"/>` +
    // soft highlight
    `<ellipse cx="86" cy="88" rx="13" ry="7" transform="rotate(-35 86 88)" fill="${C.redLight}" opacity="0.65"/>`;
}

// Big anime eyes: white, green iris, dark pupil, two highlights, a lash line.
function eye(cx, cy, { dx = 0, dy = 0 } = {}) {
  return `<ellipse cx="${n(cx)}" cy="${n(cy)}" rx="13.5" ry="17" fill="${C.white}" stroke="${C.ink}" stroke-width="2"/>` +
    `<circle cx="${n(cx + dx)}" cy="${n(cy + 2 + dy)}" r="10" fill="${C.iris}"/>` +
    `<circle cx="${n(cx + dx)}" cy="${n(cy + 3 + dy)}" r="6" fill="${C.pupil}"/>` +
    `<circle cx="${n(cx - 4 + dx)}" cy="${n(cy - 4 + dy)}" r="4.2" fill="${C.white}"/>` +
    `<circle cx="${n(cx + 4 + dx)}" cy="${n(cy + 6 + dy)}" r="2" fill="${C.white}"/>` +
    `<path d="M${n(cx - 13)} ${n(cy - 9)}q13 -14 26 0" stroke="${C.ink}" stroke-width="3.2" fill="none" stroke-linecap="round"/>`;
}

const closedHappyEye = (cx, cy) => `<path d="M${n(cx - 12)} ${n(cy + 2)}q12 -14 24 0" stroke="${C.ink}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
const brow = (cx, cy, lift = 0, tilt = 0) => `<path d="M${n(cx - 11)} ${n(cy - lift + tilt)}q11 -6 22 ${n(-tilt * 2)}" stroke="#7a1020" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
const blush = () => `<ellipse cx="84" cy="138" rx="9" ry="5" fill="${C.blush}" opacity="0.75"/><ellipse cx="156" cy="138" rx="9" ry="5" fill="${C.blush}" opacity="0.75"/>`;

function face(expression) {
  const L = 100;
  const R = 140;
  const Y = 120;
  let eyes;
  let brows;
  let mouth;
  switch (expression) {
    case 'cheer':
      eyes = closedHappyEye(L, Y) + closedHappyEye(R, Y);
      brows = brow(L, Y - 12, 3) + brow(R, Y - 12, 3);
      mouth = `<path d="M108 141q12 16 24 0z" fill="${C.ink}"/><path d="M114 147q6 5 12 0z" fill="#ff7f93"/>`;
      break;
    case 'oops':
      eyes = eye(L, Y, { dx: -2, dy: -2 }) + eye(R, Y, { dx: -2, dy: -2 });
      brows = brow(L, Y - 14, 5, 2) + brow(R, Y - 14, 0, -3);
      mouth = `<path d="M111 146q4.5 -5 9 0t9 0" stroke="${C.ink}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
      break;
    case 'point':
      eyes = eye(L, Y, { dx: 3 }) + eye(R, Y, { dx: 3 });
      brows = brow(L, Y - 12) + brow(R, Y - 12);
      mouth = `<path d="M112 143q8 8 16 0" stroke="${C.ink}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
      break;
    default: // happy, wave
      eyes = eye(L, Y) + eye(R, Y);
      brows = brow(L, Y - 12) + brow(R, Y - 12);
      mouth = `<path d="M110 142q10 10 20 0" stroke="${C.ink}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
  }
  return blush() + eyes + brows + mouth;
}

// Leaf arms grow from the shoulders, just under the bloom, and are drawn in
// front of it so a raised or pointing leaf is visible beside her face.
function arms(expression) {
  const left = (angle, len = 46) => leaf(104, 176, angle, len, 24);
  const right = (angle, len = 46) => leaf(136, 176, angle, len, 24);
  switch (expression) {
    case 'wave': return left(165) + right(-42, 62);
    case 'point': return left(165) + right(-5, 62);
    case 'cheer': return left(-150, 54) + right(-30, 54);
    case 'oops': return left(-140, 52) + right(30);
    default: return left(170) + right(10);
  }
}

function extras(expression) {
  if (expression === 'cheer') return star(58, 66, 11) + star(186, 56, 9) + star(196, 118, 6);
  if (expression === 'oops') {
    return `<path d="M176 92c0 -8 7 -16 7 -20c0 4 7 12 7 20a7 7 0 0 1 -14 0z" fill="${C.drop}" stroke="${C.dropEdge}" stroke-width="1.5"/>`;
  }
  if (expression === 'wave') return star(190, 70, 7);
  return '';
}

const TITLES = {
  wave: 'Rosie, the Rose Float rose, waving hello',
  point: 'Rosie pointing at the next thing to look at',
  happy: 'Rosie watching, happy',
  cheer: 'Rosie cheering: that was right',
  oops: 'Rosie with a sweat drop: not yet, try again',
};

function render(expression) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 260" width="240" height="260" role="img" aria-labelledby="t">
<title id="t">${TITLES[expression]}</title>
${badge()}
${feet()}
${stem()}
${skirt()}
${head()}
${arms(expression)}
${face(expression)}
${extras(expression)}
</svg>
`;
}

await fs.mkdir(OUT_DIR, { recursive: true });
for (const expression of EXPRESSIONS) {
  const file = path.join(OUT_DIR, `rosie-${expression}.svg`);
  await fs.writeFile(file, render(expression), 'utf8');
  console.log(file);
}

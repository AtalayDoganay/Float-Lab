// Rosie's face, drawn on a square 2D canvas that is mapped onto the curved
// face plate of her head: a pale disc with an ink rim, two huge anime eyes
// (white, a green iris with a dark pupil and two highlights, a thick upper
// lid), small brows, flat blush marks and a small mouth. `faceParams` is the
// expression table, with the interaction mood laid over it; `drawFace`
// paints one frame from those params and the moving parts (where she looks,
// how far a blink has closed her eyes, how open her mouth is while she
// talks). Everything goes through the context argument so the drawing can
// be checked without a browser.

export const FACE_SIZE = 512;

const INK = '#5a0c20';
const SKIN = '#ffe6eb';
const SKIN_SHADE = '#ffd3dc';
const WHITE = '#ffffff';
const IRIS_TOP = '#1d6b3d';
const IRIS_LOW = '#62d394';
const PUPIL = '#1c1822';
const MOUTH_IN = '#5e1b29';
const TONGUE = '#ff7a93';
const BLUSH = '#ff9fb3';

const PARAMS = Object.freeze({
  wave: { eye: 'open', brow: 'up', mouth: 'grin', blush: 0.6 },
  point: { eye: 'open', brow: 'determined', mouth: 'smile', blush: 0.4 },
  happy: { eye: 'happy', brow: 'none', mouth: 'cat', blush: 0.6 },
  cheer: { eye: 'closed', brow: 'up', mouth: 'open', blush: 1 },
  oops: { eye: 'wide', brow: 'worried', mouth: 'wobble', blush: 0.3 },
  idle: { eye: 'open', brow: 'none', mouth: 'smile', blush: 0.4 },
});

// What the learner's pointer does to her face, laid over the expression.
const MOODS = Object.freeze({
  notice: { blush: 0.5 },
  hover: { eye: 'sparkle', brow: 'up', mouth: 'grin', blush: 0.8 },
  boop: { eye: 'squeeze', brow: 'up', mouth: 'o', blush: 1 },
  giggle: { eye: 'happy', brow: 'up', mouth: 'grin', blush: 1 },
  dizzy: { eye: 'dizzy', brow: 'worried', mouth: 'wobble', blush: 0.5 },
  pet: { eye: 'happy', brow: 'none', mouth: 'cat', blush: 1 },
  sleep: { eye: 'sleep', brow: 'none', mouth: 'smile', blush: 0.3 },
  startle: { eye: 'wide', brow: 'up', mouth: 'o', blush: 0.5 },
});

export function faceParams(expression, mood = 'none') {
  const base = PARAMS[expression] || PARAMS.idle;
  const over = MOODS[mood];
  return over ? { ...base, ...over } : { ...base };
}

// Layout in canvas pixels (the plate is drawn centred).
const CX = FACE_SIZE / 2;
const CY = FACE_SIZE / 2;
const DISC_R = 236;
const EYE_Y = 262;
const EYE_DX = 98;
const EYE_RX = 60;
const EYE_RY = 76;
const BROW_Y = 150;
const BLUSH_Y = 326;
const BLUSH_DX = 158;
const MOUTH_Y = 362;

function circle(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
}

function ellipse(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
}

function base(ctx) {
  ctx.fillStyle = SKIN;
  circle(ctx, CX, CY, DISC_R);
  ctx.fill();
  // A soft shade along the lower rim, so the plate reads as slightly domed.
  const g = ctx.createRadialGradient(CX, CY - 40, DISC_R * 0.55, CX, CY, DISC_R);
  g.addColorStop(0, 'rgba(255, 211, 220, 0)');
  g.addColorStop(1, SKIN_SHADE);
  ctx.fillStyle = g;
  circle(ctx, CX, CY, DISC_R);
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 10;
  circle(ctx, CX, CY, DISC_R - 5);
  ctx.stroke();
}

// One open eye: white, iris, pupil, highlights, then the thick upper lid.
function openEye(ctx, x, y, rx, ry, look, { sparkle = false } = {}) {
  const dx = look.x * 15;
  const dy = look.y * 10;
  ctx.fillStyle = WHITE;
  ellipse(ctx, x, y, rx, ry);
  ctx.fill();
  ctx.save();
  ellipse(ctx, x, y, rx, ry);
  ctx.clip();
  const irx = rx * 0.78;
  const iry = ry * 0.8;
  const g = ctx.createLinearGradient(0, y + dy - iry, 0, y + dy + iry);
  g.addColorStop(0, IRIS_TOP);
  g.addColorStop(1, IRIS_LOW);
  ctx.fillStyle = g;
  ellipse(ctx, x + dx, y + dy + 4, irx, iry);
  ctx.fill();
  ctx.fillStyle = PUPIL;
  ellipse(ctx, x + dx, y + dy + 6, irx * 0.5, iry * 0.52);
  ctx.fill();
  // A pale crescent low in the iris gives it the glassy anime depth.
  ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
  ellipse(ctx, x + dx, y + dy + iry * 0.58, irx * 0.55, iry * 0.26);
  ctx.fill();
  // Two highlights: the big one high and to the left, the small one low right.
  ctx.fillStyle = WHITE;
  circle(ctx, x + dx - rx * 0.3, y + dy - ry * 0.36, rx * 0.3);
  ctx.fill();
  circle(ctx, x + dx + rx * 0.32, y + dy + ry * 0.32, rx * 0.13);
  ctx.fill();
  if (sparkle) {
    // A third, star-shaped glint when she is pleased to see the pointer.
    const sx = x + dx + rx * 0.08;
    const sy = y + dy - ry * 0.05;
    const r = rx * 0.2;
    ctx.beginPath();
    for (let i = 0; i < 8; i += 1) {
      const a = (i * Math.PI) / 4 - Math.PI / 2;
      const rr = i % 2 === 0 ? r : r * 0.35;
      ctx.lineTo(sx + Math.cos(a) * rr, sy + Math.sin(a) * rr);
    }
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  // The outline, heavier on the upper lid, with a lash flick at the outer corner.
  ctx.strokeStyle = INK;
  ctx.lineWidth = 7;
  ellipse(ctx, x, y, rx, ry);
  ctx.stroke();
  ctx.lineWidth = 14;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, Math.PI * 1.15, Math.PI * 1.85);
  ctx.stroke();
  const side = x < CX ? -1 : 1;
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(x + side * rx * 0.82, y - ry * 0.5);
  ctx.lineTo(x + side * rx * 1.12, y - ry * 0.78);
  ctx.stroke();
}

// A closed lid, happy (curving up like a smile) or shut (curving down).
function lidEye(ctx, x, y, w, up) {
  ctx.strokeStyle = INK;
  ctx.lineWidth = 13;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - w, y);
  ctx.quadraticCurveTo(x, y + (up ? -w * 1.1 : w * 0.7), x + w, y);
  ctx.stroke();
}

// Eyes squeezed shut: a > < pair, the outer corners pointing out.
function squeezeEye(ctx, x, y, w) {
  const side = x < CX ? -1 : 1;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 12;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x - side * w, y - w * 0.8);
  ctx.lineTo(x + side * w * 0.6, y);
  ctx.lineTo(x - side * w, y + w * 0.8);
  ctx.stroke();
}

function dizzyEye(ctx, x, y, r) {
  ctx.strokeStyle = INK;
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = 0; i <= 40; i += 1) {
    const a = (i / 40) * Math.PI * 4.5;
    const rr = (i / 40) * r;
    const px = x + Math.cos(a) * rr;
    const py = y + Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
}

// Half-closed lids, for dozing: the white shows as a sliver under a heavy lid.
function sleepyEye(ctx, x, y, w) {
  ctx.strokeStyle = INK;
  ctx.lineWidth = 12;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - w, y + 6);
  ctx.quadraticCurveTo(x, y + 18, x + w, y + 6);
  ctx.stroke();
}

function eyes(ctx, style, look, blink) {
  const wide = style === 'wide';
  const rx = wide ? EYE_RX * 1.08 : EYE_RX;
  const ry = (wide ? EYE_RY * 1.12 : EYE_RY) * (1 - blink);
  for (const side of [-1, 1]) {
    const x = CX + side * EYE_DX;
    if (style === 'happy') lidEye(ctx, x, EYE_Y, 46, true);
    else if (style === 'closed') lidEye(ctx, x, EYE_Y, 42, true);
    else if (style === 'squeeze') squeezeEye(ctx, x, EYE_Y, 34);
    else if (style === 'dizzy') dizzyEye(ctx, x, EYE_Y, 44);
    else if (style === 'sleep') sleepyEye(ctx, x, EYE_Y, 44);
    else if (blink > 0.85) lidEye(ctx, x, EYE_Y, 44, false);
    else openEye(ctx, x, EYE_Y, rx, Math.max(ry, 3), look, { sparkle: style === 'sparkle' });
  }
}

function brows(ctx, style) {
  if (style === 'none') return;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  for (const side of [-1, 1]) {
    const outer = CX + side * (EYE_DX + 34);
    const inner = CX + side * (EYE_DX - 28);
    ctx.beginPath();
    if (style === 'up') {
      ctx.moveTo(outer, BROW_Y + 4);
      ctx.quadraticCurveTo(CX + side * EYE_DX, BROW_Y - 26, inner, BROW_Y + 4);
    } else if (style === 'worried') {
      ctx.moveTo(outer, BROW_Y + 10);
      ctx.lineTo(inner, BROW_Y - 10);
    } else {
      // determined: inner ends down
      ctx.moveTo(outer, BROW_Y - 6);
      ctx.lineTo(inner, BROW_Y + 12);
    }
    ctx.stroke();
  }
}

function blush(ctx, amount) {
  if (amount <= 0) return;
  ctx.save();
  ctx.globalAlpha = 0.55 + 0.45 * Math.min(amount, 1);
  ctx.fillStyle = BLUSH;
  for (const side of [-1, 1]) {
    ellipse(ctx, CX + side * BLUSH_DX, BLUSH_Y, 30 + 10 * amount, 16 + 6 * amount);
    ctx.fill();
  }
  ctx.restore();
}

function mouth(ctx, style, open) {
  ctx.strokeStyle = INK;
  ctx.fillStyle = MOUTH_IN;
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const y = MOUTH_Y;
  if (style === 'smile' || style === 'grin') {
    const w = style === 'grin' ? 40 : 26;
    const depth = (style === 'grin' ? 30 : 16) + open * 18;
    if (open > 0.2) {
      ctx.beginPath();
      ctx.moveTo(CX - w, y);
      ctx.quadraticCurveTo(CX, y + depth * 1.6, CX + w, y);
      ctx.quadraticCurveTo(CX, y + depth * 0.2, CX - w, y);
      ctx.fill();
      ctx.fillStyle = TONGUE;
      ellipse(ctx, CX, y + depth * 0.8, w * 0.45, depth * 0.3);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.moveTo(CX - w, y);
    ctx.quadraticCurveTo(CX, y + depth, CX + w, y);
    ctx.stroke();
  } else if (style === 'cat') {
    // The little ω: two arcs meeting in the middle.
    const w = 22;
    const d = 14 + open * 10;
    ctx.beginPath();
    ctx.moveTo(CX - 2 * w, y);
    ctx.quadraticCurveTo(CX - w, y + d * 1.6, CX, y);
    ctx.quadraticCurveTo(CX + w, y + d * 1.6, CX + 2 * w, y);
    ctx.stroke();
  } else if (style === 'open') {
    const ry = 22 + open * 12;
    ellipse(ctx, CX, y + 10, 30, ry);
    ctx.fill();
    ctx.fillStyle = TONGUE;
    ellipse(ctx, CX, y + 10 + ry * 0.55, 16, ry * 0.4);
    ctx.fill();
    ctx.lineWidth = 7;
    ellipse(ctx, CX, y + 10, 30, ry);
    ctx.stroke();
  } else if (style === 'o') {
    ellipse(ctx, CX, y + 6, 13, 16 + open * 8);
    ctx.fill();
    ctx.lineWidth = 7;
    ellipse(ctx, CX, y + 6, 13, 16 + open * 8);
    ctx.stroke();
  } else {
    // wobble: a wavy worried line
    const w = 34;
    const a = 7 + open * 7;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(CX - w, y);
    ctx.quadraticCurveTo(CX - w * 0.66, y - a, CX - w * 0.33, y);
    ctx.quadraticCurveTo(CX, y + a, CX + w * 0.33, y);
    ctx.quadraticCurveTo(CX + w * 0.66, y - a, CX + w, y);
    ctx.stroke();
  }
}

export function drawFace(ctx, params, { look = { x: 0, y: 0 }, blink = 0, mouthOpen = 0 } = {}) {
  ctx.save();
  ctx.clearRect(0, 0, FACE_SIZE, FACE_SIZE);
  base(ctx);
  blush(ctx, params.blush);
  brows(ctx, params.brow);
  eyes(ctx, params.eye, look, Math.min(Math.max(blink, 0), 1));
  mouth(ctx, params.mouth, Math.min(Math.max(mouthOpen, 0), 1));
  ctx.restore();
}

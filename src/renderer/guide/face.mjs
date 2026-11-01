// Rosie's face, drawn on a square 2D canvas that is mapped onto the curved
// face plate of her head. The face is parametric: brows (angle, height,
// curve), eyes (shape, openness, pupil size), the mouth (style, width,
// baseline openness), blush, and marks (tears, sweat, anger veins, teeth).
// The expression table is the brief's chart of twenty-four faces in six
// families of four, plus five useful extras; the interaction moods lay their
// own eyes and mouth over any expression; speaking opens the mouth further.
// Everything goes through the context argument so the drawing can be
// checked without a browser.

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
const TEETH = '#fff8f0';
const BLUSH = '#ff9fb3';
const TEAR = '#9fd8ff';
const VEIN = '#c8233f';

export const EXPRESSION_FAMILIES = Object.freeze({
  firmness: Object.freeze(['sternness', 'indignation', 'anger', 'rage']),
  dislike: Object.freeze(['disdain', 'aversion', 'disgust', 'revulsion']),
  worry: Object.freeze(['concern', 'anxiety', 'fear', 'terror']),
  happiness: Object.freeze(['satisfaction', 'amusement', 'joy', 'laughter']),
  sadness: Object.freeze(['dejection', 'melancholy', 'sadness', 'grief']),
  discovery: Object.freeze(['alertness', 'wonder', 'surprise', 'shock']),
});
export const EXTRA_EXPRESSIONS = Object.freeze(['neutral', 'curious', 'reassuring', 'sheepish', 'nerdy']);
export const EXPRESSION_NAMES = Object.freeze([...Object.values(EXPRESSION_FAMILIES).flat(), ...EXTRA_EXPRESSIONS]);

// Legacy and gesture names resolve to a face in the palette.
export const FACE_ALIASES = Object.freeze({ wave: 'joy', point: 'alertness', happy: 'satisfaction', cheer: 'laughter', oops: 'anxiety', idle: 'neutral', tickled: 'laughter' });

const DEFAULTS = Object.freeze({ eyeShape: 'round', eyeOpen: 0.85, pupil: 1, browAngle: 0, browHeight: 0, browCurve: 0.4, browAsym: 0, mouth: 'smile', mouthWidth: 1, mouthOpen: 0, blush: 0.4, tears: false, sweat: false, veins: false, teeth: false });
const face = (o) => Object.freeze({ ...DEFAULTS, ...o });

// browAngle: negative knits the brows (inner ends down), positive worries them (inner ends up).
// browHeight: negative presses them down, positive raises them. eyeOpen: 0 shut to 1.3 wide.
const TABLE = Object.freeze({
  // firmness / frustration (at her own mishaps, never at the learner)
  sternness: face({ eyeShape: 'narrow', eyeOpen: 0.7, browAngle: -0.4, browHeight: -0.2, browCurve: 0.1, mouth: 'flat', mouthWidth: 1, blush: 0.2, pupil: 0.9 }),
  indignation: face({ eyeShape: 'narrow', eyeOpen: 0.75, browAngle: -0.7, browHeight: -0.4, browCurve: 0.1, mouth: 'frown', mouthWidth: 0.9, blush: 0.35, pupil: 0.9 }),
  anger: face({ eyeShape: 'round', eyeOpen: 0.9, browAngle: -1, browHeight: -0.7, browCurve: 0, mouth: 'grimace', mouthWidth: 1.1, blush: 0.5, pupil: 0.8 }),
  rage: face({ eyeShape: 'wide', eyeOpen: 1.2, browAngle: -1, browHeight: -0.9, browCurve: 0, mouth: 'teeth', mouthWidth: 1.3, mouthOpen: 0.3, blush: 0.7, pupil: 0.6, veins: true, teeth: true }),
  // dislike (a cartoon "yuck" at a staged messy example)
  disdain: face({ eyeShape: 'narrow', eyeOpen: 0.6, browAngle: 0.1, browHeight: 0.3, browAsym: 1, mouth: 'flat', mouthWidth: 0.8, blush: 0.2, pupil: 1 }),
  aversion: face({ eyeShape: 'narrow', eyeOpen: 0.55, browAngle: -0.3, browHeight: 0, mouth: 'frown', mouthWidth: 0.7, blush: 0.25, pupil: 0.6 }),
  disgust: face({ eyeShape: 'narrow', eyeOpen: 0.45, browAngle: -0.6, browHeight: -0.3, mouth: 'grimace', mouthWidth: 1, blush: 0.4, pupil: 0.7 }),
  revulsion: face({ eyeShape: 'squeeze', eyeOpen: 0.2, browAngle: -0.9, browHeight: -0.5, mouth: 'grimace', mouthWidth: 1.2, mouthOpen: 0.4, blush: 0.6, pupil: 0.6, sweat: true }),
  // worry (ordinary help stays reassuring; alarm is brief and cartoonish)
  concern: face({ eyeShape: 'round', eyeOpen: 0.85, browAngle: 0.4, browHeight: 0.1, mouth: 'flat', mouthWidth: 0.9, blush: 0.3, pupil: 1 }),
  anxiety: face({ eyeShape: 'wide', eyeOpen: 1, browAngle: 0.7, browHeight: 0.3, mouth: 'wobble', mouthWidth: 1, blush: 0.3, pupil: 0.9, sweat: true }),
  fear: face({ eyeShape: 'wide', eyeOpen: 1.15, browAngle: 0.9, browHeight: 0.6, mouth: 'gasp', mouthWidth: 0.9, blush: 0.2, pupil: 0.6, sweat: true }),
  terror: face({ eyeShape: 'wide', eyeOpen: 1.3, browAngle: 1, browHeight: 0.9, mouth: 'gasp', mouthWidth: 1.3, mouthOpen: 0.6, blush: 0.1, pupil: 0.5, sweat: true }),
  // happiness, her most frequent family
  satisfaction: face({ eyeShape: 'round', eyeOpen: 0.8, browAngle: 0.1, browHeight: 0.1, mouth: 'smile', mouthWidth: 1, blush: 0.5, pupil: 1 }),
  amusement: face({ eyeShape: 'happy', eyeOpen: 0.5, browHeight: 0.3, mouth: 'grin', mouthWidth: 1.1, blush: 0.6, pupil: 1 }),
  joy: face({ eyeShape: 'sparkle', eyeOpen: 1, browHeight: 0.5, mouth: 'grin', mouthWidth: 1.2, mouthOpen: 0.4, blush: 0.8, pupil: 1.1 }),
  laughter: face({ eyeShape: 'closed', eyeOpen: 0, browHeight: 0.7, mouth: 'open', mouthWidth: 1.1, mouthOpen: 0.6, blush: 1, pupil: 1 }),
  // sadness, used sparingly
  dejection: face({ eyeShape: 'round', eyeOpen: 0.6, browAngle: 0.3, browHeight: -0.3, mouth: 'flat', mouthWidth: 0.8, blush: 0.2, pupil: 0.9 }),
  melancholy: face({ eyeShape: 'narrow', eyeOpen: 0.6, browAngle: 0.5, browHeight: 0, mouth: 'frown', mouthWidth: 0.8, blush: 0.3, pupil: 0.9 }),
  sadness: face({ eyeShape: 'round', eyeOpen: 0.75, browAngle: 0.8, browHeight: 0.2, mouth: 'frown', mouthWidth: 1, mouthOpen: 0.2, blush: 0.4, pupil: 1.1, tears: true }),
  grief: face({ eyeShape: 'squeeze', eyeOpen: 0.15, browAngle: 1, browHeight: 0.4, mouth: 'cry', mouthWidth: 1.3, mouthOpen: 0.6, blush: 0.5, pupil: 1, tears: true }),
  // discovery
  alertness: face({ eyeShape: 'round', eyeOpen: 0.95, browAngle: 0, browHeight: 0.5, mouth: 'smile', mouthWidth: 0.9, blush: 0.4, pupil: 0.7 }),
  wonder: face({ eyeShape: 'round', eyeOpen: 1.05, browAngle: 0.1, browHeight: 0.6, mouth: 'o', mouthWidth: 0.8, mouthOpen: 0.3, blush: 0.6, pupil: 1.1 }),
  surprise: face({ eyeShape: 'wide', eyeOpen: 1.2, browAngle: 0, browHeight: 0.85, mouth: 'gasp', mouthWidth: 1, mouthOpen: 0.5, blush: 0.5, pupil: 0.7 }),
  shock: face({ eyeShape: 'wide', eyeOpen: 1.3, browAngle: 0.3, browHeight: 1, mouth: 'gasp', mouthWidth: 1.3, mouthOpen: 0.9, blush: 0.2, pupil: 0.5 }),
  // extras
  neutral: face({ eyeShape: 'round', eyeOpen: 0.85, mouth: 'smile', mouthWidth: 0.8, blush: 0.4 }),
  curious: face({ eyeShape: 'round', eyeOpen: 0.9, browAngle: 0.2, browHeight: 0.5, browAsym: 1, mouth: 'o', mouthWidth: 0.7, mouthOpen: 0.2, blush: 0.5 }),
  reassuring: face({ eyeShape: 'happy', eyeOpen: 0.5, browHeight: 0.2, mouth: 'smile', mouthWidth: 1.1, blush: 0.6 }),
  sheepish: face({ eyeShape: 'narrow', eyeOpen: 0.6, browAngle: 0.6, browHeight: 0.3, mouth: 'wobble', mouthWidth: 0.8, blush: 1, sweat: true }),
  nerdy: face({ eyeShape: 'round', eyeOpen: 0.8, browAngle: -0.2, browHeight: 0.1, mouth: 'smile', mouthWidth: 0.7, blush: 0.3, pupil: 0.7 }),
});

// What the learner's pointer does to her face, laid over the expression.
const MOODS = Object.freeze({
  notice: { blush: 0.5 },
  hover: { eyeShape: 'sparkle', eyeOpen: 1, browHeight: 0.6, mouth: 'grin', blush: 0.8 },
  boop: { eyeShape: 'squeeze', eyeOpen: 0.2, browHeight: 0.6, mouth: 'o', mouthOpen: 0.4, blush: 1 },
  giggle: { eyeShape: 'happy', eyeOpen: 0.5, browHeight: 0.6, mouth: 'grin', blush: 1 },
  dizzy: { eyeShape: 'dizzy', eyeOpen: 1, browAngle: 0.7, mouth: 'wobble', blush: 0.5 },
  pet: { eyeShape: 'happy', eyeOpen: 0.5, browHeight: 0, mouth: 'cat', blush: 1 },
  sleep: { eyeShape: 'sleep', eyeOpen: 0.2, browHeight: 0, mouth: 'smile', mouthOpen: 0, blush: 0.3 },
  startle: { eyeShape: 'wide', eyeOpen: 1.3, browHeight: 0.8, mouth: 'o', mouthOpen: 0.5, blush: 0.5 },
});

export function faceParams(expression, mood = 'none') {
  const name = FACE_ALIASES[expression] || expression;
  const base = TABLE[name] || TABLE.neutral;
  const over = MOODS[mood];
  if (!over) return { ...base };
  const merged = { ...base, ...over };
  if (mood === 'notice') merged.blush = Math.max(base.blush, over.blush);
  return merged;
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

function circle(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); }
function ellipse(ctx, x, y, rx, ry) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); }

function base(ctx) {
  ctx.fillStyle = SKIN;
  circle(ctx, CX, CY, DISC_R);
  ctx.fill();
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
function openEye(ctx, x, y, rx, ry, look, { sparkle = false, pupil = 1 } = {}) {
  const dx = look.x * 15;
  const dy = look.y * 10;
  ctx.fillStyle = WHITE;
  ellipse(ctx, x, y, rx, ry);
  ctx.fill();
  ctx.save();
  ellipse(ctx, x, y, rx, ry);
  ctx.clip();
  const irx = rx * 0.78 * (0.75 + 0.25 * pupil);
  const iry = ry * 0.8 * (0.75 + 0.25 * pupil);
  const g = ctx.createLinearGradient(0, y + dy - iry, 0, y + dy + iry);
  g.addColorStop(0, IRIS_TOP);
  g.addColorStop(1, IRIS_LOW);
  ctx.fillStyle = g;
  ellipse(ctx, x + dx, y + dy + 4, irx, iry);
  ctx.fill();
  ctx.fillStyle = PUPIL;
  ellipse(ctx, x + dx, y + dy + 6, irx * 0.5 * pupil, iry * 0.52 * pupil);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
  ellipse(ctx, x + dx, y + dy + iry * 0.58, irx * 0.55, iry * 0.26);
  ctx.fill();
  ctx.fillStyle = WHITE;
  circle(ctx, x + dx - rx * 0.3, y + dy - ry * 0.36, rx * 0.3);
  ctx.fill();
  circle(ctx, x + dx + rx * 0.32, y + dy + ry * 0.32, rx * 0.13);
  ctx.fill();
  if (sparkle) {
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

function sleepyEye(ctx, x, y, w) {
  ctx.strokeStyle = INK;
  ctx.lineWidth = 12;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - w, y + 6);
  ctx.quadraticCurveTo(x, y + 18, x + w, y + 6);
  ctx.stroke();
}

function eyes(ctx, p, look, blink) {
  const open = Math.max(0, Math.min(1.3, p.eyeOpen)) * (1 - blink);
  for (const side of [-1, 1]) {
    const x = CX + side * EYE_DX;
    if (p.eyeShape === 'happy') lidEye(ctx, x, EYE_Y, 46, true);
    else if (p.eyeShape === 'closed') lidEye(ctx, x, EYE_Y, 42, true);
    else if (p.eyeShape === 'squeeze') squeezeEye(ctx, x, EYE_Y, 34);
    else if (p.eyeShape === 'dizzy') dizzyEye(ctx, x, EYE_Y, 44);
    else if (p.eyeShape === 'sleep') sleepyEye(ctx, x, EYE_Y, 44);
    else if (blink > 0.85 || open < 0.12) lidEye(ctx, x, EYE_Y, 44, false);
    else {
      const rx = EYE_RX * (p.eyeShape === 'wide' ? 1.08 : p.eyeShape === 'narrow' ? 1.02 : 1);
      const ry = EYE_RY * open * (p.eyeShape === 'narrow' ? 0.7 : 1);
      openEye(ctx, x, EYE_Y, rx, Math.max(ry, 3), look, { sparkle: p.eyeShape === 'sparkle', pupil: p.pupil });
    }
  }
}

// Brows: raised by browHeight, inner ends tilted by browAngle (positive up, worried; negative down, knit).
function brows(ctx, p) {
  ctx.strokeStyle = INK;
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  for (const side of [-1, 1]) {
    const asym = p.browAsym && side === 1 ? 1 : 0; // the right brow lifts alone when asymmetric
    const lift = (p.browHeight + asym * 0.5) * 34;
    const y = BROW_Y - lift;
    const outer = CX + side * (EYE_DX + 34);
    const inner = CX + side * (EYE_DX - 28);
    const innerY = y - p.browAngle * 22;
    const outerY = y + p.browAngle * 6;
    ctx.beginPath();
    ctx.moveTo(outer, outerY);
    ctx.quadraticCurveTo(CX + side * EYE_DX, y - p.browCurve * 30, inner, innerY);
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

function marks(ctx, p) {
  if (p.tears) {
    ctx.fillStyle = TEAR;
    for (const side of [-1, 1]) {
      const x = CX + side * (EYE_DX + 10);
      ellipse(ctx, x, EYE_Y + 70, 9, 16);
      ctx.fill();
      ellipse(ctx, x + side * 6, EYE_Y + 104, 7, 12);
      ctx.fill();
    }
  }
  if (p.sweat) {
    ctx.fillStyle = TEAR;
    ellipse(ctx, CX + EYE_DX + 92, EYE_Y - 60, 10, 17);
    ctx.fill();
  }
  if (p.veins) {
    ctx.strokeStyle = VEIN;
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    const vx = CX - EYE_DX - 92;
    const vy = BROW_Y - 30;
    ctx.beginPath();
    for (const [a, b] of [[[-16, -6], [16, -6]], [[-16, 6], [16, 6]], [[-6, -16], [-6, 16]], [[6, -16], [6, 16]]]) {
      ctx.moveTo(vx + a[0], vy + a[1]);
      ctx.lineTo(vx + b[0], vy + b[1]);
    }
    ctx.stroke();
  }
}

// The mouth: its style and width from the expression; `open` is the larger
// of the expression's baseline openness and the speaking envelope. An open
// mouth paints an interior (> 0.2), a tongue (> 0.5) and a tooth row (> 0.8).
function mouth(ctx, p, open) {
  ctx.strokeStyle = INK;
  ctx.fillStyle = MOUTH_IN;
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const y = MOUTH_Y;
  const w = 30 * p.mouthWidth;
  const style = p.mouth;
  const interior = (depth) => {
    if (open <= 0.2) return;
    ctx.fillStyle = MOUTH_IN;
    ellipse(ctx, CX, y + depth * 0.4, w * 0.8, Math.max(6, depth * 0.9));
    ctx.fill();
    if (open > 0.5) { ctx.fillStyle = TONGUE; ellipse(ctx, CX, y + depth * 0.7, w * 0.45, Math.max(4, depth * 0.35)); ctx.fill(); }
    if (open > 0.8) { ctx.fillStyle = TEETH; ctx.fillRect(CX - w * 0.6, y + depth * 0.05, w * 1.2, 7); }
  };
  if (style === 'smile' || style === 'grin') {
    const depth = (style === 'grin' ? 30 : 16) + open * 18;
    interior(depth);
    ctx.strokeStyle = INK;
    ctx.beginPath();
    ctx.moveTo(CX - w, y);
    ctx.quadraticCurveTo(CX, y + depth, CX + w, y);
    ctx.stroke();
  } else if (style === 'cat') {
    const d = 14 + open * 10;
    interior(d);
    ctx.strokeStyle = INK;
    ctx.beginPath();
    ctx.moveTo(CX - 1.5 * w, y);
    ctx.quadraticCurveTo(CX - 0.75 * w, y + d * 1.6, CX, y);
    ctx.quadraticCurveTo(CX + 0.75 * w, y + d * 1.6, CX + 1.5 * w, y);
    ctx.stroke();
  } else if (style === 'open' || style === 'gasp' || style === 'cry') {
    const ry = (style === 'gasp' ? 16 : 22) + open * 16;
    ctx.fillStyle = MOUTH_IN;
    ellipse(ctx, CX, y + 10, w, ry);
    ctx.fill();
    if (open > 0.2) { ctx.fillStyle = TONGUE; ellipse(ctx, CX, y + 10 + ry * 0.55, w * 0.55, ry * 0.4); ctx.fill(); }
    if (open > 0.5) { ctx.fillStyle = TEETH; ctx.fillRect(CX - w * 0.7, y + 10 - ry + 3, w * 1.4, 8); ctx.fill(); }
    if (open > 0.8) { ctx.fillStyle = TEETH; ctx.fillRect(CX - w * 0.6, y + 10 + ry - 11, w * 1.2, 7); }
    if (style === 'cry') { ctx.fillStyle = TEAR; ellipse(ctx, CX, y + 10 + ry * 0.2, w * 0.3, 6); ctx.fill(); }
    ctx.strokeStyle = INK;
    ctx.lineWidth = 7;
    ellipse(ctx, CX, y + 10, w, ry);
    ctx.stroke();
  } else if (style === 'o') {
    const ry = 16 + open * 10;
    ctx.fillStyle = MOUTH_IN;
    ellipse(ctx, CX, y + 6, 13 * p.mouthWidth, ry);
    ctx.fill();
    if (open > 0.5) { ctx.fillStyle = TONGUE; ellipse(ctx, CX, y + 6 + ry * 0.5, 7 * p.mouthWidth, ry * 0.3); ctx.fill(); }
    if (open > 0.8) { ctx.fillStyle = TEETH; ctx.fillRect(CX - 8 * p.mouthWidth, y + 6 - ry + 2, 16 * p.mouthWidth, 5); }
    ctx.strokeStyle = INK;
    ctx.lineWidth = 7;
    ellipse(ctx, CX, y + 6, 13 * p.mouthWidth, ry);
    ctx.stroke();
  } else if (style === 'flat') {
    interior(10 + open * 16);
    ctx.strokeStyle = INK;
    ctx.beginPath();
    ctx.moveTo(CX - w, y + 4);
    ctx.lineTo(CX + w, y + 4);
    ctx.stroke();
  } else if (style === 'frown') {
    const depth = 14 + open * 14;
    interior(depth * 0.6);
    ctx.strokeStyle = INK;
    ctx.beginPath();
    ctx.moveTo(CX - w, y + 10);
    ctx.quadraticCurveTo(CX, y - depth + 6, CX + w, y + 10);
    ctx.stroke();
  } else if (style === 'grimace' || style === 'teeth') {
    const h = 12 + open * 14;
    ctx.fillStyle = MOUTH_IN;
    ctx.fillRect(CX - w, y - h / 2, 2 * w, h);
    if (style === 'teeth' || p.teeth) {
      ctx.fillStyle = TEETH;
      ctx.fillRect(CX - w + 3, y - h / 2 + 3, 2 * w - 6, Math.max(4, h * 0.42));
      ctx.strokeStyle = INK;
      ctx.lineWidth = 3;
      for (let i = 1; i < 6; i += 1) { ctx.beginPath(); ctx.moveTo(CX - w + (2 * w * i) / 6, y - h / 2 + 3); ctx.lineTo(CX - w + (2 * w * i) / 6, y - h / 2 + 3 + h * 0.42); ctx.stroke(); }
    }
    if (open > 0.5) { ctx.fillStyle = TONGUE; ellipse(ctx, CX, y + h * 0.3, w * 0.4, Math.max(3, h * 0.2)); ctx.fill(); }
    if (open > 0.8) { ctx.fillStyle = TEETH; ctx.fillRect(CX - w * 0.5, y + h / 2 - 6, w, 5); }
    ctx.strokeStyle = INK;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(CX - w, y - h / 2);
    ctx.quadraticCurveTo(CX, y - h / 2 - 10, CX + w, y - h / 2);
    ctx.lineTo(CX + w, y + h / 2);
    ctx.quadraticCurveTo(CX, y + h / 2 + 6, CX - w, y + h / 2);
    ctx.closePath();
    ctx.stroke();
  } else {
    // wobble: a wavy worried line
    const a = 7 + open * 7;
    interior(10 + open * 14);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(CX - w, y);
    ctx.quadraticCurveTo(CX - w * 0.66, y - a, CX - w * 0.33, y);
    ctx.quadraticCurveTo(CX, y + a, CX + w * 0.33, y);
    ctx.quadraticCurveTo(CX + w * 0.66, y - a, CX + w, y);
    ctx.stroke();
  }
}

// While she talks the mouth opens past its baseline and a glint shows on the
// tongue, so every speaking face differs from its silent one.
function speechGlint(ctx, p, speak) {
  if (speak <= 0.2) return;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ellipse(ctx, CX - 6 * p.mouthWidth, MOUTH_Y + 14, 7, 4);
  ctx.fill();
}

export function drawFace(ctx, params, { look = { x: 0, y: 0 }, blink = 0, mouthOpen = 0 } = {}) {
  const p = { ...DEFAULTS, ...params };
  const speak = Math.min(Math.max(mouthOpen, 0), 1);
  ctx.save();
  ctx.clearRect(0, 0, FACE_SIZE, FACE_SIZE);
  base(ctx);
  blush(ctx, p.blush);
  brows(ctx, p);
  eyes(ctx, p, look, Math.min(Math.max(blink, 0), 1));
  marks(ctx, p);
  mouth(ctx, p, Math.min(Math.max(p.mouthOpen, speak * (0.3 + 0.7 * Math.max(p.mouthOpen, 0.6))), 1));
  speechGlint(ctx, p, speak);
  ctx.restore();
}

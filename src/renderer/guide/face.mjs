// Rosie's face, drawn on a square 2D canvas that is mapped onto the curved
// face plate of her head. `faceParams` is the expression table; `drawFace`
// paints one frame from those params and the moving parts (where she looks,
// how far a blink has closed her eyes, how open her mouth is while she
// talks). Everything goes through the context argument so the drawing can
// be checked without a browser.

export const FACE_SIZE = 512;

const INK = '#2b1b1f';
const IRIS_LOW = '#6a2e3c';
const BROW = '#8a3a4a';
const MOUTH = '#7a2a3a';
const MOUTH_IN = '#5e1b29';
const TONGUE = '#e46a7e';
const BLUSH = '255, 138, 160';

const PARAMS = Object.freeze({
  wave: { eye: 'open', brow: 'up', mouth: 'grin', blush: 0.5 },
  point: { eye: 'open', brow: 'determined', mouth: 'smile', blush: 0.35 },
  happy: { eye: 'happy', brow: 'none', mouth: 'smile', blush: 0.5 },
  cheer: { eye: 'closed', brow: 'up', mouth: 'open', blush: 1 },
  oops: { eye: 'wide', brow: 'worried', mouth: 'wobble', blush: 0.2 },
  idle: { eye: 'open', brow: 'none', mouth: 'smile', blush: 0.35 },
});

export function faceParams(expression) {
  return { ...(PARAMS[expression] || PARAMS.idle) };
}

// Layout in canvas pixels (the plate is drawn centred).
const CX = FACE_SIZE / 2;
const EYE_Y = 238;
const EYE_DX = 86;
const BROW_Y = 168;
const BLUSH_Y = 300;
const MOUTH_Y = 342;

function base(ctx) {
  const g = ctx.createRadialGradient(CX, 250, 40, CX, 250, 252);
  g.addColorStop(0, 'rgba(255, 221, 227, 1)');
  g.addColorStop(0.78, 'rgba(247, 184, 196, 1)');
  g.addColorStop(0.93, 'rgba(247, 184, 196, 0.6)');
  g.addColorStop(1, 'rgba(247, 184, 196, 0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(CX, 250, 252, 0, Math.PI * 2);
  ctx.fill();
}

function openEye(ctx, x, y, rx, ry, look) {
  const dx = look.x * 14;
  const dy = look.y * 10;
  const g = ctx.createLinearGradient(0, y - ry, 0, y + ry);
  g.addColorStop(0, INK);
  g.addColorStop(0.55, INK);
  g.addColorStop(1, IRIS_LOW);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(x + dx, y + dy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  // Two highlights: the big one high and to the left, the small one low right.
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.beginPath();
  ctx.arc(x + dx - rx * 0.32, y + dy - ry * 0.34, rx * 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.beginPath();
  ctx.arc(x + dx + rx * 0.3, y + dy + ry * 0.3, rx * 0.13, 0, Math.PI * 2);
  ctx.fill();
}

// A closed lid, happy (curving up like a smile) or shut (curving down).
function lidEye(ctx, x, y, w, up) {
  ctx.strokeStyle = INK;
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - w, y);
  ctx.quadraticCurveTo(x, y + (up ? -w * 0.9 : w * 0.7), x + w, y);
  ctx.stroke();
}

function eyes(ctx, style, look, blink) {
  const wide = style === 'wide';
  const rx = wide ? 50 : 46;
  const ry = (wide ? 64 : 56) * (1 - blink);
  for (const side of [-1, 1]) {
    const x = CX + side * EYE_DX;
    if (style === 'happy') lidEye(ctx, x, EYE_Y, 40, true);
    else if (style === 'closed') lidEye(ctx, x, EYE_Y, 36, true);
    else if (blink > 0.85) lidEye(ctx, x, EYE_Y, 38, false);
    else openEye(ctx, x, EYE_Y, rx, Math.max(ry, 2), look);
  }
}

function brows(ctx, style) {
  if (style === 'none') return;
  ctx.strokeStyle = BROW;
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  for (const side of [-1, 1]) {
    const outer = CX + side * (EYE_DX + 30);
    const inner = CX + side * (EYE_DX - 26);
    ctx.beginPath();
    if (style === 'up') {
      ctx.moveTo(outer, BROW_Y + 2);
      ctx.quadraticCurveTo(CX + side * EYE_DX, BROW_Y - 22, inner, BROW_Y + 2);
    } else if (style === 'worried') {
      ctx.moveTo(outer, BROW_Y + 8);
      ctx.lineTo(inner, BROW_Y - 8);
    } else {
      // determined: inner ends down
      ctx.moveTo(outer, BROW_Y - 4);
      ctx.lineTo(inner, BROW_Y + 10);
    }
    ctx.stroke();
  }
}

function blush(ctx, amount) {
  if (amount <= 0) return;
  for (const side of [-1, 1]) {
    const x = CX + side * 132;
    const g = ctx.createRadialGradient(x, BLUSH_Y, 4, x, BLUSH_Y, 40);
    g.addColorStop(0, `rgba(${BLUSH}, ${0.6 * amount})`);
    g.addColorStop(1, `rgba(${BLUSH}, 0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(x, BLUSH_Y, 40, 24, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function mouth(ctx, style, open) {
  ctx.strokeStyle = MOUTH;
  ctx.fillStyle = MOUTH_IN;
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const y = MOUTH_Y;
  if (style === 'smile' || style === 'grin') {
    const w = style === 'grin' ? 34 : 22;
    const depth = (style === 'grin' ? 26 : 16) + open * 14;
    ctx.beginPath();
    ctx.moveTo(CX - w, y);
    ctx.quadraticCurveTo(CX, y + depth, CX + w, y);
    if (open > 0.2) {
      ctx.quadraticCurveTo(CX, y + depth * 0.25, CX - w, y);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.moveTo(CX - w, y);
    ctx.quadraticCurveTo(CX, y + depth, CX + w, y);
    ctx.stroke();
  } else if (style === 'open') {
    const ry = 18 + open * 10;
    ctx.beginPath();
    ctx.ellipse(CX, y + 8, 26, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = TONGUE;
    ctx.beginPath();
    ctx.ellipse(CX, y + 8 + ry * 0.55, 14, ry * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (style === 'o') {
    ctx.beginPath();
    ctx.ellipse(CX, y + 4, 10, 12 + open * 6, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // wobble: a wavy worried line
    const w = 30;
    const a = 6 + open * 6;
    ctx.lineWidth = 6;
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

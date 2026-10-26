// Where Rosie stands and where her bubble goes, as pure geometry. Her canvas
// is a box with a transparent inset on every side; only the inner "visible"
// box must stay clear of the target and inside the window. The bubble sits
// on her outer side (away from the target), flips when that side has no
// room, and never covers the target either.

export const ROSIE_BOX = Object.freeze({ w: 300, h: 340, inset: 36 });

const GAP = 8; // between her visible box and the bubble
const HEAD = 0.2; // the bubble's top aligns with her head, this far down her box
const EDGE = 16; // corner placement margin

const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

export function visibleBox({ x, y }, box = ROSIE_BOX) {
  return { x: x + box.inset, y: y + box.inset, w: box.w - 2 * box.inset, h: box.h - 2 * box.inset };
}

export function intersects(a, b) {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

export function clampRect(r, viewport) {
  return { ...r, x: clamp(r.x, 0, Math.max(0, viewport.w - r.w)), y: clamp(r.y, 0, Math.max(0, viewport.h - r.h)) };
}

const fits = (r, v) => r.x >= 0 && r.y >= 0 && r.x + r.w <= v.w && r.y + r.h <= v.h;
const overlapArea = (a, b) => (intersects(a, b) ? (Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * (Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y)) : 0);

// The bubble beside her visible box `V`, in the order: the preferred side,
// its opposite, below, above. A side bubble may slide vertically to stay in
// the window; a stacked one may slide horizontally. It must not cover the
// target. When no side is clear, the side that overlaps the target and her
// the least wins, so the bubble never sits on top of her.
function placeBubble({ V, boxY, box, bubble, viewport, target, prefer, avoid = [] }) {
  const headY = boxY + HEAD * box.h;
  const rect = (side) => {
    if (side === 'right') return { side, x: V.x + V.w + GAP, y: headY, w: bubble.w, h: bubble.h };
    if (side === 'left') return { side, x: V.x - GAP - bubble.w, y: headY, w: bubble.w, h: bubble.h };
    if (side === 'below') return { side, x: V.x + V.w / 2 - bubble.w / 2, y: V.y + V.h + GAP, w: bubble.w, h: bubble.h };
    return { side, x: V.x + V.w / 2 - bubble.w / 2, y: V.y - GAP - bubble.h, w: bubble.w, h: bubble.h };
  };
  const opposite = prefer === 'right' ? 'left' : 'right';
  const order = [prefer, opposite, 'below', 'above'];
  // A bubble stacked below or above her may slide sideways to clear the target.
  const slideClear = (r) => {
    if (!target || !intersects(r, target)) return r;
    const options = [{ ...r, x: target.x - r.w - GAP }, { ...r, x: target.x + target.w + GAP }]
      .filter((o) => fits(o, viewport) && !intersects(o, target))
      .sort((a, b) => Math.abs(a.x - r.x) - Math.abs(b.x - r.x));
    return options[0] || r;
  };
  // The first side that fits, misses the target, and touches nothing avoided;
  // else, among the sides that fit and miss the target, the least weighted
  // overlap with the avoided rectangles (the panel's action rows weigh most).
  const weighted = (r) => avoid.reduce((sum, a) => sum + overlapArea(r, a) * (a.weight || 1), 0);
  const fitting = [];
  for (const side of order) {
    const raw = rect(side);
    let r = clampRect(raw, viewport);
    const slidOnMainAxis = side === 'right' || side === 'left' ? r.x !== raw.x : r.y !== raw.y;
    if (slidOnMainAxis || !fits(r, viewport)) continue;
    if (side === 'below' || side === 'above') r = slideClear(r);
    if (target && intersects(r, target)) continue;
    const cost = weighted(r);
    if (cost === 0) return { x: r.x, y: r.y, side };
    fitting.push({ x: r.x, y: r.y, side, cost });
  }
  if (fitting.length) {
    const best = fitting.reduce((b, c) => (c.cost < b.cost ? c : b));
    return { x: best.x, y: best.y, side: best.side };
  }
  let best = null;
  for (const side of [prefer, opposite, 'below', 'above']) {
    const r = clampRect(rect(side), viewport);
    const cost = (target ? overlapArea(r, target) : 0) + overlapArea(r, V) * 4;
    if (!best || cost < best.cost) best = { x: r.x, y: r.y, side, cost };
  }
  return { x: best.x, y: best.y, side: best.side };
}

function result({ V, box, side, facing, bubble, viewport, target, prefer, avoid = [], overlapsTarget = false }) {
  const x = V.x - box.inset;
  const y = V.y - box.inset;
  return { x, y, side, facing, bubble: placeBubble({ V, boxY: y, box, bubble, viewport, target, prefer, avoid }), overlapsTarget };
}

const facingFrom = (V, target) => (target.x + target.w / 2 < V.x + V.w / 2 - 1 ? 'left' : 'right');

// Beside the target, or beside `clear` (the window that holds the target),
// in that order; the first candidate that fits, misses the target, and
// touches no avoided rectangle wins. When none is clear, the one that
// overlaps the avoided rectangles the least wins.
export function placeBeside({ viewport, target, box = ROSIE_BOX, bubble, avoid = [], margin = 10, clear = null }) {
  const vw = box.w - 2 * box.inset;
  const vh = box.h - 2 * box.inset;
  const around = (t) => {
    const cy = t.y + t.h / 2 - vh / 2;
    const cx = t.x + t.w / 2 - vw / 2;
    return [
      { side: 'right', x: t.x + t.w + margin, y: cy, axis: 'x' },
      { side: 'left', x: t.x - margin - vw, y: cy, axis: 'x' },
      { side: 'below', x: cx, y: t.y + t.h + margin, axis: 'y' },
      { side: 'above', x: cx, y: t.y - margin - vh, axis: 'y' },
    ];
  };
  const candidates = clear ? [...around(target), ...around(clear)] : around(target);
  const tried = candidates.map((c) => {
    const raw = { x: c.x, y: c.y, w: vw, h: vh };
    const V = clampRect(raw, viewport);
    const ok = fits(V, viewport) && V[c.axis] === raw[c.axis] && !intersects(V, target);
    const cost = avoid.reduce((sum, a) => sum + overlapArea(V, a) * (a.weight || 1), 0);
    return { ...c, V, ok, cost, clear: ok && cost === 0 };
  });
  const okOnes = tried.filter((c) => c.ok);
  const pick = tried.find((c) => c.clear) || (okOnes.length ? okOnes.reduce((best, c) => (c.cost < best.cost ? c : best)) : null);
  if (pick) {
    const facing = pick.side === 'right' ? 'left' : pick.side === 'left' ? 'right' : facingFrom(pick.V, target);
    const prefer = pick.side === 'right' || pick.side === 'left' ? pick.side : (pick.V.x > viewport.w - (pick.V.x + pick.V.w) ? 'left' : 'right');
    return result({ V: pick.V, box, side: pick.side, facing, bubble, viewport, target, prefer, avoid });
  }
  const V = tried[0].V;
  return result({ V, box, side: 'right', facing: facingFrom(V, target), bubble, viewport, target: null, prefer: 'right', overlapsTarget: intersects(V, target) });
}

export function placeAtDock({ dock, viewport, box = ROSIE_BOX, bubble }) {
  const x = dock.x + dock.w / 2 - box.w / 2;
  const y = dock.y + dock.h / 2 - box.h / 2;
  const V = visibleBox({ x, y }, box);
  return result({ V, box, side: 'dock', facing: 'right', bubble, viewport, target: null, prefer: 'right' });
}

export function placeAtCenter({ viewport, box = ROSIE_BOX, bubble }) {
  const vw = box.w - 2 * box.inset;
  const vh = box.h - 2 * box.inset;
  const V = clampRect({ x: viewport.w / 2 - vw / 2, y: viewport.h / 2 - vh / 2 - 40, w: vw, h: vh }, viewport);
  return result({ V, box, side: 'center', facing: 'right', bubble, viewport, target: null, prefer: 'right' });
}

export function placeAtCorner({ viewport, box = ROSIE_BOX, bubble }) {
  const vw = box.w - 2 * box.inset;
  const vh = box.h - 2 * box.inset;
  const V = clampRect({ x: viewport.w - vw - EDGE, y: viewport.h - vh - EDGE, w: vw, h: vh }, viewport);
  return result({ V, box, side: 'corner', facing: 'left', bubble, viewport, target: null, prefer: 'left' });
}

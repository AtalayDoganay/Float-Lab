// Pure motion helpers for the guide layer: a critically damped spring for
// Rosie's position, banking from her velocity, the squash when she lands, the
// blink schedule, the talking envelope, and the idle bob. Everything is a
// function of time or state; nothing here touches the DOM or Three.js.

const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

// One step of a critically damped spring toward `target`. `dt` is in seconds
// and is clamped to 50 ms so a long frame (a hidden window, a stall) moves
// her the same as a normal one instead of jumping. Closed form, so it never
// overshoots from rest.
export function springStep(s, target, dt, { omega = 9 } = {}) {
  const h = clamp(dt, 0, 0.05);
  const x0 = s.x - target;
  const v0 = s.v;
  const e = Math.exp(-omega * h);
  const k = v0 + omega * x0;
  return { x: (x0 + k * h) * e + target, v: (v0 - k * omega * h) * e };
}

// Lean into the motion: a move to the right rolls her left shoulder down.
export function bank(vx, vy, { scale = 0.0009, max = 0.35 } = {}) {
  return { roll: clamp(-vx * scale, -max, max), pitch: clamp(vy * scale, -max, max) };
}

// A brief squash and stretch after landing, `t` seconds after arrival.
export function squashAt(t, { duration = 0.3, amount = 0.1 } = {}) {
  if (!(t > 0) || t >= duration) return { sx: 1, sy: 1 };
  const a = amount * Math.sin((Math.PI * t) / duration) * (1 - t / duration);
  return { sx: 1 + a, sy: 1 - a };
}

export function nextBlinkDelay(random = Math.random) {
  return 2.5 + random() * 2.5;
}

// 0 (open) → 1 (closed) → 0 over `duration` seconds.
export function blinkAmount(sinceBlink, { duration = 0.16 } = {}) {
  if (!(sinceBlink > 0) || sinceBlink >= duration) return 0;
  const half = duration / 2;
  return sinceBlink <= half ? sinceBlink / half : (duration - sinceBlink) / half;
}

// Mouth and nod while she talks, fading out over `duration` seconds.
export function talkEnvelope(sinceChange, { duration = 1.1 } = {}) {
  if (!(sinceChange >= 0) || sinceChange >= duration) return { active: false, mouth: 0, nod: 0 };
  const fade = 1 - sinceChange / duration;
  return { active: true, mouth: Math.abs(Math.sin(sinceChange * 22)) * fade, nod: Math.sin(sinceChange * 9) * 0.04 * fade };
}

export function idleBob(t) {
  return { y: Math.sin(t * 1.6) * 0.06, yaw: Math.sin(t * 0.7) * 0.08 };
}

export function settled(s, target, { eps = 0.5, veps = 2 } = {}) {
  return Math.abs(s.x - target) < eps && Math.abs(s.v) < veps;
}

// A long frame (a hidden or minimised window ticks slowly) is integrated in
// 50 ms sub-steps so her flight keeps real-time speed whatever the frame rate.
export function springAdvance(s, target, dt, opts = {}) {
  const n = Math.max(1, Math.ceil(dt / 0.05));
  const h = dt / n;
  let out = s;
  for (let i = 0; i < n; i += 1) out = springStep(out, target, h, opts);
  return out;
}

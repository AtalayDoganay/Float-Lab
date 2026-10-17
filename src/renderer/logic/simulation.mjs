// Pure simulation arithmetic for the recreated PC•MACs screens. Nothing here
// talks to hardware. Show data is stored the way the PC•MACs manual describes
// it: one value per output per frame (manual p. 136: 25 or 30 frames per
// second). Values are commands or simulated measurements with no physical units.

export const FPS = 30;
export const SHOW_SECONDS = 8;
export const FRAME_COUNT = SHOW_SECONDS * FPS;
export const LAST_FRAME = FRAME_COUNT - 1;

// Photographed Br-EFB identity (historical observation, not a recommendation).
export const CONTROLLER_IP = '192.168.0.10';
export const NETMASK = '255.255.255.0';
export const GATEWAY = '192.168.0.1';
export const FIRST_CHANNEL = 6;
export const AXIS_COUNT = 4;

// Training-only digital channels. They have no real DMX address; the lantern
// example in the handbook explains why.
export const DIGITAL_CHANNELS = Object.freeze([
  { id: 'light-1', name: 'Light 1' },
  { id: 'light-2', name: 'Light 2' },
]);

// The four Br-EFB axes as analog channels on the Edit View. PC•MACs assigns
// each analog a colour when it is created (manual p. 76); these colours and
// names are the trainer's.
export const ANALOG_CHANNELS = Object.freeze(Array.from({ length: AXIS_COUNT }, (_, axis) => ({
  id: `axis-${axis}`,
  axis,
  name: `Axis ${axis} DMX ${FIRST_CHANNEL + axis}`,
  color: ['#0000ff', '#00c000', '#ff0000', '#c000c0'][axis],
})));

export const CHANNEL_IDS = Object.freeze([...ANALOG_CHANNELS.map((c) => c.id), ...DIGITAL_CHANNELS.map((c) => c.id)]);

export function channelName(id) {
  return [...ANALOG_CHANNELS, ...DIGITAL_CHANNELS].find((c) => c.id === id)?.name ?? id;
}

export function percentOf(value) {
  return (value / 255) * 100;
}

export function formatPercent(value) {
  return `${percentOf(value).toFixed(1)}%`;
}

const pad2 = (n) => String(n).padStart(2, '0');
export const clampFrame = (f) => Math.min(Math.max(Math.round(f), 0), FRAME_COUNT);

// hh:mm:ss.ff, the format of every time field on the Control Window and the
// Edit View (manual pp. 76, 201).
export function formatTime(frame) {
  const f = Math.max(0, Math.round(frame));
  const totalSeconds = Math.floor(f / FPS);
  return `${pad2(Math.floor(totalSeconds / 3600))}:${pad2(Math.floor((totalSeconds % 3600) / 60))}:${pad2(totalSeconds % 60)}.${pad2(f % FPS)}`;
}

// mm:ss.ff, the shorter form the Edit View cursor readout uses (manual p. 76).
export function formatCursor(frame) {
  const f = Math.max(0, Math.round(frame));
  const totalSeconds = Math.floor(f / FPS);
  return `${pad2(Math.floor(totalSeconds / 60))}:${pad2(totalSeconds % 60)}.${pad2(f % FPS)}`;
}

// Accepts hh:mm:ss.ff, mm:ss.ff, ss.ff, or a plain number of seconds. Returns
// a frame number, or null if the text is not a time in this show.
export function parseTime(text) {
  const s = String(text ?? '').trim();
  const m = /^(?:(?:(\d{1,2}):)?(\d{1,2}):)?(\d{1,2})(?:\.(\d{1,2}))?$/.exec(s);
  if (!m) return null;
  const [, hh, mm, ss, ff] = m;
  const frames = Number(ff ?? 0);
  if (frames >= FPS) return null;
  const total = ((Number(hh ?? 0) * 3600) + (Number(mm ?? 0) * 60) + Number(ss)) * FPS + frames;
  return total <= FRAME_COUNT ? total : null;
}

export function secondsToFrame(seconds) {
  return Math.round(seconds * FPS);
}

// ---------- digital channels: one boolean per frame ----------
export function emptyDigital() {
  return new Array(FRAME_COUNT).fill(false);
}

// [start, end) frame pairs, the compact form used for saving.
export function intervalsOf(frames) {
  const out = [];
  let start = null;
  for (let i = 0; i <= frames.length; i += 1) {
    const on = i < frames.length && frames[i];
    if (on && start === null) start = i;
    if (!on && start !== null) { out.push([start, i]); start = null; }
  }
  return out;
}

export function digitalFromIntervals(intervals) {
  const frames = emptyDigital();
  for (const [a, b] of intervals) for (let i = clampFrame(a); i < clampFrame(b); i += 1) frames[i] = true;
  return frames;
}

// Set Digital On / Set Digital Off over [from, to) (manual pp. 176-177).
export function setDigitalRange(frames, from, to, on) {
  const out = [...frames];
  const a = clampFrame(Math.min(from, to));
  const b = clampFrame(Math.max(from, to));
  for (let i = a; i < b; i += 1) out[i] = on;
  return out;
}

export function describeIntervals(frames) {
  const ivs = intervalsOf(frames);
  if (!ivs.length) return 'never ON';
  return ivs.map(([a, b]) => `${(a / FPS).toFixed(2)}–${(b / FPS).toFixed(2)} s`).join(', ');
}

// Compare a drawn digital channel with the expected ON spans in seconds.
// Mouse drawing is frame-accurate only by luck, so edges may be off by up to
// `tolerance` frames. Returns the first wrong span so feedback can name it.
export function compareDigital(frames, expectedSeconds, tolerance = 3) {
  const expected = digitalFromIntervals(expectedSeconds.map(([a, b]) => [secondsToFrame(a), secondsToFrame(b)]));
  const nearEdge = (i) => {
    for (let d = -tolerance; d <= tolerance; d += 1) {
      const j = i + d;
      if (j > 0 && j < FRAME_COUNT && expected[j] !== expected[j - 1]) return true;
    }
    return false;
  };
  let i = 0;
  while (i < FRAME_COUNT) {
    if (frames[i] !== expected[i] && !nearEdge(i)) {
      const kind = frames[i] ? 'extra' : 'missing';
      // Report the whole wrong stretch, including frames the tolerance skipped.
      let a = i;
      while (a > 0 && frames[a - 1] === frames[i] && frames[a - 1] !== expected[a - 1]) a -= 1;
      let j = i;
      while (j < FRAME_COUNT && frames[j] === frames[i] && frames[j] !== expected[j]) j += 1;
      return { ok: false, kind, from: a, to: j };
    }
    i += 1;
  }
  return { ok: true };
}

// ---------- analog channels: one 0-255 value per frame ----------
// The trainer's own training show data for the four axes. Not photographed,
// not recommended values: a gentle move on axis 0 and holds elsewhere so the
// analog pane has something to read.
export function defaultAnalogs() {
  return ANALOG_CHANNELS.map(({ axis }) => Array.from({ length: FRAME_COUNT }, (_, f) => {
    if (axis !== 0) return [128, 89, 166][axis - 1];
    if (f < 30) return 64;
    if (f < 120) return Math.round(64 + ((f - 30) / 90) * 128);
    return 192;
  }));
}

// Set Analogs to a Value over [from, to) (manual p. 178).
export function setAnalogRange(values, from, to, value) {
  const out = [...values];
  const a = clampFrame(Math.min(from, to));
  const b = clampFrame(Math.max(from, to));
  for (let i = a; i < b; i += 1) out[i] = value;
  return out;
}

// Run-length [value, count] pairs, the compact form used for saving.
export function encodeRuns(values) {
  const runs = [];
  for (const v of values) {
    const last = runs[runs.length - 1];
    if (last && last[0] === v) last[1] += 1; else runs.push([v, 1]);
  }
  return runs;
}

export function decodeRuns(runs) {
  return runs.flatMap(([v, n]) => new Array(n).fill(v));
}

// ---------- identifiers and networks ----------
export function axisToDmx(axis) {
  if (!Number.isInteger(axis) || axis < 0 || axis >= AXIS_COUNT) {
    throw new RangeError(`Axis must be 0-${AXIS_COUNT - 1}`);
  }
  return FIRST_CHANNEL + axis;
}

function networkPortion(ip, mask) {
  const maskOctets = mask.split('.').map(Number);
  return ip
    .split('.')
    .map((octet, i) => Number(octet) & maskOctets[i])
    .join('.');
}

export function classifyLaptopIp(ip, controller = CONTROLLER_IP, mask = NETMASK) {
  if (ip === controller) return 'duplicate';
  return networkPortion(ip, mask) === networkPortion(controller, mask) ? 'same-subnet' : 'different-subnet';
}

// Educational approach-to-target model: move a fraction of the remaining gap
// each tick and snap when close. Not a plant, valve, or PID model.
export function approachStep(actual, target, fraction = 0.08) {
  const gap = target - actual;
  if (Math.abs(gap) < 0.05) return target;
  return actual + gap * fraction;
}

// Hypothetical linear calibration used only by the range exercise.
export function calibratedTarget(value, maxCm) {
  return (value / 255) * maxCm;
}

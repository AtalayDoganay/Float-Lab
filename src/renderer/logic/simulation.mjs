// Pure simulation arithmetic for the training workspace. Nothing here talks to
// hardware. Values are commands or simulated measurements with no physical units.

export const BLOCK_COUNT = 8;
export const FPS = 30;
export const DEFAULT_BLOCKS = Object.freeze([false, false, true, true, false, false, false, false]);

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

export function percentOf(value) {
  return (value / 255) * 100;
}

export function formatPercent(value) {
  return `${percentOf(value).toFixed(1)}%`;
}

export function blocksToIntervals(blocks) {
  return blocks.flatMap((on, index) => (on ? [{ start: index, end: index + 1 }] : []));
}

export function playbackStep(tick, blocks) {
  if (tick >= blocks.length) return { done: true };
  const on = blocks[tick];
  return { done: false, index: tick, on, label: `${tick}–${tick + 1} s · ${on ? 'ON' : 'OFF'}` };
}

const pad2 = (n) => String(n).padStart(2, '0');

export function formatShowTime(seconds, fps = FPS) {
  const totalFrames = Math.round(Math.max(0, seconds) * fps);
  const frames = totalFrames % fps;
  const wholeSeconds = Math.floor(totalFrames / fps);
  const hh = Math.floor(wholeSeconds / 3600);
  const mm = Math.floor((wholeSeconds % 3600) / 60);
  const ss = wholeSeconds % 60;
  return `${pad2(hh)}:${pad2(mm)}:${pad2(ss)}.${pad2(frames)}`;
}

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

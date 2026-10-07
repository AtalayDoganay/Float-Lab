// Simulated GilderTerm / Br-EFB menu behavior. Only responses that the photos
// or the PC•MACs manual actually show are simulated; everything else answers
// "not simulated" instead of inventing firmware behavior.
import { AXIS_COUNT } from './simulation.mjs';

const NOT_SIMULATED = {
  1: 'Set minimum range',
  2: 'Set maximum range',
  3: 'Force output to value',
  4: 'Set PowerOn Default',
  5: 'Set Velocity Limit',
  i: 'Info',
  o: 'def. (defaults)',
  g: 'loop',
  h: 'Halt',
  c: 'First Channel',
  d: 'Resolution',
  e: 'DMX mode',
  f: '0-based',
  7: 'More PID Options',
};

export function initialTerminal() {
  return { configMode: true, screen: 'main', axis: 0, card: 1, prompt: null, note: '', cleared: false, controlOpen: false };
}

function notSimulated(base, key) {
  const label = NOT_SIMULATED[key] ? `“${NOT_SIMULATED[key]}”` : `key “${key}”`;
  return { ...base, note: `${label} is a photographed menu line, but its prompt and effect were not photographed, so it is not simulated. On the real card it would change a live setting.` };
}

export function terminalKey(t, rawKey) {
  const key = String(rawKey ?? '').trim().toLowerCase();
  if (!key) return t;
  const base = { ...t, cleared: false, note: '' };

  if (!t.configMode) {
    return { ...base, note: 'The simulated card is not in configuration mode. Press Configure to reopen its menu.' };
  }
  if (t.prompt === 'axis') {
    if (/^[0-3]$/.test(key)) return { ...base, prompt: null, axis: Number(key), note: `Axis ${key} selected. The arrow moves to its row.` };
    return { ...base, note: 'Enter a number from 0 - 3.' };
  }
  if (t.prompt === 'card') {
    if (/^\d{1,3}$/.test(key) && Number(key) <= 255) {
      return { ...base, prompt: null, note: 'The card-address prompt is photographed, but changing the address is not simulated. The trainer keeps the photographed value 1.' };
    }
    return { ...base, note: 'Enter a number from 0 - 255.' };
  }
  if (t.prompt === 'exit') {
    if (key === 'y') return { ...base, prompt: null, configMode: false, note: 'Configuration mode exited (simulated). Press Configure to reopen the menu.' };
    if (key === 'n') return { ...base, prompt: null, note: 'Staying in configuration mode.' };
    return { ...base, note: 'Type Y or N.' };
  }
  if (t.screen === 'network') {
    if (key === 'c') return { ...base, screen: 'main', note: 'Confirm settings (simulated): nothing changed; the photographed values are kept.' };
    if (key === 'x') return { ...base, screen: 'main', note: 'Discard settings (simulated): back to the main menu.' };
    if (/^[1-4]$/.test(key)) return { ...base, note: `Option ${key} is a photographed menu line, but changing network settings is not simulated.` };
    return { ...base, note: 'Network menu: c) Confirm settings or x) Discard settings.' };
  }

  switch (key) {
    case 's':
      return { ...base, prompt: 'axis' };
    case 'a':
      return t.screen === 'main' ? { ...base, prompt: 'card' } : notSimulated(base, key);
    case 'k':
      return { ...base, screen: t.screen === 'main' ? 'feedback' : 'main' };
    case '6':
      return t.screen === 'main' ? { ...base, screen: 'network' } : notSimulated(base, key);
    case 'n':
      return { ...base, axis: (t.axis + 1) % AXIS_COUNT, note: 'Next: the arrow moved down one axis.' };
    case 'l':
      return { ...base, axis: (t.axis + AXIS_COUNT - 1) % AXIS_COUNT, note: 'Last: the arrow moved up one axis.' };
    case 'x':
      return { ...base, prompt: 'exit' };
    default:
      return notSimulated(base, key);
  }
}

export function terminalButton(t, name) {
  switch (name) {
    case 'clear':
      return { ...t, cleared: true, note: '' };
    case 'config':
      return t.configMode
        ? { ...t, configMode: false, prompt: null, note: 'Config Done (simulated): the card left configuration mode.' }
        : { ...t, configMode: true, screen: 'main', prompt: null, cleared: false, note: 'Configure (simulated): the card redrew its menu.' };
    case 'control':
      return { ...t, controlOpen: !t.controlOpen };
    case 'status':
      return { ...t, note: 'Status is unavailable while the card is in configuration mode, exactly as photographed.' };
    default:
      return t;
  }
}

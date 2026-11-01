// Pure sound plans for the trainer's three layers. Nothing here touches the
// Web Audio API; ui/audio.mjs turns these plans into oscillators. Everything
// is original and synthesized: a short retro-synth opening sting, a quiet
// looping bed, a completion sting, Rosie's chirps (one soft burst per word
// group, pitched by a deterministic hash so she keeps one voice), the
// narrator's voice preference, and a rate limiter for tactile UI cues.

export const CHIRP_MAX_PER_SECOND = 7;
const MIN_GAP = 1000 / CHIRP_MAX_PER_SECOND; // ms between burst starts
const PUNCT_GAP = 110; // extra ms after , . ; : ! ? and dashes
const MAX_BURSTS = 20;
const MAX_PHRASE_MS = 4000;
const BASE_HZ = 520;
const PENTA = [1, 9 / 8, 5 / 4, 3 / 2, 5 / 3]; // a major pentatonic, so any two bursts sound friendly together

const EMOTIONS = Object.freeze({
  neutral: { pitch: 1, speed: 1, gain: 1 },
  excited: { pitch: 1.25, speed: 0.8, gain: 1 },
  concern: { pitch: 0.85, speed: 1.25, gain: 0.75 },
});

function wordHash(word) {
  let h = 7;
  for (const ch of word) h = (h * 31 + ch.codePointAt(0)) >>> 0;
  return h;
}

export function chirpPhrase(text, emotion = 'neutral') {
  const e = EMOTIONS[emotion] || EMOTIONS.neutral;
  const tokens = String(text || '').split(/\s+/).filter(Boolean);
  const blips = [];
  let t = 0;
  for (const token of tokens) {
    if (blips.length >= MAX_BURSTS) break;
    const word = token.replace(/[^\p{L}\p{N}’']/gu, '');
    const punct = /[,.;:!?—–-]$/.test(token);
    if (!word) { t += PUNCT_GAP; continue; }
    const h = wordHash(word.toLowerCase());
    const dur = Math.min(220, Math.max(40, (60 + Math.min(word.length, 8) * 10) * e.speed));
    if (t + dur > MAX_PHRASE_MS) break;
    blips.push({ at: t, dur, freq: BASE_HZ * e.pitch * PENTA[h % PENTA.length], gain: 0.3 * e.gain });
    t += Math.max(MIN_GAP, dur + 40 * e.speed);
    if (punct) t += PUNCT_GAP;
  }
  return blips;
}

// The narrator: a masculine en-US voice when one is installed, else any
// en-US voice, else any English voice. Windows ships "Microsoft David".
const MASCULINE = /david|guy|mark|ryan|christopher|eric|roger|james|george/i;
export function pickVoice(voices) {
  const list = Array.isArray(voices) ? voices.filter((v) => v && typeof v.lang === 'string') : [];
  const us = list.filter((v) => /^en[-_]US/i.test(v.lang));
  return us.find((v) => MASCULINE.test(v.name || '')) || us[0] || list.find((v) => /^en/i.test(v.lang)) || null;
}

// One cue per `minGapMs`: repeatedly crossing a button never produces a rattle.
export function limiter(minGapMs) {
  let last = -Infinity;
  return (now) => {
    if (now - last < minGapMs) return false;
    last = now;
    return true;
  };
}

// ---------- original music ----------
const midi = (m) => 440 * 2 ** ((m - 69) / 12);
const note = (at, dur, m, gain, wave) => ({ at, dur, freq: midi(m), gain, wave });

// Cheerful 1980s training-film energy: I–vi–IV–V in A major at 120 BPM,
// eight bars (16 s) with a soft pad, a round bass, a light pulse and a tick.
function bed() {
  const notes = [];
  const chords = [[57, 61, 64], [54, 57, 61], [50, 54, 57], [52, 56, 59]]; // A, F#m, D, E
  const bass = [45, 42, 38, 40];
  const bar = 2; // seconds per bar at 120 BPM
  for (let b = 0; b < 8; b += 1) {
    const chord = chords[Math.floor(b / 2) % 4];
    const start = b * bar;
    for (const m of chord) notes.push(note(start, bar * 0.98, m, 0.07, 'triangle'));
    for (let beat = 0; beat < 4; beat += 1) {
      const at = start + beat * 0.5;
      notes.push(note(at, 0.42, bass[Math.floor(b / 2) % 4] + (beat === 2 ? 7 : 0), 0.11, 'sine'));
      notes.push(note(at + 0.25, 0.1, chord[(beat + b) % 3] + 12, 0.045, 'square'));
      notes.push(note(at, 0.03, 84, 0.03, 'sawtooth'));
    }
  }
  notes.sort((a, c) => a.at - c.at);
  return { loopLength: 16, notes };
}

const sorted = (notes) => Object.freeze([...notes].sort((a, b) => a.at - b.at));

export const MUSIC = Object.freeze({
  sting: Object.freeze({ notes: sorted([
    note(0, 0.9, 57, 0.08, 'triangle'), note(0, 0.9, 61, 0.08, 'triangle'), note(0, 0.9, 64, 0.08, 'triangle'),
    note(0, 0.18, 69, 0.14, 'square'), note(0.18, 0.18, 73, 0.14, 'square'), note(0.36, 0.18, 76, 0.14, 'square'), note(0.54, 0.6, 81, 0.16, 'square'),
    note(0.54, 0.6, 45, 0.12, 'sine'),
  ]) }),
  bed: Object.freeze(bed()),
  done: Object.freeze({ notes: sorted([
    note(0, 0.16, 76, 0.14, 'square'), note(0.16, 0.5, 81, 0.16, 'square'),
    note(0, 0.7, 57, 0.07, 'triangle'), note(0, 0.7, 64, 0.07, 'triangle'), note(0.16, 0.5, 45, 0.1, 'sine'),
  ]) }),
});

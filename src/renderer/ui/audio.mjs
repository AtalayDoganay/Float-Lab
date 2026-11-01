// The trainer's sound: three controllable layers (narration through the
// system's local speech voices, synthesized music, Rosie's chirps) plus
// quiet tactile UI cues, all from the plans in logic/audio-plan.mjs. Nothing
// is fetched; nothing plays until the app enables audio. When the browser
// keeps the context suspended the state is 'blocked' and the pages show a
// sound-enable control while captions carry on. Every Web Audio and speech
// call is guarded: a missing API only means silence, never an error.
import { MUSIC, chirpPhrase, pickVoice, limiter } from '../logic/audio-plan.mjs';
import { DEFAULT_PREFS } from '../../shared/prefs-schema.mjs';

const CUES = Object.freeze({
  hover: [{ at: 0, dur: 28, freq: 1320, gain: 0.08, wave: 'sine' }],
  click: [{ at: 0, dur: 45, freq: 880, gain: 0.14, wave: 'triangle' }, { at: 40, dur: 40, freq: 1175, gain: 0.1, wave: 'triangle' }],
  pass: [{ at: 0, dur: 90, freq: 880, gain: 0.14, wave: 'square' }, { at: 90, dur: 180, freq: 1319, gain: 0.14, wave: 'square' }],
  miss: [{ at: 0, dur: 160, freq: 330, gain: 0.12, wave: 'triangle' }, { at: 150, dur: 220, freq: 262, gain: 0.1, wave: 'triangle' }],
});

export function createAudio({ prefs = DEFAULT_PREFS, speech = globalThis.speechSynthesis, UtteranceCtor = globalThis.SpeechSynthesisUtterance, AudioContextCtor = globalThis.AudioContext, now = () => performance.now() } = {}) {
  let ctx = null;
  let gains = null;
  let state = 'off';
  let current = prefs;
  let utterance = null; // the narration in progress
  let bedTimer = 0;
  let bedGeneration = 0;
  const live = { music: new Set(), mascot: new Set(), ui: new Set() };
  const uiLimit = limiter(120);
  let voices = [];
  const refreshVoices = () => { try { voices = speech ? speech.getVoices() : []; } catch { voices = []; } };
  refreshVoices();
  try { if (speech && typeof speech.addEventListener === 'function') speech.addEventListener('voiceschanged', refreshVoices); } catch { /* no voices */ }

  const level = (layer) => (current.muted[layer] ? 0 : current.volumes[layer]);

  function ensure() {
    if (ctx) return ctx;
    if (typeof AudioContextCtor !== 'function') return null;
    try {
      ctx = new AudioContextCtor();
      const master = ctx.createGain();
      master.connect(ctx.destination);
      gains = { master };
      for (const layer of ['music', 'mascot', 'ui']) {
        const g = ctx.createGain();
        g.gain.value = level(layer);
        g.connect(master);
        gains[layer] = g;
      }
    } catch {
      ctx = null;
      gains = null;
    }
    return ctx;
  }

  let forceBlocked = false; // the smoke harness rehearses the blocked path
  async function enable() {
    if (forceBlocked) { state = 'blocked'; return state; }
    const c = ensure();
    if (!c) { state = 'off'; return state; }
    try { await c.resume(); } catch { /* stays suspended */ }
    state = c.state === 'running' ? 'ready' : 'blocked';
    return state;
  }

  // Schedule a plan (times in seconds for music, milliseconds for chirps and cues) on one layer.
  function playPlan(notes, layer, { unit = 1, offsetSec = 0 } = {}) {
    if (!ctx || state !== 'ready') return;
    const t0 = ctx.currentTime + offsetSec;
    for (const n of notes) {
      try {
        const osc = ctx.createOscillator();
        const env = ctx.createGain();
        osc.type = n.wave || 'sine';
        osc.frequency.value = n.freq;
        const at = t0 + n.at * unit;
        const dur = Math.max(0.02, n.dur * unit);
        env.gain.setValueAtTime(0.0001, at);
        env.gain.linearRampToValueAtTime(n.gain, at + Math.min(0.015, dur / 4));
        env.gain.setValueAtTime(n.gain, at + dur * 0.7);
        env.gain.exponentialRampToValueAtTime(0.0001, at + dur);
        osc.connect(env);
        env.connect(gains[layer]);
        osc.start(at);
        osc.stop(at + dur + 0.02);
        live[layer].add(osc);
        osc.onended = () => live[layer].delete(osc);
      } catch { /* a node that cannot be built is silence */ }
    }
  }

  function stopLayer(layer) {
    for (const osc of live[layer]) { try { osc.stop(); } catch { /* already stopped */ } }
    live[layer].clear();
  }

  const music = {
    sting() { playPlan(MUSIC.sting.notes, 'music'); },
    bed() {
      music.stop();
      const gen = ++bedGeneration;
      const loop = () => {
        if (gen !== bedGeneration) return;
        playPlan(MUSIC.bed.notes, 'music');
        bedTimer = setTimeout(loop, MUSIC.bed.loopLength * 1000);
      };
      loop();
    },
    stop() {
      bedGeneration += 1;
      if (bedTimer) { clearTimeout(bedTimer); bedTimer = 0; }
      stopLayer('music');
    },
    done() { music.stop(); playPlan(MUSIC.done.notes, 'music'); },
    status() { return bedTimer ? 'playing' : 'stopped'; },
  };

  function stopChirps() { stopLayer('mascot'); }

  function narrationVoice() {
    if (!voices.length) refreshVoices();
    return pickVoice(voices);
  }

  // Resolves when the line has been spoken (or at once, unspoken, when there
  // is no voice or narration is muted). Chirps never talk over the narrator.
  function narrate(text) {
    stopChirps();
    const voice = speech ? narrationVoice() : null;
    if (!voice || !text || level('narration') === 0) return Promise.resolve({ spoken: false });
    return new Promise((resolve) => {
      let settled = false;
      const finish = (spoken) => { if (settled) return; settled = true; if (utterance === u) utterance = null; resolve({ spoken }); };
      let u;
      try {
        u = new UtteranceCtor(text);
        u.voice = voice;
        u.lang = voice.lang;
        u.rate = 0.95;
        u.pitch = 0.9;
        u.volume = level('narration');
        u.onend = () => finish(true);
        u.onerror = () => finish(false);
        utterance = u;
        speech.cancel();
        speech.speak(u);
      } catch {
        finish(false);
      }
    });
  }

  function pauseNarration() { try { if (speech && utterance) speech.pause(); } catch { /* ignore */ } }
  function resumeNarration() { try { if (speech && utterance) speech.resume(); } catch { /* ignore */ } }
  function cancelNarration() {
    const u = utterance;
    utterance = null;
    try { if (speech) speech.cancel(); } catch { /* ignore */ }
    if (u && u.onerror) u.onerror();
  }

  function chirp(text, emotion = 'neutral') {
    if (utterance || level('mascot') === 0) return;
    stopChirps();
    playPlan(chirpPhrase(text, emotion).map((b) => ({ ...b, wave: 'triangle' })), 'mascot', { unit: 0.001 });
  }

  function cue(kind) {
    if (!CUES[kind] || level('ui') === 0 || !uiLimit(now())) return;
    playPlan(CUES[kind], 'ui', { unit: 0.001 });
  }

  function setPrefs(p) {
    current = p;
    if (!gains) return;
    for (const layer of ['music', 'mascot', 'ui']) gains[layer].gain.value = level(layer);
    if (utterance) utterance.volume = level('narration');
  }

  function available() {
    return { narration: Boolean(speech && narrationVoice()), audio: Boolean(ensure()) };
  }

  function debugBlock(on) {
    forceBlocked = Boolean(on);
    if (forceBlocked) state = 'blocked';
  }

  return { enable, state: () => state, setPrefs, music, narrate, pauseNarration, resumeNarration, cancelNarration, chirp, stopChirps, cue, available, speaking: () => Boolean(utterance), debugBlock };
}

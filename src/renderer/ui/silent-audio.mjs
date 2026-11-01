// Silent stand-ins for the speech engine, its utterance, and the AudioContext,
// used only by the smoke harness: narration "speaks" in a few milliseconds and
// records what it was given, oscillators count their starts, and nothing
// reaches a speaker. With them the harness can see that a line was narrated,
// not merely that a caption was timed.
export function createSilentBackend({ speakMs = 40 } = {}) {
  const spoken = [];
  const voices = [{ name: 'Microsoft David Desktop - English (United States)', lang: 'en-US' }];
  let pending = null;
  let timer = 0;
  const speech = {
    getVoices: () => voices,
    addEventListener() {},
    speak(u) {
      pending = u;
      spoken.push(u.text);
      timer = setTimeout(() => { timer = 0; pending = null; if (u.onend) u.onend(); }, speakMs);
    },
    cancel() {
      const u = pending;
      pending = null;
      if (timer) { clearTimeout(timer); timer = 0; }
      if (u && u.onerror) u.onerror();
    },
    pause() {},
    resume() {},
  };

  class SilentUtterance {
    constructor(text) { this.text = text; this.voice = null; this.lang = ''; this.rate = 1; this.pitch = 1; this.volume = 1; this.onend = null; this.onerror = null; }
  }

  let started = 0;
  const param = () => ({ value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} });
  class SilentContext {
    constructor() { this.state = 'running'; this.currentTime = 0; this.destination = {}; }
    createGain() { return { gain: param(), connect() {} }; }
    createOscillator() { return { type: 'sine', frequency: param(), connect() {}, start() { started += 1; }, stop() {}, onended: null }; }
    resume() { return Promise.resolve(); }
  }

  return { speech, UtteranceCtor: SilentUtterance, AudioContextCtor: SilentContext, spoken, oscillators: () => started };
}

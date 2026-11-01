// One playback clock for a film: narration, captions, Rosie's cues and the
// pointer actions of each beat run against the same elapsed time, so pause,
// resume and replay keep them together. Pure logic: the narrator, the
// performer and the timers are injected, which is how the tests drive it
// with a fake clock and how the app wires it to speech, Web Audio and the
// demonstration cursor.
//
// A film is { id, beats: [{ id, say?, caption?, rosie?, minMs?, actions?: [{ at, ...cue }] }] }.
// A beat ends when its narration has finished (or, unspoken, when its caption
// has been readable for long enough), every action has fired and been
// performed, and `minMs` has elapsed.

export function captionMs(text) {
  const words = String(text || '').trim().split(/\s+/).filter(Boolean).length;
  return 1500 + 60 * words;
}

export function createCuePlayer(film, {
  narrator,
  perform = () => {},
  onCaption = () => {},
  onRosie = () => {},
  onBeat = () => {},
  onDone = () => {},
  onStall = () => {},
  now = () => performance.now(),
  setTimeout: schedule = globalThis.setTimeout,
  clearTimeout: cancel = globalThis.clearTimeout,
} = {}) {
  const beats = film.beats;
  let index = 0;
  let playing = false;
  let paused = false;
  let done = false;
  let beatStart = 0;
  let elapsedAtPause = 0;
  let generation = 0; // bumped by stop/replay/seek so stale callbacks are ignored
  let timers = [];
  let narrationDone = false;
  let minDone = false;
  let pendingActions = []; // actions not yet fired
  let inFlight = 0; // performs awaited
  let chain = Promise.resolve(); // performs run one after another, in firing order

  const elapsed = () => (paused ? elapsedAtPause : now() - beatStart);
  const clearTimers = () => { for (const id of timers) cancel(id); timers = []; };
  const later = (fn, ms) => { const id = schedule(() => { timers = timers.filter((t) => t !== id); fn(); }, ms); timers.push(id); return id; };

  function finishFilm() {
    playing = false;
    paused = false;
    done = true;
    onCaption(null);
    onDone();
  }

  function check(gen) {
    if (gen !== generation || paused || !playing) return;
    if (narrationDone && minDone && pendingActions.length === 0 && inFlight === 0) {
      if (index + 1 < beats.length) startBeat(index + 1, gen);
      else finishFilm();
    }
  }

  function scheduleActions(gen) {
    for (const action of pendingActions) {
      later(() => {
        if (gen !== generation) return;
        pendingActions = pendingActions.filter((a) => a !== action);
        const { at, ...cue } = action;
        inFlight += 1;
        chain = chain
          .then(() => (gen === generation ? perform(cue) : undefined))
          .catch(() => { if (gen === generation) onStall(cue); })
          .then(() => { inFlight -= 1; check(gen); });
      }, Math.max(0, action.at - elapsed()));
    }
  }

  function scheduleMin(minMs, gen) {
    const remaining = minMs - elapsed();
    if (remaining <= 0) { minDone = true; check(gen); return; }
    later(() => { if (gen !== generation) return; minDone = true; check(gen); }, remaining);
  }

  function startBeat(i, gen) {
    clearTimers();
    index = i;
    const beat = beats[i];
    beatStart = now();
    narrationDone = false;
    minDone = false;
    inFlight = 0;
    chain = Promise.resolve();
    pendingActions = [...(beat.actions || [])].sort((a, b) => a.at - b.at);
    onBeat(i, beat);
    onCaption(beat.caption ?? beat.say ?? null);
    if (beat.rosie) onRosie(beat.rosie);
    const minMs = beat.minMs || 0;
    const say = beat.say;
    const spoken = say && narrator ? narrator.speak(say) : Promise.resolve({ spoken: false });
    Promise.resolve(spoken).then((r) => {
      if (gen !== generation) return;
      narrationDone = true;
      const need = r && r.spoken ? minMs : Math.max(minMs, say ? captionMs(say) : 0);
      if (paused) { minNeeded = need; return; }
      scheduleMin(need, gen);
    });
    minNeeded = null;
    scheduleActions(gen);
    if (!say) scheduleMin(minMs, gen);
  }
  let minNeeded = null; // a min duration learned while paused, applied on resume

  function play() {
    if (playing && !paused) return;
    if (playing && paused) { resume(); return; }
    done = false;
    playing = true;
    paused = false;
    generation += 1;
    startBeat(0, generation);
  }

  function pause() {
    if (!playing || paused) return;
    elapsedAtPause = elapsed();
    paused = true;
    clearTimers();
    if (narrator && narrator.pause) narrator.pause();
    onRosie({ chirp: 'stop' });
  }

  function resume() {
    if (!playing || !paused) return;
    paused = false;
    beatStart = now() - elapsedAtPause;
    const gen = generation;
    if (narrator && narrator.resume) narrator.resume();
    scheduleActions(gen);
    if (narrationDone && !minDone) scheduleMin(minNeeded ?? (beats[index].minMs || 0), gen);
    else if (!beats[index].say && !minDone) scheduleMin(beats[index].minMs || 0, gen);
    check(gen);
  }

  function stop() {
    generation += 1;
    clearTimers();
    pendingActions = [];
    inFlight = 0;
    if (narrator && narrator.cancel) narrator.cancel();
    onRosie({ chirp: 'stop' });
    onCaption(null);
    playing = false;
    paused = false;
  }

  function replay() {
    stop();
    play();
  }

  function seekBeat(i) {
    if (i < 0 || i >= beats.length) return;
    stop();
    done = false;
    playing = true;
    generation += 1;
    startBeat(i, generation);
  }

  function status() {
    return { beat: index, playing, paused, elapsedMs: playing ? elapsed() : 0, done };
  }

  return { play, pause, resume, stop, replay, seekBeat, status };
}

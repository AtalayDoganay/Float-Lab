// The orientation film's screen: a full-window projector room with a tape
// counter and Skip>> from the first frame, the title card, the two campus
// names at equal size, the archive prints in a slide mount, the practice
// timeline with its simulated ON/OFF lamp, captions, Pause / Resume, and a
// sound-enable control when the browser keeps audio blocked. The cue player
// drives it; Rosie's cues go to the app, which places her at the film's dock.
import { el, replace } from './dom.mjs';
import { INTRO_FILM, INTRO_TITLE, INTRO_SUBLINE } from '../content/intro.mjs';
import { ARCHIVE_DIR, ARCHIVE_BY_ID } from '../content/archive.mjs';
import { createCuePlayer } from '../logic/cue-player.mjs';

const pad2 = (n) => String(n).padStart(2, '0');
const ENABLE_WAIT_MS = 600; // how long the first frame waits for the sound engine

export function mountIntro(section, { dispatch, audio }) {
  let player = null;
  let startedAt = 0;
  let counterTimer = 0;
  let leaderTimers = [];
  let current = { beat: -1, visual: 'leader', caption: '', photo: null };

  const skip = el('button', { type: 'button', class: 'film-skip', 'data-fid': 'skip', 'data-control': 'film-skip', text: 'Skip>>', onclick: () => dispatch({ type: 'intro-skip' }) });
  const counter = el('span', { class: 'film-counter', 'aria-hidden': 'true', text: '00:00' });
  const top = el('div', { class: 'film-top' }, el('span', { class: 'film-reel', text: 'Orientation tape' }), counter, skip);

  const leaderNum = el('span', { class: 'film-leader-num', text: '3' });
  const leader = el('div', { class: 'film-leader', 'aria-hidden': 'true' }, leaderNum);
  const title = el('div', { class: 'film-title' }, el('h1', { text: INTRO_TITLE }), el('p', { text: INTRO_SUBLINE }));
  const campuses = el('div', { class: 'film-campuses' },
    el('span', { class: 'film-campus', text: 'Cal Poly Pomona' }),
    el('span', { class: 'film-x', 'aria-hidden': 'true', text: '×' }),
    el('span', { class: 'film-campus', text: 'Cal Poly San Luis Obispo' }));
  const img = el('img', { class: 'film-photo', alt: '' });
  const printLabel = el('figcaption', { class: 'film-print-label' });
  const printCredit = el('span', { class: 'film-print-credit' });
  const print = el('figure', { class: 'film-print' }, el('div', { class: 'film-print-mount' }, img), printLabel, printCredit);
  const lamp = el('span', { class: 'film-lamp' });
  const timeline = el('div', { class: 'film-timeline', 'aria-hidden': 'true' },
    el('div', { class: 'film-ruler' }, ...[0, 1, 2, 3].map((s) => el('span', { class: 'film-tick', text: `${pad2(s)} sec` }))),
    el('div', { class: 'film-track' }, el('span', { class: 'film-bar' })),
    el('div', { class: 'film-lamp-row' }, lamp, el('span', { class: 'film-lamp-label', text: 'Digital 0: OFF' })));
  const dock = el('div', { id: 'film-rosie-dock', class: 'film-rosie-dock', 'aria-hidden': 'true' });
  const stage = el('div', { class: 'film-stage', 'data-visual': 'leader' }, leader, title, campuses, print, timeline, dock);

  const caption = el('p', { class: 'film-captions', role: 'status', 'aria-live': 'polite' });
  const pause = el('button', { type: 'button', class: 'btn film-pause', 'data-control': 'film-pause', text: 'Pause', onclick: () => dispatch({ type: player && player.status().paused ? 'intro-resume' : 'intro-pause' }) });
  const sound = el('button', { type: 'button', class: 'btn btn-primary film-sound', 'data-control': 'sound-enable', text: 'Turn sound on', hidden: true, onclick: () => dispatch({ type: 'sound-enable' }) });
  const controls = el('div', { class: 'film-controls' }, pause, sound);
  replace(section, top, stage, caption, controls);

  function showPhoto(id, label) {
    const p = ARCHIVE_BY_ID[id];
    if (!p) return;
    current.photo = id;
    img.src = `${ARCHIVE_DIR}${p.file}`;
    printLabel.textContent = label || '';
    printCredit.textContent = `Photo: ${p.credit}`;
    print.classList.remove('is-changing');
    void print.offsetWidth; // restart the slide-change animation
    print.classList.add('is-changing');
  }

  function runLeader() {
    for (const id of leaderTimers) clearTimeout(id);
    leaderTimers = [];
    ['3', '2', '1', ''].forEach((n, i) => { leaderTimers.push(setTimeout(() => { leaderNum.textContent = n; leader.classList.toggle('is-over', n === ''); }, i * 800)); });
  }

  const narrator = {
    speak: (text) => (audio.state() === 'ready' ? audio.narrate(text) : Promise.resolve({ spoken: false })),
    pause: () => audio.pauseNarration(),
    resume: () => audio.resumeNarration(),
    cancel: () => audio.cancelNarration(),
  };

  function perform(cue) {
    if (cue.photo) showPhoto(cue.photo, cue.photoLabel);
    if (cue.rosie) onRosie(cue.rosie);
  }

  function onRosie(cue) {
    if (cue.chirp === 'stop') { audio.stopChirps(); return; }
    dispatch({ type: 'film-rosie', rosie: { expression: cue.expression, line: cue.line ?? null } });
    if (cue.line && cue.chirp) audio.chirp(cue.line, cue.chirp);
  }

  function onBeat(i, beat) {
    current.beat = i;
    current.visual = beat.visual;
    stage.dataset.visual = beat.visual;
    if (beat.visual === 'leader') runLeader();
    if (beat.photo) showPhoto(beat.photo, beat.photoLabel);
    if (beat.visual === 'timeline') lamp.parentElement.classList.add('is-running');
  }

  function onCaption(text) {
    current.caption = text || '';
    caption.textContent = current.caption;
  }

  function tickCounter() {
    const s = Math.floor((performance.now() - startedAt) / 1000);
    counter.textContent = `${pad2(Math.floor(s / 60))}:${pad2(s % 60)}`;
  }

  function start() {
    stop();
    startedAt = performance.now();
    counterTimer = setInterval(tickCounter, 250);
    const p = createCuePlayer(INTRO_FILM, { narrator, perform, onCaption, onRosie, onBeat, onDone: () => dispatch({ type: 'intro-done' }) });
    player = p;
    // The sound comes up first, so the first line is narrated, not only captioned;
    // a slow or blocked engine holds the film for at most ENABLE_WAIT_MS. A Skip>>
    // in the meantime leaves `player` changed, and nothing of this run plays.
    const enabled = audio.enable().then((st) => {
      if (player !== p) return st;
      sound.hidden = st !== 'blocked';
      if (st === 'ready') { audio.music.sting(); setTimeout(() => { if (player === p && !p.status().paused) audio.music.bed(); }, 900); }
      return st;
    });
    Promise.race([enabled, new Promise((resolve) => setTimeout(resolve, ENABLE_WAIT_MS))]).then(() => { if (player === p) p.play(); });
  }

  function stop() {
    if (player) player.stop();
    player = null;
    audio.music.stop();
    audio.stopChirps();
    if (counterTimer) clearInterval(counterTimer);
    counterTimer = 0;
    for (const id of leaderTimers) clearTimeout(id);
    leaderTimers = [];
  }

  function pauseFilm() { if (player) { player.pause(); audio.music.stop(); } }
  function resumeFilm() { if (player) { player.resume(); if (audio.state() === 'ready') audio.music.bed(); } }

  async function soundEnabled() {
    const st = await audio.enable();
    sound.hidden = st !== 'blocked';
    if (st === 'ready' && player && !player.status().paused) audio.music.bed();
  }

  function update(state) {
    const paused = Boolean(player && player.status().paused);
    pause.textContent = paused ? 'Resume' : 'Pause';
    pause.setAttribute('aria-pressed', String(paused));
    caption.hidden = state.prefs && state.prefs.captions === false;
    sound.hidden = audio.state() !== 'blocked';
  }

  const debug = () => ({ ...current, playing: Boolean(player && player.status().playing), paused: Boolean(player && player.status().paused), soundButton: !sound.hidden });
  const seek = (i) => { if (player) player.seekBeat(i); };

  return { start, stop, pause: pauseFilm, resume: resumeFilm, soundEnabled, update, debug, seek };
}

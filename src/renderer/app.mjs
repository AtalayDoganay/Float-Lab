// Renderer controller: owns the state, the playback and measurement timers,
// the guided lesson run, demonstrations, persistence through the preload API,
// and the UI modules. Views: home (level choice), level (lesson map), lesson
// (panel + recreated PC•MACs windows), explore (all windows, no lesson),
// progress.
import { LEVELS, LEVEL_BY_ID, LESSONS_BY_ID, WORKSPACE_PARTS, stepKey } from './content/levels.mjs';
import { LESSONS as CLASSIC_LESSONS } from './content/curriculum.mjs';
import { EXERCISES } from './content/exercises.mjs';
import { HANDBOOK_ENTRIES, ALIAS_GROUPS } from './content/handbook.mjs';
import { createLessonRun, legacyKeysFor } from './logic/lesson-flow.mjs';
import { initialBeat } from './logic/step-beats.mjs';
import { initialTerminal, terminalKey, terminalButton } from './logic/terminal.mjs';
import {
  FPS, FRAME_COUNT, LAST_FRAME, ANALOG_CHANNELS, DIGITAL_CHANNELS, CHANNEL_IDS, AXIS_COUNT,
  approachStep, percentOf, digitalFromIntervals, intervalsOf, setDigitalRange, setAnalogRange,
  defaultAnalogs, encodeRuns, decodeRuns, secondsToFrame, clampFrame,
} from './logic/simulation.mjs';
import { computeOutputs } from './logic/outputs.mjs';
import { buildIndex, search } from './logic/search.mjs';
import { DEFAULT_SETTINGS, SCHEMA_VERSION, APP_ID, emptyTraining } from '../shared/progress-schema.mjs';
import { DEFAULT_PREFS } from '../shared/prefs-schema.mjs';
import { mountHelp } from './ui/help.mjs';
import { mountIntro } from './ui/intro.mjs';
import { createAudio } from './ui/audio.mjs';
import { mountPcmacs } from './ui/pcmacs.mjs';
import { mountTerminal } from './ui/terminal.mjs';
import { mountFloatPanel } from './ui/float-panel.mjs';
import { mountHub } from './ui/hub.mjs';
import { mountCourse } from './ui/course.mjs';
import { COURSE, isCourseLesson, courseComplete } from './content/course.mjs';
import { hubState } from './logic/hub-state.mjs';
import { mountLevel, nextLessonFor } from './ui/level.mjs';
import { mountLesson } from './ui/lesson.mjs';
import { mountHandbook } from './ui/handbook.mjs';
import { mountProgress } from './ui/progress.mjs';
import { mountDialogs } from './ui/dialogs.mjs';
import { mountRestartDialog } from './ui/restart-dialog.mjs';
import { createRestartGuard, UNLOCK_MS } from './logic/restart-guard.mjs';
import { mountCinema } from './ui/cinema.mjs';
import { mountRobotPreview } from './ui/robot-preview.mjs';
import { mountRosieHelp } from './ui/rosie-help.mjs';
import { createCuePlayer } from './logic/cue-player.mjs';
import { answerQuestion, hintFor, suggestionsFor } from './logic/questions.mjs';
import { faceSheet, rosieSheet } from './guide/contact-sheet.mjs';
import { assessAttempt, PREVIEW_EDITS } from './logic/digital-task.mjs';
import { createSilentBackend } from './ui/silent-audio.mjs';
import { mountGuideLayer } from './ui/guide-layer.mjs';
import { guidePlan } from './logic/guide-plan.mjs';
import * as THREE from './vendor/three/three.module.js';
import { LINES, WELCOME } from './content/mascot.mjs';
import { el, replace } from './ui/dom.mjs';

const api = window.roseflow;
const SMOKE = new URLSearchParams(location.search).get('smoke') === '1';
const searchIndex = buildIndex(HANDBOOK_ENTRIES, ALIAS_GROUPS);
const STAGE_VIEWS = ['home', 'level', 'progress', 'course'];
const CLASSIC_QUESTIONS = new Map(CLASSIC_LESSONS.map((l) => [l.id, l.questions.map((q) => q.id)]));
const EXERCISE_KEYS = new Map(EXERCISES.map((e) => [e.id, e.steps.map((s) => `${e.id}:${s.id}`)]));
const ZOOMS = [1, 2, 4];
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const DEFAULT_ANALOG_RUNS = JSON.stringify(defaultAnalogs().map(encodeRuns));

function freshSim() {
  const s = DEFAULT_SETTINGS;
  const sim = {
    channelId: s.channelId,
    axis: s.axis,
    command: s.console[s.axis],
    laptopIp: s.laptopIp,
    calibrationCm: 20,
    lights: Object.fromEntries(DIGITAL_CHANNELS.map(({ id }) => [id, digitalFromIntervals(s.lights[id] || [])])),
    analogs: defaultAnalogs(),
    console: [...s.console],
    consoleRev: new Array(AXIS_COUNT).fill(false),
    consoleDigital: {},
    bump: null,
    checks: { autoPunch: false, manual: false, easeIn: false, audioCue: false, loop: false, autoInbetween: false },
    start: 0, stop: LAST_FRAME, punchIn: 0, punchOut: LAST_FRAME, audioCue: 0,
    mode: 'stop', frame: 0,
    selection: { from: 0, to: 0, channels: [] },
    zoom: 1,
    windows: { control: false, console: false, terminal: false },
    note: '',
    measured: 0, measuring: false,
    // A fixture may name channels; a practice may keep a baseline of the
    // channels it must leave alone; the last playback is what a preview check reads.
    names: {}, baseline: null, lastPlay: null,
  };
  sim.outputs = computeOutputs(sim);
  return sim;
}

let playStartFrame = 0;
function recordPlay() {
  const sim = state.sim;
  if (sim.mode === 'play' || sim.mode === 'pause') sim.lastPlay = { from: playStartFrame, to: sim.frame };
}

const idleDemo = () => ({ running: false, finished: false, note: '' });

// `beat` is which part of the step the panel shows: look, watch, or try.
function freshLesson() {
  return { id: null, stepIndex: 0, beat: 'look', feedback: null, lastChoice: null, demo: idleDemo(), justFinished: null };
}

function freshState() {
  return {
    view: 'home',
    level: null,
    lesson: freshLesson(),
    learning: { completedSteps: [], completedLessons: [], missedLessons: [] },
    course: { completedLessons: [], missedLessons: [], answered: [] },
    guided: { completedSteps: [], completedExercises: [] },
    sim: freshSim(),
    terminal: initialTerminal(),
    handbook: { open: false, query: '', result: null, entryId: null },
    persistence: { recovered: null, error: null, savedAt: null, path: '', loaded: false, migrated: null, readFailed: false },
    migratedInfo: null,
    saved: null,
    dialogs: { photo: null, progress: false, restart: false },
    // The restart guard's snapshot while its dialog is open; simple mode skips the guard.
    guard: null,
    guardSimple: false,
    hubVisits: 0,
    // A narrated film in progress (the lesson's cinema) and Rosie's help popover.
    cinema: { playing: false, paused: false, beat: -1, caption: '', rosie: null, target: null, stalled: null },
    help: { open: false, mode: 'menu', question: '', answer: null, hint: '', suggestions: [] },
    // Rosie's welcome dialog (superseded by the orientation film; kept for the record in the file).
    guide: { welcomed: false, open: false, step: 0 },
    // The orientation film: once per fresh launch, never again on Home or a resize.
    intro: { shown: false, rosie: { expression: 'wave', line: null } },
    prefs: DEFAULT_PREFS,
    training: emptyTraining(),
  };
}

let state = freshState();
let lessonRun = null;
let guard = null;
let guardClearTimer = 0;
let restarting = false; // a confirmed restart in flight: a second click must not reset twice
let silentAudio = null; // the smoke harness's silent speech and audio stand-ins
let guardUnlockMs = UNLOCK_MS; // the smoke harness shortens it
let filmPlayer = null;
let filmScale = 1; // the smoke harness runs films faster
const idleCinema = () => ({ playing: false, paused: false, beat: -1, caption: '', rosie: null, target: null, stalled: null });
const closedHelp = () => ({ open: false, mode: 'menu', question: '', answer: null, hint: '', suggestions: [] });
const reducedMotion = () => state.prefs.reducedMotion === true || (state.prefs.reducedMotion === null && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
function syncGuard() { state.guard = guard ? guard.state() : null; }
let playTimer = null;
let measureTimer = null;
let saveTimer = null;
let highlightTimer = null;
let demoToken = 0;
let demoSnapshot = null;
let drawBase = null;
let ready = false;

// ---------- timers ----------
function stopTimer() {
  if (playTimer) clearInterval(playTimer);
  playTimer = null;
}

// Stop as the Stop button does: playback ends where it is.
function stopPlayback() {
  stopTimer();
  recordPlay();
  state.sim.mode = 'stop';
}

// Back to a clean transport (used when a lesson or step changes).
function resetTransport() {
  stopPlayback();
  state.sim.frame = state.sim.start;
}

function startTimer() {
  stopTimer();
  playTimer = setInterval(() => {
    const sim = state.sim;
    if (sim.mode !== 'play') return;
    if (sim.frame >= sim.stop) {
      if (sim.checks.loop) { sim.frame = sim.start; renderTick(); return; }
      stopPlayback();
      afterAction({ type: 'playback-complete' }, { type: 'playback-complete' });
      render();
      scheduleSave();
      return;
    }
    sim.frame += 1;
    renderTick();
  }, 1000 / FPS);
}

function play() {
  const sim = state.sim;
  if (sim.mode !== 'pause') { sim.frame = sim.start; playStartFrame = sim.start; }
  sim.mode = 'play';
  startTimer();
}

function stopMeasure() {
  if (measureTimer) clearInterval(measureTimer);
  measureTimer = null;
  state.sim.measuring = false;
}

function startMeasure() {
  stopMeasure();
  state.sim.measuring = true;
  measureTimer = setInterval(() => {
    const sim = state.sim;
    const target = percentOf(computeOutputs(sim).analogs[sim.axis]);
    const next = approachStep(sim.measured, target);
    if (next !== sim.measured) {
      sim.measured = next;
      renderTick();
    }
  }, 60);
}

// ---------- lesson run ----------
function levelContaining(lessonId) {
  if (isCourseLesson(lessonId)) return 'course';
  if (state.level && LEVEL_BY_ID[state.level] && LEVEL_BY_ID[state.level].lessons.includes(lessonId)) return state.level;
  const found = LEVELS.find((l) => l.lessons.includes(lessonId));
  return found ? found.id : state.level;
}

// Real training activity: a passed check, an answer, a step advanced, a film watched.
function touchTraining() {
  state.training.lastActivityAt = new Date().toISOString();
}

const hubOf = () => hubState({
  persistence: state.persistence, training: state.training, learning: state.learning, saved: state.saved,
  current: state.lesson.id ? { lessonId: state.lesson.id, stepIndex: state.lesson.stepIndex } : null,
});

function applySetup(actions) {
  for (const action of actions) reduce(action);
}

// Show me must leave the learner's attempt as it found it: the show data, and
// the view, selection, names, baseline and last playback around it (the
// film's own playback must not count as the learner's preview).
function snapshotShow() {
  const sim = state.sim;
  return {
    lights: Object.fromEntries(Object.entries(sim.lights).map(([id, f]) => [id, [...f]])),
    analogs: sim.analogs.map((a) => [...a]),
    console: [...sim.console],
    command: sim.command,
    axis: sim.axis,
    selection: { ...sim.selection, channels: [...sim.selection.channels] },
    channelId: sim.channelId,
    zoom: sim.zoom,
    frame: sim.frame,
    start: sim.start,
    stop: sim.stop,
    names: { ...sim.names },
    baseline: sim.baseline ? structuredClone(sim.baseline) : null,
    lastPlay: sim.lastPlay ? { ...sim.lastPlay } : null,
    note: sim.note,
  };
}

function restoreShow(snap) {
  Object.assign(state.sim, snap);
}

function cancelDemo() {
  demoToken += 1;
  if (filmPlayer) { filmPlayer.stop(); filmPlayer = null; }
  ui.cinema.hideCursor();
  ui.audio.stopChirps();
  ui.audio.cancelNarration();
  if (ui.pcmacs) ui.pcmacs.closeMenus();
  if (state.lesson.demo.running) {
    stopPlayback();
    stopMeasure();
    if (demoSnapshot) restoreShow(demoSnapshot);
  }
  demoSnapshot = null;
  state.lesson.demo = idleDemo();
  state.cinema = idleCinema();
}

const trainingKey = (step) => `${lessonRun.lesson.id}:${step.id}`;
function noteTraining(list, key) {
  if (!state.training[list].includes(key)) state.training[list] = [...state.training[list], key];
}

// A narrated film on an isolated copy of the show: the learner's attempt is
// snapshotted first and restored afterwards (interim choice, see
// docs/FIRST_SEGMENT.md). Every cue goes through the cinema runner, which
// performs it on the real controls.
function runFilm(film, { assisted = false } = {}) {
  if (!lessonRun || state.view !== 'lesson') return;
  cancelDemo();
  const c = lessonRun.current();
  const token = ++demoToken;
  demoSnapshot = snapshotShow();
  for (const a of film.setup || []) reduce(a);
  state.lesson.demo = { running: true, finished: false, note: film.intro };
  state.lesson.beat = 'watch';
  state.lesson.feedback = null;
  state.help = closedHelp();
  state.cinema = { ...idleCinema(), playing: true, beat: 0 };
  render();
  const narrator = {
    speak: (t) => (ui.audio.state() === 'ready' ? ui.audio.narrate(t) : Promise.resolve({ spoken: false })),
    pause: () => ui.audio.pauseNarration(),
    resume: () => ui.audio.resumeNarration(),
    cancel: () => ui.audio.cancelNarration(),
  };
  const planGuide = () => ui.guide.update(guidePlan({ state, run: lessonRun }));
  filmPlayer = createCuePlayer(film, {
    narrator,
    perform: (cue) => ui.cinema.perform(cue),
    onCaption: (t) => { state.cinema.caption = t || ''; ui.lesson.caption(state.cinema.caption); },
    onRosie: (cue) => {
      if (cue.chirp === 'stop') { ui.audio.stopChirps(); return; }
      state.cinema.rosie = { expression: cue.expression, line: cue.line ?? null, glasses: cue.glasses ?? (state.cinema.rosie ? state.cinema.rosie.glasses : false) };
      if (cue.line && cue.chirp) ui.audio.chirp(cue.line, cue.chirp);
      planGuide();
    },
    onBeat: (i) => { state.cinema.beat = i; },
    onStall: (cue) => { if (filmPlayer) filmPlayer.pause(); state.cinema.paused = true; state.cinema.stalled = cue; state.cinema.caption = `(waiting for ${cue.click || cue.pointer || cue.type || 'the control'})`; render(); },
    onDone: () => finishFilm(token, film, c, { assisted, skipped: false }),
    now: () => performance.now() / filmScale,
    setTimeout: (fn, ms) => setTimeout(fn, ms * filmScale),
    clearTimeout: (id) => clearTimeout(id),
  });
  ui.audio.music.bed();
  filmPlayer.play();
}

function finishFilm(token, film, c, { assisted, skipped }) {
  if (token !== demoToken) return;
  if (filmPlayer) { filmPlayer.stop(); filmPlayer = null; }
  ui.cinema.hideCursor();
  ui.audio.music.stop();
  if (!skipped) ui.audio.music.done();
  stopPlayback();
  if (ui.pcmacs) ui.pcmacs.closeMenus();
  if (demoSnapshot) restoreShow(demoSnapshot);
  demoSnapshot = null;
  state.lesson.demo = { running: false, finished: true, note: skipped ? 'Skipped. Watch it any time with Watch again.' : (film.outro || 'Demonstration finished. Now you try.') };
  state.cinema = idleCinema();
  noteTraining(skipped ? 'skipped' : 'watched', trainingKey(c.step));
  if (assisted) noteTraining('assisted', trainingKey(c.step));
  if (!skipped) touchTraining();
  // The attempt is back as it was (the snapshot covers the view and the fixture's
  // names and baseline too); nothing is re-applied over it.
  render();
  scheduleSave();
}

// The practice's "Show me" and the orientation demos: a film when the step has one, else the plain demo.
function showMe({ assisted = false } = {}) {
  if (!lessonRun || state.view !== 'lesson') return undefined;
  const c = lessonRun.current();
  if (c.step.film) { runFilm(c.step.film, { assisted }); return undefined; }
  return runDemo({ assisted }); // a promise: the harness awaits a plain demonstration's end
}

function openHelp() {
  if (!lessonRun || state.view !== 'lesson' || state.lesson.demo.running) return;
  const c = lessonRun.current();
  const hint = c.step.id === 'try' && lessonRun.lesson.id === 's1-one-second-on' ? hintFor(assessAttempt({ sim: state.sim }).state) : '';
  state.help = { open: true, mode: 'menu', question: '', answer: null, hint, suggestions: suggestionsFor(c.step.id) };
}

// Leaving the lesson view while a demonstration runs cancels it, as Back does,
// and the step reopens at its first beat.
function leaveLesson() {
  if (!state.lesson.demo.running) return;
  cancelDemo();
  if (lessonRun) { const c = lessonRun.current(); state.lesson.beat = initialBeat(c.step, c.done, { filmSeen: filmSeen(c.step) }); }
}

// Whether this step's film has already been watched or skipped on any step of
// the lesson that offers it (the watch step and the practice share one film).
function filmSeen(step) {
  if (!step.film || !lessonRun) return false;
  return lessonRun.lesson.steps.some((s) => s.film === step.film && (state.training.watched.includes(trainingKey(s)) || state.training.skipped.includes(trainingKey(s))));
}

function syncLesson() {
  if (!lessonRun) return;
  const p = lessonRun.progress();
  const id = lessonRun.lesson.id;
  const prefix = `${id}:`;
  const known = new Set(lessonRun.lesson.steps.map((s) => s.id));
  state.lesson.stepIndex = p.index;
  // Keys for steps this lesson no longer has (saved by an earlier version) are kept, not dropped.
  const others = state.learning.completedSteps.filter((k) => !k.startsWith(prefix) || !known.has(k.slice(prefix.length)));
  state.learning.completedSteps = [...others, ...p.completedSteps.map((s) => stepKey(id, s))];
  if (p.finished && !state.learning.completedLessons.includes(id)) state.learning.completedLessons = [...state.learning.completedLessons, id];
  if (p.missed && !state.learning.missedLessons.includes(id)) state.learning.missedLessons = [...state.learning.missedLessons, id];
  if (isCourseLesson(id)) {
    state.training.checkpoint = { lessonId: id, stepIndex: p.index };
    state.training.completed = courseComplete(state.learning);
  }
}

// Setup actions that change only modes and views, never the learner's show
// data. Restoring saved progress replays these so a step's text stays true.
const SAFE_SETUP = new Set(['set-manual', 'term-reset', 'term-axis', 'term-key', 'full-show', 'select-axis', 'select-channel', 'select-range', 'reset-measure', 'set-calibration', 'select-laptop-ip', 'stop', 'set-channel-names', 'snapshot-baseline']);

function enterStep({ setup }) {
  const c = lessonRun.current();
  state.lesson.stepIndex = c.index;
  state.lesson.beat = initialBeat(c.step, c.done, { filmSeen: filmSeen(c.step) });
  state.lesson.feedback = null;
  state.lesson.lastChoice = null;
  state.lesson.demo = idleDemo();
  state.sim.note = '';
  if (!setup) return;
  const actions = c.step.kind === 'practice' ? (c.done ? [] : c.step.practice.setup) : (c.step.setup || []);
  if (!actions.length) return;
  applySetup(setup === 'safe' ? actions.filter((a) => SAFE_SETUP.has(a.type)) : actions);
}

function buildRun(lesson, stepIndex) {
  const prefix = `${lesson.id}:`;
  return createLessonRun(lesson, {
    stepIndex,
    completedSteps: state.learning.completedSteps.filter((k) => k.startsWith(prefix)).map((k) => k.slice(prefix.length)),
    missed: state.learning.missedLessons.includes(lesson.id),
    legacy: { answered: state.course.answered, exerciseSteps: state.guided.completedSteps },
  });
}

// stepIndex may be a number or 'auto' (the first step not yet completed).
function loadLesson(id, stepIndex = 'auto', { setup = true } = {}) {
  const lesson = LESSONS_BY_ID[id];
  if (!lesson) return false;
  cancelDemo();
  // The segment names its channels in every step's setup; the archive lessons keep the trainer's names.
  if (!isCourseLesson(id)) { state.sim.names = {}; state.sim.baseline = null; }
  let index = stepIndex === 'auto' ? 0 : stepIndex;
  lessonRun = buildRun(lesson, index);
  if (stepIndex === 'auto') {
    const done = new Set(lessonRun.progress().completedSteps);
    index = Math.max(0, lesson.steps.findIndex((s) => !done.has(s.id)));
    if (index > 0) lessonRun = buildRun(lesson, index);
  }
  state.lesson = { ...freshLesson(), id };
  state.level = levelContaining(id);
  syncLesson();
  enterStep({ setup });
  return true;
}

// Mirror a passed step into the version-1 records it reuses, so the classic
// question and exercise records stay coherent with the guided flow.
function recordLegacy(step) {
  const keys = legacyKeysFor(step);
  if (keys.questionId && !state.course.answered.includes(keys.questionId)) {
    state.course.answered = [...state.course.answered, keys.questionId];
    for (const [lessonId, questions] of CLASSIC_QUESTIONS) {
      if (questions.includes(keys.questionId) && questions.every((q) => state.course.answered.includes(q)) && !state.course.completedLessons.includes(lessonId)) {
        state.course.completedLessons = [...state.course.completedLessons, lessonId];
      }
    }
  }
  if (keys.exerciseStep && !state.guided.completedSteps.includes(keys.exerciseStep)) {
    state.guided.completedSteps = [...state.guided.completedSteps, keys.exerciseStep];
    const exerciseId = keys.exerciseStep.split(':')[0];
    const all = EXERCISE_KEYS.get(exerciseId) || [];
    if (all.every((k) => state.guided.completedSteps.includes(k)) && !state.guided.completedExercises.includes(exerciseId)) {
      state.guided.completedExercises = [...state.guided.completedExercises, exerciseId];
    }
  }
}

function recordLegacyMiss(step) {
  const keys = legacyKeysFor(step);
  if (!keys.questionId) return;
  for (const [lessonId, questions] of CLASSIC_QUESTIONS) {
    if (questions.includes(keys.questionId) && !state.course.missedLessons.includes(lessonId)) state.course.missedLessons = [...state.course.missedLessons, lessonId];
  }
}

function simForCheck() {
  return { ...state.sim, outputs: computeOutputs(state.sim) };
}

function lessonCheck(action) {
  if (!lessonRun) return null;
  const c = lessonRun.current();
  const result = lessonRun.check({ sim: simForCheck(), terminal: state.terminal, action });
  state.lesson.feedback = { ok: result.ok, message: result.message };
  // The result has its place in the try beat, however the learner got there.
  state.lesson.beat = 'try';
  if (result.ok) recordLegacy(c.step);
  if (result.ok) touchTraining();
  if (!state.training.attempted.includes(`${lessonRun.lesson.id}:${c.step.id}`)) state.training.attempted = [...state.training.attempted, `${lessonRun.lesson.id}:${c.step.id}`];
  syncLesson();
  // A passed step is saved at once, whatever action passed it.
  if (result.ok) scheduleSave();
  return state.lesson.feedback;
}

function afterAction(original, effective) {
  if (!lessonRun || state.view !== 'lesson' || state.lesson.demo.running || original.live) return;
  const c = lessonRun.current();
  if (c.step.kind !== 'practice' || c.done) return;
  const types = new Set([original.type, effective.type]);
  if (c.step.practice.triggers.some((t) => types.has(t))) lessonCheck(original);
}

// A plain demonstration: its actions run through the reducer, and the ones a
// learner would do with the mouse (open a menu, zoom) also move the
// demonstration cursor and click the real control.
async function runDemo({ assisted = false } = {}) {
  if (!lessonRun || state.view !== 'lesson') return;
  const c = lessonRun.current();
  const demo = c.step.demo;
  if (!demo || state.lesson.demo.running) return;
  const token = ++demoToken;
  demoSnapshot = snapshotShow();
  state.lesson.demo = { running: true, finished: false, note: demo.intro };
  state.lesson.beat = 'watch';
  state.lesson.feedback = null;
  state.help = closedHelp();
  render();
  for (const a of demo.actions) {
    if (token !== demoToken) return;
    if (Number.isInteger(a.wait)) { await sleep(a.wait * filmScale); continue; }
    try {
      if (a.type === 'menu') await ui.cinema.perform({ menu: a.id });
      else if (a.type === 'zoom') await ui.cinema.perform({ click: a.dir > 0 ? 'menu-time-in' : 'menu-time-out' });
      else { reduce(a); render(); }
    } catch {
      // A control the cursor could not reach is performed through the reducer
      // instead; a cancelled demonstration performs nothing more.
      if (token !== demoToken) return;
      reduce(a);
      render();
    }
  }
  if (token !== demoToken) return;
  ui.cinema.hideCursor();
  if (ui.pcmacs) ui.pcmacs.closeMenus();
  stopPlayback();
  restoreShow(demoSnapshot);
  demoSnapshot = null;
  state.lesson.demo = { running: false, finished: true, note: demo.outro || 'Demonstration finished. Now you try.' };
  if (assisted) noteTraining('assisted', trainingKey(c.step));
  // A practice step gets its modes and views back (never its show data: the
  // attempt was restored above and stays as it was).
  const now = lessonRun.current();
  if (now.step === c.step && now.step.kind === 'practice' && !now.done) applySetup(now.step.practice.setup.filter((a) => SAFE_SETUP.has(a.type) && a.type !== 'snapshot-baseline'));
  render();
}

// ---------- persistence ----------
function toProgressDoc() {
  // While a demonstration runs on its isolated copy, what is saved is the learner's own attempt.
  const sim = demoSnapshot ? { ...state.sim, ...demoSnapshot } : state.sim;
  const runs = sim.analogs.map(encodeRuns);
  return {
    schemaVersion: SCHEMA_VERSION,
    app: APP_ID,
    savedAt: null,
    // The film is not a place to come back to: a save made during it points at the hub.
    location: { view: state.view === 'intro' ? 'home' : state.view, level: state.level, lessonId: state.lesson.id, stepIndex: state.lesson.stepIndex },
    learning: {
      completedSteps: [...state.learning.completedSteps],
      completedLessons: [...state.learning.completedLessons],
      missedLessons: [...state.learning.missedLessons],
    },
    course: {
      completedLessons: [...state.course.completedLessons],
      missedLessons: [...state.course.missedLessons],
      answered: [...state.course.answered],
    },
    guided: { completedSteps: [...state.guided.completedSteps], completedExercises: [...state.guided.completedExercises] },
    settings: {
      channelId: sim.channelId,
      axis: sim.axis,
      command: sim.command,
      laptopIp: sim.laptopIp,
      lights: Object.fromEntries(DIGITAL_CHANNELS.map(({ id }) => [id, intervalsOf(sim.lights[id])])),
      analogs: JSON.stringify(runs) === DEFAULT_ANALOG_RUNS ? null : runs,
      console: [...sim.console],
    },
    migrated: state.migratedInfo,
    guide: { welcomed: state.guide.welcomed },
    training: structuredClone(state.training),
  };
}

function applyProgress(doc) {
  stopPlayback();
  stopMeasure();
  cancelDemo();
  state.learning = { completedSteps: [...doc.learning.completedSteps], completedLessons: [...doc.learning.completedLessons], missedLessons: [...doc.learning.missedLessons] };
  state.course = { completedLessons: [...doc.course.completedLessons], missedLessons: [...doc.course.missedLessons], answered: [...doc.course.answered] };
  state.guided = { completedSteps: [...doc.guided.completedSteps], completedExercises: [...doc.guided.completedExercises] };
  const s = doc.settings;
  const sim = freshSim();
  sim.channelId = DIGITAL_CHANNELS.some((c) => c.id === s.channelId) ? s.channelId : 'light-1';
  for (const { id } of DIGITAL_CHANNELS) sim.lights[id] = digitalFromIntervals(s.lights[id] || []);
  if (s.analogs) sim.analogs = s.analogs.map(decodeRuns);
  sim.console = [...s.console];
  sim.axis = s.axis;
  sim.command = sim.console[s.axis];
  sim.laptopIp = s.laptopIp;
  state.sim = sim;
  state.terminal = initialTerminal();
  state.migratedInfo = doc.migrated;
  state.guide = { welcomed: doc.guide.welcomed, open: false, step: 0 };
  state.training = structuredClone(doc.training);
  state.level = doc.location.level;
  state.saved = { ...doc.location };
  if (doc.location.lessonId && LESSONS_BY_ID[doc.location.lessonId]) loadLesson(doc.location.lessonId, doc.location.stepIndex, { setup: 'safe' });
  else { lessonRun = null; state.lesson = freshLesson(); }
  // The app opens on the film, then the hub; Continue takes the learner back.
  state.view = state.intro.shown ? 'home' : 'intro';
}

async function saveNow() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = null;
  if (!state.persistence.loaded) return { ok: false, error: 'not-ready' };
  // A file that could not be read is never written over.
  if (state.persistence.readFailed) return { ok: false, error: 'unread' };
  const result = await api.progress.save(toProgressDoc());
  if (result.ok) { state.persistence.savedAt = result.savedAt; state.persistence.error = null; }
  else state.persistence.error = result.error;
  render();
  return result;
}

function scheduleSave() {
  if (!state.persistence.loaded) return;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => { saveNow(); }, 300);
}

// ---------- simulation helpers ----------
const selectionHas = (kind) => {
  const sel = state.sim.selection;
  return sel.to > sel.from && sel.channels.some((id) => id.startsWith(kind));
};

// The axis selected in the PC•MACs windows. The card's own "s) axis to
// modify" in the terminal is separate state: the real programs do not link them.
function selectAxis(axis) {
  const sim = state.sim;
  sim.axis = axis;
  sim.command = sim.console[axis];
}

const note = (text) => { state.sim.note = text; return null; };

// ---------- reducer ----------
function reduce(action) {
  const { sim } = state;
  // Editing the show data makes the last playback stale: "previewed" means this data was played.
  if (PREVIEW_EDITS.has(action.type)) sim.lastPlay = null;
  switch (action.type) {
    // navigation
    case 'go-home':
      leaveLesson();
      state.view = 'home';
      state.hubVisits += 1;
      return null;
    case 'open-course':
      leaveLesson();
      state.lesson.justFinished = null;
      state.view = 'course';
      return null;
    // The hub's two actions (brief §14).
    case 'start-training': {
      const h = hubOf();
      if (!h.startEnabled) return null;
      if (h.kind === 'in-progress' || h.kind === 'completed') { state.dialogs.progress = true; return null; }
      return reduce({ type: 'start-lesson', id: COURSE.lessons[0] });
    }
    case 'continue-training': {
      // From the guarded restart dialog, Continue is the plain way out: its timers and guard go first.
      if (state.dialogs.restart) reduce({ type: 'restart-cancel' });
      const h = hubOf();
      if (!h.continueEnabled) return null;
      state.dialogs.progress = false;
      if (lessonRun && state.lesson.id) { state.level = levelContaining(lessonRun.lesson.id); state.view = 'lesson'; return null; }
      if (h.checkpoint) return reduce({ type: 'start-lesson', id: h.checkpoint.lessonId, stepIndex: h.checkpoint.stepIndex });
      if (h.kind === 'completed') { const last = COURSE.lessons[COURSE.lessons.length - 1]; return reduce({ type: 'start-lesson', id: last, stepIndex: LESSONS_BY_ID[last].steps.length - 1 }); }
      state.view = 'course';
      return null;
    }
    case 'progress-dialog-close':
      state.dialogs.progress = false;
      return null;
    case 'choose-level':
      if (!LEVEL_BY_ID[action.level]) return null;
      leaveLesson();
      state.level = action.level;
      state.lesson.justFinished = null;
      state.view = 'level';
      return null;
    case 'open-level':
      leaveLesson();
      state.view = state.level === 'course' ? 'course' : (state.level ? 'level' : 'home');
      return null;
    case 'begin-here': {
      const next = nextLessonFor(state.level, state.learning);
      if (!next) { state.view = 'home'; return null; }
      return reduce({ type: 'start-lesson', id: next.id });
    }
    case 'start-lesson':
      resetTransport();
      stopMeasure();
      // Windows opened from the RealTime menu close between lessons, so each
      // lesson reveals only what it introduces.
      state.sim.windows = { control: false, console: false, terminal: false };
      if (!loadLesson(action.id, Number.isInteger(action.stepIndex) ? action.stepIndex : 'auto')) return null;
      state.view = 'lesson';
      state.handbook.open = false;
      return null;
    case 'explore':
      leaveLesson();
      state.view = 'explore';
      return null;
    case 'go-progress':
      leaveLesson();
      state.view = 'progress';
      return null;
    case 'resume': {
      // The current lesson or level this session, else the saved place.
      const s = state.saved;
      if (lessonRun) { state.level = levelContaining(lessonRun.lesson.id); state.view = 'lesson'; }
      else if (state.level && LEVEL_BY_ID[state.level]) state.view = 'level';
      else if (s && s.level && LEVEL_BY_ID[s.level]) { state.level = s.level; state.view = 'level'; }
      else state.view = 'home';
      return null;
    }

    // lesson steps
    case 'step-next': {
      if (!lessonRun) return null;
      const r = lessonRun.next();
      if (r.event === 'advanced') { syncLesson(); touchTraining(); enterStep({ setup: true }); }
      if (r.event === 'finished') {
        syncLesson();
        touchTraining();
        state.lesson.justFinished = lessonRun.lesson.id;
        state.lesson.feedback = null;
        state.view = state.level === 'course' ? 'course' : 'level';
        resetTransport();
        stopMeasure();
      }
      if (r.event === 'blocked') state.lesson.feedback = { ok: false, message: LINES.blocked() };
      return r.event;
    }
    case 'step-back':
      if (lessonRun) { cancelDemo(); lessonRun.back(); enterStep({ setup: false }); }
      return null;
    case 'step-check':
      return lessonCheck({ type: 'check' });
    case 'step-answer': {
      if (!lessonRun) return null;
      const c = lessonRun.current();
      const r = lessonRun.answer(action.choice);
      state.lesson.feedback = r;
      state.lesson.lastChoice = action.choice;
      if (r.ok) recordLegacy(c.step); else recordLegacyMiss(c.step);
      touchTraining();
      syncLesson();
      return r;
    }
    case 'demo-start':
      showMe();
      return null;
    case 'beat-try':
      if (lessonRun && !state.lesson.demo.running) state.lesson.beat = 'try';
      return null;
    // the film's transport
    case 'film-pause':
      if (filmPlayer && !state.cinema.paused) { filmPlayer.pause(); state.cinema.paused = true; ui.audio.music.stop(); }
      return null;
    case 'film-resume':
      if (filmPlayer && state.cinema.paused) { filmPlayer.resume(); state.cinema.paused = false; state.cinema.stalled = null; if (ui.audio.state() === 'ready') ui.audio.music.bed(); }
      return null;
    case 'film-replay':
      if (lessonRun && lessonRun.current().step.film) runFilm(lessonRun.current().step.film, { assisted: false });
      return null;
    case 'film-skip': {
      if (!filmPlayer || !lessonRun) return null;
      const c = lessonRun.current();
      finishFilm(demoToken, c.step.film, c, { assisted: false, skipped: true });
      return null;
    }
    // Rosie's help (brief §7)
    case 'help-open-menu':
      openHelp();
      return null;
    case 'help-close':
      state.help = closedHelp();
      queueMicrotask(() => document.getElementById('rosie-help')?.focus({ preventScroll: true }));
      return null;
    case 'help-ask':
      if (state.help.open) state.help.mode = 'ask';
      return null;
    case 'help-back':
      if (state.help.open) { state.help.mode = 'menu'; state.help.answer = null; }
      return null;
    case 'help-question': {
      if (!state.help.open || !lessonRun) return null;
      const c = lessonRun.current();
      state.help.mode = 'ask';
      state.help.question = String(action.text || '');
      state.help.answer = answerQuestion(state.help.question, { stepId: c.step.id });
      noteTraining('assisted', trainingKey(c.step));
      ui.audio.chirp(state.help.answer.text, state.help.answer.kind === 'basic' ? 'neutral' : 'concern');
      return state.help.answer;
    }
    case 'help-show-me':
      state.help = closedHelp();
      showMe({ assisted: true });
      return null;
    case 'lesson-reset': {
      if (!lessonRun) return null;
      const id = lessonRun.lesson.id;
      const prefix = `${id}:`;
      state.learning.completedSteps = state.learning.completedSteps.filter((k) => !k.startsWith(prefix));
      state.learning.completedLessons = state.learning.completedLessons.filter((l) => l !== id);
      state.learning.missedLessons = state.learning.missedLessons.filter((l) => l !== id);
      resetTransport();
      stopMeasure();
      loadLesson(id, 0);
      return null;
    }
    case 'highlight':
      if (!['lesson', 'explore'].includes(state.view)) state.view = 'explore';
      queueMicrotask(() => highlight(action.controls));
      return null;
    // Open (or, with no id, close) a PC•MACs menu the way a click on its title does: for demonstrations.
    case 'menu':
      queueMicrotask(() => { if (action.id) ui.pcmacs.openMenu(action.id); else ui.pcmacs.closeMenus(); });
      return null;

    // ---- Edit View: selection (manual pp. 81-85) ----
    case 'select-range': {
      const from = clampFrame(Math.min(action.from, action.to));
      const to = clampFrame(Math.max(action.from, action.to));
      const channels = action.keepChannels ? sim.selection.channels : (action.channels || []).filter((id) => CHANNEL_IDS.includes(id));
      sim.selection = { from, to, channels: [...channels] };
      const firstDigital = channels.find((id) => id.startsWith('light-'));
      const firstAnalog = channels.find((id) => id.startsWith('axis-'));
      if (!action.keepChannels && channels.length === 1 && firstDigital) sim.channelId = firstDigital;
      if (!action.keepChannels && channels.length === 1 && firstAnalog) selectAxis(Number(firstAnalog.slice(5)));
      return null;
    }
    case 'select-name': {
      if (!CHANNEL_IDS.includes(action.id)) return null;
      const has = sim.selection.channels.includes(action.id);
      const channels = action.toggle ? (has ? sim.selection.channels.filter((id) => id !== action.id) : [...sim.selection.channels, action.id]) : [action.id];
      sim.selection = { ...sim.selection, channels };
      if (action.id.startsWith('axis-')) { selectAxis(Number(action.id.slice(5))); return { as: { type: 'select-axis' } }; }
      sim.channelId = action.id;
      return { as: { type: 'select-channel' } };
    }
    case 'select-channel':
      if (DIGITAL_CHANNELS.some((c) => c.id === action.id)) { sim.channelId = action.id; sim.selection = { ...sim.selection, channels: [action.id] }; }
      return null;
    case 'select-axis':
      if (Number.isInteger(action.axis) && action.axis >= 0 && action.axis < AXIS_COUNT) {
        selectAxis(action.axis);
        if (action.select) sim.selection = { ...sim.selection, channels: [`axis-${action.axis}`] };
      }
      return null;
    case 'select-all':
      sim.selection = { from: 0, to: FRAME_COUNT, channels: [...CHANNEL_IDS] };
      return null;
    case 'deselect-all':
      sim.selection = { ...sim.selection, channels: [] };
      return null;

    // ---- Edit View: editing ----
    case 'set-digital': {
      if (!selectionHas('light-')) return note('Set Digitals On and Set Digitals Off are only available when one or more digital channels are selected for a non-zero stretch of time (manual pp. 176–177). Drag along a digital channel first, or type the times and click its name.');
      const { from, to, channels } = sim.selection;
      for (const id of channels.filter((c) => c.startsWith('light-'))) sim.lights[id] = setDigitalRange(sim.lights[id], from, to, action.on);
      sim.channelId = channels.find((c) => c.startsWith('light-'));
      sim.note = '';
      return null;
    }
    case 'set-digital-pattern':
      if (sim.lights[action.channelId]) sim.lights[action.channelId] = digitalFromIntervals(action.seconds.map(([a, b]) => [secondsToFrame(a), secondsToFrame(b)]));
      return null;
    // ---- fixtures (setup actions of the guided lessons) ----
    case 'set-channel-names':
      sim.names = { ...(action.names || {}) };
      return null;
    case 'snapshot-baseline':
      sim.baseline = { lights: Object.fromEntries(Object.entries(sim.lights).map(([id, f]) => [id, [...f]])), analogs: sim.analogs.map((a) => [...a]) };
      sim.lastPlay = null;
      return null;
    case 'draw-begin':
      drawBase = null;
      return null;
    case 'draw-digital':
    case 'draw-digital-done': {
      const id = action.channelId;
      if (!sim.lights[id]) return null;
      if (!drawBase || drawBase.id !== id) drawBase = { id, frames: sim.lights[id] };
      sim.lights[id] = setDigitalRange(drawBase.frames, action.from, action.to, action.on);
      sim.channelId = id;
      if (action.type === 'draw-digital-done') drawBase = null;
      return null;
    }
    case 'open-value-dialog':
      if (!selectionHas('axis-')) return note('Set Analogs to a Value... is only available when one or more analog channels are selected for a non-zero stretch of time (manual p. 178). Drag along an analog trace first, or type the times and click its name.');
      queueMicrotask(() => ui.pcmacs.openValueDialog());
      return null;
    case 'set-analog-value': {
      if (!Number.isInteger(action.value) || action.value < 0 || action.value > 255) return null;
      if (Number.isInteger(action.axis)) {
        sim.analogs[action.axis] = setAnalogRange(sim.analogs[action.axis], secondsToFrame(action.fromSec), secondsToFrame(action.toSec), action.value);
        return null;
      }
      if (!selectionHas('axis-')) return null;
      const { from, to, channels } = sim.selection;
      for (const id of channels.filter((c) => c.startsWith('axis-'))) {
        const axis = Number(id.slice(5));
        sim.analogs[axis] = setAnalogRange(sim.analogs[axis], from, to, action.value);
      }
      return null;
    }
    case 'reset-analogs':
      sim.analogs = defaultAnalogs();
      return null;
    case 'zoom': {
      const i = ZOOMS.indexOf(sim.zoom) + action.dir;
      if (i >= 0 && i < ZOOMS.length) sim.zoom = ZOOMS[i];
      return null;
    }
    case 'set-zoom':
      if (ZOOMS.includes(action.zoom)) sim.zoom = action.zoom;
      return null;

    // ---- Control Window (manual pp. 201-206) ----
    case 'play':
      play();
      return null;
    case 'stop':
      stopPlayback();
      return null;
    case 'pause':
      if (sim.mode === 'play') { stopTimer(); sim.mode = 'pause'; }
      else if (sim.mode === 'pause') play();
      else return note('Pause only acts while the show is playing.');
      return null;
    case 'record':
    case 'rehearse':
      return note(`${action.type === 'record' ? 'Record' : 'Rehearse'} plays the show while the Soft Console inputs are ${action.type === 'record' ? 'recorded into' : 'tried against'} it (manual pp. 202–203). Recording is not simulated in this trainer; use the Edit menu to change the show.`);
    case 'offline':
      return note('OffLine opens the OffLine Editing Window, the Edit View above (manual p. 203). It is already open here.');
    case 'set-check':
      if (action.key in sim.checks) sim.checks[action.key] = Boolean(action.on);
      if (action.key === 'manual' && !action.on) { sim.bump = null; sim.consoleDigital = {}; }
      return { as: { type: `check-${action.key}` } };
    case 'toggle-check':
      return reduce({ type: 'set-check', key: action.key, on: !sim.checks[action.key] });
    case 'set-transport-time': {
      if (!['start', 'stop', 'punchIn', 'punchOut', 'audioCue'].includes(action.which)) return null;
      const f = Math.min(Math.max(Math.round(action.frame), 0), LAST_FRAME);
      sim[action.which] = f;
      if (action.which === 'start' && sim.stop < f) sim.stop = f;
      if (action.which === 'stop' && sim.start > f) sim.start = f;
      // Moving a punch or audio-cue slider off the show's ends turns its checkbox on (manual pp. 204, 206).
      if ((action.which === 'punchIn' && f > 0) || (action.which === 'punchOut' && f < LAST_FRAME)) sim.checks.autoPunch = true;
      if (action.which === 'audioCue') sim.checks.audioCue = f > 0;
      if (sim.mode === 'stop' && action.which === 'start') sim.frame = f;
      return null;
    }
    case 'play-selection':
      if (sim.selection.to <= sim.selection.from) return null;
      sim.start = sim.selection.from;
      sim.stop = Math.max(sim.selection.from, sim.selection.to - 1);
      sim.checks.loop = Boolean(action.loop);
      if (sim.mode === 'stop') sim.frame = sim.start;
      return null;
    case 'full-show':
      sim.start = 0;
      sim.stop = LAST_FRAME;
      return null;
    case 'set-frame':
      if (sim.mode !== 'stop') return note('Stop the show first.');
      sim.frame = action.frame === 'last' ? LAST_FRAME : clampFrame(action.frame);
      return null;
    case 'show-window':
      if (action.name in sim.windows) sim.windows[action.name] = true;
      return null;

    // ---- Soft Console (manual pp. 116-118) ----
    case 'set-command': {
      const axis = Number.isInteger(action.axis) ? action.axis : sim.axis;
      if (!Number.isInteger(action.value) || action.value < 0 || action.value > 255 || axis < 0 || axis >= AXIS_COUNT) return null;
      sim.console[axis] = action.value;
      if (axis !== sim.axis) selectAxis(axis);
      sim.command = action.value;
      return null;
    }
    case 'bump':
      sim.bump = action.on ? action.axis : null;
      return null;
    case 'console-digital':
      sim.consoleDigital = { ...sim.consoleDigital, [action.id]: Boolean(action.down) };
      return null;
    case 'console-rev':
      sim.consoleRev[action.axis] = Boolean(action.on);
      return null;
    case 'pc-note':
      return note(action.text);
    case 'set-manual':
      sim.checks.manual = Boolean(action.on);
      return null;

    // ---- trainer tools ----
    case 'run-measure':
      if (sim.measuring) stopMeasure(); else startMeasure();
      return null;
    case 'reset-measure':
      stopMeasure();
      sim.measured = 0;
      return null;
    case 'select-laptop-ip':
      if (['192.168.0.20', '192.168.1.20', '192.168.0.10'].includes(action.ip)) sim.laptopIp = action.ip;
      return null;
    case 'set-calibration':
      if ([10, 20, 40].includes(action.cm)) sim.calibrationCm = action.cm;
      return null;

    // ---- terminal ----
    case 'term-key':
      state.terminal = terminalKey(state.terminal, action.key);
      return null;
    case 'term-axis':
      if (Number.isInteger(action.axis) && action.axis >= 0 && action.axis < AXIS_COUNT) state.terminal = { ...state.terminal, axis: action.axis };
      return null;
    case 'term-button':
      state.terminal = terminalButton(state.terminal, action.name);
      return null;
    case 'term-reset':
      state.terminal = initialTerminal();
      return null;

    // handbook
    case 'handbook-toggle':
      state.handbook.open = !state.handbook.open;
      return null;
    case 'handbook-close':
      state.handbook.open = false;
      return null;
    case 'search':
      state.handbook.query = action.query;
      state.handbook.result = search(searchIndex, action.query);
      state.handbook.entryId = null;
      return state.handbook.result;
    case 'open-entry':
      state.handbook.entryId = action.id;
      if (action.id) state.handbook.open = true;
      return null;
    case 'open-link':
      api.links.open(action.url);
      return null;

    // dialogs & persistence
    case 'open-photo': state.dialogs.photo = action.file; return null;
    case 'close-photo': state.dialogs.photo = null; return null;
    case 'dismiss-migration': state.migratedInfo = null; return null;
    // Rosie guards Restart (brief §15); Use simple confirmation is the plain alternative.
    case 'restart-request':
      guard = createRestartGuard({ now: () => performance.now(), unlockMs: guardUnlockMs, completed: state.training.completed, restarts: state.training.restarts, lastActivityAt: state.training.lastActivityAt });
      guard.open();
      state.guardSimple = Boolean(state.prefs.simpleConfirm);
      state.dialogs.restart = true;
      syncGuard();
      return null;
    case 'restart-cancel':
      if (guardClearTimer) { clearTimeout(guardClearTimer); guardClearTimer = 0; }
      if (guard) guard.close();
      guard = null;
      state.dialogs.restart = false;
      state.guard = null;
      return null;
    case 'guard-tickle':
      if (guard && guard.tickle()) {
        syncGuard();
        if (guardClearTimer) clearTimeout(guardClearTimer);
        // She moves aside first; the five seconds start once the button is exposed.
        guardClearTimer = setTimeout(() => { guardClearTimer = 0; dispatch({ type: 'guard-cleared' }); }, reducedMotion() ? 0 : 700);
      }
      return null;
    case 'guard-cleared':
      if (guard) { guard.cleared(); syncGuard(); }
      return null;
    case 'guard-tick':
      if (guard) { guard.tick(); syncGuard(); }
      return null;
    case 'guard-blur':
      if (guardClearTimer) { clearTimeout(guardClearTimer); guardClearTimer = 0; }
      if (guard) { guard.blur(); syncGuard(); }
      return null;
    case 'guard-simple':
      state.guardSimple = true;
      reduce({ type: 'prefs-set', prefs: { simpleConfirm: true } });
      return null;
    case 'guard-activate': {
      if (!state.dialogs.restart || restarting) return null;
      if (state.guardSimple) { restart(); return null; }
      const r = guard ? guard.activate() : { ok: false };
      syncGuard();
      if (r.ok) restart();
      return r;
    }
    case 'restart-confirm':
      return reduce({ type: 'guard-activate' });
    case 'retry-save':
      saveNow();
      return null;
    case 'retry-load':
      loadProgress().catch((error) => { state.persistence.readFailed = true; state.persistence.error = String(error && error.message ? error.message : error); }).then(render);
      return null;

    // the orientation film
    case 'intro-skip':
      ui.intro.stop();
      finishIntro();
      return null;
    case 'intro-done':
      ui.intro.stop();
      ui.audio.music.done();
      finishIntro();
      return null;
    case 'intro-replay':
      leaveLesson();
      state.view = 'intro';
      queueMicrotask(() => { ui.intro.start(); render(); });
      return null;
    case 'intro-pause':
      ui.intro.pause();
      return null;
    case 'intro-resume':
      ui.intro.resume();
      return null;
    case 'sound-enable':
      // From the orientation film's own control, or from a lesson film's sound settings.
      (state.view === 'intro'
        ? ui.intro.soundEnabled()
        : ui.audio.enable().then((st) => { if (st === 'ready' && filmPlayer && !filmPlayer.status().paused) ui.audio.music.bed(); })
      ).then(render);
      return null;
    case 'film-rosie':
      state.intro.rosie = { expression: action.rosie.expression || state.intro.rosie.expression, line: action.rosie.line ?? null };
      return null;
    case 'prefs-set':
      mergePrefs(action.prefs);
      api.prefs.save(state.prefs);
      return null;
    // A slider mid-drag: the engine follows at once; nothing is saved and nothing is rebuilt.
    case 'prefs-preview':
      mergePrefs(action.prefs);
      return null;

    // Rosie's welcome
    case 'welcome-open':
      state.guide.open = true;
      state.guide.step = 0;
      return null;
    case 'welcome-next':
      if (state.guide.step + 1 >= WELCOME.length) return reduce({ type: 'welcome-done' });
      state.guide.step += 1;
      return null;
    case 'welcome-done':
      state.guide.open = false;
      state.guide.welcomed = true;
      return null;
    default:
      return null;
  }
}

function mergePrefs(v) {
  state.prefs = { ...state.prefs, ...v, volumes: { ...state.prefs.volumes, ...(v.volumes || {}) }, muted: { ...state.prefs.muted, ...(v.muted || {}) } };
  ui.audio.setPrefs(state.prefs);
}

// The film is over or skipped: the hub, with its primary action focused.
function finishIntro() {
  state.intro.shown = true;
  state.intro.rosie = { expression: 'wave', line: null };
  state.guide.welcomed = true;
  state.guide.open = false;
  state.view = 'home';
  state.hubVisits += 1;
  queueMicrotask(() => document.querySelector('[data-control="continue-training"]:not(:disabled), [data-control="start-training"]')?.focus({ preventScroll: true }));
}

// A confirmed restart: the old run is snapshotted by the main process, the
// active run starts fresh (preferences, the film, and the restart history
// kept), and the first lesson opens.
async function restart() {
  if (restarting) return;
  restarting = true;
  try {
    stopPlayback();
    stopMeasure();
    cancelDemo();
    if (guardClearTimer) { clearTimeout(guardClearTimer); guardClearTimer = 0; }
    if (guard) guard.close();
    guard = null;
    const keepPath = state.persistence.path;
    const keep = { prefs: state.prefs, intro: state.intro, restarts: state.training.restarts };
    const reset = await api.progress.reset();
    if (!reset || !reset.ok) {
      state.persistence.error = `restart failed: ${reset && reset.error ? reset.error : 'unknown'}`;
      state.dialogs.restart = false;
      state.guard = null;
      render();
      return;
    }
    state = freshState();
    state.persistence.path = keepPath;
    state.persistence.loaded = true;
    state.prefs = keep.prefs;
    state.intro = { ...keep.intro };
    state.training = emptyTraining({ restarts: { count: keep.restarts.count + 1, lastAt: new Date().toISOString() } });
    state.guide.welcomed = true;
    lessonRun = null;
    reduce({ type: 'start-lesson', id: COURSE.lessons[0] });
    render();
    await saveNow();
  } finally {
    restarting = false;
  }
}

const PERSIST = new Set([
  'go-home', 'choose-level', 'open-level', 'start-lesson', 'begin-here', 'explore', 'go-progress', 'resume',
  'step-next', 'step-back', 'step-check', 'step-answer', 'lesson-reset', 'dismiss-migration',
  'select-channel', 'select-name', 'select-axis', 'set-digital', 'draw-digital-done', 'set-analog-value', 'set-command',
  'select-laptop-ip', 'term-key', 'stop', 'play', 'welcome-done', 'intro-done', 'intro-skip', 'start-training', 'continue-training', 'open-course',
]);

// Actions that change nothing on screen (a slider mid-drag) skip the rebuild, so the control being dragged survives.
const QUIET = new Set(['prefs-preview']);

export function dispatch(action) {
  const result = reduce(action);
  const effective = result && result.as ? result.as : action;
  afterAction(action, effective);
  if (!QUIET.has(action.type)) render();
  if (PERSIST.has(action.type)) scheduleSave();
  return result && result.as ? null : result;
}

// ---------- rendering ----------
const ui = {};
const dom = {};

function findControl(id) {
  return document.querySelector(`[data-target="${id}"]`) || document.querySelector(`.desk [data-control="${id}"]`) || document.querySelector(`[data-control="${id}"]`);
}

function clearTargets(except = null) {
  document.querySelectorAll('.is-target').forEach((n) => { if (n !== except) n.classList.remove('is-target'); });
}

function highlight(controls) {
  clearTargets();
  if (highlightTimer) clearTimeout(highlightTimer);
  for (const id of controls) {
    const target = findControl(id);
    if (target) target.classList.add('is-target');
  }
  const first = document.querySelector('.is-target');
  if (first) first.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  highlightTimer = setTimeout(() => { highlightTimer = null; render(); }, 4000);
}

function renderHighlight() {
  if (highlightTimer) return;
  if (state.view !== 'lesson' || !lessonRun) { clearTargets(); return; }
  const target = lessonRun.current().step.target;
  const node = target ? findControl(target) : null;
  clearTargets(node);
  if (node && !node.classList.contains('is-target')) {
    node.classList.add('is-target');
    node.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
}

function renderNotice() {
  const box = dom.notice;
  const p = state.persistence;
  if (p.readFailed) {
    replace(box,
      el('span', { text: `Your saved training could not be read (${p.error || 'unknown error'}). Nothing has been changed, and nothing will be saved over it until it can be read.` }),
      el('button', { type: 'button', text: 'Try reading again', onclick: () => dispatch({ type: 'retry-load' }) }));
    box.hidden = false;
  } else if (p.error) {
    replace(box,
      el('span', { text: `Progress could not be saved (${p.error}). Your work stays in memory while this app is open; nothing was marked complete on disk.` }),
      el('button', { type: 'button', text: 'Try saving again', onclick: () => dispatch({ type: 'retry-save' }) }));
    box.hidden = false;
  } else if (p.recovered) {
    replace(box,
      el('span', { text: `Your saved progress file could not be read (${p.recovered.reason}), so it was moved aside to ${p.recovered.quarantinedPath} and learning starts fresh. Nothing was marked complete.` }),
      el('button', { type: 'button', text: 'Dismiss', onclick: () => { state.persistence.recovered = null; render(); } }));
    box.hidden = false;
  } else {
    box.hidden = true;
  }
}

function renderExplorePanel() {
  replace(dom.panel,
    el('div', { class: 'back-row' }, el('button', { type: 'button', class: 'btn btn-small', 'data-fid': 'back', text: state.level ? 'Lessons' : 'Home', onclick: () => dispatch({ type: state.level ? 'open-level' : 'go-home' }) })),
    el('h2', { text: 'All the windows' }),
    el('div', { id: 'guide-dock', class: 'guide-dock', 'aria-hidden': 'true' }));
}

function revealedParts() {
  if (state.view === 'explore') return [...WORKSPACE_PARTS];
  return state.view === 'lesson' && lessonRun ? lessonRun.revealed() : [];
}

// The workspace alone, for playback and measurement ticks: the lesson panel is
// not rebuilt 30 times a second, so its buttons stay clickable.
function renderTick() {
  if (STAGE_VIEWS.includes(state.view) || state.view === 'intro') return;
  state.sim.outputs = computeOutputs(state.sim);
  const revealed = revealedParts();
  ui.pcmacs.update(state, revealed);
  dom.terminal.hidden = !(revealed.includes('terminal') || state.sim.windows.terminal);
  ui.terminal.update(state, revealed);
  ui.float.update(state, revealed);
  ui.robot.update({ sim: state.sim, revealed });
}

function render() {
  const isIntro = state.view === 'intro';
  const onStage = STAGE_VIEWS.includes(state.view);
  dom.stage.hidden = !onStage || isIntro;
  dom.panel.hidden = onStage || isIntro;
  dom.desk.hidden = onStage || isIntro;
  // The film covers the window, and the guarded restart dialog stands over it: the page
  // behind either is inert (set here, on every render, so a rebuild never frees it).
  dom.film.hidden = !isIntro;
  const restartOpen = Boolean(state.dialogs.restart && (state.guard || state.guardSimple));
  dom.header.inert = isIntro || restartOpen;
  dom.main.inert = isIntro || restartOpen;
  dom.notice.inert = restartOpen;
  if (isIntro) ui.intro.update(state);
  dom.handbook.hidden = !state.handbook.open;
  dom.handbookToggle.setAttribute('aria-pressed', String(state.handbook.open));
  dom.navHome.setAttribute('aria-pressed', String(state.view === 'home'));
  dom.navProgress.setAttribute('aria-pressed', String(state.view === 'progress'));
  dom.stage.dataset.view = state.view;

  if (state.view === 'home') ui.hub.update(state);
  if (state.view === 'course') ui.course.update(state);
  if (state.view === 'level') ui.level.update(state);
  if (state.view === 'progress') ui.progress.update(state);
  if (state.view === 'lesson') ui.lesson.update(state, lessonRun, { audioState: ui.audio.state() });
  if (state.view === 'explore') renderExplorePanel();
  renderTick();

  if (state.handbook.open) ui.handbook.update(state);
  ui.dialogs.update(state);
  ui.restartDialog.update(state);
  ui.rosieHelp.update(state);
  renderNotice();
  renderHighlight();
  // Rosie goes last, once the screen she is anchored to is in place.
  ui.guide.update(guidePlan({ state, run: lessonRun }));
}

// ---------- boot ----------
async function boot() {
  dom.stage = document.getElementById('stage');
  dom.panel = document.getElementById('panel');
  dom.desk = document.getElementById('desk');
  dom.handbook = document.getElementById('handbook');
  dom.handbookToggle = document.getElementById('handbook-toggle');
  dom.navHome = document.getElementById('nav-home');
  dom.navProgress = document.getElementById('nav-progress');
  dom.notice = document.getElementById('persistence-notice');
  dom.film = document.getElementById('film');
  dom.header = document.querySelector('header.identity');
  dom.main = document.getElementById('shell');
  dom.terminal = el('div', { id: 'terminal', class: 'terminal', 'data-part': 'terminal' });

  // In smoke mode nothing may reach the speakers: silent stand-ins for the speech engine and the audio context.
  if (SMOKE) silentAudio = createSilentBackend();
  ui.audio = createAudio(SMOKE ? { prefs: state.prefs, speech: silentAudio.speech, AudioContextCtor: silentAudio.AudioContextCtor, UtteranceCtor: silentAudio.UtteranceCtor } : { prefs: state.prefs });
  ui.intro = mountIntro(dom.film, { dispatch, audio: ui.audio });
  state.view = 'intro';

  ui.help = mountHelp({
    onOpenEntry: (id) => dispatch({ type: 'open-entry', id }),
    onOpenPhoto: (file) => dispatch({ type: 'open-photo', file }),
    onOpen: ({ id, name }) => dispatch({ type: 'help-open', id, name }),
  });
  ui.pcmacs = mountPcmacs(document.getElementById('pcmacs'), { dispatch, terminalHost: dom.terminal });
  ui.cinema = mountCinema({ findControl, pcmacs: ui.pcmacs, dispatch, onTarget: (id) => { if (state.cinema.playing) { state.cinema.target = id; ui.guide.update(guidePlan({ state, run: lessonRun })); } } });
  ui.rosieHelp = mountRosieHelp({ dispatch });
  ui.terminal = mountTerminal(dom.terminal, { dispatch });
  ui.float = mountFloatPanel(document.getElementById('float'), { dispatch });
  ui.robot = mountRobotPreview(document.getElementById('robot'), { THREE });
  ui.hub = mountHub(dom.stage, { dispatch });
  ui.course = mountCourse(dom.stage, { dispatch });
  ui.level = mountLevel(dom.stage, { dispatch });
  ui.progress = mountProgress(dom.stage, { dispatch });
  ui.lesson = mountLesson(dom.panel, { dispatch });
  ui.handbook = mountHandbook(dom.handbook, { dispatch });
  ui.dialogs = mountDialogs({ dispatch });
  ui.restartDialog = mountRestartDialog({ dispatch });
  ui.guide = mountGuideLayer({ dispatch, findControl, THREE, audio: ui.audio });

  dom.navHome.addEventListener('click', () => dispatch({ type: 'go-home' }));
  dom.navProgress.addEventListener('click', () => dispatch({ type: 'go-progress' }));
  dom.handbookToggle.addEventListener('click', () => dispatch({ type: 'handbook-toggle' }));
  window.addEventListener('beforeunload', () => { if (saveTimer && !state.persistence.readFailed) { clearTimeout(saveTimer); api.progress.save(toProgressDoc()); } });

  render();

  try {
    const info = await api.app.info();
    state.persistence.path = info.progressPath;
    const prefs = await api.prefs.load();
    if (prefs && prefs.ok && prefs.value) { state.prefs = prefs.value; ui.audio.setPrefs(state.prefs); }
    await loadProgress();
  } catch (error) {
    state.persistence.readFailed = true;
    state.persistence.error = String(error && error.message ? error.message : error);
  }
  state.guide.open = false;
  state.persistence.loaded = true;
  // The film brings the sound up itself; a Skip>> pressed while the file was still loading must not leave it off.
  if (state.view === 'intro') ui.intro.start();
  else ui.audio.enable().then(render);
  render();
  ready = true;
}

// Read the progress file. A file that cannot be read (locked, unreadable, a
// failed migration backup) is reported and never written over; a malformed
// one was already moved aside by the main process and is reported as recovered.
async function loadProgress() {
  const loaded = await api.progress.load();
  state.persistence.readFailed = !loaded.ok;
  state.persistence.error = loaded.ok ? null : loaded.error;
  if (loaded.recovered) state.persistence.recovered = loaded.recovered;
  if (loaded.migrated) state.persistence.migrated = loaded.migrated;
  if (loaded.ok && loaded.value) applyProgress(loaded.value);
}

if (SMOKE) {
  window.roseflowDebug = {
    ready: () => ready,
    getState: () => JSON.parse(JSON.stringify(state)),
    dispatch,
    stepInfo: () => {
      if (!lessonRun) return null;
      const c = lessonRun.current();
      return { lessonId: lessonRun.lesson.id, index: c.index, total: c.total, id: c.step.id, kind: c.step.kind, target: c.step.target, done: c.done, canAdvance: c.canAdvance, isLast: c.isLast, revealed: lessonRun.revealed(), beat: state.lesson.beat, demoFinished: state.lesson.demo.finished };
    },
    runDemo: () => showMe(),
    openHelp: (id) => ui.help.open(id),
    closeHelp: () => ui.help.close(),
    setSearch: (q) => { if (!state.handbook.open) dispatch({ type: 'handbook-toggle' }); dispatch({ type: 'search', query: q }); },
    flushSave: () => saveNow(),
    guide: () => ui.guide.debug(),
    guideVisible: (on) => ui.guide.setVisible(on),
    guideReduced: (force) => ui.guide.setReduced(force),
    intro: () => ui.intro.debug(),
    introSeek: (i) => ui.intro.seek(i),
    audio: () => ({ state: ui.audio.state(), music: ui.audio.music.status(), spoken: silentAudio ? [...silentAudio.spoken] : [], oscillators: silentAudio ? silentAudio.oscillators() : 0 }),
    audioBlock: (on) => ui.audio.debugBlock(on),
    guardUnlockMs: (ms) => { guardUnlockMs = ms; },
    filmScale: (s) => { filmScale = s; },
    cinema: () => ({ ...ui.cinema.debug(), ...state.cinema, player: filmPlayer ? filmPlayer.status() : null }),
    robot: () => ui.robot.debug(),
    faceSheet: () => faceSheet().toDataURL('image/png'),
    rosieSheet: () => { const c = rosieSheet(THREE); return c ? c.toDataURL('image/png') : null; },
    guideOverride: (o) => ui.guide.setOverride(o),
  };
}

boot();

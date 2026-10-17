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
import { initialTerminal, terminalKey, terminalButton } from './logic/terminal.mjs';
import {
  FPS, FRAME_COUNT, LAST_FRAME, ANALOG_CHANNELS, DIGITAL_CHANNELS, CHANNEL_IDS, AXIS_COUNT,
  approachStep, percentOf, digitalFromIntervals, intervalsOf, setDigitalRange, setAnalogRange,
  defaultAnalogs, encodeRuns, decodeRuns, secondsToFrame, clampFrame,
} from './logic/simulation.mjs';
import { computeOutputs } from './logic/outputs.mjs';
import { buildIndex, search } from './logic/search.mjs';
import { DEFAULT_SETTINGS, SCHEMA_VERSION, APP_ID } from '../shared/progress-schema.mjs';
import { mountHelp } from './ui/help.mjs';
import { mountPcmacs } from './ui/pcmacs.mjs';
import { mountTerminal } from './ui/terminal.mjs';
import { mountFloatPanel } from './ui/float-panel.mjs';
import { mountHome } from './ui/home.mjs';
import { mountLevel, nextLessonFor } from './ui/level.mjs';
import { mountLesson } from './ui/lesson.mjs';
import { mountHandbook } from './ui/handbook.mjs';
import { mountProgress } from './ui/progress.mjs';
import { mountDialogs } from './ui/dialogs.mjs';
import { el, replace } from './ui/dom.mjs';

const api = window.roseflow;
const SMOKE = new URLSearchParams(location.search).get('smoke') === '1';
const searchIndex = buildIndex(HANDBOOK_ENTRIES, ALIAS_GROUPS);
const STAGE_VIEWS = ['home', 'level', 'progress'];
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
  };
  sim.outputs = computeOutputs(sim);
  return sim;
}

function freshLesson() {
  return { id: null, stepIndex: 0, feedback: null, lastChoice: null, demo: { running: false, note: '' }, justFinished: null };
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
    persistence: { recovered: null, error: null, savedAt: null, path: '', loaded: false, migrated: null },
    migratedInfo: null,
    saved: null,
    dialogs: { confirm: false, photo: null },
  };
}

let state = freshState();
let lessonRun = null;
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
  if (sim.mode !== 'pause') sim.frame = sim.start;
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
  if (state.level && LEVEL_BY_ID[state.level].lessons.includes(lessonId)) return state.level;
  const found = LEVELS.find((l) => l.lessons.includes(lessonId));
  return found ? found.id : state.level;
}

function applySetup(actions) {
  for (const action of actions) reduce(action);
}

// Show me must leave the learner's show data as it found it.
function snapshotShow() {
  const sim = state.sim;
  return {
    lights: Object.fromEntries(Object.entries(sim.lights).map(([id, f]) => [id, [...f]])),
    analogs: sim.analogs.map((a) => [...a]),
    console: [...sim.console],
    command: sim.command,
    axis: sim.axis,
    selection: { ...sim.selection, channels: [...sim.selection.channels] },
  };
}

function restoreShow(snap) {
  Object.assign(state.sim, snap);
}

function cancelDemo() {
  demoToken += 1;
  if (state.lesson.demo.running) {
    stopPlayback();
    stopMeasure();
    if (demoSnapshot) restoreShow(demoSnapshot);
  }
  demoSnapshot = null;
  state.lesson.demo = { running: false, note: '' };
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
}

// Setup actions that change only modes and views, never the learner's show
// data. Restoring saved progress replays these so a step's text stays true.
const SAFE_SETUP = new Set(['set-manual', 'term-reset', 'term-axis', 'term-key', 'full-show', 'select-axis', 'select-channel', 'select-range', 'reset-measure', 'set-calibration', 'select-laptop-ip', 'stop']);

function enterStep({ setup }) {
  const c = lessonRun.current();
  state.lesson.stepIndex = c.index;
  state.lesson.feedback = null;
  state.lesson.lastChoice = null;
  state.lesson.demo = { running: false, note: '' };
  state.sim.note = '';
  if (!setup || c.step.kind !== 'practice' || c.done) return;
  applySetup(setup === 'safe' ? c.step.practice.setup.filter((a) => SAFE_SETUP.has(a.type)) : c.step.practice.setup);
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
  if (result.ok) recordLegacy(c.step);
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

async function runDemo() {
  if (!lessonRun || state.view !== 'lesson') return;
  const c = lessonRun.current();
  const demo = c.step.demo;
  if (!demo || state.lesson.demo.running) return;
  const token = ++demoToken;
  demoSnapshot = snapshotShow();
  state.lesson.demo = { running: true, note: demo.intro };
  render();
  for (const a of demo.actions) {
    if (token !== demoToken) return;
    if (Number.isInteger(a.wait)) { await sleep(a.wait); continue; }
    reduce(a);
    render();
  }
  if (token !== demoToken) return;
  stopPlayback();
  restoreShow(demoSnapshot);
  demoSnapshot = null;
  state.lesson.demo = { running: false, note: demo.outro || 'Demonstration finished. Now you try.' };
  const now = lessonRun.current();
  if (now.step === c.step && now.step.kind === 'practice' && !now.done) applySetup(now.step.practice.setup);
  render();
}

// ---------- persistence ----------
function toProgressDoc() {
  const sim = state.sim;
  const runs = sim.analogs.map(encodeRuns);
  return {
    schemaVersion: SCHEMA_VERSION,
    app: APP_ID,
    savedAt: null,
    location: { view: state.view, level: state.level, lessonId: state.lesson.id, stepIndex: state.lesson.stepIndex },
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
  state.level = doc.location.level;
  state.saved = { ...doc.location };
  if (doc.location.lessonId && LESSONS_BY_ID[doc.location.lessonId]) loadLesson(doc.location.lessonId, doc.location.stepIndex, { setup: 'safe' });
  else { lessonRun = null; state.lesson = freshLesson(); }
  // The app always opens on the level choice; Continue takes the learner back.
  state.view = 'home';
}

async function saveNow() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = null;
  if (!state.persistence.loaded) return { ok: false, error: 'not-ready' };
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
  switch (action.type) {
    // navigation
    case 'go-home':
      state.view = 'home';
      return null;
    case 'choose-level':
      if (!LEVEL_BY_ID[action.level]) return null;
      state.level = action.level;
      state.lesson.justFinished = null;
      state.view = 'level';
      return null;
    case 'open-level':
      state.view = state.level ? 'level' : 'home';
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
      state.view = 'explore';
      return null;
    case 'go-progress':
      state.view = 'progress';
      return null;
    case 'resume': {
      const s = state.saved;
      if (s && s.lessonId && lessonRun && lessonRun.lesson.id === s.lessonId) { state.level = levelContaining(s.lessonId); state.view = 'lesson'; }
      else if (s && s.level && LEVEL_BY_ID[s.level]) { state.level = s.level; state.view = 'level'; }
      else state.view = 'home';
      return null;
    }

    // lesson steps
    case 'step-next': {
      if (!lessonRun) return null;
      const r = lessonRun.next();
      if (r.event === 'advanced') { syncLesson(); enterStep({ setup: true }); }
      if (r.event === 'finished') {
        syncLesson();
        state.lesson.justFinished = lessonRun.lesson.id;
        state.lesson.feedback = null;
        state.view = 'level';
        resetTransport();
        stopMeasure();
      }
      if (r.event === 'blocked') state.lesson.feedback = { ok: false, message: 'Finish this step first: complete the practice or answer the question.' };
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
      syncLesson();
      return r;
    }
    case 'demo-start':
      runDemo();
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
    case 'restart-request':
      state.dialogs.confirm = true;
      return null;
    case 'restart-cancel':
      state.dialogs.confirm = false;
      return null;
    case 'restart-confirm':
      restart();
      return null;
    case 'retry-save':
      saveNow();
      return null;
    default:
      return null;
  }
}

async function restart() {
  stopPlayback();
  stopMeasure();
  cancelDemo();
  const keepPath = state.persistence.path;
  state = freshState();
  state.persistence.path = keepPath;
  state.persistence.loaded = true;
  lessonRun = null;
  await api.progress.reset();
  render();
  await saveNow();
}

const PERSIST = new Set([
  'go-home', 'choose-level', 'open-level', 'start-lesson', 'begin-here', 'explore', 'go-progress', 'resume',
  'step-next', 'step-back', 'step-check', 'step-answer', 'lesson-reset', 'dismiss-migration',
  'select-channel', 'select-name', 'select-axis', 'set-digital', 'draw-digital-done', 'set-analog-value', 'set-command',
  'select-laptop-ip', 'term-key', 'stop', 'play',
]);

export function dispatch(action) {
  const result = reduce(action);
  const effective = result && result.as ? result.as : action;
  afterAction(action, effective);
  render();
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
  if (p.error) {
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
    el('p', { class: 'explore-note', text: 'The recreated PC•MACs windows, the Terminal, and the simulated float, with no lesson running. Hover or Tab to any control for a short note, press F1 or use Help ? then click a control for the full help, or open the Handbook.' }),
    el('p', { class: 'muted', text: 'Nothing here connects to a controller or sends a command.' }));
}

function revealedParts() {
  if (state.view === 'explore') return [...WORKSPACE_PARTS];
  return state.view === 'lesson' && lessonRun ? lessonRun.revealed() : [];
}

// The workspace alone, for playback and measurement ticks: the lesson panel is
// not rebuilt 30 times a second, so its buttons stay clickable.
function renderTick() {
  if (STAGE_VIEWS.includes(state.view)) return;
  state.sim.outputs = computeOutputs(state.sim);
  const revealed = revealedParts();
  ui.pcmacs.update(state, revealed);
  dom.terminal.hidden = !(revealed.includes('terminal') || state.sim.windows.terminal);
  ui.terminal.update(state, revealed);
  ui.float.update(state, revealed);
}

function render() {
  const onStage = STAGE_VIEWS.includes(state.view);
  dom.stage.hidden = !onStage;
  dom.panel.hidden = onStage;
  dom.desk.hidden = onStage;
  dom.handbook.hidden = !state.handbook.open;
  dom.handbookToggle.setAttribute('aria-pressed', String(state.handbook.open));
  dom.navHome.setAttribute('aria-pressed', String(state.view === 'home'));
  dom.navProgress.setAttribute('aria-pressed', String(state.view === 'progress'));

  if (state.view === 'home') ui.home.update(state);
  if (state.view === 'level') ui.level.update(state);
  if (state.view === 'progress') ui.progress.update(state);
  if (state.view === 'lesson') ui.lesson.update(state, lessonRun);
  if (state.view === 'explore') renderExplorePanel();
  renderTick();

  if (state.handbook.open) ui.handbook.update(state);
  ui.dialogs.update(state);
  renderNotice();
  renderHighlight();
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
  dom.terminal = el('div', { id: 'terminal', class: 'terminal', 'data-part': 'terminal' });

  ui.help = mountHelp({
    onOpenEntry: (id) => dispatch({ type: 'open-entry', id }),
    onOpenPhoto: (file) => dispatch({ type: 'open-photo', file }),
    onOpen: ({ id, name }) => dispatch({ type: 'help-open', id, name }),
  });
  ui.pcmacs = mountPcmacs(document.getElementById('pcmacs'), { dispatch, terminalHost: dom.terminal });
  ui.terminal = mountTerminal(dom.terminal, { dispatch });
  ui.float = mountFloatPanel(document.getElementById('float'), { dispatch });
  ui.home = mountHome(dom.stage, { dispatch });
  ui.level = mountLevel(dom.stage, { dispatch });
  ui.progress = mountProgress(dom.stage, { dispatch });
  ui.lesson = mountLesson(dom.panel, { dispatch });
  ui.handbook = mountHandbook(dom.handbook, { dispatch });
  ui.dialogs = mountDialogs({ dispatch });

  dom.navHome.addEventListener('click', () => dispatch({ type: 'go-home' }));
  dom.navProgress.addEventListener('click', () => dispatch({ type: 'go-progress' }));
  dom.handbookToggle.addEventListener('click', () => dispatch({ type: 'handbook-toggle' }));
  window.addEventListener('beforeunload', () => { if (saveTimer) { clearTimeout(saveTimer); api.progress.save(toProgressDoc()); } });

  render();

  try {
    const info = await api.app.info();
    state.persistence.path = info.progressPath;
    const loaded = await api.progress.load();
    if (!loaded.ok) state.persistence.error = loaded.error;
    if (loaded.recovered) state.persistence.recovered = loaded.recovered;
    if (loaded.migrated) state.persistence.migrated = loaded.migrated;
    if (loaded.ok && loaded.value) applyProgress(loaded.value);
  } catch (error) {
    state.persistence.error = String(error && error.message ? error.message : error);
  }
  state.persistence.loaded = true;
  render();
  ready = true;
}

if (SMOKE) {
  window.roseflowDebug = {
    ready: () => ready,
    getState: () => JSON.parse(JSON.stringify(state)),
    dispatch,
    stepInfo: () => {
      if (!lessonRun) return null;
      const c = lessonRun.current();
      return { lessonId: lessonRun.lesson.id, index: c.index, total: c.total, id: c.step.id, kind: c.step.kind, target: c.step.target, done: c.done, canAdvance: c.canAdvance, isLast: c.isLast, revealed: lessonRun.revealed() };
    },
    runDemo: () => runDemo(),
    openHelp: (id) => ui.help.open(id),
    closeHelp: () => ui.help.close(),
    setSearch: (q) => { if (!state.handbook.open) dispatch({ type: 'handbook-toggle' }); dispatch({ type: 'search', query: q }); },
    flushSave: () => saveNow(),
  };
}

boot();

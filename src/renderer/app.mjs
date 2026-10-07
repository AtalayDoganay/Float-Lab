// Renderer controller: owns the state, the two simulation timers, guided-step
// validation, persistence through the preload API, and the UI modules.
import { LESSONS } from './content/curriculum.mjs';
import { EXERCISES } from './content/exercises.mjs';
import { HANDBOOK_ENTRIES, ALIAS_GROUPS } from './content/handbook.mjs';
import { createCourse } from './logic/course.mjs';
import { createGuidedRun } from './logic/guided.mjs';
import { initialTerminal, terminalKey, terminalButton } from './logic/terminal.mjs';
import { playbackStep, approachStep, percentOf, DEFAULT_BLOCKS, BLOCK_COUNT, DIGITAL_CHANNELS } from './logic/simulation.mjs';
import { buildIndex, search } from './logic/search.mjs';
import { createEmptyProgress, DEFAULT_LOCATION, DEFAULT_SETTINGS, SCHEMA_VERSION, APP_ID } from '../shared/progress-schema.mjs';
import { mountHelp } from './ui/help.mjs';
import { mountWorkspace } from './ui/workspace.mjs';
import { mountTerminal } from './ui/terminal.mjs';
import { mountLessons } from './ui/lessons.mjs';
import { mountGuided } from './ui/guided.mjs';
import { mountHandbook } from './ui/handbook.mjs';
import { mountProgress } from './ui/progress.mjs';
import { mountDialogs } from './ui/dialogs.mjs';
import { el, replace } from './ui/dom.mjs';

const api = window.roseflow;
const SMOKE = new URLSearchParams(location.search).get('smoke') === '1';
const course = createCourse(LESSONS);
const searchIndex = buildIndex(HANDBOOK_ENTRIES, ALIAS_GROUPS);

// Which learner actions automatically check the current guided step.
const TARGET_ACTIONS = {
  'channel-select': ['select-channel'],
  'timeline-block': ['toggle-block'],
  play: ['play'],
  stop: ['stop', 'playback-complete'],
  'axis-select': ['select-axis'],
  'command-slider': ['set-command'],
  'measure-run': ['run-measure'],
  'laptop-ip-select': ['select-laptop-ip'],
};

function freshSim() {
  return {
    channelId: DEFAULT_SETTINGS.channelId,
    blocksByChannel: { 'light-1': [...DEFAULT_BLOCKS], 'light-2': new Array(BLOCK_COUNT).fill(false) },
    playing: false, tick: 0, lampOn: false, playLabel: 'Ready to play',
    axis: DEFAULT_SETTINGS.axis, command: DEFAULT_SETTINGS.command,
    measured: 0, measuring: false,
    laptopIp: DEFAULT_SETTINGS.laptopIp, calibrationCm: 20,
  };
}

function freshState() {
  return {
    view: 'lessons',
    panelOpen: true,
    course: course.initialState(),
    lessonUi: { feedback: '', feedbackKind: '', lastChoice: null, lastCorrect: null, checkpoint: false },
    sim: freshSim(),
    terminal: initialTerminal(),
    guided: { exerciseId: null, stepIndex: 0, completedSteps: [], completedExercises: [], feedback: null, showWhy: true },
    demos: { signalOn: false, level: 128, flowPart: 0, setting: 'range', clue: null },
    handbook: { query: '', result: null, entryId: null },
    persistence: { recovered: null, error: null, savedAt: null, path: '', loaded: false },
    dialogs: { start: false, confirm: false, photo: null },
  };
}

let state = freshState();
let guidedRun = null;
let pendingProgress = null;
let playTimer = null;
let measureTimer = null;
let saveTimer = null;
let highlightTimer = null;
let ready = false;

// ---------- timers ----------
function stopPlayback(label = 'Stopped') {
  if (playTimer) clearInterval(playTimer);
  playTimer = null;
  state.sim.playing = false;
  state.sim.tick = 0;
  state.sim.lampOn = false;
  state.sim.playLabel = label;
}

function startPlayback() {
  stopPlayback();
  state.sim.playing = true;
  let t = 0;
  const tick = () => {
    const step = playbackStep(t, state.sim.blocksByChannel[state.sim.channelId]);
    if (step.done) {
      stopPlayback('Sequence complete');
      afterAction({ type: 'playback-complete' });
      render();
      scheduleSave();
      return;
    }
    state.sim.tick = t;
    state.sim.lampOn = step.on;
    state.sim.playLabel = step.label;
    t += 1;
    render();
  };
  tick();
  playTimer = setInterval(tick, 1000);
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
    const target = percentOf(state.sim.command);
    const next = approachStep(state.sim.measured, target);
    if (next !== state.sim.measured) {
      state.sim.measured = next;
      render();
    }
  }, 60);
}

// ---------- guided ----------
function syncGuided() {
  if (!guidedRun) return;
  const p = guidedRun.progress();
  state.guided.stepIndex = p.index;
  const prefix = `${guidedRun.exercise.id}:`;
  const others = state.guided.completedSteps.filter((k) => !k.startsWith(prefix));
  state.guided.completedSteps = [...others, ...p.completed.map((id) => `${prefix}${id}`)];
}

function loadExercise(id, stepIndex = 0) {
  const exercise = EXERCISES.find((e) => e.id === id);
  if (!exercise) { guidedRun = null; state.guided.exerciseId = null; state.guided.feedback = null; return; }
  const prefix = `${id}:`;
  guidedRun = createGuidedRun(exercise, {
    stepIndex,
    completedSteps: state.guided.completedSteps.filter((k) => k.startsWith(prefix)).map((k) => k.slice(prefix.length)),
  });
  state.guided.exerciseId = id;
  state.guided.feedback = null;
  state.guided.showWhy = true;
  syncGuided();
}

// Exercise validators see the selected channel's blocks as `sim.blocks`.
function simForGuided() {
  return { ...state.sim, blocks: state.sim.blocksByChannel[state.sim.channelId] };
}

function guidedValidate(ctx) {
  if (!guidedRun) return null;
  const result = guidedRun.validate({ ...ctx, sim: simForGuided() });
  state.guided.feedback = { ok: result.ok, message: result.message };
  if (result.finished && !state.guided.completedExercises.includes(guidedRun.exercise.id)) {
    state.guided.completedExercises = [...state.guided.completedExercises, guidedRun.exercise.id];
  }
  syncGuided();
  return result;
}

function afterAction(action) {
  if (!guidedRun) return;
  const step = guidedRun.current().step;
  if (step.question) return;
  const triggers = TARGET_ACTIONS[step.target] || [];
  if (triggers.includes(action.type)) guidedValidate({ sim: state.sim, action, answer: null });
}

// ---------- persistence ----------
function toProgressDoc() {
  const current = course.current(state.course);
  return {
    schemaVersion: SCHEMA_VERSION,
    app: APP_ID,
    savedAt: null,
    location: {
      view: state.view,
      lessonId: current.lesson.id,
      questionIndex: state.course.questionIndex,
      exerciseId: state.guided.exerciseId,
      stepIndex: state.guided.stepIndex,
    },
    course: {
      completedLessons: [...state.course.completedLessons],
      missedLessons: [...state.course.missedLessons],
      answered: [...state.course.answered],
    },
    guided: { completedSteps: [...state.guided.completedSteps], completedExercises: [...state.guided.completedExercises] },
    settings: {
      channelId: state.sim.channelId,
      blocks: [...state.sim.blocksByChannel['light-1']],
      axis: state.sim.axis,
      command: state.sim.command,
      laptopIp: state.sim.laptopIp,
    },
  };
}

function applyProgress(doc) {
  stopPlayback('Ready to play');
  stopMeasure();
  state.course = course.fromSaved({ lessonId: doc.location.lessonId, questionIndex: doc.location.questionIndex, ...doc.course });
  state.view = doc.location.view;
  state.sim = freshSim();
  state.sim.channelId = DIGITAL_CHANNELS.some((c) => c.id === doc.settings.channelId) ? doc.settings.channelId : 'light-1';
  state.sim.blocksByChannel['light-1'] = [...doc.settings.blocks];
  state.sim.axis = doc.settings.axis;
  state.sim.command = doc.settings.command;
  state.sim.laptopIp = doc.settings.laptopIp;
  state.terminal = { ...initialTerminal(), axis: doc.settings.axis };
  state.guided.completedSteps = [...doc.guided.completedSteps];
  state.guided.completedExercises = [...doc.guided.completedExercises];
  if (doc.location.exerciseId) loadExercise(doc.location.exerciseId, doc.location.stepIndex);
  else { guidedRun = null; state.guided.exerciseId = null; }
  state.lessonUi = { feedback: '', feedbackKind: '', lastChoice: null, lastCorrect: null, checkpoint: false };
}

function hasProgress(doc) {
  return doc.course.answered.length > 0 || doc.course.completedLessons.length > 0 || doc.guided.completedSteps.length > 0
    || doc.location.lessonId !== DEFAULT_LOCATION.lessonId || doc.location.questionIndex !== 0 || doc.location.exerciseId !== null
    || doc.location.view !== DEFAULT_LOCATION.view;
}

async function saveNow() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = null;
  if (!state.persistence.loaded || pendingProgress) return { ok: false, error: 'not-ready' };
  const result = await api.progress.save(toProgressDoc());
  if (result.ok) { state.persistence.savedAt = result.savedAt; state.persistence.error = null; }
  else state.persistence.error = result.error;
  render();
  return result;
}

function scheduleSave() {
  if (!state.persistence.loaded || pendingProgress) return;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => { saveNow(); }, 300);
}

// ---------- reducer ----------
function reduce(action) {
  const { sim } = state;
  switch (action.type) {
    case 'view':
      state.view = action.view;
      return null;
    case 'toggle-panel':
      state.panelOpen = !state.panelOpen;
      return null;
    case 'highlight':
      highlight(action.controls);
      return null;

    // lessons
    case 'answer': {
      const r = course.answer(state.course, action.choice);
      state.course = r.state;
      state.lessonUi.feedback = r.feedback;
      state.lessonUi.feedbackKind = r.correct ? 'ok' : 'bad';
      state.lessonUi.lastChoice = action.choice;
      state.lessonUi.lastCorrect = r.correct;
      return { correct: r.correct, feedback: r.feedback };
    }
    case 'next': {
      const r = course.next(state.course);
      state.course = r.state;
      if (r.event !== 'blocked') { state.lessonUi.feedback = ''; state.lessonUi.feedbackKind = ''; state.lessonUi.lastChoice = null; }
      if (r.event === 'checkpoint') state.lessonUi.checkpoint = true;
      if (r.event === 'next-lesson') stopPlayback('Ready to play');
      return r.event;
    }
    case 'prev':
      if (state.course.lessonIndex > 0) return reduce({ type: 'open-lesson', index: state.course.lessonIndex - 1 });
      return null;
    case 'open-lesson':
      state.course = course.open(state.course, action.index);
      state.lessonUi = { feedback: '', feedbackKind: '', lastChoice: null, lastCorrect: null, checkpoint: false };
      state.view = 'lessons';
      stopPlayback('Ready to play');
      stopMeasure();
      return null;
    case 'open-lesson-by-id':
      return reduce({ type: 'open-lesson', index: Math.max(0, LESSONS.findIndex((l) => l.id === action.id)) });

    // workspace
    case 'select-channel':
      if (DIGITAL_CHANNELS.some((c) => c.id === action.id)) { sim.channelId = action.id; stopPlayback('Ready to play'); }
      return null;
    case 'toggle-block': {
      const channelId = action.channelId || sim.channelId;
      if (channelId !== sim.channelId) { sim.channelId = channelId; stopPlayback('Ready to play'); }
      const blocks = sim.blocksByChannel[channelId];
      if (action.index >= 0 && action.index < BLOCK_COUNT) blocks[action.index] = !blocks[action.index];
      return null;
    }
    case 'play':
      startPlayback();
      return null;
    case 'stop':
      stopPlayback('Stopped');
      return null;
    case 'select-axis':
      if (Number.isInteger(action.axis) && action.axis >= 0 && action.axis < 4) { sim.axis = action.axis; state.terminal = { ...state.terminal, axis: action.axis }; }
      return null;
    case 'set-command':
      if (Number.isInteger(action.value) && action.value >= 0 && action.value <= 255) sim.command = action.value;
      return null;
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

    // terminal
    case 'term-key': {
      const before = state.terminal.axis;
      state.terminal = terminalKey(state.terminal, action.key);
      if (state.terminal.axis !== before) { sim.axis = state.terminal.axis; return { as: { type: 'select-axis' } }; }
      return null;
    }
    case 'term-button':
      state.terminal = terminalButton(state.terminal, action.name);
      return null;

    // guided
    case 'start-exercise':
      loadExercise(action.id, 0);
      if (action.id && action.switchView) state.view = 'practice';
      return null;
    case 'guided-check':
      guidedValidate({ sim, action: { type: 'check' }, answer: null });
      return state.guided.feedback;
    case 'guided-answer':
      guidedValidate({ sim, action: null, answer: action.answer });
      return state.guided.feedback;
    case 'guided-back':
      if (guidedRun) { guidedRun.back(); state.guided.feedback = null; syncGuided(); }
      return null;
    case 'guided-explain':
      state.guided.showWhy = !state.guided.showWhy;
      return null;
    case 'guided-reset':
      if (guidedRun) {
        guidedRun.reset();
        state.guided.feedback = null;
        state.guided.completedExercises = state.guided.completedExercises.filter((id) => id !== guidedRun.exercise.id);
        syncGuided();
      }
      return null;

    // lesson demos
    case 'signal-toggle': state.demos.signalOn = !state.demos.signalOn; return null;
    case 'set-level': state.demos.level = action.value; return null;
    case 'flow-part': state.demos.flowPart = action.index; return null;
    case 'set-setting': state.demos.setting = action.key; return null;
    case 'clue': state.demos.clue = action.key; return null;

    // handbook
    case 'search':
      state.handbook.query = action.query;
      state.handbook.result = search(searchIndex, action.query);
      state.handbook.entryId = null;
      return state.handbook.result;
    case 'open-entry':
      state.handbook.entryId = action.id;
      if (action.id) state.view = 'handbook';
      return null;
    case 'open-link':
      api.links.open(action.url);
      return null;

    // dialogs & persistence
    case 'open-photo': state.dialogs.photo = action.file; return null;
    case 'close-photo': state.dialogs.photo = null; return null;
    case 'resume':
      if (pendingProgress) { applyProgress(pendingProgress); pendingProgress = null; }
      state.dialogs.start = false;
      return null;
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
  stopPlayback('Ready to play');
  stopMeasure();
  const keepPath = state.persistence.path;
  state = freshState();
  state.persistence.path = keepPath;
  state.persistence.loaded = true;
  guidedRun = null;
  pendingProgress = null;
  await api.progress.reset();
  render();
  await saveNow();
}

const PERSIST = new Set(['answer', 'next', 'prev', 'open-lesson', 'open-lesson-by-id', 'view', 'select-channel', 'toggle-block', 'select-axis', 'set-command', 'select-laptop-ip', 'term-key', 'start-exercise', 'guided-check', 'guided-answer', 'guided-back', 'guided-reset', 'resume', 'stop', 'play']);

export function dispatch(action) {
  const result = reduce(action);
  const effective = result && result.as ? result.as : action;
  afterAction(effective);
  render();
  if (PERSIST.has(action.type)) scheduleSave();
  return result && result.as ? null : result;
}

// ---------- rendering ----------
const ui = {};

function highlight(controls) {
  document.querySelectorAll('.is-target').forEach((n) => n.classList.remove('is-target'));
  if (highlightTimer) clearTimeout(highlightTimer);
  for (const id of controls) {
    const target = document.querySelector(`[data-target="${id}"]`) || document.querySelector(`.desk [data-control="${id}"]`) || document.querySelector(`[data-control="${id}"]`);
    if (target) target.classList.add('is-target');
  }
  const first = document.querySelector('.is-target');
  if (first) first.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  highlightTimer = setTimeout(() => { if (!guidedRun) document.querySelectorAll('.is-target').forEach((n) => n.classList.remove('is-target')); }, 4000);
}

function renderGuidedHighlight() {
  if (!guidedRun || state.view !== 'practice') {
    if (!highlightTimer) document.querySelectorAll('.is-target').forEach((n) => n.classList.remove('is-target'));
    return;
  }
  const target = guidedRun.current().step.target;
  const node = document.querySelector(`[data-target="${target}"]`) || document.querySelector(`.desk [data-control="${target}"]`) || document.querySelector(`[data-control="${target}"]`);
  document.querySelectorAll('.is-target').forEach((n) => { if (n !== node) n.classList.remove('is-target'); });
  if (node && !node.classList.contains('is-target')) node.classList.add('is-target');
}

function renderNotice() {
  const box = document.getElementById('persistence-notice');
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

function render() {
  document.getElementById('shell').classList.toggle('panel-hidden', !state.panelOpen);
  const toggle = document.getElementById('panel-toggle');
  toggle.textContent = state.panelOpen ? 'Hide panel' : 'Show panel';
  toggle.setAttribute('aria-pressed', String(state.panelOpen));
  for (const btn of document.querySelectorAll('#tabs button')) btn.setAttribute('aria-pressed', String(btn.dataset.view === state.view));
  for (const view of ['lessons', 'practice', 'handbook', 'progress']) document.getElementById(`view-${view}`).hidden = view !== state.view;
  ui.workspace.update(state);
  ui.terminal.update(state);
  if (state.view === 'lessons') ui.lessons.update(state);
  if (state.view === 'practice') ui.guided.update(state);
  if (state.view === 'handbook') ui.handbook.update(state);
  if (state.view === 'progress') ui.progress.update(state);
  ui.dialogs.update(state);
  renderNotice();
  renderGuidedHighlight();
}

// ---------- boot ----------
async function boot() {
  ui.help = mountHelp({
    onOpenEntry: (id) => dispatch({ type: 'open-entry', id }),
    onOpenPhoto: (file) => dispatch({ type: 'open-photo', file }),
  });
  ui.workspace = mountWorkspace(document.getElementById('workspace'), { dispatch });
  ui.terminal = mountTerminal(document.getElementById('terminal'), { dispatch });
  ui.lessons = mountLessons(document.getElementById('view-lessons'), { dispatch, course });
  ui.guided = mountGuided(document.getElementById('view-practice'), { dispatch });
  ui.handbook = mountHandbook(document.getElementById('view-handbook'), { dispatch });
  ui.progress = mountProgress(document.getElementById('view-progress'), { dispatch, course });
  ui.dialogs = mountDialogs({ dispatch });

  document.getElementById('tabs').addEventListener('click', (e) => {
    const btn = e.target instanceof Element ? e.target.closest('button[data-view]') : null;
    if (btn) dispatch({ type: 'view', view: btn.dataset.view });
  });
  document.getElementById('panel-toggle').addEventListener('click', () => dispatch({ type: 'toggle-panel' }));
  window.addEventListener('beforeunload', () => { if (saveTimer) { clearTimeout(saveTimer); api.progress.save(toProgressDoc()); } });

  render();

  try {
    const info = await api.app.info();
    state.persistence.path = info.progressPath;
    const loaded = await api.progress.load();
    if (!loaded.ok) state.persistence.error = loaded.error;
    if (loaded.recovered) state.persistence.recovered = loaded.recovered;
    if (loaded.ok && loaded.value) {
      if (hasProgress(loaded.value)) { pendingProgress = loaded.value; state.dialogs.start = true; }
      else applyProgress(loaded.value);
    }
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
    openHelp: (id) => ui.help.open(id),
    closeHelp: () => ui.help.close(),
    setSearch: (q) => { dispatch({ type: 'view', view: 'handbook' }); dispatch({ type: 'search', query: q }); },
    flushSave: () => saveNow(),
  };
}

boot();

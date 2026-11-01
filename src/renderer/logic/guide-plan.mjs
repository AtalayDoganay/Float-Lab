// What Rosie does on each screen, as pure data: which scene she is in, what
// she is anchored to, her expression, and her words. The guide layer turns
// this into a position and a bubble; the panels keep their own buttons. The
// `key` changes only when something she shows changes, so the thirty
// playback ticks a second never move her or make her talk.
import { WELCOME, LINES } from '../content/mascot.mjs';
import { LEVEL_BY_ID, LESSONS_BY_ID } from '../content/levels.mjs';
import { nextCourseLesson, courseComplete } from '../content/course.mjs';
import { expressionFor, bubbleText } from './step-beats.mjs';
import { lessonStatus, nextLessonFor } from './level-status.mjs';
import { hubState } from './hub-state.mjs';

const CENTER = Object.freeze({ kind: 'center' });
const DOCK = Object.freeze({ kind: 'dock' });
const CORNER = Object.freeze({ kind: 'corner' });
const NONE = Object.freeze({ kind: 'none' });
const control = (id) => ({ kind: 'control', id });

const hubOf = (state) => hubState({
  persistence: state.persistence, training: state.training, learning: state.learning, saved: state.saved,
  current: state.lesson.id ? { lessonId: state.lesson.id, stepIndex: state.lesson.stepIndex } : null,
});
const primaryActionId = (state) => (hubOf(state).continueEnabled ? 'continue-training' : 'start-training');
// On the hub she has a dock of her own beside the actions, so she never covers them.
const HUB_DOCK = Object.freeze({ kind: 'dock', id: 'hub-rosie-dock' });

function welcomePlan(state) {
  const step = Math.min(Math.max(state.guide.step, 0), WELCOME.length - 1);
  const beat = WELCOME[step];
  const last = step === WELCOME.length - 1;
  return {
    scene: 'welcome',
    anchor: last ? control(primaryActionId(state)) : CENTER,
    expression: beat.expression,
    lines: [beat.text],
    welcome: { step, total: WELCOME.length, button: beat.button, last, skip: 'Skip' },
  };
}

// The hub: she stands beside the enabled action and says where things stand.
function homePlan(state) {
  const h = hubOf(state);
  let line;
  let expression = 'wave';
  if (h.kind === 'unreadable') line = LINES.hubUnreadable();
  else if (h.kind === 'completed') { line = LINES.hubDone(); expression = 'cheer'; }
  else if (h.checkpoint && h.checkpoint.legacy) line = LINES.hubLegacy({ lessonTitle: h.checkpoint.title });
  else if (h.checkpoint) line = LINES.hubReturning({ lessonTitle: h.checkpoint.title, stepIndex: h.checkpoint.stepIndex, stepTotal: LESSONS_BY_ID[h.checkpoint.lessonId].steps.length });
  else line = LINES.hubFirst();
  return { scene: 'home', anchor: HUB_DOCK, expression, lines: [line] };
}

function coursePlan(state) {
  const next = nextCourseLesson(state.learning);
  const done = courseComplete(state.learning);
  const finished = state.lesson.justFinished ? LESSONS_BY_ID[state.lesson.justFinished] : null;
  const lines = [];
  if (finished) lines.push(LINES.finished({ title: finished.title, nextTitle: done ? null : next.title }));
  if (done) lines.push(LINES.courseDone());
  else if (!finished) lines.push(lessonStatus(next, state.learning).started ? LINES.courseResume() : LINES.courseBegin());
  return { scene: 'course', anchor: control('course-begin'), expression: finished || done ? 'cheer' : 'point', lines };
}

function levelPlan(state) {
  const level = LEVEL_BY_ID[state.level];
  if (!level) return null;
  const next = nextLessonFor(level.id, state.learning);
  const nextStatus = lessonStatus(next, state.learning);
  const allDone = level.lessons.every((id) => lessonStatus(LESSONS_BY_ID[id], state.learning).finished);
  const finished = state.lesson.justFinished ? LESSONS_BY_ID[state.lesson.justFinished] : null;
  const lines = [];
  if (finished) lines.push(LINES.finished({ title: finished.title, nextTitle: allDone ? null : next.title }));
  if (allDone) lines.push(LINES.levelDone({ levelName: level.name }));
  else if (!finished) lines.push(nextStatus.started ? LINES.pickUp() : LINES.beginHere());
  return { scene: 'level', anchor: control('begin-here'), expression: finished || allDone ? 'cheer' : 'point', lines };
}

function lessonPlan(state, run) {
  const c = run.current();
  const ctx = { step: c.step, beat: state.lesson.beat, done: c.done, feedback: state.lesson.feedback, demo: state.lesson.demo, isLast: c.isLast };
  const text = bubbleText(ctx);
  const cinema = state.cinema || { playing: false };
  // The help label shows throughout practice, never during a demonstration.
  const help = c.step.kind === 'practice' && !c.done && state.lesson.beat === 'try' && !state.lesson.demo.running;
  if (cinema.playing) {
    // During a film she performs: she follows the cue's target and says her own lines.
    const r = cinema.rosie || {};
    return {
      scene: 'lesson',
      anchor: cinema.target ? control(cinema.target) : (c.step.target ? control(c.step.target) : DOCK),
      expression: r.expression || 'happy',
      glasses: Boolean(r.glasses),
      title: null,
      lines: r.line ? [r.line] : [],
      feedbackOk: null,
      help: false,
    };
  }
  return {
    scene: 'lesson',
    anchor: c.step.target ? control(c.step.target) : DOCK,
    expression: state.help && state.help.open ? 'reassuring' : expressionFor(ctx),
    title: text.title,
    lines: text.lines,
    feedbackOk: state.lesson.feedback ? Boolean(state.lesson.feedback.ok) : null,
    help,
  };
}

// During the orientation film she stands at the film's dock and follows its cues.
function introPlan(state) {
  const r = state.intro.rosie || {};
  return { scene: 'intro', anchor: { kind: 'dock', id: 'film-rosie-dock' }, expression: r.expression || 'wave', lines: r.line ? [r.line] : [] };
}

const explorePlan = () => ({ scene: 'explore', anchor: DOCK, expression: 'happy', title: 'All the windows', lines: [LINES.explore(), LINES.exploreHelp()] });
const progressPlan = () => ({ scene: 'progress', anchor: CORNER, expression: 'happy', lines: [LINES.progress()] });
const nonePlan = () => ({ scene: 'none', anchor: NONE, expression: 'happy', lines: [] });

// Guarding Restart: in front of the button while guarded or tickling, beside it once revealed.
function guardPlan(state) {
  const g = state.guard;
  const covering = g.phase === 'guarded' || g.phase === 'tickling';
  const expression = g.phase === 'tickling' ? 'tickled' : (g.phase === 'unlocked' ? 'happy' : 'point');
  return { scene: 'guard', anchor: covering ? { kind: 'cover', id: 'restart-training' } : control('restart-training'), expression, lines: [g.line.text] };
}

export function guidePlan({ state, run }) {
  let p = null;
  if (state.dialogs && state.dialogs.restart && state.guard && !state.guardSimple) p = guardPlan(state);
  else if (state.view === 'intro') p = introPlan(state);
  else if (state.guide.open) p = welcomePlan(state);
  else if (state.view === 'home') p = homePlan(state);
  else if (state.view === 'course') p = coursePlan(state);
  else if (state.view === 'level') p = levelPlan(state);
  else if (state.view === 'lesson') p = run ? lessonPlan(state, run) : null;
  else if (state.view === 'explore') p = explorePlan();
  else if (state.view === 'progress') p = progressPlan();
  p = { title: null, feedbackOk: null, welcome: null, help: false, glasses: false, ...(p || nonePlan()) };
  p.key = [p.scene, p.anchor.kind, p.anchor.id || '', p.expression, p.title || '', p.feedbackOk, p.help, p.glasses, ...p.lines].join('\u0001');
  return p;
}

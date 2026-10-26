// What Rosie does on each screen, as pure data: which scene she is in, what
// she is anchored to, her expression, and her words. The guide layer turns
// this into a position and a bubble; the panels keep their own buttons. The
// `key` changes only when something she shows changes, so the thirty
// playback ticks a second never move her or make her talk.
import { WELCOME, LINES } from '../content/mascot.mjs';
import { LEVELS, LEVEL_BY_ID, LESSONS_BY_ID } from '../content/levels.mjs';
import { expressionFor, bubbleText } from './step-beats.mjs';
import { lessonStatus, nextLessonFor } from './level-status.mjs';

const CENTER = Object.freeze({ kind: 'center' });
const DOCK = Object.freeze({ kind: 'dock' });
const CORNER = Object.freeze({ kind: 'corner' });
const NONE = Object.freeze({ kind: 'none' });
const control = (id) => ({ kind: 'control', id });

// Where Continue leads: the current lesson or level this session, else the
// saved place. `back` is true when nothing has moved since the file was read.
export function homeWhere(state) {
  const saved = state.saved && (state.saved.level || state.saved.lessonId) ? state.saved : null;
  const current = state.lesson.id
    ? { level: state.level, lessonId: state.lesson.id, stepIndex: state.lesson.stepIndex }
    : (state.level ? { level: state.level, lessonId: null, stepIndex: 0 } : null);
  if (!current && !saved) return null;
  const same = saved && current && current.level === saved.level && current.lessonId === saved.lessonId && current.stepIndex === saved.stepIndex;
  return { ...(current || saved), back: Boolean(saved) && (!current || same) };
}

function homeLine(w) {
  if (!w) return LINES.homeFirst();
  const level = LEVELS.find((l) => l.id === w.level);
  const levelName = level ? level.name : 'your level';
  const lesson = w.lessonId ? LESSONS_BY_ID[w.lessonId] : null;
  if (!lesson) return w.back ? LINES.homeReturningLevel({ levelName }) : LINES.homeCurrentLevel({ levelName });
  const args = { levelName, lessonTitle: lesson.title, stepIndex: Math.min(w.stepIndex, lesson.steps.length - 1), stepTotal: lesson.steps.length };
  return w.back ? LINES.homeReturning(args) : LINES.homeCurrent(args);
}

const primaryActionId = (state) => (homeWhere(state) ? 'resume' : 'start-learning');

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

function homePlan(state) {
  return { scene: 'home', anchor: control(primaryActionId(state)), expression: 'wave', lines: [homeLine(homeWhere(state))] };
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
  return {
    scene: 'lesson',
    anchor: c.step.target ? control(c.step.target) : DOCK,
    expression: expressionFor(ctx),
    title: text.title,
    lines: text.lines,
    feedbackOk: state.lesson.feedback ? Boolean(state.lesson.feedback.ok) : null,
  };
}

const explorePlan = () => ({ scene: 'explore', anchor: DOCK, expression: 'happy', title: 'All the windows', lines: [LINES.explore(), LINES.exploreHelp()] });
const progressPlan = () => ({ scene: 'progress', anchor: CORNER, expression: 'happy', lines: [LINES.progress()] });
const nonePlan = () => ({ scene: 'none', anchor: NONE, expression: 'happy', lines: [] });

export function guidePlan({ state, run }) {
  let p = null;
  if (state.guide.open) p = welcomePlan(state);
  else if (state.view === 'home') p = homePlan(state);
  else if (state.view === 'level') p = levelPlan(state);
  else if (state.view === 'lesson') p = run ? lessonPlan(state, run) : null;
  else if (state.view === 'explore') p = explorePlan();
  else if (state.view === 'progress') p = progressPlan();
  p = { title: null, feedbackOk: null, welcome: null, ...(p || nonePlan()) };
  p.key = [p.scene, p.anchor.kind, p.anchor.id || '', p.expression, p.title || '', p.feedbackOk, ...p.lines].join('\u0001');
  return p;
}

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { guidePlan } from '../src/renderer/logic/guide-plan.mjs';
import { lessonStatus, nextLessonFor } from '../src/renderer/logic/level-status.mjs';
import { LEVEL_BY_ID, LESSONS_BY_ID, stepKey } from '../src/renderer/content/levels.mjs';
import { WELCOME, LINES } from '../src/renderer/content/mascot.mjs';
import { expressionFor, bubbleText } from '../src/renderer/logic/step-beats.mjs';
import { emptyTraining } from '../src/shared/progress-schema.mjs';

const basic = LEVEL_BY_ID.basic;
const first = LESSONS_BY_ID[basic.lessons[0]];
const idle = { running: false, finished: false, note: '' };

function state(over = {}) {
  return {
    view: 'home',
    level: null,
    lesson: { id: null, stepIndex: 0, beat: 'look', feedback: null, lastChoice: null, demo: idle, justFinished: null },
    learning: { completedSteps: [], completedLessons: [], missedLessons: [] },
    sim: { frame: 0, mode: 'stop' },
    saved: null,
    guide: { welcomed: true, open: false, step: 0 },
    persistence: { loaded: true, error: null, recovered: null },
    training: emptyTraining(),
    intro: { shown: true, rosie: { expression: 'wave', line: null } },
    ...over,
  };
}

const explainStep = { id: 'menus', kind: 'explain', title: 'The menu bar', explain: 'Every PC•MACs command is in the menu bar.', target: 'menu-realtime', demo: null };
const plainStep = { id: 'show', kind: 'explain', title: 'The show', explain: 'The show is the script.', target: null, demo: null };
const practiceStep = {
  id: 'p', kind: 'practice', title: 'Light 1 ON', explain: 'Select, then set ON.', target: 'digital-pane', demo: null,
  practice: { instruction: 'Select Light 1 from 5 s to 6 s.', success: 'Light 1 is ON from 5 s to 6 s only.', triggers: ['set-digital'], setup: [], validate: () => ({ ok: true, message: '' }) },
};
const run = (step, extra = {}) => ({ lesson: { id: 'b-interface', title: 'What you are looking at', steps: [step] }, current: () => ({ step, done: false, index: 0, total: 1, isLast: false, ...extra }) });

test('the welcome puts her at the centre, then at the primary action on the last beat', () => {
  const p = guidePlan({ state: state({ guide: { welcomed: false, open: true, step: 0 } }), run: null });
  assert.equal(p.scene, 'welcome');
  assert.deepEqual(p.anchor, { kind: 'center' });
  assert.equal(p.expression, WELCOME[0].expression);
  assert.deepEqual(p.lines, [WELCOME[0].text]);
  assert.deepEqual(p.welcome, { step: 0, total: 3, button: 'Next', last: false, skip: 'Skip' });
  const last = guidePlan({ state: state({ guide: { welcomed: false, open: true, step: 2 } }), run: null });
  assert.deepEqual(last.anchor, { kind: 'control', id: 'start-training' });
  assert.equal(last.welcome.button, 'Let’s go');
  assert.equal(last.welcome.last, true);
  const mid = guidePlan({ state: state({ level: 'basic', lesson: { id: first.id, stepIndex: 0, beat: 'look', feedback: null, demo: idle, justFinished: null }, guide: { welcomed: true, open: true, step: 2 } }), run: null });
  assert.deepEqual(mid.anchor, { kind: 'control', id: 'continue-training' });
});

test('the film docks her at the film and gives her its cues', () => {
  const p = guidePlan({ state: state({ view: 'intro', intro: { shown: false, rosie: { expression: 'point', line: 'Ready?' } } }), run: null });
  assert.equal(p.scene, 'intro');
  assert.deepEqual(p.anchor, { kind: 'dock', id: 'film-rosie-dock' });
  assert.equal(p.expression, 'point');
  assert.deepEqual(p.lines, ['Ready?']);
});

test('the hub anchors her to Start or Continue and says where the learner is', () => {
  const fresh = guidePlan({ state: state(), run: null });
  assert.equal(fresh.scene, 'home');
  assert.deepEqual(fresh.anchor, { kind: 'dock', id: 'hub-rosie-dock' }, 'she has her own place beside the actions, never over them');
  assert.equal(fresh.expression, 'wave');
  assert.deepEqual(fresh.lines, [LINES.hubFirst()]);

  const legacy = state({ level: 'basic', saved: { view: 'lesson', level: 'basic', lessonId: first.id, stepIndex: 1 } });
  const returning = guidePlan({ state: legacy, run: null });
  assert.deepEqual(returning.lines, [LINES.hubLegacy({ lessonTitle: first.title })]);

  const course = state({ training: { ...emptyTraining(), checkpoint: { lessonId: 's1-orientation', stepIndex: 1 }, lastActivityAt: '2026-10-31T10:00:00.000Z' } });
  const c = guidePlan({ state: course, run: null });
  assert.deepEqual(c.lines, [LINES.hubReturning({ lessonTitle: 'Meet the PC•MACs screen', stepIndex: 1, stepTotal: LESSONS_BY_ID['s1-orientation'].steps.length })]);

  const done = guidePlan({ state: state({ training: { ...emptyTraining(), completed: true } }), run: null });
  assert.equal(done.expression, 'cheer');
  assert.deepEqual(done.lines, [LINES.hubDone()]);

  const unreadable = guidePlan({ state: state({ persistence: { loaded: true, error: null, recovered: { reason: 'invalid-json', quarantinedPath: 'x' } } }), run: null });
  assert.deepEqual(unreadable.lines, [LINES.hubUnreadable()]);
});

test('the course map anchors her to Begin and cheers a finished lesson or the whole segment', () => {
  const p = guidePlan({ state: state({ view: 'course', level: 'course' }), run: null });
  assert.equal(p.scene, 'course');
  assert.deepEqual(p.anchor, { kind: 'control', id: 'course-begin' });
  assert.equal(p.expression, 'point');
  assert.deepEqual(p.lines, [LINES.courseBegin()]);
  const started = state({ view: 'course', level: 'course', learning: { completedSteps: [stepKey('s1-orientation', 'workspace')], completedLessons: [], missedLessons: [] } });
  assert.deepEqual(guidePlan({ state: started, run: null }).lines, [LINES.courseResume()]);
  const all = state({ view: 'course', level: 'course', learning: { completedSteps: [], completedLessons: ['s1-orientation', 's1-digital-vs-analog', 's1-one-second-on'], missedLessons: [] } });
  const a = guidePlan({ state: all, run: null });
  assert.equal(a.expression, 'cheer');
  assert.deepEqual(a.lines, [LINES.courseDone()]);
});

test('the level map anchors her to Begin and cheers a finished lesson or level', () => {
  const s = state({ view: 'level', level: 'basic' });
  const p = guidePlan({ state: s, run: null });
  assert.equal(p.scene, 'level');
  assert.deepEqual(p.anchor, { kind: 'control', id: 'begin-here' });
  assert.equal(p.expression, 'point');
  assert.deepEqual(p.lines, [LINES.beginHere()]);

  const started = state({ view: 'level', level: 'basic', learning: { completedSteps: [stepKey(first.id, first.steps[0].id)], completedLessons: [], missedLessons: [] } });
  assert.deepEqual(guidePlan({ state: started, run: null }).lines, [LINES.pickUp()]);
  assert.equal(lessonStatus(first, started.learning).started, true);
  assert.equal(nextLessonFor('basic', started.learning).id, first.id);

  const finished = state({ view: 'level', level: 'basic', lesson: { id: first.id, stepIndex: 0, beat: 'look', feedback: null, demo: idle, justFinished: first.id }, learning: { completedSteps: [], completedLessons: [first.id], missedLessons: [] } });
  const f = guidePlan({ state: finished, run: null });
  assert.equal(f.expression, 'cheer');
  const second = LESSONS_BY_ID[basic.lessons[1]];
  assert.ok(f.lines[0].includes(first.title) && f.lines[0].includes(second.title), f.lines[0]);

  const all = state({ view: 'level', level: 'basic', learning: { completedSteps: [], completedLessons: [...basic.lessons], missedLessons: [] } });
  const a = guidePlan({ state: all, run: null });
  assert.equal(a.expression, 'cheer');
  assert.deepEqual(a.lines, [LINES.levelDone({ levelName: basic.name })]);
});

test('a lesson step anchors her to its target and carries the beat’s words', () => {
  const s = state({ view: 'lesson', level: 'basic', lesson: { id: 'b-interface', stepIndex: 0, beat: 'look', feedback: null, demo: idle, justFinished: null } });
  const p = guidePlan({ state: s, run: run(explainStep) });
  assert.equal(p.scene, 'lesson');
  assert.deepEqual(p.anchor, { kind: 'control', id: 'menu-realtime' });
  const ctx = { step: explainStep, beat: 'look', done: false, feedback: null, demo: idle, isLast: false };
  assert.equal(p.expression, expressionFor(ctx));
  assert.equal(p.title, bubbleText(ctx).title);
  assert.deepEqual(p.lines, bubbleText(ctx).lines);
  assert.equal(p.feedbackOk, null);

  const miss = state({ view: 'lesson', level: 'basic', lesson: { id: 'b-interface', stepIndex: 0, beat: 'try', feedback: { ok: false, message: 'Not yet.' }, demo: idle, justFinished: null } });
  const m = guidePlan({ state: miss, run: run(practiceStep) });
  assert.equal(m.expression, 'oops');
  assert.equal(m.feedbackOk, false);
  assert.deepEqual(m.lines, ['Not yet.', practiceStep.practice.instruction]);

  const d = guidePlan({ state: s, run: run(plainStep) });
  assert.deepEqual(d.anchor, { kind: 'dock' });
});

test('explore docks her and progress sends her to the corner', () => {
  const e = guidePlan({ state: state({ view: 'explore', level: 'basic' }), run: null });
  assert.equal(e.scene, 'explore');
  assert.deepEqual(e.anchor, { kind: 'dock' });
  assert.equal(e.expression, 'happy');
  assert.equal(e.title, 'All the windows');
  assert.deepEqual(e.lines, [LINES.explore(), LINES.exploreHelp()]);
  const p = guidePlan({ state: state({ view: 'progress' }), run: null });
  assert.equal(p.scene, 'progress');
  assert.deepEqual(p.anchor, { kind: 'corner' });
  assert.deepEqual(p.lines, [LINES.progress()]);
  assert.ok(LINES.progress().trim().length > 0 && LINES.exploreHelp().trim().length > 0);
});

test('the plan key ignores playback and changes with the target', () => {
  const s = state({ view: 'lesson', level: 'basic', lesson: { id: 'b-interface', stepIndex: 0, beat: 'look', feedback: null, demo: idle, justFinished: null } });
  const a = guidePlan({ state: s, run: run(explainStep) });
  const b = guidePlan({ state: { ...s, sim: { frame: 57, mode: 'play' } }, run: run(explainStep) });
  assert.equal(a.key, b.key);
  const c = guidePlan({ state: s, run: run({ ...explainStep, target: 'time-ruler' }) });
  assert.notEqual(a.key, c.key);
  assert.equal(typeof a.key, 'string');
});

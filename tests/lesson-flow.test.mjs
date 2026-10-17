import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createLessonRun, legacyKeysFor } from '../src/renderer/logic/lesson-flow.mjs';

// A compact fixture lesson: explain → practice → question → explain.
function fixtureLesson() {
  return {
    id: 'fx',
    title: 'Fixture',
    reveal: ['ruler'],
    steps: [
      { id: 's-intro', kind: 'explain', target: null, reveal: [], title: 'Intro', explain: 'Look around.' },
      {
        id: 's-play', kind: 'practice', target: 'play', reveal: ['transport'], title: 'Press Play', explain: 'Play runs the show.',
        practice: {
          instruction: 'Press Play.',
          triggers: ['play'],
          validate: ({ sim, action }) => (action?.type === 'play' && sim.playing
            ? { ok: true, message: 'Playing.' }
            : { ok: false, message: 'Press Play to run the eight-second sequence.' }),
        },
      },
      {
        id: 's-q', kind: 'question', target: 'time-readout', reveal: [], title: 'How long?', explain: 'The show is eight seconds.',
        questionId: 'l07q1',
        question: { prompt: 'How long is the training show?', options: ['8 s', '80 s', '8 min'], correct: 0, why: 'Eight one-second blocks.', hints: ['', 'Ten times too long.', 'Minutes, not seconds.'] },
      },
      { id: 's-end', kind: 'explain', target: null, reveal: ['digital'], title: 'Done', explain: 'That is all.', exerciseStep: 'schedule-light:sl-watch' },
    ],
  };
}

test('a fresh run starts on step 1 with an accurate count and explain steps can advance at once', () => {
  const run = createLessonRun(fixtureLesson());
  const c = run.current();
  assert.equal(c.index, 0);
  assert.equal(c.total, 4);
  assert.equal(c.step.id, 's-intro');
  assert.equal(c.canAdvance, true, 'an explanation has nothing to check');
  assert.equal(c.done, false, 'not recorded until the learner moves on');
  const r = run.next();
  assert.equal(r.event, 'advanced');
  assert.equal(run.current().index, 1);
  assert.deepEqual(run.progress().completedSteps, ['s-intro']);
});

test('a practice step blocks Next until its check passes, and a failed check explains without advancing', () => {
  const run = createLessonRun(fixtureLesson(), { stepIndex: 1 });
  assert.equal(run.current().canAdvance, false);
  assert.equal(run.next().event, 'blocked');
  const wrong = run.check({ sim: { playing: false }, action: { type: 'stop' } });
  assert.equal(wrong.ok, false);
  assert.match(wrong.message, /Press Play/);
  assert.equal(run.current().index, 1);
  assert.equal(run.current().done, false);

  const right = run.check({ sim: { playing: true }, action: { type: 'play' } });
  assert.equal(right.ok, true);
  assert.equal(run.current().index, 1, 'a passed check does not advance by itself; the learner reads the outcome first');
  assert.equal(run.current().done, true);
  assert.equal(run.current().canAdvance, true);
  assert.equal(run.next().event, 'advanced');
  assert.deepEqual(run.progress().completedSteps, ['s-play']);
});

test('a question step records a wrong try with its hint and passes only on the correct option', () => {
  const run = createLessonRun(fixtureLesson(), { stepIndex: 2 });
  assert.equal(run.current().canAdvance, false);
  const wrong = run.answer(1);
  assert.equal(wrong.ok, false);
  assert.match(wrong.message, /Ten times too long/);
  assert.equal(run.current().done, false);
  assert.throws(() => run.answer(7));
  const right = run.answer(0);
  assert.equal(right.ok, true);
  assert.match(right.message, /Eight one-second blocks/);
  assert.equal(run.current().done, true);
  assert.equal(run.current().canAdvance, true);
  assert.equal(run.progress().missed, true, 'a wrong try is remembered for review');
});

test('check and answer refuse to run on a step of the other kind', () => {
  const run = createLessonRun(fixtureLesson(), { stepIndex: 1 });
  assert.equal(run.answer(0).ok, false);
  const q = createLessonRun(fixtureLesson(), { stepIndex: 2 });
  assert.equal(q.check({ sim: {}, action: null }).ok, false);
});

test('finishing the last step reports the lesson finished only when every step is complete', () => {
  const run = createLessonRun(fixtureLesson(), { stepIndex: 3, completedSteps: ['s-intro', 's-play'] });
  assert.equal(run.current().isLast, true);
  const r = run.next();
  assert.equal(r.event, 'blocked', 'the question step was never answered, so the lesson is not finished');
  assert.deepEqual(r.missingSteps, ['s-q']);
  const complete = createLessonRun(fixtureLesson(), { stepIndex: 3, completedSteps: ['s-intro', 's-play', 's-q'] });
  const done = complete.next();
  assert.equal(done.event, 'finished');
  assert.equal(complete.progress().finished, true);
  assert.deepEqual(complete.progress().completedSteps, ['s-intro', 's-play', 's-q', 's-end']);
});

test('back never goes below the first step and keeps completed steps', () => {
  const run = createLessonRun(fixtureLesson(), { stepIndex: 2, completedSteps: ['s-intro', 's-play'] });
  run.back();
  assert.equal(run.current().index, 1);
  assert.equal(run.current().done, true, 'a completed practice step stays done when revisited');
  run.back();
  run.back();
  assert.equal(run.current().index, 0);
  assert.deepEqual(run.progress().completedSteps, ['s-intro', 's-play']);
});

test('restore clamps the step index and drops unknown step ids', () => {
  const run = createLessonRun(fixtureLesson(), { stepIndex: 99, completedSteps: ['s-intro', 'ghost'] });
  assert.equal(run.current().index, 3);
  assert.deepEqual(run.progress().completedSteps, ['s-intro']);
  const negative = createLessonRun(fixtureLesson(), { stepIndex: -4 });
  assert.equal(negative.current().index, 0);
});

test('revealed workspace parts accumulate through the current step and never shrink on Back', () => {
  const run = createLessonRun(fixtureLesson());
  assert.deepEqual(run.revealed(), ['ruler']);
  run.next();
  assert.deepEqual(run.revealed(), ['ruler', 'transport']);
  run.back();
  assert.deepEqual(run.revealed(), ['ruler', 'transport'], 'going back keeps what the learner has already been shown');
});

test('steps that reuse a classic question or exercise step expose those ids for the legacy records', () => {
  const lesson = fixtureLesson();
  assert.deepEqual(legacyKeysFor(lesson.steps[2]), { questionId: 'l07q1', exerciseStep: null });
  assert.deepEqual(legacyKeysFor(lesson.steps[3]), { questionId: null, exerciseStep: 'schedule-light:sl-watch' });
  assert.deepEqual(legacyKeysFor(lesson.steps[0]), { questionId: null, exerciseStep: null });
});

test('a saved classic record pre-marks the reused steps complete', () => {
  const run = createLessonRun(fixtureLesson(), {
    stepIndex: 0,
    completedSteps: [],
    legacy: { answered: ['l07q1'], exerciseSteps: ['schedule-light:sl-watch'] },
  });
  assert.deepEqual(run.progress().completedSteps, ['s-q', 's-end']);
  const q = createLessonRun(fixtureLesson(), { stepIndex: 2, legacy: { answered: ['l07q1'], exerciseSteps: [] } });
  assert.equal(q.current().done, true);
  assert.equal(q.current().canAdvance, true);
});

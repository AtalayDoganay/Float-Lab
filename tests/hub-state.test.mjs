import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hubState } from '../src/renderer/logic/hub-state.mjs';
import { emptyTraining } from '../src/shared/progress-schema.mjs';

const base = (over = {}) => ({
  persistence: { loaded: true, error: null, recovered: null },
  training: emptyTraining(),
  learning: { completedSteps: [], completedLessons: [], missedLessons: [] },
  saved: null,
  current: null,
  ...over,
});

test('with nothing saved, Start is the only way in and Continue is truly disabled', () => {
  const h = hubState(base());
  assert.equal(h.kind, 'none');
  assert.equal(h.startEnabled, true);
  assert.equal(h.continueEnabled, false);
  assert.equal(h.startLabel, 'Start your training');
  assert.equal(h.continueLabel, 'Continue your training');
  assert.equal(h.explain, 'No saved training yet.');
  assert.equal(h.lastActive, null);
  assert.equal(h.checkpoint, null);
});

test('while the save is loading nothing can be pressed', () => {
  const h = hubState(base({ persistence: { loaded: false, error: null, recovered: null } }));
  assert.equal(h.kind, 'loading');
  assert.equal(h.startEnabled, false);
  assert.equal(h.continueEnabled, false);
});

test('an unreadable save is explained with its path and keeps Continue off', () => {
  const h = hubState(base({ persistence: { loaded: true, error: null, recovered: { reason: 'invalid-json', quarantinedPath: 'C:\\data\\progress.invalid-2026.json' } } }));
  assert.equal(h.kind, 'unreadable');
  assert.equal(h.continueEnabled, false);
  assert.equal(h.startEnabled, true);
  assert.ok(h.explain.includes('invalid-json') && h.explain.includes('progress.invalid-2026.json') && /kept|moved aside/.test(h.explain), h.explain);
});

test('a course checkpoint resumes with the lesson, the step and the real last-activity time', () => {
  const training = { ...emptyTraining(), lastActivityAt: '2026-10-31T14:02:00.000Z', checkpoint: { lessonId: 's1-one-second-on', stepIndex: 1 } };
  const h = hubState(base({ training, learning: { completedSteps: ['s1-orientation:workspace'], completedLessons: [], missedLessons: [] } }));
  assert.equal(h.kind, 'in-progress');
  assert.equal(h.continueEnabled, true);
  assert.deepEqual(h.checkpoint, { lessonId: 's1-one-second-on', stepIndex: 1, title: 'One second ON', stepTitle: 'Your turn: one second ON', legacy: false });
  assert.equal(h.lastActive.toISOString(), '2026-10-31T14:02:00.000Z');
  assert.ok(h.explain.startsWith('Last worked on:'), h.explain);
});

test('a save mid-legacy-lesson resumes that lesson from the archive and says so', () => {
  const h = hubState(base({
    saved: { view: 'lesson', level: 'hate', lessonId: 'b-timeline-graph', stepIndex: 3 },
    learning: { completedSteps: ['b-system:show'], completedLessons: [], missedLessons: [] },
  }));
  assert.equal(h.kind, 'in-progress');
  assert.equal(h.continueEnabled, true);
  assert.equal(h.checkpoint.legacy, true);
  assert.equal(h.checkpoint.title, 'Reading the timeline');
  assert.ok(/archive/.test(h.explain), h.explain);
  assert.equal(h.lastActive, null, 'no real training time is invented');
});

test('the current session’s lesson outranks the saved checkpoint', () => {
  const training = { ...emptyTraining(), checkpoint: { lessonId: 's1-orientation', stepIndex: 0 }, lastActivityAt: '2026-10-31T10:00:00.000Z' };
  const h = hubState(base({ training, current: { lessonId: 's1-digital-vs-analog', stepIndex: 2 } }));
  assert.equal(h.checkpoint.lessonId, 's1-digital-vs-analog');
  assert.equal(h.checkpoint.stepIndex, 2);
});

test('a finished course keeps Continue for the review stop and Start for a new run', () => {
  const training = { ...emptyTraining(), completed: true, lastActivityAt: '2026-10-31T16:00:00.000Z' };
  const h = hubState(base({ training }));
  assert.equal(h.kind, 'completed');
  assert.equal(h.continueEnabled, true);
  assert.equal(h.startEnabled, true);
  assert.ok(/finished|review/i.test(h.explain), h.explain);
});

test('hovering, the film and tickling never count: only the recorded activity time is reported', () => {
  const h = hubState(base({ training: { ...emptyTraining(), lastActivityAt: null, checkpoint: { lessonId: 's1-orientation', stepIndex: 2 } } }));
  assert.equal(h.kind, 'in-progress');
  assert.equal(h.lastActive, null);
  assert.ok(!/Last worked on:/.test(h.explain), 'no date is invented');
});

test('a save that could not be read (locked or unreadable, not quarantined) blocks both buttons and explains, so nothing is overwritten', () => {
  const h = hubState(base({ persistence: { loaded: true, error: 'EBUSY: resource busy or locked', recovered: null, readFailed: true } }));
  assert.equal(h.kind, 'error');
  assert.equal(h.startEnabled, false);
  assert.equal(h.continueEnabled, false);
  assert.ok(h.explain.includes('EBUSY'), h.explain);
  assert.ok(h.explain.includes('Nothing has been changed'), h.explain);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCourse } from '../src/renderer/logic/course.mjs';

// Small self-contained fixture: three lessons, two questions each.
function fixtureLessons() {
  const q = (id, correct) => ({
    id,
    text: `Question ${id}`,
    options: ['A', 'B', 'C'],
    correct,
    why: `because ${id}`,
    hints: ['hint A', 'hint B', 'hint C'].map((h, i) => (i === correct ? '' : h)),
  });
  return [
    { id: 'l01', short: 'One', questions: [q('l01q1', 0), q('l01q2', 1)] },
    { id: 'l02', short: 'Two', questions: [q('l02q1', 2), q('l02q2', 0)] },
    { id: 'l03', short: 'Three', questions: [q('l03q1', 1), q('l03q2', 2)] },
  ];
}

test('a wrong answer explains the mistake and records the lesson for review', () => {
  const course = createCourse(fixtureLessons());
  const s0 = course.initialState();
  const r = course.answer(s0, 2);
  assert.equal(r.correct, false);
  assert.match(r.feedback, /Not quite\. hint C/);
  assert.deepEqual(r.state.missedLessons, ['l01']);
  assert.equal(course.canAdvance(r.state), false);
});

test('a correct answer after a wrong one unlocks advancement and keeps the review mark', () => {
  const course = createCourse(fixtureLessons());
  const wrong = course.answer(course.initialState(), 2);
  const right = course.answer(wrong.state, 0);
  assert.equal(right.correct, true);
  assert.match(right.feedback, /That.s right\. because l01q1/);
  assert.equal(course.canAdvance(right.state), true);
  assert.deepEqual(right.state.missedLessons, ['l01']);
  assert.deepEqual(right.state.answered, ['l01q1']);
});

test('answering an already answered question changes nothing', () => {
  const course = createCourse(fixtureLessons());
  const right = course.answer(course.initialState(), 0);
  const again = course.answer(right.state, 2);
  assert.equal(again.alreadyAnswered, true);
  assert.deepEqual(again.state, right.state);
});

test('next is blocked until the current question is answered', () => {
  const course = createCourse(fixtureLessons());
  const s0 = course.initialState();
  const r = course.next(s0);
  assert.equal(r.event, 'blocked');
  assert.deepEqual(r.state, s0);
});

test('next moves to the second question, then completes the lesson and opens the next one', () => {
  const course = createCourse(fixtureLessons());
  let s = course.answer(course.initialState(), 0).state;
  let r = course.next(s);
  assert.equal(r.event, 'next-question');
  assert.equal(r.state.questionIndex, 1);
  assert.deepEqual(r.state.completedLessons, []);

  s = course.answer(r.state, 1).state;
  r = course.next(s);
  assert.equal(r.event, 'next-lesson');
  assert.deepEqual(r.state.completedLessons, ['l01']);
  assert.equal(r.state.lessonIndex, 1);
  assert.equal(r.state.questionIndex, 0);
});

test('finishing the last lesson reaches the checkpoint with unfinished lessons listed', () => {
  const course = createCourse(fixtureLessons());
  let s = course.open(course.initialState(), 2);
  s = course.answer(s, 1).state;
  s = course.next(s).state;
  s = course.answer(s, 2).state;
  const r = course.next(s);
  assert.equal(r.event, 'checkpoint');
  assert.deepEqual(r.state.completedLessons, ['l03']);
  const cp = course.checkpoint(r.state);
  assert.deepEqual(cp.missingLessonIds, ['l01', 'l02']);
  assert.equal(cp.completedCount, 1);
  assert.equal(cp.total, 3);
});

test('skipping ahead and coming back keeps completion and resets to the first question', () => {
  const course = createCourse(fixtureLessons());
  let s = course.answer(course.initialState(), 0).state;
  s = course.next(s).state; // now on l01q2
  s = course.open(s, 2);
  assert.equal(s.lessonIndex, 2);
  assert.equal(s.questionIndex, 0);
  s = course.open(s, 0);
  assert.equal(s.questionIndex, 0);
  assert.deepEqual(s.answered, ['l01q1']);
  assert.equal(course.current(s).isAnswered, true, 'an answered question stays answered on revisit');
  assert.throws(() => course.open(s, 3));
});

test('current describes the question, its id, and whether it is the last one', () => {
  const course = createCourse(fixtureLessons());
  const s = course.initialState();
  const c = course.current(s);
  assert.equal(c.lesson.id, 'l01');
  assert.equal(c.questionId, 'l01q1');
  assert.equal(c.isAnswered, false);
  assert.equal(c.isLastQuestion, false);
  assert.equal(c.isLastLesson, false);
});

test('state can be rebuilt from saved identifiers', () => {
  const course = createCourse(fixtureLessons());
  const s = course.fromSaved({
    lessonId: 'l02',
    questionIndex: 1,
    answered: ['l01q1', 'l01q2', 'l02q1', 'ghost'],
    completedLessons: ['l01', 'ghost'],
    missedLessons: ['l01'],
  });
  assert.equal(s.lessonIndex, 1);
  assert.equal(s.questionIndex, 1);
  assert.deepEqual(s.answered, ['l01q1', 'l01q2', 'l02q1']);
  assert.deepEqual(s.completedLessons, ['l01']);
  const unknownLesson = course.fromSaved({ lessonId: 'nope', questionIndex: 7 });
  assert.equal(unknownLesson.lessonIndex, 0);
  assert.equal(unknownLesson.questionIndex, 0);
});

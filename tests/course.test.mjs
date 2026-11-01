import { test } from 'node:test';
import assert from 'node:assert/strict';
import { COURSE, COURSE_LESSONS, nextCourseLesson, courseComplete } from '../src/renderer/content/course.mjs';
import { LEVELS } from '../src/renderer/content/levels.mjs';

test('the course is exactly the first segment plus one placeholder, with no legacy lessons', () => {
  assert.equal(COURSE.id, 'course');
  assert.equal(COURSE.title, 'Rose Float training');
  assert.deepEqual(COURSE.lessons, ['s1-orientation', 's1-digital-vs-analog', 's1-one-second-on']);
  assert.deepEqual(COURSE_LESSONS.map((l) => l.title), ['Meet the PC•MACs screen', 'Digital versus analog, briefly', 'One second ON']);
  assert.equal(COURSE.placeholder, 'Further steps will be added after Atalay reviews this segment.');
  for (const level of LEVELS) for (const id of level.lessons) assert.ok(!COURSE.lessons.includes(id), `${id} stays out of the course`);
});

test('the next lesson is the first unfinished one, and the course completes when all three are done', () => {
  const learning = { completedSteps: [], completedLessons: [], missedLessons: [] };
  assert.equal(nextCourseLesson(learning).id, 's1-orientation');
  assert.equal(courseComplete(learning), false);
  learning.completedLessons = ['s1-orientation'];
  assert.equal(nextCourseLesson(learning).id, 's1-digital-vs-analog');
  learning.completedLessons = ['s1-orientation', 's1-digital-vs-analog', 's1-one-second-on'];
  assert.equal(nextCourseLesson(learning).id, 's1-orientation', 'a finished course offers its first lesson again');
  assert.equal(courseComplete(learning), true);
});

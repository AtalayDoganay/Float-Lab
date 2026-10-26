// Which lessons of a level are finished or started, and which one comes next.
// Used by the level map and by the guide plan.
import { LEVEL_BY_ID, LESSONS_BY_ID, stepKey } from '../content/levels.mjs';

export function lessonStatus(lesson, learning) {
  const done = lesson.steps.filter((s) => learning.completedSteps.includes(stepKey(lesson.id, s.id))).length;
  const finished = learning.completedLessons.includes(lesson.id) || done === lesson.steps.length;
  return { done, total: lesson.steps.length, finished, started: done > 0 && !finished };
}

export function nextLessonFor(levelId, learning) {
  const level = LEVEL_BY_ID[levelId];
  if (!level) return null;
  const lessons = level.lessons.map((id) => LESSONS_BY_ID[id]);
  return lessons.find((l) => !lessonStatus(l, learning).finished) || lessons[0];
}

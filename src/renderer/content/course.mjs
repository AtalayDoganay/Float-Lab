// The one course the learner-facing flow offers: the first digital segment
// (brief, October 31, 2026) and a placeholder for the steps Atalay will
// specify after reviewing it. The three legacy levels stay reachable as an
// archive (Progress ▸ Earlier lessons), never as the curriculum.
import { LESSONS_BY_ID } from './levels.mjs';
import { SEGMENT_IDS } from './lessons/segment-digital.mjs';
import { lessonStatus } from '../logic/level-status.mjs';

export const COURSE = Object.freeze({
  id: 'course',
  title: 'Rose Float training',
  tagline: 'Your first segment: the PC•MACs screen, digital versus analog, and one second of ON.',
  lessons: SEGMENT_IDS,
  placeholder: 'Further steps will be added after Atalay reviews this segment.',
});

export const COURSE_LESSONS = Object.freeze(COURSE.lessons.map((id) => {
  const lesson = LESSONS_BY_ID[id];
  if (!lesson) throw new Error(`Course lesson ${id} is not registered`);
  return lesson;
}));

export const isCourseLesson = (id) => COURSE.lessons.includes(id);

export function nextCourseLesson(learning) {
  return COURSE_LESSONS.find((l) => !lessonStatus(l, learning).finished) || COURSE_LESSONS[0];
}

export function courseComplete(learning) {
  return COURSE_LESSONS.every((l) => lessonStatus(l, learning).finished);
}

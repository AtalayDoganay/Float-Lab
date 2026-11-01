// The course map: the three lessons of the first segment, one obvious place
// to begin (Rosie points at it), and the placeholder row for the steps that
// will be specified after the review. No other chapters are listed.
import { el, replace } from './dom.mjs';
import { COURSE, COURSE_LESSONS, nextCourseLesson } from '../content/course.mjs';
import { lessonStatus } from '../logic/level-status.mjs';

export function mountCourse(container, { dispatch }) {
  function row(lesson, state) {
    const st = lessonStatus(lesson, state.learning);
    const cls = ['lesson-row', st.finished ? 'done' : (st.started ? 'started' : ''), state.lesson.id === lesson.id ? 'current' : ''].join(' ').trim();
    return el('button', { type: 'button', class: cls, 'data-control': 'lesson-list', 'data-fid': `lesson-${lesson.id}`, 'data-lesson': lesson.id, onclick: () => dispatch({ type: 'start-lesson', id: lesson.id }) },
      el('span', { class: 'mark', 'aria-hidden': 'true', text: st.finished ? '✓' : (st.started ? '…' : '') }),
      el('span', {}, el('span', { class: 'name', text: lesson.title }), el('span', { class: 'summary', text: lesson.summary })),
      el('span', { class: 'steps', text: st.finished ? 'finished' : `${st.done} of ${st.total} steps` }));
  }

  function update(state) {
    const activeEl = document.activeElement;
    const fid = activeEl && container.contains(activeEl) ? activeEl.dataset.fid : null;
    const next = nextCourseLesson(state.learning);
    const nextStatus = lessonStatus(next, state.learning);
    replace(container, el('div', { class: 'level-map course-map' },
      el('div', { class: 'btn-row' }, el('button', { type: 'button', class: 'btn btn-small', 'data-control': 'nav-home', 'data-fid': 'home', text: 'Hub', onclick: () => dispatch({ type: 'go-home' }) })),
      el('div', { class: 'top' }, el('h1', { text: COURSE.title })),
      el('p', { class: 'tagline', text: COURSE.tagline }),
      el('div', { class: 'begin-card', 'data-target': 'course-begin' },
        el('div', { class: 'where' }, el('span', { class: 'title', text: next.title }), el('span', { class: 'summary', text: next.summary })),
        el('button', { type: 'button', class: 'btn btn-primary', 'data-control': 'begin-here', 'data-fid': 'begin', text: nextStatus.started ? 'Continue lesson' : 'Begin', onclick: () => dispatch({ type: 'start-lesson', id: next.id }) })),
      el('section', { class: 'group' },
        el('div', { class: 'lesson-rows' },
          ...COURSE_LESSONS.map((l) => row(l, state)),
          el('div', { class: 'lesson-row placeholder', role: 'note', 'aria-disabled': 'true' },
            el('span', { class: 'mark', 'aria-hidden': 'true' }),
            el('span', {}, el('span', { class: 'name', text: 'Next steps' }), el('span', { class: 'summary', text: COURSE.placeholder })),
            el('span', { class: 'steps', text: 'to come' }))))));
    if (fid) container.querySelector(`[data-fid="${fid}"]`)?.focus();
  }

  return { update };
}

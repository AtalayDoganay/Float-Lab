// Level map: the level's lessons grouped by what they teach, with one obvious
// place to begin and a quiet way into the full workspace.
import { el, replace } from './dom.mjs';
import { LEVEL_BY_ID, LESSONS_BY_ID, groupedLessons, stepKey } from '../content/levels.mjs';

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

export function mountLevel(container, { dispatch }) {
  function row(lesson, state) {
    const st = lessonStatus(lesson, state.learning);
    const cls = ['lesson-row', st.finished ? 'done' : (st.started ? 'started' : ''), state.lesson.id === lesson.id ? 'current' : ''].join(' ').trim();
    return el('button', { type: 'button', class: cls, 'data-control': 'lesson-list', 'data-fid': `lesson-${lesson.id}`, 'data-lesson': lesson.id, onclick: () => dispatch({ type: 'start-lesson', id: lesson.id }) },
      el('span', { class: 'mark', 'aria-hidden': 'true', text: st.finished ? '✓' : (st.started ? '…' : '') }),
      el('span', {}, el('span', { class: 'name', text: lesson.title }), el('span', { class: 'summary', text: lesson.summary })),
      el('span', { class: 'steps', text: st.finished ? 'finished' : `${st.done} of ${st.total} steps` }));
  }

  function update(state) {
    const level = LEVEL_BY_ID[state.level];
    if (!level) { replace(container); return; }
    const activeEl = document.activeElement;
    const fid = activeEl && container.contains(activeEl) ? activeEl.dataset.fid : null;
    const next = nextLessonFor(level.id, state.learning);
    const nextStatus = lessonStatus(next, state.learning);
    const allDone = level.lessons.every((id) => lessonStatus(LESSONS_BY_ID[id], state.learning).finished);
    const finished = state.lesson.justFinished ? LESSONS_BY_ID[state.lesson.justFinished] : null;

    replace(container, el('div', { class: 'level-map' },
      el('div', { class: 'btn-row' }, el('button', { type: 'button', class: 'btn btn-small', 'data-control': 'nav-home', 'data-fid': 'home', text: 'Home', onclick: () => dispatch({ type: 'go-home' }) })),
      el('div', { class: 'top' }, el('h1', { text: level.name })),
      el('p', { class: 'tagline', text: level.tagline }),
      finished ? el('div', { class: 'finished-note', role: 'status', text: `Finished: ${finished.title}.` }) : null,
      el('div', { class: 'begin-card' },
        el('div', { class: 'where' },
          el('span', { class: 'label', text: allDone ? 'Every lesson in this level is finished. Revisit any of them below.' : (nextStatus.started ? 'Pick up where you stopped' : 'Begin here') }),
          el('span', { class: 'title', text: next.title }),
          el('span', { class: 'summary', text: next.summary })),
        el('button', { type: 'button', class: 'btn btn-primary', 'data-control': 'begin-here', 'data-fid': 'begin', text: nextStatus.started ? 'Continue lesson' : 'Begin', onclick: () => dispatch({ type: 'begin-here' }) })),
      ...groupedLessons(level.id).map(({ group, lessons }) => el('section', { class: 'group' },
        el('h2', { text: group.title }),
        el('p', { class: 'summary', text: group.summary }),
        el('div', { class: 'lesson-rows' }, ...lessons.map((l) => row(l, state))))),
      el('div', { class: 'btn-row' },
        el('button', { type: 'button', class: 'link-btn', 'data-control': 'explore-workspace', 'data-fid': 'explore', text: 'Open all the PC•MACs windows without a lesson', onclick: () => dispatch({ type: 'explore' }) }))));
    if (fid) container.querySelector(`[data-fid="${fid}"]`)?.focus();
  }

  return { update };
}

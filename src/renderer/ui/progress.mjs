// Progress panel: where progress lives, what is complete, and the Restart /
// exercise-reset controls. Progress is independent of One File.
import { el, replace, helpButton } from './dom.mjs';
import { LESSONS } from '../content/curriculum.mjs';
import { EXERCISES } from '../content/exercises.mjs';
import { MANUAL_CITATIONS } from '../content/references.mjs';

export function mountProgress(container, { dispatch, course }) {
  function update(state) {
    const cp = course.checkpoint(state.course);
    const answered = state.course.answered.length;
    const totalQuestions = LESSONS.reduce((n, l) => n + l.questions.length, 0);
    const missed = cp.missedLessonIds.map((id) => LESSONS.find((l) => l.id === id).short);
    const exercisesDone = state.guided.completedExercises.length;
    const p = state.persistence;
    const activeEl = document.activeElement;
    const fid = activeEl && container.contains(activeEl) ? activeEl.dataset.fid : null;

    replace(container,
      el('h2', { text: 'Progress' }),
      el('div', { class: 'stat' }, el('span', { text: 'Lessons completed' }), el('strong', { text: `${cp.completedCount} of ${cp.total}` })),
      el('div', { class: 'stat' }, el('span', { text: 'Questions answered correctly' }), el('strong', { text: `${answered} of ${totalQuestions}` })),
      el('div', { class: 'stat' }, el('span', { text: 'Guided exercises completed' }), el('strong', { text: `${exercisesDone} of ${EXERCISES.length}` })),
      el('div', { class: 'stat' }, el('span', { text: 'Topics to review' }), el('strong', { text: missed.length ? missed.join(', ') : 'none yet' })),
      el('div', { class: 'stat' }, el('span', { text: 'Last saved' }), el('strong', { text: p.savedAt ? new Date(p.savedAt).toLocaleString() : (p.error ? 'save failed' : 'not yet') })),
      el('h3', { text: 'Where it is saved' }),
      el('p', { class: 'muted', text: 'A small JSON file in this app’s own user-data folder on this computer. It is independent of One File and is never sent anywhere.' }),
      el('p', { class: 'path', text: p.path || '(path not available yet)' }),
      el('h3', { text: 'Controls' }),
      el('div', { class: 'btn-row' },
        el('button', { type: 'button', class: 'btn', 'data-control': 'restart', 'data-fid': 'restart', text: 'Restart learning', onclick: () => dispatch({ type: 'restart-request' }) }), helpButton('restart'),
        el('button', { type: 'button', class: 'btn', 'data-control': 'guided-reset', 'data-fid': 'exreset', disabled: !state.guided.exerciseId, text: 'Reset current exercise', onclick: () => dispatch({ type: 'guided-reset' }) }), helpButton('guided-reset')),
      el('p', { class: 'muted', text: 'Restart asks for confirmation and clears lessons, answers, and exercises. Reset current exercise only clears the exercise that is open in Practice.' }),
      el('h3', { text: 'Sources (open outside the app)' }),
      el('p', { class: 'muted', text: 'Installed lessons never need these downloads. Links open in your system browser, never inside this app.' }),
      el('div', { class: 'btn-row' },
        el('button', { type: 'button', class: 'btn', text: 'PC•MACs manual (PDF)', onclick: () => dispatch({ type: 'open-link', url: MANUAL_CITATIONS['pcmacs-gilderterm'].url }) }),
        el('button', { type: 'button', class: 'btn', text: 'Br-EFB manual (PDF)', onclick: () => dispatch({ type: 'open-link', url: MANUAL_CITATIONS['brefb-endpoints'].url }) }),
        el('button', { type: 'button', class: 'btn', text: 'Cisco: IP addressing and subnets', onclick: () => dispatch({ type: 'open-link', url: 'https://www.cisco.com/c/en/us/support/docs/ip/routing-information-protocol-rip/13788-3.html' }) })),
      el('h3', { text: 'About this trainer' }),
      el('p', { class: 'muted', text: 'Roseflow PC Mac Training is an independent training app for the Cal Poly Pomona Rose Float team. It is not affiliated with Gilderfluke & Co. It imitates parts of the PC•MACs workspace for teaching, runs fully offline, and never sends commands to any controller or mechanism.' }));
    if (fid) container.querySelector(`[data-fid="${fid}"]`)?.focus();
  }
  return { update };
}

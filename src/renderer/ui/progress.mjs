// Progress: what is finished per level, lessons to review, the earlier-version
// records if any, where the file lives, and the controls to start over.
import { el, replace, helpButton } from './dom.mjs';
import { LEVELS, LESSONS_BY_ID, lessonsForLevel } from '../content/levels.mjs';
import { LESSONS as CLASSIC_LESSONS } from '../content/curriculum.mjs';
import { EXERCISES } from '../content/exercises.mjs';
import { MANUAL_CITATIONS } from '../content/references.mjs';
import { lessonStatus } from './level.mjs';

export function mountProgress(container, { dispatch }) {
  function update(state) {
    const p = state.persistence;
    const activeEl = document.activeElement;
    const fid = activeEl && container.contains(activeEl) ? activeEl.dataset.fid : null;
    const allLessons = Object.values(LESSONS_BY_ID);
    const stepsDone = state.learning.completedSteps.length;
    const stepsTotal = allLessons.reduce((n, l) => n + l.steps.length, 0);
    const review = state.learning.missedLessons.map((id) => LESSONS_BY_ID[id]).filter(Boolean).map((l) => l.title);
    const legacyAnswered = state.course.answered.length;
    const legacyExercise = state.guided.completedSteps.length;
    const classicTotalQuestions = CLASSIC_LESSONS.reduce((n, l) => n + l.questions.length, 0);
    const exerciseTotalSteps = EXERCISES.reduce((n, e) => n + e.steps.length, 0);

    replace(container, el('div', { class: 'progress-view' },
      el('div', { class: 'btn-row' },
        el('button', { type: 'button', class: 'btn btn-small', 'data-control': 'nav-home', 'data-fid': 'home', text: 'Home', onclick: () => dispatch({ type: 'go-home' }) }),
        state.lesson.id ? el('button', { type: 'button', class: 'btn btn-small', 'data-fid': 'back-lesson', text: 'Back to the lesson', onclick: () => dispatch({ type: 'start-lesson', id: state.lesson.id, stepIndex: state.lesson.stepIndex }) }) : null),
      el('h1', { text: 'Progress' }),
      ...LEVELS.map((level) => {
        const lessons = lessonsForLevel(level.id);
        const done = lessons.filter((l) => lessonStatus(l, state.learning).finished).length;
        return el('div', { class: 'stat' }, el('span', { text: level.name }), el('strong', { text: `${done} of ${lessons.length} lessons finished` }));
      }),
      el('div', { class: 'stat' }, el('span', { text: 'Steps finished across all lessons' }), el('strong', { text: `${stepsDone} of ${stepsTotal}` })),
      el('div', { class: 'stat' }, el('span', { text: 'Lessons with a wrong try to review' }), el('strong', { text: review.length ? review.join('; ') : 'none yet' })),
      el('div', { class: 'stat' }, el('span', { text: 'Last saved' }), el('strong', { text: p.savedAt ? new Date(p.savedAt).toLocaleString() : (p.error ? 'save failed' : 'not yet') })),

      (legacyAnswered || legacyExercise || state.migratedInfo) ? el('h2', { text: 'Records from the earlier version' }) : null,
      (legacyAnswered || legacyExercise || state.migratedInfo) ? el('p', { class: 'muted', text: `${legacyAnswered} of ${classicTotalQuestions} classic questions answered and ${legacyExercise} of ${exerciseTotalSteps} exercise steps finished. Each one pre-marks the guided step that reuses it, and new answers keep these records up to date.${state.migratedInfo && p.migrated ? ` The original version-${p.migrated.fromSchemaVersion} file was copied to ${p.migrated.backupPath} before anything was changed.` : ''}` }) : null,

      el('h2', { text: 'Where it is saved' }),
      el('p', { class: 'muted', text: 'A small JSON file in this app’s own user-data folder on this computer (schema version 3). It is independent of One File and is never sent anywhere.' }),
      el('p', { class: 'path', text: p.path || '(path not available yet)' }),

      el('h2', { text: 'Start over' }),
      el('div', { class: 'btn-row' },
        el('button', { type: 'button', class: 'btn', 'data-control': 'restart', 'data-fid': 'restart', text: 'Start over', onclick: () => dispatch({ type: 'restart-request' }) }), helpButton('restart')),
      el('p', { class: 'muted', text: 'Start over asks for confirmation and clears every lesson, step, and classic record. To redo a single lesson, use “Restart this lesson” inside it.' }),

      el('h2', { text: 'Sources (open outside the app)' }),
      el('p', { class: 'muted', text: 'Installed lessons never need these downloads. Links open in your system browser, never inside this app.' }),
      el('div', { class: 'btn-row' },
        el('button', { type: 'button', class: 'btn', text: 'PC•MACs manual (PDF)', onclick: () => dispatch({ type: 'open-link', url: MANUAL_CITATIONS['pcmacs-gilderterm'].url }) }),
        el('button', { type: 'button', class: 'btn', text: 'Br-EFB manual (PDF)', onclick: () => dispatch({ type: 'open-link', url: MANUAL_CITATIONS['brefb-endpoints'].url }) }),
        el('button', { type: 'button', class: 'btn', text: 'Cisco: IP addressing and subnets', onclick: () => dispatch({ type: 'open-link', url: 'https://www.cisco.com/c/en/us/support/docs/ip/routing-information-protocol-rip/13788-3.html' }) })),

      el('h2', { text: 'About this trainer' }),
      el('p', { class: 'muted', text: 'Roseflow PC Mac Training is an independent training app for the Cal Poly Pomona Rose Float team. It is not affiliated with Gilderfluke & Co. It recreates PC•MACs windows from the manufacturer’s manual for teaching, simulates part of their behaviour, runs fully offline, and never sends commands to any controller or mechanism.' })));
    if (fid) container.querySelector(`[data-fid="${fid}"]`)?.focus();
  }
  return { update };
}

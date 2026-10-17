// Home: the three learning levels, a Continue card when saved progress exists,
// and a plain note when progress from the earlier version was found.
import { el, replace } from './dom.mjs';
import { LEVELS, LESSONS_BY_ID, lessonsForLevel } from '../content/levels.mjs';

export function mountHome(container, { dispatch }) {
  function levelCard(level, state) {
    const lessons = lessonsForLevel(level.id);
    const done = lessons.filter((l) => state.learning.completedLessons.includes(l.id)).length;
    const started = state.level === level.id;
    return el('button', {
      type: 'button', class: 'level-card', 'data-control': 'level-choice', 'data-fid': `level-${level.id}`, 'data-level': level.id,
      onclick: () => dispatch({ type: 'choose-level', level: level.id }),
    },
      el('h2', { text: level.name }),
      el('p', { class: 'tagline', text: level.tagline }),
      el('p', { class: 'covers', text: `Covers ${level.groups.map((g) => g.title.toLowerCase()).join(', ')}.` }),
      el('p', { class: 'count', text: done ? `${done} of ${lessons.length} lessons finished` : `${lessons.length} lessons` }),
      el('span', { class: 'cta', text: started || done ? `Continue ${level.name}` : `Start ${level.name}` }));
  }

  function continueCard(state) {
    const s = state.saved;
    if (!s || (!s.level && !s.lessonId)) return null;
    const level = LEVELS.find((l) => l.id === s.level);
    const lesson = s.lessonId ? LESSONS_BY_ID[s.lessonId] : null;
    const where = lesson
      ? `${lesson.title}, step ${Math.min(s.stepIndex, lesson.steps.length - 1) + 1} of ${lesson.steps.length}`
      : 'the lesson list';
    return el('div', { class: 'continue-card' },
      el('div', { class: 'where' },
        el('strong', { text: `Continue where you left off` }),
        el('span', { text: `${level ? level.name : 'Your level'}: ${where}. The show starts stopped.` })),
      el('button', { type: 'button', class: 'btn btn-primary', 'data-control': 'resume', 'data-fid': 'resume', text: 'Continue', onclick: () => dispatch({ type: 'resume' }) }),
      el('button', { type: 'button', class: 'btn', 'data-control': 'restart', 'data-fid': 'restart', text: 'Start over', onclick: () => dispatch({ type: 'restart-request' }) }));
  }

  function foundCard(state) {
    const m = state.migratedInfo;
    const p = state.persistence;
    if (!m) return null;
    const answered = state.course.answered.length;
    const steps = state.guided.completedSteps.length;
    const what = [
      answered ? `${answered} answered question${answered === 1 ? '' : 's'}` : null,
      steps ? `${steps} finished exercise step${steps === 1 ? '' : 's'}` : null,
    ].filter(Boolean).join(' and ') || 'no finished work';
    const text = m.fromSchemaVersion === 2
      ? 'Your finished lessons and steps, and your place, are kept, and Continue takes you back. The lessons now use the recreated PC•MACs windows: your saved light pattern became the same ON time on the Edit View, and your saved command became that axis’s Soft Console value. A few new steps in lessons you finished are marked as new.'
      : `It held ${what}. Those count toward the same questions and assignment steps in every level. Your old place in the classic lesson list has no equivalent here, so the app starts at this screen.`;
    return el('div', { class: 'found-card', 'data-control': 'nav-progress', tabindex: '0' },
      el('p', {}, el('strong', { text: m.fromSchemaVersion === 2 ? 'Progress from the previous version was updated. ' : 'Progress from the earlier version was found. ' }), text),
      p.migrated && p.migrated.backupPath ? el('p', { class: 'path', text: `Original file kept as ${p.migrated.backupPath}` }) : null,
      el('div', { class: 'btn-row' }, el('button', { type: 'button', class: 'btn btn-small', text: 'Got it', onclick: () => dispatch({ type: 'dismiss-migration' }) })));
  }

  function update(state) {
    const activeEl = document.activeElement;
    const fid = activeEl && container.contains(activeEl) ? activeEl.dataset.fid : null;
    replace(container, el('div', { class: 'home' },
      el('h1', { text: 'Choose how deep to go.' }),
      el('p', { class: 'lede', text: 'Three ways through the same recreated PC•MACs windows, one step at a time. Lessons shared between levels keep their progress, so you can switch whenever you like.' }),
      continueCard(state),
      foundCard(state),
      el('div', { class: 'levels' }, ...LEVELS.map((level) => levelCard(level, state))),
      el('p', { class: 'muted', text: 'Progress is saved in this app’s own folder on this computer and never sent anywhere. The handbook is one click away at any time.' })));
    if (fid) container.querySelector(`[data-fid="${fid}"]`)?.focus();
  }

  return { update };
}

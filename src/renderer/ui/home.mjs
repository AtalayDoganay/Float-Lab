// Home: one primary action in a plain card (Start with Basic for a first-time
// learner; Continue, with Start over, for anyone with a place to go back to),
// the three levels as rows, a quiet note when an older progress file was
// carried over, and a way to meet Rosie again. Rosie herself floats beside
// the primary action and does the talking from the guide layer.
import { el, replace } from './dom.mjs';
import { LEVELS, lessonsForLevel } from '../content/levels.mjs';
import { homeWhere } from '../logic/guide-plan.mjs';

export function mountHome(container, { dispatch }) {
  function levelRow(level, state) {
    const lessons = lessonsForLevel(level.id);
    const done = lessons.filter((l) => state.learning.completedLessons.includes(l.id)).length;
    return el('button', {
      type: 'button', class: 'level-row', 'data-control': 'level-choice', 'data-fid': `level-${level.id}`, 'data-level': level.id,
      onclick: () => dispatch({ type: 'choose-level', level: level.id }),
    },
      el('h2', { text: level.name }),
      el('p', { class: 'tagline', text: level.tagline }),
      el('span', { class: 'count', text: done ? `${done} of ${lessons.length} lessons finished` : `${lessons.length} lessons` }));
  }

  function action(state) {
    const w = homeWhere(state);
    if (!w) {
      // Rosie stands beside this card (its data-target) and does the talking.
      return el('div', { class: 'home-action', 'data-target': 'start-learning' },
        el('p', { class: 'lead', text: 'New here? Basic covers enough to get by.' }),
        el('div', { class: 'btn-row' },
          el('button', { type: 'button', class: 'btn btn-primary btn-big', 'data-control': 'start-learning', 'data-fid': 'start-basic', text: 'Start with Basic', onclick: () => dispatch({ type: 'choose-level', level: 'basic' }) })));
    }
    return el('div', { class: 'home-action continue-card', 'data-target': 'resume' },
      el('p', { class: 'lead', text: 'Pick up where you were, or start again from nothing.' }),
      el('div', { class: 'btn-row' },
        el('button', { type: 'button', class: 'btn btn-primary btn-big', 'data-control': 'resume', 'data-fid': 'resume', text: 'Continue', onclick: () => dispatch({ type: 'resume' }) }),
        el('button', { type: 'button', class: 'btn', 'data-control': 'restart', 'data-fid': 'restart', text: 'Start over', onclick: () => dispatch({ type: 'restart-request' }) })));
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
      el('h1', { class: 'sr-only', text: 'Home' }),
      action(state),
      el('h2', { class: 'home-or', text: homeWhere(state) ? 'Or choose a level' : 'Or choose how deep to go' }),
      el('div', { class: 'level-rows' }, ...LEVELS.map((level) => levelRow(level, state))),
      foundCard(state),
      el('p', { class: 'home-foot muted' },
        'Progress is saved in this app’s own folder on this computer and never sent anywhere. ',
        el('button', { type: 'button', class: 'link-btn', 'data-control': 'welcome-guide', 'data-fid': 'welcome-replay', text: 'Meet Rosie again', onclick: () => dispatch({ type: 'welcome-open' }) }))));
    if (fid) container.querySelector(`[data-fid="${fid}"]`)?.focus();
  }

  return { update };
}

// The training hub (brief §14): an archive print on the left, the two main
// actions on the right (Start your training, Continue your training) with
// the explanation of the saved state under them, the quieter secondary links,
// and the note about a carried-over progress file. Rosie floats beside the
// enabled action and does the talking from the guide layer.
import { el, replace } from './dom.mjs';
import { hubState } from '../logic/hub-state.mjs';
import { ARCHIVE_PHOTOS, ARCHIVE_DIR, archiveCaption } from '../content/archive.mjs';

export const HUB_DESCRIPTION = 'Learn how timed digital signals become animated actions. Practice the controls, read the timeline, and build confidence with Rosie in a simulation inspired by Cal Poly Rose Float’s student-built tradition.';

export function mountHub(container, { dispatch }) {
  function foundCard(state) {
    const m = state.migratedInfo;
    if (!m) return null;
    const p = state.persistence;
    const text = m.fromSchemaVersion === 3
      ? 'Your finished lessons, your place, and your show data are kept. The app now offers one course; the earlier levels are kept as an archive under Progress, and Continue reopens the lesson you were on.'
      : m.fromSchemaVersion === 2
        ? 'Your finished lessons and steps, and your place, are kept. The earlier levels are kept as an archive under Progress.'
        : 'Its answered questions and finished exercise steps count toward the same steps in the archive lessons. Your old place has no equivalent here, so the course starts at its beginning.';
    return el('div', { class: 'found-card', 'data-control': 'nav-progress', tabindex: '0' },
      el('p', {}, el('strong', { text: 'Progress from an earlier version was found. ' }), text),
      p.migrated && p.migrated.backupPath ? el('p', { class: 'path', text: `Original file kept as ${p.migrated.backupPath}` }) : null,
      el('div', { class: 'btn-row' }, el('button', { type: 'button', class: 'btn btn-small', text: 'Got it', onclick: () => dispatch({ type: 'dismiss-migration' }) })));
  }

  function update(state) {
    const activeEl = document.activeElement;
    const fid = activeEl && container.contains(activeEl) ? activeEl.dataset.fid : null;
    const h = hubState({
      persistence: state.persistence, training: state.training, learning: state.learning, saved: state.saved,
      current: state.lesson.id ? { lessonId: state.lesson.id, stepIndex: state.lesson.stepIndex } : null,
    });
    const photo = ARCHIVE_PHOTOS[(state.hubVisits || 0) % ARCHIVE_PHOTOS.length];
    replace(container, el('div', { class: 'hub' },
      el('h1', { class: 'sr-only', text: 'Training hub' }),
      el('figure', { class: 'hub-print', 'data-react': 'photo', 'data-caption': archiveCaption(photo), tabindex: '0', 'aria-label': `${archiveCaption(photo)}. ${photo.credit}` },
        el('div', { class: 'mount' }, el('img', { src: `${ARCHIVE_DIR}${photo.file}`, alt: '' })),
        el('figcaption', { text: archiveCaption(photo) }),
        el('span', { class: 'credit', text: `Photo: ${photo.credit}` })),
      el('div', { class: 'hub-actions', 'data-target': 'hub-actions' },
        el('p', { class: 'hub-lede', text: HUB_DESCRIPTION }),
        el('div', { class: 'hub-buttons' },
          el('button', {
            type: 'button', class: 'btn btn-primary', 'data-control': 'start-training', 'data-fid': 'start', 'data-react': 'start',
            disabled: !h.startEnabled, text: h.startLabel, onclick: () => dispatch({ type: 'start-training' }),
          }),
          el('button', {
            type: 'button', class: 'btn', 'data-control': 'continue-training', 'data-fid': 'continue', 'data-react': h.continueEnabled ? 'continue' : 'continue-disabled',
            disabled: !h.continueEnabled, 'aria-disabled': String(!h.continueEnabled), text: h.continueLabel, onclick: () => dispatch({ type: 'continue-training' }),
          })),
        el('p', { class: 'hub-explain', 'data-ref': 'explain', text: h.explain }),
        foundCard(state),
        el('nav', { class: 'hub-secondary', 'aria-label': 'More' },
          el('button', { type: 'button', class: 'link-btn', 'data-control': 'replay-intro', 'data-fid': 'replay-intro', text: 'Replay introduction', onclick: () => dispatch({ type: 'intro-replay' }) }),
          el('button', { type: 'button', class: 'link-btn', 'data-fid': 'open-course', text: 'See the course', onclick: () => dispatch({ type: 'open-course' }) }),
          el('button', { type: 'button', class: 'link-btn', 'data-fid': 'archive', text: 'Earlier lessons (archive)', onclick: () => dispatch({ type: 'go-progress' }) }),
          el('span', { class: 'muted', text: 'Progress is saved in this app’s own folder on this computer and never sent anywhere.' }))),
      // Rosie's place beside the actions (the guide layer docks her here).
      el('div', { id: 'hub-rosie-dock', class: 'hub-rosie-dock', 'data-facing': 'left', 'aria-hidden': 'true' })));
    if (fid) container.querySelector(`[data-fid="${fid}"]`)?.focus();
  }

  return { update };
}

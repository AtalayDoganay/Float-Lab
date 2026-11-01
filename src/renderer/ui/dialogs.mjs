// The existing-progress dialog, the reference-photo dialog, and the read-only
// GilderCommands "Control" window. The guarded restart dialog is its own
// module (ui/restart-dialog.mjs).
import { el, replace } from './dom.mjs';
import { REFERENCE_IMAGES, IMAGE_DIR } from '../content/references.mjs';
import { hubState } from '../logic/hub-state.mjs';

const GILDER_COMMANDS = [
  ['All Cards / Play', 'u'], ['All Cards / Select Show', '* + selection'], ['All Cards / Stop', 'y'], ['All Cards / Loop', '"'],
  ['All Cards / Stop at End', '&'], ['All Cards / Echo Off', 'b'], ['Addressed Card / Pause', '< + address'], ['Addressed Card / Play', 't + address'],
  ['Addressed Card / Select Show', '* + address + selection'], ['Addressed Card / Stop', 'y + address'], ['Addressed Card / Loop', '" + address'],
  ['Addressed Card / Resume', '> + address'], ['Addressed Card / Stop at End', '& + address'],
];

export function mountDialogs({ dispatch }) {
  const photo = document.getElementById('photo-dialog');
  const control = document.getElementById('control-dialog');
  const progress = document.getElementById('progress-dialog');

  for (const d of [photo, control]) {
    d.addEventListener('cancel', (e) => { e.preventDefault(); dispatch({ type: d === photo ? 'close-photo' : 'term-button', name: 'control' }); });
    d.addEventListener('click', (e) => { if (e.target === d) dispatch({ type: d === photo ? 'close-photo' : 'term-button', name: 'control' }); });
  }
  progress.addEventListener('cancel', (e) => { e.preventDefault(); dispatch({ type: 'progress-dialog-close' }); });

  // Start your training with a save: continue, restart, or cancel (brief §14).
  function existingProgress(state) {
    const h = hubState({ persistence: state.persistence, training: state.training, learning: state.learning, saved: state.saved, current: state.lesson.id ? { lessonId: state.lesson.id, stepIndex: state.lesson.stepIndex } : null });
    // No date is invented: a lesson merely opened has a checkpoint but no activity time.
    const when = h.lastActive ? `Last worked on: ${h.lastActive.toLocaleString()}. ` : '';
    const where = h.checkpoint ? `${h.checkpoint.title}, step ${h.checkpoint.stepIndex + 1}` : 'the course';
    const line = h.kind === 'completed'
      ? `You already finished this training. ${when}Continue to the review stop, or start a new run?`
      : `You already have training in progress. ${when}Continue from ${where}, or start a new run?`;
    return el('div', { class: 'dialog-body' },
      el('h2', { id: 'progress-title', text: h.kind === 'completed' ? 'Training already finished' : 'Training in progress' }),
      el('p', { class: 'lede', 'data-ref': 'progress-line', text: line }),
      el('div', { class: 'dialog-actions' },
        el('button', { type: 'button', class: 'btn', 'data-fid': 'cancel', text: 'Cancel', onclick: () => dispatch({ type: 'progress-dialog-close' }) }),
        el('button', { type: 'button', class: 'btn', 'data-fid': 'restart', 'data-control': 'restart', text: 'Restart from the beginning', onclick: () => { dispatch({ type: 'progress-dialog-close' }); dispatch({ type: 'restart-request' }); } }),
        el('button', { type: 'button', class: 'btn btn-primary', 'data-fid': 'continue', text: 'Continue training', onclick: () => dispatch({ type: 'continue-training' }) })));
  }

  function sync(dialog, shouldOpen, build) {
    if (shouldOpen && !dialog.open) { replace(dialog, build()); dialog.showModal(); dialog.querySelector('button')?.focus(); }
    if (!shouldOpen && dialog.open) dialog.close();
  }

  function update(state) {
    const d = state.dialogs;
    sync(progress, d.progress, () => existingProgress(state));
    if (progress.open && !progress.contains(document.activeElement)) progress.querySelector('[data-fid="continue"]')?.focus();

    sync(photo, Boolean(d.photo), () => {
      const meta = REFERENCE_IMAGES.find((i) => i.file === d.photo);
      return el('figure', { style: 'margin:0' },
        el('img', { src: `${IMAGE_DIR}${d.photo}`, alt: meta ? meta.caption : d.photo }),
        el('figcaption', {}, el('strong', { text: meta ? meta.caption : d.photo }), ' ', meta ? meta.shows : '', ' Photographed values are historical observations, not recommended settings.',
          el('div', { class: 'dialog-actions' }, el('button', { type: 'button', class: 'btn btn-primary', text: 'Close', onclick: () => dispatch({ type: 'close-photo' }) }))));
    });

    sync(control, state.terminal.controlOpen, () => el('div', { class: 'dialog-body' },
      el('h2', { id: 'control-title', text: 'Control (GilderCommands)' }),
      el('p', { class: 'lede', text: 'In PC•MACs this small window sends standard serial show commands to the attached GilderGear (manual pages 210–211). This list is read only: no commands are sent by this trainer.' }),
      el('ul', { class: 'commands' }, ...GILDER_COMMANDS.map(([name, code]) => el('li', { text: `${name}: sends ASCII ${code}` }))),
      el('div', { class: 'dialog-actions' }, el('button', { type: 'button', class: 'btn btn-primary', text: 'Close', onclick: () => dispatch({ type: 'term-button', name: 'control' }) }))));
  }

  return { update };
}

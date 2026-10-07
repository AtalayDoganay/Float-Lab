// Start (Resume / Restart), confirm-restart, reference-photo, and the read-only
// GilderCommands "Control" window.
import { el, replace } from './dom.mjs';
import { REFERENCE_IMAGES, IMAGE_DIR } from '../content/references.mjs';

const GILDER_COMMANDS = [
  ['All Cards / Play', 'u'], ['All Cards / Select Show', '* + selection'], ['All Cards / Stop', 'y'], ['All Cards / Loop', '"'],
  ['All Cards / Stop at End', '&'], ['All Cards / Echo Off', 'b'], ['Addressed Card / Pause', '< + address'], ['Addressed Card / Play', 't + address'],
  ['Addressed Card / Select Show', '* + address + selection'], ['Addressed Card / Stop', 'y + address'], ['Addressed Card / Loop', '" + address'],
  ['Addressed Card / Resume', '> + address'], ['Addressed Card / Stop at End', '& + address'],
];

export function mountDialogs({ dispatch }) {
  const start = document.getElementById('start-dialog');
  const confirm = document.getElementById('confirm-dialog');
  const photo = document.getElementById('photo-dialog');
  const control = document.getElementById('control-dialog');

  for (const d of [photo, control]) {
    d.addEventListener('cancel', (e) => { e.preventDefault(); dispatch({ type: d === photo ? 'close-photo' : 'term-button', name: 'control' }); });
    d.addEventListener('click', (e) => { if (e.target === d) dispatch({ type: d === photo ? 'close-photo' : 'term-button', name: 'control' }); });
  }
  start.addEventListener('cancel', (e) => e.preventDefault());
  confirm.addEventListener('cancel', (e) => { e.preventDefault(); dispatch({ type: 'restart-cancel' }); });

  function sync(dialog, shouldOpen, build) {
    if (shouldOpen && !dialog.open) { replace(dialog, build()); dialog.showModal(); dialog.querySelector('button')?.focus(); }
    if (!shouldOpen && dialog.open) dialog.close();
  }

  function update(state) {
    const d = state.dialogs;
    sync(start, d.start, () => el('div', { class: 'dialog-body' },
      el('h2', { id: 'start-title', text: 'Welcome back' }),
      el('p', { class: 'lede', text: 'Saved progress was found on this computer. Resume where you left off, or start the course over. Any playback resumes paused.' }),
      el('div', { class: 'dialog-actions' },
        el('button', { type: 'button', class: 'btn btn-primary', 'data-control': 'resume', text: 'Resume learning', onclick: () => dispatch({ type: 'resume' }) }),
        el('button', { type: 'button', class: 'btn', 'data-control': 'restart', text: 'Restart learning', onclick: () => dispatch({ type: 'restart-request' }) }))));

    sync(confirm, d.confirm, () => el('div', { class: 'dialog-body' },
      el('h2', { id: 'confirm-title', text: 'Restart learning?' }),
      el('p', { class: 'lede', text: 'This clears completed lessons, answers, review topics, and exercise steps on this computer. Workspace settings return to their defaults. This cannot be undone.' }),
      el('div', { class: 'dialog-actions' },
        el('button', { type: 'button', class: 'btn', text: 'Keep my progress', onclick: () => dispatch({ type: 'restart-cancel' }) }),
        el('button', { type: 'button', class: 'btn btn-primary', text: 'Restart learning', onclick: () => dispatch({ type: 'restart-confirm' }) }))));

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

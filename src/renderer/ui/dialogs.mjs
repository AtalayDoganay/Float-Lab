// Confirm-restart, reference-photo, and the read-only GilderCommands "Control"
// window. Resume and Start over live on the Home screen, not in a dialog.
import { el, replace } from './dom.mjs';
import { REFERENCE_IMAGES, IMAGE_DIR } from '../content/references.mjs';

const GILDER_COMMANDS = [
  ['All Cards / Play', 'u'], ['All Cards / Select Show', '* + selection'], ['All Cards / Stop', 'y'], ['All Cards / Loop', '"'],
  ['All Cards / Stop at End', '&'], ['All Cards / Echo Off', 'b'], ['Addressed Card / Pause', '< + address'], ['Addressed Card / Play', 't + address'],
  ['Addressed Card / Select Show', '* + address + selection'], ['Addressed Card / Stop', 'y + address'], ['Addressed Card / Loop', '" + address'],
  ['Addressed Card / Resume', '> + address'], ['Addressed Card / Stop at End', '& + address'],
];

export function mountDialogs({ dispatch }) {
  const confirm = document.getElementById('confirm-dialog');
  const photo = document.getElementById('photo-dialog');
  const control = document.getElementById('control-dialog');

  for (const d of [photo, control]) {
    d.addEventListener('cancel', (e) => { e.preventDefault(); dispatch({ type: d === photo ? 'close-photo' : 'term-button', name: 'control' }); });
    d.addEventListener('click', (e) => { if (e.target === d) dispatch({ type: d === photo ? 'close-photo' : 'term-button', name: 'control' }); });
  }
  confirm.addEventListener('cancel', (e) => { e.preventDefault(); dispatch({ type: 'restart-cancel' }); });

  function sync(dialog, shouldOpen, build) {
    if (shouldOpen && !dialog.open) { replace(dialog, build()); dialog.showModal(); dialog.querySelector('button')?.focus(); }
    if (!shouldOpen && dialog.open) dialog.close();
  }

  function update(state) {
    const d = state.dialogs;
    sync(confirm, d.confirm, () => el('div', { class: 'dialog-body' },
      el('h2', { id: 'confirm-title', text: 'Start over?' }),
      el('p', { class: 'lede', text: 'This clears every finished lesson and step, the classic question and exercise records, and the chosen level on this computer. Workspace settings return to their defaults. A version-1 backup file, if one exists, is left alone. This cannot be undone.' }),
      el('div', { class: 'dialog-actions' },
        el('button', { type: 'button', class: 'btn', text: 'Keep my progress', onclick: () => dispatch({ type: 'restart-cancel' }) }),
        el('button', { type: 'button', class: 'btn btn-primary', text: 'Start over', onclick: () => dispatch({ type: 'restart-confirm' }) }))));

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

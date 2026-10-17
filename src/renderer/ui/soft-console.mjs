// The Soft Console, recreated from the PC•MACs manual, January 13, 2021
// edition, p. 116 (screenshot) and pp. 116-118 (behaviour). Analog sliders
// at the top with Rev, Punch Out, assignment, Value, and BUMP; digital
// buttons at the bottom in two mirrored columns. With Manual mode on, the
// sliders and buttons drive the outputs live (p. 117). The trainer shows four
// sliders assigned to the four Br-EFB axes and assigns buttons 1 and 2 to the
// two training lights; the manual's capture shows a cleared console.
import { el } from './dom.mjs';
import { win } from './win.mjs';
import { ANALOG_CHANNELS, DIGITAL_CHANNELS } from '../logic/simulation.mjs';

const PRESET = 'Roseflow trainer';

export function mountSoftConsole(container, { dispatch }) {
  const refs = { rows: [], digital: new Map() };
  const { root, body } = win({
    title: 'New Soft Console', part: 'command', cls: 'soft-console',
    extra: [el('span', { class: 'win-title-seg', text: 'No joystick found.' }), el('span', { class: 'win-title-seg', text: `Preset: ${PRESET}` })],
  });

  const head = el('div', { class: 'sc-head' }, el('span', { class: 'c-rev', text: 'Rev' }), el('span', { class: 'c-po' }, 'Punch', el('br'), 'Out'),
    el('span', { class: 'c-assign', text: 'Analog Assignments' }), el('span', { class: 'c-value', text: 'Value' }));
  const analogRows = ANALOG_CHANNELS.map((c) => {
    const rev = el('input', { type: 'checkbox', 'aria-label': `Reverse ${c.name} slider`, onchange: (e) => dispatch({ type: 'console-rev', axis: c.axis, on: e.target.checked }) });
    const value = el('span', { class: 'c-value sc-value', 'data-control': 'command-readout' });
    const slider = el('input', { type: 'range', class: 'w7range sc-slider', min: 0, max: 255, step: 1, 'data-control': 'command-slider', 'aria-label': `${c.name} slider, 0 to 255`,
      oninput: (e) => dispatch({ type: 'set-command', axis: c.axis, value: Number(e.target.value) }) });
    const bump = el('button', { type: 'button', class: 'w7btn sc-bump', 'data-control': 'bump', text: 'BUMP' });
    bump.addEventListener('pointerdown', () => dispatch({ type: 'bump', axis: c.axis, on: true }));
    for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) bump.addEventListener(ev, () => dispatch({ type: 'bump', axis: c.axis, on: false }));
    bump.addEventListener('keydown', (e) => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); dispatch({ type: 'bump', axis: c.axis, on: true }); } });
    bump.addEventListener('keyup', (e) => { if (e.key === ' ' || e.key === 'Enter') dispatch({ type: 'bump', axis: c.axis, on: false }); });
    refs.rows.push({ axis: c.axis, rev, value, slider });
    return el('div', { class: 'sc-row' },
      el('span', { class: 'c-rev' }, rev), el('span', { class: 'c-po' }, el('input', { type: 'checkbox', 'aria-label': `Punch out ${c.name}`, disabled: true })),
      el('select', { class: 'w7select c-assign', disabled: true, 'aria-label': `Slider ${c.axis + 1} assignment` }, el('option', { text: c.name })),
      value, slider, bump);
  });

  const pad = el('fieldset', { class: 'sc-pad' }, el('legend', { text: 'Mouse Landing Pad & Message Box' }), el('div', { class: 'cw-bar' }), el('div', { class: 'cw-bar' }));

  const note = (text) => () => dispatch({ type: 'pc-note', text });
  const controls = el('div', { class: 'sc-controls' },
    el('label', {}, 'Sliders Displayed ', el('select', { class: 'w7select', disabled: true, 'aria-label': 'Sliders Displayed' }, el('option', { text: '4' }))),
    el('label', {}, 'Buttons Displayed ', el('select', { class: 'w7select', disabled: true, 'aria-label': 'Buttons Displayed' }, el('option', { text: '8' }))),
    el('button', { type: 'button', class: 'w7btn', text: 'Find Joystick', onclick: note('Find Joystick looks for a USB console or joystick (manual p. 116). The trainer never touches USB devices.') }),
    el('select', { class: 'w7select', disabled: true, 'aria-label': 'Console preset' }, el('option', { text: PRESET })),
    el('button', { type: 'button', class: 'w7btn', text: 'Save Preset', onclick: note('Save Preset stores the console assignments as a preset (manual p. 118). Presets are not simulated.') }));

  const digitalButton = (n) => {
    const ch = DIGITAL_CHANNELS[n - 1];
    const b = el('button', { type: 'button', class: 'w7btn sc-num', 'data-control': 'console-button', text: String(n), 'aria-label': `Digital input ${n}${ch ? `, ${ch.name}` : ', unassigned'}` });
    if (ch) {
      b.addEventListener('pointerdown', () => dispatch({ type: 'console-digital', id: ch.id, down: true }));
      for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) b.addEventListener(ev, () => dispatch({ type: 'console-digital', id: ch.id, down: false }));
      b.addEventListener('keydown', (e) => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); dispatch({ type: 'console-digital', id: ch.id, down: true }); } });
      b.addEventListener('keyup', (e) => { if (e.key === ' ' || e.key === 'Enter') dispatch({ type: 'console-digital', id: ch.id, down: false }); });
      refs.digital.set(ch.id, b);
    }
    return b;
  };
  const assign = (n) => el('select', { class: 'w7select', disabled: true, 'aria-label': `Button ${n} assignment` }, el('option', { text: DIGITAL_CHANNELS[n - 1]?.name ?? 'Unassigned' }));
  const box = () => el('input', { type: 'checkbox', disabled: true, 'aria-hidden': 'true', tabindex: '-1' });
  const dhead = el('div', { class: 'sc-dhead' }, el('span', { text: 'Alt' }), el('span', {}, 'Punch', el('br'), 'Out'), el('span', { class: 'grow', text: 'Digital Assignments' }), el('span'), el('span'),
    el('span', { class: 'grow', text: 'Digital Assignments' }), el('span', {}, 'Punch', el('br'), 'Out'), el('span', { text: 'Alt' }));
  const drows = [1, 2, 3, 4].map((n) => el('div', { class: 'sc-drow' }, box(), box(), assign(n), digitalButton(n), digitalButton(n + 4), assign(n + 4), box(), box()));

  body.append(head, ...analogRows, pad, controls, dhead, ...drows);
  container.append(root);

  function update(state, revealed = []) {
    const { sim } = state;
    root.hidden = !(revealed.includes('command') || sim.windows.console);
    if (root.hidden) return;
    for (const r of refs.rows) {
      const v = sim.console[r.axis];
      r.value.textContent = String(sim.bump === r.axis ? 255 : v);
      if (Number(r.slider.value) !== v) r.slider.value = String(v);
      r.rev.checked = Boolean(sim.consoleRev[r.axis]);
      r.slider.classList.toggle('reversed', Boolean(sim.consoleRev[r.axis]));
      // The lesson highlight for the slider and value follows the selected axis.
      if (r.axis === sim.axis) { r.slider.dataset.target = 'command-slider'; r.value.dataset.target = 'command-readout'; }
      else { delete r.slider.dataset.target; delete r.value.dataset.target; }
    }
    for (const [id, b] of refs.digital) b.classList.toggle('pressed', Boolean(sim.consoleDigital[id]));
  }

  return { update };
}

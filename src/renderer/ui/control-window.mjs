// The Main Control Window ("Control Window"), recreated from the PC•MACs
// manual, January 13, 2021 edition, p. 201 (screenshot) and pp. 201-206
// (behaviour). Six transport buttons with the current mode drawn inverted,
// the show time, six checkboxes, the sequencer / preset / skew row, and the
// five time sliders. Play, Stop, Pause / Continue, Manual, Loop, and the
// Start and Stop sliders are simulated; the rest are drawn as photographed
// in the manual and say so when used.
import { el } from './dom.mjs';
import { win, clockFace } from './win.mjs';
import { LAST_FRAME, formatTime, parseTime } from '../logic/simulation.mjs';

const SLIDERS = [
  ['start', 'Start:'],
  ['stop', 'Stop:'],
  ['punchIn', 'Punch In:'],
  ['punchOut', 'Punch Out:'],
  ['audioCue', 'Audio Cue:'],
];

const CHECKS = [
  ['autoPunch', 'Auto-Punch'], ['manual', 'Manual'], ['easeIn', 'Ease-In'],
  ['audioCue', 'Audio Cue'], ['loop', 'Loop'], ['autoInbetween', 'Auto-Inbetweening'],
];

export function mountControlWindow(container, { dispatch }) {
  const refs = { buttons: {}, checks: {}, sliders: {} };
  const { root, body } = win({ title: 'Control Window', part: 'transport', cls: 'control-window', align: 'center' });
  root.querySelector('.win-ctl').remove(); // the manual's capture shows no min / max / close boxes

  const button = (name, label, control) => {
    const b = el('button', { type: 'button', class: 'w7btn cw-btn', 'data-control': control, text: label, onclick: () => dispatch({ type: name }) });
    refs.buttons[name] = b;
    return b;
  };
  const buttons = el('div', { class: 'cw-buttons' },
    button('play', 'Play', 'play'),
    button('record', 'Record', 'record'),
    button('rehearse', 'Rehearse', 'record'),
    button('stop', 'Stop', 'stop'),
    button('pause', 'Pause', 'pause'),
    button('offline', 'OffLine', 'offline-button'));

  refs.time = el('div', { class: 'cw-time', 'data-control': 'time-readout', tabindex: '0', 'aria-label': 'Show time' });
  refs.easeLight = el('span', { class: 'cw-ease-light', 'aria-hidden': 'true' });
  const checks = el('div', { class: 'cw-checks' }, ...CHECKS.map(([key, label]) => {
    const input = el('input', { type: 'checkbox', onchange: (e) => dispatch({ type: 'set-check', key, on: e.target.checked }) });
    refs.checks[key] = input;
    const control = key === 'manual' ? 'manual-mode' : key === 'loop' ? 'loop-check' : 'control-checks';
    return el('label', { class: 'w7check', 'data-control': control }, input, label, key === 'easeIn' ? refs.easeLight : null);
  }));

  const presetRow = el('div', { class: 'cw-preset-row' },
    el('div', { class: 'cw-col seq' }, el('span', { text: 'Select Sequencer' }),
      el('select', { class: 'w7select', 'data-control': 'sequencer', 'aria-label': 'Select Sequencer', disabled: true }, el('option', { text: 'Roseflow training show' }))),
    el('div', { class: 'cw-col preset' }, el('span', { text: 'Load Preset  (Shift to Save)' }),
      el('button', { type: 'button', class: 'w7btn', 'data-control': 'console-preset', text: 'Load Preset', onclick: () => dispatch({ type: 'pc-note', text: 'Load Preset loads a Soft Console preset; Shift-click saves one (manual p. 205). Console presets are not simulated.' }) })),
    el('div', { class: 'cw-col skew' }, el('span', { text: 'Skew:' }),
      el('input', { type: 'text', class: 'field', value: '00', readonly: true, 'data-control': 'skew', 'aria-label': 'Skew' })));

  const sliders = el('div', { class: 'cw-sliders', 'data-control': 'transport-markers' }, ...SLIDERS.map(([key, label]) => {
    const field = el('input', { type: 'text', class: 'field', 'aria-label': `${label.replace(':', '')} time`, spellcheck: 'false' });
    const range = el('input', { type: 'range', class: 'w7range', min: 0, max: LAST_FRAME, step: 1, 'aria-label': `${label.replace(':', '')} time slider`,
      oninput: (e) => dispatch({ type: 'set-transport-time', which: key, frame: Number(e.target.value) }) });
    const commit = () => {
      const f = parseTime(field.value);
      if (f === null || f > LAST_FRAME) { dispatch({ type: 'pc-note', text: `Type a time between 00:00:00.00 and ${formatTime(LAST_FRAME)}, as hh:mm:ss.ff.` }); return; }
      dispatch({ type: 'set-transport-time', which: key, frame: f });
    };
    field.addEventListener('change', commit);
    field.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); commit(); } });
    refs.sliders[key] = { field, range };
    return el('div', { class: 'cw-slider' }, el('div', { class: 'cw-slider-top' }, el('span', { class: 'cw-label', text: label }), field, clockFace()), range);
  }));

  // Two unlabelled sunken bars close the window in the manual's capture; what
  // they display is not stated, so they stay empty.
  body.append(buttons, el('div', { class: 'cw-sep' }), el('div', { class: 'cw-row2' }, refs.time, checks), el('div', { class: 'cw-sep' }), presetRow, el('div', { class: 'cw-sep' }), sliders,
    el('div', { class: 'cw-bar', 'aria-hidden': 'true' }), el('div', { class: 'cw-bar tall', 'aria-hidden': 'true' }));
  container.append(root);

  function update(state, revealed = []) {
    const { sim } = state;
    root.hidden = !(revealed.includes('transport') || sim.windows.control);
    if (root.hidden) return;
    const mode = sim.mode;
    for (const [name, b] of Object.entries(refs.buttons)) b.classList.toggle('active', name === mode);
    refs.buttons.pause.textContent = mode === 'pause' ? 'Continue' : 'Pause';
    refs.time.textContent = formatTime(sim.frame);
    for (const [key, input] of Object.entries(refs.checks)) input.checked = Boolean(sim.checks[key]);
    for (const [key, { field, range }] of Object.entries(refs.sliders)) {
      if (document.activeElement !== field) field.value = formatTime(sim[key]);
      if (Number(range.value) !== sim[key]) range.value = String(sim[key]);
    }
  }

  return { update };
}

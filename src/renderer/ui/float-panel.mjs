// The trainer's own panel under the recreated PC•MACs windows: a simulated
// float that shows what the outputs would do (two lanterns and one actuator),
// the measurement model, and two hypothetical calculators. None of this is
// part of PC•MACs, and the panel says so; it is styled as the trainer, not as
// the recreated software.
import { el, helpButton, evidenceChip } from './dom.mjs';
import {
  DIGITAL_CHANNELS, axisToDmx, percentOf, formatPercent, calibratedTarget, classifyLaptopIp,
  CONTROLLER_IP, GATEWAY, NETMASK,
} from '../logic/simulation.mjs';
import { outputSource } from '../logic/outputs.mjs';

const NETWORK_TEXT = {
  'same-subnet': 'Same subnet, different host. Local communication is possible if the rest of the setup is correct.',
  duplicate: 'Duplicate address: this would conflict with the controller.',
  'different-subnet': 'Different subnet under /24: communication would require appropriate routing.',
};

const SOURCE_TEXT = {
  show: 'Outputs follow the show: the value of each channel at the frame being played.',
  manual: 'Manual mode is on: the Soft Console sliders and buttons drive the outputs live.',
  hold: 'Stopped with Manual off: outputs hold the show’s values at the current frame. Soft Console sliders do not reach them.',
};

export function mountFloatPanel(container, { dispatch }) {
  const refs = { lamps: new Map() };

  const lamps = DIGITAL_CHANNELS.map((c) => {
    const lamp = el('span', { class: 'lamp', 'aria-hidden': 'true' });
    const text = el('span');
    refs.lamps.set(c.id, { lamp, text });
    return el('div', { class: 'lamp-wrap', 'data-control': 'float-lamp', tabindex: '0' }, lamp, text);
  });
  refs.source = el('p', { class: 'fp-source' });
  const lights = el('div', { class: 'fp-block', 'data-part': 'transport' }, el('h3', { text: 'Lanterns' }), el('div', { class: 'fp-lamps' }, ...lamps), refs.source);

  refs.axisTitle = el('h3');
  refs.outBar = el('div', { class: 'fp-fill out' });
  refs.measBar = el('div', { class: 'fp-mark meas' });
  refs.outText = el('div', { class: 'fp-num out', 'data-control': 'float-output', tabindex: '0' });
  refs.measText = el('div', { class: 'fp-num meas', 'data-control': 'measure-readout', tabindex: '0' });
  refs.run = el('button', { type: 'button', class: 'btn btn-small', 'data-control': 'measure-run', onclick: () => dispatch({ type: 'run-measure' }) });
  const actuator = el('div', { class: 'fp-block', 'data-part': 'measure' },
    el('div', { class: 'with-help' }, refs.axisTitle, evidenceChip('simplified'), helpButton('measure-readout')),
    el('div', { class: 'fp-track', 'aria-hidden': 'true' }, refs.outBar, refs.measBar),
    refs.outText, refs.measText,
    el('div', { class: 'btn-row' }, refs.run, helpButton('measure-run'),
      el('button', { type: 'button', class: 'btn btn-small', 'data-control': 'measure-reset', text: 'Reset', onclick: () => dispatch({ type: 'reset-measure' }) }), helpButton('measure-reset')));

  refs.ipSelect = el('select', { 'data-control': 'laptop-ip-select', 'aria-label': 'Hypothetical laptop IP', onchange: (e) => dispatch({ type: 'select-laptop-ip', ip: e.target.value }) },
    ...['192.168.0.20', '192.168.1.20', '192.168.0.10'].map((ip) => el('option', { value: ip, text: ip })));
  refs.netResult = el('p', { class: 'fp-result', 'data-control': 'network-result', tabindex: '0' });
  const network = el('div', { class: 'fp-block', 'data-part': 'network' },
    el('div', { class: 'with-help' }, el('h3', { text: 'Hypothetical laptop address' }), helpButton('laptop-ip-select')),
    refs.ipSelect, refs.netResult,
    el('p', { class: 'fp-small', text: `Controller in photo 10: ${CONTROLLER_IP}, mask ${NETMASK}, gateway ${GATEWAY}.` }));

  refs.calSelect = el('select', { 'data-control': 'calibration-range', 'aria-label': 'Example maximum travel', onchange: (e) => dispatch({ type: 'set-calibration', cm: Number(e.target.value) }) },
    ...[10, 20, 40].map((cm) => el('option', { value: cm, text: `${cm} cm` })));
  refs.calText = el('p', { class: 'fp-result' });
  const calibration = el('div', { class: 'fp-block', 'data-part': 'calibration' },
    el('div', { class: 'with-help' }, el('h3', { text: 'Example travel range' }), evidenceChip('simplified'), helpButton('calibration-range')),
    refs.calSelect, refs.calText);

  const root = el('section', { class: 'float-panel', 'aria-label': 'Simulated float, trainer only' },
    el('header', {}, el('strong', { text: 'Simulated float' }), el('span', { text: 'Trainer only. Not part of PC•MACs, and nothing here reaches real equipment.' })),
    el('div', { class: 'fp-grid' }, lights, actuator, network, calibration));
  container.append(root);
  const blocks = [lights, actuator, network, calibration];

  function update(state, revealed = []) {
    const { sim } = state;
    for (const b of blocks) b.hidden = !revealed.includes(b.dataset.part);
    root.hidden = blocks.every((b) => b.hidden);
    if (root.hidden) return;

    const source = outputSource(sim);
    for (const c of DIGITAL_CHANNELS) {
      const { lamp, text } = refs.lamps.get(c.id);
      const on = sim.outputs.lights[c.id];
      lamp.classList.toggle('on', on);
      text.textContent = `${c.name}: ${on ? 'lit' : 'dark'}`;
    }
    refs.source.textContent = SOURCE_TEXT[source];

    const out = sim.outputs.analogs[sim.axis];
    const pct = percentOf(out);
    refs.axisTitle.textContent = `Axis ${sim.axis} (DMX ${axisToDmx(sim.axis)}) actuator`;
    refs.outBar.style.width = `${pct}%`;
    refs.measBar.style.left = `${sim.measured}%`;
    refs.outText.textContent = `Commanded output ${out} / 255 (${formatPercent(out)})`;
    refs.measText.textContent = `Simulated position ${sim.measured.toFixed(1)}%, error ${(pct - sim.measured).toFixed(1)} points`;
    refs.run.textContent = sim.measuring ? 'Pause model' : 'Run model';

    if (refs.ipSelect.value !== sim.laptopIp) refs.ipSelect.value = sim.laptopIp;
    refs.netResult.textContent = NETWORK_TEXT[classifyLaptopIp(sim.laptopIp)];
    if (Number(refs.calSelect.value) !== sim.calibrationCm) refs.calSelect.value = String(sim.calibrationCm);
    refs.calText.textContent = `Soft Console value ${sim.command} points to ${calibratedTarget(sim.command, sim.calibrationCm).toFixed(2)} cm in this linear 0–${sim.calibrationCm} cm example. Hypothetical, not measured.`;
  }

  return { update };
}

// The training workspace: ruler, analog pane, digital pane, transport, and
// readouts, arranged after the OffLine Editing Window description in the
// PC•MACs manual (pages 76–78) and labeled as a teaching simplification.
import { el, replace, helpButton, evidenceChip } from './dom.mjs';
import {
  BLOCK_COUNT, DIGITAL_CHANNELS, AXIS_COUNT, axisToDmx, percentOf, formatPercent,
  formatShowTime, blocksToIntervals, calibratedTarget, CONTROLLER_IP, GATEWAY, NETMASK,
} from '../logic/simulation.mjs';
import { classifyLaptopIp } from '../logic/simulation.mjs';

const NETWORK_TEXT = {
  'same-subnet': 'Same subnet, different host. Local communication is possible if the rest of the setup is correct.',
  'duplicate': 'Duplicate address: this would conflict with the controller.',
  'different-subnet': 'Different subnet under /24: communication would require appropriate routing.',
};

function gridlines() {
  const lines = [];
  for (let i = 0; i <= BLOCK_COUNT * 2; i += 1) {
    const major = i % 2 === 0;
    lines.push(el('div', { class: `gridline ${major ? 'major' : ''}`, style: `left:${(i / (BLOCK_COUNT * 2)) * 100}%` }));
  }
  return lines;
}

export function mountWorkspace(container, { dispatch }) {
  const refs = {};

  // Ruler
  const rulerTicks = [];
  // Labels every two seconds with plain ticks between, as the photographed
  // ruler labels only some markers.
  for (let s = 0; s <= BLOCK_COUNT; s += 1) {
    // The end marker is red and the transport shows "End 00:00:08.00", so the
    // last tick carries no text; labels would collide at narrow widths.
    const labeled = s % 2 === 0 && s < BLOCK_COUNT;
    rulerTicks.push(el('div', { class: `tick ${s === BLOCK_COUNT ? 'end' : ''} ${labeled ? '' : 'minor'}`, style: `left:${(s / BLOCK_COUNT) * 100}%` },
      labeled ? el('div', { text: '0 min' }) : null, labeled ? el('div', { text: `${String(s).padStart(2, '0')} sec` }) : null));
  }
  const ruler = el('div', { class: 'lane ruler' },
    el('div', { class: 'lane-label' }, el('div', { text: 'Roseflow training show' }), el('div', { class: 'sub', text: '8 seconds, 30 frames per second' })),
    el('div', { class: 'plot' }, ...rulerTicks));

  // Analog pane
  refs.axisSelect = el('select', { 'data-control': 'axis-select', 'aria-label': 'Select an axis', onchange: (e) => dispatch({ type: 'select-axis', axis: Number(e.target.value) }) },
    ...Array.from({ length: AXIS_COUNT }, (_, i) => el('option', { value: i, text: `Axis ${i}` })));
  refs.axisSub = el('div', { class: 'sub' });
  refs.cmdLine = el('div', { class: 'cmd-line' });
  refs.measLine = el('div', { class: 'meas-line' });
  refs.playheadA = el('div', { class: 'playhead', hidden: true });
  const analog = el('div', { class: 'lane analog' },
    el('div', { class: 'lane-label' },
      el('div', { class: 'with-help' }, el('span', { text: 'Analog (0–100%)' }), helpButton('axis-select')),
      refs.axisSelect, refs.axisSub),
    el('div', { class: 'plot' }, ...gridlines(),
      el('div', { class: 'scale-label', style: 'top:2px', text: '100%' }),
      el('div', { class: 'scale-label', style: 'bottom:2px', text: '0%' }),
      el('div', { class: 'marker start', style: 'left:0' }),
      el('div', { class: 'marker end', style: 'left:100%' }),
      refs.cmdLine, refs.measLine, refs.playheadA));

  // Digital pane
  refs.rows = new Map();
  const digitalRows = DIGITAL_CHANNELS.map((ch) => {
    const label = el('button', { type: 'button', 'data-control': 'channel-select', 'aria-pressed': 'false', onclick: () => dispatch({ type: 'select-channel', id: ch.id }) },
      el('div', { text: ch.name }), el('div', { class: 'sub', text: 'digital, training channel' }));
    const blocks = Array.from({ length: BLOCK_COUNT }, (_, i) =>
      el('button', { type: 'button', class: 'block', 'data-control': 'timeline-block', 'data-index': i, 'aria-pressed': 'false', 'aria-label': `${ch.name}, second ${i}: OFF`, onclick: () => dispatch({ type: 'toggle-block', index: i, channelId: ch.id }) },
        el('span', { class: 'bar' })));
    const blocksWrap = el('div', { class: 'blocks', 'data-target': 'timeline-block' }, ...gridlines(), ...blocks);
    const playhead = el('div', { class: 'playhead', hidden: true });
    blocksWrap.append(playhead);
    const row = el('div', { class: 'lane drow' }, el('div', { class: 'lane-label' }, label), el('div', { class: 'plot' }, blocksWrap));
    refs.rows.set(ch.id, { label, blocks, playhead, blocksWrap });
    return row;
  });
  const digital = el('div', { class: 'digital' },
    el('div', { class: 'lane' }, el('div', { class: 'lane-label lane-head' }, el('span', { text: 'Digital (on/off)' }), helpButton('channel-select'), helpButton('timeline-block')), el('div', { class: 'plot', style: 'min-height:0' })),
    ...digitalRows);

  // Transport
  refs.time = el('div', { class: 'time', 'data-control': 'time-readout', tabindex: '0' });
  refs.play = el('button', { type: 'button', class: 'winbtn', 'data-control': 'play', text: 'Play', onclick: () => dispatch({ type: 'play' }) });
  refs.stop = el('button', { type: 'button', class: 'winbtn', 'data-control': 'stop', text: 'Stop', onclick: () => dispatch({ type: 'stop' }) });
  refs.lamp = el('span', { class: 'lamp', 'aria-hidden': 'true' });
  refs.lampText = el('span');
  const transport = el('div', { class: 'transport' },
    refs.time,
    refs.play, helpButton('play'), refs.stop, helpButton('stop'),
    el('div', { class: 'lamp-wrap' }, refs.lamp, refs.lampText),
    el('div', { class: 'end-time', text: `End ${formatShowTime(BLOCK_COUNT)}` }));

  // Readouts
  refs.cmdTitle = el('h3');
  refs.cmdValue = el('div', { class: 'value' });
  refs.cmdSub = el('div', { class: 'sub' });
  refs.cmdSlider = el('input', { type: 'range', min: 0, max: 255, step: 1, 'data-control': 'command-slider', 'aria-label': 'Command value 0 to 255', oninput: (e) => dispatch({ type: 'set-command', value: Number(e.target.value) }) });
  const commandReadout = el('div', { class: 'readout command', 'data-control': 'command-readout', tabindex: '0' },
    el('div', { class: 'with-help' }, refs.cmdTitle, helpButton('command-readout')),
    refs.cmdValue, refs.cmdSub, refs.cmdSlider, el('div', { class: 'with-help' }, el('span', { class: 'sub', text: 'Command slider, 0–255' }), helpButton('command-slider')));

  refs.measValue = el('div', { class: 'value' });
  refs.measSub = el('div', { class: 'sub' });
  refs.measRun = el('button', { type: 'button', class: 'winbtn', 'data-control': 'measure-run', text: 'Run model', onclick: () => dispatch({ type: 'run-measure' }) });
  refs.measReset = el('button', { type: 'button', class: 'winbtn', 'data-control': 'measure-reset', text: 'Reset', onclick: () => dispatch({ type: 'reset-measure' }) });
  const measureReadout = el('div', { class: 'readout measure', 'data-control': 'measure-readout', tabindex: '0' },
    el('div', { class: 'with-help' }, el('h3', {}, 'Simulated measurement ', evidenceChip('simplified')), helpButton('measure-readout')),
    refs.measValue, refs.measSub,
    el('div', { class: 'btn-row' }, refs.measRun, helpButton('measure-run'), refs.measReset, helpButton('measure-reset')));

  refs.ipSelect = el('select', { 'data-control': 'laptop-ip-select', 'aria-label': 'Hypothetical laptop IP', onchange: (e) => dispatch({ type: 'select-laptop-ip', ip: e.target.value }) },
    ...['192.168.0.20', '192.168.1.20', '192.168.0.10'].map((ip) => el('option', { value: ip, text: ip })));
  refs.netResult = el('div', { class: 'sub', 'data-control': 'network-result', tabindex: '0', style: 'margin-top:6px;color:var(--ink)' });
  const networkReadout = el('div', { class: 'readout' },
    el('div', { class: 'with-help' }, el('h3', { text: 'Hypothetical laptop IP (same mask)' }), helpButton('laptop-ip-select')),
    refs.ipSelect, refs.netResult,
    el('div', { class: 'sub', text: `Controller in photo: ${CONTROLLER_IP} /24, mask ${NETMASK}, gateway ${GATEWAY}` }),
    el('div', { class: 'with-help' }, el('span', { class: 'sub', text: 'Result' }), helpButton('network-result')));

  refs.calSelect = el('select', { 'data-control': 'calibration-range', 'aria-label': 'Example maximum travel', onchange: (e) => dispatch({ type: 'set-calibration', cm: Number(e.target.value) }) },
    ...[10, 20, 40].map((cm) => el('option', { value: cm, text: `${cm} cm` })));
  refs.calText = el('div', { class: 'sub' });
  const calibrationReadout = el('div', { class: 'readout' },
    el('div', { class: 'with-help' }, el('h3', {}, 'Example travel range ', evidenceChip('simplified')), helpButton('calibration-range')),
    refs.calSelect, refs.calText);

  replace(container,
    el('div', { class: 'ws-title' }, el('h2', {}, 'OffLine Editing Window ', evidenceChip('simplified')), el('span', { class: 'sub', style: 'font-size:12.5px;color:var(--ink-soft)', text: 'Green line: playback start. Red line: playback end. Black blocks: ON.' })),
    ruler, analog, digital, transport,
    el('div', { class: 'readouts' }, commandReadout, measureReadout, networkReadout, calibrationReadout));

  function update(state) {
    const { sim } = state;
    const dmx = axisToDmx(sim.axis);
    if (Number(refs.axisSelect.value) !== sim.axis) refs.axisSelect.value = String(sim.axis);
    refs.axisSub.textContent = `displayed DMX address ${dmx} (${sim.axis}), card 1`;

    const pct = percentOf(sim.command);
    refs.cmdLine.style.top = `${100 - pct}%`;
    refs.cmdLine.dataset.label = `command ${sim.command} (${formatPercent(sim.command)})`;
    refs.measLine.style.top = `${100 - sim.measured}%`;
    refs.measLine.dataset.label = `simulated measurement ${sim.measured.toFixed(1)}%`;

    for (const [id, row] of refs.rows) {
      const selected = id === sim.channelId;
      row.label.setAttribute('aria-pressed', String(selected));
      const blocks = sim.blocksByChannel[id];
      row.blocks.forEach((b, i) => {
        const on = blocks[i];
        b.setAttribute('aria-pressed', String(on));
        b.setAttribute('aria-label', `${DIGITAL_CHANNELS.find((c) => c.id === id).name}, second ${i}: ${on ? 'ON' : 'OFF'}`);
        b.classList.toggle('is-playing', sim.playing && selected && sim.tick === i);
      });
      row.playhead.hidden = !sim.playing;
      row.playhead.style.left = `${((sim.tick + 0.5) / BLOCK_COUNT) * 100}%`;
    }
    refs.playheadA.hidden = !sim.playing;
    refs.playheadA.style.left = `${((sim.tick + 0.5) / BLOCK_COUNT) * 100}%`;

    replace(refs.time, formatShowTime(sim.playing ? sim.tick : 0), el('small', { text: sim.playing ? 'show time (playing)' : 'show time (stopped)' }));
    refs.lamp.classList.toggle('on', sim.lampOn);
    const chName = DIGITAL_CHANNELS.find((c) => c.id === sim.channelId).name;
    refs.lampText.textContent = `${chName}: ${sim.playLabel}`;
    refs.play.textContent = sim.playing ? 'Play (restart)' : 'Play';

    refs.cmdTitle.textContent = `Command (requested), axis ${sim.axis}, DMX ${dmx}`;
    refs.cmdValue.textContent = `${sim.command} / 255`;
    refs.cmdSub.textContent = `${formatPercent(sim.command)} of the 8-bit range. A request, not a measurement.`;
    if (Number(refs.cmdSlider.value) !== sim.command) refs.cmdSlider.value = String(sim.command);

    refs.measValue.textContent = `${sim.measured.toFixed(1)}%`;
    refs.measSub.textContent = `error (command minus measurement): ${(pct - sim.measured).toFixed(1)} points`;
    refs.measRun.textContent = sim.measuring ? 'Pause model' : 'Run model';

    if (refs.ipSelect.value !== sim.laptopIp) refs.ipSelect.value = sim.laptopIp;
    refs.netResult.textContent = NETWORK_TEXT[classifyLaptopIp(sim.laptopIp)];

    if (Number(refs.calSelect.value) !== sim.calibrationCm) refs.calSelect.value = String(sim.calibrationCm);
    refs.calText.textContent = `Command ${sim.command} points to ${calibratedTarget(sim.command, sim.calibrationCm).toFixed(2)} cm in this linear 0–${sim.calibrationCm} cm example. Hypothetical, not measured.`;

    const intervals = blocksToIntervals(sim.blocksByChannel[sim.channelId]);
    refs.rows.get(sim.channelId).blocksWrap.title = intervals.length
      ? `ON ${intervals.map((iv) => `${iv.start}–${iv.end} s`).join(', ')}`
      : 'No ON blocks';
  }

  return { update };
}

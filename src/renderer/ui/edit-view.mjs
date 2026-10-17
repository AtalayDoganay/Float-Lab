// The OffLine Editing Window ("Edit View"), recreated from the PC•MACs manual
// (January 13, 2021 edition): the quick tour on pp. 76-78, selection on
// pp. 81-85, and the Edit menu commands on pp. 176-178. Time runs along the
// top in frames and seconds; analogs (0-100%) sit in the upper pane and
// digitals in the lower; a selected stretch of time has a yellow background
// and selected channels are drawn fatter; the green, blue, orange, and red
// lines are the Start, Punch In, Punch Out, and Stop transport markers.
//
// Mouse handling follows the manual: LeftClick-and-slide on a channel selects
// that channel for a stretch of time, on empty space selects every displayed
// channel; <shift>+LeftClick adds or removes a channel, or extends the time
// on empty space; RightClick-and-slide on a digital draws or undraws it;
// RightClick away from channels opens the shortcut menu; double-clicking
// empty space sets the playback Start time.
import { el, replace } from './dom.mjs';
import { win, svg, clockFace } from './win.mjs';
import {
  FRAME_COUNT, FPS, SHOW_SECONDS, ANALOG_CHANNELS, DIGITAL_CHANNELS,
  formatTime, formatCursor, parseTime, percentOf, channelName,
} from '../logic/simulation.mjs';

const ANALOG_H = 200;
// Digital rows sit 12 px apart (pixels sampled from the manual's p. 76 capture).
const ROW_H = 12;
const ROW_TOP = 14;
const DIGITAL_H = ROW_TOP + DIGITAL_CHANNELS.length * ROW_H + 20;
const HIT_PX = 6;
// Frame-number labels on the ruler at each zoom (Time In / Time Out).
const LABEL_STEP = { 1: 10, 2: 4, 4: 2 };

function stepPath(values, from = 0, to = FRAME_COUNT) {
  const y = (v) => (100 - percentOf(v)).toFixed(2);
  let d = `M${from} ${y(values[from])}`;
  for (let f = from + 1; f < to; f += 1) if (values[f] !== values[f - 1]) d += ` H${f} V${y(values[f])}`;
  return `${d} H${to}`;
}

function spans(frames, from = 0, to = FRAME_COUNT) {
  const out = [];
  let start = null;
  for (let f = from; f <= to; f += 1) {
    const on = f < to && frames[f];
    if (on && start === null) start = f;
    if (!on && start !== null) { out.push([start, f]); start = null; }
  }
  return out;
}

export function mountEditView(container, { dispatch, onContextMenu }) {
  const refs = {};
  let last = null; // last state rendered, for pointer handlers
  let drag = null;

  const { root, body } = win({ title: 'Edit View', part: 'title', cls: 'edit-view', align: 'center', label: 'Edit View (OffLine Editing Window)' });

  // ---------- ruler ----------
  refs.rulerInner = el('div', { class: 'ev-ruler-inner' });
  const ruler = el('div', { class: 'ev-ruler', 'data-part': 'ruler', 'data-control': 'time-ruler', tabindex: '0', 'aria-label': `Time ruler, 0 to ${SHOW_SECONDS} seconds at ${FPS} frames per second` }, refs.rulerInner);

  // ---------- analog pane ----------
  refs.aSvg = svg('svg', { class: 'ev-svg', viewBox: `0 0 ${FRAME_COUNT} 100`, preserveAspectRatio: 'none', 'aria-hidden': 'true' });
  refs.aPlot = el('div', { class: 'ev-plot ev-analog', 'data-part': 'analog', 'data-control': 'analog-pane', tabindex: '0', 'aria-label': 'Analog pane, 0 to 100 percent' });
  refs.aPlot.append(refs.aSvg);
  refs.aNames = el('div', { class: 'ev-names analog-names' });
  refs.aScale = el('div', { class: 'ev-scale', 'aria-hidden': 'true' }, ...['100.0%', '75.0%', '50.0%', '25.0%', '0.0%'].map((t, i) => el('span', { text: t, style: `top:${i * 25}%` })));
  refs.aMargin = el('div', { class: 'ev-margin ev-margin-analog', 'data-part': 'analog' }, refs.aNames, refs.aScale);
  refs.analogNameBtns = new Map(ANALOG_CHANNELS.map((c) => {
    const b = el('button', { type: 'button', class: 'ev-name', 'data-control': 'axis-select', 'data-channel': c.id, style: `color:${c.color}`, text: c.name,
      onclick: (e) => dispatch({ type: 'select-name', id: c.id, toggle: e.ctrlKey || e.shiftKey }) });
    return [c.id, b];
  }));
  refs.aNames.append(...refs.analogNameBtns.values());

  // ---------- digital pane ----------
  refs.dSvg = svg('svg', { class: 'ev-svg', viewBox: `0 0 ${FRAME_COUNT} ${DIGITAL_H}`, preserveAspectRatio: 'none', 'aria-hidden': 'true' });
  refs.dPlot = el('div', { class: 'ev-plot ev-digital', 'data-part': 'digital', 'data-control': 'digital-pane', tabindex: '0', style: `height:${DIGITAL_H}px`, 'aria-label': 'Digital pane, on or off' });
  refs.dPlot.append(refs.dSvg);
  refs.digitalNameBtns = new Map(DIGITAL_CHANNELS.map((c, i) => {
    const b = el('button', { type: 'button', class: 'ev-name', 'data-control': 'channel-select', 'data-channel': c.id, style: `top:${ROW_TOP + i * ROW_H - 6}px`, text: `${c.name} Digital`,
      onclick: (e) => dispatch({ type: 'select-name', id: c.id, toggle: e.ctrlKey || e.shiftKey }) });
    return [c.id, b];
  }));
  refs.dMargin = el('div', { class: 'ev-margin ev-margin-digital', 'data-part': 'digital', style: `height:${DIGITAL_H}px` }, ...refs.digitalNameBtns.values());

  // ---------- scrolling plot column ----------
  refs.inner = el('div', { class: 'ev-inner' }, ruler, refs.aPlot, refs.dPlot);
  refs.scroller = el('div', { class: 'ev-scroller' }, refs.inner);
  refs.scroller.addEventListener('scroll', () => { if (last) renderVisibleTimes(); });
  const margin = el('div', { class: 'ev-margins' }, el('div', { class: 'ev-corner', 'data-part': 'ruler' }), refs.aMargin, refs.dMargin);
  const vbar = el('div', { class: 'ev-vbars', 'aria-hidden': 'true' }, el('div', { class: 'ev-vbar-spacer', 'data-part': 'ruler' }), el('div', { class: 'fake-vscroll', 'data-part': 'analog', style: `height:${ANALOG_H}px` }), el('div', { class: 'fake-vscroll', 'data-part': 'digital', style: `height:${DIGITAL_H}px` }));

  // ---------- status rows (manual p. 76 items D, G, I, J, K, M) ----------
  const timeField = (cls, text) => el('span', { class: `ev-time ${cls}` }, clockFace(), el('span', { class: 'field', text }));
  refs.leftTime = timeField('left', '');
  refs.centerTime = timeField('center', '');
  refs.rightTime = timeField('right', '');
  refs.selFrom = el('input', { type: 'text', class: 'field', 'aria-label': 'Start of selected time', spellcheck: 'false' });
  refs.selTo = el('input', { type: 'text', class: 'field', 'aria-label': 'End of selected time', spellcheck: 'false' });
  refs.delta = el('span', { class: 'field' });
  const commitSel = () => {
    const from = parseTime(refs.selFrom.value);
    const to = parseTime(refs.selTo.value);
    if (from === null || to === null) { dispatch({ type: 'pc-note', text: 'Type times as hh:mm:ss.ff, for example 00:00:02.15. The training show is 8 seconds long.' }); return; }
    dispatch({ type: 'select-range', from: Math.min(from, to), to: Math.max(from, to), keepChannels: true });
  };
  for (const input of [refs.selFrom, refs.selTo]) {
    input.addEventListener('change', commitSel);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); commitSel(); } });
  }
  refs.cursor = el('span', { class: 'ev-cursor', 'data-control': 'edit-cursor', tabindex: '0' });
  refs.hoverName = el('span', { class: 'ev-hover-name' });
  const status = el('div', { class: 'ev-status', 'data-part': 'ruler' },
    el('div', { class: 'ev-row' },
      refs.leftTime,
      el('span', { class: 'ev-sel', 'data-control': 'selection-times' }, clockFace(), refs.selFrom, el('span', { class: 'arrow', text: '->' }), refs.selTo, clockFace()),
      refs.centerTime,
      el('span', { class: 'ev-time delta' }, clockFace(), el('span', { text: '(' }), refs.delta, el('span', { text: ')' })),
      refs.rightTime),
    el('div', { class: 'ev-row' },
      refs.cursor,
      el('button', { type: 'button', class: 'w7btn', 'data-control': 'offline-presets', text: 'Save Offline Preset', onclick: () => dispatch({ type: 'pc-note', text: 'Save Offline Preset stores the channels and their order on this window (manual p. 78). Presets are not simulated in the trainer.' }) }),
      el('select', { class: 'w7select', 'data-control': 'offline-presets', 'aria-label': 'Offline presets', disabled: true }, el('option', { text: 'Multiple Presets' })),
      el('button', { type: 'button', class: 'w7btn', 'data-control': 'selected-channels', text: 'Selected Channels...', onclick: () => dispatch({ type: 'pc-note', text: 'Selected Channels... reopens the Move to OffLine... dialog that moves channels on and off this window (manual p. 79). The dialog is not simulated; the trainer shows four axes and two lights.' }) }),
      refs.hoverName));

  replace(body, el('div', { class: 'ev-grid' }, margin, refs.scroller, vbar), status);
  // Before a lesson opens any pane the window is an empty client area: the
  // explanation belongs in the lesson panel, not inside the recreated window.
  refs.empty = el('div', { class: 'ev-empty', 'aria-hidden': 'true' });
  body.append(refs.empty);
  container.append(root);

  // ---------- pointer handling ----------
  function frameAt(plot, clientX) {
    const r = plot.getBoundingClientRect();
    return Math.min(Math.max(Math.round(((clientX - r.left) / r.width) * FRAME_COUNT), 0), FRAME_COUNT);
  }

  function analogHit(clientX, clientY) {
    const r = refs.aPlot.getBoundingClientRect();
    const f = Math.min(frameAt(refs.aPlot, clientX), FRAME_COUNT - 1);
    let best = null;
    for (const c of ANALOG_CHANNELS) {
      const y = r.top + (1 - last.sim.analogs[c.axis][f] / 255) * r.height;
      const d = Math.abs(y - clientY);
      if (d <= HIT_PX && (!best || d < best.d)) best = { id: c.id, d };
    }
    return best ? best.id : null;
  }

  function digitalHit(clientY) {
    const r = refs.dPlot.getBoundingClientRect();
    const i = Math.round((clientY - r.top - ROW_TOP) / ROW_H);
    if (i < 0 || i >= DIGITAL_CHANNELS.length) return null;
    return Math.abs(clientY - (r.top + ROW_TOP + i * ROW_H)) <= HIT_PX ? DIGITAL_CHANNELS[i].id : null;
  }

  const displayedChannels = () => [
    ...(last.revealed.includes('analog') ? ANALOG_CHANNELS.map((c) => c.id) : []),
    ...(last.revealed.includes('digital') ? DIGITAL_CHANNELS.map((c) => c.id) : []),
  ];

  // Keep receiving moves while dragging past the pane's edge. An unknown
  // pointer id (a synthetic event) is not an error worth losing the drag over.
  function capture(plot, id) {
    try { plot.setPointerCapture(id); } catch { /* not capturable */ }
  }

  function attachPointer(plot, hit) {
    plot.addEventListener('contextmenu', (e) => e.preventDefault());
    plot.addEventListener('pointerdown', (e) => {
      if (!last || e.button > 2) return;
      plot.focus({ preventScroll: true });
      const frame = frameAt(plot, e.clientX);
      const id = hit(e.clientX, e.clientY);
      if (e.button === 2) {
        if (id && id.startsWith('light-')) {
          const on = !last.sim.lights[id][Math.min(frame, FRAME_COUNT - 1)];
          drag = { kind: 'draw', plot, id, anchor: frame, on, moved: false, last: frame };
          dispatch({ type: 'draw-begin' });
          capture(plot, e.pointerId);
        } else if (!id) {
          onContextMenu(e.clientX, e.clientY, frame);
        } else {
          dispatch({ type: 'pc-note', text: 'RightClick-and-slide on an analog uses the Rubberbanding tools (manual p. 86). Rubberbanding is not simulated; select a stretch of time and use Edit ▸ Set Analogs to a Value... instead.' });
        }
        return;
      }
      if (e.shiftKey) {
        if (id) dispatch({ type: 'select-name', id, toggle: true });
        else dispatch({ type: 'select-range', from: Math.min(last.sim.selection.from, frame), to: Math.max(last.sim.selection.to, frame), keepChannels: true });
        return;
      }
      drag = { kind: 'select', plot, anchor: frame, channels: id ? [id] : displayedChannels(), moved: false, last: frame };
      capture(plot, e.pointerId);
      dispatch({ type: 'select-range', from: frame, to: frame, channels: drag.channels, live: true });
    });
    plot.addEventListener('pointermove', (e) => {
      if (!last) return;
      const frame = frameAt(plot, e.clientX);
      const id = hit(e.clientX, e.clientY);
      hoverInfo(plot, frame, id, e.clientY);
      if (!drag || drag.plot !== plot) return;
      if (frame !== drag.anchor) drag.moved = true;
      drag.last = frame;
      const from = Math.min(drag.anchor, frame);
      const to = Math.max(drag.anchor, frame);
      if (drag.kind === 'select') dispatch({ type: 'select-range', from, to, channels: drag.channels, live: true });
      else dispatch({ type: 'draw-digital', channelId: drag.id, from, to: Math.max(to, from + 1), on: drag.on });
    });
    const end = (e) => {
      if (!drag || drag.plot !== plot) return;
      const d = drag;
      drag = null;
      // A lost capture carries no useful position; use the last one seen.
      const frame = e.type === 'lostpointercapture' ? d.last : frameAt(plot, e.clientX);
      const from = Math.min(d.anchor, frame);
      const to = Math.max(d.anchor, frame);
      if (d.kind === 'select') dispatch({ type: 'select-range', from, to, channels: d.channels });
      else dispatch({ type: 'draw-digital-done', channelId: d.id, from, to: Math.max(to, from + 1), on: d.on });
    };
    plot.addEventListener('pointerup', end);
    plot.addEventListener('pointercancel', end);
    plot.addEventListener('lostpointercapture', end);
    // The keyboard way to the shortcut menu (Menu key or Shift+F10), at the selection start.
    plot.addEventListener('keydown', (e) => {
      if (!last || !(e.key === 'ContextMenu' || (e.shiftKey && e.key === 'F10'))) return;
      e.preventDefault();
      const r = plot.getBoundingClientRect();
      const f = last.sim.selection.from;
      onContextMenu(r.left + (f / FRAME_COUNT) * r.width, r.top + r.height / 2, f);
    });
    plot.addEventListener('dblclick', (e) => {
      if (!last || hit(e.clientX, e.clientY)) return;
      dispatch({ type: 'set-transport-time', which: 'start', frame: Math.min(frameAt(plot, e.clientX), FRAME_COUNT - 1) });
    });
    plot.addEventListener('pointerleave', () => { if (last) { refs.hoverName.textContent = ''; } });
  }

  function hoverInfo(plot, frame, id, clientY) {
    let text = `Cursor:  ${formatCursor(Math.min(frame, FRAME_COUNT - 1))}`;
    if (plot === refs.aPlot) {
      const r = refs.aPlot.getBoundingClientRect();
      const pct = Math.min(Math.max((1 - (clientY - r.top) / r.height) * 100, 0), 100);
      text += `   ${pct.toFixed(1)}%`;
    }
    refs.cursor.textContent = text;
    refs.hoverName.textContent = id ? channelName(id) : '';
  }

  attachPointer(refs.aPlot, analogHit);
  attachPointer(refs.dPlot, (x, y) => digitalHit(y));

  // ---------- rendering ----------
  function renderRuler(zoom) {
    const step = LABEL_STEP[zoom] || 10;
    const nodes = [];
    for (let f = 0; f <= FRAME_COUNT; f += 1) {
      const left = `${(f / FRAME_COUNT) * 100}%`;
      const sec = f % FPS === 0;
      if (sec) {
        nodes.push(el('span', { class: 'rl-tick major', style: `left:${left}` }));
        if (f < FRAME_COUNT) nodes.push(el('span', { class: 'rl-sec', style: `left:${left}` }, el('span', { text: '0 min' }), el('span', { text: `${String(f / FPS).padStart(2, '0')} sec` })));
        if (f < FRAME_COUNT) nodes.push(el('span', { class: 'rl-num', style: `left:${left}`, text: '0' }));
      } else if (f % step === 0) {
        nodes.push(el('span', { class: 'rl-tick', style: `left:${left}` }));
        nodes.push(el('span', { class: 'rl-num', style: `left:${left}`, text: String(f % FPS) }));
      }
    }
    replace(refs.rulerInner, ...nodes);
  }

  function markers(group, sim, height) {
    // Start green, Punch In blue, Punch Out orange (solid); Stop red, dashed (manual pp. 77, 237).
    // Punch markers first so Start and Stop stay visible when they coincide.
    const lines = [['punch-in', sim.punchIn, '#0000ff'], ['punch-out', sim.punchOut, '#ffa500'], ['start', sim.start, '#00ff00'], ['stop', sim.stop, '#ff0000']];
    for (const [cls, f, color] of lines) {
      group.append(svg('line', { class: `marker ${cls}`, x1: f + 0.5, x2: f + 0.5, y1: 0, y2: height, stroke: color, 'stroke-width': 2, 'stroke-dasharray': cls === 'stop' ? '4 2' : null, 'vector-effect': 'non-scaling-stroke' }));
    }
  }

  function background(group, sim, height) {
    const { from, to } = sim.selection;
    if (to > from) group.append(svg('rect', { x: from, y: 0, width: to - from, height, fill: '#ffffa8' }));
    for (let s = 1; s < SHOW_SECONDS; s += 1) group.append(svg('line', { x1: s * FPS, x2: s * FPS, y1: 0, y2: height, class: 'grid' }));
  }

  function playhead(group, sim, height) {
    if (sim.mode === 'stop') return;
    group.append(svg('line', { class: 'playhead', x1: sim.frame, x2: sim.frame, y1: 0, y2: height, 'vector-effect': 'non-scaling-stroke' }));
  }

  function renderAnalog(sim) {
    const g = svg('g');
    background(g, sim, 100);
    for (const p of [0, 25, 50, 75, 100]) g.append(svg('line', { x1: 0, x2: FRAME_COUNT, y1: 100 - p, y2: 100 - p, class: 'grid' }));
    markers(g, sim, 100);
    const sel = sim.selection;
    for (const c of ANALOG_CHANNELS) {
      const values = sim.analogs[c.axis];
      g.append(svg('path', { d: stepPath(values), fill: 'none', stroke: c.color, 'stroke-width': 1, 'vector-effect': 'non-scaling-stroke' }));
      if (sel.to > sel.from && sel.channels.includes(c.id)) {
        g.append(svg('path', { d: stepPath(values, sel.from, sel.to), fill: 'none', stroke: c.color, 'stroke-width': 3, 'vector-effect': 'non-scaling-stroke' }));
      }
    }
    playhead(g, sim, 100);
    replace(refs.aSvg, g);
  }

  function renderDigital(sim) {
    const g = svg('g');
    background(g, sim, DIGITAL_H);
    markers(g, sim, DIGITAL_H);
    const sel = sim.selection;
    DIGITAL_CHANNELS.forEach((c, i) => {
      const y = ROW_TOP + i * ROW_H;
      const frames = sim.lights[c.id];
      g.append(svg('line', { x1: 0, x2: FRAME_COUNT, y1: y, y2: y, class: 'd-off', 'vector-effect': 'non-scaling-stroke' }));
      for (const [a, b] of spans(frames)) g.append(svg('line', { x1: a, x2: b, y1: y, y2: y, class: 'd-on', 'vector-effect': 'non-scaling-stroke' }));
      if (sel.to > sel.from && sel.channels.includes(c.id)) {
        for (const [a, b] of spans(frames, sel.from, sel.to)) g.append(svg('line', { x1: a, x2: b, y1: y, y2: y, class: 'd-on sel', 'vector-effect': 'non-scaling-stroke' }));
      }
    });
    playhead(g, sim, DIGITAL_H);
    replace(refs.dSvg, g);
  }

  function renderVisibleTimes() {
    const s = refs.scroller;
    const w = s.scrollWidth || 1;
    const left = (s.scrollLeft / w) * FRAME_COUNT;
    const right = Math.min(((s.scrollLeft + s.clientWidth) / w) * FRAME_COUNT, FRAME_COUNT - 1);
    refs.leftTime.lastChild.textContent = `[${formatTime(left)}]`;
    refs.centerTime.lastChild.textContent = `[${formatTime((left + right) / 2)}]`;
    refs.rightTime.lastChild.textContent = `[${formatTime(right)}]`;
  }

  let rulerZoom = null;
  function update(state, revealed = []) {
    const { sim } = state;
    last = { sim, revealed };
    const show = (part) => revealed.includes(part);
    for (const node of root.querySelectorAll('[data-part]')) node.hidden = !show(node.dataset.part);
    // The status rows belong with any pane, not only the ruler.
    root.querySelector('.ev-status').hidden = !(show('ruler') || show('analog') || show('digital'));
    const anyPane = show('ruler') || show('analog') || show('digital');
    root.hidden = !(anyPane || show('title'));
    root.querySelector('.ev-grid').hidden = !anyPane;
    refs.empty.hidden = anyPane;
    if (!anyPane) return;

    refs.inner.style.width = `${sim.zoom * 100}%`;
    if (rulerZoom !== sim.zoom) { renderRuler(sim.zoom); rulerZoom = sim.zoom; }
    if (show('analog')) renderAnalog(sim);
    if (show('digital')) renderDigital(sim);

    const sel = sim.selection;
    for (const [id, b] of [...refs.analogNameBtns, ...refs.digitalNameBtns]) {
      const on = sel.channels.includes(id);
      b.classList.toggle('selected', on);
      b.setAttribute('aria-pressed', String(on));
      const isCurrent = id === `axis-${sim.axis}` || id === sim.channelId;
      b.classList.toggle('current', isCurrent);
    }
    // A lesson that targets the analog selector highlights the current axis name.
    for (const [id, b] of refs.analogNameBtns) { if (id === `axis-${sim.axis}`) b.dataset.target = 'axis-select'; else delete b.dataset.target; }
    for (const [id, b] of refs.digitalNameBtns) { if (id === sim.channelId) b.dataset.target = 'channel-select'; else delete b.dataset.target; }

    if (document.activeElement !== refs.selFrom) refs.selFrom.value = formatTime(sel.from);
    if (document.activeElement !== refs.selTo) refs.selTo.value = formatTime(sel.to);
    refs.delta.textContent = `[${formatTime(sel.to - sel.from)}]`;
    if (!refs.cursor.textContent) refs.cursor.textContent = 'Cursor:  00:00.00';
    renderVisibleTimes();
  }

  return { update };
}

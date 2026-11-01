// The first digital exercise, assessed from the show data itself: Digital 0
// (channel id light-1) ON from 00:00:01.00 up to, but not including,
// 00:00:02.00 (frames 30-59, exactly 30 frames), every other channel as the
// fixture left it, and the result played back. The state names what to fix,
// in the words the brief gives Rosie; the detail adds the exact boundaries.
import { FRAME_COUNT, intervalsOf, formatTime } from './simulation.mjs';

export const SEGMENT_NAMES = Object.freeze({ 'light-1': 'Digital 0', 'light-2': 'Digital 1' });

export const TASK = Object.freeze({ channelId: 'light-1', label: 'Digital 0', on: 30, off: 60 });

// Actions that change the show data. Any of them makes the last playback
// stale: "previewed" means the data as it stands now was played back.
export const PREVIEW_EDITS = new Set(['set-digital', 'set-digital-pattern', 'draw-digital', 'draw-digital-done', 'set-analog-value', 'reset-analogs']);

const label = (sim, id) => (sim.names && sim.names[id]) || id;
const same = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);

// Which other channels differ from the fixture's baseline, by label.
function changedElsewhere(sim, task) {
  const out = [];
  const base = sim.baseline;
  if (!base) return out;
  for (const [id, frames] of Object.entries(base.lights || {})) {
    if (id !== task.channelId && sim.lights[id] && !same(sim.lights[id], frames)) out.push(label(sim, id));
  }
  (base.analogs || []).forEach((frames, axis) => {
    if (sim.analogs[axis] && !same(sim.analogs[axis], frames)) out.push(`Axis ${axis}`);
  });
  return out;
}

export function assessAttempt({ sim, task = TASK }) {
  const want = `${formatTime(task.on)} to ${formatTime(task.off)}`;
  const spans = intervalsOf(sim.lights[task.channelId] || []);
  const othersOn = Object.entries(sim.lights).filter(([id, f]) => id !== task.channelId && f.some(Boolean)).map(([id]) => label(sim, id));
  const result = (state, message, detail) => ({ state, message, detail });

  if (spans.length === 0 && othersOn.length) {
    return result('wrong-channel', 'The timing looks close—let’s check which channel received it.', `The ON data is on ${othersOn.join(' and ')}, not on ${task.label}. Select ${task.label} by its name at the left and put the event there; set the other row OFF again.`);
  }
  const changed = changedElsewhere(sim, task);
  if (changed.length) return result('other-channel-changed', `Only ${task.label} should change.`, `${changed.join(' and ')} changed too; put it back as it was.`);
  if (spans.length === 0) {
    const sel = sim.selection || { from: 0, to: 0, channels: [] };
    if (sel.to > sel.from && sel.channels.includes(task.channelId)) {
      return result('selection-no-data', 'We’ve selected where to work. Now let’s turn that section on.', 'Edit ▸ Set Digitals On (Ctrl+1) turns the selected stretch ON.');
    }
    return result('no-channel', `Let’s pick ${task.label} first.`, `Click the name ${task.label} at the left of the digital pane, then select ${want} on its row.`);
  }
  if (spans.length > 1) return result('extra-data', `${task.label} has more than one ON stretch.`, `We want exactly one: ${want}. Select the extra stretch and choose Edit ▸ Set Digitals Off (Ctrl+0).`);
  const [a, b] = spans[0];
  const now = `Right now ${task.label} is ON from ${formatTime(a)} to ${formatTime(b)}.`;
  if (a === task.on && b === task.off) {
    const p = sim.lastPlay;
    if (p && p.from <= task.on && p.to >= task.off) return result('done', 'Yes! One second ON. You got it!', `${task.label} is ON from ${want} and OFF everywhere else, and you played it back.`);
    return result('not-previewed', 'Looks ready. Let’s play it and watch what happens.', 'Press Play on the Control Window and watch the playhead cross the event.');
  }
  if (a === task.on && b >= FRAME_COUNT) return result('stays-on', 'It starts correctly. Let’s make sure it switches off at two seconds.', `${now} It should switch OFF at ${formatTime(task.off)}: select from ${formatTime(task.off)} to the end on its row and choose Edit ▸ Set Digitals Off.`);
  if (a === task.on && b > task.off) return result('too-long', 'We’re close! Check the duration: we need one second.', `${now} It should switch OFF at ${formatTime(task.off)}: select ${formatTime(task.off)} to ${formatTime(b)} on its row and choose Edit ▸ Set Digitals Off.`);
  if (a === task.on && b < task.off) return result('too-short', 'Almost: the event ends early.', `${now} It should stay ON until ${formatTime(task.off)}: select ${formatTime(b)} to ${formatTime(task.off)} and choose Edit ▸ Set Digitals On.`);
  return result('misplaced', 'Check both boundaries.', `${now} We want ON at ${formatTime(task.on)} and OFF at ${formatTime(task.off)}. Type the two times into the selected-time fields, click the name ${task.label}, and use Set Digitals On; set the wrong stretch OFF first.`);
}

export function validateOneSecond(ctx) {
  const r = assessAttempt(ctx);
  if (r.state === 'done') return { ok: true, message: r.message };
  return { ok: false, message: `${r.message} ${r.detail}` };
}

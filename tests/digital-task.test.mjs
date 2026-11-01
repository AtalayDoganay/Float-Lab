import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SEGMENT_NAMES, TASK, PREVIEW_EDITS, assessAttempt, validateOneSecond } from '../src/renderer/logic/digital-task.mjs';
import { emptyDigital, digitalFromIntervals, defaultAnalogs, FRAME_COUNT } from '../src/renderer/logic/simulation.mjs';

// A practice fixture: Digital 0 (light-1) all OFF, Digital 1 untouched, the trainer's analogs, nothing selected.
function fixture(overrides = {}) {
  const analogs = defaultAnalogs();
  const sim = {
    names: { ...SEGMENT_NAMES },
    lights: { 'light-1': emptyDigital(), 'light-2': emptyDigital() },
    analogs,
    selection: { from: 0, to: 0, channels: [] },
    channelId: 'light-1',
    zoom: 1,
    lastPlay: null,
    ...overrides,
  };
  // The baseline is the pristine fixture: Digital 1 all OFF, the trainer's analogs.
  sim.baseline = overrides.baseline || { lights: { 'light-2': emptyDigital() }, analogs: analogs.map((a) => [...a]) };
  return sim;
}
const on = (spans) => digitalFromIntervals(spans);

test('the task names Digital 0 and the exact frames of one second ON', () => {
  assert.deepEqual(SEGMENT_NAMES, { 'light-1': 'Digital 0', 'light-2': 'Digital 1' });
  assert.deepEqual(TASK, { channelId: 'light-1', label: 'Digital 0', on: 30, off: 60 });
});

test('an untouched fixture needs the channel picked first', () => {
  const r = assessAttempt({ sim: fixture() });
  assert.equal(r.state, 'no-channel');
  assert.equal(r.message, 'Let’s pick Digital 0 first.');
});

test('a selection on Digital 0 without ON data asks for the edit', () => {
  const r = assessAttempt({ sim: fixture({ selection: { from: 30, to: 60, channels: ['light-1'] } }) });
  assert.equal(r.state, 'selection-no-data');
  assert.equal(r.message, 'We’ve selected where to work. Now let’s turn that section on.');
});

test('a perfect event on Digital 1 is the wrong channel, not missing data', () => {
  const sim = fixture({ lights: { 'light-1': emptyDigital(), 'light-2': on([[30, 60]]) } });
  const r = assessAttempt({ sim });
  assert.equal(r.state, 'wrong-channel');
  assert.equal(r.message, 'The timing looks close—let’s check which channel received it.');
  assert.ok(r.detail.includes('Digital 1'));
});

test('an event that runs past two seconds is too long and names both boundaries', () => {
  const r = assessAttempt({ sim: fixture({ lights: { 'light-1': on([[30, 61]]), 'light-2': emptyDigital() } }) });
  assert.equal(r.state, 'too-long');
  assert.equal(r.message, 'We’re close! Check the duration: we need one second.');
  assert.ok(r.detail.includes('00:00:02.01') && r.detail.includes('00:00:02.00'), r.detail);
  const two = assessAttempt({ sim: fixture({ lights: { 'light-1': on([[30, 90]]), 'light-2': emptyDigital() } }) });
  assert.equal(two.state, 'too-long');
});

test('an event that never switches off stays on', () => {
  const r = assessAttempt({ sim: fixture({ lights: { 'light-1': on([[30, FRAME_COUNT]]), 'light-2': emptyDigital() } }) });
  assert.equal(r.state, 'stays-on');
  assert.equal(r.message, 'It starts correctly. Let’s make sure it switches off at two seconds.');
});

test('a short or misplaced event, or a second stretch, is named precisely', () => {
  assert.equal(assessAttempt({ sim: fixture({ lights: { 'light-1': on([[30, 59]]), 'light-2': emptyDigital() } }) }).state, 'too-short');
  const late = assessAttempt({ sim: fixture({ lights: { 'light-1': on([[31, 61]]), 'light-2': emptyDigital() } }) });
  assert.equal(late.state, 'misplaced');
  assert.ok(late.detail.includes('00:00:01.01'));
  assert.equal(assessAttempt({ sim: fixture({ lights: { 'light-1': on([[30, 60], [90, 120]]), 'light-2': emptyDigital() } }) }).state, 'extra-data');
});

test('changing another channel is caught even when Digital 0 is right', () => {
  const sim = fixture({ lights: { 'light-1': on([[30, 60]]), 'light-2': on([[0, 30]]) } });
  const r = assessAttempt({ sim });
  assert.equal(r.state, 'other-channel-changed');
  assert.ok(r.detail.includes('Digital 1'));
  const analogs = defaultAnalogs();
  analogs[0][10] = 255;
  const a = assessAttempt({ sim: fixture({ lights: { 'light-1': on([[30, 60]]), 'light-2': emptyDigital() }, analogs }) });
  assert.equal(a.state, 'other-channel-changed');
});

test('correct data must also be played back through the event', () => {
  const right = { 'light-1': on([[30, 60]]), 'light-2': emptyDigital() };
  const unplayed = assessAttempt({ sim: fixture({ lights: right }) });
  assert.equal(unplayed.state, 'not-previewed');
  assert.equal(unplayed.message, 'Looks ready. Let’s play it and watch what happens.');
  const partial = assessAttempt({ sim: fixture({ lights: right, lastPlay: { from: 0, to: 59 } }) });
  assert.equal(partial.state, 'not-previewed');
  const done = assessAttempt({ sim: fixture({ lights: right, lastPlay: { from: 0, to: 239 } }) });
  assert.equal(done.state, 'done');
  assert.equal(done.message, 'Yes! One second ON. You got it!');
  const fromLate = assessAttempt({ sim: fixture({ lights: right, lastPlay: { from: 45, to: 239 } }) });
  assert.equal(fromLate.state, 'not-previewed', 'playback must start before the event');
});

test('zoom and the selection never change the verdict once the data is right', () => {
  const right = { 'light-1': on([[30, 60]]), 'light-2': emptyDigital() };
  const a = assessAttempt({ sim: fixture({ lights: right, lastPlay: { from: 0, to: 239 }, zoom: 4, selection: { from: 100, to: 200, channels: ['light-1', 'axis-0'] } }) });
  assert.equal(a.state, 'done');
});

test('the practice validator passes only the finished state', () => {
  const right = { 'light-1': on([[30, 60]]), 'light-2': emptyDigital() };
  assert.deepEqual(validateOneSecond({ sim: fixture({ lights: right, lastPlay: { from: 0, to: 239 } }) }), { ok: true, message: 'Yes! One second ON. You got it!' });
  const miss = validateOneSecond({ sim: fixture() });
  assert.equal(miss.ok, false);
  assert.ok(miss.message.startsWith('Let’s pick Digital 0 first.'));
});

test('an edit to the show data invalidates the preview; selecting, zooming and playing do not', () => {
  for (const type of ['set-digital', 'set-digital-pattern', 'draw-digital', 'draw-digital-done', 'set-analog-value', 'reset-analogs']) {
    assert.ok(PREVIEW_EDITS.has(type), `${type} edits the show`);
  }
  for (const type of ['select-range', 'select-channel', 'zoom', 'set-zoom', 'play', 'stop', 'set-frame']) {
    assert.ok(!PREVIEW_EDITS.has(type), `${type} leaves the show as it was`);
  }
});

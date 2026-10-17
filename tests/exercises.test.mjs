import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EXERCISES } from '../src/renderer/content/exercises.mjs';
import { digitalFromIntervals } from '../src/renderer/logic/simulation.mjs';

const lights = (spans) => ({ 'light-1': digitalFromIntervals(spans), 'light-2': digitalFromIntervals([]) });

// The three exercises survive as assignment steps inside the guided lessons.
// These checks pin their validators' specific, learner-facing messages.
const stepOf = (exerciseId, stepId) => EXERCISES.find((e) => e.id === exerciseId).steps.find((s) => s.id === stepId);

function sim(overrides = {}) {
  return {
    channelId: 'light-1',
    lights: lights([[60, 120]]),
    mode: 'stop',
    axis: 0,
    command: 128,
    measuring: false,
    laptopIp: '192.168.0.20',
    ...overrides,
  };
}

test('schedule-light: selecting the wrong channel is explained and the right one passes', () => {
  const step = stepOf('schedule-light', 'sl-channel');
  const wrong = step.validate({ sim: sim({ channelId: 'light-2' }), action: { type: 'select-channel' }, answer: null });
  assert.equal(wrong.ok, false);
  assert.match(wrong.message, /Light 1/);
  assert.equal(step.validate({ sim: sim({ channelId: 'light-1' }), action: { type: 'select-channel' }, answer: null }).ok, true);
});

test('schedule-light: Light 1 must be ON from 2 s to 4 s only, with the wrong stretch named', () => {
  const step = stepOf('schedule-light', 'sl-blocks');
  const extra = step.validate({ sim: sim({ lights: lights([[30, 120]]) }), action: { type: 'set-digital' }, answer: null });
  assert.equal(extra.ok, false);
  assert.match(extra.message, /00:00:01\.00 to 00:00:02\.00/);
  assert.match(extra.message, /Set Digitals Off/);
  const missing = step.validate({ sim: sim({ lights: lights([[60, 90]]) }), action: { type: 'set-digital' }, answer: null });
  assert.equal(missing.ok, false);
  assert.match(missing.message, /00:00:03\.00 to 00:00:04\.00/);
  const exact = step.validate({ sim: sim(), action: { type: 'set-digital' }, answer: null });
  assert.equal(exact.ok, true);
  assert.match(exact.message, /sixty frames/);
});

test('schedule-light: play needs Play, and finishing needs Stop or completion', () => {
  const play = stepOf('schedule-light', 'sl-play');
  assert.equal(play.validate({ sim: sim(), action: { type: 'set-digital' }, answer: null }).ok, false);
  assert.equal(play.validate({ sim: sim({ mode: 'play' }), action: { type: 'play' }, answer: null }).ok, true);
  const watch = stepOf('schedule-light', 'sl-watch');
  assert.equal(watch.validate({ sim: sim(), action: { type: 'play' }, answer: null }).ok, false);
  assert.equal(watch.validate({ sim: sim(), action: { type: 'playback-complete' }, answer: null }).ok, true);
  assert.equal(watch.validate({ sim: sim(), action: { type: 'stop' }, answer: null }).ok, true);
});

test('read-command: the Axis 2 slider must be exactly 128 and the message says what was set', () => {
  assert.equal(stepOf('read-command', 'rc-axis').validate({ sim: sim({ axis: 1 }) }).ok, false);
  assert.equal(stepOf('read-command', 'rc-axis').validate({ sim: sim({ axis: 2 }) }).ok, true);
  const channel = stepOf('read-command', 'rc-channel');
  const wrongChannel = channel.validate({ answer: '6' });
  assert.equal(wrongChannel.ok, false);
  assert.match(wrongChannel.message, /axis 0/i);
  assert.equal(channel.validate({ answer: '8' }).ok, true);
  const command = stepOf('read-command', 'rc-command');
  const off = command.validate({ sim: sim({ axis: 2, command: 127 }) });
  assert.equal(off.ok, false);
  assert.match(off.message, /127/);
  assert.match(off.message, /128/);
  assert.match(command.validate({ sim: sim({ axis: 1, command: 128 }) }).message, /Axis 1/, 'the slider of another axis is named');
  assert.equal(command.validate({ sim: sim({ axis: 2, command: 128 }) }).ok, true);
  const percent = stepOf('read-command', 'rc-percent');
  assert.equal(percent.validate({ answer: '128%' }).ok, false);
  assert.equal(percent.validate({ answer: '50.2%' }).ok, true);
  assert.equal(stepOf('read-command', 'rc-measure').validate({ sim: sim({ measuring: true }), action: { type: 'run-measure' } }).ok, true);
});

test('understand-address: the three examples produce the intended explanations', () => {
  const same = stepOf('understand-address', 'ua-same').validate({ sim: sim({ laptopIp: '192.168.0.20' }) });
  assert.equal(same.ok, true);
  assert.match(same.message, /same subnet/i);
  assert.equal(stepOf('understand-address', 'ua-different').validate({ sim: sim({ laptopIp: '192.168.0.20' }) }).ok, false, 'step two wants the different-subnet example');
  const different = stepOf('understand-address', 'ua-different').validate({ sim: sim({ laptopIp: '192.168.1.20' }) });
  assert.equal(different.ok, true);
  assert.match(different.message, /different subnet/i);
  const duplicate = stepOf('understand-address', 'ua-duplicate').validate({ sim: sim({ laptopIp: '192.168.0.10' }) });
  assert.equal(duplicate.ok, true);
  assert.match(duplicate.message, /duplicate/i);
  assert.equal(stepOf('understand-address', 'ua-pick').validate({ answer: '192.168.0.20' }).ok, true);
  assert.equal(stepOf('understand-address', 'ua-pick').validate({ answer: '192.168.0.10' }).ok, false);
});

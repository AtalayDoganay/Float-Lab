import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EXERCISES } from '../src/renderer/content/exercises.mjs';
import { createGuidedRun } from '../src/renderer/logic/guided.mjs';
import { DEFAULT_BLOCKS } from '../src/renderer/logic/simulation.mjs';

const byId = (id) => EXERCISES.find((e) => e.id === id);

function sim(overrides = {}) {
  return {
    channelId: 'light-1',
    blocks: [...DEFAULT_BLOCKS],
    playing: false,
    axis: 0,
    command: 128,
    measuring: false,
    laptopIp: '192.168.0.20',
    ...overrides,
  };
}

test('schedule-light: selecting the wrong channel is explained and the right one advances', () => {
  const run = createGuidedRun(byId('schedule-light'));
  assert.equal(run.current().index, 0);
  const wrong = run.validate({ sim: sim({ channelId: 'light-2' }), action: { type: 'select-channel' }, answer: null });
  assert.equal(wrong.ok, false);
  assert.match(wrong.message, /Light 1/);
  assert.equal(run.current().index, 0, 'a failed step does not advance');

  const right = run.validate({ sim: sim({ channelId: 'light-1' }), action: { type: 'select-channel' }, answer: null });
  assert.equal(right.ok, true);
  assert.equal(run.current().index, 1);
});

test('schedule-light: block pattern must be exactly blocks 2 and 3, with the offending block named', () => {
  const run = createGuidedRun(byId('schedule-light'), { stepIndex: 1 });
  const extra = run.validate({
    sim: sim({ blocks: [false, true, true, true, false, false, false, false] }),
    action: { type: 'toggle-block' },
    answer: null,
  });
  assert.equal(extra.ok, false);
  assert.match(extra.message, /[Bb]lock 1/);

  const missing = run.validate({
    sim: sim({ blocks: [false, false, true, false, false, false, false, false] }),
    action: { type: 'toggle-block' },
    answer: null,
  });
  assert.equal(missing.ok, false);
  assert.match(missing.message, /[Bb]lock 3/);

  const exact = run.validate({ sim: sim(), action: { type: 'toggle-block' }, answer: null });
  assert.equal(exact.ok, true);
  assert.match(exact.message, /2.3/);
  assert.match(exact.message, /3.4/);
});

test('schedule-light: play then stop or completion finishes the exercise', () => {
  const run = createGuidedRun(byId('schedule-light'), { stepIndex: 2 });
  const notPlay = run.validate({ sim: sim(), action: { type: 'toggle-block' }, answer: null });
  assert.equal(notPlay.ok, false);
  const play = run.validate({ sim: sim({ playing: true }), action: { type: 'play' }, answer: null });
  assert.equal(play.ok, true);
  assert.equal(play.finished, false);
  const done = run.validate({ sim: sim(), action: { type: 'playback-complete' }, answer: null });
  assert.equal(done.ok, true);
  assert.equal(done.finished, true);
  assert.deepEqual(run.progress().completed, ['sl-play', 'sl-watch'], 'only steps actually done count');
});

test('read-command: the command must be exactly 128 and the message says what was set', () => {
  const run = createGuidedRun(byId('read-command'));
  assert.equal(run.validate({ sim: sim({ axis: 1 }), action: { type: 'select-axis' }, answer: null }).ok, false);
  assert.equal(run.validate({ sim: sim({ axis: 2 }), action: { type: 'select-axis' }, answer: null }).ok, true);

  const wrongChannel = run.validate({ sim: sim({ axis: 2 }), action: null, answer: '6' });
  assert.equal(wrongChannel.ok, false);
  assert.match(wrongChannel.message, /axis 0/i);
  assert.equal(run.validate({ sim: sim({ axis: 2 }), action: null, answer: '8' }).ok, true);

  const off = run.validate({ sim: sim({ axis: 2, command: 127 }), action: { type: 'set-command' }, answer: null });
  assert.equal(off.ok, false);
  assert.match(off.message, /127/);
  assert.match(off.message, /128/);
  const exact = run.validate({ sim: sim({ axis: 2, command: 128 }), action: { type: 'set-command' }, answer: null });
  assert.equal(exact.ok, true);

  assert.equal(run.validate({ sim: sim({ axis: 2 }), action: null, answer: '128%' }).ok, false);
  assert.equal(run.validate({ sim: sim({ axis: 2 }), action: null, answer: '50.2%' }).ok, true);

  const measure = run.validate({ sim: sim({ axis: 2, measuring: true }), action: { type: 'run-measure' }, answer: null });
  assert.equal(measure.ok, true);
  assert.equal(measure.finished, true);
});

test('understand-address: the three examples produce the intended explanations', () => {
  const run = createGuidedRun(byId('understand-address'));
  const same = run.validate({ sim: sim({ laptopIp: '192.168.0.20' }), action: { type: 'select-laptop-ip' }, answer: null });
  assert.equal(same.ok, true);
  assert.match(same.message, /same subnet/i);

  const stillSame = run.validate({ sim: sim({ laptopIp: '192.168.0.20' }), action: { type: 'select-laptop-ip' }, answer: null });
  assert.equal(stillSame.ok, false, 'step two wants the different-subnet example');

  const different = run.validate({ sim: sim({ laptopIp: '192.168.1.20' }), action: { type: 'select-laptop-ip' }, answer: null });
  assert.equal(different.ok, true);
  assert.match(different.message, /different subnet/i);

  const duplicate = run.validate({ sim: sim({ laptopIp: '192.168.0.10' }), action: { type: 'select-laptop-ip' }, answer: null });
  assert.equal(duplicate.ok, true);
  assert.match(duplicate.message, /duplicate/i);

  const pick = run.validate({ sim: sim(), action: null, answer: '192.168.0.20' });
  assert.equal(pick.ok, true);
  assert.equal(pick.finished, true);
});

test('back, reset, and restore behave predictably', () => {
  const run = createGuidedRun(byId('understand-address'), { stepIndex: 2, completedSteps: ['ua-same', 'ua-different'] });
  assert.equal(run.current().index, 2);
  run.back();
  assert.equal(run.current().index, 1);
  run.back();
  run.back();
  assert.equal(run.current().index, 0, 'back never goes below the first step');
  assert.deepEqual(run.progress().completed, ['ua-same', 'ua-different'], 'back keeps completed steps');
  run.reset();
  assert.equal(run.current().index, 0);
  assert.deepEqual(run.progress().completed, []);
  const clamped = createGuidedRun(byId('understand-address'), { stepIndex: 99 });
  assert.equal(clamped.current().index, 3, 'restore clamps to the last step');
});

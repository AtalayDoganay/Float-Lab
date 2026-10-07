import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  percentOf,
  formatPercent,
  blocksToIntervals,
  playbackStep,
  formatShowTime,
  axisToDmx,
  classifyLaptopIp,
  approachStep,
  calibratedTarget,
  DEFAULT_BLOCKS,
} from '../src/renderer/logic/simulation.mjs';

test('command 128 is about 50.2 percent of the 8-bit range', () => {
  assert.ok(Math.abs(percentOf(128) - 50.196) < 0.001);
  assert.equal(percentOf(0), 0);
  assert.equal(percentOf(255), 100);
  assert.equal(formatPercent(128), '50.2%');
  assert.equal(formatPercent(255), '100.0%');
});

test('blocks 2 and 3 cover the intervals 2-3 and 3-4 seconds', () => {
  const blocks = [false, false, true, true, false, false, false, false];
  assert.deepEqual(blocksToIntervals(blocks), [
    { start: 2, end: 3 },
    { start: 3, end: 4 },
  ]);
  assert.deepEqual(blocksToIntervals(new Array(8).fill(false)), []);
  assert.deepEqual(DEFAULT_BLOCKS, [false, false, true, true, false, false, false, false]);
});

test('playback steps through eight one-second blocks then finishes', () => {
  const blocks = DEFAULT_BLOCKS;
  for (let t = 0; t < 8; t += 1) {
    const step = playbackStep(t, blocks);
    assert.equal(step.done, false);
    assert.equal(step.index, t);
    assert.equal(step.on, blocks[t]);
    assert.equal(step.label, `${t}–${t + 1} s · ${blocks[t] ? 'ON' : 'OFF'}`);
  }
  assert.deepEqual(playbackStep(8, blocks), { done: true });
  assert.deepEqual(playbackStep(9, blocks), { done: true });
});

test('show time is formatted as hours:minutes:seconds.frames at 30 fps', () => {
  assert.equal(formatShowTime(0), '00:00:00.00');
  assert.equal(formatShowTime(2), '00:00:02.00');
  assert.equal(formatShowTime(2.5), '00:00:02.15');
  assert.equal(formatShowTime(65), '00:01:05.00');
  assert.equal(formatShowTime(3725), '01:02:05.00');
});

test('axes 0-3 map to displayed DMX addresses 6-9 as photographed', () => {
  assert.equal(axisToDmx(0), 6);
  assert.equal(axisToDmx(1), 7);
  assert.equal(axisToDmx(2), 8);
  assert.equal(axisToDmx(3), 9);
  assert.throws(() => axisToDmx(4));
  assert.throws(() => axisToDmx(-1));
});

test('laptop addresses are classified against the photographed controller address', () => {
  assert.equal(classifyLaptopIp('192.168.0.20'), 'same-subnet');
  assert.equal(classifyLaptopIp('192.168.1.20'), 'different-subnet');
  assert.equal(classifyLaptopIp('192.168.0.10'), 'duplicate');
});

test('the approach model moves a fraction of the gap and snaps when close', () => {
  assert.equal(approachStep(0, 75), 6);
  assert.equal(approachStep(74.97, 75), 75);
  assert.equal(approachStep(75, 75), 75);
});

test('the hypothetical linear calibration maps 128 on a 20 cm range to about 10.04 cm', () => {
  assert.ok(Math.abs(calibratedTarget(128, 20) - 10.039) < 0.001);
  assert.equal(calibratedTarget(255, 40), 40);
  assert.equal(calibratedTarget(0, 10), 0);
});

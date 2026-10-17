import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  percentOf,
  formatPercent,
  formatTime,
  formatCursor,
  parseTime,
  intervalsOf,
  digitalFromIntervals,
  setDigitalRange,
  setAnalogRange,
  compareDigital,
  encodeRuns,
  decodeRuns,
  defaultAnalogs,
  axisToDmx,
  classifyLaptopIp,
  approachStep,
  calibratedTarget,
  FRAME_COUNT,
  LAST_FRAME,
} from '../src/renderer/logic/simulation.mjs';
import { computeOutputs, outputSource } from '../src/renderer/logic/outputs.mjs';

test('command 128 is about 50.2 percent of the 8-bit range', () => {
  assert.ok(Math.abs(percentOf(128) - 50.196) < 0.001);
  assert.equal(percentOf(0), 0);
  assert.equal(percentOf(255), 100);
  assert.equal(formatPercent(128), '50.2%');
  assert.equal(formatPercent(255), '100.0%');
});

test('the training show is 8 seconds of 30 frames; times are hh:mm:ss.ff', () => {
  assert.equal(FRAME_COUNT, 240);
  assert.equal(formatTime(0), '00:00:00.00');
  assert.equal(formatTime(60), '00:00:02.00');
  assert.equal(formatTime(75), '00:00:02.15');
  assert.equal(formatTime(LAST_FRAME), '00:00:07.29');
  assert.equal(formatTime(30 * 3725), '01:02:05.00');
  assert.equal(formatCursor(75), '00:02.15');
});

test('typed times parse to frames and out-of-show or malformed times are refused', () => {
  assert.equal(parseTime('00:00:02.15'), 75);
  assert.equal(parseTime('02.15'), 75);
  assert.equal(parseTime('5'), 150);
  assert.equal(parseTime('00:00:08.00'), 240);
  assert.equal(parseTime('00:00:08.01'), null);
  assert.equal(parseTime('00:00:02.30'), null, 'frames run 0-29');
  assert.equal(parseTime('two seconds'), null);
});

test('digital show data round-trips through ON spans in frames', () => {
  const frames = digitalFromIntervals([[60, 120], [150, 180]]);
  assert.equal(frames.length, FRAME_COUNT);
  assert.equal(frames[59], false);
  assert.equal(frames[60], true);
  assert.equal(frames[119], true);
  assert.equal(frames[120], false);
  assert.deepEqual(intervalsOf(frames), [[60, 120], [150, 180]]);
  const on = setDigitalRange(frames, 120, 150, true);
  assert.deepEqual(intervalsOf(on), [[60, 180]], 'Set Digitals On joins the spans');
  assert.deepEqual(intervalsOf(setDigitalRange(on, 0, 240, false)), []);
});

test('a drawn digital is compared with the expected seconds, naming the first wrong stretch', () => {
  const exact = digitalFromIntervals([[60, 120]]);
  assert.equal(compareDigital(exact, [[2, 4]]).ok, true);
  assert.equal(compareDigital(digitalFromIntervals([[62, 118]]), [[2, 4]]).ok, true, 'hand-drawn edges two frames off pass');
  const extra = compareDigital(digitalFromIntervals([[30, 120]]), [[2, 4]]);
  assert.deepEqual([extra.ok, extra.kind, extra.from], [false, 'extra', 30]);
  const missing = compareDigital(digitalFromIntervals([[60, 90]]), [[2, 4]]);
  assert.deepEqual([missing.ok, missing.kind], [false, 'missing']);
});

test('analog show data: Set Analogs to a Value and the compact saved form', () => {
  const values = defaultAnalogs()[0];
  assert.equal(values.length, FRAME_COUNT);
  const set = setAnalogRange(values, 30, 90, 255);
  assert.equal(set[29], values[29]);
  assert.ok(set.slice(30, 90).every((v) => v === 255));
  assert.deepEqual(decodeRuns(encodeRuns(set)), set);
});

test('outputs follow the show while playing, the Soft Console in Manual mode, and hold otherwise', () => {
  const sim = {
    mode: 'stop', frame: 75, checks: { manual: false }, bump: null,
    console: [10, 20, 30, 40], consoleDigital: { 'light-1': true },
    analogs: defaultAnalogs(), lights: { 'light-1': digitalFromIntervals([[60, 120]]), 'light-2': digitalFromIntervals([]) },
  };
  assert.equal(outputSource(sim), 'hold');
  assert.equal(computeOutputs(sim).lights['light-1'], true, 'holding frame 75, inside 2-4 s');
  assert.equal(computeOutputs({ ...sim, mode: 'play', frame: 130 }).lights['light-1'], false);
  const manual = computeOutputs({ ...sim, checks: { manual: true } });
  assert.equal(manual.source, 'manual');
  assert.deepEqual(manual.analogs, [10, 20, 30, 40]);
  assert.equal(computeOutputs({ ...sim, checks: { manual: true }, bump: 2 }).analogs[2], 255, 'BUMP is 100% while held');
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

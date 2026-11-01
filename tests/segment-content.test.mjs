import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SEGMENT_LESSONS, SEGMENT_IDS } from '../src/renderer/content/lessons/segment-digital.mjs';
import { ONE_SECOND_FILM } from '../src/renderer/content/films/one-second-on.mjs';
import { LESSONS_BY_ID, LEVELS, GROUPS } from '../src/renderer/content/levels.mjs';
import { MENUS } from '../src/renderer/content/pcmacs-menus.mjs';
import { CONTROLS } from '../src/renderer/content/controls.mjs';
import { HANDBOOK_BY_ID } from '../src/renderer/content/handbook.mjs';
import { SEGMENT_NAMES, validateOneSecond } from '../src/renderer/logic/digital-task.mjs';

const byId = Object.fromEntries(SEGMENT_LESSONS.map((l) => [l.id, l]));
const stepIds = (l) => l.steps.map((s) => s.id);

test('the first segment is three lessons, registered but in no legacy level', () => {
  assert.deepEqual(SEGMENT_IDS, ['s1-orientation', 's1-digital-vs-analog', 's1-one-second-on']);
  for (const id of SEGMENT_IDS) {
    assert.ok(LESSONS_BY_ID[id], `${id} is registered`);
    assert.ok(GROUPS[LESSONS_BY_ID[id].group], `${id} has a group`);
    for (const level of LEVELS) assert.ok(!level.lessons.includes(id), `${id} is not in ${level.name}`);
  }
});

test('the orientation tours all eleven menus, says what each is for, and separates view from data', () => {
  const o = byId['s1-orientation'];
  assert.deepEqual(stepIds(o), ['workspace', 'menu-file', 'menu-edit', 'menu-realtime', 'menu-offline', 'menu-channels', 'menu-preferences', 'menu-time-out', 'menu-time-in', 'menu-values-out', 'menu-values-in', 'menu-help', 'reach-screen', 'q-zoom']);
  const labels = MENUS.map((m) => m.label);
  for (const step of o.steps.filter((s) => s.id.startsWith('menu-'))) {
    assert.ok(CONTROLS[step.target], `${step.id} targets a known control`);
    const menu = MENUS.find((m) => `menu-${m.id}` === step.id);
    assert.ok(menu, `${step.id} is a real menu`);
    assert.ok(step.explain.includes(menu.label), `${step.id} names its menu`);
    assert.ok(step.demo && step.demo.actions.some((a) => a.type === 'menu' || a.type === 'zoom' || a.type === 'pc-note'), `${step.id} operates or opens its menu`);
  }
  assert.deepEqual(labels, ['File', 'Edit', 'RealTime', 'Offline', 'Channels', 'Preferences', 'Time Out', 'Time In', 'Values Out', 'Values In', 'Help']);
  const timeIn = o.steps.find((s) => s.id === 'menu-time-in');
  assert.ok(/data|show/.test(timeIn.demo.outro) && /unchanged|did not|does not/.test(timeIn.demo.outro), 'zooming leaves the data unchanged');
  const valuesIn = o.steps.find((s) => s.id === 'menu-values-in');
  assert.ok(/not simulated/.test(valuesIn.explain) && /analog/.test(valuesIn.explain), 'Values In is an honest short orientation');
  const reach = o.steps.find((s) => s.id === 'reach-screen');
  assert.ok(/Open/.test(reach.explain) && /not simulated/.test(reach.explain));
  const q = o.steps.find((s) => s.id === 'q-zoom');
  assert.equal(q.kind, 'question');
  assert.equal(q.question.options[q.question.correct], 'No. Only the view changed; the data is the same.');
});

test('digital versus analog is brief and visible', () => {
  const l = byId['s1-digital-vs-analog'];
  assert.deepEqual(stepIds(l), ['digital', 'analog', 'q-which']);
  assert.ok(l.steps[0].demo && l.steps[1].demo, 'both ideas are demonstrated');
  assert.ok(/ON|OFF/.test(l.steps[0].explain) && /level|0.100%|between/.test(l.steps[1].explain));
});

test('One second ON: a watched film, the exact practice, and a review stop', () => {
  const l = byId['s1-one-second-on'];
  assert.deepEqual(stepIds(l), ['watch', 'try', 'review-stop']);
  const [watch, practice, stop] = l.steps;
  assert.equal(watch.film, ONE_SECOND_FILM);
  assert.equal(practice.kind, 'practice');
  assert.equal(practice.practice.instruction, 'Make Digital 0 turn ON at 1 second and OFF at 2 seconds. That’s one second ON. Then play it back.');
  assert.equal(practice.practice.validate, validateOneSecond);
  assert.deepEqual(practice.practice.triggers, ['set-digital', 'draw-digital-done', 'select-range', 'play', 'stop', 'playback-complete']);
  const setup = practice.practice.setup;
  assert.deepEqual(setup[0], { type: 'set-channel-names', names: SEGMENT_NAMES });
  assert.equal(setup[setup.length - 1].type, 'snapshot-baseline', 'the baseline is taken last');
  assert.ok(setup.some((a) => a.type === 'set-digital-pattern' && a.channelId === 'light-1' && a.seconds.length === 0), 'Digital 0 starts OFF throughout');
  assert.ok(/Atalay/.test(stop.explain), 'the review stop says who decides the next steps');
  assert.ok(l.reveal.includes('robot'), 'Robot Rosie stands beside the workspace for this lesson');
});

test('the film follows the storyboard: nine narrated beats, a staged three-second mistake, a repair of the data, a playback, and the handoff', () => {
  const beats = ONE_SECOND_FILM.beats;
  assert.equal(beats.length, 11);
  const said = beats.map((b) => b.say).filter(Boolean);
  assert.deepEqual(said, [
    'Let’s give one digital channel a very simple job.',
    'This is Digital Zero. Zero is its channel number. Its value can still be ON or OFF.',
    'First, make the part of the timeline we’re using easy to see.',
    'Select from one second to two seconds. That gives us one second of activity.',
    'Now use Edit, Set Digitals On, to turn that selected section on.',
    'Almost! We asked for one second. Let’s check the end of the interval.',
    'One to two. That’s the interval we want.',
    'Watch the playhead. ON at one. OFF at two.',
  ]);
  const cues = beats.flatMap((b) => (b.actions || []).map((a) => ({ beat: b.id, ...a })));
  const select = cues.find((c) => c.drag && c.beat === 'select');
  assert.deepEqual(select.drag, { pane: 'digital', channel: 'light-1', fromSec: 1, toSec: 2, button: 0 });
  assert.ok(cues.some((c) => c.click === 'menu-item:Set Digitals On' && c.beat === 'set-on'));
  const mistake = cues.find((c) => c.drag && c.beat === 'mistake');
  assert.equal(mistake.drag.toSec, 3, 'she extends the event to three seconds');
  const repair = cues.filter((c) => c.beat === 'repair');
  assert.deepEqual(repair.find((c) => c.drag).drag, { pane: 'digital', channel: 'light-1', fromSec: 2, toSec: 3, button: 0 });
  assert.ok(repair.some((c) => c.click === 'menu-item:Set Digitals Off'), 'the extra ON data is removed, not merely deselected');
  assert.ok(cues.some((c) => c.click === 'play' && c.beat === 'playback'));
  assert.ok(cues.some((c) => c.click === 'menu-time-in' && c.beat === 'zoom'));
  const glassesOn = beats.find((b) => b.id === 'zoom').rosie.glasses;
  const glassesOff = beats.find((b) => b.id === 'handoff').rosie.glasses;
  assert.equal(glassesOn, true);
  assert.equal(glassesOff, false);
  assert.equal(beats.find((b) => b.id === 'handoff').rosie.line, 'Okay, now we know how to do this! Give it a try. If you need help, just let me know—click me and I’ll show you.');
  assert.equal(beats.find((b) => b.id === 'task').rosie.line, 'Make Digital 0 turn ON at 1 second and OFF at 2 seconds. That’s one second ON. Then play it back.');
  assert.ok(beats.find((b) => b.id === 'set-on').rosie.line.includes('Ctrl+1'), 'the verified hotkey is shown as an alternative');
});

test('every new term is defined in the handbook, and the new controls carry help', () => {
  for (const id of ['concept:channel', 'concept:digital', 'concept:analog', 'concept:timeline', 'concept:playhead', 'concept:selection', 'concept:on-off', 'concept:preview']) {
    assert.ok(HANDBOOK_BY_ID.has(id), id);
  }
  for (const id of ['robot-preview', 'rosie-help', 'film-skip', 'film-pause', 'sound-settings', 'sound-enable', 'start-training', 'continue-training', 'replay-intro', 'menu-time-out', 'menu-time-in', 'restart-training']) {
    assert.ok(CONTROLS[id], `control ${id}`);
  }
});

test('every step of the segment shows the segment’s channel names from its first frame', () => {
  for (const lesson of SEGMENT_LESSONS) {
    for (const step of lesson.steps) {
      const setup = step.kind === 'practice' ? step.practice.setup : step.setup;
      const names = (setup || []).find((a) => a.type === 'set-channel-names');
      assert.ok(names, `${lesson.id}:${step.id} names the channels on entry`);
      assert.deepEqual(names.names, SEGMENT_NAMES, `${lesson.id}:${step.id}`);
    }
  }
});

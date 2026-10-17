import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { MENUS, SHORTCUTS, shortcutMenu } from '../src/renderer/content/pcmacs-menus.mjs';
import { CONTROLS } from '../src/renderer/content/controls.mjs';
import { LESSONS_BY_ID } from '../src/renderer/content/levels.mjs';

// Action types the renderer's reducer handles, read from its source so this
// list cannot silently drift from the controller.
const APP = fs.readFileSync(new URL('../src/renderer/app.mjs', import.meta.url), 'utf8');
const HANDLED = new Set([...APP.matchAll(/case '([a-z0-9-]+)':/g)].map((m) => m[1]));
// Types that reach afterAction without a case of their own.
const EFFECTIVE = new Set(['playback-complete', 'help-open', 'check-manual', 'select-axis', 'select-channel']);

test('the menu bar reads as in the manual’s Edit View capture (p. 76)', () => {
  assert.deepEqual(MENUS.map((m) => m.label), ['File', 'Edit', 'RealTime', 'Offline', 'Channels', 'Preferences', 'Time Out', 'Time In', 'Values Out', 'Values In', 'Help']);
});

test('the Edit menu keeps the manual’s wording and shortcuts for the simulated commands', () => {
  const edit = MENUS.find((m) => m.id === 'edit').items.filter((i) => !i.sep);
  const byLabel = Object.fromEntries(edit.map((i) => [i.label, i.key]));
  assert.equal(byLabel['Set Digitals Off'], 'Ctrl+0');
  assert.equal(byLabel['Set Digitals On'], 'Ctrl+1');
  assert.equal(byLabel['Set Analogs to a Value...'], 'Ctrl+2');
  assert.equal(byLabel["Can't undo"], '');
  assert.equal(edit.length, 27, 'all 27 items in the p. 133 screenshot');
});

test('every simulated menu item, shortcut, and shortcut-menu entry dispatches a handled action', () => {
  const actions = [
    ...MENUS.flatMap((m) => [m.action, ...(m.items || []).map((i) => i.action)]),
    ...Object.values(SHORTCUTS),
    ...shortcutMenu({ selection: { from: 0, to: 30, channels: [] }, checks: { loop: false } }, 10).map((i) => i.action),
  ].filter(Boolean);
  for (const a of actions) assert.ok(HANDLED.has(a.type), `unhandled action ${a.type}`);
  for (const id of MENUS.flatMap((m) => [m.control, ...(m.items || []).map((i) => i.control)]).filter(Boolean)) {
    assert.ok(CONTROLS[id], `menu control ${id} has no help`);
  }
});

test('F1 stays the help key: no PC•MACs shortcut takes it', () => {
  assert.equal('F1' in SHORTCUTS, false);
});

test('every practice step is checked by actions the controller really produces, from a setup it really handles', () => {
  for (const lesson of Object.values(LESSONS_BY_ID)) {
    for (const step of lesson.steps) {
      if (step.kind === 'practice') {
        for (const t of step.practice.triggers) assert.ok(HANDLED.has(t) || EFFECTIVE.has(t), `${lesson.id}:${step.id} trigger ${t}`);
        for (const a of step.practice.setup) assert.ok(HANDLED.has(a.type), `${lesson.id}:${step.id} setup ${a.type}`);
      }
      for (const a of step.demo?.actions || []) if (!Number.isInteger(a.wait)) assert.ok(HANDLED.has(a.type), `${lesson.id}:${step.id} demo ${a.type}`);
    }
  }
});

test('the photographed-column question asks what the photo step promises', () => {
  const steps = LESSONS_BY_ID['h-unresolved'].steps;
  const open = steps.find((s) => s.id === 'open-photo');
  const read = steps.find((s) => s.id === 'q-vel-photo');
  assert.equal(open.practice.validate({ action: { type: 'open-photo' } }).ok, true);
  assert.equal(read.kind, 'question');
  assert.equal(read.question.options[read.question.correct], '7.00', 'photo 07 reads 7.00 for axis 1');
});

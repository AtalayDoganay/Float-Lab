import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initialTerminal, terminalKey, terminalButton } from '../src/renderer/logic/terminal.mjs';

test('s then a digit selects an axis through the photographed prompt', () => {
  let t = initialTerminal();
  assert.equal(t.screen, 'main');
  assert.equal(t.prompt, null);
  t = terminalKey(t, 's');
  assert.equal(t.prompt, 'axis');
  t = terminalKey(t, '2');
  assert.equal(t.prompt, null);
  assert.equal(t.axis, 2);
  const bad = terminalKey(terminalKey(initialTerminal(), 's'), '7');
  assert.equal(bad.prompt, 'axis', 'out-of-range answers keep the prompt open');
  assert.match(bad.note, /0 - 3/);
});

test('a opens the card-address prompt and keeps the photographed value', () => {
  let t = terminalKey(initialTerminal(), 'a');
  assert.equal(t.prompt, 'card');
  t = terminalKey(t, '1');
  assert.equal(t.prompt, null);
  assert.equal(t.card, 1);
  assert.match(t.note, /not simulated|photographed/i);
});

test('k toggles between main and feedback configuration, 6 opens network settings', () => {
  let t = terminalKey(initialTerminal(), 'k');
  assert.equal(t.screen, 'feedback');
  t = terminalKey(t, 'k');
  assert.equal(t.screen, 'main');
  t = terminalKey(t, '6');
  assert.equal(t.screen, 'network');
  const discarded = terminalKey(t, 'x');
  assert.equal(discarded.screen, 'main');
  assert.match(discarded.note, /discard/i);
  const confirmed = terminalKey(t, 'c');
  assert.equal(confirmed.screen, 'main');
  assert.match(confirmed.note, /nothing changed/i);
});

test('n and l step the selected axis with wrap-around', () => {
  let t = initialTerminal();
  t = terminalKey(t, 'n');
  assert.equal(t.axis, 1);
  t = terminalKey(terminalKey(terminalKey(t, 'n'), 'n'), 'n');
  assert.equal(t.axis, 0, 'wraps after axis 3');
  t = terminalKey(t, 'l');
  assert.equal(t.axis, 3);
});

test('setting keys 1-5 and unphotographed commands are refused, not invented', () => {
  for (const key of ['1', '2', '3', '4', '5', 'i', 'o', 'g', 'h']) {
    const t = terminalKey(initialTerminal(), key);
    assert.equal(t.prompt, null, key);
    assert.match(t.note, /not simulated/i, key);
  }
});

test('x asks Y/N and exits configuration mode; Config Done and Configure toggle it', () => {
  let t = terminalKey(initialTerminal(), 'x');
  assert.equal(t.prompt, 'exit');
  const stay = terminalKey(t, 'n');
  assert.equal(stay.configMode, true);
  assert.equal(stay.prompt, null);
  const leave = terminalKey(t, 'y');
  assert.equal(leave.configMode, false);
  const back = terminalButton(leave, 'config');
  assert.equal(back.configMode, true);
  assert.equal(back.screen, 'main');
  const cleared = terminalButton(back, 'clear');
  assert.equal(cleared.cleared, true);
  assert.equal(terminalKey(cleared, 'k').cleared, false, 'any menu key redraws');
});

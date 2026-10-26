import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initialBeat, primaryAction, secondaryActions, expressionFor, bubbleText } from '../src/renderer/logic/step-beats.mjs';

const explainDemo = { id: 'e', kind: 'explain', title: 'The show time', explain: 'Play runs the show.', demo: { intro: 'Watch the readout.', actions: [{ type: 'play' }], outro: 'It stopped where it was.' } };
const explainPlain = { id: 'e2', kind: 'explain', title: 'Plain', explain: 'Just read this.', demo: null };
const practiceDemo = {
  id: 'p', kind: 'practice', title: 'Light 1 ON from 5 s to 6 s', explain: 'Select the stretch, then set it ON.',
  demo: { intro: 'Watch Light 1 set ON.', actions: [], outro: 'The bar meant ON.' },
  practice: { instruction: 'Select Light 1 from 5 s to 6 s, then Edit ▸ Set Digitals On.', success: 'Light 1 is ON from 5 s to 6 s only.', triggers: ['set-digital'], setup: [], validate: () => ({ ok: true, message: '' }) },
};
const practicePlain = { ...practiceDemo, id: 'p2', demo: null };
const questionStep = { id: 'q', kind: 'question', title: 'Check your understanding', explain: 'Two panes, two kinds of channel.', demo: null, question: { prompt: 'Which pane shows ON/OFF channels?', options: ['Lower', 'Upper'], correct: 0, why: 'Digitals are below.', hints: ['', 'Analogs are above.'] } };

const idle = { running: false, finished: false };
const running = { running: true, finished: false };
const finished = { running: false, finished: true };

test('a done practice step opens in its try beat; everything else opens in look', () => {
  assert.equal(initialBeat(practiceDemo, true), 'try');
  assert.equal(initialBeat(practiceDemo, false), 'look');
  assert.equal(initialBeat(explainDemo, true), 'look');
  assert.equal(initialBeat(questionStep, true), 'look');
});

test('the primary action follows the beat table', () => {
  assert.deepEqual(primaryAction({ step: explainDemo, beat: 'look', done: false, demo: idle }), { id: 'show-me', label: 'Show me' });
  assert.deepEqual(primaryAction({ step: explainDemo, beat: 'watch', done: false, demo: running }), { id: 'wait', label: 'Demonstrating…' });
  assert.deepEqual(primaryAction({ step: explainDemo, beat: 'watch', done: false, demo: finished }), { id: 'next', label: 'Next' });
  assert.deepEqual(primaryAction({ step: explainPlain, beat: 'look', done: false, demo: idle }), { id: 'next', label: 'Next' });
  assert.deepEqual(primaryAction({ step: explainPlain, beat: 'look', done: false, demo: idle, isLast: true }), { id: 'next', label: 'Finish lesson' });
  assert.deepEqual(primaryAction({ step: practiceDemo, beat: 'look', done: false, demo: idle }), { id: 'show-me', label: 'Show me' });
  assert.deepEqual(primaryAction({ step: practiceDemo, beat: 'watch', done: false, demo: finished }), { id: 'your-turn', label: 'Your turn' });
  assert.deepEqual(primaryAction({ step: practicePlain, beat: 'look', done: false, demo: idle }), { id: 'your-turn', label: 'Your turn' });
  assert.deepEqual(primaryAction({ step: practiceDemo, beat: 'try', done: false, demo: finished }), { id: 'check', label: 'Check' });
  assert.deepEqual(primaryAction({ step: practiceDemo, beat: 'try', done: true, demo: finished }), { id: 'next', label: 'Next' });
  assert.equal(primaryAction({ step: questionStep, beat: 'look', done: false, demo: idle }), null);
  assert.deepEqual(primaryAction({ step: questionStep, beat: 'look', done: true, demo: idle }), { id: 'next', label: 'Next' });
});

test('secondary actions offer a skip, a replay, or nothing', () => {
  assert.deepEqual(secondaryActions({ step: practiceDemo, beat: 'look', done: false, demo: idle }), [{ id: 'skip-to-try', label: 'Skip to trying' }]);
  assert.deepEqual(secondaryActions({ step: explainDemo, beat: 'look', done: false, demo: idle }), []);
  assert.deepEqual(secondaryActions({ step: explainDemo, beat: 'watch', done: false, demo: running }), []);
  assert.deepEqual(secondaryActions({ step: explainDemo, beat: 'watch', done: false, demo: finished }), [{ id: 'watch-again', label: 'Watch again' }]);
  assert.deepEqual(secondaryActions({ step: practiceDemo, beat: 'try', done: false, demo: finished }), [{ id: 'show-again', label: 'Show me again' }]);
  assert.deepEqual(secondaryActions({ step: practicePlain, beat: 'try', done: false, demo: idle }), []);
  // A finished step keeps its demonstration reachable (teaching material is never hidden).
  assert.deepEqual(secondaryActions({ step: practiceDemo, beat: 'try', done: true, demo: finished }), [{ id: 'watch-again', label: 'Watch again' }]);
  assert.deepEqual(secondaryActions({ step: explainDemo, beat: 'look', done: true, demo: idle }), [{ id: 'watch-again', label: 'Watch again' }]);
  assert.deepEqual(secondaryActions({ step: explainDemo, beat: 'watch', done: true, demo: running }), []);
  assert.deepEqual(secondaryActions({ step: practicePlain, beat: 'try', done: true, demo: idle }), []);
});

test('the expression cheers a pass, winces at a miss, watches a demo, and points otherwise', () => {
  assert.equal(expressionFor({ step: practiceDemo, beat: 'try', done: true, feedback: { ok: true, message: 'Exactly right.' }, demo: idle }), 'cheer');
  assert.equal(expressionFor({ step: practiceDemo, beat: 'try', done: false, feedback: { ok: false, message: 'Not yet.' }, demo: idle }), 'oops');
  assert.equal(expressionFor({ step: explainDemo, beat: 'watch', done: false, feedback: null, demo: running }), 'happy');
  assert.equal(expressionFor({ step: explainDemo, beat: 'look', done: false, feedback: null, demo: idle }), 'point');
  assert.equal(expressionFor({ step: questionStep, beat: 'look', done: false, feedback: null, demo: idle }), 'point');
  assert.equal(expressionFor({ step: practiceDemo, beat: 'try', done: true, feedback: null, demo: idle }), 'cheer', 'a resumed done practice step is a result');
  assert.equal(expressionFor({ step: explainDemo, beat: 'look', done: true, feedback: null, demo: idle }), 'point');
});

test('the bubble carries one beat’s text at a time', () => {
  assert.deepEqual(bubbleText({ step: explainDemo, beat: 'look', done: false, feedback: null, demo: idle }), { title: 'The show time', lines: ['Play runs the show.'] });
  assert.deepEqual(bubbleText({ step: explainDemo, beat: 'watch', done: false, feedback: null, demo: running }).lines, ['Watch the readout.']);
  assert.deepEqual(bubbleText({ step: explainDemo, beat: 'watch', done: false, feedback: null, demo: finished }).lines, ['It stopped where it was.']);
  assert.deepEqual(bubbleText({ step: { ...explainDemo, demo: { ...explainDemo.demo, outro: undefined } }, beat: 'watch', done: false, feedback: null, demo: finished }).lines, ['Demonstration finished. Now you try.']);
  assert.deepEqual(bubbleText({ step: practiceDemo, beat: 'try', done: false, feedback: null, demo: finished }).lines, ['Select Light 1 from 5 s to 6 s, then Edit ▸ Set Digitals On.', 'When it’s right: Light 1 is ON from 5 s to 6 s only.']);
  assert.deepEqual(bubbleText({ step: practiceDemo, beat: 'try', done: true, feedback: null, demo: finished }).lines, ['Done. Light 1 is ON from 5 s to 6 s only.']);
  // A miss keeps the instruction under the correction; a pass needs nothing else.
  assert.deepEqual(bubbleText({ step: practiceDemo, beat: 'try', done: false, feedback: { ok: false, message: 'Light 1 is still OFF.' }, demo: finished }).lines, ['Light 1 is still OFF.', 'Select Light 1 from 5 s to 6 s, then Edit ▸ Set Digitals On.']);
  assert.deepEqual(bubbleText({ step: practiceDemo, beat: 'try', done: true, feedback: { ok: true, message: 'Exactly right.' }, demo: finished }).lines, ['Exactly right.']);
  assert.deepEqual(bubbleText({ step: questionStep, beat: 'look', done: false, feedback: { ok: false, message: 'Not quite. Analogs are above. Try again.' }, demo: idle }).lines, ['Not quite. Analogs are above. Try again.', 'Which pane shows ON/OFF channels?']);
  assert.deepEqual(bubbleText({ step: questionStep, beat: 'look', done: false, feedback: null, demo: idle }).lines, ['Two panes, two kinds of channel.', 'Which pane shows ON/OFF channels?']);
  assert.deepEqual(bubbleText({ step: questionStep, beat: 'look', done: true, feedback: { ok: true, message: 'That’s right. Digitals are below.' }, demo: idle }).lines, ['That’s right. Digitals are below.']);
});

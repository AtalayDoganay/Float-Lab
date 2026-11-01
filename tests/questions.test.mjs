import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifyQuestion, answerQuestion, suggestionsFor, hintFor, ADVANCED_TEXT, UNRELATED_TEXT, UNCERTAIN_TEXT } from '../src/renderer/logic/questions.mjs';
import { QA } from '../src/renderer/content/qa.mjs';

test('questions are sorted into basic, advanced, unrelated and uncertain', () => {
  assert.equal(classifyQuestion('what is digital 0').kind, 'basic');
  assert.equal(classifyQuestion('Is Digital Zero the value zero?').kind, 'basic');
  assert.equal(classifyQuestion('how do I set the PID gains').kind, 'advanced');
  assert.equal(classifyQuestion('what about the SD card export').kind, 'advanced');
  assert.equal(classifyQuestion('what’s for lunch?').kind, 'unrelated');
  assert.equal(classifyQuestion('can we play football').kind, 'unrelated');
  assert.equal(classifyQuestion('qwzz').kind, 'uncertain', 'nothing matched: uncertain, never unrelated');
  assert.equal(classifyQuestion('').kind, 'uncertain');
});

test('basic answers are the brief’s, advanced ones redirect, the rest admit or steer', () => {
  const zero = answerQuestion('what does digital 0 mean', { stepId: 'try' });
  assert.equal(zero.kind, 'basic');
  assert.equal(zero.text, 'Digital Zero is the channel’s name. The value we record on that channel can still be ON or OFF.');
  const pid = answerQuestion('how do I tune the PID gains', { stepId: 'try' });
  assert.equal(pid.kind, 'advanced');
  assert.equal(pid.text, ADVANCED_TEXT);
  assert.equal(pid.text, 'That’s a more advanced part of the system. You don’t need to focus on that right now—let’s get this digital event working first.');
  assert.equal(pid.showMe, false);
  const lunch = answerQuestion('what’s for lunch', { stepId: 'try' });
  assert.equal(lunch.kind, 'unrelated');
  assert.equal(lunch.text, UNRELATED_TEXT);
  const huh = answerQuestion('blorp', { stepId: 'try' });
  assert.equal(huh.kind, 'uncertain');
  assert.equal(huh.text, UNCERTAIN_TEXT);
  assert.ok(/Handbook/.test(UNCERTAIN_TEXT) && /another way/.test(UNCERTAIN_TEXT));
});

test('a basic answer offers Show me when a demonstration would help', () => {
  assert.equal(answerQuestion('how do I turn the selection on', { stepId: 'try' }).showMe, true);
  assert.equal(answerQuestion('what is the timeline', { stepId: 'try' }).showMe, false);
  for (const e of QA) assert.ok(['basic', 'advanced'].includes(e.kind) && e.keys.length > 0 && typeof e.answer === 'string', e.id);
});

test('suggested questions depend on the step', () => {
  const tryS = suggestionsFor('try');
  const watch = suggestionsFor('watch');
  assert.equal(tryS.length, 3);
  assert.notDeepEqual(tryS, watch);
  assert.ok(tryS.some((q) => /Digital 0/.test(q)));
  assert.equal(suggestionsFor('anything').length, 3);
  assert.deepEqual(answerQuestion('x', { stepId: 'try' }).suggestions, tryS);
});

test('hints follow the brief’s table of observed problems', () => {
  assert.equal(hintFor('no-channel'), 'Let’s pick Digital 0 first.');
  assert.equal(hintFor('wrong-channel'), 'The timing looks close—let’s check which channel received it.');
  assert.equal(hintFor('selection-no-data'), 'We’ve selected where to work. Now let’s turn that section on.');
  assert.equal(hintFor('too-long'), 'We’re close! Check the duration: we need one second.');
  assert.equal(hintFor('stays-on'), 'It starts correctly. Let’s make sure it switches off at two seconds.');
  assert.equal(hintFor('not-previewed'), 'Looks ready. Let’s play it and watch what happens.');
  assert.equal(hintFor('done'), 'Yes! One second ON. You got it!');
  assert.ok(hintFor('misplaced').length > 10 && hintFor('nonsense').length > 10, 'every state has some hint');
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MASCOT, EXPRESSIONS, mascotSrc, WELCOME, LINES } from '../src/renderer/content/mascot.mjs';

const nonEmpty = (value) => typeof value === 'string' && value.trim().length > 0;
const words = (text) => text.trim().split(/\s+/).length;

test('the mascot is named in one place and has five expressions with local SVG files', () => {
  assert.equal(MASCOT.name, 'Rosie');
  assert.deepEqual([...EXPRESSIONS], ['wave', 'point', 'happy', 'cheer', 'oops']);
  assert.equal(mascotSrc('cheer'), 'assets/mascot/rosie-cheer.svg');
  assert.throws(() => mascotSrc('angry'), RangeError);
});

test('the welcome is three short beats, each with a button, ending in Let’s go', () => {
  assert.equal(WELCOME.length, 3);
  for (const beat of WELCOME) {
    assert.ok(nonEmpty(beat.text), 'beat text');
    assert.ok(words(beat.text) <= 45, `beat is brief: ${words(beat.text)} words`);
    assert.ok(EXPRESSIONS.includes(beat.expression), beat.expression);
    assert.ok(nonEmpty(beat.button));
  }
  assert.equal(WELCOME[WELCOME.length - 1].button, 'Let’s go');
  assert.ok(WELCOME[0].text.includes('Rosie'), 'the first beat introduces her by name');
  assert.ok(!/copy of the real/.test(WELCOME[0].text) && /recreat/.test(WELCOME[0].text), 'the windows are a recreation, never claimed as a copy');
});

test('every guide line is non-empty text built from its arguments', () => {
  assert.ok(nonEmpty(LINES.homeFirst()));
  const back = LINES.homeReturning({ levelName: 'Basic', lessonTitle: 'Reading the timeline', stepIndex: 3, stepTotal: 5 });
  assert.ok(back.includes('Reading the timeline') && back.includes('step 4 of 5'), back);
  assert.ok(LINES.homeReturningLevel({ levelName: 'Basic' }).includes('Basic'));
  const now = LINES.homeCurrent({ levelName: 'Basic', lessonTitle: 'Play and Stop', stepIndex: 1, stepTotal: 5 });
  assert.ok(now.includes('Play and Stop') && now.includes('step 2 of 5') && !now.includes('Welcome back'), now);
  assert.ok(LINES.homeCurrentLevel({ levelName: 'intermediate' }).includes('intermediate'));
  assert.ok(nonEmpty(LINES.beginHere()));
  assert.ok(nonEmpty(LINES.pickUp()));
  const fin = LINES.finished({ title: 'Play and Stop', nextTitle: 'Terminal keys' });
  assert.ok(fin.includes('Play and Stop') && fin.includes('Terminal keys'), fin);
  assert.ok(nonEmpty(LINES.finished({ title: 'Play and Stop', nextTitle: null })));
  assert.ok(LINES.levelDone({ levelName: 'intermediate' }).includes('intermediate'));
  assert.ok(nonEmpty(LINES.explore()));
  assert.ok(LINES.expected({ success: 'Light 1 is ON.' }).includes('Light 1 is ON.'));
  assert.ok(LINES.done({ success: 'Light 1 is ON.' }).includes('Light 1 is ON.'));
  assert.equal(LINES.blocked(), 'Finish this step first: complete the practice or answer the question.');
});

test('each expression ships as a bundled, self-contained SVG with no inline styles or scripts', async () => {
  const fs = await import('node:fs/promises');
  for (const expression of EXPRESSIONS) {
    const file = new URL(`../src/renderer/${mascotSrc(expression)}`, import.meta.url);
    const text = await fs.readFile(file, 'utf8');
    assert.ok(text.trimStart().startsWith('<svg'), `${expression}: starts with <svg`);
    assert.ok(text.includes('viewBox="0 0 240 260"'), `${expression}: viewBox`);
    assert.ok(/<title[^>]*>[^<]*Rosie[^<]*<\/title>/.test(text), `${expression}: title names Rosie`);
    assert.ok(!/ style=/.test(text), `${expression}: no inline style attributes (CSP style-src self)`);
    assert.ok(!/<script/i.test(text) && !/href=/.test(text), `${expression}: no scripts or references`);
    assert.ok(text.length < 40000, `${expression}: under 40 KB`);
  }
});

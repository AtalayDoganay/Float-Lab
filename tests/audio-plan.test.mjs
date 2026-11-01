import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MUSIC, CHIRP_MAX_PER_SECOND, chirpPhrase, pickVoice, limiter } from '../src/renderer/logic/audio-plan.mjs';

const MIN_GAP = 1000 / CHIRP_MAX_PER_SECOND;

test('a chirp phrase is one short burst per word group, never denser than the cap', () => {
  const blips = chirpPhrase('Okay, now we know how!', 'neutral');
  assert.ok(blips.length >= 2 && blips.length <= 5, `bursts: ${blips.length}`);
  for (let i = 1; i < blips.length; i += 1) assert.ok(blips[i].at - blips[i - 1].at >= MIN_GAP - 1e-9, 'starts are spaced at least the density cap apart');
  for (const b of blips) {
    assert.ok(b.freq >= 250 && b.freq <= 1400, `pitch ${b.freq}`);
    assert.ok(b.gain > 0 && b.gain <= 0.5, `gain ${b.gain}`);
    assert.ok(b.dur >= 40 && b.dur <= 220, `duration ${b.dur}`);
  }
  assert.deepEqual(chirpPhrase('', 'neutral'), []);
  assert.deepEqual(chirpPhrase('   ', 'excited'), []);
});

test('punctuation leaves a longer gap than the gap between words', () => {
  const plain = chirpPhrase('okay now', 'neutral');
  const comma = chirpPhrase('okay, now', 'neutral');
  const wordGap = plain[1].at - plain[0].at;
  const pauseGap = comma[1].at - comma[0].at;
  assert.ok(pauseGap >= wordGap + 90, `comma gap ${pauseGap} vs word gap ${wordGap}`);
});

test('excitement sounds quicker and brighter; concern softer and slower', () => {
  const text = 'Watch the playhead. ON at one. OFF at two.';
  const neutral = chirpPhrase(text, 'neutral');
  const excited = chirpPhrase(text, 'excited');
  const concern = chirpPhrase(text, 'concern');
  const mean = (list, key) => list.reduce((s, b) => s + b[key], 0) / list.length;
  const end = (list) => list[list.length - 1].at + list[list.length - 1].dur;
  assert.ok(mean(excited, 'freq') > mean(neutral, 'freq'), 'brighter');
  assert.ok(end(excited) < end(neutral), 'quicker');
  assert.ok(mean(concern, 'freq') < mean(neutral, 'freq'), 'lower');
  assert.ok(end(concern) > end(neutral), 'slower');
  assert.ok(mean(concern, 'gain') < mean(neutral, 'gain'), 'softer');
});

test('a long line is capped: at most twenty bursts and four seconds', () => {
  const long = Array.from({ length: 60 }, (_, i) => `word${i}`).join(' ');
  const blips = chirpPhrase(long, 'neutral');
  assert.ok(blips.length <= 20, `bursts: ${blips.length}`);
  const last = blips[blips.length - 1];
  assert.ok(last.at + last.dur <= 4000, `ends at ${last.at + last.dur}`);
});

test('the same text always gives the same chirps (one recognizable voice)', () => {
  assert.deepEqual(chirpPhrase('Ready? Let’s make something move!', 'excited'), chirpPhrase('Ready? Let’s make something move!', 'excited'));
});

test('the narrator prefers a masculine en-US voice, then any en-US, then any English', () => {
  const v = (name, lang) => ({ name, lang });
  assert.equal(pickVoice([v('Microsoft Zira Desktop', 'en-US'), v('Microsoft David Desktop', 'en-US')]).name, 'Microsoft David Desktop');
  assert.equal(pickVoice([v('Google UK English Female', 'en-GB'), v('Google US English', 'en-US')]).name, 'Google US English');
  assert.equal(pickVoice([v('Microsoft Hazel', 'en-GB')]).name, 'Microsoft Hazel');
  assert.equal(pickVoice([v('Microsoft Hedda', 'de-DE')]), null);
  assert.equal(pickVoice([]), null);
  assert.equal(pickVoice(undefined), null);
});

test('a limiter lets one cue through per gap', () => {
  const allow = limiter(120);
  assert.equal(allow(0), true);
  assert.equal(allow(50), false);
  assert.equal(allow(119), false);
  assert.equal(allow(130), true);
  assert.equal(allow(200), false);
});

test('the music plans are quiet, ordered, and the bed loops cleanly', () => {
  for (const [name, plan] of Object.entries(MUSIC)) {
    assert.ok(plan.notes.length >= 2, `${name} has notes`);
    for (let i = 0; i < plan.notes.length; i += 1) {
      const n = plan.notes[i];
      assert.ok(n.gain > 0 && n.gain <= 0.25, `${name}: gain ${n.gain}`);
      assert.ok(n.freq >= 40 && n.freq <= 2000, `${name}: freq ${n.freq}`);
      assert.ok(['sine', 'triangle', 'square', 'sawtooth'].includes(n.wave));
      if (i) assert.ok(n.at >= plan.notes[i - 1].at, `${name}: sorted by time`);
    }
  }
  assert.ok(MUSIC.bed.loopLength >= 8, 'the bed is long enough not to grate');
  for (const n of MUSIC.bed.notes) assert.ok(n.at + n.dur <= MUSIC.bed.loopLength + 1e-9, 'every bed note ends inside the loop');
  assert.ok(MUSIC.sting.notes.length >= 3 && MUSIC.done.notes.length >= 2);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { INTRO_FILM, INTRO_TITLE, INTRO_SUBLINE } from '../src/renderer/content/intro.mjs';
import { ARCHIVE_BY_ID } from '../src/renderer/content/archive.mjs';

const NARRATION = [
  'Welcome to Roseflow. Behind every moving float is a team learning how to bring an idea to life.',
  'Cal Poly Pomona and Cal Poly San Luis Obispo work together to build a student-created Rose Parade float.',
  'The tradition began with Rocking Horse in 1949, an entry that earned the Award of Merit.',
  'Over the years, students developed new ways to animate their creations. That combination of creativity and engineering still defines the program.',
  'Meet a few award-winning creations—and the teamwork behind them.',
  'And the story continues.',
  'Here, you’ll practice timing, digital channels, and the controls that organize a show. Watch a short example, try it yourself, and ask Rosie whenever you need help.',
];

test('the film is the eight beats of the brief, narrated with its lines', () => {
  assert.equal(INTRO_TITLE, 'Roseflow — Cal Poly Rose Float Training');
  assert.equal(INTRO_SUBLINE, 'Pomona × San Luis Obispo · Learn by Doing');
  assert.deepEqual(INTRO_FILM.beats.map((b) => b.id), ['leader', 'campuses', '1949', '1978-2024', '2024-2025', '2026', 'practice', 'ready']);
  assert.deepEqual(INTRO_FILM.beats.slice(0, 7).map((b) => b.say), NARRATION);
  const ready = INTRO_FILM.beats[7];
  assert.equal(ready.say, undefined, 'the last beat is Rosie’s, not the narrator’s');
  assert.equal(ready.rosie.line, 'Ready? Let’s make something move!');
  assert.equal(ready.rosie.chirp, 'excited');
});

test('the photos appear in year order, each labelled with year, title and award', () => {
  const seen = [];
  for (const b of INTRO_FILM.beats) {
    if (b.photo) seen.push(b.photo);
    for (const a of b.actions || []) if (a.photo) seen.push(a.photo);
  }
  const firsts = seen.filter((id, i) => seen.indexOf(id) === i);
  assert.deepEqual(firsts, ['h', 'i', 'j', 'k', 'l']);
  for (const b of INTRO_FILM.beats) {
    if (!b.photo) continue;
    const p = ARCHIVE_BY_ID[b.photo];
    assert.ok(b.photoLabel.includes(String(p.year)) && b.photoLabel.includes(p.title), `${b.id}: ${b.photoLabel}`);
  }
  const beat2026 = INTRO_FILM.beats.find((b) => b.id === '2026');
  assert.ok(beat2026.photoLabel.includes('2026') && beat2026.photoLabel.includes('Sweepstakes Award'));
  const labels = INTRO_FILM.beats.map((b) => b.photoLabel || '').join(' ');
  assert.ok(!/latest/i.test(labels), '2025 is never called the latest entry');
});

test('the storyboard runs about a minute and keeps its visual cues', () => {
  const total = INTRO_FILM.beats.reduce((s, b) => s + (b.minMs || 0), 0);
  assert.ok(total >= 45000 && total <= 60000, `${total} ms`);
  assert.deepEqual(INTRO_FILM.beats.map((b) => b.visual), ['leader', 'campuses', 'photo', 'photo', 'photo', 'photo', 'timeline', 'ready']);
  for (const b of INTRO_FILM.beats) assert.ok(b.rosie && b.rosie.expression, `${b.id} directs Rosie`);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCuePlayer, captionMs } from '../src/renderer/logic/cue-player.mjs';

// A fake clock and timer queue, so every beat and action runs when the test says.
function fakeTime() {
  let clock = 0;
  let nextId = 1;
  const timers = new Map();
  const api = {
    now: () => clock,
    setTimeout: (fn, ms) => { const id = nextId++; timers.set(id, { fn, at: clock + Math.max(0, ms) }); return id; },
    clearTimeout: (id) => { timers.delete(id); },
    async advance(ms) {
      const target = clock + ms;
      for (;;) {
        const due = [...timers.entries()].filter(([, t]) => t.at <= target).sort((a, b) => a[1].at - b[1].at)[0];
        if (!due) break;
        clock = due[1].at;
        timers.delete(due[0]);
        due[1].fn();
        await flush();
      }
      clock = target;
      await flush();
    },
    pending: () => timers.size,
  };
  return api;
}
const flush = () => new Promise((resolve) => setImmediate(resolve));

function harness(film, { spoken = true, performer } = {}) {
  const time = fakeTime();
  const log = { beats: [], captions: [], rosie: [], performed: [], done: 0, narrator: [] };
  const narrator = {
    speak: (text) => { log.narrator.push(['speak', text]); return Promise.resolve({ spoken }); },
    pause: () => log.narrator.push(['pause']),
    resume: () => log.narrator.push(['resume']),
    cancel: () => log.narrator.push(['cancel']),
  };
  const player = createCuePlayer(film, {
    narrator,
    perform: performer || ((cue) => { log.performed.push(cue); }),
    onCaption: (c) => log.captions.push(c),
    onRosie: (r) => log.rosie.push(r),
    onBeat: (i) => log.beats.push(i),
    onDone: () => { log.done += 1; },
    now: time.now,
    setTimeout: time.setTimeout,
    clearTimeout: time.clearTimeout,
  });
  return { player, log, time };
}

const FILM = {
  id: 'f',
  beats: [
    { id: 'one', say: 'first line', caption: 'First', rosie: { expression: 'joy', line: 'Hi!' }, actions: [{ at: 100, dispatch: { type: 'x' } }, { at: 300, click: 'play' }] },
    { id: 'two', say: 'second line' },
  ],
};

test('beats run in order, actions fire at their offsets, and the film ends once', async () => {
  const { player, log, time } = harness(FILM);
  player.play();
  await flush();
  assert.deepEqual(log.beats, [0]);
  assert.deepEqual(log.captions, ['First']);
  assert.deepEqual(log.rosie, [{ expression: 'joy', line: 'Hi!' }]);
  await time.advance(99);
  assert.equal(log.performed.length, 0);
  await time.advance(1);
  assert.deepEqual(log.performed, [{ dispatch: { type: 'x' } }]);
  assert.equal(player.status().beat, 0, 'the beat waits for its last action');
  await time.advance(200);
  assert.deepEqual(log.performed[1], { click: 'play' });
  assert.deepEqual(log.beats, [0, 1], 'the second beat starts once the first is complete');
  await flush();
  assert.equal(log.done, 1);
  assert.equal(player.status().done, true);
  assert.equal(player.status().playing, false);
  player.stop();
  assert.equal(log.done, 1, 'stopping afterwards does not end it twice');
});

test('a line the narrator cannot speak lasts long enough to be read as a caption', async () => {
  const film = { id: 'c', beats: [{ id: 'a', say: 'four words here now' }] };
  assert.equal(captionMs('four words here now'), 1500 + 4 * 60);
  const { player, log, time } = harness(film, { spoken: false });
  player.play();
  await time.advance(1700);
  assert.equal(log.done, 0);
  await time.advance(40);
  assert.equal(log.done, 1);
});

test('minMs holds a beat open even when the narration is already over', async () => {
  const film = { id: 'm', beats: [{ id: 'a', say: 'hi', minMs: 900 }, { id: 'b' }] };
  const { player, log, time } = harness(film);
  player.play();
  await time.advance(899);
  assert.deepEqual(log.beats, [0]);
  await time.advance(1);
  assert.deepEqual(log.beats, [0, 1]);
});

test('pause freezes the clock and the narration; resume fires the remaining actions from where it stopped', async () => {
  const film = { id: 'p', beats: [{ id: 'a', say: 'line', actions: [{ at: 600, dispatch: { type: 'late' } }] }] };
  const { player, log, time } = harness(film);
  player.play();
  await time.advance(400);
  player.pause();
  assert.deepEqual(player.status(), { beat: 0, playing: true, paused: true, elapsedMs: 400, done: false });
  await time.advance(1000);
  assert.equal(log.performed.length, 0, 'nothing fires while paused');
  assert.equal(player.status().elapsedMs, 400);
  assert.ok(log.narrator.some((n) => n[0] === 'pause'));
  player.resume();
  assert.ok(log.narrator.some((n) => n[0] === 'resume'));
  await time.advance(199);
  assert.equal(log.performed.length, 0);
  await time.advance(1);
  assert.deepEqual(log.performed, [{ dispatch: { type: 'late' } }]);
});

test('replay cancels the narration, stops the chirps, and starts again at the first beat', async () => {
  const { player, log, time } = harness(FILM);
  player.play();
  await time.advance(300);
  assert.deepEqual(log.beats, [0, 1]);
  player.replay();
  await flush();
  assert.ok(log.narrator.some((n) => n[0] === 'cancel'));
  assert.ok(log.rosie.some((r) => r.chirp === 'stop'));
  assert.deepEqual(log.beats, [0, 1, 0]);
  assert.equal(player.status().beat, 0);
  assert.equal(player.status().playing, true);
});

test('stop clears the caption, cancels narration and pending actions, and does not count as finishing', async () => {
  const { player, log, time } = harness(FILM);
  player.play();
  await time.advance(50);
  player.stop();
  assert.equal(log.captions[log.captions.length - 1], null);
  assert.equal(time.pending(), 0, 'no timers survive a stop');
  await time.advance(5000);
  assert.equal(log.performed.length, 0);
  assert.equal(log.done, 0);
  assert.equal(player.status().playing, false);
});

test('an action is awaited: the beat does not end until perform resolves', async () => {
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  const film = { id: 'w', beats: [{ id: 'a', actions: [{ at: 0, click: 'menu-edit' }] }, { id: 'b' }] };
  const { player, log, time } = harness(film, { performer: () => gate });
  player.play();
  await time.advance(500);
  assert.deepEqual(log.beats, [0]);
  release();
  await flush();
  await flush();
  assert.deepEqual(log.beats, [0, 1]);
});

test('actions of a beat are performed one after another, in order, never overlapping', async () => {
  const log = [];
  let release;
  const film = { id: 'o', beats: [{ id: 'a', actions: [{ at: 100, click: 'first' }, { at: 150, click: 'second' }] }, { id: 'b' }] };
  const { player, time } = harness(film, {
    performer: (cue) => {
      log.push(`start ${cue.click}`);
      if (cue.click === 'first') return new Promise((resolve) => { release = () => { log.push('end first'); resolve(); }; });
      log.push('end second');
      return undefined;
    },
  });
  player.play();
  await time.advance(200);
  assert.deepEqual(log, ['start first'], 'the second action waits for the first to finish');
  release();
  await flush();
  await flush();
  assert.deepEqual(log, ['start first', 'end first', 'start second', 'end second']);
});

test('seekBeat jumps to a beat and plays from there', async () => {
  const { player, log, time } = harness(FILM);
  player.play();
  await flush();
  player.seekBeat(1);
  await flush();
  assert.deepEqual(log.beats, [0, 1]);
  await time.advance(10);
  assert.equal(log.done, 1);
});

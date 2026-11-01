import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { DEFAULT_PREFS, validatePrefs } from '../src/shared/prefs-schema.mjs';
import { createPrefsStore, PREFS_FILE } from '../src/main/prefs-store.mjs';

test('defaults: three sound layers plus ui cues, captions on, playful confirmation, no motion override', () => {
  assert.deepEqual(DEFAULT_PREFS, {
    volumes: { narration: 1, music: 0.6, mascot: 0.8, ui: 0.5 },
    muted: { narration: false, music: false, mascot: false, ui: false },
    captions: true,
    simpleConfirm: false,
    reducedMotion: null,
  });
  assert.deepEqual(validatePrefs(undefined), { ok: true, value: DEFAULT_PREFS });
});

test('validation clamps volumes, keeps only booleans, drops unknown keys', () => {
  const r = validatePrefs({ volumes: { music: 2, narration: -1, mascot: 'loud' }, muted: { music: true, ui: 'yes' }, captions: 'yes', simpleConfirm: true, reducedMotion: true, extra: 1 });
  assert.equal(r.ok, true);
  assert.deepEqual(r.value, {
    volumes: { narration: 0, music: 1, mascot: 0.8, ui: 0.5 },
    muted: { narration: false, music: true, mascot: false, ui: false },
    captions: true,
    simpleConfirm: true,
    reducedMotion: true,
  });
  assert.equal('extra' in r.value, false);
  assert.deepEqual(validatePrefs('nope'), { ok: false, error: 'not-an-object' });
  assert.deepEqual(validatePrefs({ reducedMotion: 'maybe' }).value.reducedMotion, null);
});

test('the prefs store round-trips, survives bad json, and names its file', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'roseflow-prefs-'));
  const store = createPrefsStore({ dir });
  assert.equal(path.basename(store.filePath), PREFS_FILE);
  assert.deepEqual(await store.load(), { ok: true, value: DEFAULT_PREFS });
  const saved = await store.save({ ...DEFAULT_PREFS, captions: false, volumes: { ...DEFAULT_PREFS.volumes, music: 0.2 } });
  assert.equal(saved.ok, true);
  const back = await store.load();
  assert.equal(back.value.captions, false);
  assert.equal(back.value.volumes.music, 0.2);
  await fs.writeFile(store.filePath, '{ not json', 'utf8');
  assert.deepEqual(await store.load(), { ok: true, value: DEFAULT_PREFS, recovered: 'invalid-json' });
  assert.equal((await store.save({ captions: 'bad' })).ok, true, 'a partly invalid document is normalized, not refused');
  await fs.rm(dir, { recursive: true, force: true });
});

test('concurrent saves are written one after another: every save succeeds and the last one wins', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'roseflow-prefs-'));
  const store = createPrefsStore({ dir });
  const results = await Promise.all(Array.from({ length: 24 }, (_, i) => store.save({ ...DEFAULT_PREFS, volumes: { ...DEFAULT_PREFS.volumes, narration: (i % 20) / 20 } })));
  assert.ok(results.every((r) => r.ok), JSON.stringify(results.filter((r) => !r.ok)));
  const back = await store.load();
  assert.equal(back.ok, true);
  assert.equal(back.value.volumes.narration, 23 % 20 / 20);
  await fs.rm(dir, { recursive: true, force: true });
});

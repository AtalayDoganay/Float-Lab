import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createProgressStore } from '../src/main/progress-store.mjs';
import { createEmptyProgress } from '../src/shared/progress-schema.mjs';

async function tempDir() {
  return fs.mkdtemp(path.join(os.tmpdir(), 'roseflow-store-'));
}

test('save then load round-trips the document and stamps savedAt', async () => {
  const dir = await tempDir();
  const store = createProgressStore({ dir, now: () => new Date('2026-10-07T10:00:00Z') });
  const doc = createEmptyProgress();
  doc.course.completedLessons = ['l01'];
  const saved = await store.save(doc);
  assert.equal(saved.ok, true);
  assert.equal(saved.savedAt, '2026-10-07T10:00:00.000Z');

  const loaded = await store.load();
  assert.equal(loaded.ok, true);
  assert.deepEqual(loaded.value.course.completedLessons, ['l01']);
  assert.equal(loaded.value.savedAt, '2026-10-07T10:00:00.000Z');
});

test('load with no file reports no saved progress', async () => {
  const dir = await tempDir();
  const store = createProgressStore({ dir });
  const loaded = await store.load();
  assert.deepEqual(loaded, { ok: true, value: null });
});

test('malformed JSON is quarantined and reported instead of crashing', async () => {
  const dir = await tempDir();
  const store = createProgressStore({ dir, now: () => new Date('2026-10-07T10:00:00Z') });
  await fs.writeFile(store.filePath, '{ this is not json', 'utf8');

  const loaded = await store.load();
  assert.equal(loaded.ok, true);
  assert.equal(loaded.value, null);
  assert.equal(loaded.recovered.reason, 'invalid-json');
  assert.match(path.basename(loaded.recovered.quarantinedPath), /^progress\.invalid-.*\.json$/);
  await assert.rejects(fs.access(store.filePath));
  await fs.access(loaded.recovered.quarantinedPath);
});

test('a document with an unsupported schema is quarantined the same way', async () => {
  const dir = await tempDir();
  const store = createProgressStore({ dir });
  const doc = { ...createEmptyProgress(), schemaVersion: 99 };
  await fs.writeFile(store.filePath, JSON.stringify(doc), 'utf8');

  const loaded = await store.load();
  assert.equal(loaded.value, null);
  assert.equal(loaded.recovered.reason, 'unsupported-schema');
  await assert.rejects(fs.access(store.filePath));
});

test('save refuses an invalid document without touching disk', async () => {
  const dir = await tempDir();
  const store = createProgressStore({ dir });
  const doc = createEmptyProgress();
  doc.settings.command = 999;
  const saved = await store.save(doc);
  assert.equal(saved.ok, false);
  assert.equal(saved.error, 'invalid-progress');
  await assert.rejects(fs.access(store.filePath));
});

test('a failed write is reported and leaves no partial file behind', async () => {
  const parent = await tempDir();
  const blocker = path.join(parent, 'blocker');
  await fs.writeFile(blocker, 'I am a file, not a directory', 'utf8');
  const store = createProgressStore({ dir: blocker });
  const saved = await store.save(createEmptyProgress());
  assert.equal(saved.ok, false);
  assert.equal(typeof saved.error, 'string');
  assert.ok(saved.error.length > 0);
  const siblings = await fs.readdir(parent);
  assert.deepEqual(siblings, ['blocker']);
});

test('reset removes the saved file so the next load starts fresh', async () => {
  const dir = await tempDir();
  const store = createProgressStore({ dir });
  await store.save(createEmptyProgress());
  const reset = await store.reset();
  assert.equal(reset.ok, true);
  const loaded = await store.load();
  assert.deepEqual(loaded, { ok: true, value: null });
  const resetAgain = await store.reset();
  assert.equal(resetAgain.ok, true, 'resetting with no file is still a success');
});

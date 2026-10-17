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

const V1_TEXT = JSON.stringify({
  schemaVersion: 1,
  app: 'roseflow-pc-mac-training',
  savedAt: '2026-10-07T16:47:52.826Z',
  location: { view: 'handbook', lessonId: 'l01', questionIndex: 0, exerciseId: 'understand-address', stepIndex: 0 },
  course: { completedLessons: [], missedLessons: [], answered: ['l01q1'] },
  guided: { completedSteps: ['schedule-light:sl-channel'], completedExercises: [] },
  settings: { channelId: 'light-1', blocks: [false, false, true, true, false, false, false, false], axis: 3, command: 128, laptopIp: '192.168.0.20' },
}, null, 2);

test('save then load round-trips the document and stamps savedAt', async () => {
  const dir = await tempDir();
  const store = createProgressStore({ dir, now: () => new Date('2026-10-07T10:00:00Z') });
  const doc = createEmptyProgress();
  doc.learning.completedLessons = ['b-interface'];
  const saved = await store.save(doc);
  assert.equal(saved.ok, true);
  assert.equal(saved.savedAt, '2026-10-07T10:00:00.000Z');

  const loaded = await store.load();
  assert.equal(loaded.ok, true);
  assert.deepEqual(loaded.value.learning.completedLessons, ['b-interface']);
  assert.equal(loaded.value.savedAt, '2026-10-07T10:00:00.000Z');
  assert.equal(loaded.migrated, undefined);
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

test('a document with an unknown schema is quarantined the same way', async () => {
  const dir = await tempDir();
  const store = createProgressStore({ dir });
  const doc = { ...createEmptyProgress(), schemaVersion: 99 };
  await fs.writeFile(store.filePath, JSON.stringify(doc), 'utf8');

  const loaded = await store.load();
  assert.equal(loaded.value, null);
  assert.equal(loaded.recovered.reason, 'unsupported-schema');
  await assert.rejects(fs.access(store.filePath));
});

test('a version-1 file is migrated on load, backed up byte for byte, and left in place', async () => {
  const dir = await tempDir();
  const store = createProgressStore({ dir, now: () => new Date('2026-10-07T18:00:00Z') });
  await fs.writeFile(store.filePath, V1_TEXT, 'utf8');

  const loaded = await store.load();
  assert.equal(loaded.ok, true);
  assert.equal(loaded.value.schemaVersion, 3);
  assert.deepEqual(loaded.value.course.answered, ['l01q1']);
  assert.deepEqual(loaded.value.guided.completedSteps, ['schedule-light:sl-channel']);
  assert.equal(loaded.value.settings.axis, 3);
  assert.deepEqual(loaded.migrated, { fromSchemaVersion: 1, backupPath: path.join(dir, 'progress.v1-backup.json') });
  assert.equal(await fs.readFile(loaded.migrated.backupPath, 'utf8'), V1_TEXT, 'the backup is the original text');
  assert.equal(await fs.readFile(store.filePath, 'utf8'), V1_TEXT, 'loading alone does not rewrite the file');
});

test('migrating twice never overwrites the first backup', async () => {
  const dir = await tempDir();
  const store = createProgressStore({ dir });
  await fs.writeFile(store.filePath, V1_TEXT, 'utf8');
  await store.load();
  const backupPath = path.join(dir, 'progress.v1-backup.json');
  await fs.writeFile(store.filePath, V1_TEXT.replace('"axis": 3', '"axis": 1'), 'utf8');
  const second = await store.load();
  assert.equal(second.value.settings.axis, 1);
  assert.equal(await fs.readFile(backupPath, 'utf8'), V1_TEXT, 'the original backup survives a second migration');
});

test('a version-2 file is migrated on load and backed up as progress.v2-backup.json', async () => {
  const dir = await tempDir();
  const store = createProgressStore({ dir });
  const v2 = { ...JSON.parse(V1_TEXT), schemaVersion: 2, location: { view: 'level', level: 'basic', lessonId: null, stepIndex: 0 }, learning: { completedSteps: [], completedLessons: ['b-system'], missedLessons: [] }, migrated: null };
  const text = JSON.stringify(v2, null, 2);
  await fs.writeFile(store.filePath, text, 'utf8');
  const loaded = await store.load();
  assert.equal(loaded.value.schemaVersion, 3);
  assert.deepEqual(loaded.value.learning.completedLessons, ['b-system']);
  assert.deepEqual(loaded.value.location, v2.location);
  assert.deepEqual(loaded.migrated, { fromSchemaVersion: 2, backupPath: path.join(dir, 'progress.v2-backup.json') });
  assert.equal(await fs.readFile(loaded.migrated.backupPath, 'utf8'), text);
});

test('after the app saves once, the file is version 3 and the backup still exists', async () => {
  const dir = await tempDir();
  const store = createProgressStore({ dir });
  await fs.writeFile(store.filePath, V1_TEXT, 'utf8');
  const loaded = await store.load();
  const saved = await store.save(loaded.value);
  assert.equal(saved.ok, true);
  const again = await store.load();
  assert.equal(again.value.schemaVersion, 3);
  assert.equal(again.migrated, undefined, 'a version-3 file is not migrated again');
  await fs.access(path.join(dir, 'progress.v1-backup.json'));
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

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  SCHEMA_VERSION,
  APP_ID,
  LEVELS,
  createEmptyProgress,
  validateProgress,
  migrateProgress,
} from '../src/shared/progress-schema.mjs';

// A representative schema-1 document, shaped like the owner's real file on
// October 7, 2026 (handbook view, address exercise open, axis 3, nothing done).
function v1Doc(overrides = {}) {
  return {
    schemaVersion: 1,
    app: 'roseflow-pc-mac-training',
    savedAt: '2026-10-07T16:47:52.826Z',
    location: { view: 'handbook', lessonId: 'l01', questionIndex: 0, exerciseId: 'understand-address', stepIndex: 0 },
    course: { completedLessons: [], missedLessons: [], answered: [] },
    guided: { completedSteps: [], completedExercises: [] },
    settings: { channelId: 'light-1', blocks: [false, false, true, true, false, false, false, false], axis: 3, command: 128, laptopIp: '192.168.0.20' },
    ...overrides,
  };
}

// A representative schema-2 document as the guided-learning build wrote it.
function v2Doc(overrides = {}) {
  return {
    schemaVersion: 2,
    app: 'roseflow-pc-mac-training',
    savedAt: '2026-10-07T19:12:00.000Z',
    location: { view: 'lesson', level: 'basic', lessonId: 'b-timeline-graph', stepIndex: 2 },
    learning: { completedSteps: ['b-system:show', 'b-timeline-graph:seconds'], completedLessons: ['b-system'], missedLessons: [] },
    course: { completedLessons: [], missedLessons: ['l03'], answered: ['l03q1'] },
    guided: { completedSteps: ['schedule-light:sl-channel'], completedExercises: [] },
    settings: { channelId: 'light-2', blocks: [false, false, true, true, false, true, false, false], axis: 2, command: 100, laptopIp: '192.168.1.20' },
    migrated: null,
    ...overrides,
  };
}

test('the current schema is version 4 and names the three legacy levels plus the course', () => {
  assert.equal(SCHEMA_VERSION, 4);
  assert.deepEqual(LEVELS, ['basic', 'intermediate', 'hate', 'course']);
});

test('empty progress document validates and comes back unchanged', () => {
  const doc = createEmptyProgress();
  assert.equal(doc.schemaVersion, SCHEMA_VERSION);
  assert.equal(doc.app, APP_ID);
  assert.deepEqual(doc.location, { view: 'home', level: null, lessonId: null, stepIndex: 0 });
  assert.deepEqual(doc.learning, { completedSteps: [], completedLessons: [], missedLessons: [] });
  assert.equal(doc.migrated, null);
  const result = validateProgress(doc);
  assert.equal(result.ok, true);
  assert.deepEqual(result.value, doc);
});

test('rejects input that is not a plain object', () => {
  for (const bad of [null, undefined, 'text', 42, [], () => {}]) {
    const result = validateProgress(bad);
    assert.equal(result.ok, false);
    assert.equal(result.error, 'not-an-object');
  }
});

test('rejects an unsupported schema version, including the old version 1 without migration', () => {
  assert.equal(validateProgress({ ...createEmptyProgress(), schemaVersion: 99 }).error, 'unsupported-schema');
  assert.equal(validateProgress(v1Doc()).error, 'unsupported-schema');
});

test('rejects a document written by a different app', () => {
  const doc = { ...createEmptyProgress(), app: 'one-file' };
  const result = validateProgress(doc);
  assert.equal(result.ok, false);
  assert.equal(result.error, 'wrong-app');
});

test('the default show data is Light 1 ON from 2 s to 4 s and four Soft Console values of 128', () => {
  const s = createEmptyProgress().settings;
  assert.deepEqual(s.lights, { 'light-1': [[60, 120]], 'light-2': [] });
  assert.equal(s.analogs, null, 'null means the trainer’s default analog show data');
  assert.deepEqual(s.console, [128, 128, 128, 128]);
});

test('rejects ON spans that overlap, run backwards, or leave the 240-frame show', () => {
  for (const bad of [[[60, 50]], [[0, 241]], [[10, 30], [20, 40]], [[1.5, 3]], 'x']) {
    const doc = createEmptyProgress();
    doc.settings.lights = { 'light-1': bad, 'light-2': [] };
    assert.equal(validateProgress(doc).error, 'invalid-settings', JSON.stringify(bad));
  }
});

test('analog show data must be four run-length lists covering exactly 240 frames of 0-255', () => {
  const ok = createEmptyProgress();
  ok.settings.analogs = [[[128, 240]], [[0, 120], [255, 120]], [[64, 240]], [[191, 240]]];
  assert.equal(validateProgress(ok).ok, true);
  const short = createEmptyProgress();
  short.settings.analogs = [[[128, 239]], [[128, 240]], [[128, 240]], [[128, 240]]];
  assert.equal(validateProgress(short).error, 'invalid-settings');
  const tooHigh = createEmptyProgress();
  tooHigh.settings.analogs = [[[256, 240]], [[128, 240]], [[128, 240]], [[128, 240]]];
  assert.equal(validateProgress(tooHigh).error, 'invalid-settings');
  const badConsole = createEmptyProgress();
  badConsole.settings.console = [1, 2, 3];
  assert.equal(validateProgress(badConsole).error, 'invalid-settings');
});

test('rejects a command outside 0-255 or an axis outside 0-3', () => {
  const tooHigh = createEmptyProgress();
  tooHigh.settings.command = 256;
  assert.equal(validateProgress(tooHigh).error, 'invalid-settings');
  const badAxis = createEmptyProgress();
  badAxis.settings.axis = 4;
  assert.equal(validateProgress(badAxis).error, 'invalid-settings');
  const fractional = createEmptyProgress();
  fractional.settings.command = 127.5;
  assert.equal(validateProgress(fractional).error, 'invalid-settings');
});

test('drops unknown keys and non-string identifiers while keeping valid ones', () => {
  const doc = createEmptyProgress();
  doc.course.completedLessons = ['l01', 5, 'l02', null];
  doc.course.answered = ['l01q1', {}, 'l01q2'];
  doc.learning.completedSteps = ['b-interface:ws-title', 7];
  doc.extra = 'should vanish';
  const result = validateProgress(doc);
  assert.equal(result.ok, true);
  assert.deepEqual(result.value.course.completedLessons, ['l01', 'l02']);
  assert.deepEqual(result.value.course.answered, ['l01q1', 'l01q2']);
  assert.deepEqual(result.value.learning.completedSteps, ['b-interface:ws-title']);
  assert.equal('extra' in result.value, false);
});

test('fills missing location and learning fields with defaults', () => {
  const doc = createEmptyProgress();
  doc.location = {};
  delete doc.learning;
  const result = validateProgress(doc);
  assert.equal(result.ok, true);
  assert.deepEqual(result.value.location, { view: 'home', level: null, lessonId: null, stepIndex: 0 });
  assert.deepEqual(result.value.learning, { completedSteps: [], completedLessons: [], missedLessons: [] });
});

test('rejects a view or level the app does not have', () => {
  const badView = createEmptyProgress();
  badView.location.view = 'settings';
  assert.equal(validateProgress(badView).error, 'invalid-location');
  const badLevel = createEmptyProgress();
  badLevel.location.level = 'expert';
  assert.equal(validateProgress(badLevel).error, 'invalid-location');
  const ok = createEmptyProgress();
  ok.location = { view: 'lesson', level: 'hate', lessonId: 'b-interface', stepIndex: 3 };
  assert.equal(validateProgress(ok).ok, true);
});

test('a version-1 document migrates to version 4 keeping its records, settings, and savedAt', () => {
  const original = v1Doc({
    course: { completedLessons: ['l03'], missedLessons: ['l03'], answered: ['l03q1', 'l03q2'] },
    guided: { completedSteps: ['schedule-light:sl-channel', 'schedule-light:sl-blocks'], completedExercises: [] },
  });
  const migrated = migrateProgress(original);
  assert.equal(migrated.ok, true);
  assert.equal(migrated.from, 1);
  const doc = migrated.value;
  assert.equal(doc.schemaVersion, 4);
  assert.equal(doc.savedAt, '2026-10-07T16:47:52.826Z');
  assert.deepEqual(doc.course, original.course, 'classic lesson records are kept intact');
  assert.deepEqual(doc.guided, original.guided, 'exercise records are kept intact');
  assert.deepEqual(doc.settings, {
    channelId: 'light-1', axis: 3, command: 128, laptopIp: '192.168.0.20',
    lights: { 'light-1': [[60, 120]], 'light-2': [] }, analogs: null, console: [128, 128, 128, 128],
  }, 'blocks 2 and 3 become Light 1 ON from frame 60 to frame 120; the command becomes axis 3’s console value');
  assert.deepEqual(doc.location, { view: 'home', level: null, lessonId: null, stepIndex: 0 }, 'the old panel position has no reliable mapping, so the app opens at the level choice');
  assert.deepEqual(doc.learning, { completedSteps: [], completedLessons: [], missedLessons: [] });
  assert.deepEqual(doc.migrated, { fromSchemaVersion: 1, originalSavedAt: '2026-10-07T16:47:52.826Z', originalView: 'handbook' });
  assert.equal(validateProgress(doc).ok, true, 'the migrated document validates');
});

test('a version-2 document migrates to version 4 keeping location, learning, and every record', () => {
  const original = v2Doc();
  const migrated = migrateProgress(original);
  assert.equal(migrated.ok, true);
  assert.equal(migrated.from, 2);
  const doc = migrated.value;
  assert.equal(doc.schemaVersion, 4);
  assert.deepEqual(doc.location, original.location, 'the learner resumes where they were');
  assert.deepEqual(doc.learning, original.learning);
  assert.deepEqual(doc.course, original.course);
  assert.deepEqual(doc.guided, original.guided);
  assert.deepEqual(doc.settings.lights, { 'light-1': [[60, 120], [150, 180]], 'light-2': [] }, 'each ON block becomes 30 ON frames; neighbours merge');
  assert.deepEqual(doc.settings.console, [128, 128, 100, 128], 'the saved command becomes the saved axis’s Soft Console value');
  assert.equal(doc.settings.channelId, 'light-2');
  assert.equal(doc.settings.laptopIp, '192.168.1.20');
  assert.deepEqual(doc.migrated, { fromSchemaVersion: 2, originalSavedAt: '2026-10-07T19:12:00.000Z', originalView: 'lesson' });
  assert.equal(validateProgress(doc).ok, true);
});

test('a version-2 document that carried a version-1 note gets the version-2 note, which matches what Home explains', () => {
  const note = { fromSchemaVersion: 1, originalSavedAt: '2026-10-07T16:47:52.826Z', originalView: 'handbook' };
  assert.equal(migrateProgress(v2Doc({ migrated: note })).value.migrated.fromSchemaVersion, 2);
});

test('migration is repeat-safe: a version-4 document passes through untouched', () => {
  const doc = createEmptyProgress();
  doc.learning.completedSteps = ['x:y'];
  const result = migrateProgress(doc);
  assert.equal(result.ok, true);
  assert.equal(result.from, 4);
  assert.deepEqual(result.value, doc);
});

test('migration refuses what it cannot understand instead of guessing', () => {
  assert.equal(migrateProgress({ schemaVersion: 0, app: APP_ID }).ok, false);
  assert.equal(migrateProgress({ schemaVersion: 1, app: 'other' }).ok, false);
  assert.equal(migrateProgress('nope').ok, false);
  const badSettings = v1Doc({ settings: { axis: 9 } });
  assert.equal(migrateProgress(badSettings).ok, false, 'a version-1 file with unusable settings is not silently repaired');
  assert.equal(migrateProgress(v2Doc({ settings: { blocks: [true] } })).ok, false, 'nor is a version-2 file');
  assert.equal(migrateProgress(v2Doc({ location: { view: 'nowhere' } })).ok, false);
});

test('guide.welcomed: fresh documents start unwelcomed, older files count as welcomed', () => {
  assert.deepEqual(createEmptyProgress().guide, { welcomed: false });
  const noGuide = validateProgress({ ...createEmptyProgress(), guide: undefined });
  assert.equal(noGuide.ok, true);
  assert.deepEqual(noGuide.value.guide, { welcomed: true });
  const kept = validateProgress({ ...createEmptyProgress(), guide: { welcomed: false } });
  assert.deepEqual(kept.value.guide, { welcomed: false });
  assert.equal(validateProgress({ ...createEmptyProgress(), guide: { welcomed: 'yes' } }).error, 'invalid-guide');
  assert.deepEqual(migrateProgress(v1Doc()).value.guide, { welcomed: true });
  assert.deepEqual(migrateProgress(v2Doc()).value.guide, { welcomed: true });
});

// A representative schema-3 document as the PC•MACs-recreation build wrote it.
function v3Doc(overrides = {}) {
  return {
    schemaVersion: 3,
    app: 'roseflow-pc-mac-training',
    savedAt: '2026-10-26T08:30:00.000Z',
    location: { view: 'lesson', level: 'hate', lessonId: 'b-timeline-graph', stepIndex: 3 },
    learning: { completedSteps: ['b-system:show', 'b-timeline-graph:seconds'], completedLessons: ['b-system'], missedLessons: [] },
    course: { completedLessons: ['l01'], missedLessons: [], answered: ['l01q1', 'l01q2'] },
    guided: { completedSteps: [], completedExercises: [] },
    settings: { channelId: 'light-1', axis: 0, command: 128, laptopIp: '192.168.0.20', lights: { 'light-1': [[150, 180]], 'light-2': [] }, analogs: null, console: [128, 128, 128, 128] },
    migrated: null,
    guide: { welcomed: true },
    ...overrides,
  };
}

test('fresh documents carry an empty training record, optionally with the previous run’s restart count', () => {
  assert.deepEqual(createEmptyProgress().training, {
    lastActivityAt: null, checkpoint: null, watched: [], skipped: [], attempted: [], assisted: [], completed: false,
    restarts: { count: 0, lastAt: null },
  });
  const again = createEmptyProgress({ restarts: { count: 2, lastAt: '2026-10-31T10:00:00.000Z' } });
  assert.deepEqual(again.training.restarts, { count: 2, lastAt: '2026-10-31T10:00:00.000Z' });
  assert.equal(validateProgress(again).ok, true);
});

test('training validates: a checkpoint needs an integer step, lists keep strings, absent fields default', () => {
  const doc = createEmptyProgress();
  doc.training = { checkpoint: { lessonId: 's1-one-second-on', stepIndex: 'x' } };
  assert.equal(validateProgress(doc).error, 'invalid-training');
  const partial = createEmptyProgress();
  partial.training = { lastActivityAt: '2026-10-31T10:00:00.000Z', watched: ['s1-one-second-on', 4], completed: true };
  const r = validateProgress(partial);
  assert.equal(r.ok, true);
  assert.deepEqual(r.value.training, {
    lastActivityAt: '2026-10-31T10:00:00.000Z', checkpoint: null, watched: ['s1-one-second-on'], skipped: [], attempted: [], assisted: [], completed: true,
    restarts: { count: 0, lastAt: null },
  });
  const noTraining = validateProgress({ ...createEmptyProgress(), training: undefined });
  assert.equal(noTraining.ok, true);
  assert.equal(noTraining.value.training.completed, false);
  const okLevel = createEmptyProgress();
  okLevel.location = { view: 'course', level: 'course', lessonId: 's1-orientation', stepIndex: 0 };
  assert.equal(validateProgress(okLevel).ok, true, 'the course is a valid level and view');
});

test('a version-3 document migrates to version 4 keeping everything and deriving the training record', () => {
  const migrated = migrateProgress(v3Doc());
  assert.equal(migrated.ok, true);
  assert.equal(migrated.from, 3);
  const doc = migrated.value;
  assert.equal(doc.schemaVersion, 4);
  assert.deepEqual(doc.location, v3Doc().location, 'a save mid-legacy-lesson keeps its lesson so Continue can resume it');
  assert.deepEqual(doc.learning, v3Doc().learning);
  assert.deepEqual(doc.settings, v3Doc().settings);
  assert.deepEqual(doc.guide, { welcomed: true });
  assert.deepEqual(doc.training, {
    lastActivityAt: '2026-10-26T08:30:00.000Z', checkpoint: { lessonId: 'b-timeline-graph', stepIndex: 3 },
    watched: [], skipped: [], attempted: [], assisted: [], completed: false, restarts: { count: 0, lastAt: null },
  });
  assert.deepEqual(doc.migrated, { fromSchemaVersion: 3, originalSavedAt: '2026-10-26T08:30:00.000Z', originalView: 'lesson' });
  assert.equal(validateProgress(doc).ok, true);
  const untouched = migrateProgress(v3Doc({ learning: { completedSteps: [], completedLessons: [], missedLessons: [] }, location: { view: 'home', level: null, lessonId: null, stepIndex: 0 } })).value;
  assert.equal(untouched.training.lastActivityAt, null, 'no finished step means no training activity');
  assert.equal(untouched.training.checkpoint, null);
});

test('version-1 and version-2 documents also arrive at version 4 with default training', () => {
  for (const old of [v1Doc(), v2Doc()]) {
    const doc = migrateProgress(old).value;
    assert.equal(doc.schemaVersion, 4);
    assert.equal(doc.training.lastActivityAt, null);
    assert.equal(doc.training.restarts.count, 0);
    assert.equal(validateProgress(doc).ok, true);
  }
});

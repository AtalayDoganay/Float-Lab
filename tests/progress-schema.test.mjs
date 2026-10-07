import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  SCHEMA_VERSION,
  APP_ID,
  createEmptyProgress,
  validateProgress,
} from '../src/shared/progress-schema.mjs';

test('empty progress document validates and comes back unchanged', () => {
  const doc = createEmptyProgress();
  assert.equal(doc.schemaVersion, SCHEMA_VERSION);
  assert.equal(doc.app, APP_ID);
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

test('rejects an unsupported schema version', () => {
  const doc = { ...createEmptyProgress(), schemaVersion: 99 };
  const result = validateProgress(doc);
  assert.equal(result.ok, false);
  assert.equal(result.error, 'unsupported-schema');
});

test('rejects a document written by a different app', () => {
  const doc = { ...createEmptyProgress(), app: 'one-file' };
  const result = validateProgress(doc);
  assert.equal(result.ok, false);
  assert.equal(result.error, 'wrong-app');
});

test('rejects timeline blocks that are not exactly eight booleans', () => {
  const doc = createEmptyProgress();
  doc.settings.blocks = [true, false, true, false, true, false, true];
  const result = validateProgress(doc);
  assert.equal(result.ok, false);
  assert.equal(result.error, 'invalid-settings');
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
  doc.extra = 'should vanish';
  const result = validateProgress(doc);
  assert.equal(result.ok, true);
  assert.deepEqual(result.value.course.completedLessons, ['l01', 'l02']);
  assert.deepEqual(result.value.course.answered, ['l01q1', 'l01q2']);
  assert.equal('extra' in result.value, false);
});

test('fills missing location fields with defaults', () => {
  const doc = createEmptyProgress();
  doc.location = {};
  const result = validateProgress(doc);
  assert.equal(result.ok, true);
  assert.deepEqual(result.value.location, {
    view: 'lessons',
    lessonId: 'l01',
    questionIndex: 0,
    exerciseId: null,
    stepIndex: 0,
  });
});

test('rejects a location view that the app does not have', () => {
  const doc = createEmptyProgress();
  doc.location.view = 'settings';
  const result = validateProgress(doc);
  assert.equal(result.ok, false);
  assert.equal(result.error, 'invalid-location');
});

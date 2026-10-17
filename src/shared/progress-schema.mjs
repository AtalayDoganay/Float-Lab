// Versioned learning-progress document shared by the main process (store + IPC
// validation) and the renderer. Hand-written validation keeps the app free of
// runtime dependencies. Anything that does not validate is rejected or, where a
// safe default exists, normalized.
//
// Schema history
//   1  first Windows build: classic lesson list (course), three exercises (guided).
//   2  guided-learning redesign: location is a level + guided lesson + step;
//      `learning` records guided step completion. The version-1 `course` and
//      `guided` records are kept verbatim, still updated when the guided flow
//      reuses one of their questions or exercise steps, and used to pre-mark
//      those steps complete. The old panel position (lesson/question/exercise)
//      has no reliable mapping to a guided lesson and is only remembered in
//      `migrated` for display.
//   3  PC•MACs recreation: the eight one-second timeline blocks are replaced by
//      frame-based show data as PC•MACs stores it (30 frames per second, 240
//      frames in the 8-second training show). `settings.blocks` becomes
//      `settings.lights` (ON spans in frames per digital channel) and
//      `settings.analogs` (run-length show data per axis, or null for the
//      training default); `settings.console` holds the four Soft Console
//      slider values. A version-2 document keeps its location and every
//      learning record; each ON block becomes 30 ON frames of Light 1, and the
//      saved command becomes the Soft Console value of the saved axis.

export const SCHEMA_VERSION = 3;
export const FPS = 30;
export const FRAME_COUNT = 240;
export const DIGITAL_IDS = Object.freeze(['light-1', 'light-2']);
export const APP_ID = 'roseflow-pc-mac-training';
export const LEVELS = Object.freeze(['basic', 'intermediate', 'hate']);
export const VIEWS = Object.freeze(['home', 'level', 'lesson', 'explore', 'progress']);

export const DEFAULT_LOCATION = Object.freeze({
  view: 'home',
  level: null,
  lessonId: null,
  stepIndex: 0,
});

export const DEFAULT_SETTINGS = Object.freeze({
  channelId: 'light-1',
  axis: 0,
  command: 128,
  laptopIp: '192.168.0.20',
  // Light 1 ON from 2 s to 4 s: the pattern the first build's default blocks drew.
  lights: Object.freeze({ 'light-1': Object.freeze([Object.freeze([60, 120])]), 'light-2': Object.freeze([]) }),
  analogs: null,
  console: Object.freeze([128, 128, 128, 128]),
});

export function cloneSettings(settings) {
  return {
    ...settings,
    lights: Object.fromEntries(Object.entries(settings.lights).map(([id, ivs]) => [id, ivs.map((iv) => [...iv])])),
    analogs: settings.analogs ? settings.analogs.map((runs) => runs.map((r) => [...r])) : null,
    console: [...settings.console],
  };
}

export function createEmptyProgress() {
  return {
    schemaVersion: SCHEMA_VERSION,
    app: APP_ID,
    savedAt: null,
    location: { ...DEFAULT_LOCATION },
    learning: { completedSteps: [], completedLessons: [], missedLessons: [] },
    course: { completedLessons: [], missedLessons: [], answered: [] },
    guided: { completedSteps: [], completedExercises: [] },
    settings: cloneSettings(DEFAULT_SETTINGS),
    migrated: null,
  };
}

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonNegativeInt(value) {
  return Number.isInteger(value) && value >= 0;
}

function stringList(value) {
  return Array.isArray(value) ? value.filter((item) => typeof item === 'string') : [];
}

function readLocation(input) {
  const source = isPlainObject(input) ? input : {};
  const view = source.view === undefined ? DEFAULT_LOCATION.view : source.view;
  const level = source.level === undefined ? null : source.level;
  const lessonId = source.lessonId === undefined ? null : source.lessonId;
  const stepIndex = source.stepIndex === undefined ? 0 : source.stepIndex;
  const valid =
    VIEWS.includes(view) &&
    (level === null || LEVELS.includes(level)) &&
    (lessonId === null || typeof lessonId === 'string') &&
    isNonNegativeInt(stepIndex);
  return valid ? { view, level, lessonId, stepIndex } : null;
}

const isByte = (v) => Number.isInteger(v) && v >= 0 && v <= 255;

function readIntervals(list) {
  if (!Array.isArray(list)) return null;
  let last = 0;
  for (const iv of list) {
    if (!Array.isArray(iv) || iv.length !== 2) return null;
    const [a, b] = iv;
    if (!Number.isInteger(a) || !Number.isInteger(b) || a < last || b <= a || b > FRAME_COUNT) return null;
    last = b;
  }
  return list.map(([a, b]) => [a, b]);
}

function readRuns(runs) {
  if (!Array.isArray(runs)) return null;
  let total = 0;
  for (const r of runs) {
    if (!Array.isArray(r) || r.length !== 2 || !isByte(r[0]) || !Number.isInteger(r[1]) || r[1] < 1) return null;
    total += r[1];
  }
  return total === FRAME_COUNT ? runs.map(([v, n]) => [v, n]) : null;
}

// Fields every schema version shares.
function readCommonSettings(source) {
  const channelId = source.channelId === undefined ? DEFAULT_SETTINGS.channelId : source.channelId;
  const axis = source.axis === undefined ? DEFAULT_SETTINGS.axis : source.axis;
  const command = source.command === undefined ? DEFAULT_SETTINGS.command : source.command;
  const laptopIp = source.laptopIp === undefined ? DEFAULT_SETTINGS.laptopIp : source.laptopIp;
  const valid =
    typeof channelId === 'string' &&
    Number.isInteger(axis) && axis >= 0 && axis <= 3 &&
    isByte(command) &&
    typeof laptopIp === 'string';
  return valid ? { channelId, axis, command, laptopIp } : null;
}

function readSettings(input) {
  const source = isPlainObject(input) ? input : {};
  const common = readCommonSettings(source);
  if (!common) return null;
  const defaults = cloneSettings(DEFAULT_SETTINGS);
  const lightsIn = source.lights === undefined ? defaults.lights : source.lights;
  if (!isPlainObject(lightsIn)) return null;
  const lights = {};
  for (const id of DIGITAL_IDS) {
    const ivs = readIntervals(lightsIn[id] === undefined ? [] : lightsIn[id]);
    if (!ivs) return null;
    lights[id] = ivs;
  }
  let analogs = null;
  if (source.analogs !== undefined && source.analogs !== null) {
    if (!Array.isArray(source.analogs) || source.analogs.length !== 4) return null;
    analogs = source.analogs.map(readRuns);
    if (analogs.some((a) => a === null)) return null;
  }
  const consoleIn = source.console === undefined ? defaults.console : source.console;
  if (!Array.isArray(consoleIn) || consoleIn.length !== 4 || !consoleIn.every(isByte)) return null;
  return { ...common, lights, analogs, console: [...consoleIn] };
}

// Versions 1 and 2 stored eight one-second blocks for Light 1 only.
function readBlockSettings(input) {
  const source = isPlainObject(input) ? input : {};
  const common = readCommonSettings(source);
  const blocks = source.blocks === undefined ? [false, false, true, true, false, false, false, false] : source.blocks;
  if (!common || !Array.isArray(blocks) || blocks.length !== 8 || !blocks.every((b) => typeof b === 'boolean')) return null;
  return { ...common, blocks: [...blocks] };
}

// Each ON block becomes 30 ON frames; neighbouring blocks merge into one span.
export function blocksToIntervals(blocks) {
  const out = [];
  blocks.forEach((on, i) => {
    if (!on) return;
    const last = out[out.length - 1];
    if (last && last[1] === i * FPS) last[1] = (i + 1) * FPS; else out.push([i * FPS, (i + 1) * FPS]);
  });
  return out;
}

function settingsFromBlocks(old) {
  const consoleValues = [128, 128, 128, 128];
  consoleValues[old.axis] = old.command;
  return {
    channelId: old.channelId,
    axis: old.axis,
    command: old.command,
    laptopIp: old.laptopIp,
    lights: { 'light-1': blocksToIntervals(old.blocks), 'light-2': [] },
    analogs: null,
    console: consoleValues,
  };
}

function readLegacyRecords(input) {
  const course = isPlainObject(input.course) ? input.course : {};
  const guided = isPlainObject(input.guided) ? input.guided : {};
  return {
    course: {
      completedLessons: stringList(course.completedLessons),
      missedLessons: stringList(course.missedLessons),
      answered: stringList(course.answered),
    },
    guided: {
      completedSteps: stringList(guided.completedSteps),
      completedExercises: stringList(guided.completedExercises),
    },
  };
}

function readMigrated(input) {
  if (!isPlainObject(input)) return null;
  return {
    fromSchemaVersion: Number.isInteger(input.fromSchemaVersion) ? input.fromSchemaVersion : 1,
    originalSavedAt: typeof input.originalSavedAt === 'string' ? input.originalSavedAt : null,
    originalView: typeof input.originalView === 'string' ? input.originalView : null,
  };
}

/**
 * Validate and normalize a current-schema progress document.
 * @returns {{ok: true, value: object} | {ok: false, error: string}}
 */
export function validateProgress(input) {
  if (!isPlainObject(input)) return { ok: false, error: 'not-an-object' };
  if (input.schemaVersion !== SCHEMA_VERSION) return { ok: false, error: 'unsupported-schema' };
  if (input.app !== APP_ID) return { ok: false, error: 'wrong-app' };

  const location = readLocation(input.location);
  if (!location) return { ok: false, error: 'invalid-location' };

  const settings = readSettings(input.settings);
  if (!settings) return { ok: false, error: 'invalid-settings' };

  const learning = isPlainObject(input.learning) ? input.learning : {};

  return {
    ok: true,
    value: {
      schemaVersion: SCHEMA_VERSION,
      app: APP_ID,
      savedAt: typeof input.savedAt === 'string' ? input.savedAt : null,
      location,
      learning: {
        completedSteps: stringList(learning.completedSteps),
        completedLessons: stringList(learning.completedLessons),
        missedLessons: stringList(learning.missedLessons),
      },
      ...readLegacyRecords(input),
      settings,
      migrated: readMigrated(input.migrated),
    },
  };
}

/**
 * Bring an older document up to the current schema. Repeat-safe: a current
 * document passes through unchanged. Refuses anything it cannot read instead
 * of repairing it.
 * @returns {{ok: true, from: number, value: object} | {ok: false, error: string}}
 */
export function migrateProgress(input) {
  if (!isPlainObject(input)) return { ok: false, error: 'not-an-object' };
  if (input.app !== APP_ID) return { ok: false, error: 'wrong-app' };
  if (input.schemaVersion === SCHEMA_VERSION) return { ok: true, from: SCHEMA_VERSION, value: input };
  if (input.schemaVersion !== 1 && input.schemaVersion !== 2) return { ok: false, error: 'unsupported-schema' };

  const old = readBlockSettings(input.settings);
  if (!old) return { ok: false, error: 'invalid-settings' };
  const settings = settingsFromBlocks(old);
  const savedAt = typeof input.savedAt === 'string' ? input.savedAt : null;

  if (input.schemaVersion === 2) {
    const location = readLocation(input.location);
    if (!location) return { ok: false, error: 'invalid-location' };
    const learning = isPlainObject(input.learning) ? input.learning : {};
    return {
      ok: true,
      from: 2,
      value: {
        schemaVersion: SCHEMA_VERSION,
        app: APP_ID,
        savedAt,
        location,
        learning: {
          completedSteps: stringList(learning.completedSteps),
          completedLessons: stringList(learning.completedLessons),
          missedLessons: stringList(learning.missedLessons),
        },
        ...readLegacyRecords(input),
        settings,
        // This migration is the one the learner needs explained (location kept,
        // blocks converted), so it replaces any note left by a v1 -> v2 migration.
        migrated: { fromSchemaVersion: 2, originalSavedAt: savedAt, originalView: location.view },
      },
    };
  }

  const oldLocation = isPlainObject(input.location) ? input.location : {};
  return {
    ok: true,
    from: 1,
    value: {
      schemaVersion: SCHEMA_VERSION,
      app: APP_ID,
      savedAt,
      location: { ...DEFAULT_LOCATION },
      learning: { completedSteps: [], completedLessons: [], missedLessons: [] },
      ...readLegacyRecords(input),
      settings,
      migrated: {
        fromSchemaVersion: 1,
        originalSavedAt: savedAt,
        originalView: typeof oldLocation.view === 'string' ? oldLocation.view : null,
      },
    },
  };
}

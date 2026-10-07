// Versioned learning-progress document shared by the main process (store + IPC
// validation) and the renderer. Hand-written validation keeps the app free of
// runtime dependencies. Anything that does not validate is rejected or, where a
// safe default exists, normalized.

export const SCHEMA_VERSION = 1;
export const APP_ID = 'roseflow-pc-mac-training';
export const VIEWS = Object.freeze(['lessons', 'practice', 'handbook', 'progress']);

export const DEFAULT_LOCATION = Object.freeze({
  view: 'lessons',
  lessonId: 'l01',
  questionIndex: 0,
  exerciseId: null,
  stepIndex: 0,
});

export const DEFAULT_SETTINGS = Object.freeze({
  channelId: 'light-1',
  blocks: Object.freeze([false, false, true, true, false, false, false, false]),
  axis: 0,
  command: 128,
  laptopIp: '192.168.0.20',
});

export function createEmptyProgress() {
  return {
    schemaVersion: SCHEMA_VERSION,
    app: APP_ID,
    savedAt: null,
    location: { ...DEFAULT_LOCATION },
    course: { completedLessons: [], missedLessons: [], answered: [] },
    guided: { completedSteps: [], completedExercises: [] },
    settings: { ...DEFAULT_SETTINGS, blocks: [...DEFAULT_SETTINGS.blocks] },
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
  const lessonId = source.lessonId === undefined ? DEFAULT_LOCATION.lessonId : source.lessonId;
  const questionIndex = source.questionIndex === undefined ? 0 : source.questionIndex;
  const exerciseId = source.exerciseId === undefined ? null : source.exerciseId;
  const stepIndex = source.stepIndex === undefined ? 0 : source.stepIndex;
  const valid =
    VIEWS.includes(view) &&
    typeof lessonId === 'string' &&
    isNonNegativeInt(questionIndex) &&
    (exerciseId === null || typeof exerciseId === 'string') &&
    isNonNegativeInt(stepIndex);
  return valid ? { view, lessonId, questionIndex, exerciseId, stepIndex } : null;
}

function readSettings(input) {
  const source = isPlainObject(input) ? input : {};
  const channelId = source.channelId === undefined ? DEFAULT_SETTINGS.channelId : source.channelId;
  const blocks = source.blocks === undefined ? [...DEFAULT_SETTINGS.blocks] : source.blocks;
  const axis = source.axis === undefined ? DEFAULT_SETTINGS.axis : source.axis;
  const command = source.command === undefined ? DEFAULT_SETTINGS.command : source.command;
  const laptopIp = source.laptopIp === undefined ? DEFAULT_SETTINGS.laptopIp : source.laptopIp;
  const valid =
    typeof channelId === 'string' &&
    Array.isArray(blocks) &&
    blocks.length === 8 &&
    blocks.every((b) => typeof b === 'boolean') &&
    Number.isInteger(axis) && axis >= 0 && axis <= 3 &&
    Number.isInteger(command) && command >= 0 && command <= 255 &&
    typeof laptopIp === 'string';
  return valid ? { channelId, blocks: [...blocks], axis, command, laptopIp } : null;
}

/**
 * Validate and normalize a progress document.
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

  const course = isPlainObject(input.course) ? input.course : {};
  const guided = isPlainObject(input.guided) ? input.guided : {};

  return {
    ok: true,
    value: {
      schemaVersion: SCHEMA_VERSION,
      app: APP_ID,
      savedAt: typeof input.savedAt === 'string' ? input.savedAt : null,
      location,
      course: {
        completedLessons: stringList(course.completedLessons),
        missedLessons: stringList(course.missedLessons),
        answered: stringList(course.answered),
      },
      guided: {
        completedSteps: stringList(guided.completedSteps),
        completedExercises: stringList(guided.completedExercises),
      },
      settings,
    },
  };
}

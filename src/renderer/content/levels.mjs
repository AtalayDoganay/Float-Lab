// The three learning levels, their functional topic groups, and the guided
// lessons each contains. Lesson ids are stable: progress is recorded against
// `${lessonId}:${stepId}` and a lesson that appears in two levels is the same
// lesson, so completing it once counts in both.
import { BASIC_LESSONS } from './lessons/basic.mjs';
import { INTERMEDIATE_LESSONS } from './lessons/intermediate.mjs';
import { COMPREHENSIVE_LESSONS } from './lessons/comprehensive.mjs';

// Workspace parts a step can reveal. The workspace starts empty and grows as
// the lesson introduces each part.
export const WORKSPACE_PARTS = Object.freeze([
  'title', 'ruler', 'analog', 'digital', 'transport', 'command', 'measure', 'network', 'calibration', 'terminal', 'term-toolbar',
]);

const group = (id, title, summary) => ({ id, title, summary });

export const GROUPS = Object.freeze({
  interface: group('interface', 'The interface', 'What is on the screen and how to get help on any part of it.'),
  graphs: group('graphs', 'Graphs', 'Reading the timeline and the analog pane.'),
  terminology: group('terminology', 'Terminology', 'Channels, values, and the identifiers on the photographed card.'),
  functions: group('functions', 'Functions', 'What each control and each photographed terminal key does.'),
  hydraulics: group('hydraulics', 'Hydraulics', 'How a number becomes a movement: actuators, endpoints, feedback.'),
  diagnosis: group('diagnosis', 'Diagnosis', 'Reading a mismatch without guessing the cause.'),
  assignments: group('assignments', 'Assignments', 'Whole tasks, checked step by step in the PC•MACs windows.'),
});

const GROUP_ORDER = ['interface', 'graphs', 'terminology', 'functions', 'hydraulics', 'diagnosis', 'assignments'];

export const LESSONS_BY_ID = Object.freeze(Object.fromEntries(
  [...BASIC_LESSONS, ...INTERMEDIATE_LESSONS, ...COMPREHENSIVE_LESSONS].map((l) => [l.id, Object.freeze(l)]),
));

function sortByGroup(lessons) {
  return [...lessons].sort((a, b) => GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group));
}

const basicIds = BASIC_LESSONS.map((l) => l.id);
const intermediateIds = INTERMEDIATE_LESSONS.map((l) => l.id);
const comprehensiveIds = sortByGroup([...BASIC_LESSONS, ...INTERMEDIATE_LESSONS, ...COMPREHENSIVE_LESSONS]).map((l) => l.id);

export const LEVELS = Object.freeze([
  {
    id: 'basic',
    name: 'Basic',
    tagline: 'The practical essentials: the screen, the graphs, the words, the controls, how a number moves a cylinder, and two assignments.',
    groups: ['interface', 'graphs', 'terminology', 'functions', 'hydraulics', 'assignments'].map((id) => GROUPS[id]),
    lessons: basicIds,
  },
  {
    id: 'intermediate',
    name: 'intermediate',
    tagline: 'Deeper into the same windows: frames, zoom, playing a selection, the measurement model, the five identifiers, the toolbar, network settings, endpoints, and the feedback menu.',
    groups: ['graphs', 'terminology', 'functions', 'hydraulics', 'assignments'].map((id) => GROUPS[id]),
    lessons: intermediateIds,
  },
  {
    id: 'hate',
    name: 'I hate my life',
    tagline: 'Everything the references support, including every Basic and intermediate lesson, every menu line, the gaps stated plainly, and a round-trip assignment.',
    groups: GROUP_ORDER.map((id) => GROUPS[id]),
    lessons: comprehensiveIds,
  },
]);

export const LEVEL_BY_ID = Object.freeze(Object.fromEntries(LEVELS.map((l) => [l.id, l])));

export function lessonsForLevel(levelId) {
  const level = LEVEL_BY_ID[levelId];
  return level ? level.lessons.map((id) => LESSONS_BY_ID[id]) : [];
}

// Lessons of a level grouped by function, in group order.
export function groupedLessons(levelId) {
  const level = LEVEL_BY_ID[levelId];
  if (!level) return [];
  const lessons = lessonsForLevel(levelId);
  return level.groups
    .map((g) => ({ group: g, lessons: lessons.filter((l) => l.group === g.id) }))
    .filter((entry) => entry.lessons.length > 0);
}

export function stepKey(lessonId, stepId) {
  return `${lessonId}:${stepId}`;
}

// Step constructors for guided lessons. A step teaches one control or concept:
// it names the control to highlight, the workspace parts to reveal, what to
// say, optionally what to demonstrate, and either what to practise (with a
// check) or what to answer. Steps that reuse a classic question or an exercise
// step carry that id so earlier progress still counts.
import { LESSONS as CLASSIC_LESSONS } from '../curriculum.mjs';
import { compareDigital, formatTime } from '../../logic/simulation.mjs';
import { EXERCISES } from '../exercises.mjs';

const CLASSIC_QUESTIONS = new Map(CLASSIC_LESSONS.flatMap((l) => l.questions.map((q) => [q.id, { lesson: l, question: q }])));
const EXERCISE_STEPS = new Map(EXERCISES.flatMap((e) => e.steps.map((s) => [`${e.id}:${s.id}`, { exercise: e, step: s }])));

const base = (id, kind, o) => ({
  id,
  kind,
  target: o.target ?? null,
  reveal: o.reveal ?? [],
  title: o.title,
  explain: o.explain,
  example: o.example ?? null,
  mechanism: o.mechanism ?? null,
  concept: o.concept ?? null,
  photo: o.photo ?? null,
  demo: o.demo ?? null,
  questionId: o.questionId ?? null,
  exerciseStep: o.exerciseStep ?? null,
});

export function explain(id, o) {
  return base(id, 'explain', o);
}

export function practice(id, o) {
  return {
    ...base(id, 'practice', o),
    practice: {
      instruction: o.instruction,
      triggers: o.triggers,
      setup: o.setup ?? [],
      validate: o.validate,
      success: o.success,
    },
  };
}

export function question(id, o) {
  return { ...base(id, 'question', o), question: o.question };
}

// Reuse one of the twenty classic questions verbatim.
export function classicQuestion(id, questionId, o) {
  const found = CLASSIC_QUESTIONS.get(questionId);
  if (!found) throw new Error(`Unknown classic question ${questionId}`);
  const { question: q, lesson } = found;
  return question(id, {
    ...o,
    title: o.title ?? 'Check your understanding',
    explain: o.explain ?? lesson.take,
    questionId,
    question: { prompt: q.text, options: q.options, correct: q.correct, why: q.why, hints: q.hints },
  });
}

// Reuse an exercise step: its target, wording, and validator. Exercise steps
// with a multiple-choice question become question steps; the rest become
// practice steps checked against the workspace.
export function exerciseStep(id, key, o = {}) {
  const found = EXERCISE_STEPS.get(key);
  if (!found) throw new Error(`Unknown exercise step ${key}`);
  const { step } = found;
  const common = {
    target: step.target,
    reveal: o.reveal ?? [],
    title: o.title ?? step.title,
    explain: o.explain ?? step.why,
    example: o.example ?? null,
    mechanism: o.mechanism ?? null,
    concept: o.concept ?? null,
    demo: o.demo ?? null,
    exerciseStep: key,
  };
  if (step.question) {
    const options = step.question.options;
    const verdicts = options.map((opt) => step.validate({ answer: opt }));
    const correct = verdicts.findIndex((v) => v.ok);
    return question(id, {
      ...common,
      question: {
        prompt: step.question.prompt,
        options,
        correct,
        why: verdicts[correct].message,
        hints: verdicts.map((v, i) => (i === correct ? '' : v.message)),
      },
    });
  }
  return practice(id, {
    ...common,
    instruction: o.instruction ?? step.instruction,
    triggers: o.triggers ?? TRIGGERS_FOR_TARGET[step.target] ?? ['check'],
    setup: o.setup ?? [],
    validate: step.validate,
    success: o.success ?? step.success,
  });
}

// Which learner actions automatically check a step that targets this control.
export const TRIGGERS_FOR_TARGET = Object.freeze({
  'channel-select': ['select-channel'],
  'digital-pane': ['set-digital', 'draw-digital-done'],
  'menu-set-digital': ['set-digital'],
  'selection-times': ['select-range'],
  play: ['play'],
  stop: ['stop', 'playback-complete'],
  'axis-select': ['select-axis'],
  'command-slider': ['set-command'],
  'manual-mode': ['check-manual'],
  'measure-run': ['run-measure'],
  'laptop-ip-select': ['select-laptop-ip'],
  'calibration-range': ['set-calibration'],
  'term-menu': ['term-key', 'term-button'],
  'term-input': ['term-key'],
  'term-config-done': ['term-button'],
});

// A practice validator for an exact ON/OFF pattern on one digital channel,
// given as ON spans in seconds. Edges drawn with the mouse may be off by up
// to three frames (a tenth of a second); the first wrong stretch is named.
export function digitalPattern(channelId, channelName, seconds) {
  const want = seconds.map(([a, b]) => `${a}–${b} s`).join(' and ');
  return ({ sim }) => {
    const r = compareDigital(sim.lights[channelId], seconds);
    if (r.ok) return { ok: true, message: `Exactly right. ${channelName} is ON for ${want} and OFF everywhere else.` };
    const a = formatTime(r.from);
    const b = formatTime(r.to);
    return r.kind === 'extra'
      ? { ok: false, message: `${channelName} is ON from ${a} to ${b}, where it should be OFF. Select that stretch on its row and choose Edit ▸ Set Digitals Off (Ctrl+0), or RightClick-and-slide over it to undraw it.` }
      : { ok: false, message: `${channelName} is still OFF from ${a} to ${b}, where it should be ON. Select that stretch on its row and choose Edit ▸ Set Digitals On (Ctrl+1), or RightClick-and-slide along the row to draw it.` };
  };
}

// Setup actions that put one digital channel in a known state and leave
// nothing selected.
export const clearLight = (channelId) => [
  { type: 'set-digital-pattern', channelId, seconds: [] },
  { type: 'select-range', from: 0, to: 0, channels: [] },
];

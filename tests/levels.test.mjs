import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS, LESSONS_BY_ID, LEVEL_BY_ID, GROUPS, WORKSPACE_PARTS, lessonsForLevel } from '../src/renderer/content/levels.mjs';
import { CONTROLS, EVIDENCE_LEVELS } from '../src/renderer/content/controls.mjs';
import { LESSONS as CLASSIC_LESSONS } from '../src/renderer/content/curriculum.mjs';
import { EXERCISES } from '../src/renderer/content/exercises.mjs';
import { HANDBOOK_BY_ID } from '../src/renderer/content/handbook.mjs';
import { LEVELS as SCHEMA_LEVELS } from '../src/shared/progress-schema.mjs';

const nonEmpty = (value) => typeof value === 'string' && value.trim().length > 0;
const classicQuestionIds = new Set(CLASSIC_LESSONS.flatMap((l) => l.questions.map((q) => q.id)));
const exerciseStepIds = new Set(EXERCISES.flatMap((e) => e.steps.map((s) => `${e.id}:${s.id}`)));

test('the three levels are named exactly Basic, intermediate, and I hate my life, in that order', () => {
  assert.deepEqual(LEVELS.map((l) => l.id), ['basic', 'intermediate', 'hate']);
  assert.deepEqual(LEVELS.map((l) => l.name), ['Basic', 'intermediate', 'I hate my life']);
  assert.deepEqual(LEVELS.map((l) => l.id), [...SCHEMA_LEVELS], 'the schema and the content agree on level ids');
  for (const level of LEVELS) {
    assert.ok(nonEmpty(level.tagline), `${level.id} needs a one-line description`);
    assert.ok(level.groups.length >= 3, `${level.id} groups topics by function`);
    assert.ok(lessonsForLevel(level.id).length >= 4, `${level.id} has lessons`);
  }
});

test('topics are grouped by function and Basic covers the practical essentials', () => {
  const basicGroupIds = LEVEL_BY_ID.basic.groups.map((g) => g.id);
  for (const required of ['interface', 'graphs', 'terminology', 'functions', 'hydraulics', 'assignments']) {
    assert.ok(basicGroupIds.includes(required), `Basic must cover ${required}`);
    assert.ok(lessonsForLevel('basic').some((l) => l.group === required), `Basic needs at least one lesson in ${required}`);
  }
  for (const g of Object.values(GROUPS)) assert.ok(nonEmpty(g.title) && nonEmpty(g.summary), `group ${g.id}`);
});

test('intermediate goes deeper than Basic and the comprehensive level includes every lesson', () => {
  const basic = lessonsForLevel('basic').map((l) => l.id);
  const intermediate = lessonsForLevel('intermediate').map((l) => l.id);
  const hate = lessonsForLevel('hate').map((l) => l.id);
  assert.ok(intermediate.every((id) => !basic.includes(id)), 'intermediate adds new lessons rather than repeating Basic');
  for (const id of [...basic, ...intermediate]) assert.ok(hate.includes(id), `I hate my life must include ${id}`);
  assert.ok(hate.length > basic.length + intermediate.length, 'the comprehensive level adds its own lessons');
  assert.equal(new Set(hate).size, hate.length, 'no lesson is listed twice in a level');
});

test('every lesson is a sequence of well-formed steps that reveal real workspace parts and target real controls', () => {
  const seenStepKeys = new Set();
  for (const lesson of Object.values(LESSONS_BY_ID)) {
    assert.ok(nonEmpty(lesson.title) && nonEmpty(lesson.summary), lesson.id);
    assert.ok(GROUPS[lesson.group], `${lesson.id} belongs to an unknown group ${lesson.group}`);
    assert.ok(lesson.steps.length >= 3, `${lesson.id} needs at least three steps`);
    for (const part of lesson.reveal) assert.ok(WORKSPACE_PARTS.includes(part), `${lesson.id} reveals unknown part ${part}`);
    const stepIds = new Set();
    for (const step of lesson.steps) {
      assert.ok(nonEmpty(step.id), `${lesson.id} step id`);
      assert.ok(!stepIds.has(step.id), `${lesson.id} repeats step ${step.id}`);
      stepIds.add(step.id);
      seenStepKeys.add(`${lesson.id}:${step.id}`);
      assert.ok(['explain', 'practice', 'question'].includes(step.kind), `${lesson.id}/${step.id} kind`);
      assert.ok(nonEmpty(step.title) && nonEmpty(step.explain), `${lesson.id}/${step.id} needs a title and explanation`);
      if (step.target !== null) assert.ok(CONTROLS[step.target], `${lesson.id}/${step.id} targets unknown control ${step.target}`);
      for (const part of step.reveal) assert.ok(WORKSPACE_PARTS.includes(part), `${lesson.id}/${step.id} reveals unknown part ${part}`);
      if (step.concept) assert.ok(HANDBOOK_BY_ID.has(step.concept), `${lesson.id}/${step.id} links unknown handbook entry ${step.concept}`);
      if (step.mechanism) assert.ok(nonEmpty(step.mechanism.text) && EVIDENCE_LEVELS.includes(step.mechanism.evidence), `${lesson.id}/${step.id} mechanism`);
      if (step.demo) {
        assert.ok(nonEmpty(step.demo.intro) && Array.isArray(step.demo.actions) && step.demo.actions.length > 0, `${lesson.id}/${step.id} demo`);
        for (const a of step.demo.actions) assert.ok(typeof a.type === 'string' || Number.isInteger(a.wait), `${lesson.id}/${step.id} demo action`);
      }
      if (step.kind === 'practice') {
        assert.ok(nonEmpty(step.practice.instruction), `${lesson.id}/${step.id} instruction`);
        assert.ok(Array.isArray(step.practice.triggers) && step.practice.triggers.length > 0, `${lesson.id}/${step.id} triggers`);
        assert.equal(typeof step.practice.validate, 'function', `${lesson.id}/${step.id} validate`);
        assert.ok(nonEmpty(step.practice.success), `${lesson.id}/${step.id} success`);
      }
      if (step.kind === 'question') {
        const q = step.question;
        assert.ok(nonEmpty(q.prompt) && q.options.length >= 2 && Number.isInteger(q.correct) && q.correct < q.options.length, `${lesson.id}/${step.id} question`);
        assert.ok(nonEmpty(q.why), `${lesson.id}/${step.id} why`);
        assert.equal(q.hints.length, q.options.length, `${lesson.id}/${step.id} hints`);
        q.hints.forEach((h, i) => { if (i !== q.correct) assert.ok(nonEmpty(h), `${lesson.id}/${step.id} hint ${i}`); });
      }
      if (step.questionId) assert.ok(classicQuestionIds.has(step.questionId), `${lesson.id}/${step.id} reuses unknown question ${step.questionId}`);
      if (step.exerciseStep) assert.ok(exerciseStepIds.has(step.exerciseStep), `${lesson.id}/${step.id} reuses unknown exercise step ${step.exerciseStep}`);
    }
    assert.ok(lesson.steps.some((s) => s.kind !== 'explain'), `${lesson.id} must let the learner practise or answer, not only read`);
  }
});

test('every classic question and every exercise step is reused somewhere, so earlier progress still counts', () => {
  const all = Object.values(LESSONS_BY_ID).flatMap((l) => l.steps);
  const usedQuestions = new Set(all.map((s) => s.questionId).filter(Boolean));
  const usedExerciseSteps = new Set(all.map((s) => s.exerciseStep).filter(Boolean));
  for (const id of classicQuestionIds) assert.ok(usedQuestions.has(id), `classic question ${id} is not reused`);
  for (const id of exerciseStepIds) assert.ok(usedExerciseSteps.has(id), `exercise step ${id} is not reused`);
});

test('reference gaps are stated, not papered over, in the comprehensive level', () => {
  const hateOnly = lessonsForLevel('hate').filter((l) => !lessonsForLevel('basic').includes(l) && !lessonsForLevel('intermediate').includes(l));
  const text = hateOnly.flatMap((l) => l.steps.map((s) => `${s.explain} ${s.example || ''}`)).join(' ');
  for (const gap of ['Velocity Limit', 'PowerOn Default', 'not simulated', 'not photographed']) {
    assert.ok(text.includes(gap), `the comprehensive level must say plainly what is unresolved: ${gap}`);
  }
});

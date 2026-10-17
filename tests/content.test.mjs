import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LESSONS } from '../src/renderer/content/curriculum.mjs';
import { CONTROLS, EVIDENCE_LEVELS } from '../src/renderer/content/controls.mjs';
import { EXERCISES } from '../src/renderer/content/exercises.mjs';
import { HANDBOOK_ENTRIES, ALIAS_GROUPS } from '../src/renderer/content/handbook.mjs';
import { REFERENCE_IMAGES, MANUAL_CITATIONS } from '../src/renderer/content/references.mjs';
import { LESSONS_BY_ID } from '../src/renderer/content/levels.mjs';

const nonEmpty = (value) => typeof value === 'string' && value.trim().length > 0;

test('ten lessons with stable ids and twenty questions are retained from the prototype', () => {
  assert.equal(LESSONS.length, 10);
  LESSONS.forEach((lesson, i) => {
    assert.equal(lesson.id, `l${String(i + 1).padStart(2, '0')}`);
    for (const field of ['short', 'title', 'intro', 'heading', 'body', 'simple', 'take', 'demo']) {
      assert.ok(nonEmpty(lesson[field]), `${lesson.id}.${field} must be text`);
    }
    assert.equal(lesson.questions.length, 2, `${lesson.id} keeps two questions`);
    lesson.questions.forEach((q, qi) => {
      assert.equal(q.id, `${lesson.id}q${qi + 1}`);
      assert.equal(q.options.length, 3);
      assert.ok(Number.isInteger(q.correct) && q.correct >= 0 && q.correct < 3);
      assert.equal(q.hints.length, 3);
      q.hints.forEach((hint, hi) => {
        if (hi === q.correct) assert.equal(hint, '', `${q.id} has no hint for the correct option`);
        else assert.ok(nonEmpty(hint), `${q.id} option ${hi} needs a wrong-answer explanation`);
      });
      assert.ok(nonEmpty(q.why));
    });
  });
  // Spot checks against the prototype text and answer keys.
  assert.equal(LESSONS[2].title, '255 is a value. It is not a distance.');
  assert.equal(LESSONS[6].questions[0].correct, 1, 'timeline question: blocks 2 and 3');
  assert.equal(LESSONS[7].questions[0].correct, 2, 'network question: 192.168.0.20');
  assert.equal(LESSONS[3].questions[0].options[1], 'Axis 2');
});

test('every control has complete plain-language help and a labeled mechanism note', () => {
  const ids = Object.keys(CONTROLS);
  assert.ok(ids.length >= 30, `expected a full control set, found ${ids.length}`);
  for (const id of ids) {
    const c = CONTROLS[id];
    assert.equal(c.id, id);
    for (const field of ['name', 'short', 'purpose', 'when', 'example', 'mistakes', 'expected', 'effect']) {
      assert.ok(nonEmpty(c[field]), `${id}.${field} must be text`);
    }
    assert.ok(nonEmpty(c.mechanism.text), `${id}.mechanism.text`);
    assert.ok(EVIDENCE_LEVELS.includes(c.mechanism.evidence), `${id}.mechanism.evidence`);
    assert.ok(EVIDENCE_LEVELS.includes(c.evidence), `${id}.evidence`);
    assert.ok(Array.isArray(c.related));
  }
  assert.deepEqual(EVIDENCE_LEVELS, ['observed', 'manual', 'simplified', 'unverified']);
});

test('three guided exercises target existing controls and carry full step text', () => {
  assert.deepEqual(
    EXERCISES.map((e) => e.id),
    ['schedule-light', 'read-command', 'understand-address'],
  );
  for (const exercise of EXERCISES) {
    assert.ok(nonEmpty(exercise.title));
    assert.ok(nonEmpty(exercise.goal));
    assert.ok(exercise.steps.length >= 3);
    for (const step of exercise.steps) {
      assert.ok(nonEmpty(step.id));
      assert.ok(CONTROLS[step.target], `${exercise.id}/${step.id} targets unknown control ${step.target}`);
      for (const field of ['title', 'why', 'instruction', 'success']) {
        assert.ok(nonEmpty(step[field]), `${exercise.id}/${step.id}.${field}`);
      }
      assert.equal(typeof step.validate, 'function');
    }
  }
});

test('the handbook covers every control, guided lesson, classic topic, assignment, the core concepts, and Rose Float examples', () => {
  const byId = new Map(HANDBOOK_ENTRIES.map((e) => [e.id, e]));
  assert.equal(byId.size, HANDBOOK_ENTRIES.length, 'handbook ids are unique');
  for (const id of Object.keys(CONTROLS)) {
    const entry = byId.get(`control:${id}`);
    assert.ok(entry, `missing handbook entry for control ${id}`);
    assert.equal(entry.type, 'control');
  }
  for (const lesson of Object.values(LESSONS_BY_ID)) {
    const entry = byId.get(`lesson:${lesson.id}`);
    assert.equal(entry?.type, 'lesson', `missing guided lesson entry ${lesson.id}`);
    assert.equal(entry.lessonId, lesson.id);
    assert.equal(entry.sections.length, lesson.steps.length, 'one handbook section per step');
  }
  for (const lesson of LESSONS) {
    assert.equal(byId.get(`topic:${lesson.id}`)?.type, 'topic', `classic lesson text ${lesson.id} is kept as a topic note`);
  }
  for (const exercise of EXERCISES) {
    const entry = byId.get(`exercise:${exercise.id}`);
    assert.equal(entry?.type, 'exercise');
    assert.ok(LESSONS_BY_ID[entry.lessonId], `assignment ${exercise.id} points at a real guided lesson`);
  }
  for (const entry of HANDBOOK_ENTRIES) {
    for (const rel of entry.related) assert.ok(byId.has(rel), `${entry.id} relates to unknown entry ${rel}`);
  }
  for (const concept of [
    'concept:pcmacs', 'concept:channel', 'concept:0-255', 'concept:card-axis-channel',
    'concept:com-port', 'concept:ip-address', 'concept:netmask', 'concept:gateway',
    'concept:timeline', 'concept:feedback', 'concept:pid', 'concept:calibration',
    'concept:velocity-limit', 'concept:adl-file',
  ]) {
    assert.equal(byId.get(concept)?.type, 'concept', `missing ${concept}`);
  }
  const examples = HANDBOOK_ENTRIES.filter((e) => e.type === 'example');
  const tags = new Set(examples.flatMap((e) => e.tags));
  for (const tag of ['electronics', 'sensors', 'hydraulics', 'motion', 'timing']) {
    assert.ok(tags.has(tag), `missing Rose Float example tagged ${tag}`);
  }
  for (const entry of HANDBOOK_ENTRIES) {
    assert.ok(nonEmpty(entry.title) && nonEmpty(entry.body), `${entry.id} needs title and body`);
    assert.ok(EVIDENCE_LEVELS.includes(entry.evidence), `${entry.id} needs an evidence label`);
  }
  const flat = ALIAS_GROUPS.flat();
  for (const alias of ['netmask', 'pc mac', 'dmx']) {
    assert.ok(flat.includes(alias), `alias ${alias} must be listed`);
  }
});

test('reference images and manual citations are complete and labeled', () => {
  assert.equal(REFERENCE_IMAGES.length, 10);
  for (const image of REFERENCE_IMAGES) {
    assert.match(image.file, /^\d{2}-\d{10}\.jpg$/);
    assert.ok(nonEmpty(image.caption) && nonEmpty(image.shows));
    assert.ok(EVIDENCE_LEVELS.includes(image.evidence));
  }
  assert.ok(Object.keys(MANUAL_CITATIONS).length >= 6);
  for (const [key, cite] of Object.entries(MANUAL_CITATIONS)) {
    assert.ok(nonEmpty(cite.manual) && nonEmpty(cite.edition) && nonEmpty(cite.pages) && nonEmpty(cite.claim), key);
    assert.match(cite.url, /^https:\/\/gilderfluke\.com\//);
    assert.ok(['read-locally', 'not-read'].includes(cite.status), `${key}.status`);
  }
});

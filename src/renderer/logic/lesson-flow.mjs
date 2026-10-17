// Guided-lesson coordinator: walks an ordered list of steps, one control or
// concept each. Explanations can always be left with Next; practice steps need
// a passing check and question steps a correct answer first. A passing check
// never advances by itself, so the learner reads the outcome before moving on.
// Completed steps are recorded by id so they can be saved and restored, and
// steps that reuse a classic question or exercise step are pre-marked from the
// version-1 records (see progress-schema.mjs).

export function legacyKeysFor(step) {
  return {
    questionId: typeof step.questionId === 'string' ? step.questionId : null,
    exerciseStep: typeof step.exerciseStep === 'string' ? step.exerciseStep : null,
  };
}

export function createLessonRun(lesson, saved = {}) {
  const steps = lesson.steps;
  const clamp = (n) => Math.min(Math.max(Number.isInteger(n) ? n : 0, 0), steps.length - 1);
  let index = clamp(saved.stepIndex ?? 0);
  // Furthest step the learner has reached: what has been revealed stays revealed.
  let reached = index;
  const known = new Set(steps.map((s) => s.id));
  let completed = Array.isArray(saved.completedSteps) ? saved.completedSteps.filter((id) => known.has(id)) : [];
  let missed = Boolean(saved.missed);

  const legacy = saved.legacy || {};
  const answered = new Set(Array.isArray(legacy.answered) ? legacy.answered : []);
  const exerciseSteps = new Set(Array.isArray(legacy.exerciseSteps) ? legacy.exerciseSteps : []);
  for (const step of steps) {
    const keys = legacyKeysFor(step);
    if ((keys.questionId && answered.has(keys.questionId)) || (keys.exerciseStep && exerciseSteps.has(keys.exerciseStep))) {
      if (!completed.includes(step.id)) completed = [...completed, step.id];
    }
  }

  function complete(id) {
    if (!completed.includes(id)) completed = [...completed, id];
  }

  function isDone(step) {
    return completed.includes(step.id);
  }

  function current() {
    const step = steps[index];
    const done = isDone(step);
    return {
      index,
      step,
      total: steps.length,
      isLast: index === steps.length - 1,
      done,
      canAdvance: step.kind === 'explain' || done,
    };
  }

  function check(ctx) {
    const step = steps[index];
    if (step.kind !== 'practice') return { ok: false, message: 'This step has nothing to check.' };
    const result = step.practice.validate(ctx);
    if (result.ok) complete(step.id);
    return { ok: Boolean(result.ok), message: result.message };
  }

  function answer(choice) {
    const step = steps[index];
    if (step.kind !== 'question') return { ok: false, message: 'This step has no question.' };
    const q = step.question;
    if (!Number.isInteger(choice) || choice < 0 || choice >= q.options.length) throw new RangeError('Invalid answer');
    if (choice === q.correct) {
      complete(step.id);
      return { ok: true, message: `That’s right. ${q.why}` };
    }
    missed = true;
    return { ok: false, message: `Not quite. ${q.hints[choice]} Try again.` };
  }

  function next() {
    const c = current();
    if (!c.canAdvance) return { event: 'blocked', missingSteps: [c.step.id] };
    complete(c.step.id);
    if (!c.isLast) {
      index += 1;
      reached = Math.max(reached, index);
      return { event: 'advanced' };
    }
    const missingSteps = steps.filter((s) => !isDone(s)).map((s) => s.id);
    if (missingSteps.length) return { event: 'blocked', missingSteps };
    return { event: 'finished' };
  }

  function back() {
    index = Math.max(0, index - 1);
    return current();
  }

  function revealed() {
    const parts = [...lesson.reveal];
    for (let i = 0; i <= reached; i += 1) for (const p of steps[i].reveal) if (!parts.includes(p)) parts.push(p);
    return parts;
  }

  function progress() {
    return {
      index,
      completedSteps: [...completed],
      finished: steps.every(isDone),
      missed,
    };
  }

  return { lesson, current, check, answer, next, back, revealed, progress };
}

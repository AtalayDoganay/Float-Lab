// Guided-practice engine: steps through an exercise, validating each learner
// action against the simulation state. Completed steps are recorded by id so
// they can be saved and restored; a failed check never advances.

export function createGuidedRun(exercise, saved = {}) {
  const steps = exercise.steps;
  const clamp = (n) => Math.min(Math.max(Number.isInteger(n) ? n : 0, 0), steps.length - 1);
  let index = clamp(saved.stepIndex ?? 0);
  let completed = Array.isArray(saved.completedSteps)
    ? saved.completedSteps.filter((id) => steps.some((s) => s.id === id))
    : [];

  function current() {
    return { index, step: steps[index], total: steps.length, isLast: index === steps.length - 1 };
  }

  function validate(ctx) {
    const step = steps[index];
    const result = step.validate(ctx);
    if (!result.ok) return { ok: false, message: result.message, finished: false };
    if (!completed.includes(step.id)) completed = [...completed, step.id];
    const finished = index === steps.length - 1;
    if (!finished) index += 1;
    return { ok: true, message: result.message, finished };
  }

  function back() {
    index = Math.max(0, index - 1);
    return current();
  }

  function reset() {
    index = 0;
    completed = [];
    return current();
  }

  function progress() {
    return { index, completed: [...completed] };
  }

  return { exercise, current, validate, back, reset, progress };
}

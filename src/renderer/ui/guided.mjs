// Guided practice panel: exercise chooser, current step with highlighted
// target, specific feedback, and Back / Check again / Repeat / Reset controls.
import { el, replace, helpButton } from './dom.mjs';
import { EXERCISES } from '../content/exercises.mjs';
import { CONTROLS } from '../content/controls.mjs';

export function mountGuided(container, { dispatch }) {
  function chooser(state) {
    const { guided } = state;
    return [
      el('div', { class: 'with-help' }, el('h2', { text: 'Guided practice' }), helpButton('exercise-select')),
      el('p', { class: 'muted', text: 'Each exercise highlights the next control in the workspace, explains why it matters, checks what you did, and shows the simulated result. Pick one to start.' }),
      el('div', { class: 'exercise-list', 'data-control': 'exercise-select' }, ...EXERCISES.map((ex) => {
        const done = guided.completedSteps.filter((k) => k.startsWith(`${ex.id}:`)).length;
        const complete = guided.completedExercises.includes(ex.id);
        return el('button', { type: 'button', 'data-fid': `ex-${ex.id}`, onclick: () => dispatch({ type: 'start-exercise', id: ex.id }) },
          el('strong', { text: ex.title }), el('small', { text: ex.goal }),
          el('small', { text: complete ? 'Completed. Choose it again to practice.' : `${done} of ${ex.steps.length} steps done` }));
      })),
    ];
  }

  function active(state) {
    const { guided } = state;
    const exercise = EXERCISES.find((e) => e.id === guided.exerciseId);
    const step = exercise.steps[guided.stepIndex];
    const control = CONTROLS[step.target];
    const finished = guided.completedExercises.includes(exercise.id) && guided.stepIndex === exercise.steps.length - 1 && guided.feedback?.ok;
    const nodes = [
      el('div', { class: 'with-help' }, el('h2', { text: exercise.title }), helpButton('exercise-select')),
      el('p', { class: 'muted', text: exercise.goal }),
      el('div', { class: 'step-count', text: `Step ${guided.stepIndex + 1} of ${exercise.steps.length}. Highlighted control: ${control.name}.` }),
      el('h3', { text: step.title }),
      el('p', { text: step.instruction }),
      guided.showWhy ? el('div', { class: 'step-why' }, el('strong', { text: 'Why it matters: ' }), step.why) : null,
      el('p', { class: 'muted', text: `Expected result: ${step.success}` }),
    ];
    if (step.question) {
      nodes.push(el('p', { text: step.question.prompt }),
        el('div', { class: 'answers' }, ...step.question.options.map((opt, i) => el('button', { type: 'button', 'data-control': 'answer-option', 'data-fid': `g-${i}`, onclick: () => dispatch({ type: 'guided-answer', answer: opt }) },
          el('span', { class: 'letter', text: String.fromCharCode(65 + i) }), el('span', { text: opt })))));
    }
    nodes.push(el('div', { class: `feedback ${guided.feedback ? (guided.feedback.ok ? 'ok' : 'bad') : ''}`, role: 'status', 'aria-live': 'polite', text: guided.feedback ? guided.feedback.message : '' }));
    if (finished) {
      nodes.push(el('div', { class: 'checkpoint' }, el('h3', { text: 'Exercise complete' }), el('p', { text: 'Every step was checked against what you actually did in the workspace. Nothing was sent to any hardware.' })));
    }
    nodes.push(el('div', { class: 'btn-row' },
      el('button', { type: 'button', class: 'btn', 'data-control': 'guided-back', 'data-fid': 'g-back', disabled: guided.stepIndex === 0, text: 'Back', onclick: () => dispatch({ type: 'guided-back' }) }),
      step.question ? null : el('button', { type: 'button', class: 'btn btn-primary', 'data-control': 'guided-retry', 'data-fid': 'g-check', text: 'Check again', onclick: () => dispatch({ type: 'guided-check' }) }),
      el('button', { type: 'button', class: 'btn', 'data-control': 'guided-explain', 'data-fid': 'g-why', text: guided.showWhy ? 'Hide explanation' : 'Repeat the explanation', onclick: () => dispatch({ type: 'guided-explain' }) }),
      el('button', { type: 'button', class: 'btn', 'data-control': 'guided-reset', 'data-fid': 'g-reset', text: 'Reset this exercise', onclick: () => dispatch({ type: 'guided-reset' }) }),
      helpButton('guided-back'), helpButton('guided-retry'), helpButton('guided-explain'), helpButton('guided-reset')),
      el('div', { class: 'btn-row' }, el('button', { type: 'button', class: 'btn', 'data-fid': 'g-choose', text: 'Choose another exercise', onclick: () => dispatch({ type: 'start-exercise', id: null }) })));
    return nodes;
  }

  function update(state) {
    const activeEl = document.activeElement;
    const fid = activeEl && container.contains(activeEl) ? activeEl.dataset.fid : null;
    replace(container, ...(state.guided.exerciseId ? active(state) : chooser(state)));
    if (fid) container.querySelector(`[data-fid="${fid}"]`)?.focus();
  }

  return { update };
}

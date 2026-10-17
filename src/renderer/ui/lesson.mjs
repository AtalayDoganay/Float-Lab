// The compact lesson panel beside the workspace: one step at a time, with the
// explanation, an optional demonstration, the practice or question, specific
// feedback, and Back / Next with a visible step count.
import { el, replace, helpButton, evidenceChip } from './dom.mjs';
import { CONTROLS } from '../content/controls.mjs';
import { LEVEL_BY_ID, GROUPS } from '../content/levels.mjs';
import { REFERENCE_IMAGES } from '../content/references.mjs';

export function mountLesson(container, { dispatch }) {
  function dots(run) {
    const c = run.current();
    const completed = new Set(run.progress().completedSteps);
    return el('div', { class: 'dots', 'aria-hidden': 'true' }, ...run.lesson.steps.map((s, i) => el('span', { class: [completed.has(s.id) ? 'done' : '', i === c.index ? 'current' : ''].join(' ').trim() })));
  }

  function build(state, run) {
    const c = run.current();
    const { step } = c;
    const lesson = run.lesson;
    const level = LEVEL_BY_ID[state.level];
    const control = step.target ? CONTROLS[step.target] : null;
    const demo = state.lesson.demo;
    const feedback = state.lesson.feedback;
    const photo = step.photo ? REFERENCE_IMAGES.find((img) => img.file === step.photo) : null;

    const nodes = [
      el('div', { class: 'back-row' }, el('button', { type: 'button', class: 'btn btn-small', 'data-fid': 'back-map', text: 'Lessons', onclick: () => dispatch({ type: 'open-level' }) })),
      el('div', { class: 'lesson-kicker' }, el('span', { class: 'level', text: level ? level.name : '' }), el('span', { text: GROUPS[lesson.group].title })),
      el('div', { class: 'lesson-title', text: lesson.title }),
      el('div', { class: 'steps-bar' }, el('span', { 'data-ref': 'step-count', text: `Step ${c.index + 1} of ${c.total}` }), dots(run)),
      el('h2', { class: 'step-title', text: step.title }),
      el('p', { class: 'explain', text: step.explain }),
      step.example ? el('p', { class: 'example', text: step.example }) : null,
      step.mechanism ? el('p', { class: 'mech' }, evidenceChip(step.mechanism.evidence), step.mechanism.text) : null,
    ];

    if (step.demo) {
      nodes.push(el('div', { class: 'demo-box' },
        el('button', { type: 'button', class: 'btn', 'data-control': 'show-me', 'data-fid': 'show-me', disabled: demo.running, text: demo.running ? 'Demonstrating…' : 'Show me', onclick: () => dispatch({ type: 'demo-start' }) }),
        el('div', { class: `note ${demo.running ? 'running' : ''}`, role: 'status', 'aria-live': 'polite', text: demo.note })));
    }

    if (step.kind === 'practice') {
      nodes.push(el('div', { class: 'try' },
        el('strong', { text: 'Now you try.' }),
        el('p', { text: step.practice.instruction }),
        el('div', { class: 'btn-row', style: 'margin:0' },
          el('button', { type: 'button', class: 'btn btn-small', 'data-control': 'check-step', 'data-fid': 'check', disabled: demo.running, text: 'Check', onclick: () => dispatch({ type: 'step-check' }) }),
          el('span', { class: 'muted', text: c.done ? 'Done.' : `Expected: ${step.practice.success}` }))));
    }

    if (step.kind === 'question') {
      const q = step.question;
      nodes.push(el('p', { text: q.prompt }),
        el('div', { class: 'answers' }, ...q.options.map((opt, i) => {
          const cls = c.done && i === q.correct ? 'correct' : (state.lesson.lastChoice === i && !(feedback && feedback.ok) ? 'wrong' : '');
          return el('button', { type: 'button', class: cls, 'data-control': 'answer-option', 'data-fid': `answer-${i}`, disabled: c.done, onclick: () => dispatch({ type: 'step-answer', choice: i }) },
            el('span', { class: 'letter', text: String.fromCharCode(65 + i) }), el('span', { text: opt }));
        })));
    }

    nodes.push(el('div', { class: `feedback ${feedback ? (feedback.ok ? 'ok' : 'bad') : ''}`, role: 'status', 'aria-live': 'polite', 'data-ref': 'feedback', text: feedback ? feedback.message : '' }));

    nodes.push(el('div', { class: 'nav-row' },
      el('button', { type: 'button', class: 'btn', 'data-control': 'step-back', 'data-fid': 'step-back', disabled: c.index === 0 || demo.running, text: 'Back', onclick: () => dispatch({ type: 'step-back' }) }),
      el('button', { type: 'button', class: 'btn btn-primary', 'data-control': 'step-next', 'data-fid': 'step-next', disabled: !c.canAdvance || demo.running, text: c.isLast ? 'Finish lesson' : 'Next', onclick: () => dispatch({ type: 'step-next' }) })));

    nodes.push(el('div', { class: 'link-row' },
      control ? el('span', { class: 'with-help' }, el('span', { class: 'muted', text: control.name }), helpButton(step.target)) : null,
      step.concept ? el('button', { type: 'button', class: 'link-btn', 'data-fid': 'concept', text: 'Read more in the handbook', onclick: () => dispatch({ type: 'open-entry', id: step.concept }) }) : null,
      photo ? el('button', { type: 'button', class: 'link-btn', 'data-control': 'photo-toggle', 'data-fid': 'photo', text: 'See the reference photo', onclick: () => dispatch({ type: 'open-photo', file: photo.file }) }) : null,
      el('button', { type: 'button', class: 'link-btn', 'data-control': 'lesson-reset', 'data-fid': 'reset', text: 'Restart this lesson', onclick: () => dispatch({ type: 'lesson-reset' }) })));

    return nodes;
  }

  function update(state, run) {
    if (!run) { replace(container); return; }
    const activeEl = document.activeElement;
    const fid = activeEl && container.contains(activeEl) ? activeEl.dataset.fid : null;
    replace(container, ...build(state, run));
    if (fid) container.querySelector(`[data-fid="${fid}"]`)?.focus();
  }

  return { update };
}

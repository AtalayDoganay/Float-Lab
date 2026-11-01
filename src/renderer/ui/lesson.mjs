// The compact lesson panel beside the recreated windows, one focus at a time:
// the step count, a dock where Rosie floats when a step has nothing to point
// at (her words live in the floating guide layer), the one action that comes
// next, Back and Next, and a closed "More about this step" with the example, the mechanism note, the
// control's help, the handbook, the reference photo, and Restart this lesson.
//
// The panel is rebuilt on every render. Two things survive the rebuild on
// purpose: keyboard focus (restored to the same button, or moved to the next
// action when that button is gone or disabled) and the screen-reader
// announcement, which lives in one persistent live region outside the panel
// and changes only when the bubble's text changes.
import { el, replace, helpButton, evidenceChip } from './dom.mjs';
import { CONTROLS } from '../content/controls.mjs';
import { LEVEL_BY_ID, GROUPS } from '../content/levels.mjs';
import { COURSE } from '../content/course.mjs';
import { REFERENCE_IMAGES } from '../content/references.mjs';
import { primaryAction, secondaryActions, bubbleText } from '../logic/step-beats.mjs';
import { soundSettings } from './sound-settings.mjs';

// What each beat action does, and which help entry explains its button.
const PRIMARY = {
  'show-me': { control: 'show-me', action: { type: 'demo-start' } },
  wait: { control: 'show-me', action: null },
  'your-turn': { control: 'your-turn', action: { type: 'beat-try' } },
  check: { control: 'check-step', action: { type: 'step-check' } },
};
const SECONDARY = {
  'skip-to-try': { control: 'your-turn', action: { type: 'beat-try' } },
  'watch-again': { control: 'show-me', action: { type: 'demo-start' } },
  'show-again': { control: 'show-me', action: { type: 'demo-start' } },
};

export function mountLesson(container, { dispatch }) {
  const announcer = document.getElementById('panel-announcer');
  let announced = '';
  // True while the panel owned the keyboard focus and a rebuild took it away
  // (a focused button became disabled or disappeared), so the next render
  // hands it to the next action instead of leaving it on the document body.
  let wantsFocus = false;

  function dots(run) {
    const c = run.current();
    const completed = new Set(run.progress().completedSteps);
    return el('div', { class: 'dots', 'aria-hidden': 'true' }, ...run.lesson.steps.map((s, i) => el('span', { class: [completed.has(s.id) ? 'done' : '', i === c.index ? 'current' : ''].join(' ').trim() })));
  }

  function answers(state, c) {
    const q = c.step.question;
    const feedback = state.lesson.feedback;
    return el('div', { class: 'answers' }, ...q.options.map((opt, i) => {
      const cls = c.done && i === q.correct ? 'correct' : (state.lesson.lastChoice === i && !(feedback && feedback.ok) ? 'wrong' : '');
      return el('button', { type: 'button', class: cls, 'data-control': 'answer-option', 'data-fid': `answer-${i}`, disabled: c.done, onclick: () => dispatch({ type: 'step-answer', choice: i }) },
        el('span', { class: 'letter', text: String.fromCharCode(65 + i) }), el('span', { text: opt }));
    }));
  }

  function more(step, control, photo) {
    return el('details', { class: 'more', 'data-keep': 'more' },
      el('summary', { 'data-control': 'more-about-step', 'data-fid': 'more', text: 'More about this step' }),
      step.example ? el('p', { class: 'example', text: step.example }) : null,
      step.mechanism ? el('p', { class: 'mech' }, evidenceChip(step.mechanism.evidence), step.mechanism.text) : null,
      el('div', { class: 'link-row' },
        control ? el('span', { class: 'with-help' }, el('span', { class: 'muted', text: control.name }), helpButton(step.target)) : null,
        step.concept ? el('button', { type: 'button', class: 'link-btn', 'data-fid': 'concept', text: 'Read more in the handbook', onclick: () => dispatch({ type: 'open-entry', id: step.concept }) }) : null,
        photo ? el('button', { type: 'button', class: 'link-btn', 'data-control': 'photo-toggle', 'data-fid': 'photo', text: 'See the reference photo', onclick: () => dispatch({ type: 'open-photo', file: photo.file }) }) : null,
        el('button', { type: 'button', class: 'link-btn', 'data-control': 'lesson-reset', 'data-fid': 'reset', text: 'Restart this lesson', onclick: () => dispatch({ type: 'lesson-reset' }) })));
  }

  function build(state, run, { audioState }) {
    const c = run.current();
    const { step } = c;
    const lesson = run.lesson;
    const level = LEVEL_BY_ID[state.level];
    const feedback = state.lesson.feedback;
    const demo = state.lesson.demo;
    const ctx = { step, beat: state.lesson.beat, done: c.done, feedback, demo, isLast: c.isLast };
    const text = bubbleText(ctx);
    const primary = primaryAction(ctx);
    const secondary = secondaryActions(ctx);
    const control = step.target ? CONTROLS[step.target] : null;
    const photo = step.photo ? REFERENCE_IMAGES.find((img) => img.file === step.photo) : null;

    const inCourse = state.level === 'course';
    const nodes = [
      el('div', { class: 'back-row' }, el('button', { type: 'button', class: 'btn btn-small', 'data-fid': 'back-map', text: 'Lessons', onclick: () => dispatch({ type: 'open-level' }) })),
      el('div', { class: 'lesson-kicker' }, el('span', { class: 'level', text: inCourse ? COURSE.title : (level ? level.name : '') }), el('span', { text: GROUPS[lesson.group].title })),
      el('div', { class: 'lesson-title', text: lesson.title }),
      el('div', { class: 'steps-bar' }, el('span', { 'data-ref': 'step-count', text: `Step ${c.index + 1} of ${c.total}` }), dots(run)),
      // Rosie floats in the guide layer; this empty dock reserves her room when a step has nothing to point at.
      el('div', { id: 'guide-dock', class: 'guide-dock', 'aria-hidden': 'true' }),
    ];

    // A narrated film: its caption strip and transport, with the sound settings.
    const cinema = state.cinema;
    if (step.film && (cinema.playing || state.lesson.beat === 'watch')) {
      nodes.push(el('p', { class: 'film-caption', 'data-ref': 'film-caption', role: 'status', 'aria-live': 'polite', hidden: state.prefs.captions === false, text: cinema.caption || '' }));
      if (cinema.playing) {
        nodes.push(el('div', { class: 'film-transport' },
          el('button', { type: 'button', class: 'btn btn-small', 'data-control': 'film-pause', 'data-fid': 'film-pause', 'aria-pressed': String(cinema.paused), text: cinema.paused ? 'Resume' : 'Pause', onclick: () => dispatch({ type: cinema.paused ? 'film-resume' : 'film-pause' }) }),
          el('button', { type: 'button', class: 'btn btn-small', 'data-fid': 'film-replay', text: 'Replay', onclick: () => dispatch({ type: 'film-replay' }) }),
          el('button', { type: 'button', class: 'btn btn-small', 'data-control': 'film-skip', 'data-fid': 'film-skip', text: 'Skip>>', onclick: () => dispatch({ type: 'film-skip' }) })));
      }
      nodes.push(soundSettings({ prefs: state.prefs, dispatch, audioState }));
    }

    if (step.kind === 'question') nodes.push(answers(state, c));

    const actionNodes = [];
    if (primary && primary.id !== 'next') {
      const p = PRIMARY[primary.id];
      actionNodes.push(el('button', {
        type: 'button', class: 'btn btn-primary', 'data-control': p.control, 'data-fid': 'primary', disabled: !p.action || demo.running, text: primary.label,
        onclick: () => { if (p.action) dispatch(p.action); },
      }));
    }
    if (secondary.length) {
      actionNodes.push(el('div', { class: 'links' }, ...secondary.map((s) => el('button', {
        type: 'button', class: 'link-btn', 'data-control': SECONDARY[s.id].control, 'data-fid': `secondary-${s.id}`, disabled: demo.running, text: s.label,
        onclick: () => dispatch(SECONDARY[s.id].action),
      }))));
    }
    if (actionNodes.length) nodes.push(el('div', { class: 'beat-actions' }, ...actionNodes));

    nodes.push(el('div', { class: 'nav-row' },
      el('button', { type: 'button', class: 'btn', 'data-control': 'step-back', 'data-fid': 'step-back', disabled: c.index === 0 || demo.running, text: 'Back', onclick: () => dispatch({ type: 'step-back' }) }),
      el('button', {
        type: 'button', class: primary && primary.id === 'next' ? 'btn btn-primary' : 'btn', 'data-control': 'step-next', 'data-fid': 'step-next',
        disabled: !c.canAdvance || demo.running, text: primary && primary.id === 'next' ? primary.label : (c.isLast ? 'Finish lesson' : 'Next'), onclick: () => dispatch({ type: 'step-next' }),
      })));

    nodes.push(more(step, control, photo));
    return { nodes, announce: `${text.title}. ${text.lines.join(' ')}` };
  }

  function announce(text) {
    if (!announcer || text === announced) return;
    announcer.textContent = text;
    announced = text;
  }

  function restoreFocus(fid) {
    const byFid = fid ? container.querySelector(`[data-fid="${fid}"]`) : null;
    const target = byFid && !byFid.disabled
      ? byFid
      : (container.querySelector('[data-fid="primary"]:not(:disabled)')
        || container.querySelector('[data-fid="step-next"]:not(:disabled)')
        || container.querySelector('[data-fid="step-back"]:not(:disabled)'));
    if (target) target.focus({ preventScroll: true });
    return Boolean(target);
  }

  // The film's caption changes many times a beat; it is written in place, not by a rebuild.
  function caption(text) {
    const node = container.querySelector('[data-ref="film-caption"]');
    if (node) node.textContent = text || '';
  }

  function update(state, run, { audioState = 'ready' } = {}) {
    if (!run) { replace(container); announce(''); wantsFocus = false; return; }
    const activeEl = document.activeElement;
    const inPanel = Boolean(activeEl && container.contains(activeEl));
    const lost = !activeEl || activeEl === document.body;
    const fid = inPanel ? activeEl.dataset.fid : null;
    // Disclosures the learner opened (More about this step, Sound) stay open across the rebuild.
    const kept = new Set([...container.querySelectorAll('details[data-keep]')].filter((d) => d.open).map((d) => d.dataset.keep));
    const built = build(state, run, { audioState });
    replace(container, ...built.nodes);
    for (const d of container.querySelectorAll('details[data-keep]')) if (kept.has(d.dataset.keep)) d.open = true;
    announce(built.announce);
    if (inPanel || (lost && wantsFocus)) wantsFocus = true, restoreFocus(fid);
    else wantsFocus = false;
  }

  return { update, caption };
}

// One focus at a time inside a lesson step. A step is shown in beats: look
// (the explanation, one control highlighted), watch (the demonstration, if the
// step has one), try (the practice instruction and its check). Question steps
// show their options in the look beat. These functions decide, from the step
// and the beat, what the guide says and which single action comes next; they
// keep no state of their own.
import { LINES } from '../content/mascot.mjs';

export const BEATS = Object.freeze(['look', 'watch', 'try']);

const DEMO_FINISHED = 'Demonstration finished. Now you try.';

// A practice step opens in its try beat once it is done, or once its film has
// already been watched or skipped (the handoff from the watch step must not
// offer the same film a second time); the film stays reachable from help.
export function initialBeat(step, done, { filmSeen = false } = {}) {
  return step.kind === 'practice' && (done || (filmSeen && Boolean(step.film))) ? 'try' : 'look';
}

const nextAction = (isLast) => ({ id: 'next', label: isLast ? 'Finish lesson' : 'Next' });

// A step demonstrates through a plain demo or a narrated film.
const demoOf = (step) => step.film || step.demo;

export function primaryAction({ step, beat, done, demo, isLast = false }) {
  if (beat === 'watch') {
    if (demo.running || !demo.finished) return { id: 'wait', label: step.film ? 'Playing…' : 'Demonstrating…' };
    if (step.kind === 'practice' && !done) return { id: 'your-turn', label: step.film ? 'Try it' : 'Your turn' };
    // After a film the handoff is explicit: the next step is the practice.
    return step.film && !isLast ? { id: 'next', label: 'Try it' } : nextAction(isLast);
  }
  if (beat === 'try') return done ? nextAction(isLast) : { id: 'check', label: 'Check' };
  // look
  if (done) return nextAction(isLast);
  if (demoOf(step)) return { id: 'show-me', label: step.film ? 'Watch' : 'Show me' };
  if (step.kind === 'practice') return { id: 'your-turn', label: 'Your turn' };
  if (step.kind === 'question') return null;
  return nextAction(isLast);
}

export function secondaryActions({ step, beat, done, demo }) {
  if (!demoOf(step) || demo.running) return [];
  // A finished step keeps its demonstration reachable: teaching material is never hidden.
  if (done) return [{ id: 'watch-again', label: 'Watch again' }];
  if (beat === 'look' && step.kind === 'practice') return [{ id: 'skip-to-try', label: 'Skip to trying' }];
  if (beat === 'watch' && demo.finished) return [{ id: 'watch-again', label: 'Watch again' }];
  if (beat === 'try') return [{ id: 'show-again', label: 'Show me again' }];
  return [];
}

export function expressionFor({ step, beat, done, feedback }) {
  if (feedback) return feedback.ok ? 'cheer' : 'oops';
  if (step.kind === 'practice' && done) return 'cheer';
  return beat === 'watch' ? 'happy' : 'point';
}

export function bubbleText({ step, beat, done, feedback, demo }) {
  const title = step.title;
  if (feedback) {
    // A miss keeps what was asked under the correction, so it can be re-read.
    const lines = [feedback.message];
    if (!feedback.ok && step.kind === 'practice') lines.push(step.practice.instruction);
    if (!feedback.ok && step.kind === 'question') lines.push(step.question.prompt);
    return { title, lines };
  }
  if (beat === 'watch') { const d = demoOf(step); return { title, lines: [demo.running || !demo.finished ? d.intro : (d.outro || DEMO_FINISHED)] }; }
  if (beat === 'try') {
    return done
      ? { title, lines: [LINES.done({ success: step.practice.success })] }
      : { title, lines: [step.practice.instruction, LINES.expected({ success: step.practice.success })] };
  }
  const lines = [step.explain];
  if (step.kind === 'question') lines.push(step.question.prompt);
  return { title, lines };
}

// One focus at a time inside a lesson step. A step is shown in beats: look
// (the explanation, one control highlighted), watch (the demonstration, if the
// step has one), try (the practice instruction and its check). Question steps
// show their options in the look beat. These functions decide, from the step
// and the beat, what the guide says and which single action comes next; they
// keep no state of their own.
import { LINES } from '../content/mascot.mjs';

export const BEATS = Object.freeze(['look', 'watch', 'try']);

const DEMO_FINISHED = 'Demonstration finished. Now you try.';

export function initialBeat(step, done) {
  return step.kind === 'practice' && done ? 'try' : 'look';
}

const nextAction = (isLast) => ({ id: 'next', label: isLast ? 'Finish lesson' : 'Next' });

export function primaryAction({ step, beat, done, demo, isLast = false }) {
  if (beat === 'watch') {
    if (demo.running || !demo.finished) return { id: 'wait', label: 'Demonstrating…' };
    return step.kind === 'practice' && !done ? { id: 'your-turn', label: 'Your turn' } : nextAction(isLast);
  }
  if (beat === 'try') return done ? nextAction(isLast) : { id: 'check', label: 'Check' };
  // look
  if (done) return nextAction(isLast);
  if (step.demo) return { id: 'show-me', label: 'Show me' };
  if (step.kind === 'practice') return { id: 'your-turn', label: 'Your turn' };
  if (step.kind === 'question') return null;
  return nextAction(isLast);
}

export function secondaryActions({ step, beat, done, demo }) {
  if (!step.demo || demo.running) return [];
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
  if (beat === 'watch') return { title, lines: [demo.running || !demo.finished ? step.demo.intro : (step.demo.outro || DEMO_FINISHED)] };
  if (beat === 'try') {
    return done
      ? { title, lines: [LINES.done({ success: step.practice.success })] }
      : { title, lines: [step.practice.instruction, LINES.expected({ success: step.practice.success })] };
  }
  const lines = [step.explain];
  if (step.kind === 'question') lines.push(step.question.prompt);
  return { title, lines };
}

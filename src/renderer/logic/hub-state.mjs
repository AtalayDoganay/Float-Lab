// What the hub's two big buttons do and say, from the saved training alone
// (brief §14). Nothing here invents a date or a checkpoint: the last-active
// time is the recorded training activity, and a checkpoint exists only when
// the file (or this session) names a real lesson. A legacy checkpoint (a
// lesson of the earlier levels) is resumed from the archive and said so.
import { LESSONS_BY_ID } from '../content/levels.mjs';
import { isCourseLesson } from '../content/course.mjs';

const LABELS = Object.freeze({ startLabel: 'Start your training', continueLabel: 'Continue your training' });

function resolveCheckpoint(cp) {
  if (!cp || !cp.lessonId) return null;
  const lesson = LESSONS_BY_ID[cp.lessonId];
  if (!lesson) return null;
  const stepIndex = Math.min(Math.max(Number.isInteger(cp.stepIndex) ? cp.stepIndex : 0, 0), lesson.steps.length - 1);
  return { lessonId: lesson.id, stepIndex, title: lesson.title, stepTitle: lesson.steps[stepIndex].title, legacy: !isCourseLesson(lesson.id) };
}

export function hubState({ persistence, training, learning, saved, current }) {
  if (!persistence.loaded) {
    return { kind: 'loading', startEnabled: false, continueEnabled: false, ...LABELS, lastActive: null, checkpoint: null, explain: 'Loading your saved training…' };
  }
  if (persistence.readFailed) {
    return {
      kind: 'error', startEnabled: false, continueEnabled: false, ...LABELS, lastActive: null, checkpoint: null,
      explain: `Your saved training could not be read (${persistence.error || 'unknown error'}). Nothing has been changed and nothing will be saved over it. Use “Try reading again” in the notice above, or close and reopen the app.`,
    };
  }
  if (persistence.recovered) {
    const r = persistence.recovered;
    return {
      kind: 'unreadable', startEnabled: true, continueEnabled: false, ...LABELS, lastActive: null, checkpoint: null,
      explain: `Your saved training file could not be read (${r.reason}). It was moved aside and kept as ${r.quarantinedPath}; nothing was deleted. Start your training begins a new run.`,
    };
  }
  const lastActive = training.lastActivityAt ? new Date(training.lastActivityAt) : null;
  const when = lastActive ? `Last worked on: ${lastActive.toLocaleString()}. ` : '';
  const checkpoint = resolveCheckpoint(current || training.checkpoint || (saved && saved.lessonId ? { lessonId: saved.lessonId, stepIndex: saved.stepIndex } : null));
  if (training.completed) {
    return { kind: 'completed', startEnabled: true, continueEnabled: true, ...LABELS, lastActive, checkpoint, explain: `${when}Training finished. Continue opens the review stop; Start begins a new run.` };
  }
  const inProgress = Boolean(checkpoint) || Boolean(training.lastActivityAt) || learning.completedSteps.length > 0;
  if (!inProgress) {
    return { kind: 'none', startEnabled: true, continueEnabled: false, ...LABELS, lastActive: null, checkpoint: null, explain: 'No saved training yet.' };
  }
  let explain = when;
  if (checkpoint && checkpoint.legacy) explain += `Continue reopens “${checkpoint.title}”, step ${checkpoint.stepIndex + 1}, an earlier-version lesson kept in the archive. Start your training begins the new course.`;
  else if (checkpoint) explain += `Continue from “${checkpoint.title}”, step ${checkpoint.stepIndex + 1} of ${LESSONS_BY_ID[checkpoint.lessonId].steps.length}.`;
  else explain += 'Continue reopens the course where you left it.';
  return { kind: 'in-progress', startEnabled: true, continueEnabled: true, ...LABELS, lastActive, checkpoint, explain };
}

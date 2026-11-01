// Classifying and answering a typed question from the lesson's own knowledge
// (brief §7), and the state-specific hints for the one-second task. Pure:
// no DOM, no network, no model. Order: a plainly unrelated word with no
// training key wins; then the longest matching basic key; then an advanced
// key; otherwise uncertain.
import { QA, UNRELATED_HINTS, SUGGESTIONS, ADVANCED_TEXT, UNRELATED_TEXT, UNCERTAIN_TEXT } from '../content/qa.mjs';

export { ADVANCED_TEXT, UNRELATED_TEXT, UNCERTAIN_TEXT };

const normalize = (text) => String(text || '').toLowerCase().replace(/[’']/g, '’').replace(/\s+/g, ' ').trim();
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const phrase = (q, key) => new RegExp(`(^|[^a-z0-9])${escape(key)}(?=$|[^a-z0-9])`, 'i').test(q);

function matching(q, entries) {
  return entries
    .map((e) => ({ e, key: e.keys.filter((k) => phrase(q, k)).sort((a, b) => b.length - a.length)[0] }))
    .filter((m) => m.key)
    .sort((a, b) => b.key.length - a.key.length);
}

export function classifyQuestion(text) {
  const q = normalize(text);
  if (!q) return { kind: 'uncertain', entry: null };
  const basic = matching(q, QA.filter((e) => e.kind === 'basic'));
  const advanced = matching(q, QA.filter((e) => e.kind === 'advanced'));
  const unrelated = UNRELATED_HINTS.some((w) => phrase(q, w));
  if (unrelated && !basic.some((m) => m.key.includes(' ')) && !advanced.length) return { kind: 'unrelated', entry: null };
  if (basic.length) return { kind: 'basic', entry: basic[0].e };
  if (advanced.length) return { kind: 'advanced', entry: advanced[0].e };
  if (unrelated) return { kind: 'unrelated', entry: null };
  return { kind: 'uncertain', entry: null };
}

export function suggestionsFor(stepId) {
  return [...(SUGGESTIONS[stepId] || SUGGESTIONS.default)];
}

export function answerQuestion(text, { stepId } = {}) {
  const { kind, entry } = classifyQuestion(text);
  const suggestions = suggestionsFor(stepId);
  if (kind === 'basic') return { kind, text: entry.answer, showMe: Boolean(entry.showMe), suggestions };
  if (kind === 'advanced') return { kind, text: ADVANCED_TEXT, showMe: false, suggestions };
  if (kind === 'unrelated') return { kind, text: UNRELATED_TEXT, showMe: false, suggestions };
  return { kind: 'uncertain', text: UNCERTAIN_TEXT, showMe: false, suggestions };
}

// What Rosie says first for each observed state of the one-second attempt.
const HINTS = Object.freeze({
  'no-channel': 'Let’s pick Digital 0 first.',
  'wrong-channel': 'The timing looks close—let’s check which channel received it.',
  'selection-no-data': 'We’ve selected where to work. Now let’s turn that section on.',
  'too-long': 'We’re close! Check the duration: we need one second.',
  'stays-on': 'It starts correctly. Let’s make sure it switches off at two seconds.',
  'too-short': 'Almost: the event ends early. We need it ON until two seconds.',
  misplaced: 'Check both boundaries: ON at one second, OFF at two.',
  'extra-data': 'There is more than one ON stretch. We want exactly one, from one to two seconds.',
  'other-channel-changed': 'Only Digital 0 should change. Let’s put the other channel back as it was.',
  'not-previewed': 'Looks ready. Let’s play it and watch what happens.',
  done: 'Yes! One second ON. You got it!',
});

export function hintFor(state) {
  return HINTS[state] || 'Let’s look at the Digital 0 row together: select one second, turn it on, then play it back.';
}

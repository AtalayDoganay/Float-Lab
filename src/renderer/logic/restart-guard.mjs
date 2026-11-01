// Rosie guards Restart (brief §15), as a pure state machine with an injected
// clock. The dialog opens guarded; a tickle consumes the click and, once she
// has visibly cleared the button, opens a five-second window in which a
// separate activation restarts; `now() < deadline` is checked on the
// activation itself. A timeout re-guards and changes her line; losing focus
// re-locks without counting a timeout; nothing ever resets by itself.

export const UNLOCK_MS = 5000;
export const HINT = 'Tickle Rosie to reveal Restart.';

export const GUARD_LINES = Object.freeze({
  initial: 'Hold on! You’ve already made progress. Are you sure you want to start your training over?',
  'initial-after': 'Hehe, that tickles! Five seconds: your call.',
  finished: 'Finished already and coming back for another run? I like your enthusiasm!',
  'finished-after': 'Round two! Five seconds, go!',
  again: (date) => `Back at the beginning again? Your last training activity was ${date}. Want a fresh run, or shall we continue?`,
  'again-after': 'Fresh start, fresh notebook. You’ve got five seconds!',
  'timeout-1': 'Hey—are you really sure? I can still take you back to where you left off.',
  'timeout-1-after': 'Hehe! Okay, five seconds. Your call!',
  'timeout-2': 'Another tickle? I think you’ve discovered my weakness, not the Restart button.',
  'timeout-2-after': 'All right, all right—button’s clear!',
});

export function createRestartGuard({ now, unlockMs = UNLOCK_MS, completed = false, restarts = { count: 0, lastAt: null }, lastActivityAt = null } = {}) {
  let phase = 'closed';
  let deadline = null;
  let timeouts = 0;
  let line = { id: 'initial', text: GUARD_LINES.initial };
  let lastTimeoutId = null;

  const text = (id) => {
    const t = GUARD_LINES[id];
    if (typeof t !== 'function') return t;
    const when = lastActivityAt || (restarts && restarts.lastAt);
    return t(when ? new Date(when).toLocaleString() : 'not recorded');
  };
  const setLine = (id) => { line = { id, text: text(id) }; };

  function openingLine() {
    if (completed) return 'finished';
    if (restarts && restarts.count > 0) return 'again';
    return 'initial';
  }

  function open() {
    phase = 'guarded';
    deadline = null;
    timeouts = 0;
    lastTimeoutId = null;
    setLine(openingLine());
  }

  function tickle() {
    if (phase !== 'guarded') return false;
    phase = 'tickling';
    const base = line.id.replace(/-after$/, '');
    setLine(`${base}-after`);
    return true;
  }

  function cleared() {
    if (phase !== 'tickling') return;
    phase = 'unlocked';
    deadline = now() + unlockMs;
  }

  function activate() {
    if (phase === 'unlocked') {
      if (now() < deadline) { phase = 'done'; return { ok: true }; }
      return { ok: false, reason: 'expired' };
    }
    return { ok: false, reason: phase };
  }

  function tick() {
    if (phase !== 'unlocked' || now() < deadline) return;
    phase = 'guarded';
    deadline = null;
    timeouts += 1;
    let id = timeouts === 1 ? 'timeout-1' : 'timeout-2';
    if (id === lastTimeoutId) id = id === 'timeout-2' ? 'timeout-1' : 'timeout-2';
    lastTimeoutId = id;
    setLine(id);
  }

  function blur() {
    if (phase === 'unlocked' || phase === 'tickling') { phase = 'guarded'; deadline = null; }
  }

  function close() {
    phase = 'closed';
    deadline = null;
  }

  function state() {
    return { phase, deadline, remainingMs: phase === 'unlocked' ? Math.max(0, deadline - now()) : 0, timeouts, line: { ...line }, hint: HINT };
  }

  return { open, tickle, cleared, activate, tick, blur, close, state };
}

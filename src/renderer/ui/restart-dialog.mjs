// The guarded restart dialog (brief §15). It is shown non-modally with its
// own backdrop (the app's render makes the page behind it inert for as long
// as it is open), so Rosie's layer can stand over the Restart button; an
// invisible, focusable "Rosie" hit target lies over the button while she
// guards it, so a click or Enter on her tickles her and never reaches
// Restart. The countdown is drawn from the guard's clock; the logic, not the
// display, decides whether an activation counts.
import { el, replace } from './dom.mjs';

export function mountRestartDialog({ dispatch }) {
  const dialog = document.getElementById('restart-dialog');
  const backdrop = document.getElementById('guard-backdrop');
  let timer = 0;
  let lastKey = '';
  let returnFocus = null;

  dialog.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.preventDefault(); dispatch({ type: 'restart-cancel' }); } });
  window.addEventListener('blur', () => { if (dialog.open) dispatch({ type: 'guard-blur' }); });
  document.addEventListener('visibilitychange', () => { if (dialog.open && document.visibilityState === 'hidden') dispatch({ type: 'guard-blur' }); });

  const countdownText = (ms) => `${Math.max(1, Math.ceil(ms / 1000))} s`;

  function build(state) {
    const g = state.guard;
    const simple = state.guardSimple;
    const unlocked = g && g.phase === 'unlocked';
    const guarded = !simple && g && (g.phase === 'guarded' || g.phase === 'tickling');
    const restartButton = el('button', {
      type: 'button', class: 'btn btn-primary', 'data-fid': 'restart-go', 'data-control': 'restart-training', 'data-target': 'restart-training',
      disabled: !(simple || unlocked), text: 'Restart training', onclick: () => dispatch({ type: 'guard-activate' }),
    });
    const countdown = el('span', { class: 'countdown', 'data-ref': 'countdown', 'aria-live': 'polite', text: unlocked ? countdownText(g.remainingMs) : '' });
    const hit = guarded ? el('button', {
      type: 'button', class: 'rosie-hit', 'data-fid': 'tickle', 'aria-label': 'Rosie. Tickle her to reveal Restart',
      onclick: (e) => { e.stopPropagation(); dispatch({ type: 'guard-tickle' }); },
    }) : null;
    return el('div', { class: 'dialog-body guard-body' },
      el('h2', { id: 'restart-title', text: 'Start your training over?' }),
      el('p', { class: 'lede', 'data-ref': 'guard-line', text: simple ? 'Restart training resets the active run and begins the first lesson again. The run you have now is kept as a recoverable snapshot beside your progress file.' : g.line.text }),
      el('div', { class: 'guard-zone' }, restartButton, countdown, hit),
      simple ? null : el('p', { class: 'muted guard-hint', 'data-ref': 'guard-hint', text: g.hint }),
      el('div', { class: 'dialog-actions' },
        el('button', { type: 'button', class: 'btn', 'data-fid': 'cancel', text: 'Cancel', onclick: () => dispatch({ type: 'restart-cancel' }) }),
        simple ? null : el('button', { type: 'button', class: 'btn', 'data-fid': 'simple', text: 'Use simple confirmation', onclick: () => dispatch({ type: 'guard-simple' }) }),
        el('button', { type: 'button', class: 'btn', 'data-fid': 'continue', text: 'Continue training', onclick: () => dispatch({ type: 'continue-training' }) })));
  }

  function update(state) {
    const open = Boolean(state.dialogs.restart && (state.guard || state.guardSimple));
    if (!open) {
      if (dialog.open) { dialog.close(); backdrop.hidden = true; if (returnFocus && returnFocus.focus) returnFocus.focus({ preventScroll: true }); returnFocus = null; }
      if (timer) { clearInterval(timer); timer = 0; }
      lastKey = '';
      return;
    }
    const g = state.guard;
    const key = [state.guardSimple, g && g.phase, g && g.line.id, g && g.timeouts].join('|');
    if (!dialog.open) {
      returnFocus = document.activeElement;
      backdrop.hidden = false;
      dialog.show();
    }
    if (key !== lastKey) {
      lastKey = key;
      replace(dialog, build(state));
      const focus = g && g.phase === 'unlocked' ? '[data-fid="restart-go"]' : (g && g.phase === 'guarded' && !state.guardSimple ? '[data-fid="tickle"]' : '[data-fid="continue"]');
      dialog.querySelector(focus)?.focus({ preventScroll: true });
    } else if (g && g.phase === 'unlocked') {
      const c = dialog.querySelector('[data-ref="countdown"]');
      if (c) c.textContent = countdownText(g.remainingMs);
    }
    if (g && g.phase === 'unlocked' && !timer) timer = setInterval(() => dispatch({ type: 'guard-tick' }), 200);
    if (!(g && g.phase === 'unlocked') && timer) { clearInterval(timer); timer = 0; }
  }

  return { update };
}

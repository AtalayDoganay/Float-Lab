// The demonstration runner (brief §7, §9): an in-app cursor that glides to a
// control resolved from its identity and current bounds, then performs the
// same thing a learner's mouse would: the real element's click, real pointer
// events on an Edit View pane, a typed time in the real field, a menu opened
// through the menu bar. Nothing is set behind the scenes; a missing or
// disabled control stalls the cue instead of clicking blindly.
import { SHOW_SECONDS, DIGITAL_CHANNELS } from '../logic/simulation.mjs';

const GLIDE_MS = 420;
const DIGITAL_ROW_TOP = 14; // the Edit View's digital rows (edit-view.mjs)
const DIGITAL_ROW_H = 12;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export class StallError extends Error {
  constructor(what) { super(`waiting for ${what}`); this.what = what; }
}

export function mountCinema({ findControl, pcmacs, dispatch, onTarget = () => {} }) {
  const cursor = document.getElementById('demo-cursor');
  let moves = 0;
  let generation = 0;

  const rectOf = (node) => {
    if (!node) return null;
    const r = node.getBoundingClientRect();
    return r.width > 0 && r.height > 0 ? { x: r.left, y: r.top, w: r.width, h: r.height } : null;
  };

  function resolve(id) {
    if (id.startsWith('menu-item:')) return pcmacs.menuItemElement(id.slice('menu-item:'.length));
    return findControl(id);
  }

  async function glideTo(x, y, ms = GLIDE_MS) {
    cursor.hidden = false;
    cursor.style.transition = `transform ${ms}ms cubic-bezier(.2, .7, .2, 1)`;
    cursor.style.transform = `translate3d(${x.toFixed(0)}px, ${y.toFixed(0)}px, 0)`;
    moves += 1;
    await wait(ms + 40);
  }

  const centre = (r) => [r.x + r.w / 2, r.y + r.h / 2];

  // Every glide is a chance for the film to have been skipped, replayed or left:
  // `alive` is checked before each side effect, so a cancelled cue performs nothing.
  async function pointer(id, alive) {
    const node = resolve(id);
    const r = rectOf(node);
    if (!r) throw new StallError(id);
    onTarget(id);
    await glideTo(...centre(r));
    alive();
    await wait(250);
  }

  async function click(id, alive) {
    const node = resolve(id);
    const r = rectOf(node);
    if (!r || node.disabled) throw new StallError(id);
    onTarget(id);
    await glideTo(...centre(r));
    alive();
    cursor.classList.add('is-pressed');
    await wait(90);
    alive();
    node.click();
    cursor.classList.remove('is-pressed');
    await wait(160);
  }

  async function type(id, text, alive) {
    const node = resolve(id);
    const r = rectOf(node);
    if (!r || node.disabled) throw new StallError(id);
    onTarget(id);
    await glideTo(...centre(r));
    alive();
    node.focus({ preventScroll: true });
    node.value = text;
    node.dispatchEvent(new Event('change', { bubbles: true }));
    await wait(160);
  }

  // Real pointer events on an Edit View pane, between two times in seconds,
  // with the left button (select) or the right one (draw).
  async function drag({ pane, channel, fromSec, toSec, button = 0 }, alive) {
    const plot = document.querySelector(pane === 'analog' ? '.ev-analog' : '.ev-digital');
    if (!plot || plot.hidden) throw new StallError(`${pane} pane`);
    onTarget(pane === 'analog' ? 'analog-pane' : 'digital-pane');
    const r = plot.getBoundingClientRect();
    const x = (s) => r.left + (s / SHOW_SECONDS) * r.width;
    const row = Math.max(0, DIGITAL_CHANNELS.findIndex((c) => c.id === channel));
    const y = pane === 'analog' ? r.top + r.height / 2 : r.top + DIGITAL_ROW_TOP + row * DIGITAL_ROW_H;
    const buttons = button === 2 ? 2 : 1;
    const opts = (cx, b) => ({ bubbles: true, cancelable: true, pointerId: 11, button, buttons: b, clientX: cx, clientY: y, pointerType: 'mouse' });
    await glideTo(x(fromSec), y);
    alive();
    cursor.classList.add('is-pressed');
    plot.dispatchEvent(new PointerEvent('pointerdown', opts(x(fromSec), buttons)));
    const steps = 8;
    const release = (cx) => { plot.dispatchEvent(new PointerEvent('pointerup', opts(cx, 0))); cursor.classList.remove('is-pressed'); };
    for (let i = 1; i <= steps; i += 1) {
      const s = fromSec + ((toSec - fromSec) * i) / steps;
      plot.dispatchEvent(new PointerEvent('pointermove', opts(x(s), buttons)));
      await glideTo(x(s), y, 55);
      // A drag cut short still lets the button go, so the pane is not left mid-gesture.
      try { alive(); } catch (error) { release(x(s)); throw error; }
    }
    release(x(toSec));
    await wait(140);
  }

  async function menu(id, alive) {
    if (!id) { pcmacs.closeMenus(); await wait(120); return; }
    await click(`menu-${id}`, alive);
    await wait(200);
  }

  let current = null; // the cue being performed, for the harness

  async function perform(cue) {
    const gen = generation;
    const alive = () => { if (gen !== generation) throw new StallError('cancelled'); };
    current = { click: cue.click || null, pointer: cue.pointer || null, drag: Boolean(cue.drag), menu: 'menu' in cue ? cue.menu : null };
    try {
      if (cue.pointer) await pointer(cue.pointer, alive);
      else if (cue.click) await click(cue.click, alive);
      else if (cue.drag) await drag(cue.drag, alive);
      else if (cue.type) await type(cue.type, cue.text, alive);
      else if ('menu' in cue) await menu(cue.menu, alive);
      else if (cue.dispatch) dispatch(cue.dispatch);
      else if (Number.isInteger(cue.wait)) await wait(cue.wait);
      alive();
    } finally {
      current = null;
    }
  }

  function hideCursor() {
    generation += 1;
    cursor.classList.remove('is-pressed');
    cursor.hidden = true;
  }

  return { perform, hideCursor, debug: () => ({ moves, visible: !cursor.hidden, current }) };
}

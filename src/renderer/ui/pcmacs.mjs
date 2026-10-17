// The recreated PC•MACs application area: the menu bar (with Time Out / Time
// In / Values Out / Values In, which appear while the Edit View is active,
// manual p. 76), its drop-down menus, the Edit View shortcut menu, the
// "Set to value (0 - 255):" dialog (p. 178), and the grey window area that
// holds the Edit View, Control Window, Soft Console, and Terminal.
//
// The trainer's own words never appear inside these windows. Notes about what
// is simulated go to the trainer strip under the frame.
import { el, replace } from './dom.mjs';
import { MENUS, SHORTCUTS, shortcutMenu } from '../content/pcmacs-menus.mjs';
import { mountEditView } from './edit-view.mjs';
import { mountControlWindow } from './control-window.mjs';
import { mountSoftConsole } from './soft-console.mjs';

function keyName(e) {
  const parts = [];
  if (e.ctrlKey) parts.push('Ctrl');
  if (e.altKey) parts.push('Alt');
  if (e.shiftKey) parts.push('Shift');
  const k = e.key.length === 1 ? e.key.toUpperCase() : e.key;
  parts.push(k);
  return parts.join('+');
}

export function mountPcmacs(container, { dispatch, terminalHost }) {
  let state = null;
  let openMenu = null; // { id, anchor } or { context: true, x, y, frame }
  let shown = []; // [{ it, b }] for the open menu, refreshed in place

  const popup = el('div', { class: 'pc-menu', role: 'menu', hidden: true });
  const menubar = el('div', { class: 'pc-menubar', role: 'menubar', 'aria-label': 'PC•MACs menu bar' }, ...MENUS.map((m) => {
    const b = el('button', { type: 'button', class: `pc-menu-title${m.gap ? ' gap' : ''}`, role: 'menuitem', 'data-menu': m.id, 'data-control': m.control || `menu-${m.id}`, 'aria-haspopup': m.items ? 'menu' : null, 'aria-expanded': m.items ? 'false' : null, text: m.label });
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      if (m.action) { close(); dispatch(m.action); return; }
      if (!m.items) { close(); dispatch({ type: 'pc-note', text: `${m.label} is a vertical zoom on the Edit View (manual p. 77). It is not simulated; the analog pane always shows 0–100%.` }); return; }
      if (openMenu && openMenu.id === m.id) close(); else open({ id: m.id, anchor: b });
    });
    b.addEventListener('mouseenter', () => { if (openMenu && openMenu.id && openMenu.id !== m.id && m.items) open({ id: m.id, anchor: b }); });
    return b;
  }));

  function menuItems(items) {
    shown = [];
    return items.map((it) => {
      if (it.sep) return el('div', { class: 'pc-sep', role: 'separator' });
      const b = el('button', { type: 'button', class: 'pc-item', role: it.checked ? 'menuitemcheckbox' : 'menuitem', 'data-control': it.control || null },
        el('span', { class: 'chk', 'aria-hidden': 'true' }), el('span', { class: 'lbl', text: it.label }), el('span', { class: 'key', text: it.key }), el('span', { class: 'sub', text: it.sub ? '▸' : '' }));
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        close();
        if (it.action) dispatch(it.action);
        else dispatch({ type: 'pc-note', text: `“${it.label}” is part of the real PC•MACs menu, shown as the manual photographs it. It is not simulated in this trainer.` });
      });
      shown.push({ it, b });
      return b;
    });
  }

  // Greyed and checked states follow the simulation. Updated in place so an
  // open menu keeps its elements, its focus, and its clicks during playback.
  function refreshItems() {
    const sim = state.sim;
    for (const { it, b } of shown) {
      const enabled = !it.greyed && (!it.enabled || it.enabled(sim));
      const checked = it.checked ? Boolean(it.checked(sim)) : false;
      b.disabled = !enabled;
      b.classList.toggle('checked', checked);
      if (it.checked) b.setAttribute('aria-checked', String(checked));
    }
  }

  function open(target) {
    openMenu = target;
    renderMenu();
    popup.querySelector('.pc-item:not(:disabled)')?.focus({ preventScroll: true });
  }

  function close() {
    if (!openMenu) return;
    const anchor = openMenu.anchor;
    openMenu = null;
    shown = [];
    popup.hidden = true;
    for (const b of menubar.children) { b.classList.remove('open'); if (b.hasAttribute('aria-expanded')) b.setAttribute('aria-expanded', 'false'); }
    if (anchor && popup.contains(document.activeElement)) anchor.focus({ preventScroll: true });
  }

  function renderMenu() {
    if (!openMenu || !state) return;
    const frameRect = container.getBoundingClientRect();
    let items;
    let x;
    let y;
    if (openMenu.context) {
      items = shortcutMenu(state.sim, openMenu.frame);
      x = openMenu.x - frameRect.left;
      y = openMenu.y - frameRect.top;
    } else {
      const m = MENUS.find((mm) => mm.id === openMenu.id);
      items = m.items;
      const r = openMenu.anchor.getBoundingClientRect();
      x = r.left - frameRect.left;
      y = r.bottom - frameRect.top;
      for (const b of menubar.children) {
        b.classList.toggle('open', b === openMenu.anchor);
        if (b.hasAttribute('aria-expanded')) b.setAttribute('aria-expanded', String(b === openMenu.anchor));
      }
    }
    replace(popup, ...menuItems(items));
    refreshItems();
    popup.hidden = false;
    popup.style.left = `${Math.max(0, Math.min(x, frameRect.width - popup.offsetWidth - 4))}px`;
    popup.style.top = `${y}px`;
  }

  document.addEventListener('click', (e) => { if (openMenu && !popup.contains(e.target)) close(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && openMenu) { e.preventDefault(); close(); return; }
    const active = document.activeElement;
    // Shortcuts never steal keys from fields, sliders, an open menu, or the terminal text.
    if (!container.contains(active) || active.matches('input, select, textarea') || popup.contains(active) || active.closest('.term-screen')) return;
    const action = SHORTCUTS[keyName(e)];
    if (action) { e.preventDefault(); dispatch(action); }
  });
  popup.addEventListener('keydown', (e) => {
    if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && openMenu && openMenu.id) {
      e.preventDefault();
      const titles = MENUS.filter((m) => m.items).map((m) => menubar.querySelector(`[data-menu="${m.id}"]`));
      const i = titles.indexOf(openMenu.anchor);
      const next = titles[(i + (e.key === 'ArrowRight' ? 1 : titles.length - 1)) % titles.length];
      open({ id: next.dataset.menu, anchor: next });
      return;
    }
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const items = [...popup.querySelectorAll('.pc-item:not(:disabled)')];
    const i = items.indexOf(document.activeElement);
    items[(i + (e.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length]?.focus();
  });
  // Tabbing out of an open menu closes it.
  popup.addEventListener('focusout', (e) => { if (openMenu && !popup.contains(e.relatedTarget)) close(); });

  // ---------- window area ----------
  const editHost = el('div', { class: 'pc-edit-host' });
  const lower = el('div', { class: 'pc-lower' });
  const mdi = el('div', { class: 'pc-mdi' }, editHost, lower);
  const note = el('div', { class: 'pc-note', role: 'status', 'aria-live': 'polite' });
  const frame = el('div', { class: 'pc-frame', 'data-part': 'title' }, menubar, mdi, popup);
  replace(container, frame, note);

  const ui = {
    edit: mountEditView(editHost, { dispatch, onContextMenu: (x, y, f) => open({ context: true, x, y, frame: f }) }),
    control: mountControlWindow(lower, { dispatch }),
    console: mountSoftConsole(lower, { dispatch }),
  };
  lower.append(terminalHost);

  // ---------- Set to value (0 - 255): ----------
  const dialog = document.getElementById('value-dialog');
  let format = 'dec';
  const valueInput = el('input', { type: 'text', class: 'field', 'aria-label': 'Value', spellcheck: 'false' });
  const vslider = el('input', { type: 'range', class: 'w7range vertical', min: 0, max: 255, step: 1, 'aria-label': 'Value slider', oninput: (e) => { valueInput.value = show(Number(e.target.value)); } });
  const show = (v) => (format === 'hex' ? v.toString(16).toUpperCase() : format === 'pct' ? `${Math.round((v / 255) * 100)}%` : String(v));
  const parse = (text) => {
    const t = String(text).trim().replace('%', '');
    if (format === 'hex') return /^[0-9a-f]{1,2}$/i.test(t) ? parseInt(t, 16) : null;
    if (!/^\d{1,3}(\.\d+)?$/.test(t)) return null;
    const n = Number(t);
    if (format === 'pct') return n <= 100 ? Math.round((n / 100) * 255) : null;
    return Number.isInteger(n) && n <= 255 ? n : null;
  };
  const radio = (value, label) => el('label', { class: 'w7check' }, el('input', { type: 'radio', name: 'value-format', value, checked: value === format,
    onchange: () => { const v = parse(valueInput.value) ?? Number(vslider.value); format = value; valueInput.value = show(v); } }), label);
  const commit = () => {
    const v = parse(valueInput.value);
    if (v === null) { valueInput.setAttribute('aria-invalid', 'true'); valueInput.focus(); return; }
    dialog.close();
    dispatch({ type: 'set-analog-value', value: v });
  };
  valueInput.addEventListener('input', () => { valueInput.removeAttribute('aria-invalid'); const v = parse(valueInput.value); if (v !== null) vslider.value = String(v); });
  valueInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); commit(); } });
  replace(dialog,
    el('div', { class: 'w8-title' }, el('span', { id: 'value-title', text: 'Set to value (0 - 255):' }), el('button', { type: 'button', class: 'w8-close', 'aria-label': 'Close', onclick: () => dialog.close() })),
    el('div', { class: 'w8-body' },
      el('div', { class: 'vd-main' }, valueInput, radio('hex', 'Hexadecimal'), radio('dec', 'Decimal'), radio('pct', 'Percentage'),
        el('div', { class: 'vd-buttons' }, el('button', { type: 'button', class: 'w7btn', text: 'OK', onclick: commit }), el('button', { type: 'button', class: 'w7btn', text: 'Cancel', onclick: () => dialog.close() }))),
      vslider));

  function openValueDialog() {
    const sim = state.sim;
    const axis = sim.selection.channels.find((id) => id.startsWith('axis-'));
    const v = axis ? sim.analogs[Number(axis.slice(5))][sim.selection.from] : 0;
    vslider.value = String(v);
    valueInput.value = show(v);
    valueInput.removeAttribute('aria-invalid');
    if (!dialog.open) dialog.showModal();
    valueInput.select();
  }

  function update(s, revealed) {
    state = s;
    // The frame appears as soon as any recreated window is in use.
    frame.hidden = !(['title', 'ruler', 'analog', 'digital', 'transport', 'command', 'terminal'].some((p) => revealed.includes(p)) || Object.values(s.sim.windows).some(Boolean));
    ui.edit.update(s, revealed);
    ui.control.update(s, revealed);
    ui.console.update(s, revealed);
    note.textContent = s.sim.note;
    note.hidden = frame.hidden || !s.sim.note;
    if (openMenu) refreshItems();
  }

  return { update, openValueDialog, closeMenus: close };
}

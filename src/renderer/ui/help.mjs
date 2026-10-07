// Contextual help: a tooltip on hover or keyboard focus of any [data-control]
// element, and a full help dialog on "?" click or F1. Opening help never
// touches practice state; closing returns focus to where it was.
import { CONTROLS } from '../content/controls.mjs';
import { MANUAL_CITATIONS, IMAGE_DIR, REFERENCE_IMAGES } from '../content/references.mjs';
import { HANDBOOK_BY_ID } from '../content/handbook.mjs';
import { el, replace, evidenceChip } from './dom.mjs';

const SECTIONS = [
  ['purpose', 'What it is for'],
  ['when', 'When to use it'],
  ['example', 'Example'],
  ['mistakes', 'Common mistakes'],
  ['expected', 'Expected result'],
  ['effect', 'What it changes in the software'],
];

export function mountHelp({ onOpenEntry, onOpenPhoto }) {
  const tooltip = document.getElementById('tooltip');
  const dialog = document.getElementById('help-dialog');
  let lastControl = null;
  let returnFocus = null;

  function controlFromEvent(event) {
    const target = event.target instanceof Element ? event.target.closest('[data-control]') : null;
    return target ? { element: target, id: target.dataset.control } : null;
  }

  function showTooltip(id, anchor) {
    const c = CONTROLS[id];
    if (!c) return;
    replace(
      tooltip,
      el('strong', { text: c.name }),
      c.short,
      el('small', { text: 'Click ? or press F1 for the full explanation.' }),
    );
    tooltip.hidden = false;
    const rect = anchor.getBoundingClientRect();
    const tipRect = tooltip.getBoundingClientRect();
    let left = Math.min(rect.left, window.innerWidth - tipRect.width - 8);
    let top = rect.bottom + 8;
    if (top + tipRect.height > window.innerHeight - 8) top = Math.max(8, rect.top - tipRect.height - 8);
    tooltip.style.left = `${Math.max(8, left)}px`;
    tooltip.style.top = `${top}px`;
  }

  function hideTooltip() {
    tooltip.hidden = true;
  }

  document.addEventListener('mouseover', (event) => {
    const found = controlFromEvent(event);
    if (!found) return hideTooltip();
    lastControl = found.id;
    showTooltip(found.id, found.element);
  });
  document.addEventListener('mouseout', (event) => {
    if (controlFromEvent(event)) hideTooltip();
  });
  document.addEventListener('focusin', (event) => {
    const found = controlFromEvent(event);
    if (!found) return;
    lastControl = found.id;
    showTooltip(found.id, found.element);
  });
  document.addEventListener('focusout', () => hideTooltip());
  // Focusing a control can scroll it into view; keep the tooltip attached
  // rather than hiding it on that scroll.
  document.addEventListener('scroll', () => {
    if (tooltip.hidden) return;
    const active = document.activeElement instanceof Element ? document.activeElement.closest('[data-control]') : null;
    if (active && active.dataset.control === lastControl) showTooltip(lastControl, active);
  }, true);

  document.addEventListener('click', (event) => {
    const btn = event.target instanceof Element ? event.target.closest('[data-help-for]') : null;
    if (btn) {
      event.preventDefault();
      open(btn.dataset.helpFor);
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'F1') {
      event.preventDefault();
      const active = document.activeElement instanceof Element ? document.activeElement.closest('[data-control]') : null;
      const id = active ? active.dataset.control : lastControl;
      if (id) open(id);
    }
    if (event.key === 'Escape') hideTooltip();
  });

  document.getElementById('help-current').addEventListener('click', () => {
    if (lastControl) open(lastControl);
    else open('help-button');
  });

  function citation(key) {
    const c = MANUAL_CITATIONS[key];
    if (!c) return null;
    return el('p', { class: 'cite' },
      el('strong', { text: `${c.manual}, ${c.edition}, pages ${c.pages}` }),
      ` (${c.status === 'read-locally' ? 'read locally for this app' : 'not read'}). `,
      c.claim,
    );
  }

  function imageThumb(file) {
    const meta = REFERENCE_IMAGES.find((i) => i.file === file);
    return el('button', {
      type: 'button',
      title: meta ? meta.caption : file,
      onclick: () => onOpenPhoto(file),
    }, el('img', { src: `${IMAGE_DIR}${file}`, alt: meta ? meta.caption : file, loading: 'lazy' }));
  }

  function relatedButton(id) {
    const entry = HANDBOOK_BY_ID.get(id);
    if (!entry) return null;
    return el('button', { type: 'button', text: entry.title, onclick: () => { close(); onOpenEntry(id); } });
  }

  function open(id) {
    const c = CONTROLS[id];
    if (!c) return;
    hideTooltip();
    returnFocus = document.activeElement;
    const body = el('div', { class: 'dialog-body' },
      el('h2', { id: 'help-title', text: c.name }),
      el('p', { class: 'lede' }, c.short, ' ', evidenceChip(c.evidence)),
      ...SECTIONS.map(([key, label]) => [el('h3', { text: label }), el('p', { text: c[key] })]),
      el('h3', {}, 'Possible implications for a connected mechanism ', evidenceChip(c.mechanism.evidence)),
      el('p', { text: c.mechanism.text }),
      c.related.length ? el('h3', { text: 'Related' }) : null,
      c.related.length ? el('div', { class: 'related' }, ...c.related.map(relatedButton)) : null,
      c.images.length ? el('h3', { text: 'Reference photos' }) : null,
      c.images.length ? el('div', { class: 'thumbs' }, ...c.images.map(imageThumb)) : null,
      ...c.cites.map(citation),
      el('div', { class: 'dialog-actions' },
        el('button', { type: 'button', class: 'btn btn-primary', text: 'Close', onclick: close }),
      ),
    );
    replace(dialog, body);
    if (!dialog.open) dialog.showModal();
    dialog.querySelector('.btn-primary').focus();
  }

  function close() {
    if (dialog.open) dialog.close();
    if (returnFocus && typeof returnFocus.focus === 'function') returnFocus.focus();
    returnFocus = null;
  }

  dialog.addEventListener('cancel', (event) => { event.preventDefault(); close(); });
  dialog.addEventListener('click', (event) => { if (event.target === dialog) close(); });

  return { open, close, isOpen: () => dialog.open };
}

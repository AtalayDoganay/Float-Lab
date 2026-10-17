// Window chrome for the recreated PC•MACs windows. The manual's screenshots
// (January 13, 2021 edition) and the team's photos all show Windows 7 Basic
// frames: a pale blue title bar, the title text, and minimise / maximise /
// close boxes. The boxes are drawn, not wired: the trainer opens and closes
// windows through the lessons and the RealTime menu instead.
import { el } from './dom.mjs';

const SVG_NS = 'http://www.w3.org/2000/svg';

export function svg(tag, attrs = {}) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v !== null && v !== undefined) node.setAttribute(k, String(v));
  return node;
}

export function win({ title, part, cls = '', label, align = 'left', extra = [] }) {
  const body = el('div', { class: 'win-body' });
  const root = el('section', { class: `win ${cls}`.trim(), 'data-part': part, 'aria-label': label || title },
    el('div', { class: `win-title ${align}` },
      el('span', { class: 'win-icon', 'aria-hidden': 'true' }),
      el('span', { class: 'win-title-text', text: title }),
      ...extra,
      el('span', { class: 'win-ctl', 'aria-hidden': 'true' }, el('span', { class: 'min' }), el('span', { class: 'max' }), el('span', { class: 'close' }))),
    body);
  return { root, body };
}

// A classic Windows push button with an underlined access letter, as on the
// GilderTerm toolbar (manual p. 209).
export function accessLabel(text, letterIndex) {
  if (letterIndex === null || letterIndex === undefined) return [text];
  return [text.slice(0, letterIndex), el('u', { text: text.charAt(letterIndex) }), text.slice(letterIndex + 1)];
}

// The small clock-face button beside every PC•MACs time field (manual p. 85).
export function clockFace() {
  return el('span', { class: 'clock-face', 'aria-hidden': 'true' });
}

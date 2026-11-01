// Rosie's help during practice (brief §7): the label "Click mascot to get
// help" above her, and the popover with her two choices: a visible
// demonstration on the real controls, or a typed question answered from the
// lesson's own knowledge, with a few suggested questions. Escape closes and
// focus returns to the label. The label and popover are the only parts of
// the guide layer that take the pointer.
import { el, replace } from './dom.mjs';

export function mountRosieHelp({ dispatch }) {
  const label = document.getElementById('rosie-help');
  const pop = document.getElementById('rosie-help-pop');
  let lastKey = '';

  label.addEventListener('click', () => dispatch({ type: 'help-open-menu' }));
  pop.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.preventDefault(); dispatch({ type: 'help-close' }); } });

  function build(help) {
    const nodes = [el('p', { class: 'help-hint', 'data-ref': 'help-hint', text: help.hint || '' })];
    if (help.mode === 'menu') {
      nodes.push(
        el('button', { type: 'button', class: 'btn btn-primary', 'data-fid': 'help-show', text: 'Do you want me to show you how this is done?', onclick: () => dispatch({ type: 'help-show-me' }) }),
        el('button', { type: 'button', class: 'btn', 'data-fid': 'help-ask', text: 'Do you have a different question?', onclick: () => dispatch({ type: 'help-ask' }) }));
    } else {
      const input = el('input', { type: 'text', class: 'help-input', 'data-fid': 'help-input', placeholder: 'Type your question', 'aria-label': 'Your question', value: help.question || '', spellcheck: 'false' });
      const ask = () => { if (input.value.trim()) dispatch({ type: 'help-question', text: input.value.trim() }); };
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); ask(); } });
      nodes.push(
        el('div', { class: 'help-ask-row' }, input, el('button', { type: 'button', class: 'btn btn-small btn-primary', 'data-fid': 'help-send', text: 'Ask', onclick: ask })),
        el('div', { class: 'help-suggest' }, ...(help.suggestions || []).map((q) => el('button', { type: 'button', class: 'chip', 'data-fid': 'help-suggest', text: q, onclick: () => dispatch({ type: 'help-question', text: q }) }))));
      if (help.answer) {
        nodes.push(el('p', { class: `help-answer kind-${help.answer.kind}`, 'data-ref': 'help-answer', text: help.answer.text }));
        if (help.answer.showMe) nodes.push(el('button', { type: 'button', class: 'btn btn-small', 'data-fid': 'help-show', text: 'Show me', onclick: () => dispatch({ type: 'help-show-me' }) }));
      }
    }
    nodes.push(el('div', { class: 'help-foot' },
      help.mode === 'ask' ? el('button', { type: 'button', class: 'link-btn', 'data-fid': 'help-back', text: 'Back', onclick: () => dispatch({ type: 'help-back' }) }) : null,
      el('button', { type: 'button', class: 'link-btn', 'data-fid': 'help-close', text: 'Close', onclick: () => dispatch({ type: 'help-close' }) })));
    return nodes;
  }

  // Keep the popover beside the label, inside the window.
  function place() {
    if (pop.hidden || label.hidden) return;
    const r = label.getBoundingClientRect();
    const w = pop.offsetWidth || 340;
    const h = pop.offsetHeight || 200;
    let x = r.left + r.width / 2 - w / 2;
    let y = r.bottom + 8;
    if (y + h > window.innerHeight - 8) y = Math.max(8, r.top - h - 8);
    x = Math.min(Math.max(8, x), window.innerWidth - w - 8);
    pop.style.transform = `translate3d(${x.toFixed(0)}px, ${y.toFixed(0)}px, 0)`;
  }

  function update(state) {
    const help = state.help;
    const open = Boolean(help && help.open);
    if (!open) { pop.hidden = true; lastKey = ''; return; }
    const key = [help.mode, help.question, help.answer && help.answer.text, help.hint].join('\u0001');
    if (key !== lastKey) {
      lastKey = key;
      replace(pop, ...build(help));
      pop.hidden = false;
      place();
      (pop.querySelector(help.mode === 'ask' ? '[data-fid="help-input"]' : '[data-fid="help-show"]'))?.focus({ preventScroll: true });
    }
    place();
  }

  return { update, place };
}

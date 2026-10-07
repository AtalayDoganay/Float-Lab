// The photographed "Terminal - COM3" dialog (GilderTerm) with the Br-EFB v1.98
// configuration menus transcribed from the photos. Menu lines are clickable;
// typed keys go through the same simulated logic.
import { el, replace, helpButton } from './dom.mjs';
import {
  BREFB_HEADER, BREFB_MAIN_SNAPSHOT, BREFB_FEEDBACK_SNAPSHOT, BREFB_NETWORK_SNAPSHOT, PROMPTS,
} from '../content/references.mjs';

const pad = (s, n) => String(s).padEnd(n);
const center = (s, n) => {
  const str = String(s);
  const left = Math.max(0, Math.floor((n - str.length) / 2));
  return (' '.repeat(left) + str).padEnd(n);
};

function headerLines(t) {
  return [
    BREFB_HEADER.line1,
    `     Uptime: 0:00:19:41, Serial Address: ${BREFB_HEADER.serialAddress}, IP Address: ${BREFB_HEADER.ipAddress}`,
    `                              ${BREFB_HEADER.status}`,
    '',
  ].map((text) => ({ text, key: null }));
}

function mainScreen(t) {
  const s = BREFB_MAIN_SNAPSHOT;
  const left = [
    ...s.settings.map(([k, label, value]) => ({ key: k, text: `${k}) ${pad(label + ':', 15)}${value}` })),
    { key: null, text: '' },
    ...s.axisMenu.map(([k, label]) => ({ key: k, text: `${k}) ${label}${k === 's' ? `: ${t.axis}` : ''}` })),
  ];
  const sep = '+-------+-----+-----+-----+-----+-----+';
  const table = [
    { text: sep }, { text: '|DMX_512| Min | Max |Force|Power| Vel |' }, { text: '| Addr  |Scale|Scale| Pos | Def |Limit|' }, { text: sep },
  ];
  for (const r of s.rows) {
    table.push({ text: `|${center(`${r.dmx} (${r.axis})`, 7)}|${center(r.min, 5)}|${center(r.max, 5)}|${center(r.force, 5)}|${center(r.power, 5)}|${center(r.vel, 5)}|`, axis: r.axis });
    table.push({ text: sep });
  }
  return { left, table, footer: s.footer, leftWidth: 26 };
}

function feedbackScreen(t) {
  const s = BREFB_FEEDBACK_SNAPSHOT;
  const left = s.menu.map(([k, label]) => ({ key: k, text: `${k}) ${label}${k === 's' ? `: ${t.axis}` : ''}` }));
  const sep = '+-------+------+------+------+----+';
  const table = [
    { text: sep }, { text: '|DMX-512| Prop | Int  | Der  |Rev |' }, { text: '| Addr  | Gain | Gain | Gain |Out |' }, { text: sep },
  ];
  for (const r of s.rows) {
    table.push({ text: `|${center(`${r.dmx} (${r.axis})`, 7)}|${center(r.p, 6)}|${center(r.i, 6)}|${center(r.d, 6)}|${center(r.rev, 4)}|`, axis: r.axis });
    table.push({ text: sep });
  }
  return { left, table, footer: s.footer, leftWidth: 26 };
}

function composeTwoColumn(screen, t) {
  const lines = [];
  const { left, table, leftWidth } = screen;
  const rows = Math.max(left.length, table.length + 1);
  for (let i = 0; i < rows; i += 1) {
    const l = left[i] || { key: null, text: '' };
    const r = table[i - 1] || { text: '' };
    const arrow = r.axis === t.axis ? '->' : '  ';
    lines.push({ key: l.key, text: `${pad(l.text, leftWidth)}${arrow} ${r.text}` });
  }
  return lines;
}

function footerButtons(footer) {
  const parts = footer.split(', ');
  return el('div', { class: 'term-prompt' }, ...parts.map((part, i) => el('button', {
    type: 'button', class: 'term-line', style: 'display:inline', 'data-key': part.charAt(0), text: `${part}${i < parts.length - 1 ? ', ' : ''}`,
  })));
}

function networkLines() {
  const s = BREFB_NETWORK_SNAPSHOT;
  const lines = [{ key: null, text: s.title }, { key: null, text: '-'.repeat(s.title.length) }, { key: null, text: '' }];
  const tableRows = ['+------------+-----------------+', ...s.rows.flatMap(([k, v]) => [`|${pad(' ' + k, 12)}|${center(v, 17)}|`, '+------------+-----------------+'])];
  s.menu.forEach(([k, label], i) => {
    lines.push({ key: k, text: `${pad(`${k}) ${label}`, 24)}${tableRows[i] || ''}` });
  });
  for (let i = s.menu.length; i < tableRows.length; i += 1) lines.push({ key: null, text: `${pad('', 24)}${tableRows[i]}` });
  lines.push({ key: null, text: '' });
  return lines;
}

export function mountTerminal(container, { dispatch }) {
  const refs = {};
  refs.configBtn = el('button', { type: 'button', class: 'winbtn', 'data-control': 'term-config-done', text: 'Config Done', onclick: () => dispatch({ type: 'term-button', name: 'config' }) });
  refs.controlBtn = el('button', { type: 'button', class: 'winbtn', 'data-control': 'term-control', text: 'Control', onclick: () => dispatch({ type: 'term-button', name: 'control' }) });
  refs.screen = el('div', { class: 'term-screen', 'data-control': 'term-menu', tabindex: '0', 'aria-label': 'Simulated controller menu. Click a line or type its key below.' });
  refs.screen.addEventListener('click', (e) => {
    const line = e.target instanceof Element ? e.target.closest('[data-key]') : null;
    if (line && line.dataset.key) dispatch({ type: 'term-key', key: line.dataset.key });
  });
  refs.screen.addEventListener('keydown', (e) => {
    if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
      e.preventDefault();
      dispatch({ type: 'term-key', key: e.key });
    }
  });
  refs.input = el('input', { type: 'text', 'data-control': 'term-input', 'aria-label': 'Type a menu key or prompt answer', maxlength: '3', autocomplete: 'off' });
  const send = () => { const v = refs.input.value; refs.input.value = ''; if (v.trim()) dispatch({ type: 'term-key', key: v.trim() }); };
  refs.input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); send(); } });
  refs.promptLabel = el('span', { text: 'Type a key:' });
  refs.note = el('div', { class: 'term-note', role: 'status', 'aria-live': 'polite' });

  replace(container,
    el('div', { class: 'term-title' }, el('span', { class: 'icon' }), el('span', { text: 'Terminal - COM3' }), el('span', { class: 'spacer' }),
      el('span', { class: 'winctl', 'aria-hidden': 'true' }, el('span', { text: '—' }), el('span', { text: '☐' }), el('span', { class: 'x', text: '✕' }))),
    el('div', { class: 'term-toolbar' },
      el('label', {}, 'Card ', el('input', { type: 'text', value: '1', readonly: true, 'data-control': 'term-card', 'aria-label': 'Card address (photographed value 1)' })), helpButton('term-card'),
      el('label', {}, 'Character delay: ', el('select', { disabled: true, 'data-control': 'term-delay', 'aria-label': 'Character delay' }, el('option', { text: 'None' }))), helpButton('term-delay'),
      el('button', { type: 'button', class: 'winbtn', 'data-control': 'term-clear', text: 'Clear Screen', onclick: () => dispatch({ type: 'term-button', name: 'clear' }) }), helpButton('term-clear'),
      el('button', { type: 'button', class: 'winbtn', 'data-control': 'term-status', text: 'Status', disabled: true, 'aria-disabled': 'true' }), helpButton('term-status'),
      refs.configBtn, helpButton('term-config-done'),
      refs.controlBtn, helpButton('term-control')),
    refs.screen,
    el('div', { class: 'term-input' }, refs.promptLabel, refs.input, el('button', { type: 'button', class: 'winbtn', text: 'Send', onclick: send }), helpButton('term-input'), helpButton('term-menu')),
    refs.note,
    el('div', { class: 'term-evidence', text: 'Dialog and menu text reproduced from photos 01–10 (firmware 1.98). Toolbar meanings from the PC•MACs manual, pages 209–211. Only photographed prompts are simulated; nothing is sent anywhere.' }));

  function lineNode(line) {
    if (line.key) return el('button', { type: 'button', class: 'term-line', 'data-key': line.key, text: line.text });
    return el('div', { class: 'term-line plain', text: line.text });
  }

  function update(state) {
    const t = state.terminal;
    refs.configBtn.textContent = t.configMode ? 'Config Done' : 'Configure';
    refs.configBtn.classList.toggle('active', !t.configMode);
    refs.controlBtn.classList.toggle('active', t.controlOpen);
    refs.note.textContent = t.note;

    const nodes = [];
    if (t.cleared) {
      nodes.push(el('div', { class: 'term-line plain', text: '(screen cleared; press any menu key or click Configure to redraw)' }));
    } else if (!t.configMode) {
      nodes.push(el('div', { class: 'term-line plain', text: '(configuration mode exited; press Configure to reopen the simulated menu)' }));
    } else {
      headerLines(t).forEach((l) => nodes.push(lineNode(l)));
      if (t.screen === 'network') {
        networkLines().forEach((l) => nodes.push(lineNode(l)));
        nodes.push(el('div', { class: 'term-prompt' }, ...BREFB_NETWORK_SNAPSHOT.footer.map((f) => el('button', { type: 'button', class: 'term-line', 'data-key': f.charAt(0), text: f }))));
      } else {
        const screen = t.screen === 'feedback' ? feedbackScreen(t) : mainScreen(t);
        composeTwoColumn(screen, t).forEach((l) => nodes.push(lineNode(l)));
        nodes.push(el('div', { class: 'term-line plain', text: '' }));
        nodes.push(footerButtons(screen.footer));
      }
      if (t.prompt === 'axis') nodes.push(el('div', { class: 'term-line plain term-prompt', text: `${PROMPTS.axis.text} _` }));
      if (t.prompt === 'card') nodes.push(el('div', { class: 'term-line plain term-prompt', text: `${PROMPTS.card.text} _` }));
      if (t.prompt === 'exit') nodes.push(el('div', { class: 'term-line plain term-prompt', text: 'Exit configuration mode? (Y/N): _' }));
    }
    replace(refs.screen, ...nodes);
    refs.promptLabel.textContent = t.prompt ? 'Answer the prompt:' : 'Type a key:';
  }

  return { update };
}

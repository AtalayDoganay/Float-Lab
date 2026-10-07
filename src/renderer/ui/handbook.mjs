// Handbook panel: search box, results with excerpts, entry view with sections,
// related links, reference photos, and manual citations.
import { el, replace, helpButton, evidenceChip } from './dom.mjs';
import { HANDBOOK_ENTRIES, HANDBOOK_BY_ID } from '../content/handbook.mjs';
import { MANUAL_CITATIONS, REFERENCE_IMAGES, IMAGE_DIR } from '../content/references.mjs';

const TYPE_LABEL = { concept: 'Concept', example: 'Rose Float example', control: 'Control', lesson: 'Lesson', exercise: 'Guided practice' };
const TYPE_ORDER = ['concept', 'example', 'control', 'lesson', 'exercise'];

export function mountHandbook(container, { dispatch }) {
  const input = el('input', { type: 'search', id: 'handbook-search', 'data-control': 'handbook-search', placeholder: 'Search, for example netmask, DMX, velocity limit', 'aria-label': 'Search the handbook', oninput: (e) => dispatch({ type: 'search', query: e.target.value }) });
  const status = el('p', { id: 'handbook-status', class: 'muted', role: 'status', 'aria-live': 'polite' });
  const body = el('div', {});
  replace(container,
    el('div', { class: 'with-help' }, el('h2', { text: 'Handbook' }), helpButton('handbook-search')),
    el('div', { class: 'search-row' }, input),
    status, body);

  function entryButton(entry, excerpt) {
    return el('li', {}, el('button', { type: 'button', 'data-fid': `hb-${entry.id}`, onclick: () => dispatch({ type: 'open-entry', id: entry.id }) },
      el('span', { class: 'type', text: TYPE_LABEL[entry.type] }), el('strong', { text: entry.title }),
      excerpt ? el('span', { class: 'excerpt', text: excerpt }) : null));
  }

  function citation(key) {
    const c = MANUAL_CITATIONS[key];
    if (!c) return null;
    return el('p', { class: 'cite' }, el('strong', { text: `${c.manual}, ${c.edition}, pages ${c.pages}` }), ` (${c.status === 'read-locally' ? 'read locally for this app' : 'not read'}). ${c.claim} `,
      el('button', { type: 'button', class: 'btn', style: 'padding:2px 8px;font-size:12.5px', text: 'Open PDF in your browser', onclick: () => dispatch({ type: 'open-link', url: c.url }) }));
  }

  function entryView(entry) {
    const related = (entry.related || []).map((id) => HANDBOOK_BY_ID.get(id)).filter(Boolean);
    return el('div', { class: 'entry' },
      el('div', { class: 'btn-row' }, el('button', { type: 'button', class: 'btn', 'data-fid': 'hb-back', text: 'Back to the list', onclick: () => dispatch({ type: 'open-entry', id: null }) })),
      el('p', { class: 'muted', text: TYPE_LABEL[entry.type] }),
      el('h2', { text: entry.title }),
      el('p', {}, evidenceChip(entry.evidence)),
      entry.sections ? entry.sections.map((s) => el('section', {}, el('h4', { text: s.label }), el('p', { text: s.text }))) : el('p', { text: entry.body }),
      entry.type === 'lesson' ? el('div', { class: 'btn-row' }, el('button', { type: 'button', class: 'btn btn-primary', text: 'Open this lesson', onclick: () => dispatch({ type: 'open-lesson-by-id', id: entry.lessonId }) })) : null,
      entry.type === 'exercise' ? el('div', { class: 'btn-row' }, el('button', { type: 'button', class: 'btn btn-primary', text: 'Start this exercise', onclick: () => dispatch({ type: 'start-exercise', id: entry.exerciseId, switchView: true }) })) : null,
      entry.type === 'control' ? el('div', { class: 'btn-row' }, el('button', { type: 'button', class: 'btn', text: 'Show me this control', onclick: () => dispatch({ type: 'highlight', controls: [entry.controlId] }) })) : null,
      related.length ? el('h4', { text: 'Related' }) : null,
      related.length ? el('div', { class: 'related' }, ...related.map((r) => el('button', { type: 'button', text: r.title, onclick: () => dispatch({ type: 'open-entry', id: r.id }) }))) : null,
      entry.images?.length ? el('h4', { text: 'Reference photos' }) : null,
      entry.images?.length ? el('div', { class: 'thumbs' }, ...entry.images.map((file) => {
        const meta = REFERENCE_IMAGES.find((i) => i.file === file);
        return el('button', { type: 'button', title: meta ? meta.caption : file, onclick: () => dispatch({ type: 'open-photo', file }) }, el('img', { src: `${IMAGE_DIR}${file}`, alt: meta ? meta.caption : file, loading: 'lazy' }));
      })) : null,
      ...(entry.cites || []).map(citation));
  }

  function browse() {
    const groups = TYPE_ORDER.map((type) => {
      const entries = HANDBOOK_ENTRIES.filter((e) => e.type === type);
      return el('div', {}, el('h3', { text: `${TYPE_LABEL[type]}s (${entries.length})` }), el('ul', { class: 'results' }, ...entries.map((e) => entryButton(e, null))));
    });
    return el('div', {}, ...groups);
  }

  function update(state) {
    const { handbook } = state;
    if (input.value !== handbook.query) input.value = handbook.query;
    const activeEl = document.activeElement;
    const fid = activeEl && container.contains(activeEl) ? activeEl.dataset.fid : null;

    if (handbook.entryId && HANDBOOK_BY_ID.has(handbook.entryId)) {
      status.textContent = '';
      replace(body, entryView(HANDBOOK_BY_ID.get(handbook.entryId)));
    } else if (!handbook.result || handbook.result.kind === 'empty') {
      status.textContent = 'Type a word from the screen or the controller, such as netmask, DMX, or velocity limit. Or browse everything below.';
      replace(body, browse());
    } else if (handbook.result.kind === 'none') {
      status.textContent = `No entries match “${handbook.query}”. Try another word, such as mask, channel, axis, or feedback.`;
      replace(body, el('ul', { id: 'handbook-results', class: 'results' }));
    } else {
      const results = handbook.result.results;
      status.textContent = `${results.length} ${results.length === 1 ? 'entry matches' : 'entries match'} “${handbook.query}”. Matched: ${handbook.result.results[0].matchedTerms.join(', ')}.`;
      replace(body, el('ul', { id: 'handbook-results', class: 'results' }, ...results.slice(0, 40).map((r) => entryButton(HANDBOOK_BY_ID.get(r.id), r.excerpt))));
    }
    if (fid) container.querySelector(`[data-fid="${fid}"]`)?.focus();
  }

  return { update, focusSearch: () => input.focus() };
}

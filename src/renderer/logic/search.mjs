// Handbook search: tokenizes titles, aliases, and bodies; expands alias groups
// (mask/netmask, PC Mac/PC•MACs, channel/DMX); ranks title matches above body
// matches; returns an excerpt around the first body match.

const TOKEN_RE = /[\p{L}\p{N}•]+(?:[-.'’][\p{L}\p{N}•]+)*/gu;

function normalizeWord(raw) {
  return raw
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[•'’]/g, '')
    .replace(/\.+$/, '');
}

// Returns [{ token, index }] for a text, with hyphenated words contributing
// both their parts and the joined form (dmx-512 -> dmx, 512, dmx512).
function tokenize(text) {
  const out = [];
  for (const match of text.matchAll(TOKEN_RE)) {
    const raw = match[0];
    const index = match.index;
    const joined = normalizeWord(raw.replace(/-/g, ''));
    if (joined) out.push({ token: joined, index });
    if (raw.includes('-')) {
      for (const part of raw.split('-')) {
        const t = normalizeWord(part);
        if (t && t !== joined) out.push({ token: t, index });
      }
    }
  }
  return out;
}

function normalizePhrase(text) {
  return text.toLowerCase().replace(/[•'’]/g, '').replace(/[-_/]+/g, ' ').replace(/\s+/g, ' ').trim();
}

export function buildIndex(entries, aliasGroups = []) {
  const groups = aliasGroups.map((group) => group.map(normalizePhrase));
  const docs = entries.map((entry) => ({
    entry,
    title: new Set(tokenize(entry.title).map((t) => t.token)),
    aliases: new Set(tokenize([entry.type, ...(entry.aliases || [])].join(' ')).map((t) => t.token)),
    body: tokenize(entry.body),
  }));
  return { docs, groups };
}

function expandQuery(query, groups) {
  const phrase = normalizePhrase(query);
  const tokens = new Set(tokenize(phrase).map((t) => t.token));
  for (const group of groups) {
    if (group.some((member) => phrase.includes(member))) {
      for (const member of group) for (const t of tokenize(member)) tokens.add(t.token);
    }
  }
  return [...tokens];
}

function matches(queryToken, docToken) {
  if (queryToken === docToken) return true;
  return queryToken.length >= 3 && docToken.startsWith(queryToken);
}

function excerptAround(body, index) {
  const start = Math.max(0, index - 60);
  const end = Math.min(body.length, index + 120);
  return `${start > 0 ? '…' : ''}${body.slice(start, end).trim()}${end < body.length ? '…' : ''}`;
}

export function search(index, query) {
  if (typeof query !== 'string' || query.trim() === '') return { kind: 'empty', results: [] };
  const terms = expandQuery(query, index.groups);
  if (terms.length === 0) return { kind: 'empty', results: [] };

  const results = [];
  for (const doc of index.docs) {
    let score = 0;
    const matched = new Set();
    let firstBodyHit = null;
    for (const term of terms) {
      let hit = false;
      for (const t of doc.title) if (matches(term, t)) { score += 6; hit = true; break; }
      for (const t of doc.aliases) if (matches(term, t)) { score += 4; hit = true; break; }
      let bodyHits = 0;
      for (const { token, index: at } of doc.body) {
        if (matches(term, token)) {
          bodyHits += 1;
          if (firstBodyHit === null || at < firstBodyHit) firstBodyHit = at;
        }
      }
      if (bodyHits > 0) { score += Math.min(bodyHits, 3); hit = true; }
      if (hit) matched.add(term);
    }
    if (score === 0) continue;
    const excerpt = firstBodyHit === null ? excerptAround(doc.entry.body, 0) : excerptAround(doc.entry.body, firstBodyHit);
    results.push({ id: doc.entry.id, title: doc.entry.title, type: doc.entry.type, score, excerpt, matchedTerms: [...matched] });
  }
  results.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
  return { kind: results.length ? 'results' : 'none', results };
}

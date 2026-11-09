export const normalizeSearch = value => String(value ?? '').normalize('NFKD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('da');
export const queryWords = query => normalizeSearch(query).trim().split(/\s+/).filter(Boolean);

// Deliberately small vocabulary, not automatic translation or stemming. A phrase
// is one concept; alternatives apply within that concept and never replace AND.
const aliases = [
  ['theme', 'themes', 'tema', 'temaer', 'temaet', 'temaets'],
  ['illustration', 'illustrations', 'illustrationer', 'illustrationsstil', 'illustrationsstile', 'graphic style', 'graphics style', 'illustration style', 'grafikstil', 'grafik'],
  ['brand guide', 'brandguide', 'brandguiden'],
  ['keyboard', 'tastatur', 'tastaturet', 'tastaturbetjening', 'tastaturnavigation'],
  ['focus', 'fokus', 'tastaturfokus', 'fokusmarkering'],
  ['dialog', 'dialoger', 'dialogen', 'modal', 'modaldialog'],
  ['save', 'saving', 'gem', 'gemme', 'gemning', 'gemmes', 'gemt'],
  ['file', 'files', 'fil', 'filer', 'filen', 'filvalg', 'filvælger', 'projektfil', 'projektfiler'],
  ['data grid', 'data-grid', 'datagrid'],
  ['dropdown', 'combobox', 'kombinationsfelt'],
  ['spacing', 'afstand', 'afstande', 'mellemrum'],
  ['animation', 'animationer', 'bevægelse', 'bevægelsen'],
  ['pattern', 'patterns', 'mønster', 'mønstre', 'designmønster', 'designmønstre'],
].map(group => group.map(normalizeSearch));

const phrases = aliases.flatMap(group => group.map(term => ({ words: term.split(' '), group }))).sort((a, b) => b.words.length - a.words.length);
const escapeRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function queryConcepts(query) {
  const words = queryWords(query), concepts = [];
  for (let index = 0; index < words.length;) {
    const phrase = phrases.find(item => item.words.every((word, offset) => words[index + offset] === word));
    const count = phrase?.words.length ?? 1;
    concepts.push({ term: words.slice(index, index + count).join(' '), alternatives: phrase?.group ?? [] });
    index += count;
  }
  return concepts;
}

function conceptIndex(text, concept) {
  // Preserve existing literal substring searches, including Danish compounds
  // and source identifiers. Translated aliases require whole terms, so e.g.
  // save does not match the incidental letters "gem" inside "Gemini".
  const literal = text.indexOf(concept.term);
  if (literal >= 0) return literal;
  for (const term of concept.alternatives) {
    const match = new RegExp('(^|[^\\p{L}\\p{N}_])(' + escapeRegExp(term) + ')(?=$|[^\\p{L}\\p{N}_])', 'u').exec(text);
    if (match) return match.index + match[1].length;
  }
  return -1;
}

/** Every query concept must match; exact IDs/titles outrank translated matches. */
export function searchMatch(query, { id = '', title = '', tags = [], summary = '', body = '' }) {
  const concepts = queryConcepts(query);
  const fields = { title: `${id} ${title}`.trim(), tags: tags.join(' '), summary, body };
  const normalized = Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, normalizeSearch(value)]));
  const positions = Object.fromEntries(Object.entries(normalized).map(([key, value]) => [key, concepts.map(concept => conceptIndex(value, concept))]));
  if (!concepts.every((_, index) => Object.values(positions).some(matches => matches[index] >= 0))) return null;
  const matchedIn = Object.keys(fields).filter(key => positions[key].some(index => index >= 0));
  const weights = { title: 100, tags: 40, summary: 15, body: 1 };
  let score = concepts.reduce((sum, _, index) => sum + Math.max(...Object.keys(fields).map(key => positions[key][index] >= 0 ? weights[key] : 0)), 0);
  const normalizedQuery = normalizeSearch(query).trim();
  if (normalizeSearch(id) === normalizedQuery || normalizeSearch(title) === normalizedQuery) score += 1000;
  const snippetField = matchedIn.includes('body') ? 'body' : matchedIn.includes('summary') ? 'summary' : matchedIn[0] ?? 'title';
  const text = fields[snippetField], first = positions[snippetField].find(index => index >= 0) ?? 0;
  const start = Math.max(0, first - 60);
  const snippet = (start ? '…' : '') + text.slice(start, start + 280).replace(/\s+/g, ' ') + (text.length > start + 280 ? '…' : '');
  return { score, matchedIn, snippet };
}

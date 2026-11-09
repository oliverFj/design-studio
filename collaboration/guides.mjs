import { promises as fs } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

export const GUIDE_CONTENT_LIMIT = 8000;
export const GUIDE_TOC_LIMIT = 100;
export { normalizeSearch, queryWords, searchMatch } from './search.mjs';
export function pageOffset(offset = 0) {
  if (!Number.isSafeInteger(offset) || offset < 0) throw new Error('offset skal være et ikke-negativt heltal.');
  return offset;
}
export function pageInfo(total, offset, count) {
  const hasMore = offset + count < total;
  return { total, offset, hasMore, nextOffset: hasMore ? offset + count : null };
}

const anchor = title => title.toLocaleLowerCase('da').replace(/<[^>]*>/g, '').replace(/[^\p{L}\p{N}_\-\s]/gu, '').trim().replace(/\s/g, '-');

/** ATX headings outside fenced code; duplicate anchors follow source order. */
export function parseGuide(text) {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const headings = [];
  const used = new Set(['introduction']);
  let fence = null;
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    const delimiter = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
    if (fence) {
      if (delimiter && delimiter[1][0] === fence.character && delimiter[1].length >= fence.length && !delimiter[2].trim()) fence = null;
      continue;
    }
    if (delimiter && !(delimiter[1][0] === '`' && delimiter[2].includes('`'))) { fence = { character: delimiter[1][0], length: delimiter[1].length }; continue; }
    const match = line.match(/^ {0,3}(#{1,6})[\t ]+(.+?)\s*#*\s*$/);
    if (!match) continue;
    const title = match[2], base = anchor(title) || 'section';
    let section = base, suffix = 0;
    while (used.has(section)) section = base + '-' + ++suffix;
    used.add(section);
    headings.push({ section, title, level: match[1].length, line: index + 1, index });
  }
  const boundaries = headings[0]?.index === 0 ? headings : [{ section: 'introduction', title: 'Indledning', level: 0, line: 1, index: 0 }, ...headings];
  const sections = boundaries.map((heading, index) => ({ section: heading.section, title: heading.title, level: heading.level, line: heading.line, content: lines.slice(heading.index, boundaries[index + 1]?.index ?? lines.length).join('\n') }));
  if (sections.length > 2000) throw new Error('Guiden har for mange afsnit.');
  return { title: headings.find(item => item.level === 1)?.title ?? 'Vejledning', sections };
}

/** Only root entry points and Markdown below docs/ are eligible; never follow links. */
export async function loadGuides(root, read) {
  const files = ['AGENTS.md', 'README.md'];
  let directories = 0;
  async function walk(relative) {
    const directory = path.join(root, relative);
    const resolved = await fs.realpath(directory).catch(error => { if (error.code === 'ENOENT') return null; throw error; });
    if (resolved === null) return;
    const relativeReal = path.relative(root, resolved);
    if (path.isAbsolute(relativeReal) || relativeReal === '..' || relativeReal.startsWith('..' + path.sep) || (await fs.lstat(directory)).isSymbolicLink()) throw new Error('Dokumentmapper skal være almindelige mapper inden for Stade.');
    if (++directories > 1000) throw new Error('Dokumentindekset har for mange mapper.');
    const entries = await fs.readdir(directory, { withFileTypes: true });
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      if (entry.isSymbolicLink()) continue;
      const file = `${relative}/${entry.name}`;
      if (entry.isDirectory()) await walk(file);
      else if (entry.isFile() && entry.name.endsWith('.md')) files.push(file);
      if (files.length > 200) throw new Error('Dokumentindekset overstiger 200 filer.');
    }
  }
  await walk('docs');
  let bytes = 0;
  const guides = [];
  for (const source of files) {
    const text = await read(root, source, 512 * 1024, true);
    if (text === null) continue;
    bytes += Buffer.byteLength(text);
    if (bytes > 8 * 1024 * 1024) throw new Error('Dokumentindekset overstiger 8 MiB.');
    const id = source.replace(/^docs\//, '').replace(/\.md$/, '').toLocaleLowerCase('da').replaceAll('/', '-');
    if (guides.some(guide => guide.id === id)) throw new Error('Dubleret guide-id: ' + id);
    guides.push({ id, source, sha256: createHash('sha256').update(text).digest('hex'), ...parseGuide(text) });
  }
  return guides;
}

export function findGuide(guides, id) {
  const aliases = { graphics: 'graphics-authoring' };
  const guide = guides.find(item => item.id === (aliases[id] ?? id));
  if (!guide) throw new Error('Ukendt guide-id. Find et id med search_library.');
  return guide;
}

export function guidePage(guide, { section, offset = 0 } = {}) {
  pageOffset(offset);
  const metadata = { id: guide.id, title: guide.title, source: guide.source, sha256: guide.sha256, version: guide.sha256 };
  if (section === undefined) {
    const sections = guide.sections.slice(offset, offset + GUIDE_TOC_LIMIT).map(({ content, ...entry }) => ({ ...entry, characters: content.length }));
    return { ...metadata, sections, ...pageInfo(guide.sections.length, offset, sections.length) };
  }
  const entry = guide.sections.find(item => item.section === section);
  if (!entry) throw new Error('Ukendt afsnit. Hent guidens indholdsfortegnelse uden section.');
  const content = entry.content.slice(offset, offset + GUIDE_CONTENT_LIMIT);
  return { ...metadata, section, line: entry.line, content, ...pageInfo(entry.content.length, offset, content.length) };
}

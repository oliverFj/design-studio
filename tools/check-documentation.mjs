import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseGuide } from '../collaboration/guides.mjs';
import { COMPONENT_LIBRARY, LIBRARY_VERSION } from '../core/library.mjs';
import { COMPOSITIONS } from '../patterns/catalog.mjs';
import { TOOL_PACKAGES } from '../collaboration/catalog.mjs';

const studioRoot = fileURLToPath(new URL('../', import.meta.url));
const within = (root, file) => { const relative = path.relative(root, file); return relative === '' || !relative.startsWith('..' + path.sep) && relative !== '..' && !path.isAbsolute(relative); };

// This checker covers local inline Markdown links and ATX heading anchors.
// It deliberately does not fetch websites or inspect sibling product folders.
export function markdownLines(text) {
  let fence = null;
  return text.split(/\r?\n/).map(line => {
    const marker = /^\s{0,3}(`{3,}|~{3,})/.exec(line)?.[1];
    if (fence) { if (marker?.[0] === fence[0] && marker.length >= fence.length) fence = null; return ''; }
    if (marker) { fence = marker; return ''; }
    return line;
  });
}

export function markdownAnchors(text) {
  const anchors = new Set(parseGuide(text).sections.map(section => section.section));
  for (const line of markdownLines(text)) {
    for (const match of line.matchAll(/\bid=["']([^"']+)["']/g)) anchors.add(match[1]);
  }
  return anchors;
}

async function markdownFiles(root, directory) {
  const output = [];
  for (const entry of await fs.readdir(path.join(root, directory), { withFileTypes: true })) {
    const relative = path.posix.join(directory, entry.name);
    if (entry.isDirectory()) output.push(...await markdownFiles(root, relative));
    else if (entry.isFile() && entry.name.endsWith('.md')) output.push(relative);
  }
  return output;
}

export async function checkDocumentation({ root = studioRoot, files } = {}) {
  root = await fs.realpath(root);
  files ??= ['README.md', 'AGENTS.md', ...await markdownFiles(root, 'docs'), ...await markdownFiles(root, 'skills')];
  const errors = [], skipped = [], cache = new Map();
  let checkedLinks = 0;
  const read = async file => {
    if (!cache.has(file)) cache.set(file, await fs.readFile(file, 'utf8'));
    return cache.get(file);
  };
  for (const file of files) {
    const text = await read(path.resolve(root, file));
    for (const [index, line] of markdownLines(text).entries()) {
      for (const match of line.matchAll(/!?\[[^\]]*\]\(\s*(?:<([^>]+)>|([^\s)]+))(?:\s+["'][^"']*["'])?\s*\)/g)) {
        const href = match[1] ?? match[2];
        if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(href)) continue;
        const location = { file, line: index + 1, href };
        let destination, anchor;
        try {
          const split = href.indexOf('#');
          destination = decodeURIComponent((split < 0 ? href : href.slice(0, split)).split('?')[0]);
          anchor = split < 0 ? '' : decodeURIComponent(href.slice(split + 1));
        } catch { errors.push({ ...location, reason: 'Ugyldig URL-kodning.' }); continue; }
        const target = destination ? path.resolve(root, path.dirname(file), destination) : path.resolve(root, file);
        if (!within(root, target)) { skipped.push({ ...location, reason: 'Ekstern produktreference; kræver særskilt projektadgang.' }); continue; }
        const relative = path.relative(root, target).split(path.sep).join('/');
        let stat;
        try {
          if (!within(root, await fs.realpath(target))) { skipped.push({ ...location, reason: 'Link peger uden for projektet.' }); continue; }
          stat = await fs.stat(target);
        }
        catch (error) {
          if (error.code !== 'ENOENT') throw error;
          if (['index.html', 'examples/workspace/index.html'].includes(relative) || relative.startsWith('artifacts/')) {
            skipped.push({ ...location, reason: 'Genereret buildprodukt; kontrolleres ved build.' }); continue;
          }
          errors.push({ ...location, reason: 'Målfilen mangler.' }); continue;
        }
        checkedLinks++;
        if (anchor && stat.isFile() && target.endsWith('.md') && !markdownAnchors(await read(target)).has(anchor)) {
          errors.push({ ...location, reason: 'Overskrift eller lokalt anker mangler.' });
        }
      }
    }
  }
  return { catalog: { libraryVersion: LIBRARY_VERSION, componentCount: Object.keys(COMPONENT_LIBRARY).length,
    patternCount: Object.keys(COMPOSITIONS).length, toolCount: TOOL_PACKAGES.flatMap(pack => pack.tools).length },
    files: files.length, checkedLinks, errors, skipped };
}

export const ONBOARDING_TASKS = Object.freeze([
  { id: 'dialog', query: 'Dialog drawer tooltip popover', evidence: /modal|showModal/i },
  { id: 'grid', query: 'Redigerbart datagrid', evidence: /validateCell|atomisk/i },
  { id: 'project-file', query: 'Fælles projektfiler', evidence: /createProjectFile/ },
  { id: 'graphics', query: 'Stilkontrakt referencehierarki', evidence: /stilkontrakt|tegneregler/i },
  { id: 'verification', query: 'Kontrollér den berørte funktion', evidence: /kontrol|browser/i },
]);

// A retrieval smoke check, not an agent benchmark or a promised token saving.
export async function measureOnboarding({ service, root = studioRoot } = {}) {
  const coreChars = (await fs.readFile(path.join(root, 'AGENTS.md'), 'utf8')).length;
  const results = [];
  for (const task of ONBOARDING_TASKS) {
    const search = await service.searchLibrary({ query: task.query, limit: 5 });
    const hit = search.results.find(result => result.kind === 'guide' && result.section);
    if (!hit) throw new Error('Intet guideafsnit til onboardingopgaven: ' + task.id);
    let page = await service.getGuide({ id: hit.id, section: hit.section });
    let responseChars = JSON.stringify(search).length, content = '';
    while (true) {
      responseChars += JSON.stringify(page).length; content += page.content;
      if (!page.hasMore) break;
      page = await service.getGuide({ id: hit.id, section: hit.section, offset: page.nextOffset });
    }
    if (!task.evidence.test(content)) throw new Error('Guideopslaget mangler relevant indhold til: ' + task.id);
    const totalChars = coreChars + responseChars;
    results.push({ task: task.id, query: task.query, source: hit.source, section: hit.section, coreChars, responseChars, totalChars,
      estimatedTokens: { min: Math.ceil(totalChars / 4), max: Math.ceil(totalChars / 3) } });
  }
  return { note: 'AGENTS plus faktiske søge-/guidesvar; 3–4 tegn/token er et skøn. Produktets egne filer, værktøjsdefinitioner og øvrige opslag er ikke medregnet. Dette er en opslagstest, ikke en måling af en agents komplette arbejde.', results };
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  const { skipped, ...report } = await checkDocumentation();
  report.skippedCount = skipped.length;
  report.scope = 'Lokale inline Markdownlinks og ATX-ankre; eksterne web- og produktreferencer kontrolleres ikke.';
  if (process.argv.includes('--verbose')) report.skipped = skipped;
  if (process.argv.includes('--onboarding')) {
    const { createCollaborationService } = await import('../collaboration/service.mjs');
    report.onboarding = await measureOnboarding({ service: await createCollaborationService() });
  }
  console.log(JSON.stringify(report, null, 2));
  if (report.errors.length) process.exitCode = 1;
}

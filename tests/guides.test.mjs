import test from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createHash } from 'node:crypto';
import { parseGuide, guidePage, loadGuides, searchMatch, GUIDE_CONTENT_LIMIT } from '../collaboration/guides.mjs';
import { createCollaborationService, STUDIO_ROOT } from '../collaboration/service.mjs';
import { COMPOSITIONS } from '../patterns/catalog.mjs';

async function fixture(t) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'stade-guides-'));
  t.after(async () => { assert.ok(directory.startsWith(path.resolve(os.tmpdir()) + path.sep)); await fs.rm(directory, { recursive: true, force: true }); });
  await fs.mkdir(path.join(directory, 'docs'));
  await fs.mkdir(path.join(directory, 'collaboration'));
  await fs.writeFile(path.join(directory, 'collaboration/experiences.json'), '[]');
  return directory;
}

test('headings ignore fenced examples, preserve duplicate anchors and expose source lines', () => {
  const guide = parseGuide('Intro\n# Guide\nText\n```md\n## Fake\n```\n## Ægte valg\nA\n~~~\n## Also fake\n~~~\n## Ægte valg\nB');
  assert.deepEqual(guide.sections.map(item => item.section), ['introduction', 'guide', 'ægte-valg', 'ægte-valg-1']);
  assert.equal(guide.sections[2].line, 7);
  assert.ok(guide.sections[1].content.includes('## Fake'));
  assert.equal(parseGuide('# Guide\n````\n```\n## Hidden\n````\n## Visible').sections.at(-1).section, 'visible');
});

test('guide pages bound text and TOC with explicit continuation and reject unknown sections', () => {
  const guide = { id: 'test', source: 'docs/TEST.md', sha256: 'a'.repeat(64), ...parseGuide('# Lang\n' + 'x'.repeat(17000)) };
  const first = guidePage(guide, { section: 'lang' });
  assert.equal(first.content.length, GUIDE_CONTENT_LIMIT);
  assert.equal(first.nextOffset, 8000);
  const second = guidePage(guide, { section: 'lang', offset: first.nextOffset });
  const last = guidePage(guide, { section: 'lang', offset: second.nextOffset });
  assert.equal(first.content + second.content + last.content, guide.sections[0].content);
  assert.equal(last.hasMore, false);
  const many = { ...guide, ...parseGuide(Array.from({ length: 120 }, (_, index) => `## Valg ${index}\nTekst`).join('\n')) };
  const toc = guidePage(many);
  assert.equal(toc.sections.length, 100);
  assert.equal(guidePage(many, { offset: toc.nextOffset }).sections.length, 20);
  assert.throws(() => guidePage(guide, { section: '../secret' }), /Ukendt afsnit/);
  assert.throws(() => guidePage(guide, { offset: -1 }), /offset/);
});

test('full-text discovery ranks headings, pages matches and refreshes guide bytes/hash', async t => {
  const directory = await fixture(t);
  await fs.writeFile(path.join(directory, 'docs/EXACT.md'), '# Præcis API\nneedleonlybody\n## Gem fil\nBrug filvælger.');
  await fs.writeFile(path.join(directory, 'docs/OTHER.md'), '# Andet\nGem fil beskrives et andet sted.');
  const service = await createCollaborationService({ studioRoot: directory });
  const body = await service.searchLibrary({ query: 'needleonlybody' });
  assert.equal(body.results[0].source, 'docs/EXACT.md');
  assert.ok(body.results[0].matchedIn.includes('body'));
  const ranked = await service.searchLibrary({ query: 'Gem fil', limit: 1 });
  assert.equal(ranked.results[0].section, 'gem-fil');
  assert.equal(ranked.hasMore, true);
  const next = await service.searchLibrary({ query: 'Gem fil', limit: 1, offset: ranked.nextOffset });
  assert.notEqual(next.results[0].source, ranked.results[0].source);
  const before = await service.getGuide({ id: 'exact' });
  await fs.appendFile(path.join(directory, 'docs/EXACT.md'), '\n## Ny regel\nNyt indhold.');
  const after = await service.getGuide({ id: 'exact' });
  assert.notEqual(after.sha256, before.sha256);
  assert.equal(after.sha256, createHash('sha256').update(await fs.readFile(path.join(directory, 'docs/EXACT.md'))).digest('hex'));
  assert.ok(after.sections.some(section => section.section === 'ny-regel'));
  await assert.rejects(service.getGuide({ id: '../secret' }), /Ukendt guide/);
});

test('guide index only admits root entry points and docs Markdown, without directory symlink escapes', async t => {
  const directory = await fixture(t);
  await fs.writeFile(path.join(directory, 'PRIVATE.md'), '# Private');
  await fs.writeFile(path.join(directory, 'README.md'), '# Readme');
  await fs.writeFile(path.join(directory, 'docs/API.md'), '# API');
  const read = async (root, file) => fs.readFile(path.join(root, file), 'utf8').catch(error => { if (error.code === 'ENOENT') return null; throw error; });
  assert.deepEqual((await loadGuides(directory, read)).map(guide => guide.id), ['readme', 'api']);
  const outside = await fs.mkdtemp(path.join(os.tmpdir(), 'stade-outside-'));
  t.after(async () => { assert.ok(outside.startsWith(path.resolve(os.tmpdir()) + path.sep)); await fs.rm(outside, { recursive: true, force: true }); });
  await fs.rename(path.join(directory, 'docs'), path.join(directory, 'original-docs'));
  await fs.symlink(outside, path.join(directory, 'docs'), process.platform === 'win32' ? 'junction' : 'dir');
  await assert.rejects(loadGuides(directory, read), /Dokumentmapper/);
});

test('project context always returns entire AGENTS and makes README opt-in with continuation', async t => {
  const directory = await fixture(t);
  const rules = '# Regler\n' + 'Bevar alle instruktioner.\n'.repeat(1000);
  await fs.writeFile(path.join(directory, 'AGENTS.md'), rules);
  await fs.writeFile(path.join(directory, 'README.md'), '# Readme\n' + 'x'.repeat(20000));
  const service = await createCollaborationService({ studioRoot: directory });
  const context = await service.getProjectContext({ projectId: 'stade' });
  assert.equal(context.instructions.length, 1);
  assert.equal(context.instructions[0].text, rules);
  assert.equal(context.instructions[0].truncated, false);
  const expanded = await service.getProjectContext({ projectId: 'stade', includeReadme: true });
  assert.equal(expanded.instructions[1].truncated, true);
  assert.ok(expanded.instructions[1].continuation.includes('16000'));
  await fs.writeFile(path.join(directory, 'AGENTS.md'), 'x'.repeat(256 * 1024 + 1));
  await assert.rejects(service.getProjectContext({ projectId: 'stade' }), /for stor/);
});

test('every pattern has existing reference paths and correct direct controller imports', async () => {
  const service = await createCollaborationService();
  for (const id of Object.keys(COMPOSITIONS)) {
    const pattern = await service.getPattern({ id });
    assert.equal(pattern.pattern.name, COMPOSITIONS[id].name);
    for (const file of pattern.exampleFiles) assert.ok((await fs.stat(path.join(STUDIO_ROOT, file))).isFile());
    for (const basis of pattern.controllerBasis) {
      const module = await import(new URL('../' + basis.file, import.meta.url));
      for (const symbol of basis.symbols) assert.equal(typeof module[symbol], 'function');
    }
  }
  const panel = await service.getPattern({ id: 'resizable-panel' });
  assert.ok(panel.controllerBasis.some(item => item.symbols.includes('mountPanelControls')));
});

test('matching weights exact titles over tags, summaries and incidental body text', () => {
  const title = searchMatch('gem fil', { title: 'Gem fil' });
  const tags = searchMatch('gem fil', { tags: ['gem fil'] });
  const body = searchMatch('gem fil', { body: 'Man kan gem fil her.' });
  assert.ok(title.score > tags.score && tags.score > body.score);
  assert.equal(searchMatch('manglende ord', { title: 'ord' }), null);
});

test('English searches discover real Danish guide sections while exact component IDs remain first', async () => {
  const service = await createCollaborationService();
  for (const [query, source, evidence] of [
    ['brand guide', 'docs/BRANDGUIDE.md', /brandguide/i],
    ['graphic style', 'docs/GRAPHICS-AUTHORING.md', /grafik|illustration/i],
    ['spacing', 'docs/DESIGN-FOUNDATIONS.md', /afstand/i],
    ['keyboard focus', null, /tastatur|fokus/i],
  ]) {
    const result = await service.searchLibrary({ query, limit: 5 });
    const guide = result.results.find(item => item.kind === 'guide' && (!source || item.source === source));
    assert.ok(guide, 'Expected Danish documentation for ' + query);
    const page = await service.getGuide({ id: guide.id, section: guide.section });
    assert.match(page.content, evidence);
    assert.ok(guide.matchedIn.length);
  }
  for (const id of ['data-grid', 'combobox', 'dialog']) {
    const result = await service.searchLibrary({ query: id });
    assert.equal(result.results[0].kind, 'component');
    assert.equal(result.results[0].id, id);
  }
  assert.equal((await service.searchLibrary({ query: 'keyboard focus nonexistentconcept' })).total, 0);
});

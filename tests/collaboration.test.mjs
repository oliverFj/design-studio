import test from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { createCollaborationService, experienceRevision, STUDIO_ROOT } from '../collaboration/service.mjs';
import { searchExperiences, TOOL_PACKAGES } from '../collaboration/catalog.mjs';
import { experienceSchema } from '../collaboration/schema.mjs';
import { parseProjectArguments } from '../tools/mcp-server.mjs';

const sample = (id = 'gpu-sample') => ({
  schemaVersion: 1, id, title: 'GPU-ressourcer', summary: 'Bevar ejerskab ved teksturændringer.', status: 'draft', scope: 'project', project: 'formlab', tags: ['gpu', 'tekstur'],
  problem: 'En tekstur skal erstattes.', approach: 'Kontrollér ejerskabet før frigivelse.', verification: { kind: 'source-inspection', summary: 'Koden blev læst; GPU-forløbet er ikke kørt.' },
  limits: ['Gælder denne observation, ikke alle renderere.'], sources: [{ project: 'formlab', file: 'renderer.mjs', line: 12, note: 'Ejerskab kontrolleres her.', sha256: 'a'.repeat(64), revision: 'working-tree' }], updatedAt: '2026-11-07',
});

async function fixture(t, allowCuration = false) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'stade-collaboration-'));
  t.after(async () => { assert.ok(directory.startsWith(path.resolve(os.tmpdir()) + path.sep)); await fs.rm(directory, { recursive: true, force: true }); });
  const knowledge = path.join(directory, 'knowledge'), project = path.join(directory, 'project'), outside = path.join(directory, 'outside');
  for (const target of [knowledge, project, outside]) await fs.mkdir(target);
  await fs.writeFile(path.join(knowledge, 'experiences.json'), '[]');
  const service = await createCollaborationService({ experienceRoot: knowledge, projects: [{ id: 'test-project', directory: project }], allowCuration });
  return { directory, knowledge, project, outside, service };
}

async function sourcedEntry(project, id = 'curation-sample') {
  const bytes = Buffer.from('Current source for ' + id);
  const file = id + '.mjs';
  await fs.writeFile(path.join(project, file), bytes);
  return { ...sample(id), project: 'test-project', sources: [{ ...sample().sources[0], project: 'test-project', file, sha256: createHash('sha256').update(bytes).digest('hex') }] };
}

test('experience search includes source, approach and project; retired knowledge is explicit', () => {
  const entries = [sample(), { ...sample('old'), status: 'retired' }, { ...sample('shared'), status: 'reviewed', scope: 'shared' }];
  assert.equal(searchExperiences(entries, { query: 'GPU frigivelse renderer.mjs formlab' }).length, 2);
  assert.equal(searchExperiences(entries, { status: 'retired' })[0].id, 'old');
  assert.equal(searchExperiences(entries, { scope: 'shared', query: 'ændringer' })[0].id, 'shared');
  assert.equal(searchExperiences(entries, { query: 'nonexistent' }).length, 0);
});

test('experience results rank useful fields, filter projects and page concise evidence without losing full records', async t => {
  const { service, knowledge } = await fixture(t);
  const incidental = { ...sample('incidental'), title: 'Ejerskab', tags: ['ressourcer'], summary: 'En observation.', verification: { kind: 'source-inspection', summary: 'gpu ' + 'langt belæg '.repeat(100) }, sources: Array.from({ length: 4 }, () => sample().sources[0]) };
  const relevant = sample('gpu-relevant');
  const otherProject = { ...sample('gpu-other'), project: 'andet' };
  await fs.writeFile(path.join(knowledge, 'experiences.json'), JSON.stringify([incidental, relevant, otherProject]));
  const first = await service.searchExperiences({ query: 'gpu', project: 'formlab', limit: 1 });
  assert.equal(first.total, 2);
  assert.equal(first.results[0].id, relevant.id);
  assert.equal(first.nextOffset, 1);
  const next = await service.searchExperiences({ query: 'gpu', project: 'formlab', limit: 1, offset: first.nextOffset });
  assert.equal(next.results[0].id, incidental.id);
  assert.equal(next.hasMore, false);
  assert.equal(next.results[0].sources.length, 2);
  assert.equal(next.results[0].sourceCount, 4);
  assert.equal(next.results[0].sourcesTruncated, true);
  assert.equal(next.results[0].verificationTruncated, true);
  assert.equal(next.results[0].sources[0].sha256, incidental.sources[0].sha256);
  assert.equal((await service.getExperience({ id: incidental.id })).experience.verification.summary, incidental.verification.summary.trim());
});

test('schema rejects unsafe IDs, invented fields, impossible dates and projectless local knowledge', () => {
  assert.equal(experienceSchema.safeParse(sample()).success, true);
  for (const entry of [{ ...sample(), id: '../escape' }, { ...sample(), extra: true }, { ...sample(), updatedAt: '2026-02-30' }, { ...sample(), project: undefined }, { ...sample(), sources: [{ ...sample().sources[0], sha256: 'fake' }] }]) assert.equal(experienceSchema.safeParse(entry).success, false);
  for (const file of ['../secret', '/secret', 'C:\\secret', 'nested/../../secret', 'C:secret']) assert.equal(experienceSchema.safeParse({ ...sample(), sources: [{ ...sample().sources[0], file }] }).success, false);
});

test('library discovery includes bounded explicitly related open tickets and ignores closed or unlinked reports', async t => {
  const {service}=await fixture(t);
  const report={type:'gap',title:'Knapfamilie',description:'Et konkret ændringsønske til knapper og panelmønster.',requestedChange:'Gennemgå den ønskede variant.',area:'button',actor:'library-test'};
  const linked=(await service.createTicket({ticket:{...report,relations:{components:['button'],patterns:['resizable-panel']}}})).ticket;
  for(let index=0;index<6;index++)await service.createTicket({ticket:{...report,title:'Ekstra knapønske '+index,relations:{components:['button'],patterns:[]}}});
  await service.createTicket({ticket:report});
  const resolved=(await service.createTicket({ticket:{...report,title:'Tidligere rettelse',relations:{components:['button'],patterns:['resizable-panel']}}})).ticket;
  await service.updateTicket({id:resolved.id,expectedRevision:1,actor:'library-test',note:'Afsluttet i prøven.',changes:{status:'resolved',resolution:{summary:'Afgrænset rettelse.',changes:[{file:'core/components.mjs',note:'Rettet i fixturegrundlaget.'}],verification:{kind:'tested',summary:'Fixturekontrollen bestod.'},heuristicIds:[]}}});
  const component=await service.getComponent({id:'button'});
  assert.equal(component.component.name,'Knap');
  assert.equal(component.relatedTickets.total,7);
  assert.equal(component.relatedTickets.results.length,5);
  assert.equal(component.relatedTickets.hasMore,true);
  assert.ok(component.relatedTickets.results.every(ticket=>ticket.status!=='resolved'&&ticket.relations.components.includes('button')));
  const library=await service.searchLibrary({query:'button',limit:20});
  assert.equal(library.results.find(item=>item.id==='button').relatedTickets.total,7);
  const pattern=(await service.searchLibrary({query:'resizable-panel'})).results.find(item=>item.id==='resizable-panel');
  assert.deepEqual(pattern.relatedTickets.results.map(ticket=>ticket.id),[linked.id]);
  assert.equal(pattern.relatedTickets.total,1);assert.equal(pattern.relatedTickets.hasMore,false);
  const guide=(await service.searchLibrary({query:'agent-workflow'})).results.find(item=>item.kind==='guide');
  assert.equal(guide.relatedTickets,undefined);
});

test('ticket resolution links only existing heuristics and allows completion without creating a heuristic', async t => {
  const {service,knowledge}=await fixture(t);
  const ticket=(await service.createTicket({ticket:{type:'gap',title:'En manglende variant',description:'Et afgrænset behov.',requestedChange:'Tilføj den nødvendige variant.',area:'Knapper',actor:'resolution-test'}})).ticket;
  const resolution={summary:'Varianten er tilføjet.',changes:[{file:'core/library.mjs',note:'Den relevante variant er opdateret.'}],verification:{kind:'source-inspection',summary:'Den berørte definition er gennemgået.'},heuristicIds:['unknown-rule']};
  await assert.rejects(service.updateTicket({id:ticket.id,expectedRevision:1,actor:'resolution-test',note:'Afslutning.',changes:{status:'resolved',resolution}}),/Ukendt heuristik-id/);
  assert.equal((await service.getTicket({id:ticket.id})).ticket.revision,1,'a rejected reference publishes nothing');
  const {problem,approach,...base}=sample('existing-rule');
  await service.proposeExperience({experience:{...base,schemaVersion:2,context:problem,heuristic:approach,rationale:'Den anbefalede tilgang bevarer ejerskabet.'}});
  const linked=await service.updateTicket({id:ticket.id,expectedRevision:1,actor:'resolution-test',note:'Afslutning med relevant praksis.',changes:{status:'resolved',resolution:{...resolution,heuristicIds:['existing-rule']}}});
  assert.deepEqual(linked.ticket.resolution.heuristicIds,['existing-rule']);
  const other=(await service.createTicket({ticket:{type:'bug',title:'En lokal knapfejl',description:'Fejlen er afgrænset.',requestedChange:'Ret knappen.',area:'Knapper',actor:'resolution-test'}})).ticket;
  const completed=await service.updateTicket({id:other.id,expectedRevision:1,actor:'resolution-test',note:'Der kom ingen ny heuristik ud af rettelsen.',changes:{status:'resolved',resolution:{...resolution,heuristicIds:[]}}});
  assert.deepEqual(completed.ticket.resolution.heuristicIds,[]);
  await fs.unlink(path.join(knowledge,'proposals','existing-rule.json'));
  assert.deepEqual((await service.getTicket({id:ticket.id})).ticket.resolution.heuristicIds,['existing-rule'],'historical records remain readable if referenced knowledge is unavailable');
  const annotated=await service.updateTicket({id:ticket.id,expectedRevision:2,actor:'resolution-test',changes:{},note:'Efterfølgende note uden ny resolution.'});
  assert.equal(annotated.ticket.revision,3);
});

test('new proposals remain drafts, reload immediately and cannot replace canonical or pending records', async t => {
  const { service, knowledge } = await fixture(t);
  await service.proposeExperience({ experience: sample() });
  const found = await service.searchExperiences({ query: 'gpu' });
  assert.equal(found.results[0].status, 'draft');
  assert.equal(found.results[0].sources[0].note, undefined);
  assert.equal((await service.getExperience({ id: 'gpu-sample' })).experience.sources[0].note, sample().sources[0].note);
  assert.equal((await service.getExperience({ id: 'gpu-sample' })).experience.sources[0].sha256, 'a'.repeat(64));
  await assert.rejects(service.proposeExperience({ experience: sample() }), /findes allerede/);
  await assert.rejects(service.proposeExperience({ experience: { ...sample('approved'), status: 'reviewed' } }), /kladder/);
  assert.deepEqual(JSON.parse(await fs.readFile(path.join(knowledge, 'experiences.json'), 'utf8')), []);
  await fs.writeFile(path.join(knowledge, 'experiences.json'), JSON.stringify([{ ...sample('canonical'), status: 'reviewed' }]));
  await assert.rejects(service.proposeExperience({ experience: sample('canonical') }), /findes allerede/);
});

test('concurrent proposals publish complete JSON and an ID succeeds once', async t => {
  const { service, knowledge } = await fixture(t);
  const proposals = Promise.allSettled(Array.from({ length: 8 }, (_, index) => service.proposeExperience({ experience: sample(index < 2 ? 'same-id' : 'entry-' + index) })));
  for (let index = 0; index < 12; index++) await service.searchExperiences();
  const results = await proposals;
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 7);
  assert.equal((await service.searchExperiences({ limit: 20 })).total, 7);
  assert.equal((await fs.readdir(path.join(knowledge, 'proposals'))).filter(name => name.endsWith('.tmp')).length, 0);
});

test('invalid and duplicate stored records fail clearly instead of becoming trusted knowledge', async t => {
  const { service, knowledge } = await fixture(t);
  await fs.writeFile(path.join(knowledge, 'experiences.json'), JSON.stringify([sample(), sample()]));
  await assert.rejects(service.searchExperiences(), /Dubleret/);
  await fs.writeFile(path.join(knowledge, 'experiences.json'), '[]');
  await fs.mkdir(path.join(knowledge, 'proposals'));
  await fs.writeFile(path.join(knowledge, 'proposals', 'invalid.json'), '{');
  await assert.rejects(service.searchExperiences(), SyntaxError);
});

test('temporary files and stale write locks do not prevent reads; locks stop writes clearly', async t => {
  const { service, knowledge } = await fixture(t);
  const directory = path.join(knowledge, 'proposals');
  await fs.mkdir(directory);
  await fs.writeFile(path.join(directory, '.in-progress.tmp'), '{partial');
  await fs.writeFile(path.join(directory, '.write-lock'), '');
  assert.equal((await service.searchExperiences()).total, 0);
  await assert.rejects(service.proposeExperience({ experience: sample() }), /skrivelås/);
  assert.deepEqual((await fs.readdir(directory)).sort(), ['.in-progress.tmp', '.write-lock']);
});

test('proposal capacity is enforced before a new file can make the directory unreadable', async t => {
  const { service, knowledge } = await fixture(t);
  const directory = path.join(knowledge, 'proposals');
  await fs.mkdir(directory);
  const readDirectory = fs.readdir.bind(fs);
  t.mock.method(fs, 'readdir', async target => target === directory ? Array.from({ length: 2000 }, (_, index) => `existing-${index}.json`) : readDirectory(target));
  await assert.rejects(service.proposeExperience({ experience: sample() }), /fuldt/);
  assert.deepEqual(await readDirectory(directory), []);
});

test('project access is limited to startup IDs and paths cannot escape via config or symlink', async t => {
  const { service, project, outside } = await fixture(t);
  await assert.rejects(service.getProjectContext({ projectId: 'unknown' }), /ikke tilladt/);
  await fs.writeFile(path.join(outside, 'theme.json'), JSON.stringify({ id: 'secret-theme' }));
  await fs.writeFile(path.join(project, 'design-studio.project.json'), JSON.stringify({ package: '../outside/theme.json' }));
  await assert.rejects(service.getProjectContext({ projectId: 'test-project' }), /inden for/);
  await assert.rejects(service.checkProject({ projectId: 'test-project' }), /inden for/);
  await fs.symlink(outside, path.join(project, 'linked'), process.platform === 'win32' ? 'junction' : 'dir');
  await fs.writeFile(path.join(project, 'design-studio.project.json'), JSON.stringify({ package: 'linked/theme.json' }));
  await assert.rejects(service.getProjectContext({ projectId: 'test-project' }), /uden for/);
  await assert.rejects(service.checkProject({ projectId: 'test-project' }), /uden for/);
});

test('proposal directory symlinks cannot redirect writes', async t => {
  const { service, knowledge, outside } = await fixture(t);
  await fs.symlink(outside, path.join(knowledge, 'proposals'), process.platform === 'win32' ? 'junction' : 'dir');
  await assert.rejects(service.proposeExperience({ experience: sample() }), /almindelig mappe/);
  assert.deepEqual(await fs.readdir(outside), []);
});

test('project checks reuse doctor with a fixed central baseline and do not execute scripts', async t => {
  const { service, project, outside } = await fixture(t);
  await fs.writeFile(path.join(project, 'design-studio.project.json'), JSON.stringify({ package: 'theme.json', css: 'theme.css', library: 'runtime.mjs', components: {}, libraryVersion: 'old', studioRoot: outside }));
  await fs.writeFile(path.join(project, 'theme.json'), '{}');
  await fs.writeFile(path.join(project, 'package.json'), JSON.stringify({ scripts: { build: 'throw-if-executed' } }));
  const report = await service.checkProject({ projectId: 'test-project' });
  assert.equal(report.valid, false);
  assert.ok(report.checks.some(check => check.message.startsWith('Biblioteksversion')));
  assert.ok(!report.checks.some(check => check.message.includes('Design Studios mappe er ikke tilgængelig')));
});

test('doctor preflight bounds adapter counts and all stamped file sizes before reading their bytes', async t => {
  const { service, project } = await fixture(t);
  const configPath = path.join(project, 'design-studio.project.json');
  const config = { package: 'theme.json', css: 'theme.css', library: 'runtime.mjs', components: {} };
  await fs.writeFile(configPath, JSON.stringify({ ...config, components: Object.fromEntries(Array.from({ length: 101 }, (_, index) => ['component-' + index, { file: 'component.mjs', export: 'render' }])) }));
  await assert.rejects(service.checkProject({ projectId: 'test-project' }), /100 adaptere/);
  await fs.writeFile(configPath, JSON.stringify(config));
  const files = ['large-1.bin', 'large-2.bin', 'large-3.bin', 'large-4.bin', 'large-5.bin'];
  for (const file of files) { const handle = await fs.open(path.join(project, file), 'w'); try { await handle.truncate(14 * 1024 * 1024); } finally { await handle.close(); } }
  await fs.writeFile(path.join(project, 'index.html'), '<meta name="design-studio-inputs" content="' + Buffer.from(JSON.stringify(files)).toString('base64') + '">');
  await assert.rejects(service.checkProject({ projectId: 'test-project' }), /for store/);
});

test('experience lookup checks current file bytes, reports mixed source conditions and preserves the stored record', async t => {
  const { service, knowledge, project, outside } = await fixture(t);
  const bytes = Buffer.from([0xff, 0x00, 0x61, 0x0d, 0x0a]);
  const hash = createHash('sha256').update(bytes).digest('hex');
  await fs.writeFile(path.join(project, 'current.bin'), bytes);
  await fs.writeFile(path.join(outside, 'secret.bin'), bytes);
  await fs.symlink(outside, path.join(project, 'linked'), process.platform === 'win32' ? 'junction' : 'dir');
  const oversized = await fs.open(path.join(project, 'oversized.bin'), 'w');
  try { await oversized.truncate(16 * 1024 * 1024 + 1); } finally { await oversized.close(); }
  const reference = { ...sample().sources[0], project: 'test-project', file: 'current.bin', sha256: hash };
  const entry = { ...sample(), status: 'reviewed', sources: [
    reference,
    { ...reference, sha256: 'b'.repeat(64) },
    { ...reference, file: 'missing.bin' },
    { ...reference, project: 'not-allowed' },
    { ...reference, sha256: undefined },
    { ...reference, file: 'linked/secret.bin' },
    { ...reference, file: 'oversized.bin' },
  ] };
  const stored = JSON.stringify([entry]);
  await fs.writeFile(path.join(knowledge, 'experiences.json'), stored);
  const result = await service.getExperience({ id: entry.id });
  assert.equal(result.sourceStatus, 'changed');
  assert.deepEqual(result.sourceChecks.map(source => source.status), ['unchanged', 'changed', 'unavailable', 'unavailable', 'unverifiable', 'unavailable', 'unavailable']);
  assert.equal(result.sourceChecks[0].actualSha256, hash);
  assert.equal(result.sourceChecks[1].actualSha256, hash);
  assert.match(result.sourceChecks[2].reason, /findes ikke/);
  assert.match(result.sourceChecks[3].reason, /ikke tilladt/);
  assert.equal(result.sourceChecks[4].actualSha256, undefined);
  assert.equal(result.sourceChecks[4].expectedSha256, undefined);
  assert.match(result.sourceChecks[5].reason, /uden for/);
  assert.match(result.sourceChecks[6].reason, /16 MiB/);
  assert.equal(result.experience.status, 'reviewed');
  assert.deepEqual(result.experience.verification, entry.verification);
  assert.equal(await fs.readFile(path.join(knowledge, 'experiences.json'), 'utf8'), stored);
  assert.deepEqual((await service.checkExperienceSources({ id: entry.id })).sourceChecks, result.sourceChecks);
  assert.equal(JSON.stringify(result.sourceChecks).includes(bytes.toString('hex')), false);
});

test('source checks are refreshed on each lookup and never mark a missing reference hash unchanged', async t => {
  const { service, knowledge, project } = await fixture(t);
  const bytes = Buffer.from('first version\r\n');
  const entry = { ...sample(), sources: [{ ...sample().sources[0], project: 'test-project', file: 'source.mjs', sha256: createHash('sha256').update(bytes).digest('hex') }] };
  await fs.writeFile(path.join(project, 'source.mjs'), bytes);
  await fs.writeFile(path.join(knowledge, 'experiences.json'), JSON.stringify([entry]));
  assert.equal((await service.getExperience({ id: entry.id })).sourceStatus, 'unchanged');
  await fs.writeFile(path.join(project, 'source.mjs'), 'second version\n');
  assert.equal((await service.getExperience({ id: entry.id })).sourceStatus, 'changed');
  delete entry.sources[0].sha256;
  await fs.writeFile(path.join(knowledge, 'experiences.json'), JSON.stringify([entry]));
  assert.equal((await service.getExperience({ id: entry.id })).sourceStatus, 'unverifiable');
  entry.sources[0].project = 'not-allowed';
  await fs.writeFile(path.join(knowledge, 'experiences.json'), JSON.stringify([entry]));
  assert.equal((await service.getExperience({ id: entry.id })).sourceStatus, 'unavailable');
});

test('source hashing enforces its aggregate byte budget without returning partial hashes', async t => {
  const { service, knowledge, project } = await fixture(t);
  const sources = [];
  for (let index = 0; index < 5; index++) {
    const file = `source-${index}.bin`;
    const handle = await fs.open(path.join(project, file), 'w');
    try { await handle.truncate(14 * 1024 * 1024); } finally { await handle.close(); }
    sources.push({ ...sample().sources[0], project: 'test-project', file });
  }
  await fs.writeFile(path.join(knowledge, 'experiences.json'), JSON.stringify([{ ...sample(), sources }]));
  const result = await service.checkExperienceSources({ id: 'gpu-sample' });
  assert.deepEqual(result.sourceChecks.map(source => source.status), ['changed', 'changed', 'changed', 'changed', 'unavailable']);
  assert.match(result.sourceChecks[4].reason, /64 MiB/);
  assert.equal(result.sourceChecks[4].actualSha256, undefined);
});

test('curation is disabled by default and revision normalizes schema key order', async t => {
  const { service } = await fixture(t);
  const entry = sample();
  assert.equal(experienceRevision(entry), experienceRevision(Object.fromEntries(Object.entries(entry).reverse())));
  await assert.rejects(service.curateExperience({ id: entry.id, expectedRevision: experienceRevision(entry), experience: { ...entry, status: 'retired' } }), /ikke tilladt/);
});

test('curation promotes a source-checked draft, updates with CAS and retires without requiring available sources', async t => {
  const { service, knowledge, project } = await fixture(t, true);
  const entry = await sourcedEntry(project);
  await service.proposeExperience({ experience: entry });
  const reviewed = { ...entry, status: 'reviewed' };
  const promoted = await service.curateExperience({ id: entry.id, expectedRevision: experienceRevision(entry), experience: reviewed });
  assert.equal(promoted.status, 'reviewed');
  assert.equal(promoted.cleanupPending, false);
  assert.equal(promoted.sourceStatus, 'unchanged');
  assert.deepEqual(JSON.parse(await fs.readFile(path.join(knowledge, 'experiences.json'), 'utf8'))[0].verification, entry.verification);
  assert.deepEqual(await fs.readdir(path.join(knowledge, 'proposals')), []);
  assert.equal((await service.getExperience({ id: entry.id })).experience.status, 'reviewed');
  const updated = { ...reviewed, summary: 'Corrected summary after review.' };
  const result = await service.curateExperience({ id: entry.id, expectedRevision: promoted.revision, experience: updated });
  assert.equal(result.revision, experienceRevision(updated));
  await assert.rejects(service.curateExperience({ id: entry.id, expectedRevision: promoted.revision, experience: reviewed }), /ændret siden/);
  await fs.unlink(path.join(project, entry.sources[0].file));
  const retired = await service.curateExperience({ id: entry.id, expectedRevision: result.revision, experience: { ...updated, status: 'retired' } });
  assert.equal(retired.status, 'retired');
  assert.equal(retired.sourceStatus, 'unavailable');
  assert.equal((await service.searchExperiences()).total, 0);
  assert.equal((await service.searchExperiences({ status: 'retired' })).total, 1);
  assert.match(retired.note, /Genbyg Stade/);
});

test('reviewed curation rejects changed, unavailable and unversioned sources without changing files', async t => {
  const { service, knowledge, project } = await fixture(t, true);
  const entry = await sourcedEntry(project);
  await service.proposeExperience({ experience: entry });
  const expectedRevision = experienceRevision(entry);
  await fs.writeFile(path.join(project, entry.sources[0].file), 'New source version');
  await assert.rejects(service.curateExperience({ id: entry.id, expectedRevision, experience: { ...entry, status: 'reviewed' } }), /uændrede/);
  await assert.rejects(service.curateExperience({ id: entry.id, expectedRevision, experience: { ...entry, status: 'reviewed', sources: [{ ...entry.sources[0], project: 'not-allowed' }] } }), /uændrede/);
  await assert.rejects(service.curateExperience({ id: entry.id, expectedRevision, experience: { ...entry, status: 'reviewed', sources: [{ ...entry.sources[0], sha256: undefined }] } }), /uændrede/);
  await assert.rejects(service.curateExperience({ id: entry.id, expectedRevision, experience: { ...entry, status: 'draft' } }), /reviewed eller retired/);
  await assert.rejects(service.curateExperience({ id: entry.id, expectedRevision, experience: { ...entry, id: 'different', status: 'retired' } }), /id skal/);
  assert.deepEqual(JSON.parse(await fs.readFile(path.join(knowledge, 'experiences.json'), 'utf8')), []);
  assert.equal((await service.getExperience({ id: entry.id })).experience.status, 'draft');
});

test('canonical records win over crash-leftover drafts but malformed pending records still fail', async t => {
  const { service, knowledge } = await fixture(t);
  const entry = sample('crash-leftover');
  await service.proposeExperience({ experience: entry });
  await fs.writeFile(path.join(knowledge, 'experiences.json'), JSON.stringify([{ ...entry, status: 'retired', summary: 'Canonical decision' }]));
  assert.equal((await service.getExperience({ id: entry.id })).experience.summary, 'Canonical decision');
  assert.equal((await service.searchExperiences({ status: 'draft' })).total, 0);
  await fs.writeFile(path.join(knowledge, 'proposals', entry.id + '.json'), '{');
  await assert.rejects(service.getExperience({ id: entry.id }), SyntaxError);
});

test('committed promotion remains readable when proposal cleanup fails', async t => {
  const { service, knowledge, project } = await fixture(t, true);
  const entry = await sourcedEntry(project);
  await service.proposeExperience({ experience: entry });
  const unlink = fs.unlink.bind(fs);
  const proposal = path.join(knowledge, 'proposals', entry.id + '.json');
  t.mock.method(fs, 'unlink', async target => {
    if (target === proposal) throw Object.assign(new Error('Simulated locked proposal.'), { code: 'EPERM' });
    return unlink(target);
  });
  const result = await service.curateExperience({ id: entry.id, expectedRevision: experienceRevision(entry), experience: { ...entry, status: 'reviewed' } });
  assert.equal(result.cleanupPending, true);
  assert.match(result.note, /ikke fjernes/);
  assert.equal((await service.getExperience({ id: entry.id })).experience.status, 'reviewed');
  assert.equal((await service.searchExperiences()).total, 1);
});

test('simultaneous curation and proposals remain atomic to concurrent readers', async t => {
  const { service, project } = await fixture(t, true);
  for (let round = 0; round < 8; round++) {
    const entry = await sourcedEntry(project, 'curation-' + round);
    await service.proposeExperience({ experience: entry });
    const revision = experienceRevision(entry);
    const writes = Promise.allSettled([
      service.curateExperience({ id: entry.id, expectedRevision: revision, experience: { ...entry, status: 'reviewed' } }),
      service.curateExperience({ id: entry.id, expectedRevision: revision, experience: { ...entry, status: 'retired' } }),
      service.proposeExperience({ experience: sample('independent-draft-' + round) }),
    ]);
    for (let index = 0; index < 12; index++) {
      const current = await service.getExperience({ id: entry.id });
      assert.ok(['draft', 'reviewed', 'retired'].includes(current.experience.status));
    }
    const results = await writes;
    assert.equal(results.filter(result => result.status === 'fulfilled').length, 2, JSON.stringify(results.map(result => result.status === 'rejected' ? result.reason.message : result.value)));
    assert.match(results.find(result => result.status === 'rejected').reason.message, /ændret siden/);
    assert.equal((await service.searchExperiences({ status: 'draft' })).total, round + 1);
  }
});

test('proposal capacity does not block curation and canonical symlinks cannot redirect replacement', async t => {
  const { service, knowledge, project, outside } = await fixture(t, true);
  const entry = await sourcedEntry(project);
  await service.proposeExperience({ experience: entry });
  const directory = path.join(knowledge, 'proposals');
  const readDirectory = fs.readdir.bind(fs);
  t.mock.method(fs, 'readdir', async target => target === directory ? [entry.id + '.json', ...Array.from({ length: 1999 }, (_, index) => `missing-${index}.json`)] : readDirectory(target));
  const promoted = await service.curateExperience({ id: entry.id, expectedRevision: experienceRevision(entry), experience: { ...entry, status: 'reviewed' } });
  assert.equal(promoted.status, 'reviewed');
  const file = path.join(knowledge, 'experiences.json');
  const target = path.join(outside, 'experiences.json');
  await fs.writeFile(target, '[]');
  await fs.unlink(file);
  try { await fs.symlink(target, file); }
  catch (error) {
    if (process.platform === 'win32' && ['EPERM', 'EACCES'].includes(error.code)) return;
    throw error;
  }
  await assert.rejects(service.curateExperience({ id: entry.id, expectedRevision: promoted.revision, experience: { ...entry, status: 'retired' } }), /almindelig fil/);
  assert.equal(await fs.readFile(target, 'utf8'), '[]');
});

test('SDK stdio client discovers, validates and calls the actual fifteen-tool server', async t => {
  const { knowledge, project } = await fixture(t);
  const serverURL = new URL('../tools/mcp-server.mjs', import.meta.url).href;
  const transportURL = new URL('../node_modules/@modelcontextprotocol/sdk/dist/esm/server/stdio.js', import.meta.url).href;
  const startup = `import {createMcpServer} from ${JSON.stringify(serverURL)}; import {StdioServerTransport} from ${JSON.stringify(transportURL)}; const server=await createMcpServer({experienceRoot:${JSON.stringify(knowledge)},projects:[{id:'test-project',directory:${JSON.stringify(project)}}]}); await server.connect(new StdioServerTransport());`;
  const transport = new StdioClientTransport({ command: process.execPath, args: ['--input-type=module', '-e', startup], cwd: STUDIO_ROOT, stderr: 'pipe' });
  const client = new Client({ name: 'stade-regression', version: '1.0.0' });
  t.after(async () => { await client.close(); });
  await client.connect(transport);
  const { tools } = await client.listTools();
  assert.deepEqual(tools.map(tool => tool.name).sort(), TOOL_PACKAGES.flatMap(pack => pack.tools.map(tool => tool.name)).sort());
  assert.equal(tools.length, 15);
  assert.equal(tools.find(tool => tool.name === 'propose_experience').annotations.readOnlyHint, false);
  assert.ok(tools.every(tool => tool.inputSchema && tool.outputSchema));
  const graphic = await client.callTool({ name: 'get_graphic_profile', arguments: { family: 'anatomy' } });
  assert.equal(graphic.isError, undefined);
  assert.equal(graphic.structuredContent.family, 'anatomy');
  assert.equal(graphic.structuredContent.review.technicalValidationDoesNotApproveStyle, true);
  assert.equal((await client.callTool({ name: 'get_graphic_profile', arguments: { family: '../private' } })).isError, true);
  const library = await client.callTool({ name: 'search_library', arguments: { query: 'datagrid' } });
  assert.equal(library.isError, undefined);
  assert.ok(library.structuredContent.results.some(result => result.id === 'data-grid'));
  assert.equal((await client.callTool({ name: 'get_component', arguments: { id: 'button' } })).structuredContent.id, 'button');
  const guide = await client.callTool({ name: 'get_guide', arguments: { id: 'agent-workflow' } });
  assert.equal(guide.isError, undefined);
  assert.ok(guide.structuredContent.sections.length > 0);
  const section = await client.callTool({ name: 'get_guide', arguments: { id: 'agent-workflow', section: guide.structuredContent.sections[0].section } });
  assert.equal(section.isError, undefined);
  assert.ok(section.structuredContent.content.length > 0);
  const pattern = await client.callTool({ name: 'get_pattern', arguments: { id: 'resizable-panel' } });
  assert.equal(pattern.isError, undefined);
  assert.ok(pattern.structuredContent.exampleFiles.includes('patterns/resizable-panel.mjs'));
  assert.equal((await client.callTool({ name: 'get_project_context', arguments: { projectId: 'test-project' } })).structuredContent.linked, false);
  assert.equal((await client.callTool({ name: 'check_project', arguments: { projectId: 'test-project' } })).structuredContent.valid, false);
  const {problem,approach,...legacy}=sample();
  const heuristic={...legacy,schemaVersion:2,context:problem,heuristic:approach,rationale:'En korrigeret tilgang gør ejerskab eksplicit.'};
  const proposed = await client.callTool({ name: 'propose_experience', arguments: { experience: heuristic } });
  assert.equal(proposed.structuredContent.status, 'draft');
  const experience = await client.callTool({ name: 'get_experience', arguments: { id: 'gpu-sample' } });
  assert.equal(experience.structuredContent.experience.id, 'gpu-sample');
  assert.equal(experience.structuredContent.sourceStatus, 'unavailable');
  const sourceCheck = await client.callTool({ name: 'check_experience_sources', arguments: { id: 'gpu-sample' } });
  assert.equal(sourceCheck.isError, undefined);
  assert.deepEqual(sourceCheck.structuredContent.sourceChecks, experience.structuredContent.sourceChecks);
  assert.equal((await client.callTool({ name: 'check_experience_sources', arguments: { id: 'unknown-experience' } })).isError, true);
  assert.equal((await client.callTool({ name: 'search_experiences', arguments: { query: 'gpu' } })).structuredContent.total, 1);
  assert.equal((await client.callTool({ name: 'get_project_context', arguments: { projectId: 'unknown' } })).isError, true);
  assert.equal((await client.callTool({ name: 'search_library', arguments: { query: 'button', limit: 1000 } })).isError, true);
  assert.equal((await client.callTool({ name: 'propose_experience', arguments: { experience: { ...sample('second'), status: 'reviewed' } } })).isError, true);
  const created=await client.callTool({name:'create_ticket',arguments:{ticket:{type:'enhancement',title:'Tydeligere panelgreb',area:'Paneler',description:'Grebet bør kunne findes i lukket tilstand.',requestedChange:'Vis en diskret trekant.',actor:'regression',relations:{components:['button'],patterns:['resizable-panel']}}}});
  assert.equal(created.isError,undefined);
  const ticket=created.structuredContent.ticket;
  assert.equal((await client.callTool({name:'search_tickets',arguments:{query:'panelgreb'}})).structuredContent.total,1);
  assert.equal((await client.callTool({name:'get_ticket',arguments:{id:ticket.id}})).structuredContent.ticket.revision,1);
  const componentContext=(await client.callTool({name:'get_component',arguments:{id:'button'}})).structuredContent.relatedTickets;
  assert.equal(componentContext.total,1);assert.equal(componentContext.results[0].id,ticket.id);
  const patternContext=(await client.callTool({name:'search_library',arguments:{query:'resizable-panel'}})).structuredContent.results[0].relatedTickets;
  assert.equal(patternContext.total,1);assert.equal(patternContext.results[0].id,ticket.id);
  const updated=await client.callTool({name:'update_ticket',arguments:{id:ticket.id,expectedRevision:1,actor:'reviewer',changes:{status:'accepted'},note:'Gennemgået.'}});
  assert.equal(updated.structuredContent.ticket.revision,2);
  assert.equal((await client.callTool({name:'update_ticket',arguments:{id:ticket.id,expectedRevision:1,actor:'anden',changes:{priority:'high'}}})).isError,true);
});

test('startup arguments cannot add implicit, duplicate or relative project permissions', async () => {
  assert.deepEqual(parseProjectArguments(['--project', 'formlab=' + STUDIO_ROOT]), [{ id: 'formlab', directory: STUDIO_ROOT }]);
  assert.throws(() => parseProjectArguments(['--project']), /Brug --project/);
  assert.throws(() => parseProjectArguments(['--shell', 'anything']), /Brug --project/);
  await assert.rejects(createCollaborationService({ projects: [{ id: 'extra', directory: 'relative' }] }), /absolut/);
  await assert.rejects(createCollaborationService({ projects: [{ id: 'stade', directory: STUDIO_ROOT }] }), /unikt/);
});

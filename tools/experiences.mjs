import { readFile, stat } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createCollaborationService, experienceRevision } from '../collaboration/service.mjs';
import { experienceSchema } from '../collaboration/schema.mjs';
import { parseProjectArguments } from './mcp-server.mjs';

const help = `Stades erfaringsgennemgang
  node tools/experiences.mjs list [--status draft|reviewed|retired]
  node tools/experiences.mjs show ID
  node tools/experiences.mjs review ID [--entry FILE] [--date YYYY-MM-DD]
  node tools/experiences.mjs retire ID --reason TEKST [--entry FILE]

review og retire viser ændringen uden at gemme. Tilføj --apply og
--expect AENDRINGSNOEGLE fra forhåndsvisningen for at anvende den.
Tilføj --project ID=ABSOLUTE_PATH for hvert tilladt kildeprojekt.
--entry læser en komplet, redigeret erfaringspost som JSON.
Genbyg Stade efter anvendelse for at opdatere offlineoversigten.`;

function argumentsFor(args) {
  const [command, ...rest] = args;
  if (!command || command === '--help') return { command: 'help' };
  if (!['list', 'show', 'review', 'retire'].includes(command)) throw new Error('Ukendt handling. Brug --help.');
  const options = {}, projects = [];
  let id;
  for (let at = 0; at < rest.length; at++) {
    const flag = rest[at];
    if (!flag.startsWith('--')) {
      if (id || command === 'list') throw new Error('Angiv præcis ét erfarings-id.');
      id = flag; continue;
    }
    if (flag === '--apply') {
      if (options.apply) throw new Error('Gentaget --apply.');
      options.apply = true; continue;
    }
    if (!['--status', '--entry', '--date', '--reason', '--expect', '--project'].includes(flag)) throw new Error('Ukendt valg: ' + flag);
    const value = rest[++at];
    if (!value || value.startsWith('--')) throw new Error('Der mangler en værdi til ' + flag);
    if (flag === '--project') { projects.push(flag, value); continue; }
    const key = flag.slice(2);
    if (key in options) throw new Error('Gentaget valg: ' + flag);
    options[key] = value;
  }
  if (command !== 'list' && !id) throw new Error('Erfarings-id mangler.');
  const allowed = command === 'list' ? ['status'] : command === 'show' ? [] : ['entry', 'date', 'expect', 'apply', ...(command === 'retire' ? ['reason'] : [])];
  for (const key of Object.keys(options)) if (!allowed.includes(key)) throw new Error('--' + key + ' gælder ikke for ' + command);
  if (options.status && !['draft', 'reviewed', 'retired'].includes(options.status)) throw new Error('Ukendt status.');
  if (options.expect && !/^[a-f0-9]{64}$/.test(options.expect)) throw new Error('--expect skal være ændringsnøglen fra forhåndsvisningen.');
  if (options.apply && !options.expect) throw new Error('--apply kræver --expect fra en gennemgået forhåndsvisning.');
  if (command === 'retire' && !options.reason?.trim()) throw new Error('Udfasning kræver en forklaring med --reason.');
  return { command, id, options, projects: parseProjectArguments(projects) };
}

export async function runExperienceCLI(args, { service, log = console.log } = {}) {
  const { command, id, options, projects } = argumentsFor(args);
  if (command === 'help') { log(help); return; }
  const knowledge = service ?? await createCollaborationService({ projects, allowCuration: Boolean(options.apply) });
  let result;
  if (command === 'list') {
    result = await knowledge.searchExperiences({ status: options.status ?? 'draft', limit: 20 });
  } else {
    const current = await knowledge.getExperience({ id });
    const revision = experienceRevision(current.experience);
    if (command === 'show') result = { ...current, revision };
    else {
      let entry = current.experience;
      if (options.entry) {
        if ((await stat(options.entry)).size > 96 * 1024) throw new Error('Den redigerede post må højst fylde 96 KiB.');
        entry = experienceSchema.parse(JSON.parse((await readFile(options.entry, 'utf8')).replace(/^\uFEFF/, '')));
      }
      if (entry.id !== id) throw new Error('Den redigerede post skal beholde sit erfarings-id.');
      const reason = options.reason && 'Udgået: ' + options.reason.trim();
      const experience = experienceSchema.parse({ ...entry,
        status: command === 'review' ? 'reviewed' : 'retired',
        updatedAt: options.date ?? new Date().toISOString().slice(0, 10),
        limits: reason && !entry.limits.includes(reason) ? [reason, ...entry.limits] : entry.limits,
      });
      // Bind both the current post and the exact proposed content, including
      // entry-file edits, retirement reason and date, to the reviewed preview.
      const expectedChange = createHash('sha256').update(JSON.stringify([revision, experienceRevision(experience)])).digest('hex');
      if (options.expect && options.expect !== expectedChange) throw new Error('Erfaringen eller den foreslåede ændring er ændret. Lav en ny forhåndsvisning før anvendelse.');
      result = options.apply
        ? await knowledge.curateExperience({ id, expectedRevision: revision, experience })
        : { preview: true, id, expectedRevision: revision, expectedChange, currentSourceStatus: current.sourceStatus, currentSourceChecks: current.sourceChecks, experience,
          note: 'Intet er gemt. Gennemgå indhold, belæg og begrænsninger. Anvend de samme valg med --apply --expect ' + expectedChange + '. Ved anvendelse kontrolleres den foreslåede posts kilder igen.' };
    }
  }
  log(JSON.stringify(result, null, 2));
  return result;
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  runExperienceCLI(process.argv.slice(2)).catch(error => { console.error('Stade: ' + error.message); process.exitCode = 1; });
}

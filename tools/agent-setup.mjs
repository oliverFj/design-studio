import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { TOOL_PACKAGES } from '../collaboration/catalog.mjs';
import { planConnection, applyConnection, inspectConnection } from './agent-connection.mjs';
import { planSkills, applySkills } from './agent-skills.mjs';

const studioRoot = fileURLToPath(new URL('../', import.meta.url));
const HELP = `Stade: MCP og skills til dine projekter
  npm run agents -- install [--project ID=ABSOLUTE_PATH] [--skill NAVN]
  npm run agents -- install --dry-run
  npm run agents -- status [--probe]

install tilknytter den centrale MCP og den fælles stade-collaboration-skill.
Gentag --project for flere udtrykkeligt valgte projekter. Eksisterende adgang
bevares; navne ombindes ikke til andre mapper. --skill tilføjer fx
formlab-material-gpu. Gentag install for at opdatere uændrede, administrerede
skills. Lokale ændringer og andre Codex-indstillinger bevares.

--dry-run viser ændringer uden at gemme. --probe afprøver serveren, men kan
ikke afgøre, hvad en allerede åben chat har indlæst.
Avanceret: --codex-home MAPPE, --skills-dir MAPPE.`;

function parseArguments(args) {
  const [command = 'help', ...rest] = args;
  if (['help', '--help'].includes(command)) return { command: 'help' };
  if (!['install', 'status'].includes(command)) throw new Error('Ukendt handling. Brug --help.');
  const options = { command, projects: [], skills: ['stade-collaboration'] };
  const names = new Set();
  for (let at = 0; at < rest.length; at++) {
    const flag = rest[at];
    if (['--dry-run', '--probe'].includes(flag)) {
      const key = flag === '--dry-run' ? 'dryRun' : 'probe';
      if (options[key]) throw new Error('Gentaget valg: ' + flag);
      options[key] = true; continue;
    }
    if (!['--project', '--skill', '--codex-home', '--skills-dir'].includes(flag)) throw new Error('Ukendt valg: ' + flag);
    const value = rest[++at];
    if (!value || value.startsWith('--')) throw new Error('Der mangler en værdi til ' + flag);
    if (flag === '--project') {
      const split = value.indexOf('=');
      if (split < 1 || !path.isAbsolute(value.slice(split + 1))) throw new Error('Brug --project ID=ABSOLUTE_PATH.');
      const id = value.slice(0, split);
      if (names.has(id)) throw new Error('Gentaget projekt-id: ' + id);
      names.add(id); options.projects.push({ id, directory: value.slice(split + 1) });
    } else if (flag === '--skill') options.skills.push(value);
    else {
      const key = { '--codex-home': 'codexHome', '--skills-dir': 'skillsDir' }[flag];
      if (options[key]) throw new Error('Gentaget valg: ' + flag);
      options[key] = value;
    }
  }
  if (command === 'status' && (options.dryRun || options.projects.length)) throw new Error('status ændrer ikke projekter; brug install --dry-run.');
  if (command === 'install' && options.probe) throw new Error('install afprøver allerede serveren; brug status --probe til et særskilt tjek.');
  options.skills = [...new Set(options.skills)];
  options.codexHome = path.resolve(options.codexHome ?? process.env.CODEX_HOME ?? path.join(os.homedir(), '.codex'));
  if (options.skillsDir) options.skillsDir = path.resolve(options.skillsDir);
  return options;
}

async function probeServer(connection) {
  if (connection.enabled === false) return { reached: false, skipped: true, note: 'Forbindelsen er fravalgt i Codex. Indstillingen er bevaret.' };
  const transport = new StdioClientTransport({ command: connection.command, args: connection.args, cwd: studioRoot, stderr: 'pipe' });
  transport.stderr?.resume();
  const client = new Client({ name: 'stade-installation-check', version: '1.0.0' });
  try {
    await client.connect(transport);
    const { tools } = await client.listTools();
    const names = tools.map(tool => tool.name);
    if (TOOL_PACKAGES.flatMap(pack => pack.tools).some(tool => !names.includes(tool.name))) throw new Error('Serveren leverer ikke det forventede Stade-katalog.');
    const context = await client.callTool({ name: 'get_project_context', arguments: { projectId: 'stade' } });
    if (context.isError) throw new Error('Stades projektgrundlag kunne ikke hentes.');
    return { reached: true, tools: names.length, libraryVersion: context.structuredContent.libraryVersion, note: 'Serveren er afprøvet i en separat klient. Aktive værktøjer og skills i den aktuelle chat skal kontrolleres dér.' };
  } finally { await client.close(); }
}

export async function runAgentSetup(args, { connection = { planConnection, applyConnection, inspectConnection }, skillInstaller = { planSkills, applySkills }, probe = probeServer, log = console.log } = {}) {
  const options = parseArguments(args);
  if (options.command === 'help') { log(HELP); return; }
  const settings = { studioRoot, codexHome: options.codexHome, projects: options.projects };
  const skillSettings = { studioRoot, codexHome: options.codexHome, skills: options.skills, ...(options.skillsDir ? { skillsDir: options.skillsDir } : {}) };
  let result;
  if (options.command === 'status') {
    const current = await connection.inspectConnection(settings);
    const skills = await skillInstaller.planSkills(skillSettings);
    result = { connection: current, skills: skills.skills, conflicts: skills.conflicts, ...(options.probe && current.registered ? { serverCheck: await probe(current) } : {}), note: 'Status viser lokal opsætning. Det er ikke en måling af den aktuelle chats indlæste værktøjer.' };
  } else {
    const plannedConnection = await connection.planConnection(settings);
    const plannedSkills = await skillInstaller.planSkills(skillSettings);
    if (options.dryRun) result = { dryRun: true, connection: plannedConnection, skills: plannedSkills.skills, conflicts: plannedSkills.conflicts };
    else {
      if (plannedSkills.conflicts.length) throw new Error('Skills har lokale ændringer eller filkonflikter. Intet er installeret; se install --dry-run.');
      const installedConnection = await connection.applyConnection(plannedConnection);
      let installedSkills;
      try { installedSkills = await skillInstaller.applySkills(plannedSkills); }
      catch (error) { throw new Error('MCP-opsætningen er behandlet, men skills blev ikke færdiginstalleret: ' + error.message + ' Kør status før et nyt forsøg.'); }
      const serverCheck = await probe(plannedConnection);
      result = { connection: installedConnection, skills: installedSkills, serverCheck, note: 'Installationen er behandlet. Nye eller ændrede skills bliver tilgængelige, når agentappen indlæser dem. Kontrollér værktøjer og skills i en ny chat; genstart appen, hvis ændringerne ikke er indlæst.' };
    }
  }
  log(JSON.stringify(result, null, 2));
  return result;
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  runAgentSetup(process.argv.slice(2)).catch(error => { console.error('Stade: ' + error.message); process.exitCode = 1; });
}

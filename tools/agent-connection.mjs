import { promises as fs } from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { parse, stringify } from 'smol-toml';

const plans = new WeakMap();
const MAX_CONFIG_BYTES = 2 * 1024 * 1024;
const revision = bytes => createHash('sha256').update(bytes ?? Buffer.alloc(0)).digest('hex');
const samePath = (left, right) => process.platform === 'win32'
  ? path.resolve(left).toLowerCase() === path.resolve(right).toLowerCase()
  : path.resolve(left) === path.resolve(right);
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const projectId = id => typeof id === 'string' && id !== 'stade' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id);

async function checkProfileDirectory(home) {
  const absolute = path.resolve(home), root = path.parse(absolute).root;
  let directory = root;
  for (const segment of absolute.slice(root.length).split(path.sep).filter(Boolean)) {
    directory = path.join(directory, segment);
    try {
      const info = await fs.lstat(directory);
      if (info.isSymbolicLink() || !info.isDirectory()) throw new Error('Codex-profilens mappe og overmapper må ikke være links eller andre filtyper.');
    } catch (error) { if (error.code === 'ENOENT') return; throw error; }
  }
}

async function readConfig(file) {
  let info;
  try { info = await fs.lstat(file); }
  catch (error) { if (error.code === 'ENOENT') return { bytes: null, data: {}, mode: 0o600 }; throw error; }
  if (!info.isFile() || info.isSymbolicLink()) throw new Error('Codex-konfigurationen skal være en almindelig fil, ikke et link.');
  const handle = await fs.open(file, 'r');
  let bytes;
  try {
    if ((await handle.stat()).size > MAX_CONFIG_BYTES) throw new Error('Codex-konfigurationen overstiger 2 MiB.');
    const buffer = Buffer.alloc(MAX_CONFIG_BYTES + 1);
    let used = 0;
    while (used < buffer.length) {
      const { bytesRead } = await handle.read(buffer, used, buffer.length - used, null);
      if (!bytesRead) break;
      used += bytesRead;
    }
    if (used > MAX_CONFIG_BYTES) throw new Error('Codex-konfigurationen overstiger 2 MiB.');
    bytes = buffer.subarray(0, used);
  } finally { await handle.close(); }
  let data;
  try { data = parse(bytes.toString('utf8').replace(/^\uFEFF/, '')); }
  catch { throw new Error('Codex-konfigurationen er ikke gyldig TOML. Ingen indstillinger er ændret.'); }
  return { bytes, data, mode: info.mode & 0o777 };
}

async function normalizedProject(project, { required, warnings }) {
  if (!projectId(project?.id) || typeof project.directory !== 'string' || !path.isAbsolute(project.directory)) throw new Error('Projekter kræver et gyldigt id og en absolut mappesti.');
  let directory = path.resolve(project.directory);
  try {
    directory = await fs.realpath(directory);
    if (!(await fs.stat(directory)).isDirectory()) throw new Error('Projektets sti er ikke en mappe: ' + project.id);
  } catch (error) {
    if (required || error.code !== 'ENOENT') throw error;
    warnings.push('Det eksisterende projekt ' + project.id + ' kan ikke findes. Dets adgang er bevaret; ret stien særskilt, hvis projektet er flyttet.');
  }
  return Object.freeze({ id: project.id, directory });
}

function existingArguments(existing, serverFile) {
  if (!isObject(existing) || typeof existing.command !== 'string' || !['node', 'node.exe'].includes(path.basename(existing.command).toLowerCase()) || typeof existing.url === 'string') throw new Error('Navnet stade bruges af en anden type forbindelse. Den bliver ikke overskrevet.');
  if (!Array.isArray(existing.args) || existing.args.some(value => typeof value !== 'string') || !path.isAbsolute(existing.args[0] ?? '') || !samePath(existing.args[0], serverFile)) throw new Error('Den eksisterende stade-forbindelse peger på en anden server. Den bliver ikke overskrevet.');
  const projects = [];
  for (let index = 1; index < existing.args.length; index += 2) {
    const value = existing.args[index + 1];
    if (existing.args[index] !== '--project' || typeof value !== 'string' || !value.includes('=')) throw new Error('Stade-forbindelsen har ukendte startargumenter. Gennemgå opsætningen manuelt.');
    const separator = value.indexOf('=');
    projects.push({ id: value.slice(0, separator), directory: value.slice(separator + 1) });
  }
  return projects;
}

/** Plan a single, global Stade connection without exposing the rest of config.toml. */
export async function planConnection({ studioRoot, codexHome, projects = [] } = {}) {
  if (typeof studioRoot !== 'string' || !path.isAbsolute(studioRoot) || typeof codexHome !== 'string' || !path.isAbsolute(codexHome)) throw new Error('Angiv absolutte stier til Stade og Codex-profilen.');
  const root = await fs.realpath(studioRoot);
  const serverFile = path.join(root, 'tools', 'mcp-server.mjs');
  if (!(await fs.stat(serverFile)).isFile() || !samePath(await fs.realpath(serverFile), serverFile)) throw new Error('Stades MCP-indgang skal være en almindelig fil i det valgte checkout.');
  const home = path.resolve(codexHome);
  await checkProfileDirectory(home);
  const configFile = path.join(home, 'config.toml');
  const snapshot = await readConfig(configFile);
  if (snapshot.data.mcp_servers !== undefined && !isObject(snapshot.data.mcp_servers)) throw new Error('Codex-konfigurationens mcp_servers skal være en tabel.');
  const existing = snapshot.data.mcp_servers?.stade;
  const warnings = [];
  const existingProjects = [];
  const combined = new Map();
  for (const registered of existing === undefined ? [] : existingArguments(existing, serverFile)) {
    const project = await normalizedProject(registered, { required: false, warnings });
    if (combined.has(project.id) && !samePath(combined.get(project.id).directory, project.directory)) throw new Error('Et eksisterende projekt-id peger på flere mapper: ' + project.id);
    if (!combined.has(project.id)) existingProjects.push(project);
    combined.set(project.id, project);
  }
  if (!Array.isArray(projects)) throw new Error('Projekter skal være en liste.');
  for (const requested of projects) {
    const project = await normalizedProject(requested, { required: true, warnings });
    if (combined.has(project.id) && !samePath(combined.get(project.id).directory, project.directory)) throw new Error('Projekt-id kan ikke flyttes til en ny mappe under installation: ' + project.id);
    combined.set(project.id, project);
  }
  const command = existing?.command ?? process.execPath;
  const args = [serverFile, ...[...combined.values()].flatMap(project => ['--project', project.id + '=' + project.directory])];
  const changed = existing === undefined || JSON.stringify(existing.args) !== JSON.stringify(args);
  if (existing?.enabled === false) warnings.push('Stade er deaktiveret i Codex. Installationen bevarer dette valg.');
  const plan = Object.freeze({
    studioRoot: root, codexHome: home, configFile,
    command, args: Object.freeze(args), existingProjects: Object.freeze(existingProjects), projects: Object.freeze([...combined.values()]),
    registered: existing !== undefined, enabled: existing === undefined || existing.enabled !== false, changed,
    configRevision: revision(snapshot.bytes), warnings: Object.freeze(warnings),
    notes: Object.freeze(['Eksisterende værktøjsbegrænsninger, godkendelsesregler, miljø og øvrige Codex-indstillinger bevares.', 'TOML-format og kommentarer kan blive omformateret; indstillingernes betydning bevares.', 'Start en ny chat eller genindlæs klienten for at indlæse en ændret forbindelse.']),
  });
  plans.set(plan, { snapshot, command, args, configFile, home });
  return plan;
}

async function renameConfig(temporary, file) {
  for (let attempt = 0; ; attempt++) {
    try { await fs.rename(temporary, file); return; }
    catch (error) {
      if (process.platform !== 'win32' || !['EPERM', 'EACCES', 'EBUSY'].includes(error.code) || attempt >= 4) throw error;
      await delay(10 * 2 ** attempt);
    }
  }
}

/** Apply only an in-process plan, after confirming the complete profile snapshot. */
export async function applyConnection(plan) {
  const prepared = plans.get(plan);
  if (!prepared) throw new Error('Forbindelsesplanen skal oprettes i samme proces med planConnection.');
  const { snapshot, command, args, configFile, home } = prepared;
  const checkSnapshot = async () => {
    await checkProfileDirectory(home);
    const current = await readConfig(configFile);
    if ((current.bytes === null) !== (snapshot.bytes === null) || revision(current.bytes) !== revision(snapshot.bytes)) throw new Error('Codex-konfigurationen er ændret siden forhåndsvisningen. Opret og gennemgå en ny plan.');
  };
  await checkSnapshot();
  if (!plan.changed) return { changed: false, configFile, backupFile: null };
  await fs.mkdir(home, { recursive: true });
  await checkProfileDirectory(home);
  const lockFile = path.join(home, 'config.toml.stade-lock');
  const lock = await fs.open(lockFile, 'wx').catch(error => { if (error.code === 'EEXIST') throw new Error('En anden Stade-installation har låst Codex-profilen. Kontrollér processen før en efterladt config.toml.stade-lock fjernes.'); throw error; });
  let temporary;
  try {
    await checkSnapshot();
    // Keep parser-native date/time values and all unknown policy tables intact.
    const updated = { ...snapshot.data, mcp_servers: { ...(snapshot.data.mcp_servers ?? {}), stade: { ...(snapshot.data.mcp_servers?.stade ?? {}), command, args } } };
    const text = stringify(updated);
    if (Buffer.byteLength(text) > MAX_CONFIG_BYTES) throw new Error('Den opdaterede Codex-konfiguration overstiger 2 MiB.');
    let backupFile = null;
    if (snapshot.bytes !== null) {
      backupFile = path.join(home, 'config.toml.stade-backup-' + randomUUID() + '.bak');
      await fs.writeFile(backupFile, snapshot.bytes, { flag: 'wx', mode: 0o600 });
    }
    temporary = path.join(home, '.stade-config-' + randomUUID() + '.tmp');
    const handle = await fs.open(temporary, 'wx', snapshot.mode || 0o600);
    try { await handle.writeFile(text, 'utf8'); await handle.sync(); } finally { await handle.close(); }
    await checkSnapshot();
    if (snapshot.bytes === null) await fs.link(temporary, configFile);
    else await renameConfig(temporary, configFile);
    return { changed: true, configFile, backupFile };
  } finally {
    if (temporary) await fs.unlink(temporary).catch(error => { if (error.code !== 'ENOENT') throw error; });
    await lock.close();
    await fs.unlink(lockFile);
  }
}

export async function inspectConnection(options) {
  const plan = await planConnection({ ...options, projects: [] });
  return { registered: plan.registered, enabled: plan.enabled, changed: plan.changed, command: plan.command, args: plan.args, projects: plan.projects, configRevision: plan.configRevision, configFile: plan.configFile, warnings: plan.warnings, notes: plan.notes };
}


import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawn } from 'node:child_process';
import { createStudioServer } from '../server.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const normalize = file => process.platform === 'win32' ? path.resolve(file).toLowerCase() : path.resolve(file);
const samePath = (a, b) => typeof a === 'string' && typeof b === 'string' && normalize(a) === normalize(b);

async function readLocalJSON(url) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(1200), redirect: 'error' });
    if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) return null;
    const reader = response.body.getReader();
    const chunks = [];
    let length = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        length += value.byteLength;
        if (length > 1024 * 1024) { await reader.cancel(); return null; }
        chunks.push(value);
      }
    } finally { reader.releaseLock(); }
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch { return null; }
}

/** Identify our own running instance, including servers started before /api/status existed. */
export async function findRunningStudio(url, { rootDir, projectPath = null }) {
  const root = await fs.realpath(rootDir);
  const project = projectPath ? await fs.realpath(path.resolve(projectPath)) : null;
  const status = await readLocalJSON(url + '/api/status');
  if (status) {
    return status.app === 'design-studio' && samePath(status.root, root)
      && (project ? samePath(status.projectFile, project) : status.projectFile === null);
  }
  const legacy = await readLocalJSON(url + '/api/packages');
  if (!legacy || !Array.isArray(legacy.packages) || legacy.packages.length === 0
      || legacy.activeProject !== (project ? '@project' : null)) return false;
  let foundProject = false;
  for (const pack of legacy.packages) {
    if (!pack || typeof pack.key !== 'string' || typeof pack.file !== 'string') return false;
    if (pack.key === '@project') {
      if (!project || !samePath(pack.file, project)) return false;
      foundProject = true;
    } else {
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(pack.key)
          || !samePath(pack.file, path.join(root, 'packages', pack.key + '.json'))) return false;
    }
    try { if (!samePath(await fs.realpath(pack.file), pack.file)) return false; } catch { return false; }
  }
  return project ? foundProject : true;
}

function listenAt(server, port) {
  return new Promise((resolve, reject) => {
    const failed = error => { server.off('listening', ready); reject(error); };
    const ready = () => { server.off('error', failed); resolve(); };
    server.once('error', failed);
    server.once('listening', ready);
    server.listen(port, '127.0.0.1');
  });
}

export function openBrowser(url) {
  const command = process.platform === 'win32' ? 'rundll32.exe' : process.platform === 'darwin' ? 'open' : 'xdg-open';
  const args = process.platform === 'win32' ? ['url.dll,FileProtocolHandler', url] : [url];
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { windowsHide: true, detached: true, stdio: 'ignore' });
    child.once('error', reject);
    child.once('spawn', () => { child.unref(); resolve(); });
  });
}

/** Reuse a matching studio; otherwise start without disturbing any occupied port. */
export async function launchStudio({ port = 3000, projectPath = null, rootDir = ROOT, open = true, browserOpener = openBrowser, logger = console.log } = {}) {
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('Porten skal være et tal mellem 1 og 65535.');
  const server = await createStudioServer({ rootDir, projectPath });
  let reused = false;
  let url;
  try {
    await listenAt(server, port);
  } catch (error) {
    if (error.code !== 'EADDRINUSE') throw error;
    url = 'http://127.0.0.1:' + port;
    reused = await findRunningStudio(url, { rootDir, projectPath });
    if (!reused) {
      await listenAt(server, 0);
      logger('Den valgte port er optaget. Design Studio starter på en ledig port.');
    }
  }
  if (!reused) url = 'http://127.0.0.1:' + server.address().port;
  logger(reused ? 'Design Studio kører allerede. Åbner den eksisterende udgave.' : 'Hold dette vindue åbent, mens du bruger Design Studio.');
  logger('Design Studio: ' + url);
  if (open) {
    try { await browserOpener(url); }
    catch { logger('Browseren kunne ikke åbnes automatisk. Åbn adressen ovenfor.'); }
  }
  return { server: reused ? null : server, url, reused };
}

export function parseLaunchArgs(args) {
  const options = { port: 3000, projectPath: null, open: true };
  for (let index = 0; index < args.length; index++) {
    const argument = args[index];
    if (argument === '--port') {
      options.port = Number(args[++index]);
      if (!Number.isInteger(options.port) || options.port < 1 || options.port > 65535) throw new Error('--port skal være et tal mellem 1 og 65535.');
    } else if (argument === '--project') {
      options.projectPath = args[++index];
      if (!options.projectPath || options.projectPath.startsWith('--')) throw new Error('Angiv en designfil efter --project.');
    } else if (argument === '--no-open') options.open = false;
    else if (argument === '--help' || argument === '-h') options.help = true;
    else throw new Error('Ukendt argument: ' + argument);
  }
  return options;
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  const main = async () => {
    const options = parseLaunchArgs(process.argv.slice(2));
    if (options.help) { console.log('node tools/launch.mjs [--port 3000] [--project design.json] [--no-open]'); return; }
    await launchStudio(options);
  };
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}


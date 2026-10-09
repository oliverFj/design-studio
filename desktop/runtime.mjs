import { promises as fs } from 'node:fs';
import path from 'node:path';
import { createStudioServer } from '../server.mjs';

// Electron supports readFile/readdir inside asar; native directory copy does not.
async function copyBundledDirectory(source, destination) {
  await fs.mkdir(destination, { recursive: true });
  for (const entry of await fs.readdir(source, { withFileTypes: true })) {
    const input = path.join(source, entry.name);
    const output = path.join(destination, entry.name);
    if (entry.isDirectory()) await copyBundledDirectory(input, output);
    else if (entry.isFile()) await fs.writeFile(output, await fs.readFile(input));
  }
}

/** Bundled applications keep editable themes outside the portable extraction. */
export async function prepareDesktopRoot({ sourceRoot, dataRoot }) {
  await fs.mkdir(dataRoot, { recursive: true });
  for (const name of ['core', 'studio', 'assets']) {
    await copyBundledDirectory(path.join(sourceRoot, name), path.join(dataRoot, name));
  }
  const packages = path.join(dataRoot, 'packages');
  await fs.mkdir(packages, { recursive: true });
  for (const entry of await fs.readdir(path.join(sourceRoot, 'packages'), { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.json')) continue;
    try {
      await fs.writeFile(path.join(packages, entry.name), await fs.readFile(path.join(sourceRoot, 'packages', entry.name)), { flag: 'wx' });
    } catch (error) { if (error.code !== 'EEXIST') throw error; }
  }
  return fs.realpath(dataRoot);
}

/** Only recognize an adjacent complete Studio checkout, never a renderer supplied path. */
export async function findAdjacentWorkspace(executable) {
  const candidates = [path.dirname(executable), path.resolve(path.dirname(executable), '..', '..'), path.resolve(path.dirname(executable), '..', '..', '..')];
  for (const candidate of candidates) {
    try {
      const manifest = JSON.parse(await fs.readFile(path.join(candidate, 'package.json'), 'utf8'));
      if (manifest.name !== 'design-studio-system') continue;
      if (!(await fs.stat(path.join(candidate, 'server.mjs'))).isFile()) continue;
      if (!(await fs.stat(path.join(candidate, 'studio', 'index.html'))).isFile()) continue;
      if (!(await fs.stat(path.join(candidate, 'packages'))).isDirectory()) continue;
      return fs.realpath(candidate);
    } catch { /* Standalone executables use their persistent application directory. */ }
  }
  return null;
}

export function projectArgument(args) {
  const index = args.indexOf('--project');
  if (index < 0) return null;
  const selected = args[index + 1];
  if (!selected || selected.startsWith('--')) throw new Error('Angiv en eksisterende JSON-temafil efter --project.');
  return path.resolve(selected);
}

export function isStudioURL(value, origins) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' && url.hostname === '127.0.0.1' && origins.has(url.origin);
  } catch { return false; }
}

export async function startDesktopServer({ rootDir, projectPath = null }) {
  const server = await createStudioServer({ rootDir, projectPath });
  try {
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolve);
    });
  } catch (error) { await closeDesktopServer(server); throw error; }
  return { server, url: 'http://127.0.0.1:' + server.address().port, projectPath };
}

export async function closeDesktopServer(server) {
  if (!server?.listening) return;
  server.closeIdleConnections?.();
  await new Promise((resolve, reject) => {
    server.close(error => error ? reject(error) : resolve());
    server.closeAllConnections?.();
  });
}

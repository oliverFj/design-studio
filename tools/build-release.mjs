import { readFile, readdir, lstat, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { deflateRawSync } from 'node:zlib';
import { LIBRARY_VERSION } from '../core/library.mjs';
import { offlineIssues } from './offline-checks.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const rootFiles = new Set(['AGENTS.md', 'README.md', '.gitignore', 'package.json', 'package-lock.json']);
const sourceTypes = new Map([
  ['core', ['.mjs']], ['studio', ['.mjs', '.css', '.html']], ['showcase', ['.mjs', '.css', '.html']], ['packages', ['.json']],
  ['schema', ['.json']], ['patterns', ['.mjs', '.css']], ['tools', ['.mjs']],
  ['docs', ['.md']], ['tests', ['.mjs']], ['licenses', ['.txt', '.md']],
  ['assets', ['.css', '.ttf', '.woff', '.woff2', '.svg', '.txt', '.json']],
  ['.github', ['.yml', '.yaml']], ['examples', ['.mjs', '.css', '.html']],
  ['templates', ['.mjs', '.css', '.html', '.json']],
]);
const excludedDirectory = name => name === 'node_modules' || name.startsWith('.') && name !== '.github';
const sha256 = data => createHash('sha256').update(data).digest('hex');
const crcTable = Array.from({ length: 256 }, (_, index) => {
  let value = index; for (let bit = 0; bit < 8; bit++) value = value & 1 ? 0xedb88320 ^ value >>> 1 : value >>> 1;
  return value >>> 0;
});
const crc32 = data => {
  let value = 0xffffffff; for (const byte of data) value = crcTable[(value ^ byte) & 255] ^ value >>> 8;
  return (value ^ 0xffffffff) >>> 0;
};

/** Small deterministic ZIP writer for these bounded release files (no ZIP64). */
export function createZip(entries) {
  const records = [], central = []; let offset = 0;
  const names = new Set();
  if (entries.length > 65535) throw new Error('For mange filer i leveringspakken.');
  for (const { name, data: input } of [...entries].sort((a, b) => a.name.localeCompare(b.name, 'en'))) {
    if (!name || name.startsWith('/') || name.includes('\\') || name.includes(':') || name.split('/').some(part => !part || part === '.' || part === '..') || names.has(name.toLowerCase())) throw new Error('Ugyldigt eller dubleret ZIP-filnavn: ' + name);
    names.add(name.toLowerCase());
    const filename = Buffer.from(name), data = Buffer.from(input), compressed = deflateRawSync(data, { level: 9 }), crc = crc32(data);
    if (filename.length > 65535 || data.length > 0xffffffff || compressed.length > 0xffffffff || offset > 0xffffffff) throw new Error('Leveringspakken kræver ZIP64.');
    const local = Buffer.alloc(30); local.writeUInt32LE(0x04034b50); local.writeUInt16LE(20, 4); local.writeUInt16LE(0x0800, 6); local.writeUInt16LE(8, 8); local.writeUInt16LE(33, 12);
    local.writeUInt32LE(crc, 14); local.writeUInt32LE(compressed.length, 18); local.writeUInt32LE(data.length, 22); local.writeUInt16LE(filename.length, 26);
    records.push(local, filename, compressed);
    const header = Buffer.alloc(46); header.writeUInt32LE(0x02014b50); header.writeUInt16LE(20, 4); header.writeUInt16LE(20, 6); header.writeUInt16LE(0x0800, 8); header.writeUInt16LE(8, 10); header.writeUInt16LE(33, 14);
    header.writeUInt32LE(crc, 16); header.writeUInt32LE(compressed.length, 20); header.writeUInt32LE(data.length, 24); header.writeUInt16LE(filename.length, 28); header.writeUInt32LE(offset, 42);
    central.push(header, filename); offset += local.length + filename.length + compressed.length;
  }
  const directory = Buffer.concat(central), end = Buffer.alloc(22);
  if (offset + directory.length > 0xffffffff) throw new Error('Leveringspakken kræver ZIP64.');
  end.writeUInt32LE(0x06054b50); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10); end.writeUInt32LE(directory.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...records, directory, end]);
}

export async function sourceEntries(directory = root) {
  const entries = [];
  const add = async relative => {
    const file = path.join(directory, relative), info = await lstat(file);
    if (!info.isFile() || info.isSymbolicLink()) throw new Error('Kildepakken kræver almindelige filer: ' + relative);
    entries.push({ name: relative.split(path.sep).join('/'), data: await readFile(file) });
  };
  const walk = async (relative, extensions) => {
    const location = path.join(directory, relative), info = await lstat(location);
    if (info.isSymbolicLink() || !info.isDirectory()) throw new Error('Kildepakken kræver almindelige mapper: ' + relative);
    for (const item of await readdir(location, { withFileTypes: true })) {
      if (excludedDirectory(item.name)) continue;
      const child = path.join(relative, item.name), normalized = child.split(path.sep).join('/');
      if (item.isDirectory()) await walk(child, extensions);
      else if (item.isSymbolicLink()) throw new Error('Kildepakken følger ikke symbolske links: ' + child);
      else if (extensions.includes(path.extname(item.name)) && !['examples/workspace/index.html'].includes(normalized)) await add(child);
      else if (normalized === 'templates/offline/.gitignore') await add(child);
    }
  };
  for (const filename of rootFiles) await add(filename);
  for (const [relative, extensions] of sourceTypes) {
    try { await walk(relative, extensions); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  // The hidden starter ignore-file is intentional source, not local settings.
  try { await add('templates/offline/.gitignore'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  return entries;
}

async function licenseEntries(directory) {
  const entries = [];
  const licenses = path.join(directory, 'licenses');
  try {
    for (const name of await readdir(licenses)) {
      const file = path.join(licenses, name), info = await lstat(file);
      if (info.isSymbolicLink()) throw new Error('Licenser må ikke være symbolske links.');
      if (info.isFile() && /\.(txt|md)$/i.test(name)) entries.push({ name: 'licenses/' + name, data: await readFile(file) });
    }
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
  for (const name of (await readdir(path.join(directory, 'packages'))).filter(name => name.endsWith('.json'))) {
    const theme = JSON.parse(await readFile(path.join(directory, 'packages', name), 'utf8'));
    for (const asset of theme.brand?.assets ?? []) if (asset.mimeType === 'text/plain') {
      if (!asset.fileName || asset.fileName.includes('/') || asset.fileName.includes('\\') || asset.fileName.includes(':')) throw new Error('Licensfilen skal have et almindeligt navn.');
      entries.push({ name: 'licenses/' + name.slice(0, -5) + '/' + asset.fileName, data: Buffer.from(asset.data, 'base64') });
    }
  }
  return entries;
}

export async function buildRelease({ directory = root, output = path.join(directory, 'artifacts', 'release') } = {}) {
  const html = await readFile(path.join(directory, 'index.html'));
  const issues = offlineIssues(html.toString('utf8'));
  if (issues.length) throw new Error('Offlinebuildet kan ikke leveres: ' + issues.join('\n'));
  const offline = [{ name: 'index.html', data: html }, ...await licenseEntries(directory)];
  const source = await sourceEntries(directory);
  const artifacts = [
    { name: 'design-studio-offline.zip', entries: offline },
    { name: 'design-studio-source.zip', entries: source },
  ].map(item => ({ ...item, data: createZip(item.entries) }));
  const manifest = {
    libraryVersion: LIBRARY_VERSION,
    archives: artifacts.map(({ name, entries, data }) => ({ name, bytes: data.length, sha256: sha256(data), files: entries.map(entry => ({ name: entry.name, bytes: entry.data.length, sha256: sha256(entry.data) })).sort((a, b) => a.name.localeCompare(b.name, 'en')) })),
  };
  await mkdir(output, { recursive: true });
  for (const artifact of artifacts) await writeFile(path.join(output, artifact.name), artifact.data);
  await writeFile(path.join(output, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  return manifest;
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  const args = process.argv.slice(2);
  if (args.length && (args.length !== 2 || args[0] !== '--out' || !args[1])) throw new Error('Brug build-release.mjs [--out DIRECTORY].');
  const manifest = await buildRelease(args.length ? { output: path.resolve(args[1]) } : {});
  for (const archive of manifest.archives) console.log(archive.name + ' · ' + archive.files.length + ' filer · ' + Math.round(archive.bytes / 1024) + ' KiB');
}

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateRawSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { buildRelease, createZip, sourceEntries } from '../tools/build-release.mjs';
import { testFiles, runTests } from '../tools/run-tests.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const hash = data => createHash('sha256').update(data).digest('hex');
async function fixture(t) {
  const parent = path.join(root, 'artifacts', 'release-tests');
  await mkdir(parent, { recursive: true });
  const directory = await mkdtemp(path.join(parent, 'case-'));
  t.after(async () => {
    assert.ok(path.resolve(directory).startsWith(path.resolve(parent) + path.sep));
    await rm(directory, { recursive: true, force: true });
  });
  const put = async (relative, value) => { await mkdir(path.dirname(path.join(directory, relative)), { recursive: true }); await writeFile(path.join(directory, relative), value); };
  for (const filename of ['AGENTS.md', 'README.md', '.gitignore', 'package.json', 'package-lock.json']) await put(filename, filename.endsWith('.json') ? '{}' : 'Source');
  await put('index.html', '<!doctype html><html><head><title>Offline</title></head><body><button>Open</button><script>/* no external resources */</script></body></html>');
  await put('core/runtime.mjs', 'export const example = true;');
  await put('showcase/index.html', '<!doctype html><title>Showcase</title>');
  await put('showcase/showcase.mjs', 'export const showcase = true;');
  await put('templates/offline/.gitignore', 'node_modules/\nindex.html\n');
  await put('assets/fonts/test.woff2', 'Public font fixture');
  await put('licenses/tabler-icons-MIT.txt', 'MIT license fixture');
  await put('packages/example.json', JSON.stringify({ brand: { assets: [{ mimeType: 'text/plain', fileName: 'OFL.txt', data: Buffer.from('Font license fixture').toString('base64') }] } }));
  return { directory, put };
}

function unzip(buffer) {
  const entries = new Map(); let offset = 0;
  while (buffer.readUInt32LE(offset) === 0x04034b50) {
    const nameLength = buffer.readUInt16LE(offset + 26), extraLength = buffer.readUInt16LE(offset + 28), compressedLength = buffer.readUInt32LE(offset + 18);
    const name = buffer.subarray(offset + 30, offset + 30 + nameLength).toString('utf8');
    const start = offset + 30 + nameLength + extraLength;
    const content = inflateRawSync(buffer.subarray(start, start + compressedLength));
    assert.equal(buffer.readUInt16LE(offset + 6), 0x0800, 'filenames use UTF-8');
    assert.equal(content.length, buffer.readUInt32LE(offset + 22));
    entries.set(name, content); offset = start + compressedLength;
  }
  assert.equal(buffer.readUInt32LE(offset), 0x02014b50, 'central directory follows file records');
  assert.equal(buffer.readUInt32LE(buffer.length - 22), 0x06054b50, 'end-of-directory signature');
  assert.equal(buffer.readUInt32LE(buffer.length - 6), offset, 'central directory offset');
  assert.equal(buffer.readUInt16LE(buffer.length - 12), entries.size);
  return entries;
}

test('release archives preserve bytes, readable licenses, checksums and deterministic output', async t => {
  const { directory } = await fixture(t), output = path.join(directory, 'artifacts', 'release');
  const manifest = await buildRelease({ directory, output });
  for (const item of manifest.archives) {
    const zip = await readFile(path.join(output, item.name));
    assert.equal(zip.length, item.bytes); assert.equal(hash(zip), item.sha256);
    const files = unzip(zip);
    for (const file of item.files) { assert.equal(files.get(file.name).length, file.bytes); assert.equal(hash(files.get(file.name)), file.sha256); }
    assert.deepEqual(zip, createZip([...files].map(([name, data]) => ({ name, data }))));
    if (item.name.includes('offline')) {
      assert.deepEqual([...files.keys()], ['index.html', 'licenses/example/OFL.txt', 'licenses/tabler-icons-MIT.txt']);
      assert.deepEqual(files.get('index.html'), await readFile(path.join(directory, 'index.html')));
    } else {
      assert.ok(files.has('core/runtime.mjs')); assert.ok(files.has('templates/offline/.gitignore')); assert.ok(files.has('assets/fonts/test.woff2'));
      assert.ok(files.has('showcase/index.html')); assert.ok(files.has('showcase/showcase.mjs'));
      assert.equal(files.has('index.html'), false);
    }
  }
  const known = createZip([{ name: 'checksum.txt', data: '123456789' }]);
  assert.equal(known.readUInt32LE(14), 0xcbf43926, 'standard CRC-32 reference vector');
});

test('source allowlist excludes installed binaries, local configuration, outputs and unrelated files', async t => {
  const { directory, put } = await fixture(t);
  for (const file of ['node_modules/@esbuild/win32-x64/esbuild.exe', 'tools/node_modules/example/index.mjs', '.git/config', '.env', '.env.local', 'artifacts/private.json', 'docs/.env.md', 'studio/local.log', 'examples/workspace/index.html', 'private.json']) await put(file, 'Must not ship');
  const names = (await sourceEntries(directory)).map(entry => entry.name);
  assert.ok(names.includes('package-lock.json'));
  assert.equal(names.some(name => /(?:node_modules|esbuild\.exe|\.env|artifacts|private\.json|\.git\/|local\.log|workspace\/index\.html)/.test(name)), false);
});

test('release rejects external offline dependencies and unsafe ZIP filenames before writing archives', async t => {
  const { directory, put } = await fixture(t);
  await put('index.html', '<html><script src="https://example.test/app.js"></script></html>');
  await assert.rejects(buildRelease({ directory }), /Offlinebuildet kan ikke leveres/);
  for (const name of ['../escape.txt', '/absolute.txt', 'a\\escape.txt', 'C:/escape.txt', 'a//b.txt']) assert.throws(() => createZip([{ name, data: 'x' }]), /ZIP-filnavn/);
  assert.throws(() => createZip([{ name: 'A.txt', data: 'x' }, { name: 'a.txt', data: 'x' }]), /ZIP-filnavn/);
});

test('test runner enumerates paths containing spaces and isolates child temporary files', async t => {
  const { directory, put } = await fixture(t);
  await put('tests/portable.test.mjs', `import test from 'node:test';import assert from 'node:assert/strict';import os from 'node:os';import path from 'node:path';test('own temp',()=>assert.ok(os.tmpdir().startsWith(path.join(process.cwd(),'artifacts','test-runs')+path.sep)));`);
  await put('tests/not-a-test.mjs', 'throw new Error("Do not run support files");');
  assert.deepEqual(await testFiles(directory), [path.join(directory, 'tests', 'portable.test.mjs')]);
  const previous = [process.env.TEMP, process.env.TMP, process.env.TMPDIR];
  assert.equal(await runTests([], directory), 0);
  assert.deepEqual([process.env.TEMP, process.env.TMP, process.env.TMPDIR], previous);
});

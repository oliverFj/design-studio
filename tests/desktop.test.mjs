import test from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { closeDesktopServer, findAdjacentWorkspace, isStudioURL, prepareDesktopRoot, projectArgument, startDesktopServer } from '../desktop/runtime.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('desktop allows only its own local server origin and parses explicit project files', () => {
  const origins = new Set(['http://127.0.0.1:4567']);
  assert.equal(isStudioURL('http://127.0.0.1:4567/?view=components', origins), true);
  for (const value of ['https://example.com', 'file:///C:/secret.json', 'http://localhost:4567/', 'http://127.0.0.1:1234/', 'invalid']) {
    assert.equal(isStudioURL(value, origins), false, value);
  }
  assert.equal(projectArgument(['app.exe']), null);
  assert.equal(projectArgument(['app.exe', '--project', 'design.json']), path.resolve('design.json'));
  assert.throws(() => projectArgument(['--project', '--bad']), /JSON/);
});

test('bundled themes persist across desktop restarts while interface files update', async t => {
  const source = await fs.mkdtemp(path.join(os.tmpdir(), 'design-studio-source-'));
  const data = await fs.mkdtemp(path.join(os.tmpdir(), 'design-studio-data-'));
  t.after(async () => { await fs.rm(source, { recursive: true, force: true }); await fs.rm(data, { recursive: true, force: true }); });
  for (const name of ['core', 'studio', 'assets', 'packages']) await fs.mkdir(path.join(source, name));
  await fs.writeFile(path.join(source, 'studio', 'index.html'), 'v1');
  await fs.writeFile(path.join(source, 'packages', 'theme.json'), '{"name":"Initial"}');
  await prepareDesktopRoot({ sourceRoot: source, dataRoot: data });
  await fs.writeFile(path.join(data, 'packages', 'theme.json'), '{"name":"Edited"}');
  await fs.writeFile(path.join(source, 'studio', 'index.html'), 'v2');
  await prepareDesktopRoot({ sourceRoot: source, dataRoot: data });
  assert.equal(await fs.readFile(path.join(data, 'studio', 'index.html'), 'utf8'), 'v2');
  assert.equal(JSON.parse(await fs.readFile(path.join(data, 'packages', 'theme.json'), 'utf8')).name, 'Edited');
});

test('desktop opens a validated project and releases its owned server on shutdown', async t => {
  const { server, url } = await startDesktopServer({ rootDir: ROOT, projectPath: path.join(ROOT, 'packages', 'studio-light.json') });
  t.after(() => closeDesktopServer(server));
  const status = await (await fetch(url + '/api/status')).json();
  assert.equal(status.projectFile, await fs.realpath(path.join(ROOT, 'packages', 'studio-light.json')));
  assert.equal(server.address().address, '127.0.0.1');
  await closeDesktopServer(server);
  assert.equal(server.listening, false);
  await assert.rejects(fetch(url + '/api/status', { signal: AbortSignal.timeout(500) }));
  await assert.rejects(startDesktopServer({ rootDir: ROOT, projectPath: path.join(ROOT, 'package.json') }), /gyldig/);
});

test('packaged desktop recognizes only an adjacent complete Design Studio checkout', async () => {
  assert.equal(await findAdjacentWorkspace(path.join(ROOT, 'release', 'win-unpacked', 'Design Studio.exe')), await fs.realpath(ROOT));
  assert.equal(await findAdjacentWorkspace(path.join(ROOT, 'release', 'current', 'win-unpacked', 'Design Studio.exe')), await fs.realpath(ROOT));
  assert.equal(await findAdjacentWorkspace(path.join(os.tmpdir(), 'unrelated', 'Design Studio.exe')), null);
});

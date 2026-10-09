import test from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { createStudioServer } from '../server.mjs';
import { runCLI } from '../tools/cli.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function fixture(t, { project = false } = {}) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'design-studio-test-'));
  t.after(async () => { await fs.rm(root, { recursive: true, force: true }); });
  await fs.mkdir(path.join(root, 'packages'));
  await fs.mkdir(path.join(root, 'studio'));
  await fs.writeFile(path.join(root, 'studio', 'index.html'), '<h1>Design Studio test</h1>');
  const pack = JSON.parse((await fs.readFile(path.join(ROOT, 'packages', 'studio-light.json'), 'utf8')).replace(/^\uFEFF/, ''));
  await fs.writeFile(path.join(root, 'packages', 'studio-light.json'), JSON.stringify(pack));
  let projectPath = null;
  if (project) {
    projectPath = path.join(root, 'project-design.json');
    await fs.writeFile(projectPath, JSON.stringify({ ...pack, id: 'project-design', name: 'Project design' }));
  }
  const server = await createStudioServer({ rootDir: root, projectPath });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  });
  const url = `http://127.0.0.1:${server.address().port}`;
  return { root, pack, server, url, projectPath };
}

async function mutate(url, key, pack, method = 'PUT', extraHeaders = {}) {
  const endpoint = `${url}/api/packages${key ? `/${encodeURIComponent(key)}` : ''}`;
  const headers = { 'Content-Type': 'application/json', ...extraHeaders };
  if (method === 'PUT' && !headers['If-Match']) {
    const snapshot = await (await fetch(endpoint)).json();
    headers['If-Match'] = snapshot.revision;
  }
  return fetch(endpoint, { method, headers, body: JSON.stringify(pack) });
}

test('server lists file packages and serves the inspector without exposing arbitrary files', async t => {
  const { url } = await fixture(t);
  const listing = await (await fetch(`${url}/api/packages`)).json();
  assert.deepEqual(listing.packages.map(pack => pack.key), ['studio-light']);
  assert.equal(listing.activeProject, null);
  assert.match(await (await fetch(url)).text(), /Design Studio test/);
  assert.equal((await fetch(`${url}/packages/studio-light.json`)).status, 404);
  assert.equal((await fetch(`${url}/server.mjs`)).status, 404);
});

test('valid saves persist atomically; invalid packages and id changes leave the file unchanged', async t => {
  const { url, root, pack } = await fixture(t);
  const changed = { ...pack, name: 'Updated design' };
  assert.equal((await mutate(url, 'studio-light', changed)).status, 200);
  const file = path.join(root, 'packages', 'studio-light.json');
  assert.equal(JSON.parse(await fs.readFile(file, 'utf8')).name, changed.name);
  assert.equal((await mutate(url, 'studio-light', { ...changed, tokens: { 'space.component.padding': { $type: 'dimension', $value: '0px', description: 'Invalid zero padding' } } })).status, 422);
  assert.equal((await mutate(url, 'studio-light', { ...changed, id: 'different-id' })).status, 422);
  assert.equal(JSON.parse(await fs.readFile(file, 'utf8')).name, changed.name);
  assert.deepEqual(await fs.readdir(path.dirname(file)), ['studio-light.json']);
  const css = await fetch(`${url}/api/packages/studio-light/css`);
  assert.equal(css.status, 200);
  assert.match(css.headers.get('Content-Type'), /text\/css/);
  assert.match(await css.text(), /\.ds-scope/);
});

test('imports create a controlled new package and never overwrite existing packages', async t => {
  const { url, root, pack } = await fixture(t);
  const imported = { ...pack, id: 'imported-design', name: 'Imported design' };
  const result = await mutate(url, null, imported, 'POST');
  assert.equal(result.status, 201);
  assert.equal((await result.json()).key, 'imported-design');
  assert.equal((await mutate(url, null, imported, 'POST')).status, 409);
  assert.equal((await mutate(url, null, { ...pack, id: '../outside' }, 'POST')).status, 422);
  assert.ok((await fs.readdir(path.join(root, 'packages'))).includes('imported-design.json'));
  assert.equal((await fetch(`${url}/api/packages/imported-design`)).status, 200);
});

test('only an explicitly selected project design file can be saved', async t => {
  const { url, projectPath, pack } = await fixture(t, { project: true });
  const listing = await (await fetch(`${url}/api/packages`)).json();
  assert.equal(listing.activeProject, '@project');
  const changed = { ...pack, id: 'project-design', name: 'Changed project' };
  assert.equal((await mutate(url, '@project', changed)).status, 200);
  assert.equal(JSON.parse(await fs.readFile(projectPath, 'utf8')).name, 'Changed project');
  assert.equal((await mutate(url, 'not-authorized', changed)).status, 404);
});

test('cross-site requests, forged hosts, unsupported content and traversal are rejected', async t => {
  const { url, pack, server } = await fixture(t);
  assert.equal((await mutate(url, 'studio-light', pack, 'PUT', { Origin: 'https://example.com' })).status, 403);
  const forgedHostStatus = await new Promise((resolve, reject) => {
    const request = http.get({
      host: '127.0.0.1',
      port: server.address().port,
      path: '/api/packages',
      headers: { Host: 'attacker.example' },
    }, response => {
      response.resume();
      resolve(response.statusCode);
    });
    request.on('error', reject);
  });
  assert.equal(forgedHostStatus, 403);
  assert.equal((await fetch(`${url}/api/packages/studio-light`, { method: 'PUT', body: '{}' })).status, 415);
  const traversalStatus = await new Promise((resolve, reject) => {
    const request = http.get({
      host: '127.0.0.1',
      port: server.address().port,
      path: '/core/%2e%2e/server.mjs',
    }, response => {
      response.resume();
      resolve(response.statusCode);
    });
    request.on('error', reject);
  });
  assert.equal(traversalStatus, 400);
  const oversize = await fetch(`${url}/api/packages/studio-light`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ padding: 'a'.repeat(1024 * 1024) }),
  });
  assert.equal(oversize.status, 413);
});

test('CLI init creates a project design and preserves existing guidance; rerunning changes nothing', async t => {
  const project = await fs.mkdtemp(path.join(os.tmpdir(), 'design-studio-cli-'));
  t.after(async () => { await fs.rm(project, { recursive: true, force: true }); });
  const original = '# Existing project rules\nUse the established architecture.\n';
  await fs.writeFile(path.join(project, 'AGENTS.md'), original);
  const messages = [];
  await runCLI(['init', project], { log: message => messages.push(message) });
  const designFile = path.join(project, 'design', 'design.json');
  await runCLI(['validate', designFile], { log: message => messages.push(message) });
  assert.ok((await fs.readFile(path.join(project, 'AGENTS.md'), 'utf8')).startsWith(original.trimEnd()));
  assert.match(await fs.readFile(path.join(project, 'design', 'design.css'), 'utf8'), /\.ds-scope/);
  const configuration = JSON.parse(await fs.readFile(path.join(project, 'design-studio.project.json'), 'utf8'));
  assert.equal(configuration.package, 'design/design.json');
  assert.deepEqual(configuration.components, {});
  const before = await fs.readFile(designFile, 'utf8');
  await assert.rejects(runCLI(['init', project], { log: () => {} }), /findes allerede/);
  assert.equal(await fs.readFile(designFile, 'utf8'), before);
});

test('CLI init preflight prevents partial output when a generated file already exists', async t => {
  const project = await fs.mkdtemp(path.join(os.tmpdir(), 'design-studio-cli-'));
  t.after(async () => { await fs.rm(project, { recursive: true, force: true }); });
  await fs.mkdir(path.join(project, 'design'));
  await fs.writeFile(path.join(project, 'design', 'design.css'), 'existing css');
  await assert.rejects(runCLI(['init', project], { log: () => {} }), /findes allerede/);
  await assert.rejects(fs.stat(path.join(project, 'design', 'design.json')), { code: 'ENOENT' });
  await assert.rejects(fs.stat(path.join(project, 'design-studio.project.json')), { code: 'ENOENT' });
  await assert.rejects(fs.stat(path.join(project, 'AGENTS.md')), { code: 'ENOENT' });
});

test('CLI compare and css use the same package contract as the interface', async t => {
  const project = await fs.mkdtemp(path.join(os.tmpdir(), 'design-studio-cli-'));
  t.after(async () => { await fs.rm(project, { recursive: true, force: true }); });
  const light = path.join(ROOT, 'packages', 'studio-light.json');
  const fortress = path.join(ROOT, 'packages', 'midnight-editorial.json');
  const messages = [];
  await runCLI(['compare', light, fortress], { log: message => messages.push(message) });
  assert.match(messages[0], /Kompatible/);
  const output = path.join(project, 'theme.css');
  await runCLI(['css', fortress, '--out', output, '--scope', '.my-product'], { log: message => messages.push(message) });
  assert.match(await fs.readFile(output, 'utf8'), /\.my-product/);
});




test('revision checks preserve external changes and serialize competing saves', async t => {
  const { url, root, pack } = await fixture(t);
  const endpoint = `${url}/api/packages/studio-light`;
  const initialResponse = await fetch(endpoint);
  const initial = await initialResponse.json();
  assert.equal(initialResponse.headers.get('ETag'), `"${initial.revision}"`);
  assert.equal((await fetch(endpoint, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pack),
  })).status, 428);
  const file = path.join(root, 'packages', 'studio-light.json');
  await fs.writeFile(file, JSON.stringify({ ...pack, name: 'External agent change' }));
  const stale = await mutate(url, 'studio-light', { ...pack, name: 'Stale inspector save' }, 'PUT', { 'If-Match': initial.revision });
  assert.equal(stale.status, 412);
  assert.equal(JSON.parse(await fs.readFile(file, 'utf8')).name, 'External agent change');
  const current = await (await fetch(endpoint)).json();
  const saves = await Promise.all([
    mutate(url, 'studio-light', { ...pack, name: 'Save A' }, 'PUT', { 'If-Match': current.revision }),
    mutate(url, 'studio-light', { ...pack, name: 'Save B' }, 'PUT', { 'If-Match': current.revision }),
  ]);
  assert.deepEqual(saves.map(response => response.status).sort(), [200, 412]);
  const savedResponse = saves.find(response => response.status === 200);
  const saved = await savedResponse.json();
  assert.notEqual(saved.revision, current.revision);
  assert.equal(savedResponse.headers.get('ETag'), `"${saved.revision}"`);
});


test('CLI init supports project folders whose names start with digits', async t => {
  const project = await fs.mkdtemp(path.join(os.tmpdir(), '2026-projekt-'));
  t.after(async () => { await fs.rm(project, { recursive: true, force: true }); });
  await runCLI(['init', project], { log: () => {} });
  const designFile = path.join(project, 'design', 'design.json');
  const pack = JSON.parse(await fs.readFile(designFile, 'utf8'));
  assert.match(pack.id, /^project-2026-projekt-/);
  assert.ok(pack.id.length <= 80);
  await runCLI(['validate', designFile], { log: () => {} });
});


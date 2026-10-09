
import test from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { createStudioServer } from '../server.mjs';
import { launchStudio, parseLaunchArgs } from '../tools/launch.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
async function fixture(t) {
  const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), 'design-studio-launch-test-'));
  t.after(async () => { await fs.rm(rootDir, { recursive: true, force: true }); });
  await fs.mkdir(path.join(rootDir, 'packages'));
  const source = await fs.readFile(path.join(ROOT, 'packages', 'studio-light.json'));
  await fs.writeFile(path.join(rootDir, 'packages', 'studio-light.json'), source);
  return { rootDir, source };
}
function cleanup(t, server) {
  if (!server) return;
  t.after(async () => {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  });
}
async function running(t, server) {
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  cleanup(t, server);
  return server.address().port;
}
const silent = () => {};

test('launcher starts a loopback server and opens its actual address', async t => {
  const { rootDir } = await fixture(t);
  const opened = [];
  const result = await launchStudio({ rootDir, port: 0, logger: silent, browserOpener: async url => opened.push(url) });
  cleanup(t, result.server);
  assert.equal(result.reused, false);
  assert.equal(result.url, 'http://127.0.0.1:' + result.server.address().port);
  assert.deepEqual(opened, [result.url]);
  const identity = await (await fetch(result.url + '/api/status')).json();
  assert.equal(identity.app, 'design-studio');
  assert.equal(identity.root, await fs.realpath(rootDir));
  assert.equal(identity.projectFile, null);
});

test('duplicate start reuses matching root and default project without another server', async t => {
  const { rootDir } = await fixture(t);
  const existing = await createStudioServer({ rootDir });
  const port = await running(t, existing);
  const result = await launchStudio({ rootDir, port, open: false, logger: silent });
  assert.equal(result.reused, true);
  assert.equal(result.server, null);
  assert.equal(result.url, 'http://127.0.0.1:' + port);
  assert.equal((await fetch(result.url + '/api/packages')).status, 200);
});

test('launcher recognizes the older running server from exact package files', async t => {
  const { rootDir } = await fixture(t);
  const old = http.createServer((request, response) => {
    response.setHeader('Content-Type', 'application/json');
    if (request.url === '/api/packages') {
      response.end(JSON.stringify({ packages: [{ key: 'studio-light', file: path.join(rootDir, 'packages', 'studio-light.json') }], activeProject: null }));
    } else { response.statusCode = 404; response.end('{}'); }
  });
  const port = await running(t, old);
  const result = await launchStudio({ rootDir, port, open: false, logger: silent });
  assert.equal(result.reused, true);
  assert.equal(result.server, null);
});

test('an unrelated occupied port is preserved and a system-assigned port is used', async t => {
  const { rootDir } = await fixture(t);
  const unrelated = http.createServer((request, response) => {
    response.setHeader('Content-Type', 'application/json');
    if (request.url === '/api/packages') response.end(JSON.stringify({ packages: [], activeProject: null }));
    else { response.statusCode = 404; response.end('{}'); }
  });
  const port = await running(t, unrelated);
  const result = await launchStudio({ rootDir, port, open: false, logger: silent });
  cleanup(t, result.server);
  assert.equal(result.reused, false);
  assert.notEqual(result.server.address().port, port);
  assert.equal((await fetch('http://127.0.0.1:' + port + '/api/packages')).status, 200);
});

test('another system folder is not mistaken for the requested studio', async t => {
  const first = await fixture(t), second = await fixture(t);
  const existing = await createStudioServer({ rootDir: first.rootDir });
  const port = await running(t, existing);
  const result = await launchStudio({ rootDir: second.rootDir, port, open: false, logger: silent });
  cleanup(t, result.server);
  assert.equal(result.reused, false);
  const identity = await (await fetch(result.url + '/api/status')).json();
  assert.equal(identity.root, await fs.realpath(second.rootDir));
});

test('reuse requires the same explicit project and preserves the existing project instance', async t => {
  const { rootDir, source } = await fixture(t);
  const projectPath = path.join(rootDir, 'project.json');
  await fs.writeFile(projectPath, source);
  const existing = await createStudioServer({ rootDir, projectPath });
  const port = await running(t, existing);
  const same = await launchStudio({ rootDir, projectPath, port, open: false, logger: silent });
  assert.equal(same.reused, true);
  const different = await launchStudio({ rootDir, port, open: false, logger: silent });
  cleanup(t, different.server);
  assert.equal(different.reused, false);
  assert.equal((await (await fetch('http://127.0.0.1:' + port + '/api/status')).json()).projectFile, await fs.realpath(projectPath));
});

test('browser opening failure leaves a usable server running', async t => {
  const { rootDir } = await fixture(t), messages = [];
  const result = await launchStudio({ rootDir, port: 0, logger: message => messages.push(message), browserOpener: async () => { throw new Error('No browser'); } });
  cleanup(t, result.server);
  assert.equal((await fetch(result.url + '/api/packages')).status, 200);
  assert.ok(messages.some(message => message.includes('kunne ikke åbnes automatisk')));
});

test('launcher forwards project and port options and rejects missing values', () => {
  assert.deepEqual(parseLaunchArgs(['--port','3456','--project','E:/Projekt/design.json','--no-open']), { port: 3456, projectPath: 'E:/Projekt/design.json', open: false });
  assert.throws(() => parseLaunchArgs(['--port','0']), /--port/);
  assert.throws(() => parseLaunchArgs(['--project','--no-open']), /designfil/);
});


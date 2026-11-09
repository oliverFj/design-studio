import test from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { parse, stringify } from 'smol-toml';
import { planConnection, applyConnection, inspectConnection } from '../tools/agent-connection.mjs';

const studioRoot = fileURLToPath(new URL('../', import.meta.url));
const execFileAsync = promisify(execFile);

async function fixture(t) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'stade-agent-connection-'));
  t.after(async () => { assert.ok(directory.startsWith(path.resolve(os.tmpdir()) + path.sep)); await fs.rm(directory, { recursive: true, force: true }); });
  const codexHome = path.join(directory, 'profile'), first = path.join(directory, 'first project'), second = path.join(directory, 'second project');
  for (const file of [codexHome, first, second]) await fs.mkdir(file);
  return { directory, codexHome, first, second, configFile: path.join(codexHome, 'config.toml') };
}

function configured(project) {
  return { model: 'example-model', mcp_servers: {
    stade: { command: process.execPath, args: [path.join(studioRoot, 'tools/mcp-server.mjs'), '--project', 'first=' + project],
      enabled: false, enabled_tools: ['search_library'], disabled_tools: ['propose_experience'], startup_timeout_sec: 35, tool_timeout_sec: 70,
      env: { PRIVATE_EXAMPLE: 'never-print-this-value' }, tools: { search_library: { approval_mode: 'approve' } } },
    other: { command: 'other-node', args: ['other-server'], env: { TOKEN_EXAMPLE: 'other-private-value' } },
  } };
}

test('new connection planning is read-only, applies once and then becomes a byte-preserving no-op', async t => {
  const { codexHome, first, configFile } = await fixture(t);
  const plan = await planConnection({ studioRoot, codexHome, projects: [{ id: 'first', directory: first }] });
  assert.equal(plan.registered, false);
  assert.equal(plan.changed, true);
  await assert.rejects(fs.stat(configFile), { code: 'ENOENT' });
  const applied = await applyConnection(plan);
  assert.equal(applied.changed, true);
  assert.equal(applied.backupFile, null);
  const bytes = await fs.readFile(configFile);
  const next = await planConnection({ studioRoot, codexHome, projects: [{ id: 'first', directory: first }] });
  assert.equal(next.changed, false);
  assert.equal((await applyConnection(next)).changed, false);
  assert.deepEqual(await fs.readFile(configFile), bytes);
  assert.equal((await inspectConnection({ studioRoot, codexHome })).projects[0].id, 'first');
});

test('updating projects preserves all policy, unrelated servers, secrets and TOML date semantics', async t => {
  const { codexHome, first, second, configFile } = await fixture(t);
  const original = '# User comment\n' + stringify(configured(first)) + '\n[custom]\nlocal_date = 1979-05-27\n';
  await fs.writeFile(configFile, original);
  const before = parse(original);
  const plan = await planConnection({ studioRoot, codexHome, projects: [{ id: 'second', directory: second }] });
  assert.deepEqual(plan.existingProjects.map(project => project.id), ['first']);
  assert.deepEqual(plan.projects.map(project => project.id), ['first', 'second']);
  assert.equal(plan.enabled, false);
  assert.equal(JSON.stringify(plan).includes('never-print-this-value'), false);
  assert.equal(JSON.stringify(plan).includes('other-private-value'), false);
  const applied = await applyConnection(plan);
  const after = parse(await fs.readFile(configFile, 'utf8'));
  const intended = [...after.mcp_servers.stade.args];
  after.mcp_servers.stade.args = before.mcp_servers.stade.args;
  assert.deepEqual(after, before);
  assert.ok(intended.includes('second=' + await fs.realpath(second)));
  assert.equal(await fs.readFile(applied.backupFile, 'utf8'), original);
  assert.ok(applied.backupFile.startsWith(codexHome + path.sep));
  assert.equal((await inspectConnection({ studioRoot, codexHome })).enabled, false);
});

test('existing missing project paths stay registered while requested project paths must exist', async t => {
  const { directory, codexHome, second, configFile } = await fixture(t);
  const missing = path.join(directory, 'moved-project');
  await fs.writeFile(configFile, stringify(configured(missing)));
  const plan = await planConnection({ studioRoot, codexHome, projects: [{ id: 'second', directory: second }] });
  assert.equal(plan.projects[0].directory, missing);
  assert.match(plan.warnings.join(' '), /ikke findes/);
  await assert.rejects(planConnection({ studioRoot, codexHome, projects: [{ id: 'missing', directory: missing }] }), { code: 'ENOENT' });
});

test('server collisions, project remapping and unknown launch arguments are refused without writes', async t => {
  const { codexHome, first, second, configFile } = await fixture(t);
  const config = configured(first);
  await fs.writeFile(configFile, stringify(config));
  await assert.rejects(planConnection({ studioRoot, codexHome, projects: [{ id: 'first', directory: second }] }), /ikke flyttes/);
  config.mcp_servers.stade.args[0] = path.join(second, 'mcp-server.mjs');
  await fs.writeFile(configFile, stringify(config));
  await assert.rejects(planConnection({ studioRoot, codexHome }), /anden server/);
  config.mcp_servers.stade.args = [path.join(studioRoot, 'tools/mcp-server.mjs'), '--unexpected', 'secret-value'];
  await fs.writeFile(configFile, stringify(config));
  await assert.rejects(planConnection({ studioRoot, codexHome }), error => /ukendte startargumenter/.test(error.message) && !error.message.includes('secret-value'));
  assert.equal(await fs.readFile(configFile, 'utf8'), stringify(config));
});

test('the entire config snapshot is compared before applying and serialized plans cannot authorize writes', async t => {
  const { codexHome, first, configFile } = await fixture(t);
  const plan = await planConnection({ studioRoot, codexHome, projects: [{ id: 'first', directory: first }] });
  await fs.writeFile(configFile, '# A concurrent edit\nmodel = "new-model"\n');
  await assert.rejects(applyConnection(plan), /ændret siden/);
  assert.match(await fs.readFile(configFile, 'utf8'), /new-model/);
  await assert.rejects(applyConnection(JSON.parse(JSON.stringify(plan))), /samme proces/);
});

test('a stale profile lock or malformed config causes no mutation and parse errors do not reveal config data', async t => {
  const { codexHome, first, configFile } = await fixture(t);
  const plan = await planConnection({ studioRoot, codexHome, projects: [{ id: 'first', directory: first }] });
  await fs.writeFile(path.join(codexHome, 'config.toml.stade-lock'), '');
  await assert.rejects(applyConnection(plan), /låst/);
  await assert.rejects(fs.stat(configFile), { code: 'ENOENT' });
  await fs.writeFile(configFile, 'private_value = "never-reveal-this');
  await assert.rejects(planConnection({ studioRoot, codexHome }), error => /ikke gyldig TOML/.test(error.message) && !error.message.includes('never-reveal'));
});

test('profile directory junctions and parent links cannot redirect configuration writes', async t => {
  const { directory, codexHome, first } = await fixture(t);
  const linked = path.join(directory, 'linked-profile');
  await fs.symlink(codexHome, linked, process.platform === 'win32' ? 'junction' : 'dir');
  await assert.rejects(planConnection({ studioRoot, codexHome: linked }), /overmapper/);
  const nested = path.join(codexHome, 'nested');
  await fs.mkdir(nested);
  await assert.rejects(planConnection({ studioRoot, codexHome: path.join(linked, 'nested') }), /overmapper/);
  const plannedHome = path.join(directory, 'planned-profile');
  const plan = await planConnection({ studioRoot, codexHome: plannedHome, projects: [{ id: 'first', directory: first }] });
  await fs.symlink(codexHome, plannedHome, process.platform === 'win32' ? 'junction' : 'dir');
  await assert.rejects(applyConnection(plan), /overmapper/);
  await assert.rejects(fs.stat(path.join(codexHome, 'config.toml')), { code: 'ENOENT' });
});

test('failed atomic replacement retains the original config and leaves a local backup', async t => {
  const { codexHome, first, second, configFile } = await fixture(t);
  const original = stringify(configured(first));
  await fs.writeFile(configFile, original);
  const plan = await planConnection({ studioRoot, codexHome, projects: [{ id: 'second', directory: second }] });
  t.mock.method(fs, 'rename', async () => { throw Object.assign(new Error('Simulated replacement failure'), { code: 'EIO' }); });
  await assert.rejects(applyConnection(plan), /Simulated replacement failure/);
  assert.equal(await fs.readFile(configFile, 'utf8'), original);
  const files = await fs.readdir(codexHome);
  assert.equal(files.filter(file => file.includes('.stade-backup-')).length, 1);
  assert.equal(files.filter(file => file.endsWith('.tmp') || file.endsWith('.stade-lock')).length, 0);
});

test('the actual Codex CLI reads the isolated installed config without resetting server policy', async t => {
  const { codexHome, first, second, configFile } = await fixture(t);
  let codexCommand = process.env.CODEX_TEST_COMMAND;
  if (!codexCommand) for (const directory of (process.env.PATH ?? '').split(path.delimiter)) {
    const candidate = path.join(directory, process.platform === 'win32' ? 'codex.exe' : 'codex');
    try { if ((await fs.stat(candidate)).isFile()) { codexCommand = candidate; break; } } catch {}
  }
  if (!codexCommand) { t.skip('Codex CLI is not installed in this environment.'); return; }
  await fs.writeFile(configFile, stringify(configured(first)));
  const plan = await planConnection({ studioRoot, codexHome, codexCommand, projects: [{ id: 'second', directory: second }] });
  await applyConnection(plan);
  const { stdout } = await execFileAsync(codexCommand, ['mcp', 'get', 'stade', '--json'], { env: { ...process.env, CODEX_HOME: codexHome }, windowsHide: true, timeout: 10000 });
  const actual = JSON.parse(stdout);
  assert.equal(actual.enabled, false);
  assert.deepEqual(actual.enabled_tools, ['search_library']);
  assert.deepEqual(actual.disabled_tools, ['propose_experience']);
  assert.equal(actual.startup_timeout_sec, 35);
  assert.ok(actual.transport.args.includes('second=' + await fs.realpath(second)));
  assert.equal(parse(await fs.readFile(configFile, 'utf8')).mcp_servers.stade.tools.search_library.approval_mode, 'approve');
});

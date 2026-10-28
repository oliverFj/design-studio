import test from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { runCLI } from '../tools/cli.mjs';
import { STARTER_VERSION, contentHash } from '../tools/starter.mjs';

const silent = () => {};
async function fixture(t) {
  const project = await fs.mkdtemp(path.join(os.tmpdir(), 'design-studio-update-'));
  t.after(() => fs.rm(project, { recursive: true, force: true }));
  await runCLI(['init', project], { log: silent });
  const configFile = path.join(project, 'design-studio.project.json');
  const config = JSON.parse(await fs.readFile(configFile, 'utf8'));
  return { project, configFile, config };
}

async function previousVersion(t) {
  const result = await fixture(t);
  const { project, config, configFile } = result;
  const builder = path.join(project, 'tools/build.mjs');
  const latestBuilder = await fs.readFile(builder, 'utf8');
  const oldBuilder = '// Previous starter\n' + latestBuilder;
  await fs.writeFile(builder, oldBuilder);
  const app = path.join(project, 'src/app.mjs');
  const ownApp = (await fs.readFile(app, 'utf8')) + '\n// Product-specific behaviour\n';
  await fs.writeFile(app, ownApp);
  const metadata = JSON.parse(await fs.readFile(path.join(project, 'package.json'), 'utf8'));
  metadata.scripts.build = 'node custom-builder.mjs';
  metadata.scripts.test = 'node product-tests.mjs';
  metadata.dependencies = { 'product-dependency': '1.2.3' };
  delete metadata.scripts.doctor;
  await fs.writeFile(path.join(project, 'package.json'), JSON.stringify(metadata));
  config.starterTemplate.version = '0.9.0';
  config.starterTemplate.files['tools/build.mjs'] = contentHash(oldBuilder);
  config.starterTemplate.files['src/app.mjs'] = contentHash('// Original older app');
  config.starterTemplate.package['scripts.build'] = 'node older-build.mjs';
  delete config.starterTemplate.package['scripts.doctor'];
  await fs.writeFile(configFile, JSON.stringify(config));
  return { ...result, app, ownApp, builder, oldBuilder, latestBuilder };
}

test('init records a distinct starter version and reference hashes', async t => {
  const { project, config } = await fixture(t);
  assert.equal(config.starterTemplate.version, STARTER_VERSION);
  assert.equal(config.starterTemplate.files['src/app.mjs'], contentHash(await fs.readFile(path.join(project, 'src/app.mjs'))));
  const report = await runCLI(['update', project], { log: silent });
  assert.ok(report.files.every(file => file.action === 'current'));
});

test('preview writes nothing; apply updates unchanged files and preserves local code and package fields', async t => {
  const { project, configFile, app, ownApp, builder, oldBuilder, latestBuilder } = await previousVersion(t);
  const configBefore = await fs.readFile(configFile);
  const htmlBefore = await fs.readFile(path.join(project, 'index.html'));
  let report = await runCLI(['update', project], { log: silent });
  assert.equal(report.applied, false);
  assert.ok(report.files.some(file => file.file === 'src/app.mjs' && file.action === 'review'));
  assert.ok(report.files.some(file => file.file === 'tools/build.mjs' && file.action === 'update'));
  assert.deepEqual(await fs.readFile(configFile), configBefore);
  assert.equal(await fs.readFile(builder, 'utf8'), oldBuilder);
  await assert.rejects(fs.stat(path.join(project, '.design-studio')), { code: 'ENOENT' });
  report = await runCLI(['update', project, '--apply'], { log: silent });
  assert.equal(await fs.readFile(app, 'utf8'), ownApp);
  assert.equal(await fs.readFile(builder, 'utf8'), latestBuilder);
  const metadata = JSON.parse(await fs.readFile(path.join(project, 'package.json'), 'utf8'));
  assert.equal(metadata.scripts.build, 'node custom-builder.mjs');
  assert.equal(metadata.scripts.test, 'node product-tests.mjs');
  assert.equal(metadata.scripts.doctor, 'node design/tools/doctor.mjs');
  assert.deepEqual(metadata.dependencies, { 'product-dependency': '1.2.3' });
  assert.deepEqual(await fs.readFile(path.join(project, 'index.html')), htmlBefore);
  assert.equal(JSON.parse(await fs.readFile(configFile, 'utf8')).starterTemplate.version, STARTER_VERSION);
  assert.ok(report.proposals.some(file => file.endsWith('/src/app.mjs')));
  const suggestion = report.proposals.find(file => file.endsWith('/package.json'));
  const suggested = JSON.parse(await fs.readFile(path.join(project, suggestion), 'utf8'));
  assert.equal(suggested.scripts.test, 'node product-tests.mjs');
  assert.equal(suggested.scripts.build, 'node tools/build.mjs');
  const after = await fs.readFile(configFile);
  report = await runCLI(['update', project, '--apply'], { log: silent });
  assert.equal(report.proposals.length, 0);
  assert.deepEqual(await fs.readFile(configFile), after);
  assert.equal(await fs.readFile(app, 'utf8'), ownApp);
});

test('legacy projects have no guessed baseline; local deletions and edits stay untouched', async t => {
  const { project, config, configFile } = await fixture(t);
  await fs.unlink(path.join(project, '.gitignore'));
  let report = await runCLI(['update', project, '--apply'], { log: silent });
  assert.ok(report.files.some(file => file.file === '.gitignore' && file.action === 'deleted'));
  await assert.rejects(fs.stat(path.join(project, '.gitignore')), { code: 'ENOENT' });
  delete config.starterTemplate;
  await fs.writeFile(configFile, JSON.stringify(config));
  await fs.appendFile(path.join(project, 'src/app.mjs'), '\n// Legacy custom code');
  const source = await fs.readFile(path.join(project, 'src/app.mjs'), 'utf8');
  report = await runCLI(['update', project, '--apply'], { log: silent });
  assert.equal(report.from, 'ukendt');
  assert.equal(await fs.readFile(path.join(project, 'src/app.mjs'), 'utf8'), source);
  assert.ok(report.proposals.some(file => file.endsWith('/src/app.mjs')));
});

test('failed updates roll back safe replacements and newly prepared proposals', async t => {
  const { project, configFile, builder, oldBuilder, app, ownApp } = await previousVersion(t);
  const originalConfig = await fs.readFile(configFile);
  const originalPackage = await fs.readFile(path.join(project, 'package.json'));
  const rename = fs.rename;
  fs.rename = async (source, target) => {
    if (target === configFile) throw new Error('Fixture update failure');
    return rename(source, target);
  };
  try { await assert.rejects(runCLI(['update', project, '--apply'], { log: silent }), /Fixture update failure/); }
  finally { fs.rename = rename; }
  assert.deepEqual(await fs.readFile(configFile), originalConfig);
  assert.deepEqual(await fs.readFile(path.join(project, 'package.json')), originalPackage);
  assert.equal(await fs.readFile(builder, 'utf8'), oldBuilder);
  assert.equal(await fs.readFile(app, 'utf8'), ownApp);
  await assert.rejects(fs.stat(path.join(project, '.design-studio')), { code: 'ENOENT' });
});

test('newer template versions and unsafe paths are rejected without changes', async t => {
  const { project, config, configFile } = await fixture(t);
  config.starterTemplate.version = '99.0.0';
  await fs.writeFile(configFile, JSON.stringify(config));
  await assert.rejects(runCLI(['update', project, '--apply'], { log: silent }), /nedgradering/);
  config.starterTemplate.version = STARTER_VERSION;
  config.css = '../outside.css';
  await fs.writeFile(configFile, JSON.stringify(config));
  await assert.rejects(runCLI(['update', project, '--apply'], { log: silent }), /inden for projektmappen/);
});

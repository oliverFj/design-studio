import test from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { pathToFileURL } from 'node:url';
import { runCLI } from '../tools/cli.mjs';
import { materializePackage } from '../core/engine.mjs';
const silent = () => {};
async function projectFixture(t) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'design-studio-v2-integration-'));
  t.after(async () => {
    assert.ok(path.resolve(directory).startsWith(path.resolve(os.tmpdir()) + path.sep));
    await fs.rm(directory, { recursive: true, force: true });
  });
  await runCLI(['init', directory], { log: silent });
  return directory;
}
test('init supplies a real shared runtime and sync preserves the project theme', async t => {
  const project = await projectFixture(t);
  const themeFile = path.join(project, 'design/design.json');
  const theme = JSON.parse(await fs.readFile(themeFile, 'utf8'));
  assert.equal(theme.schemaVersion, 2);
  assert.equal(theme.components, undefined);
  const config = JSON.parse(await fs.readFile(path.join(project, 'design-studio.project.json'), 'utf8'));
  assert.equal(config.library, 'design/runtime/components.mjs');
  const runtime = await import(pathToFileURL(path.join(project, config.library)).href);
  assert.match(runtime.renderComponent(theme, 'card', { slots: { body: 'A project card' } }), /A project card/);
  const bytes = await fs.readFile(themeFile);
  await fs.writeFile(path.join(project, 'design/runtime/engine.mjs'), '// outdated copied runtime');
  await fs.writeFile(path.join(project, 'design/design.css'), '/* outdated derived CSS */');
  await runCLI(['sync', project], { log: silent });
  assert.deepEqual(await fs.readFile(themeFile), bytes);
  assert.match(await fs.readFile(path.join(project, 'design/runtime/engine.mjs'), 'utf8'), /export function generateCSS/);
  assert.match(await fs.readFile(path.join(project, 'design/design.css'), 'utf8'), /space-component-padding/);
});
test('sync rejects paths outside the project and CSS collisions before writing', async t => {
  const project = await projectFixture(t);
  const file = path.join(project, 'design-studio.project.json');
  const config = JSON.parse(await fs.readFile(file, 'utf8'));
  const themeFile = path.join(project, 'design/design.json');
  const before = await fs.readFile(themeFile);
  await fs.writeFile(file, JSON.stringify({ ...config, css: '../outside.css' }));
  await assert.rejects(runCLI(['sync', project], { log: silent }), /inden for projektmappen/);
  await fs.writeFile(file, JSON.stringify({ ...config, css: 'design/design.json' }));
  await assert.rejects(runCLI(['sync', project], { log: silent }), /overskrive tema/);
  assert.deepEqual(await fs.readFile(themeFile), before);
});
test('migration creates a theme copy and never overwrites its original or existing output', async t => {
  const project = await projectFixture(t);
  const current = JSON.parse(await fs.readFile(path.join(project, 'design/design.json'), 'utf8'));
  const legacy = materializePackage(current);
  delete legacy.components.card.parts.root.styles.padding;
  const original = path.join(project, 'legacy.json');
  const output = path.join(project, 'theme-v2.json');
  await fs.writeFile(original, JSON.stringify(legacy));
  const bytes = await fs.readFile(original);
  await runCLI(['migrate', original, '--out', output], { log: silent });
  const theme = JSON.parse(await fs.readFile(output, 'utf8'));
  assert.equal(theme.schemaVersion, 2);
  assert.equal(theme.components, undefined);
  assert.ok(materializePackage(theme).components.card.parts.root.styles.padding);
  assert.deepEqual(await fs.readFile(original), bytes);
  await assert.rejects(runCLI(['migrate', original, '--out', original], { log: silent }), /originalen bevares/);
  await assert.rejects(runCLI(['migrate', original, '--out', output], { log: silent }), /originalen bevares/);
});

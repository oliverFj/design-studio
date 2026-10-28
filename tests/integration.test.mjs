import test from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { pathToFileURL } from 'node:url';
import { runCLI } from '../tools/cli.mjs';
import { materializePackage } from '../core/engine.mjs';
import { buildHTML } from '../templates/offline/tools/build.mjs';
import { Script } from 'node:vm';
import { doctor } from '../tools/doctor.mjs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
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
  const guidance = await fs.readFile(path.join(project, 'AGENTS.md'), 'utf8');
  assert.match(guidance, /index\.html.*Åbn tema/);
  assert.match(guidance, /Gem tema henter en JSON-fil/);
  assert.match(guidance, /projektets egen index\.html.*file:\/\//);
  assert.match(guidance, /npm run build.*offlinebrug/);
  assert.match(guidance, /Agenten.*genbygger.*Brugeren skal blot genindlæse browseren/);
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

test('init builds a standalone offline app and source edits can be rebuilt', async t => {
  const project = await projectFixture(t);
  const html = await fs.readFile(path.join(project, 'index.html'), 'utf8');
  assert.match(html, /<title>design-studio-v2-integration-/);
  assert.doesNotMatch(html, /<script\b[^>]*\bsrc=|<link\b[^>]*\brel="stylesheet"/i);
  assert.match(html, /\.ds-card/);
  const script = html.match(/<script>([\s\S]*)<\/script>/)?.[1];
  assert.ok(script);
  assert.doesNotThrow(() => new Script(script));
  assert.equal(/fetch\(|XMLHttpRequest|WebSocket/.test(script), false);
  const metadata = JSON.parse(await fs.readFile(path.join(project, 'package.json'), 'utf8'));
  assert.equal(metadata.scripts.build, 'node tools/build.mjs');
  assert.ok(metadata.devDependencies.esbuild);
  assert.match(html, /app-shell ds-layout/);
  assert.match(html, /data-layout="form"/);
  assert.ok(await fs.stat(path.join(project, 'design/runtime/layout.mjs')));
  assert.equal(metadata.scripts.doctor, 'node design/tools/doctor.mjs');
  assert.match(await fs.readFile(path.join(project, 'src/app.mjs'), 'utf8'), /createProjectFile/);
  assert.ok(await fs.stat(path.join(project, 'design/runtime/files.mjs')));
  const builder = await fs.readFile(new URL('../templates/offline/tools/build.mjs', import.meta.url), 'utf8');
  assert.equal(await fs.readFile(path.join(project, 'tools/build.mjs'), 'utf8'), builder.replace("'../../../tools/offline-checks.mjs'", "'../design/tools/offline-checks.mjs'"));
  const sourceFile = path.join(project, 'src/app.mjs');
  await fs.appendFile(sourceFile, '\ndocument.title = "Rebuilt offline app";\n');
  const rebuilt = await buildHTML(project);
  assert.match(rebuilt, /Rebuilt offline app/);
  assert.notEqual(rebuilt, html);
});

test('doctor accepts a fresh init and its copied command runs independently', async t => {
  const project = await projectFixture(t);
  const before = await fs.readFile(path.join(project, 'index.html'));
  const report = await doctor(project);
  assert.deepEqual(report.checks.filter(check => check.status !== 'ok'), []);
  assert.equal(report.valid, true);
  const standalone = await promisify(execFile)(process.execPath, [path.join(project, 'design/tools/doctor.mjs')], { cwd: project });
  assert.match(standalone.stdout, /Ingen fejl fundet/);
  assert.deepEqual(await fs.readFile(path.join(project, 'index.html')), before);
});

test('examples exports optional reference code using the project runtime and never replaces local edits', async t => {
  const project = await projectFixture(t);
  await runCLI(['examples', project], { log: silent });
  const entry = path.join(project, 'design/patterns/compositions.mjs');
  const content = await fs.readFile(entry, 'utf8');
  assert.match(content, /\.\.\/runtime\/components\.mjs/);
  const reference = await import(pathToFileURL(entry).href);
  assert.equal(reference.createCompositionState('editor').selected, 'panel');
  assert.ok(await fs.stat(path.join(project, 'design/patterns/object-workbench.mjs')));
  const history = await import(pathToFileURL(path.join(project, 'design/patterns/history.mjs')).href);
  assert.equal(history.createHistory(history.createHistoryState({ count: 0 })).dirty, false);
  assert.ok(await fs.stat(path.join(project, 'design/patterns/resource-library.mjs')));
  await fs.appendFile(entry, '\n// Product customization\n');
  await assert.rejects(runCLI(['examples', project], { log: silent }), /findes allerede/);
  assert.match(await fs.readFile(entry, 'utf8'), /Product customization/);
  await runCLI(['sync', project], { log: silent });
  assert.match(await fs.readFile(entry, 'utf8'), /Product customization/);
});

test('doctor detects stale sources, CSS and runtime, and build/sync resolve them', async t => {
  const project = await projectFixture(t);
  await fs.appendFile(path.join(project, 'src/app.mjs'), '\n// Changed source\n');
  let report = await doctor(project);
  assert.equal(report.valid, false);
  assert.ok(report.checks.some(check => check.message.includes('index.html er forældet')));
  await fs.writeFile(path.join(project, 'index.html'), await buildHTML(project));
  assert.equal((await doctor(project)).valid, true);
  await fs.writeFile(path.join(project, 'design/design.css'), '/* stale CSS */');
  await fs.writeFile(path.join(project, 'design/runtime/files.mjs'), '// stale runtime');
  report = await doctor(project);
  assert.ok(report.checks.some(check => check.message.includes('CSS er forældet')));
  assert.ok(report.checks.some(check => check.message.includes('design/runtime/files.mjs') && check.status === 'error'));
  await runCLI(['sync', project], { log: silent });
  await fs.writeFile(path.join(project, 'index.html'), await buildHTML(project));
  assert.equal((await doctor(project)).valid, true);
});

test('doctor validates adapter exports without executing product code and reports offline blockers', async t => {
  const project = await projectFixture(t);
  const configFile = path.join(project, 'design-studio.project.json');
  const config = JSON.parse(await fs.readFile(configFile, 'utf8'));
  await fs.writeFile(path.join(project, 'src/Button.mjs'), 'export const Button = 1; throw new Error("Doctor must not execute this module");');
  config.components = { button: { file: 'src/Button.mjs', export: 'Missing' } };
  await fs.writeFile(configFile, JSON.stringify(config));
  let report = await doctor(project);
  assert.ok(report.checks.some(check => check.message.includes('Eksporten Missing findes ikke')));
  config.components.button.export = 'Button';
  await fs.writeFile(configFile, JSON.stringify(config));
  assert.equal((await doctor(project)).valid, true);
  await fs.appendFile(path.join(project, 'index.html'), '<script src="https://example.invalid/server.js"></script>');
  report = await doctor(project);
  assert.equal(report.valid, false);
  assert.ok(report.checks.some(check => check.message.includes('indlæser kode eller CSS')));
  await assert.rejects(runCLI(['doctor', project], { log: silent }), /Doctor fandt fejl/);
  config.css = '../outside.css';
  await fs.writeFile(configFile, JSON.stringify(config));
  report = await doctor(project);
  assert.ok(report.checks.some(check => check.message.includes('inden for projektmappen')));
});

test('init preflights existing app files and design-only preserves an existing product', async t => {
  const project = await fs.mkdtemp(path.join(os.tmpdir(), 'design-studio-existing-app-'));
  t.after(() => fs.rm(project, { recursive: true, force: true }));
  const original = '{"name":"existing-app","scripts":{"build":"existing-command"}}\n';
  await fs.writeFile(path.join(project, 'package.json'), original);
  await fs.writeFile(path.join(project, 'index.html'), '<h1>Existing application</h1>');
  await fs.writeFile(path.join(project, 'AGENTS.md'), 'Keep these project rules.\n');
  await assert.rejects(runCLI(['init', project], { log: silent }), /--design-only/);
  assert.deepEqual((await fs.readdir(project)).sort(), ['AGENTS.md', 'index.html', 'package.json']);
  await runCLI(['init', project, '--design-only'], { log: silent });
  assert.equal(await fs.readFile(path.join(project, 'package.json'), 'utf8'), original);
  assert.equal(await fs.readFile(path.join(project, 'index.html'), 'utf8'), '<h1>Existing application</h1>');
  assert.match(await fs.readFile(path.join(project, 'AGENTS.md'), 'utf8'), /^Keep these project rules\.[\s\S]*--design-only/);
  await assert.rejects(fs.stat(path.join(project, 'src')), { code: 'ENOENT' });
  await assert.rejects(runCLI(['init', project, '--design-only', '--design-only'], { log: silent }), /kun.*én gang/);
});

test('a failed initial offline output rolls back new files and preserves existing instructions', async t => {
  const project = await fs.mkdtemp(path.join(os.tmpdir(), 'design-studio-init-rollback-'));
  t.after(() => fs.rm(project, { recursive: true, force: true }));
  await fs.writeFile(path.join(project, 'AGENTS.md'), 'Keep project instructions.\n');
  const originalOpen = fs.open;
  fs.open = async (target, ...args) => {
    if (target === path.join(project, 'index.html')) throw new Error('Fixture offline output failure');
    return originalOpen(target, ...args);
  };
  try {
    await assert.rejects(runCLI(['init', project], { log: silent }), /Fixture offline output failure/);
  } finally { fs.open = originalOpen; }
  assert.deepEqual(await fs.readdir(project), ['AGENTS.md']);
  assert.equal(await fs.readFile(path.join(project, 'AGENTS.md'), 'utf8'), 'Keep project instructions.\n');
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

import test from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runCLI } from '../tools/cli.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const silent = () => {};
const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><path d="M0 0h10v10H0z" fill="#000"/></svg>';
const license = 'Fixture license. Keep this text with the original asset.\n';

async function fixture(t, {brand = true} = {}) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'design-studio-brand-tools-'));
  t.after(async () => { await fs.rm(directory, {recursive:true, force:true}); });
  const pack = JSON.parse((await fs.readFile(path.join(ROOT, 'packages', 'studio-light.json'), 'utf8')).replace(/^\uFEFF/, ''));
  if (brand) pack.brand = {
    name:'Fixture brand', summary:'Brand assets stay connected to their original files.',
    principles:[{id:'originals', title:'Use originals', description:'Reuse the approved resource.'}],
    sections:[{id:'logo', title:'Logo', description:'Use a readable original.', tokens:['color.background.canvas'], components:[], dos:['Preserve proportions.'], donts:['Do not redraw.']}],
    logos:[{id:'mark', name:'Original mark', asset:'mark', usage:'Use the original on the canvas.', background:'color.background.canvas', foreground:'color.text.primary'}],
    assets:[
      {id:'mark', name:'Original mark', fileName:'mark.svg', mimeType:'image/svg+xml', data:Buffer.from(svg).toString('base64'), description:'Original vector mark.'},
      {id:'license', name:'License', fileName:'LICENSE.txt', mimeType:'text/plain', data:Buffer.from(license).toString('base64'), description:'Keep the asset license.'},
    ],
    sources:[{title:'Fixture source', location:'Local test fixture'}],
  };
  else delete pack.brand;
  const file = path.join(directory, 'pack.json');
  await fs.writeFile(file, JSON.stringify(pack));
  return {directory, file, pack};
}

async function absent(file) {
  await assert.rejects(fs.lstat(file), error => error.code === 'ENOENT');
}

test('assets exports original bytes and actual filenames without changing the package', async t => {
  const {directory, file} = await fixture(t);
  const original = await fs.readFile(file);
  const output = path.join(directory, 'nested', 'assets');
  const messages = [];
  await runCLI(['assets', file, '--out', output], {log:message => messages.push(message)});
  assert.equal(await fs.readFile(path.join(output, 'mark.svg'), 'utf8'), svg);
  assert.equal(await fs.readFile(path.join(output, 'LICENSE.txt'), 'utf8'), license);
  assert.deepEqual(await fs.readFile(file), original);
  assert.ok(messages[0].includes(path.join(output, 'mark.svg')));
  assert.ok(messages[0].includes(path.join(output, 'LICENSE.txt')));
});

test('assets preflights the whole export and preserves an existing later target', async t => {
  const {directory, file} = await fixture(t);
  const output = path.join(directory, 'assets');
  await fs.mkdir(output);
  await fs.writeFile(path.join(output, 'LICENSE.txt'), 'Existing project license');
  await assert.rejects(runCLI(['assets', file, '--out', output], {log:silent}), /findes allerede/);
  await absent(path.join(output, 'mark.svg'));
  assert.equal(await fs.readFile(path.join(output, 'LICENSE.txt'), 'utf8'), 'Existing project license');
});

test('assets rolls back only its own files and new empty directories after a write failure', async t => {
  const {directory, file} = await fixture(t);
  const output = path.join(directory, 'new', 'assets');
  await fs.writeFile(path.join(directory, 'unrelated.txt'), 'Retain');
  const originalOpen = fs.open;
  fs.open = async (target, ...args) => {
    if (target === path.join(output, 'LICENSE.txt')) throw Object.assign(new Error('Fixture write failure'), {code:'EIO'});
    return originalOpen(target, ...args);
  };
  try {
    await assert.rejects(runCLI(['assets', file, '--out', output], {log:silent}), /Fixture write failure/);
  } finally { fs.open = originalOpen; }
  await absent(path.join(directory, 'new'));
  assert.equal(await fs.readFile(path.join(directory, 'unrelated.txt'), 'utf8'), 'Retain');
  assert.ok(await fs.stat(file));
});

test('assets rejects directory links rather than writing outside the selected tree', async t => {
  const {directory, file} = await fixture(t);
  const real = path.join(directory, 'real');
  const linked = path.join(directory, 'linked');
  await fs.mkdir(real);
  try { await fs.symlink(real, linked, process.platform === 'win32' ? 'junction' : 'dir'); }
  catch(error) { if (['EPERM','EACCES'].includes(error.code)) { t.skip('Directory links unavailable on this host'); return; } throw error; }
  await assert.rejects(runCLI(['assets', file, '--out', path.join(linked, 'assets')], {log:silent}), /almindelige mapper/);
  assert.deepEqual(await fs.readdir(real), []);
});

test('unsafe paths and case-insensitive resource collisions create no output', async t => {
  const {directory, file, pack} = await fixture(t);
  const output = path.join(directory, 'assets');
  pack.brand.assets[1] = {...pack.brand.assets[0], id:'other-mark', fileName:'MARK.svg'};
  await fs.writeFile(file, JSON.stringify(pack));
  await assert.rejects(runCLI(['assets', file, '--out', output], {log:silent}));
  await absent(output);
  pack.brand.assets[1].fileName = '../outside.svg';
  await fs.writeFile(file, JSON.stringify(pack));
  await assert.rejects(runCLI(['assets', file, '--out', output], {log:silent}));
  await absent(output);
  await absent(path.join(directory, 'outside.svg'));
});

test('assets leaves packages without a brand resource collection unchanged', async t => {
  const {directory, file} = await fixture(t, {brand:false});
  const output = path.join(directory, 'assets');
  const messages = [];
  await runCLI(['assets', file, '--out', output], {log:message => messages.push(message)});
  await absent(output);
  assert.match(messages[0], /ingen brandressourcer/);
  await assert.rejects(runCLI(['assets', file], {log:silent}), /--out DIRECTORY/);
});

test('init carries Fjordside brand rules and originals into the project with standalone font CSS', async t => {
  const {directory} = await fixture(t, {brand:false});
  const source = JSON.parse((await fs.readFile(path.join(ROOT, 'packages', 'fjordside.json'), 'utf8')).replace(/^\uFEFF/, ''));
  assert.ok(source.brand?.assets?.length, 'Fjordside includes its brand resources');
  const project = path.join(directory, 'project');
  await fs.mkdir(project);
  const messages = [];
  await runCLI(['init', project, '--theme', 'fjordside'], {log:message => messages.push(message)});
  const copied = JSON.parse(await fs.readFile(path.join(project, 'design', 'design.json'), 'utf8'));
  assert.deepEqual(copied.brand, source.brand);
  for (const asset of source.brand.assets) {
    const target = path.join(project, 'design', 'assets', asset.fileName);
    assert.deepEqual(await fs.readFile(target), Buffer.from(asset.data, 'base64'));
    assert.ok(messages[0].includes(target));
  }
  const css = await fs.readFile(path.join(project, 'design', 'design.css'), 'utf8');
  assert.match(css, /@font-face/);
  assert.match(css, /data:font\/(?:ttf|woff2?);base64,/);
  const guidance = await fs.readFile(path.join(project, 'AGENTS.md'), 'utf8');
  assert.match(guidance, /brandprincipper, sektionsregler og logobrug/);
  assert.match(guidance, /logo-originalerne/);
});

test('init preflights existing brand assets before creating design files or agent guidance', async t => {
  const {directory} = await fixture(t, {brand:false});
  const source = JSON.parse((await fs.readFile(path.join(ROOT, 'packages', 'fjordside.json'), 'utf8')).replace(/^\uFEFF/, ''));
  assert.ok(source.brand?.assets?.length);
  const project = path.join(directory, 'project');
  const output = path.join(project, 'design', 'assets');
  await fs.mkdir(output, {recursive:true});
  const existing = path.join(output, source.brand.assets[0].fileName);
  await fs.writeFile(existing, 'Project original');
  await assert.rejects(runCLI(['init', project, '--theme', 'fjordside'], {log:silent}), /findes allerede/);
  assert.equal(await fs.readFile(existing, 'utf8'), 'Project original');
  for (const file of ['design/design.json','design/design.css','design-studio.project.json','AGENTS.md']) await absent(path.join(project, file));
});

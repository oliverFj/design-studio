import test from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import { createHash } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import { planSkills, applySkills } from '../tools/agent-skills.mjs';

const ID = 'stade-collaboration', OTHER = 'formlab-material-gpu';
const META = '.stade-skill.json', INSTALLATION = 'references/stade-installation.json';
const digest = content => createHash('sha256').update(content).digest('hex');
const read = file => fs.readFile(file, 'utf8');
const absent = async file => assert.rejects(fs.lstat(file), error => error.code === 'ENOENT');

async function write(file, content) {
  await fs.mkdir(path.dirname(file), { recursive: true }); await fs.writeFile(file, content);
}

async function fixture(t, skills = [ID]) {
  const parent = path.resolve(os.tmpdir()), directory = await fs.mkdtemp(path.join(parent, 'stade-agent-skills-'));
  t.after(async () => {
    assert.equal(path.dirname(path.resolve(directory)), parent);
    await fs.rm(directory, { recursive: true, force: true });
  });
  const options = { studioRoot: path.join(directory, 'studio'), codexHome: path.join(directory, 'codex'),
    skillsDir: path.join(directory, 'installed'), skills };
  for (const id of skills) {
    await write(path.join(options.studioRoot, 'skills', id, 'SKILL.md'), '# ' + id + '\n');
    await write(path.join(options.studioRoot, 'skills', id, 'references', 'workflow.md'), 'Original workflow\n');
  }
  return { directory, options, source: path.join(options.studioRoot, 'skills', ID), target: path.join(options.skillsDir, ID) };
}

test('fresh skill installation owns its copied files and generated local configuration; repeated apply is unchanged', async t => {
  const { options, source, target } = await fixture(t);
  const plan = await planSkills(options);
  assert.equal(plan.changed, true); assert.equal(plan.skills[0].state, 'install'); assert.deepEqual(plan.conflicts, []);
  assert.equal((await applySkills(JSON.parse(JSON.stringify(plan)))).changed, true);
  assert.equal(await read(path.join(target, 'SKILL.md')), await read(path.join(source, 'SKILL.md')));
  assert.deepEqual(JSON.parse(await read(path.join(target, INSTALLATION))), { schemaVersion: 1, stadeRoot: options.studioRoot });
  const metadata = JSON.parse(await read(path.join(target, META)));
  assert.equal(metadata.id, ID); assert.equal(metadata.schemaVersion, 1); assert.equal(metadata.sourceRoot, source);
  assert.equal(metadata.files['SKILL.md'], digest(await read(path.join(target, 'SKILL.md'))));
  assert.ok(metadata.files[INSTALLATION]); assert.equal(metadata.files[META], undefined);
  const next = await planSkills(options);
  assert.equal(next.changed, false); assert.equal(next.skills[0].state, 'unchanged');
  assert.equal((await applySkills(next)).changed, false);
});

test('safe updates replace and retire only unchanged owned files, preserving unmanaged extras', async t => {
  const { options, source, target } = await fixture(t);
  await applySkills(await planSkills(options));
  await write(path.join(target, 'notes', 'mine.txt'), 'Keep this');
  await write(path.join(source, 'SKILL.md'), '# Revised\n');
  await fs.unlink(path.join(source, 'references', 'workflow.md'));
  await write(path.join(source, 'references', 'new.md'), 'New workflow');
  const next = await planSkills(options); assert.equal(next.skills[0].state, 'update');
  await applySkills(next);
  assert.equal(await read(path.join(target, 'SKILL.md')), '# Revised\n');
  await absent(path.join(target, 'references', 'workflow.md'));
  assert.equal(await read(path.join(target, 'references', 'new.md')), 'New workflow');
  assert.equal(await read(path.join(target, 'notes', 'mine.txt')), 'Keep this');
  assert.equal((await planSkills(options)).changed, false);
});

test('local edits and owned deletions conflict before another requested skill is installed', async t => {
  for (const deleted of [false, true]) await t.test(deleted ? 'owned deletion' : 'local edit', async t => {
    const { options, target } = await fixture(t, [ID, OTHER]);
    await applySkills(await planSkills({ ...options, skills: [OTHER] }));
    const other = path.join(options.skillsDir, OTHER, 'SKILL.md');
    if (deleted) await fs.unlink(other); else await fs.writeFile(other, 'Local edit');
    const plan = await planSkills(options);
    assert.equal(plan.conflicts.length, 1); assert.match(plan.conflicts[0].message, /ændret eller slettet/);
    await assert.rejects(applySkills(plan), /konflikter/); await absent(target);
    if (!deleted) assert.equal(await read(other), 'Local edit');
  });
});

test('unmanaged installation is adopted only when all source files already match', async t => {
  const { options, source, target } = await fixture(t);
  await fs.cp(source, target, { recursive: true });
  await write(path.join(target, 'my-extra.md'), 'Extra');
  const plan = await planSkills(options); assert.equal(plan.skills[0].state, 'adopt');
  await applySkills(plan); assert.equal(await read(path.join(target, 'my-extra.md')), 'Extra');
  const other = await fixture(t);
  await fs.cp(other.source, other.target, { recursive: true });
  await fs.writeFile(path.join(other.target, 'SKILL.md'), 'Different installation');
  const conflict = await planSkills(other.options); assert.equal(conflict.conflicts.length, 1);
  await assert.rejects(applySkills(conflict), /konflikter/); await absent(path.join(other.target, META));
});

test('new source files cannot take ownership of existing unmanaged files, even with matching bytes', async t => {
  const { options, source, target } = await fixture(t);
  await applySkills(await planSkills(options));
  await write(path.join(source, 'new.md'), 'Same'); await write(path.join(target, 'new.md'), 'Same');
  const plan = await planSkills(options);
  assert.match(plan.conflicts[0].message, /ikke-ejet/); await assert.rejects(applySkills(plan), /konflikter/);
});

test('apply rejects stale source and destination snapshots across every requested skill before writes', async t => {
  for (const changed of ['source', 'destination']) await t.test(changed, async t => {
    const { options, target } = await fixture(t, [ID, OTHER]);
    const plan = await planSkills(options);
    const file = changed === 'source' ? path.join(options.studioRoot, 'skills', OTHER, 'SKILL.md') : path.join(options.skillsDir, OTHER, 'extra.md');
    await write(file, 'Changed after planning');
    await assert.rejects(applySkills(plan), /forældet/); await absent(target);
  });
});

test('modern home is used by default, while an existing legacy skill is reused without duplication', async t => {
  const { directory, options, source } = await fixture(t);
  const originalHome = os.homedir, fakeHome = path.join(directory, 'home');
  os.homedir = () => fakeHome;
  try {
    const { skillsDir, ...defaults } = options;
    const first = await planSkills(defaults);
    assert.equal(first.skills[0].target, path.join(fakeHome, '.agents', 'skills', ID));
    const legacy = path.join(options.codexHome, 'skills', ID);
    await fs.cp(source, legacy, { recursive: true });
    const next = await planSkills(defaults);
    assert.equal(next.skills[0].target, legacy); assert.equal(next.skills[0].state, 'adopt');
    await applySkills(next); await absent(path.join(fakeHome, '.agents'));
  } finally { os.homedir = originalHome; }
});

async function link(t, target, location) {
  await fs.mkdir(path.dirname(location), { recursive: true });
  try { await fs.symlink(target, location, process.platform === 'win32' ? 'junction' : 'dir'); return true; }
  catch (error) { if (['EPERM', 'EACCES'].includes(error.code)) { t.skip('Directory links unavailable'); return false; } throw error; }
}

test('links in source trees and destination ancestors are rejected without following them', async t => {
  for (const where of ['source-tree', 'source-parent', 'destination-parent', 'destination-tree']) await t.test(where, async t => {
    const { directory, options, source, target } = await fixture(t);
    const outside = path.join(directory, 'outside'); await fs.mkdir(outside);
    if (where === 'source-tree') { if (!await link(t, outside, path.join(source, 'linked'))) return; }
    if (where === 'source-parent') {
      const original = options.studioRoot; options.studioRoot = path.join(directory, 'linked-studio');
      if (!await link(t, original, options.studioRoot)) return;
    }
    if (where === 'destination-parent') { if (!await link(t, outside, options.skillsDir)) return; }
    if (where === 'destination-tree') { if (!await link(t, outside, target)) return; }
    const plan = await planSkills(options); assert.equal(plan.conflicts.length, 1); assert.match(plan.conflicts[0].message, /links/);
    await assert.rejects(applySkills(plan), /konflikter/); assert.deepEqual(await fs.readdir(outside), []);
  });
});

test('a destination junction introduced after planning makes the plan stale without writing outside', async t => {
  const { directory, options } = await fixture(t);
  const plan = await planSkills(options), outside = path.join(directory, 'outside'); await fs.mkdir(outside);
  if (!await link(t, outside, options.skillsDir)) return;
  await assert.rejects(applySkills(plan), /forældet/); assert.deepEqual(await fs.readdir(outside), []);
});

test('invalid metadata and oversized sources are rejected without changes', async t => {
  const { options, target, source } = await fixture(t);
  await applySkills(await planSkills(options));
  const marker = JSON.parse(await read(path.join(target, META)));
  marker.files['../outside'] = digest('outside'); await fs.writeFile(path.join(target, META), JSON.stringify(marker));
  assert.match((await planSkills(options)).conflicts[0].message, /ugyldigt format/);
  await fs.writeFile(path.join(source, 'SKILL.md'), Buffer.alloc(16 * 1024 * 1024 + 1));
  assert.match((await planSkills(options)).conflicts[0].message, /størrelsesgrænsen/);
  await assert.rejects(planSkills({ ...options, skills: ['../escape'] }), /gyldige/);
});

test('an I/O failure rolls back changed owned files using backups', async t => {
  const { options, source, target } = await fixture(t);
  await applySkills(await planSkills(options));
  const original = await read(path.join(target, 'SKILL.md')), metadata = await read(path.join(target, META));
  await fs.writeFile(path.join(source, 'SKILL.md'), '# Update');
  await fs.writeFile(path.join(source, 'references', 'workflow.md'), 'Updated workflow');
  const plan = await planSkills(options), rename = fs.rename;
  fs.rename = async (from, to) => {
    if (to === path.join(target, 'references', 'workflow.md') && from.endsWith('.tmp')) throw new Error('Simulated publish failure');
    return rename(from, to);
  };
  try { await assert.rejects(applySkills(plan), /Simulated publish failure/); }
  finally { fs.rename = rename; }
  assert.equal(await read(path.join(target, 'SKILL.md')), original);
  assert.equal(await read(path.join(target, META)), metadata);
  assert.equal(await read(path.join(target, 'references', 'workflow.md')), 'Original workflow\n');
  assert.ok((await fs.readdir(target)).every(name => !/\.stade-.*\.(tmp|bak)$/.test(name)));
});

test('case-only directory aliases and reserved metadata directories fail during planning', async t => {
  const first = await fixture(t);
  await fs.cp(first.source, first.target, { recursive: true });
  await fs.rename(path.join(first.target, 'references'), path.join(first.target, 'References'));
  assert.match((await planSkills(first.options)).conflicts[0].message, /kolliderer/);
  const second = await fixture(t);
  await fs.cp(second.source, second.target, { recursive: true });
  await fs.mkdir(path.join(second.target, META));
  assert.match((await planSkills(second.options)).conflicts[0].message, /ejerskabsfil/);
});

test('another valid skill folder can be installed without changing the installer', async t => {
  const id = 'another-team-skill-3', { options } = await fixture(t, [id]);
  const plan = await planSkills(options);
  assert.equal(plan.skills[0].state, 'install'); assert.deepEqual(plan.conflicts, []);
  await applySkills(plan);
  assert.equal(await read(path.join(options.skillsDir, id, 'SKILL.md')), '# ' + id + '\n');
  for (const unsafe of ['../escape', 'Bad-id', '-leading', 'x'.repeat(101)]) {
    await assert.rejects(planSkills({ ...options, skills: [unsafe] }), /gyldige/);
  }
});

test('rollback preserves both a concurrent edit and the original backup and reports its path', async t => {
  const { options, source, target } = await fixture(t);
  await applySkills(await planSkills(options));
  const skillFile = path.join(target, 'SKILL.md'), original = await read(skillFile);
  await fs.writeFile(path.join(source, 'SKILL.md'), '# Update');
  await fs.writeFile(path.join(source, 'references', 'workflow.md'), 'Updated workflow');
  const plan = await planSkills(options), rename = fs.rename;
  fs.rename = async (from, to) => {
    if (to === path.join(target, 'references', 'workflow.md') && from.endsWith('.tmp')) {
      await fs.writeFile(skillFile, 'Concurrent local edit');
      throw new Error('Simulated next-file failure');
    }
    return rename(from, to);
  };
  let failure;
  try { await applySkills(plan); }
  catch (error) { failure = error; }
  finally { fs.rename = rename; }
  assert.ok(failure); assert.match(failure.message, /Simulated next-file failure/);
  assert.equal(await read(skillFile), 'Concurrent local edit');
  const backup = (await fs.readdir(target)).find(name => /^SKILL\.md\.stade-.*\.bak$/.test(name));
  assert.ok(backup); assert.equal(await read(path.join(target, backup)), original);
  assert.ok(failure.message.includes(path.join(target, backup)));
});

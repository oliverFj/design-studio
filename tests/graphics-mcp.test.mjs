import test from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { createCollaborationService, STUDIO_ROOT } from '../collaboration/service.mjs';
import { GRAPHIC_FAMILY_IDS, GRAPHIC_TOKEN_BINDINGS, GRAPHIC_TOKEN_DEFAULTS } from '../core/graphic-tokens.mjs';
import { GRAPHIC_CATALOG_IDS } from '../core/graphics/catalog.mjs';

test('graphic profiles expose the shared authoring rules and current runtime entry points without historical theme snapshots', async () => {
  const service = await createCollaborationService();
  const overview = await service.getGraphicProfile();
  assert.deepEqual(overview.families.map(entry => entry.id), GRAPHIC_FAMILY_IDS);
  assert.equal(overview.profile, undefined);
  assert.equal(overview.contractVersion, 1);
  assert.deepEqual(overview.shared.viewBox, [0, 0, 600, 420]);
  assert.equal(overview.rules.length, 12);
  assert.ok(overview.rules.every(rule => rule.kind === 'authoring-requirement' && rule.source));
  assert.equal(overview.review.technicalValidationDoesNotApproveStyle, true);
  assert.equal(overview.materials.themeSnapshot, undefined);
  for (const [role, token] of Object.entries(GRAPHIC_TOKEN_BINDINGS)) {
    assert.deepEqual(overview.materials.bindings[role], { token, defaultValue: GRAPHIC_TOKEN_DEFAULTS[token].$value });
  }
  for (const entry of overview.runtime) {
    const runtime = await import(pathToFileURL(path.join(STUDIO_ROOT, entry.file)).href);
    for (const name of entry.exports) assert.ok(name in runtime, entry.file + ':' + name);
  }
  assert.match(overview.note, /ikke automatisk stilgodkendelse/);
});

test('every family profile supplies real reference motifs, readable guide sections and exact current source hashes', async () => {
  const service = await createCollaborationService();
  for (const family of GRAPHIC_FAMILY_IDS) {
    const result = await service.getGraphicProfile({ family });
    assert.equal(result.family, family);
    assert.ok(result.profile.authoringConstraints.length > 0);
    assert.ok(result.profile.referenceMotifs.length >= 3);
    assert.ok(result.profile.referenceMotifs.every(reference => GRAPHIC_CATALOG_IDS.includes(reference.motif)));
    assert.equal(result.derivedProductGraphics.definesFamilyDefaults, false);
    assert.ok(result.sources.some(source => source.file === result.profile.motionSource));
    for (const { file, sha256 } of result.sources) {
      assert.equal(sha256, createHash('sha256').update(await fs.readFile(path.join(STUDIO_ROOT, file))).digest('hex'));
    }
    const guide = result.guideReferences.find(reference => reference.source === result.profile.guide);
    assert.ok(guide);
    const toc = await service.getGuide({ id: guide.id });
    assert.equal(toc.sha256, guide.sha256);
    for (const section of guide.sections) assert.ok(toc.sections.some(entry => entry.section === section.section));
    assert.ok(guide.sections.some(section => /forfatterkrav|normativ|passage:|feltlinjer:/i.test(section.title)));
  }
  await assert.rejects(service.getGraphicProfile({ family: '../private' }), /Ukendt illustrationsfamilie/);
  await assert.rejects(service.getGraphicProfile({ family: '__proto__' }), /Ukendt illustrationsfamilie/);
});

test('graphic contract reads refresh between calls and keep the existing project file boundary', async t => {
  const parent = path.resolve(os.tmpdir());
  const directory = await fs.mkdtemp(path.join(parent, 'stade-graphics-mcp-'));
  t.after(async () => { assert.equal(path.dirname(path.resolve(directory)), parent); await fs.rm(directory, { recursive: true, force: true }); });
  const service = await createCollaborationService();
  const files = (await service.getGraphicProfile()).sources.map(source => source.file);
  for (const file of files) {
    await fs.mkdir(path.dirname(path.join(directory, file)), { recursive: true });
    await fs.copyFile(path.join(STUDIO_ROOT, file), path.join(directory, file));
  }
  await fs.mkdir(path.join(directory, 'collaboration'));
  await fs.writeFile(path.join(directory, 'collaboration/experiences.json'), '[]');
  const local = await createCollaborationService({ studioRoot: directory });
  const before = await local.getGraphicProfile();
  const file = path.join(directory, 'docs/graphics/style-contract.json');
  const contract = JSON.parse(await fs.readFile(file, 'utf8'));
  contract.rules[0].requirement = 'En opdateret regel fra samme vedligeholdte kilde.';
  await fs.writeFile(file, JSON.stringify(contract));
  const after = await local.getGraphicProfile();
  assert.notEqual(after.sha256, before.sha256);
  assert.equal(after.rules[0].requirement, contract.rules[0].requirement);
  contract.families.anatomy.guide = '../private';
  await fs.writeFile(file, JSON.stringify(contract));
  await assert.rejects(local.getGraphicProfile(), /ukendt format|familieguide/);
  await fs.unlink(file);
  try { await fs.symlink(path.join(STUDIO_ROOT, 'docs/graphics/style-contract.json'), file); }
  catch (error) { if (process.platform === 'win32' && ['EPERM', 'EACCES'].includes(error.code)) return; throw error; }
  await assert.rejects(local.getGraphicProfile(), /uden for den tilladte mappe/);
});

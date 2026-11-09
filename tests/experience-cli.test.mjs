import test from 'node:test';
import assert from 'node:assert/strict';
import { runExperienceCLI } from '../tools/experiences.mjs';
import { experienceRevision } from '../collaboration/service.mjs';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const entry = { schemaVersion: 1, id: 'example', title: 'En erfaring', summary: 'Afgrænset observation.', status: 'draft', scope: 'shared', tags: ['test'],
  problem: 'Et konkret problem.', approach: 'En undersøgt fremgangsmåde.', verification: { kind: 'source-inspection', summary: 'Kilden er læst; der er ikke udført grafikprøver.' },
  limits: ['Gælder denne kilde.'], sources: [{ project: 'stade', file: 'core/library.mjs', note: 'Fælles bibliotek.' }], updatedAt: '2026-11-08' };

test('curation preview preserves evidence and never calls the writer', async () => {
  const service = { getExperience: async () => ({ experience: entry, sourceStatus: 'unverifiable', sourceChecks: [] }), curateExperience: () => assert.fail('preview must not write') };
  const preview = await runExperienceCLI(['review', entry.id, '--date', '2026-11-08'], { service, log() {} });
  assert.equal(preview.preview, true);
  assert.equal(preview.expectedRevision, experienceRevision(entry));
  assert.equal(preview.experience.status, 'reviewed');
  assert.deepEqual(preview.experience.verification, entry.verification);
  assert.equal(entry.status, 'draft');
});

test('apply requires the reviewed revision; stale revisions and irrelevant flags fail before writing', async () => {
  let calls = 0;
  const service = { getExperience: async () => ({ experience: entry }), curateExperience: async request => { calls++; return request; } };
  const options = { service, log() {} };
  await assert.rejects(runExperienceCLI(['review', entry.id, '--apply'], options), /--expect/);
  await assert.rejects(runExperienceCLI(['review', entry.id, '--apply', '--expect', '0'.repeat(64)], options), /ændret/);
  await assert.rejects(runExperienceCLI(['show', entry.id, '--apply', '--expect', experienceRevision(entry)], options), /gælder ikke/);
  assert.equal(calls, 0);
  const preview = await runExperienceCLI(['review', entry.id], options);
  const result = await runExperienceCLI(['review', entry.id, '--apply', '--expect', preview.expectedChange], options);
  assert.equal(calls, 1);
  assert.equal(result.expectedRevision, experienceRevision(entry));
  assert.deepEqual(result.experience.verification, entry.verification);
});

test('apply binds the edited file and date as well as the original post', async t => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'stade-curation-cli-'));
  t.after(async () => { assert.ok(path.resolve(directory).startsWith(path.resolve(os.tmpdir()) + path.sep)); await fs.rm(directory, { recursive: true, force: true }); });
  const file = path.join(directory, 'entry.json');
  await fs.writeFile(file, JSON.stringify(entry));
  let calls = 0;
  const options = { service: { getExperience: async () => ({ experience: entry }), curateExperience: async request => { calls++; return request; } }, log() {} };
  const args = ['review', entry.id, '--entry', file, '--date', '2026-11-08'];
  const preview = await runExperienceCLI(args, options);
  await fs.writeFile(file, JSON.stringify({ ...entry, approach: 'En anden agents ændring efter forhåndsvisningen.' }));
  await assert.rejects(runExperienceCLI([...args, '--apply', '--expect', preview.expectedChange], options), /ændret/);
  await fs.writeFile(file, JSON.stringify(entry));
  await assert.rejects(runExperienceCLI(['review', entry.id, '--entry', file, '--date', '2026-11-09', '--apply', '--expect', preview.expectedChange], options), /ændret/);
  assert.equal(calls, 0);
  await runExperienceCLI([...args, '--apply', '--expect', preview.expectedChange], options);
  assert.equal(calls, 1);
});

test('retirement requires and preserves the reason alongside the original evidence', async () => {
  const options = { service: { getExperience: async () => ({ experience: entry }) }, log() {} };
  await assert.rejects(runExperienceCLI(['retire', entry.id], options), /forklaring/);
  const result = await runExperienceCLI(['retire', entry.id, '--reason', 'Erstattet af en nyere gennemgået erfaring.'], options);
  assert.equal(result.experience.status, 'retired');
  assert.match(result.experience.limits[0], /Erstattet/);
  assert.deepEqual(result.experience.verification, entry.verification);
});

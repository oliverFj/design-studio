import test from 'node:test';
import assert from 'node:assert/strict';
import { runAgentSetup } from '../tools/agent-setup.mjs';

const writeForbidden = () => assert.fail('planning must not write');
test('dry-run forwards explicit projects and selected skills without applying or probing', async () => {
  let plannedSettings, plannedSkills;
  const result = await runAgentSetup(['install', '--dry-run', '--project', 'example=' + process.cwd(), '--skill', 'formlab-material-gpu'], {
    connection: { planConnection: async settings => { plannedSettings = settings; return { changed: true }; }, applyConnection: writeForbidden },
    skillInstaller: { planSkills: async settings => { plannedSkills = settings; return { skills: [], conflicts: [] }; }, applySkills: writeForbidden },
    probe: writeForbidden, log() {},
  });
  assert.equal(result.dryRun, true);
  assert.deepEqual(plannedSettings.projects, [{ id: 'example', directory: process.cwd() }]);
  assert.deepEqual(plannedSkills.skills, ['stade-collaboration', 'formlab-material-gpu']);
});

test('skill conflicts prevent all installation, including connection changes', async () => {
  await assert.rejects(runAgentSetup(['install'], {
    connection: { planConnection: async () => ({ changed: true }), applyConnection: writeForbidden },
    skillInstaller: { planSkills: async () => ({ skills: [], conflicts: [{ message: 'local edit' }] }), applySkills: writeForbidden },
    probe: writeForbidden, log() {},
  }), /Intet er installeret/);
});

test('status never probes an absent registration and cannot silently add projects', async () => {
  const result = await runAgentSetup(['status', '--probe'], {
    connection: { inspectConnection: async () => ({ registered: false, command: 'node' }) },
    skillInstaller: { planSkills: async () => ({ skills: [], conflicts: [] }) }, probe: writeForbidden, log() {},
  });
  assert.equal(result.serverCheck, undefined);
  await assert.rejects(runAgentSetup(['status', '--project', 'example=' + process.cwd()]), /status ændrer ikke/);
});

test('status exposes outdated and locally edited guidance without applying installation', async () => {
  const skills = [{ id: 'current', guidance: { status: 'current' } }, { id: 'stale', guidance: { status: 'outdated' } }, { id: 'edited', guidance: { status: 'local_changes' } }];
  const result = await runAgentSetup(['status'], {
    connection: { inspectConnection: async () => ({ registered: true }), applyConnection: writeForbidden },
    skillInstaller: { planSkills: async () => ({ skills, conflicts: [{ id: 'edited', message: 'local edit' }] }), applySkills: writeForbidden },
    probe: writeForbidden, log() {},
  });
  assert.deepEqual(result.guidanceDrift, [{ id: 'stale', status: 'outdated' }, { id: 'edited', status: 'local_changes' }]);
  assert.equal(result.conflicts.length, 1);
  assert.equal(result.skills, skills);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { checkDocumentation, measureOnboarding, ONBOARDING_TASKS } from '../tools/check-documentation.mjs';
import { createCollaborationService } from '../collaboration/service.mjs';

test('the current repository documentation has valid local links and heading anchors', async () => {
  const result = await checkDocumentation();
  assert.deepEqual(result.errors, [], JSON.stringify(result.errors, null, 2));
});

test('documentation check detects broken local links and anchors while respecting code examples and external project boundaries', async t => {
  const parent = path.resolve(os.tmpdir()), root = await fs.mkdtemp(path.join(parent, 'stade-documentation-'));
  t.after(async () => {
    assert.equal(path.dirname(path.resolve(root)), parent);
    await fs.rm(root, { recursive: true, force: true });
  });
  await fs.writeFile(path.join(root, 'guide.md'), '# Oversigt\n\n## Blå åbning\n\n## Blå åbning\n\n<a id="explicit"></a>\n\n```md\n## Eksempel\n```\n');
  await fs.writeFile(path.join(root, 'code.mjs'), 'export const value = 1;\n');
  const source = [
    '[unicode](guide.md#blå-åbning)', '[duplicate](guide.md#blå-åbning-1)', '[explicit](guide.md#explicit)',
    '[missing anchor](guide.md#absent)', '[missing file](absent.md)', '[not a heading](guide.md#eksempel)',
    '[code line](code.mjs#L1)', '[web](https://example.com/missing)', '[product](../product/README.md)',
    '````md', '[example](fake.md)', '```', '[still example](fake2.md)', '````',
  ].join('\n');
  await fs.writeFile(path.join(root, 'README.md'), source);
  const result = await checkDocumentation({ root, files: ['README.md', 'guide.md'] });
  assert.deepEqual(result.errors.map(item => [item.line, item.href]), [[4, 'guide.md#absent'], [5, 'absent.md'], [6, 'guide.md#eksempel']]);
  assert.equal(result.skipped.length, 1);
  assert.equal(result.skipped[0].href, '../product/README.md');
  assert.equal(await fs.readFile(path.join(root, 'README.md'), 'utf8'), source);
});

test('five representative tasks discover current guide content through the collaboration service', async () => {
  const report = await measureOnboarding({ service: await createCollaborationService() });
  assert.deepEqual(report.results.map(result => result.task), ONBOARDING_TASKS.map(task => task.id));
  assert.equal(report.results.find(result => result.task === 'grid').source, 'docs/INTEGRATION.md', 'the grid task should find the actual API, not a principles summary');
  for (const result of report.results) {
    assert.ok(result.source.endsWith('.md'));
    assert.ok(result.section);
    assert.ok(result.responseChars > 0);
    assert.ok(result.totalChars > result.coreChars);
  }
});

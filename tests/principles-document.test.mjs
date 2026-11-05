import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parsePrinciples, renderPrincipleText } from '../studio/principles-document.mjs';

test('the constitution keeps all chapters and citations navigable from one content source', async () => {
  const source = await readFile(new URL('../docs/DESIGN-PRINCIPLES.md', import.meta.url), 'utf8');
  const document = parsePrinciples(source);
  assert.equal(document.sections.length, 13);
  assert.equal(new Set(document.sections.map(section => section.id)).size, 13);
  assert.equal(document.sections.at(-1).id, 'kilder');
  assert.ok(document.sections.every(section => section.id && section.title && section.body));
  const html = document.sections.map(section => renderPrincipleText(section.body)).join('');
  const sourceIds = [...html.matchAll(/id="(principle-s\d+)"/g)].map(match => match[1]);
  assert.equal(sourceIds.length, 17);
  assert.equal(new Set(sourceIds).size, 17);
  const citations = [...html.matchAll(/href="#(principle-s\d+)"/g)].map(match => match[1]);
  assert.ok(citations.length > 17);
  assert.ok(citations.every(id => sourceIds.includes(id)), 'every citation has an existing source target');
  assert.ok(sourceIds.every(id => citations.includes(id)), 'every listed source is used');
});

test('document rendering escapes markup and restricts links to web sources and document anchors', () => {
  const html = renderPrincipleText('<script>alert(1)</script>\n\n[unsafe](javascript:alert) [source](https://example.com/?a=1&b=2) **Vigtigt** `token.name`\n\n- Første\n- Andet');
  assert.ok(!html.includes('<script>'));
  assert.ok(!html.includes('href="javascript:'));
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(html.includes('https://example.com/?a=1&amp;b=2'));
  assert.ok(html.includes('<strong>Vigtigt</strong>'));
  assert.ok(html.includes('<code>token.name</code>'));
  assert.ok(html.includes('<ul><li>Første</li><li>Andet</li></ul>'));
});

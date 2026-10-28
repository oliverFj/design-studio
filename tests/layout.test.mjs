import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { LAYOUT_PROFILES, createLayout, generateLayoutCSS } from '../core/layout.mjs';
import { generateCSS, materializePackage } from '../core/engine.mjs';
import { createLayout as publicCreateLayout } from '../core/components.mjs';
import { dom } from './support/dom.mjs';

test('shared profiles create optional native wrappers without imposing columns or padding', () => {
  const document = dom();
  assert.equal(publicCreateLayout, createLayout);
  assert.equal(LAYOUT_PROFILES.form.maxWidth, '44rem');
  assert.equal(LAYOUT_PROFILES.panel.maxWidth, '23rem');
  assert.equal(LAYOUT_PROFILES.fluid.maxWidth, 'none');
  for (const id of Object.keys(LAYOUT_PROFILES)) {
    const node = createLayout(id, { document });
    assert.equal(node.className, 'ds-layout'); assert.equal(node.getAttribute('data-layout'), id);
    assert.equal(node.children.length, 0);
  }
  assert.throws(() => createLayout('unknown', { document }), /Ukendt breddeprofil/);
  const css = generateLayoutCSS();
  assert.doesNotMatch(css, /padding|grid-template|display:/);
  assert.match(css, /--ds-layout-max-width: initial/); // Nested layouts reset inherited local overrides.
  assert.match(css, /max-inline-size: var\(--ds-layout-max-width, 44rem\)/);
  assert.throws(() => generateLayoutCSS('.scope } body {'), /CSS scope/);
});

test('all format-2 themes include scoped layout CSS; legacy format-1 CSS stays unchanged', async () => {
  let pack;
  for(const file of (await readdir(new URL('../packages/', import.meta.url))).filter(file=>file.endsWith('.json'))) {
    pack = JSON.parse(await readFile(new URL('../packages/'+file, import.meta.url), 'utf8'));
    const css = generateCSS(pack, { scope: '#product' });
    assert.match(css, /:where\(#product\) \.ds-layout\[data-layout="form"\]/);
    for (const profile of Object.keys(LAYOUT_PROFILES)) assert.ok(css.includes('[data-layout="' + profile + '"]'));
  }
  assert.doesNotMatch(generateCSS(materializePackage(pack)), /\.ds-layout/);
});

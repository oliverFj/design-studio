import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { generateScrollbarCSS } from '../core/layout.mjs';
import { generateCSS, resolveTokens, materializePackage } from '../core/engine.mjs';
import { contrastRatio } from '../core/quality.mjs';
import { PUBLIC_THEME_IDS } from '../tools/public-themes.mjs';

test('every public theme supplies readable scrollbar colors on its canvas, panels, fields and inverse navigation', () => {
  for (const id of PUBLIC_THEME_IDS) {
    const theme = JSON.parse(readFileSync(new URL('../packages/' + id + '.json', import.meta.url), 'utf8'));
    const tokens = resolveTokens(theme), css = generateCSS(theme, { scope: '#product' });
    assert.ok(css.includes(generateScrollbarCSS('#product')), id);
    for (const surface of ['canvas', 'surface', 'control']) assert.ok(contrastRatio(tokens['color.text.secondary'], tokens['color.background.' + surface]) >= 3, id + '/' + surface);
    assert.ok(contrastRatio(tokens['color.text.inverse'], tokens['color.background.inverse']) >= 3, id + '/inverse');
    assert.doesNotMatch(generateCSS(materializePackage(theme)), /--ds-scrollbar-thumb/, 'legacy generation keeps its original CSS contract');
  }
});

test('scrollbar styling uses standards, isolated older-WebKit fallback and system colors in forced-color mode', () => {
  const css = generateScrollbarCSS('#product');
  assert.match(css, /:where\(#product\), :where\(#product\) \*/);
  assert.match(css, /@media \(pointer: fine\)[^\n]*scrollbar-width: thin/);
  assert.match(css, /@supports not \(\(scrollbar-color: red blue\) and \(scrollbar-width: thin\)\) \{\n[^\n]*scrollbar-color: auto; scrollbar-width: auto/);
  const fallback = css.indexOf('@supports not'), webkit = css.indexOf('::-webkit-scrollbar');
  assert.ok(webkit > fallback && css.indexOf('@media (forced-colors: none)') < webkit);
  assert.match(css, /border-radius: var\(--ds-radius-control, 6px\)/);
  assert.match(css, /@media \(forced-colors: active\)[^\n]*scrollbar-color: auto !important; scrollbar-width: auto !important/);
  assert.doesNotMatch(css, /scrollbar-width: none|overflow:|display: none|scrollbar-gutter:/, 'styling never removes scrolling or alters gutter ownership');
  assert.match(css, /data-scrollbar-surface="inverse"/);
  for (const scope of ['body', '#a, body', '.a}*{', '']) assert.throws(() => generateScrollbarCSS(scope), /CSS scope/);
});

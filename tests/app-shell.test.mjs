import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { generateAppShellCSS, generateLayoutCSS } from '../core/layout.mjs';
import { generateAppShellCSS as publicAppShellCSS } from '../core/components.mjs';
import { generateCSS, materializePackage } from '../core/engine.mjs';
import { PUBLIC_THEME_IDS } from '../tools/public-themes.mjs';

test('the optional app shell scopes desktop scroll ownership to its own direct regions', () => {
  assert.equal(publicAppShellCSS, generateAppShellCSS);
  const css = generateAppShellCSS('#product');
  assert.match(css, /:where\(#product\) \.ds-app-shell > \.ds-app-workspace > \.ds-app-content/);
  assert.match(css, /:where\(#product\)\.ds-app-shell > \.ds-app-navigation/);
  assert.match(css, /@media \(min-width: 801px\) and \(min-height: 481px\)/);
  assert.match(css, /grid-template-columns: var\(--ds-app-navigation-width, 14rem\) minmax\(0, 1fr\)/);
  assert.match(css, /block-size: var\(--ds-app-height, var\(--ds-app-viewport-height, 100vh\)\)/);
  assert.match(css, /\.ds-app-content[^{}]*\{ grid-row: 2; overflow: auto; scrollbar-gutter: stable;/);
  assert.match(css, /\.ds-app-navigation[^{}]*\{ overflow: auto;/, 'navigation remains reachable in short viewports');
  assert.match(css, /min-block-size: 0/, 'grid children may shrink instead of expanding the page');
  assert.doesNotMatch(css, /(?:^|\n)\s*(?:body|html|header|main|aside)\s*\{|position:\s*fixed/);
  const shellRules = [...css.matchAll(/[^{}]*\.ds-app-shell[^{}]*\{([^{}]*)\}/g)].map(match => match[1]).join('\n');
  assert.doesNotMatch(shellRules, /color:|background:/, 'the outer frame leaves product surfaces to the host');
  for (const invalid of ['', 'body', '.scope main', '#scope, body', '.scope}body{']) assert.throws(() => generateAppShellCSS(invalid), /CSS scope/);
});

test('the app shell releases scrolling on narrow or short viewports and has stable-scrollbar and viewport fallbacks', () => {
  const css = generateAppShellCSS();
  assert.match(css, /@supports \(block-size: 100dvh\)[\s\S]*--ds-app-viewport-height: 100dvh/);
  assert.match(css, /@supports not \(scrollbar-gutter: stable\)[\s\S]*@media \(min-width: 801px\) and \(min-height: 481px\)[\s\S]*overflow-y: scroll/);
  const mobile = css.slice(css.indexOf('@media (max-width: 800px), (max-height: 480px)'));
  assert.match(mobile, /display: block; block-size: auto; overflow: visible/);
  assert.match(mobile, /\.ds-app-content[^{}]*\{ overflow: visible; overscroll-behavior: auto/);
  assert.doesNotMatch(mobile, /overflow: hidden|overflow-y: scroll|100dvh|100vh/);
});

test('focusable app regions keep a full semantic focus ring inside the clipped viewport frame', () => {
  const css = generateAppShellCSS('#product');
  assert.match(css, /\.ds-app-navigation:focus-visible/);
  assert.match(css, /\.ds-app-content:focus-visible/);
  assert.match(css, /outline: max\(3px, var\(--ds-border-width-focus, 3px\)\) solid var\(--ds-color-focus, currentColor\)/);
  assert.match(css, /outline-offset: calc\(-1 \* max\(3px, var\(--ds-border-width-focus, 3px\)\)\)/);
});

test('all public themes carry the same opt-in app shell while legacy generation remains unchanged', () => {
  for (const id of PUBLIC_THEME_IDS) {
    const theme = JSON.parse(readFileSync(new URL('../packages/' + id + '.json', import.meta.url), 'utf8'));
    const css = generateCSS(theme, { scope: '#product' });
    assert.ok(css.includes(generateAppShellCSS('#product')), id);
    assert.ok(generateLayoutCSS('#product').includes(generateAppShellCSS('#product')));
    assert.doesNotMatch(generateCSS(materializePackage(theme)), /\.ds-app-shell/);
  }
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { materializePackage, resolveTokens, validatePackage } from '../core/engine.mjs';
import { componentContrastReport, contrastRatio, parseColor, themeContrastReport } from '../core/quality.mjs';

import { PUBLIC_THEME_IDS } from '../tools/public-themes.mjs';
const themes = await Promise.all(PUBLIC_THEME_IDS.map(async id => JSON.parse(await readFile(new URL('../packages/' + id + '.json', import.meta.url), 'utf8'))));
const literal = (value, resolved) => typeof value === 'string' ? value.replace(/\{([^}]+)\}/g, (_whole, key) => String(resolved[key])) : value;

for (const theme of themes) {
  test(theme.id + ' keeps readable semantic text, focus and component colour pairs', () => {
    const checked = validatePackage(theme);
    assert.equal(checked.valid, true, checked.errors.join('\n'));
    const resolved = resolveTokens(theme);
    const foundations = themeContrastReport(resolved);
    const componentPairs = componentContrastReport(materializePackage(theme), resolved);
    assert.ok(foundations.length >= 21, 'Caption and focus pairs must be included.');
    assert.deepEqual(foundations.filter(check => !check.passed), [], 'Foundational colour contrast regressed.');
    assert.deepEqual(componentPairs.filter(check => !check.passed), [], 'A displayed component text/background pair regressed.');
  });
}

test('Castle reading surfaces and framed actions are opaque while open actions remain transparent', () => {
  const theme = themes.find(theme => theme.id === 'castle-studio');
  const model = materializePackage(theme), resolved = resolveTokens(theme);
  for (const id of ['card', 'dialog', 'inspector', 'alert', 'input', 'select', 'toolbar', 'action-button', 'caption']) {
    const paint = parseColor(literal(model.components[id].parts.root.styles.backgroundColor, resolved));
    assert.ok(paint, id + ' must have an explicit measurable surface.');
    assert.equal(paint[3], 1, id + ' reading surface must be solid.');
  }
  const button = model.components.button;
  for (const variant of ['primary', 'secondary', 'danger', 'rounded', 'compact']) {
    const styles = { ...button.parts.root.styles, ...button.variants[variant].styles };
    const paint = parseColor(literal(styles.backgroundColor, resolved));
    assert.equal(paint?.[3], 1, 'button.' + variant + ' must have a solid ordinary action surface.');
  }
  const action = model.components['action-button'];
  for (const variant of ['vertical', 'horizontal', 'icon-only']) {
    const styles = { ...action.parts.root.styles, ...action.variants[variant].styles };
    assert.equal(parseColor(literal(styles.backgroundColor, resolved))?.[3], 1, 'action-button.' + variant + ' must have a solid framed action surface.');
  }
  assert.equal(parseColor(literal(model.components.toolbar.parts.action.styles.backgroundColor, resolved))?.[3], 1, 'A framed toolbar action must have its own solid surface.');
  // Open list/group actions use their solid container; they are not separate form-like controls.
  for (const variant of ['ghost', 'toolbar', 'icon', 'menu', 'list-item']) {
    const styles = { ...button.parts.root.styles, ...button.variants[variant].styles };
    assert.equal(parseColor(literal(styles.backgroundColor, resolved))?.[3], 0, 'button.' + variant + ' must preserve the deliberate open action hierarchy.');
  }
});

test('themes inherit one canonical role vocabulary and component documentation', () => {
  const retired = ['tool-button', 'simulation-caption', 'brandSelect', 'stat-row'];
  function visit(value) {
    if (!value || typeof value !== 'object') return;
    assert.equal(Object.hasOwn(value, 'description'), false, 'Appearance must inherit library descriptions.');
    for (const child of Object.values(value)) visit(child);
  }
  for (const theme of themes) {
    retired.forEach(id => assert.equal(Object.hasOwn(theme.appearance, id), false, theme.id + ': ' + id));
    visit(theme.appearance);
    for (const section of theme.brand?.sections ?? []) {
      retired.forEach(id => assert.equal(section.components.includes(id), false));
    }
  }
});

test('normal links and optional status text stay readable on the theme canvas and surface', () => {
  for (const theme of themes) {
    const model = materializePackage(theme), resolved = resolveTokens(theme);
    const linkColor = literal(model.components.button.variants.link.styles.color, resolved);
    for (const background of ['color.background.canvas', 'color.background.surface']) {
      assert.ok(contrastRatio(linkColor, resolved[background]) >= 4.5, theme.id + ': readable normal link on ' + background);
      for (const status of ['color.status.info', 'color.status.success', 'color.status.warning']) {
        if (status in resolved) assert.ok(contrastRatio(resolved[status], resolved[background]) >= 4.5, theme.id + ': ' + status + ' on ' + background);
      }
    }
    assert.equal(resolved['opacity.shortcut'], 1, 'Small shortcut text must preserve full contrast.');
  }
});


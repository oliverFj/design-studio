import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DEFAULT_SCALE_TOKENS, BREAKPOINTS } from '../core/scales.mjs';
import { validatePackage, resolveTokens, generateCSS } from '../core/engine.mjs';

test('shared scale tokens validate and aliases respond to primitive changes without changing component recipes', () => {
  const theme = JSON.parse(readFileSync(new URL('../packages/studio-light.json', import.meta.url), 'utf8'));
  Object.assign(theme.tokens, structuredClone(DEFAULT_SCALE_TOKENS));
  theme.tokens['space.1'] = {...theme.tokens['space.scale.1'], $value:'{space.scale.1}'};
  theme.tokens['shadow.card'].$value = '{elevation.level2}';
  assert.deepEqual(validatePackage(theme), { valid: true, errors: [] });
  assert.equal(resolveTokens(theme)['space.1'], '0.25rem');
  assert.equal(resolveTokens(theme)['shadow.card'], DEFAULT_SCALE_TOKENS['elevation.level2'].$value);
  theme.tokens['space.scale.1'].$value = '0.5rem';
  assert.equal(resolveTokens(theme)['space.1'], '0.5rem');
  assert.match(generateCSS(theme), /--ds-layer-popover: 100;/);
});

test('layer and elevation scales have stable ordering; all definitions are immutable', () => {
  assert.deepEqual(['base', 'sticky', 'popover', 'dialog', 'tooltip'].map(name => DEFAULT_SCALE_TOKENS['layer.' + name].$value), [0, 10, 100, 1000, 1100]);
  assert.equal(DEFAULT_SCALE_TOKENS['elevation.level0'].$value, 'none');
  assert.deepEqual(['small', 'medium', 'large'].map(name => DEFAULT_SCALE_TOKENS['size.icon.' + name].$value), ['16px', '20px', '24px']);
  assert.ok(Object.isFrozen(DEFAULT_SCALE_TOKENS));
  for (const token of Object.values(DEFAULT_SCALE_TOKENS)) assert.ok(Object.isFrozen(token));
  assert.ok(Object.isFrozen(BREAKPOINTS));
  assert.ok(BREAKPOINTS.compact < BREAKPOINTS.panel && BREAKPOINTS.panel < BREAKPOINTS.workspace);
});

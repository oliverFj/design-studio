import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createComponentFactory, renderComponent } from '../core/components.mjs';
import { generateCSS, validatePackage } from '../core/engine.mjs';
import { resolveThemeMode } from '../core/theme-modes.mjs';
import { PUBLIC_THEME_IDS } from '../tools/public-themes.mjs';
import { dom } from './support/dom.mjs';

const load = id => JSON.parse(readFileSync(new URL('../packages/' + id + '.json', import.meta.url), 'utf8'));

test('list items preserve native semantics and distinguish current content from focus in every authored mode', () => {
  for (const id of PUBLIC_THEME_IDS) {
    const source = load(id);
    for (const mode of Object.keys(source.modes ?? { light: {} })) {
      const theme = resolveThemeMode(source, mode), c = createComponentFactory(theme, { document: dom() });
      assert.deepEqual(validatePackage(theme), { valid: true, errors: [] }, id + '/' + mode);
      const row = c('list-item', { text: 'Beslutninger og næste skridt', description: 'Vejledning · afventer', current: true });
      assert.equal(row.tagName, 'BUTTON');
      assert.equal(row.getAttribute('type'), 'button');
      assert.equal(row.getAttribute('aria-current'), 'true');
      assert.equal(row.getAttribute('aria-selected'), null);
      assert.equal(row.getAttribute('aria-pressed'), null);
      assert.match(row.textContent, /Beslutninger og næste skridt/);
      assert.match(row.textContent, /Vejledning · afventer/);
      const link = c('list-item', { text: 'Åbn posten', href: '#post', current: true });
      assert.equal(link.tagName, 'A');
      assert.equal(link.getAttribute('href'), '#post');
      assert.equal(link.getAttribute('type'), null);
      const disabled = c('list-item', { text: 'Ikke tilgængelig', disabled: true });
      assert.equal(disabled.getAttribute('disabled'), '');
      const unavailableLink = c('list-item', { text: 'Ikke tilgængelig', href: '#post', disabled: true });
      assert.equal(unavailableLink.getAttribute('href'), null);
      assert.equal(unavailableLink.getAttribute('aria-disabled'), 'true');
      const css = generateCSS(theme);
      assert.match(css, /\.ds-list-item/);
      assert.match(css, /\.ds-list-item[^\n]*:focus-visible/);
    }
  }
});

test('list items escape content and URLs while legacy list buttons keep their existing API', () => {
  const theme = load('studio-light');
  const html = renderComponent(theme, 'list-item', { text: '<script>alert(1)</script>', current: true });
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /&lt;script&gt;/);
  assert.throws(() => renderComponent(theme, 'list-item', { href: 'javascript:alert(1)' }), /URL/);
  assert.match(renderComponent(theme, 'button', { variant: 'list-item', slots: { heading: 'Ældre produkt' } }), /Ældre produkt/);
});

test('native grouped selects restore the selected option through the shared factory', () => {
  const c = createComponentFactory(load('studio-light'), { document: dom() });
  const field = c('field', { label: 'Mønster', value: 'second', slots: { control: { tag: 'select', children: [
    { tag: 'optgroup', attrs: { label: 'Arbejdsforløb' }, children: [
      { tag: 'option', attrs: { value: 'first' }, text: 'Første' },
      { tag: 'option', attrs: { value: 'second' }, text: 'Anden' },
    ] },
  ] } } });
  assert.equal(field.querySelector('optgroup').getAttribute('label'), 'Arbejdsforløb');
  const options = field.querySelectorAll('option');
  assert.equal(options.find(node => node.getAttribute('value') === 'second').getAttribute('selected'), '');
  assert.equal(options.find(node => node.getAttribute('value') === 'first').getAttribute('selected'), null);
});

test('list item appearance schema exposes every canonical part, variant and state accepted by runtime', async () => {
  const { COMPONENT_LIBRARY } = await import('../core/library.mjs');
  const schema = JSON.parse(readFileSync(new URL('../schema/design-package.schema.json', import.meta.url), 'utf8'));
  const role = COMPONENT_LIBRARY['list-item'], definition = schema.properties.appearance.properties['list-item'];
  assert.ok(definition, 'constrained appearance schema includes the public list item role');
  assert.equal(definition.additionalProperties, false);
  for (const section of ['parts', 'variants', 'states']) {
    assert.deepEqual(Object.keys(definition.properties[section].properties).sort(), Object.keys(role[section]).sort(), section);
    assert.equal(definition.properties[section].additionalProperties, false);
  }
  for (const section of ['variants', 'states']) for (const value of Object.values(definition.properties[section].properties)) {
    assert.deepEqual(Object.keys(value.properties.parts.properties).sort(), Object.keys(role.parts).sort());
    assert.equal(value.properties.parts.additionalProperties, false);
    assert.deepEqual(value.properties.styles, { $ref: '#/$defs/appearanceStyles' });
  }
  const theme = resolveThemeMode(load('studio-light'), 'light');
  theme.appearance['list-item'] = { parts: { heading: { styles: { color: '{color.text.primary}' } } }, states: { current: { styles: { borderLeftColor: '{color.action.selected.rest.text}' } } } };
  assert.deepEqual(validatePackage(theme), { valid: true, errors: [] });
});

test('grouped select preview declarations agree between schema, validation and native rendering', async () => {
  const { materializePackage } = await import('../core/engine.mjs');
  const schema = JSON.parse(readFileSync(new URL('../schema/design-package.schema.json', import.meta.url), 'utf8'));
  const previewDefinition = schema.$defs.previewNode.oneOf.find(item => item.properties?.tag);
  assert.ok(previewDefinition.properties.tag.enum.includes('optgroup'));
  assert.deepEqual(previewDefinition.properties.attrs.properties.label, { type: 'string', maxLength: 1000 });
  const legacy = materializePackage(load('studio-light'));
  legacy.components.select.preview.children = [{ tag: 'optgroup', attrs: { label: 'Arbejdsforløb' }, children: [
    { tag: 'option', attrs: { value: 'first' }, text: 'Første' },
    { tag: 'option', attrs: { value: 'second' }, text: 'Anden' },
  ] }];
  assert.deepEqual(validatePackage(legacy), { valid: true, errors: [] });
  assert.match(renderComponent(legacy, 'select', { value: 'second' }), /<optgroup label="Arbejdsforløb"><option value="first">Første<\/option><option value="second" selected>Anden<\/option><\/optgroup>/);
  legacy.components.select.preview.children[0].attrs.label = 42;
  assert.equal(validatePackage(legacy).valid, false, 'native group labels remain bounded strings in declarations');
});

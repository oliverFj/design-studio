import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createComponent, createComponentFactory } from '../core/components.mjs';
import { getComponents, materializePackage } from '../core/engine.mjs';
import { DEFAULT_TOKENS } from '../core/library.mjs';
import { PUBLIC_THEME_IDS } from '../tools/public-themes.mjs';
import { dom } from './support/dom.mjs';

const theme = id => JSON.parse(readFileSync(new URL('../packages/' + id + '.json', import.meta.url), 'utf8'));
const snapshot = node => ({
  tag: node.tagName,
  attrs: [...node.attributes].sort(([a], [b]) => a.localeCompare(b)),
  text: node._text,
  value: node.value,
  children: node.childNodes.map(snapshot),
});
const composition = {
  idPrefix: 'factory-card',
  slots: {
    header: { component: 'heading', options: { idPrefix: 'factory-heading', text: 'Et arbejdsområde med lange danske feltnavne', variant: 'panel' } },
    body: { component: 'stack', options: { idPrefix: 'factory-stack', variant: 'compact', slots: { root: [
      { component: 'field', options: { idPrefix: 'factory-name', label: 'Arbejdsområdets navn', value: 'Ufærdig <kladde>', hint: 'Et genkendeligt navn.', error: 'Navnet skal være entydigt.', controlVariant: 'desktop', required: true, readOnly: true } },
      { component: 'choice-field', options: { idPrefix: 'factory-type', label: 'Kategori', value: 'review', controlVariant: 'desktop', slots: { control: { tag: 'select', children: [{ tag: 'option', attrs: { value: 'draft' }, text: 'Kladde' }, { tag: 'option', attrs: { value: 'review' }, text: 'Til gennemgang' }] } } } },
      { component: 'switch', options: { idPrefix: 'factory-notifications', label: 'Send besked ved ændringer', checked: true } },
    ] } } },
    footer: { component: 'button', options: { idPrefix: 'factory-save', text: 'Gem ændringer', variant: 'desktop', disabled: true } },
  },
};

test('component factory preserves composed native anatomy and field state in every public theme', () => {
  for (const id of PUBLIC_THEME_IDS) {
    const pack = theme(id), document = dom(), create = createComponentFactory(pack, { document });
    const expected = createComponent(pack, 'card', composition, { document });
    const actual = create('card', composition);
    assert.deepEqual(snapshot(actual), snapshot(expected), id);
    const name = actual.querySelector('#factory-name-control');
    assert.equal(name.value, 'Ufærdig <kladde>');
    assert.equal(name.getAttribute('data-variant'), 'desktop');
    assert.equal(name.getAttribute('aria-invalid'), 'true');
    assert.equal(name.getAttribute('required'), '');
    assert.equal(name.getAttribute('readonly'), '');
    assert.equal(actual.querySelector('[for="factory-name-control"]').textContent, 'Arbejdsområdets navn');
    for (const target of name.getAttribute('aria-describedby').split(' ')) assert.ok(actual.querySelector('#' + target));
    const select = actual.querySelector('#factory-type-control');
    assert.equal(select.value, 'review');
    assert.equal(select.querySelector('[value="review"]').getAttribute('selected'), '');
    assert.equal(actual.querySelector('[role="switch"]').getAttribute('checked'), '');
    assert.equal(actual.querySelector('button').getAttribute('disabled'), '');
    assert.equal(actual.querySelector('.ds-card__header').tagName, 'DIV', 'composed header keeps valid neutral anatomy');
  }
});

test('card Scene fields map to native slots and supported variants in every public theme', () => {
  for (const id of PUBLIC_THEME_IDS) {
    const pack = theme(id);
    const definition = getComponents(pack).card;
    const { fields, parts } = definition.scene;
    const create = createComponentFactory(pack, { document: dom() });
    const edits = { title: 'Status <i>for projektet</i>', body: 'Tre opgaver er klar til gennemgang.' };
    const slots = Object.fromEntries(Object.entries(edits).map(([key, value]) => [fields[key].slot, value]));
    assert.equal(fields.variant.defaultValue, 'default', id);
    for (const variant of Object.keys(fields.variant.options)) {
      assert.ok(Object.hasOwn(definition.variants, variant), id + ' · ' + variant);
    }
    const card = create('card', { variant: 'outlined', slots });
    assert.equal(card.getAttribute('data-variant'), 'outlined', id);
    for (const [part, field] of Object.entries(parts)) {
      const element = card.querySelector(definition.parts[part].selector);
      assert.equal(element.textContent, edits[field.textKey], id + ' · ' + part);
      assert.equal(element.children.length, 0, id + ' · ' + part + ' is rendered as text');
    }
  }
});

test('Scene library component fields render in their native parts in every public theme', () => {
  const examples = [
    ['heading', 'H2', 'display', { text: 'Nyt overblik' }],
    ['text', 'P', 'caption', { text: 'Beskrivelse med <em>ordret tekst</em>' }],
    ['badge', 'SPAN', 'accent', { text: 'Under arbejde' }],
    ['alert', 'SECTION', 'danger', { title: 'Ret en fejl', body: 'En oplysning mangler.' }],
  ];
  for (const themeId of PUBLIC_THEME_IDS) {
    const pack = theme(themeId);
    const definitions = getComponents(pack);
    const create = createComponentFactory(pack, { document: dom() });
    for (const [componentId, tagName, variant, edits] of examples) {
      const displayName = themeId + ' · ' + componentId;
      const definition = definitions[componentId];
      const { fields, parts } = definition.scene;
      assert.deepEqual(Object.keys(fields.variant.options).sort(), Object.keys(definition.variants).sort(), displayName);
      const slots = Object.fromEntries(Object.entries(edits).map(([key, value]) => [fields[key].slot, value]));
      const defaults = Object.fromEntries(Object.keys(edits).map(key => [fields[key].slot, fields[key].defaultValue]));
      const defaultElement = create(componentId, { variant: fields.variant.defaultValue, slots: defaults });
      const element = create(componentId, { variant, slots });
      assert.equal(element.tagName, tagName, displayName);
      assert.equal(element.getAttribute('data-variant'), variant, displayName);
      assert.deepEqual(Object.values(parts).map(part => part.textKey).sort(), Object.keys(edits).sort(), displayName);
      for (const [partId, { textKey }] of Object.entries(parts)) {
        const selector = definition.parts[partId].selector;
        const defaultPart = defaultElement.matches(selector) ? defaultElement : defaultElement.querySelector(selector);
        const part = element.matches(selector) ? element : element.querySelector(selector);
        assert.equal(defaultPart.textContent, fields[textKey].defaultValue, displayName + ' · ' + partId);
        assert.equal(part.textContent, edits[textKey], displayName + ' · ' + partId);
        assert.equal(part.children.length, 0, displayName + ' · ' + partId + ' is rendered as text');
      }
    }
  }
});

test('factory switch and checkbox controls preserve explicit true and false values', () => {
  for (const id of PUBLIC_THEME_IDS) {
    const pack = theme(id), document = dom(), create = createComponentFactory(pack, { document });
    for (const component of ['switch', 'checkbox']) for (const checked of [true, false]) {
      const options = { idPrefix: 'factory-' + component, checked, label: 'Aktivér indstillingen' };
      const actual = create(component, options);
      assert.deepEqual(snapshot(actual), snapshot(createComponent(pack, component, options, { document })), id + ' ' + component + ' ' + checked);
      assert.equal(actual.querySelector('input').getAttribute('checked'), checked ? '' : null);
      assert.match(actual.textContent, /Aktivér indstillingen/);
    }
  }
});

test('factory uses its own validated snapshot of component definitions and approved brand originals', () => {
  const document = dom(), legacy = materializePackage(theme('studio-light'));
  const createLegacy = createComponentFactory(legacy, { document });
  const options = { idPrefix: 'factory-snapshot', text: 'Bevar komponenten', variant: 'desktop' };
  const button = snapshot(createLegacy('button', options));
  delete legacy.components.button;
  legacy.tokens['color.text.primary'].$value = 'unsafe; color:red';
  assert.deepEqual(snapshot(createLegacy('button', options)), button);
  assert.throws(() => createComponentFactory(legacy, { document }), /Invalid design package/);

  const pack = theme('fjordside'), createBrand = createComponentFactory(pack, { document });
  const logo = pack.brand.logos[0], imageOptions = { idPrefix: 'factory-brand', logoId: logo.id };
  const original = snapshot(createBrand('brand-mark', imageOptions));
  logo.name = 'Ændret original';
  pack.brand.assets.find(asset => asset.id === logo.asset).data = Buffer.from('invalid image').toString('base64');
  pack.brand.logos = [];
  pack.brand.assets = [];
  assert.deepEqual(snapshot(createBrand('brand-mark', imageOptions)), original);
  assert.notEqual(snapshot(createComponent(pack, 'brand-mark', imageOptions, { document })).children[0].tag, original.children[0].tag);
});

test('factory rejects invalid themes at creation and invalid component requests at use', () => {
  const document = dom(), invalid = theme('studio-light');
  invalid.tokens['space.component.padding'] = { ...DEFAULT_TOKENS['space.component.padding'], $value: '0px' };
  assert.throws(() => createComponentFactory(invalid, { document }), /Invalid design package/);
  assert.throws(() => createComponentFactory(theme('studio-light'), { document: {} }), /DOM document/);
  const create = createComponentFactory(theme('studio-light'), { document });
  assert.throws(() => create('missing-role'), /Unknown shared component/);
  assert.throws(() => create('button', { variant: 'missing-variant' }), /Unknown component variant/);
  assert.throws(() => create('field', { controlVariant: 'missing-variant' }), /Unsupported control variant/);
  assert.throws(() => create('button', { attrs: { onclick: 'unsafe()' } }), /Unsupported component attribute/);
});

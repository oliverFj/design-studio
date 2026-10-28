import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { getComponents } from '../core/engine.mjs';
import { COMPOSITIONS } from '../patterns/catalog.mjs';
import { mountComposition, createCompositionState } from '../patterns/compositions.mjs';
import { mountCompositionGallery, createGalleryState } from '../patterns/gallery.mjs';
import { dom, fire } from './support/dom.mjs';

const theme = id => JSON.parse(readFileSync(new URL('../packages/' + id + '.json', import.meta.url), 'utf8'));
function fixture(id, state = createCompositionState(id)) {
  const document = dom(); const changes = [];
  const mounted = mountComposition(theme('studio-light'), id, { document, state, onChange: value => changes.push(value) });
  document.body.append(mounted.element); return { ...mounted, document, changes };
}

test('all compositions mount with shared components and unique field IDs in every theme', () => {
  for (const file of readdirSync(new URL('../packages/', import.meta.url)).filter(file => file.endsWith('.json'))) {
    const pack = theme(file.slice(0, -5)), catalog = getComponents(pack), document = dom();
    for (const [id, metadata] of Object.entries(COMPOSITIONS)) {
      for (const component of metadata.components) assert.ok(catalog[component]);
      const mounted = mountComposition(pack, id, { document, idPrefix: file + id });
      const ids = mounted.element.querySelectorAll('[id]').map(node => node.id);
      assert.equal(new Set(ids).size, ids.length);
      for (const label of mounted.element.querySelectorAll('label')) {
        const target = label.getAttribute('for');
        if (target) assert.ok(mounted.element.querySelector('#' + target));
      }
      mounted.destroy();
    }
  }
});

test('editor selection, property validation and tree update use the same model', () => {
  const mounted = fixture('editor'), { element, state, document } = mounted;
  const name = element.querySelector('#composition-editor-object-name-control');
  name.value = ''; fire(name, 'input'); fire(element.querySelector('form'), 'submit');
  assert.equal(state.objects.find(item => item.id === 'panel').label, 'Hovedflade');
  assert.equal(document.activeElement.getAttribute('aria-invalid'), 'true');
  const validName = element.querySelector('#composition-editor-object-name-control');
  validName.value = 'Mit objekt'; fire(validName, 'input'); fire(element.querySelector('form'), 'submit');
  assert.equal(state.objects.find(item => item.id === 'panel').label, 'Mit objekt');
  assert.match(element.querySelector('.ds-tree').textContent, /Mit objekt/);
  fire(element.querySelector('[data-object="detail"]'), 'click');
  assert.equal(state.selected, 'detail');
  assert.equal(element.querySelector('#composition-editor-object-name-control').value, 'Detalje');
  mounted.destroy();
});

test('FormLab pattern search preserves hierarchy, selection and the original fold state', () => {
  const { element, state } = fixture('editor');
  state.expanded = [];
  const name = element.querySelector('#composition-editor-object-name-control'); name.value = 'Ufærdig kladde'; fire(name, 'input'); name.focus();
  const search = element.querySelector('#composition-editor-object-search-control');
  search.value = 'Detalje'; fire(search, 'input');
  assert.ok(element.querySelector('[data-tree-id="collection"]'));
  assert.ok(element.querySelector('[data-tree-id="detail"]'));
  assert.equal(element.querySelector('[data-tree-id="panel"]'), null);
  assert.deepEqual(state.selectedIds, ['panel']);
  assert.deepEqual(state.expanded, []);
  assert.equal(element.querySelector('#composition-editor-object-name-control'), name);
  assert.equal(name.value, 'Ufærdig kladde');
  assert.equal(element.querySelector('[data-tree-id="collection"]').getAttribute('aria-expanded'), 'true');
  search.value = ''; fire(search, 'input');
  assert.equal(element.querySelector('[data-tree-id="collection"]').getAttribute('aria-expanded'), 'false');
});

test('FormLab group actions preserve selection, and inherited locks prevent edits until unlocked', () => {
  const { element, state } = fixture('editor');
  const group = () => element.querySelector('[data-tree-id="collection"]');
  const lock = group().querySelectorAll('.ds-tree__action')[1];
  fire(lock, 'click');
  assert.equal(state.objects[0].locked, true);
  assert.deepEqual(state.selectedIds, ['panel']);
  assert.equal(element.querySelector('#composition-editor-object-name-control').getAttribute('disabled'), '');
  const name = element.querySelector('#composition-editor-object-name-control'); name.value = 'Forbidden'; fire(name, 'input'); fire(element.querySelector('form'), 'submit');
  assert.equal(state.objects.find(item => item.id === 'panel').label, 'Hovedflade');
  fire(group().querySelectorAll('.ds-tree__action')[1], 'click');
  assert.equal(state.objects[0].locked, false);
  assert.deepEqual(state.selectedIds, ['panel']);
  fire(group().querySelectorAll('.ds-tree__action')[0], 'click');
  assert.equal(element.querySelector('[data-object="panel"]'), null);
  assert.ok(group());
  assert.deepEqual(state.selectedIds, ['panel']);
});

test('FormLab multiselection preserves mixed values, and inspector tabs and move actions are keyboard accessible', () => {
  const state = createCompositionState('editor'); state.selectedIds = ['panel', 'detail'];
  state.drafts.panel = { name: 'Hovedflade', width: '8', mixedWidth: false };
  const { element, document } = fixture('editor', state);
  assert.equal(element.querySelector('#composition-editor-object-name-control'), null);
  const width = () => element.querySelector('#composition-editor-object-width-control');
  assert.equal(width().getAttribute('placeholder'), 'Forskellige værdier');
  fire(element.querySelector('form'), 'submit');
  assert.deepEqual(state.objects.filter(item => ['panel', 'detail'].includes(item.id)).map(item => item.width), [8, 3]);
  width().value = '6'; fire(width(), 'input'); fire(element.querySelector('form'), 'submit');
  assert.deepEqual(state.objects.filter(item => ['panel', 'detail'].includes(item.id)).map(item => item.width), [6, 6]);
  const properties = element.querySelector('[data-tab="properties"]');
  fire(properties, 'keydown', { key: 'End' });
  assert.equal(state.tab, 'actions');
  assert.equal(document.activeElement.getAttribute('data-tab'), 'actions');
  assert.equal(element.querySelector('[data-tab="actions"]').getAttribute('aria-selected'), 'true');
  const select = element.querySelector('#composition-editor-move-target-control'); select.value = 'archive'; fire(select, 'change');
  fire(element.querySelector('[data-action="move-objects"]'), 'click');
  assert.ok(state.objects.filter(item => ['panel', 'detail'].includes(item.id)).every(item => item.parent === 'archive'));
  assert.ok(state.expanded.includes('archive'));
  assert.deepEqual(state.selectedIds, ['panel', 'detail']);
  assert.equal(state.tab, 'actions');
  const details = element.querySelector('details'); details.open = false; fire(details, 'toggle');
  fire(element.querySelector('[data-object="panel"]'), 'click');
  assert.equal(state.tab, 'actions');
  assert.equal(element.querySelector('details').open, false);
  assert.equal(width().value, '6');
});

test('form rejects invalid input, saves to session state, and restores saved values', () => {
  const { element, state, document } = fixture('form');
  const name = () => element.querySelector('#composition-form-name-control');
  name().value = ' '; fire(name(), 'input'); fire(element.querySelector('form'), 'submit');
  assert.equal(state.saved.name, 'Mit arbejdsområde');
  assert.equal(document.activeElement, name());
  name().value = 'Et nyt navn'; fire(name(), 'input'); fire(element.querySelector('form'), 'submit');
  assert.equal(state.saved.name, 'Et nyt navn');
  name().value = 'Kladde'; fire(name(), 'input'); fire(element.querySelector('[data-action="reset-form"]'), 'click');
  assert.equal(state.draft.name, 'Et nyt navn');
});

test('list filtering, empty state and review action keep selection and detail consistent', () => {
  const { element, state } = fixture('list-detail');
  fire(element.querySelector('[data-item="practice"]'), 'click');
  assert.equal(state.selected, 'practice');
  fire(element.querySelector('[data-action="review"]'), 'click');
  assert.equal(state.items.find(item => item.id === 'practice').reviewed, true);
  const search = element.querySelector('input'); search.value = 'ingen træffere'; fire(search, 'input');
  assert.equal(state.selected, null); assert.match(element.textContent, /Ingen poster matcher/);
  assert.equal(element.querySelector('[data-action="review"]'), null);
  search.value = 'Reference'; fire(search, 'input'); assert.equal(state.selected, 'reference');
});

test('gallery retains independent example state across selection and theme remount', () => {
  const state = createGalleryState(), document = dom();
  let gallery = mountCompositionGallery(theme('studio-light'), { document, state });
  const picker = gallery.element.querySelector('select'); picker.value = 'form'; fire(picker, 'change');
  const input = gallery.element.querySelector('#patterns-form-name-control'); input.value = 'Bevar kladden'; fire(input, 'input');
  gallery.destroy(); gallery = mountCompositionGallery(theme('nocturne'), { document, state });
  assert.equal(gallery.element.querySelector('#patterns-form-name-control').value, 'Bevar kladden');
  assert.equal(state.drafts.editor.selected, 'panel');
  gallery.destroy();
});

test('resource library combines filters, preserves view and favorites, and recovers from empty results', () => {
  const { element, state } = fixture('resource-library');
  const type = element.querySelector('#composition-resource-library-type-control'); type.value = 'Skabelon'; fire(type, 'change');
  const search = element.querySelector('#composition-resource-library-search-control'); search.value = 'kompakt'; fire(search, 'input');
  assert.equal(state.selected, 'compact'); assert.equal(element.querySelectorAll('[data-resource]').length, 1);
  fire(element.querySelector('[data-resource-favorite="compact"]'), 'click'); assert.equal(state.items.find(item => item.id === 'compact').favorite, true);
  fire(element.querySelector('[data-action="view-list"]'), 'click'); assert.equal(state.view, 'list'); assert.ok(element.querySelector('[data-resource="compact"]'));
  const checkbox = element.querySelectorAll('input').find(node => node.getAttribute('type') === 'checkbox'); checkbox.checked = true; fire(checkbox, 'change');
  search.value = 'ingen match'; fire(search, 'input'); assert.equal(state.selected, null); assert.match(element.textContent, /Ingen ressourcer matcher/);
  assert.equal(element.querySelector('[data-action="use-resource"]'), null);
  fire(element.querySelector('[data-action="clear-empty"]'), 'click'); assert.equal(state.type, 'all'); assert.equal(state.query, ''); assert.equal(state.favoritesOnly, false); assert.equal(state.view, 'list');
});

test('resource use is a product callback receiving a copy; a truly empty library is distinct', () => {
  const document = dom(), state = createCompositionState('resource-library'); let used;
  const mounted = mountComposition(theme('studio-light'), 'resource-library', { document, state, onUse: item => { used = item; item.title = 'Product copy'; } });
  fire(mounted.element.querySelector('[data-action="use-resource"]'), 'click');
  assert.equal(used.id, 'starter'); assert.equal(state.lastUsed, 'starter'); assert.equal(state.items[0].title, 'Startskabelon'); mounted.destroy();
  state.items = []; const empty = mountComposition(theme('studio-light'), 'resource-library', { document, state });
  assert.match(empty.element.textContent, /Biblioteket er tomt/); assert.equal(empty.element.querySelector('[data-action="clear-empty"]'), null); empty.destroy();
});

test('history example groups field changes, protects native text undo, and supports scoped keyboard shortcuts', () => {
  const { element, state } = fixture('history');
  const input = element.querySelector('input'); input.value = 'Ny samling'; fire(input, 'input');
  assert.equal(state.history.past.length, 0); fire(element.querySelector('[data-action="add-item"]'), 'click'); assert.equal(state.history.present.items.length, 2);
  fire(input, 'change'); assert.equal(state.history.past.length, 1); assert.equal(state.history.present.title, 'Ny samling');
  const native = fire(input, 'keydown', { key: 'z', ctrlKey: true }); assert.notEqual(native.defaultPrevented, true); assert.equal(state.history.present.title, 'Ny samling');
  fire(element, 'keydown', { key: 'z', ctrlKey: true }); assert.equal(state.history.present.title, 'Min samling');
  fire(element, 'keydown', { key: 'Z', metaKey: true, shiftKey: true }); assert.equal(state.history.present.title, 'Ny samling');
  fire(element.querySelector('[data-action="save-history"]'), 'click'); assert.equal(state.history.saved, JSON.stringify(state.history.present));
  fire(element.querySelector('[data-action="add-item"]'), 'click'); assert.equal(state.history.present.items.length, 3);
  fire(element.querySelector('[data-action="undo"]'), 'click'); assert.equal(state.history.present.items.length, 2);
  assert.match(element.textContent, /Ved gemmepunktet/);
  fire(element.querySelector('[data-action="remove-item"]'), 'click'); assert.equal(state.history.future.length, 0);
});

test('invalid history drafts preserve document and can be canceled without creating history', () => {
  const { element, state } = fixture('history'); const input = element.querySelector('input');
  input.value = ' '; fire(input, 'input'); fire(input, 'change'); assert.equal(input.getAttribute('aria-invalid'), 'true');
  assert.equal(state.history.present.title, 'Min samling'); assert.equal(state.history.past.length, 0);
  fire(element.querySelector('[data-action="cancel-draft"]'), 'click'); assert.equal(input.value, 'Min samling'); assert.equal(input.getAttribute('aria-invalid'), null);
  assert.equal(state.history.past.length, 0);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mountComposition } from '../patterns/compositions.mjs';
import { dom, fire } from './support/dom.mjs';

// These tests exercise explicit focus and key handlers, not native Tab traversal or paint.
const themes = ['fjordside', 'midnight-editorial'].map(id => JSON.parse(readFileSync(new URL('../packages/' + id + '.json', import.meta.url), 'utf8')));
function fixture(theme, id) {
  const document = dom(), mounted = mountComposition(theme, id, { document });
  document.body.append(mounted.element);
  return { ...mounted, document };
}

test('inspector arrow keys wrap with one selected tab and the corresponding visible panel', () => {
  for (const theme of themes) {
    const { element, document, state, destroy } = fixture(theme, 'editor');
    const tab = id => element.querySelector('[data-tab="' + id + '"]');
    for (const [from, key, to] of [['properties', 'ArrowLeft', 'actions'], ['actions', 'ArrowRight', 'properties'], ['properties', 'End', 'actions'], ['actions', 'Home', 'properties'], ['properties', 'ArrowRight', 'relations']]) {
      tab(from).focus();
      const event = fire(tab(from), 'keydown', { key });
      assert.equal(event.defaultPrevented, true);
      assert.equal(state.tab, to);
      assert.equal(document.activeElement, tab(to));
      for (const id of ['properties', 'relations', 'actions']) {
        assert.equal(tab(id).getAttribute('tabindex'), id === to ? '0' : '-1');
        assert.equal(tab(id).getAttribute('aria-selected'), String(id === to));
        assert.equal(tab(id).getAttribute('aria-pressed'), null);
        const panel = element.querySelector('#' + tab(id).getAttribute('aria-controls'));
        assert.equal(panel.hidden, id !== to);
        assert.equal(panel.getAttribute('aria-labelledby'), tab(id).id);
      }
    }
    destroy();
  }
});

test('form validation focuses the first remaining error and successful submit and reset retain a usable action', () => {
  for (const theme of themes) {
    const { element, document, state, destroy } = fixture(theme, 'form');
    const input = key => element.querySelector('#composition-form-' + key + '-control');
    for (const key of ['name', 'email']) { input(key).value = ' '; fire(input(key), 'input'); }
    fire(element.querySelector('form'), 'submit');
    assert.equal(document.activeElement, input('name'));
    assert.equal(state.saved.name, 'Mit arbejdsområde');
    assert.match(input('name').getAttribute('aria-describedby'), /-error/);
    input('name').value = 'Et realistisk arbejdsområde med et langt navn'; fire(input('name'), 'input');
    fire(element.querySelector('form'), 'submit');
    assert.equal(document.activeElement, input('email'));
    input('email').value = 'kontakt@example.com'; fire(input('email'), 'input');
    fire(element.querySelector('form'), 'submit');
    assert.equal(document.activeElement, element.querySelector('[data-action="save-form"]'));
    assert.equal(element.querySelector('[aria-invalid="true"]'), null);
    input('name').value = 'Ugemt kladde'; fire(input('name'), 'input');
    fire(element.querySelector('[data-action="reset-form"]'), 'click');
    assert.equal(document.activeElement, element.querySelector('[data-action="reset-form"]'));
    assert.equal(input('name').value, state.saved.name);
    destroy();
  }
});

test('list selection and review restore focus while search keeps focus through empty results', () => {
  for (const theme of themes) {
    const { element, document, destroy } = fixture(theme, 'list-detail');
    const entry = () => element.querySelector('[data-item="practice"]');
    entry().focus(); fire(entry(), 'click');
    assert.equal(document.activeElement, entry());
    assert.equal(entry().getAttribute('aria-current'), 'true');
    const review = () => element.querySelector('[data-action="review"]');
    review().focus(); fire(review(), 'click');
    assert.equal(document.activeElement, review());
    assert.equal(review().getAttribute('aria-pressed'), 'true');
    const search = element.querySelector('input'); search.focus(); search.value = 'intet resultat'; fire(search, 'input');
    assert.equal(document.activeElement, search);
    assert.equal(element.querySelector('[data-item]'), null);
    search.value = ''; fire(search, 'input');
    assert.equal(document.activeElement, search);
    assert.ok(element.querySelector('[data-item]'));
    destroy();
  }
});

test('history commands transfer focus when their own control becomes unavailable', () => {
  for (const theme of themes) {
    const { element, document, state, destroy } = fixture(theme, 'history');
    const action = id => element.querySelector('[data-action="' + id + '"]');
    const input = element.querySelector('input');
    input.value = ' '; fire(input, 'input'); fire(input, 'change');
    action('cancel-draft').focus(); fire(action('cancel-draft'), 'click');
    assert.equal(document.activeElement, input);
    assert.equal(action('cancel-draft').hidden, true);
    assert.equal(input.getAttribute('aria-invalid'), null);
    assert.equal(state.history.past.length, 0);
    fire(action('add-item'), 'click');
    action('undo').focus(); fire(action('undo'), 'click');
    assert.equal(action('undo').disabled, true);
    assert.equal(document.activeElement, action('redo'));
    fire(action('redo'), 'click');
    assert.equal(action('redo').disabled, true);
    assert.equal(document.activeElement, action('undo'));
    while (state.history.present.items.length) { action('remove-item').focus(); fire(action('remove-item'), 'click'); }
    assert.equal(action('remove-item').disabled, true);
    assert.equal(document.activeElement, action('add-item'));
    destroy();
  }
});

test('history shortcuts leave text editing and unhandled or modified keys with the browser', () => {
  const { element, state, destroy } = fixture(themes[0], 'history');
  fire(element.querySelector('[data-action="add-item"]'), 'click');
  const present = JSON.stringify(state.history.present);
  const input = element.querySelector('input');
  assert.notEqual(fire(input, 'keydown', { key: 'z', ctrlKey: true }).defaultPrevented, true);
  const editable = input.ownerDocument.createElement('div'), nested = input.ownerDocument.createElement('span');
  editable.setAttribute('contenteditable', 'true'); editable.append(nested); element.append(editable);
  assert.notEqual(fire(nested, 'keydown', { key: 'z', metaKey: true }).defaultPrevented, true);
  assert.notEqual(fire(element, 'keydown', { key: 'z', ctrlKey: true, altKey: true }).defaultPrevented, true);
  assert.notEqual(fire(element, 'keydown', { key: 'x', ctrlKey: true }).defaultPrevented, true);
  assert.equal(JSON.stringify(state.history.present), present);
  assert.equal(fire(element, 'keydown', { key: 'z', ctrlKey: true }).defaultPrevented, true);
  assert.notEqual(JSON.stringify(state.history.present), present);
  destroy();
});

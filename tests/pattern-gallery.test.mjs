import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { COMPOSITIONS } from '../patterns/catalog.mjs';
import { mountCompositionGallery, createGalleryState } from '../patterns/gallery.mjs';
import { dom, fire } from './support/dom.mjs';

const theme = JSON.parse(readFileSync(new URL('../packages/studio-light.json', import.meta.url), 'utf8'));

test('catalog navigation, picker and current preview agree without losing drafts or focus', () => {
  const document = dom(), state = createGalleryState();
  const mounted = mountCompositionGallery(theme, { document, state }); document.body.append(mounted.element);
  const root = mounted.element, picker = root.querySelector('select');
  assert.equal(root.querySelectorAll('[data-pattern-nav]').length, Object.keys(COMPOSITIONS).length);
  const form = root.querySelector('[data-pattern-nav="form"]'); form.focus(); fire(form, 'click');
  assert.equal(document.activeElement, form);
  assert.equal(form.getAttribute('aria-current'), 'true');
  assert.equal(picker.value, 'form');
  const name = root.querySelector('#patterns-form-name-control'); name.value = 'Bevar dette'; fire(name, 'input');
  fire(root.querySelector('[data-pattern-nav="editor"]'), 'click');
  fire(root.querySelector('[data-action="reset-pattern"]'), 'click');
  assert.equal(document.activeElement, root.querySelector('[data-action="reset-pattern"]'));
  picker.value = 'form'; fire(picker, 'change');
  assert.equal(root.querySelector('#patterns-form-name-control').value, 'Bevar dette');
  assert.equal(root.querySelectorAll('[aria-current="true"]').filter(node => node.getAttribute('data-pattern-nav')).length, 1);
  mounted.destroy();
});

test('catalog recovers an unknown selection and gives references a readable structure', () => {
  const document = dom(), state = { selected: 'removed-example', drafts: {} };
  const mounted = mountCompositionGallery(theme, { document, state });
  assert.equal(state.selected, 'editor');
  assert.equal(mounted.element.querySelector('[data-preview]').getAttribute('data-preview'), 'editor');
  assert.ok(mounted.element.querySelector('.composition-behaviour-list'));
  assert.ok(mounted.element.querySelector('.composition-component-tags'));
  assert.equal(mounted.element.querySelectorAll('pre').length, 1, 'only the optional integration code uses a code block');
  mounted.destroy();
});

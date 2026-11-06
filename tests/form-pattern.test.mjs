import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createFormState, mountForm } from '../patterns/form.mjs';
import { dom, fire } from './support/dom.mjs';

const theme = JSON.parse(readFileSync(new URL('../packages/studio-light.json', import.meta.url), 'utf8'));
function fixture(state = createFormState()) {
  const document = dom(), changes = [], announcements = [];
  const mounted = mountForm(theme, { document, state, onChange: value => changes.push(value), announce: message => announcements.push(message) });
  document.body.append(mounted.element);
  return { ...mounted, document, changes, announcements };
}

test('form tracks actual unsaved edits without replacing focused controls or repeating callbacks', () => {
  const { element, state, document, changes, announcements, destroy } = fixture();
  const status = element.querySelector('[data-form-state]'), name = element.querySelector('#composition-form-name-control');
  assert.equal(status.getAttribute('data-form-state'), 'clean');
  name.focus(); name.value = 'Et andet arbejdsområde'; fire(name, 'input');
  assert.equal(document.activeElement, name);
  assert.equal(element.querySelector('#composition-form-name-control'), name);
  assert.equal(state.saved.name, 'Mit arbejdsområde');
  assert.equal(status.getAttribute('data-form-state'), 'dirty');
  name.value = state.saved.name; fire(name, 'input');
  assert.equal(status.getAttribute('data-form-state'), 'clean', 'reverting the exact draft removes the unsaved state');
  const checkbox = element.querySelector('[type="checkbox"]');
  checkbox.checked = false; fire(checkbox, 'change'); assert.equal(status.getAttribute('data-form-state'), 'dirty');
  checkbox.checked = true; fire(checkbox, 'change'); assert.equal(status.getAttribute('data-form-state'), 'clean');
  assert.equal(changes.length, 4, 'each edit produces one change callback');
  assert.equal(announcements.length, 0, 'ordinary typing does not repeatedly call the host announcer');
  destroy();
});

test('form remount keeps invalid drafts and removes event handlers from replaced and destroyed controls', () => {
  const mounted = fixture(), { element, state, changes } = mounted;
  const oldName = element.querySelector('#composition-form-name-control');
  oldName.value = ''; fire(oldName, 'input'); fire(element.querySelector('form'), 'submit');
  assert.equal(state.saved.name, 'Mit arbejdsområde');
  assert.equal(element.querySelector('#composition-form-name-control').getAttribute('aria-invalid'), 'true');
  const before = changes.length;
  oldName.value = 'Et forældet input'; fire(oldName, 'input');
  assert.equal(changes.length, before, 'controls replaced during validation no longer mutate the draft');
  assert.equal(state.draft.name, '');
  const oldForm = element.querySelector('form'); mounted.destroy();
  fire(oldForm, 'submit'); assert.equal(changes.length, before);
  const remounted = fixture(state);
  assert.equal(remounted.element.querySelector('#composition-form-name-control').value, '');
  assert.equal(remounted.element.querySelector('#composition-form-name-control').getAttribute('aria-invalid'), 'true');
  assert.match(remounted.element.textContent, /Ret de markerede felter/);
  assert.equal(remounted.changes.length, 0);
  remounted.destroy();
});

test('form cannot retain a saved confirmation after a host changes the draft before remount', () => {
  const mounted = fixture(), { state } = mounted;
  fire(mounted.element.querySelector('form'), 'submit');
  assert.equal(state.confirmed, true);
  assert.ok(mounted.element.querySelector('.ds-alert'));
  mounted.destroy(); state.draft.email = 'ny-adresse@example.com';
  const remounted = fixture(state);
  assert.equal(remounted.element.querySelector('.ds-alert'), null);
  assert.equal(state.confirmed, false);
  assert.equal(remounted.element.querySelector('[data-form-state]').getAttribute('data-form-state'), 'dirty');
  assert.equal(state.saved.email, 'team@example.com');
  const reset = remounted.element.querySelector('[data-action="reset-form"]'); fire(reset, 'click');
  assert.equal(state.draft.email, 'team@example.com');
  assert.equal(remounted.document.activeElement, remounted.element.querySelector('[data-action="reset-form"]'));
  assert.equal(remounted.changes.length, 1);
  remounted.destroy();
});

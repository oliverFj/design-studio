import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createObjectWorkbenchState, mountObjectWorkbench } from '../patterns/object-workbench.mjs';
import { dom, fire } from './support/dom.mjs';

const theme = id => JSON.parse(readFileSync(new URL('../packages/' + id + '.json', import.meta.url), 'utf8'));
function fixture(state = createObjectWorkbenchState(), id = 'studio-light') {
  const document = dom(), changes = [];
  const mounted = mountObjectWorkbench(theme(id), { document, state, idPrefix: 'workbench', onChange: value => changes.push(value) });
  document.body.append(mounted.element);
  return { ...mounted, document, changes };
}
const input = (root, key) => root.querySelector('#workbench-object-' + key + '-control');
const status = root => root.querySelector('[data-property-status]');

test('the workspace and tree expose the same ownership hierarchy beside one combined inspector dock', () => {
  const mounted = fixture(), { element, state } = mounted;
  const layout = element.querySelector('.composition-object-editor');
  assert.deepEqual(layout.children.map(node => node.className.split(' ')[0]), ['composition-workbench', 'composition-object-dock']);
  assert.deepEqual(element.querySelector('.composition-object-dock').children.map(node => node.className.includes('composition-properties')), [false, true]);
  assert.equal(element.querySelectorAll('.composition-object-group').length, 2);
  for (const body of element.querySelectorAll('.ds-card__body')) assert.equal(body.tagName, 'DIV', 'composed card content uses a neutral container for sections and controls');
  for (const object of state.objects) {
    const control = element.querySelector('[data-object="' + object.id + '"]');
    assert.equal(control.tagName, 'BUTTON');
    assert.equal(control.getAttribute('type'), 'button');
    assert.equal(control.textContent, '', 'selection has no separate visible command');
    assert.equal(control.getAttribute('aria-label'), 'Vælg ' + object.label);
    assert.equal(control.getAttribute('data-variant'), 'ghost');
    assert.equal(control.getAttribute('aria-pressed'), null, 'selection is a command, not a primary toggle');
    const marker = element.querySelector('#' + control.getAttribute('aria-describedby'));
    assert.equal(marker.textContent, state.selectedIds.includes(object.id) ? 'Valgt' : 'Ikke valgt');
  }
  assert.match(element.querySelector('.composition-workspace').textContent, /8 enheder/);
  const panel = element.querySelector('[data-scene-object="panel"]'), detail = element.querySelector('[data-scene-object="detail"]');
  assert.ok(panel.contains(detail), 'the detail is visually inside its actual owner');
  assert.equal(detail.getAttribute('data-owner'), 'panel');
  assert.ok(element.querySelector('[data-tree-id="panel"]').contains(element.querySelector('[data-tree-id="detail"]')));
  assert.equal(detail.style.width, '37.5%', 'the child width is relative to its owner, not the collection');
  assert.equal(element.querySelectorAll('[data-action="apply-properties"]').length, 1);
  assert.equal(element.querySelector('[data-action="apply-properties"]').getAttribute('data-variant'), 'primary');
  mounted.destroy();
});

test('surface hit buttons select groups and nested objects without selecting ancestors', () => {
  const mounted = fixture(), { element, state } = mounted;
  let parentClicks = 0, groupClicks = 0;
  element.querySelector('[data-scene-object="panel"]').addEventListener('click', () => parentClicks++);
  element.querySelector('[data-scene-group="collection"]').addEventListener('click', () => groupClicks++);
  const detail = element.querySelector('[data-object="detail"]');
  const event = fire(detail, 'click');
  assert.equal(event.stopped, true);
  assert.deepEqual(state.selectedIds, ['detail']);
  assert.equal(parentClicks, 0); assert.equal(groupClicks, 0);
  assert.equal(element.querySelector('[data-scene-object="panel"]').getAttribute('data-selected'), 'false');
  assert.equal(element.querySelector('[data-scene-group="collection"]').getAttribute('data-selected'), 'false');
  fire(element.querySelector('[data-object="collection"]'), 'click');
  assert.deepEqual(state.selectedIds, ['collection']);
  assert.equal(element.querySelector('[data-scene-group="collection"]').getAttribute('data-selected'), 'true');
  assert.equal(element.querySelector('[data-tree-id="collection"]').getAttribute('aria-selected'), 'true');
  fire(element.querySelector('[data-object="archive"]'), 'click');
  assert.deepEqual(state.selectedIds, ['archive']);
  assert.equal(element.querySelector('[data-scene-group="archive"]').getAttribute('data-selected'), 'true');
  assert.equal(element.querySelector('[data-scene-group="collection"]').getAttribute('data-selected'), 'false');
  mounted.destroy();
});

test('native surface activation retains keyboard access, modifier selection and target focus', () => {
  const mounted = fixture(), { element, state, document, changes } = mounted;
  for (const control of element.querySelectorAll('[data-object]')) {
    assert.equal(control.tagName, 'BUTTON');
    assert.equal(control.querySelectorAll('button').length, 0, 'a surface control never contains descendant controls');
    assert.equal(control.getAttribute('tabindex'), null, 'native tab order is retained');
    const key = fire(control, 'keydown', { key: 'Enter' });
    assert.equal(Boolean(key.defaultPrevented), false, 'Enter is left to native button activation');
    const space = fire(control, 'keydown', { key: ' ' });
    assert.equal(Boolean(space.defaultPrevented), false, 'Space is left to native button activation');
  }
  // detail:0 is the click generated by native keyboard/button activation.
  const before = changes.length;
  fire(element.querySelector('[data-object="panel"]'), 'click', { detail: 0 });
  assert.equal(changes.length, before + 1, 'one native activation is one selection change');
  fire(element.querySelector('[data-object="detail"]'), 'click', { ctrlKey: true });
  assert.deepEqual(state.selectedIds, ['panel', 'detail']);
  fire(element.querySelector('[data-object="detail"]'), 'click', { metaKey: true });
  assert.deepEqual(state.selectedIds, ['panel']);
  assert.equal(document.activeElement, element.querySelector('[data-object="detail"]'), 'deselection retains focus on the activated surface');
  mounted.destroy();
});

test('locked surface controls cannot change selection even through a dispatched click', () => {
  const state = createObjectWorkbenchState(); state.objects.find(item => item.id === 'detail').locked = true;
  const mounted = fixture(state), { element } = mounted;
  const detail = element.querySelector('[data-object="detail"]');
  assert.equal(detail.getAttribute('disabled'), '');
  assert.equal(element.querySelector('[data-scene-object="detail"]').getAttribute('data-locked'), 'true');
  fire(detail, 'click');
  assert.deepEqual(state.selectedIds, ['panel']);
  mounted.destroy();
});

test('scene selection and ancestor-preserving search address the same nested object', () => {
  const mounted = fixture(), { element, state, document } = mounted;
  fire(element.querySelector('[data-object="detail"]'), 'click');
  assert.deepEqual(state.selectedIds, ['detail']);
  assert.equal(element.querySelector('[data-tree-id="detail"]').getAttribute('aria-selected'), 'true');
  assert.equal(element.querySelector('[data-scene-object="detail"]').getAttribute('data-selected'), 'true');
  assert.equal(document.activeElement, element.querySelector('[data-object="detail"]'));
  const search = element.querySelector('#workbench-object-search-control');
  state.expanded = []; search.value = 'Detalje'; fire(search, 'input');
  for (const id of ['collection', 'panel', 'detail']) assert.ok(element.querySelector('[data-tree-id="' + id + '"]'), id);
  assert.deepEqual(state.expanded, [], 'search opens ancestors only for its result view');
  assert.equal(element.querySelector('[data-scene-object="detail"]').getAttribute('data-selected'), 'true');
  mounted.destroy();
});

test('dimension changes reject broken containment atomically and allow a coordinated owner-child edit', () => {
  const mounted = fixture(), { element, state } = mounted;
  input(element, 'width').value = '2'; fire(input(element, 'width'), 'input');
  fire(element.querySelector('form'), 'submit');
  assert.deepEqual(state.objects.filter(item => item.kind === 'object').map(item => item.width), [8, 3]);
  assert.equal(input(element, 'width').value, '2');
  assert.match(element.querySelector('.ds-field__error').textContent + element.textContent, /Detalje skal kunne være inden for Hovedflade/);
  fire(element.querySelector('[data-object="detail"]'), 'click');
  input(element, 'width').value = '9'; fire(input(element, 'width'), 'input');
  fire(element.querySelector('form'), 'submit');
  assert.deepEqual(state.objects.filter(item => item.kind === 'object').map(item => item.width), [8, 3]);
  fire(element.querySelector('[data-object="panel"]'), 'click');
  fire(element.querySelector('[data-object="detail"]'), 'click', { ctrlKey: true });
  input(element, 'width').value = '2'; fire(input(element, 'width'), 'input');
  fire(element.querySelector('form'), 'submit');
  assert.deepEqual(state.objects.filter(item => item.kind === 'object').map(item => item.width), [2, 2]);
  assert.equal(element.querySelector('[data-scene-object="detail"]').style.width, '100%');
  assert.equal(state.objects.find(item => item.id === 'detail').parent, 'panel');
  mounted.destroy();
});

test('organizational moves preserve physical ownership and cannot detach a child or move locked content', () => {
  const mounted = fixture(), { element, state } = mounted;
  const chooseTarget = () => { fire(element.querySelector('[data-tab="actions"]'), 'click'); const target = element.querySelector('#workbench-move-target-control'); target.value = 'archive'; fire(target, 'change'); fire(element.querySelector('[data-action="move-objects"]'), 'click'); };
  fire(element.querySelector('[data-object="detail"]'), 'click'); chooseTarget();
  assert.equal(state.objects.find(item => item.id === 'detail').parent, 'panel');
  assert.equal(state.objects.find(item => item.id === 'panel').groupId, 'collection');
  fire(element.querySelector('[data-object="panel"]'), 'click');
  const detailRow = () => element.querySelector('[data-tree-id="detail"]');
  fire(detailRow().querySelectorAll('.ds-tree__action')[1], 'click'); chooseTarget();
  assert.equal(state.objects.find(item => item.id === 'panel').groupId, 'collection', 'a parent cannot indirectly move its locked child');
  fire(detailRow().querySelectorAll('.ds-tree__action')[1], 'click'); chooseTarget();
  assert.equal(state.objects.find(item => item.id === 'panel').groupId, 'archive');
  assert.equal(state.objects.find(item => item.id === 'detail').parent, 'panel');
  assert.equal(state.objects.find(item => item.id === 'detail').groupId, undefined);
  const group = element.querySelector('[data-scene-group="archive"]');
  assert.ok(group.contains(element.querySelector('[data-scene-object="panel"]')));
  assert.ok(group.contains(element.querySelector('[data-scene-object="detail"]')));
  assert.equal(state.tab, 'actions', 'the action tab and focus survive moving the owner');
  mounted.destroy();
});

test('visibility follows ownership and organizational groups have no physical dimension editor', () => {
  const mounted = fixture(), { element, state } = mounted;
  const panelRow = () => element.querySelector('[data-tree-id="panel"]');
  fire(panelRow().querySelectorAll('.ds-tree__action')[0], 'click');
  assert.equal(element.querySelector('[data-scene-object="panel"]'), null);
  assert.equal(element.querySelector('[data-scene-object="detail"]'), null);
  assert.equal(state.objects.find(item => item.id === 'detail').visible, true, 'inherited hiding does not overwrite the child setting');
  fire(panelRow().querySelectorAll('.ds-tree__action')[0], 'click');
  assert.ok(element.querySelector('[data-scene-object="detail"]'));
  fire(element.querySelector('[data-object="collection"]'), 'click');
  assert.equal(input(element, 'width'), null, 'an organizational collection has no physical bounds');
  fire(element.querySelector('form'), 'submit');
  assert.equal(status(element).getAttribute('data-property-state'), 'applied');
  assert.equal(state.objects.find(item => item.id === 'collection').width, undefined);
  mounted.destroy();
});

test('validation errors and drafts survive switching selection and remounting a different theme', () => {
  let mounted = fixture(); const state = mounted.state;
  input(mounted.element, 'name').value = ''; fire(input(mounted.element, 'name'), 'input');
  input(mounted.element, 'width').value = '0'; fire(input(mounted.element, 'width'), 'input');
  fire(mounted.element.querySelector('form'), 'submit');
  assert.equal(state.objects.find(item => item.id === 'panel').label, 'Hovedflade');
  assert.equal(status(mounted.element).getAttribute('data-property-state'), 'invalid');
  assert.equal(mounted.document.activeElement, input(mounted.element, 'name'));
  fire(mounted.element.querySelector('[data-object="detail"]'), 'click');
  fire(mounted.element.querySelector('[data-object="panel"]'), 'click');
  assert.equal(input(mounted.element, 'name').getAttribute('aria-invalid'), 'true');
  assert.equal(input(mounted.element, 'width').value, '0');
  mounted.destroy(); mounted = fixture(state, 'nocturne');
  assert.equal(input(mounted.element, 'width').getAttribute('aria-invalid'), 'true');
  assert.equal(input(mounted.element, 'name').value, '');
  assert.equal(status(mounted.element).getAttribute('data-property-state'), 'invalid');
  assert.equal(state.folds.dimensions, true);
  mounted.destroy();
});

test('draft, applied and discarded status follow the model without losing the applied values', () => {
  const mounted = fixture(), { element, state } = mounted;
  assert.equal(status(element).getAttribute('data-property-state'), 'clean');
  input(element, 'name').value = 'Min hovedflade'; fire(input(element, 'name'), 'input');
  assert.equal(status(element).getAttribute('data-property-state'), 'draft');
  assert.equal(state.objects.find(item => item.id === 'panel').label, 'Hovedflade');
  fire(element.querySelector('form'), 'submit');
  assert.equal(state.objects.find(item => item.id === 'panel').label, 'Min hovedflade');
  assert.equal(status(element).getAttribute('data-property-state'), 'applied');
  input(element, 'width').value = '-2'; fire(input(element, 'width'), 'input');
  assert.equal(status(element).getAttribute('data-property-state'), 'draft');
  fire(element.querySelector('form'), 'submit');
  assert.equal(status(element).getAttribute('data-property-state'), 'invalid');
  fire(element.querySelector('[data-action="reset-properties"]'), 'click');
  assert.equal(input(element, 'name').value, 'Min hovedflade');
  assert.equal(input(element, 'width').value, '8');
  assert.equal(input(element, 'width').getAttribute('aria-invalid'), null);
  assert.equal(status(element).getAttribute('data-property-state'), 'clean');
  assert.equal(mounted.document.activeElement, element.querySelector('[data-action="reset-properties"]'));
  mounted.destroy();
});

test('property navigation keeps the active tab, and locked selections retain their draft', () => {
  const mounted = fixture(), { element, state, document } = mounted;
  input(element, 'name').value = 'Ufærdig'; fire(input(element, 'name'), 'input');
  fire(element.querySelector('[data-tab="relations"]'), 'click');
  fire(element.querySelector('[data-action="show-properties"]'), 'click');
  assert.equal(document.activeElement, element.querySelector('[data-tab="relations"]'));
  const lock = () => element.querySelector('[data-tree-id="collection"]').querySelectorAll('.ds-tree__action')[1];
  fire(lock(), 'click');
  assert.equal(state.tab, 'relations');
  assert.equal(status(element).getAttribute('data-property-state'), 'locked');
  assert.equal(input(element, 'name').value, 'Ufærdig');
  fire(lock(), 'click');
  assert.equal(input(element, 'name').getAttribute('disabled'), null);
  assert.equal(status(element).getAttribute('data-property-state'), 'draft');
  assert.deepEqual(state.selectedIds, ['panel']);
  mounted.destroy();
});

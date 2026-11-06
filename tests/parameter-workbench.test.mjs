import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolveThemeMode } from '../core/theme-modes.mjs';
import { createParameterWorkbenchState, mountParameterWorkbench } from '../patterns/parameter-workbench.mjs';
import { dom, fire } from './support/dom.mjs';

const theme = JSON.parse(readFileSync(new URL('../packages/studio-light.json', import.meta.url), 'utf8'));
function fixture(options = {}) {
  const document = options.document ?? dom(), changes = [], used = [], announcements = [];
  const mounted = mountParameterWorkbench(theme, { document, onChange: state => changes.push(state), onUse: value => used.push(value), announce: message => announcements.push(message), ...options });
  document.body.append(mounted.element);
  const action = name => mounted.element.querySelector('[data-action="' + name + '"]');
  const edit = (key, value) => { const input = mounted.element.querySelector('#parameter-workbench-' + key + '-number'); input.value = value; fire(input, 'input'); return input; };
  const slide = (key, value) => { const input = mounted.element.querySelector('#parameter-workbench-' + key + '-control'); input.value = value; fire(input, 'input'); return input; };
  return { ...mounted, document, changes, used, announcements, action, edit, slide };
}

test('parameter workbench updates live while saving, copying and use remain explicit', async () => {
  const mounted = fixture(), { state, element, action, edit, used } = mounted;
  const image = element.querySelector('img'), initialSource = image.getAttribute('src');
  edit('width', '10');
  assert.equal(element.querySelector('img'), image, 'live updates retain the image node');
  assert.equal(state.records.length, 0); assert.equal(used.length, 0);
  assert.equal(await mounted.whenSettled(), true);
  assert.equal(state.result.sample.width, 10);
  assert.notEqual(element.querySelector('img').getAttribute('src'), initialSource);
  assert.equal(action('calculate').hidden, true, 'there is no mandatory update action in live mode');
  fire(action('use'), 'click');
  assert.equal(used.length, 1); assert.equal(used[0].sourceId, null); assert.equal(state.records.length, 0, 'using a result does not silently save it');
  used[0].sample.width = 2; assert.equal(state.lastUsed.sample.width, 10); assert.equal(state.result.sample.width, 10);
  fire(action('save'), 'click');
  const originalId = state.savedId;
  assert.equal(state.records.length, 1); assert.equal(state.records[0].sample.width, 10);
  edit('spacing', '32'); await mounted.whenSettled(); fire(action('save'), 'click');
  assert.equal(state.savedId, originalId); assert.equal(state.records.length, 1, 'Save updates the active identity');
  fire(action('save-copy'), 'click');
  assert.notEqual(state.savedId, originalId); assert.equal(state.records.length, 2);
  fire(action('use'), 'click'); assert.equal(used[1].sourceId, state.savedId, 'using a saved copy retains that copy’s identity');
  edit('width', '8'); await mounted.whenSettled(); fire(action('save'), 'click');
  assert.equal(state.records.find(item => item.id === originalId).sample.width, 10, 'a copied record has independent values');
  assert.equal(state.records.find(item => item.id === state.savedId).sample.width, 8);
  assert.match(element.textContent, /Ingen fil eller server/);
  mounted.destroy();
});

test('older producer responses cannot overwrite a newer draft or active calculation', async () => {
  const jobs = [];
  const mounted = fixture({ produce: (input, context) => new Promise(resolve => jobs.push({ input, ...context, resolve })) });
  mounted.edit('angle', '20');
  assert.equal(jobs.length, 1); assert.equal(mounted.state.phase, 'calculating');
  mounted.edit('spacing', '32'); assert.equal(jobs[0].signal.aborted, true);
  const second = mounted.whenSettled(), changes = mounted.changes.length;
  jobs[0].resolve(jobs[0].input); await Promise.resolve(); await Promise.resolve();
  assert.equal(mounted.changes.length, changes, 'discarding an old response produces no callbacks');
  assert.equal(mounted.state.phase, 'calculating', 'the newer calculation remains active');
  assert.equal(mounted.state.result.sample.spacing, 24);
  jobs[1].resolve(jobs[1].input); assert.equal(await second, true);
  assert.equal(mounted.state.result.sample.spacing, 32); assert.equal(mounted.state.result.sample.angle, 20);
  mounted.destroy();
});

test('destroy aborts computation and a theme remount preserves the draft and accepted result', async () => {
  let resolve, signal;
  const mounted = fixture({ produce: (input, context) => { signal = context.signal; return new Promise(done => { resolve = () => done(input); }); } });
  const previous = mounted.state.result;
  mounted.edit('width', '12'); const pending = mounted.whenSettled();
  const oldInput = mounted.element.querySelector('#parameter-workbench-width-number');
  mounted.destroy(); assert.equal(signal.aborted, true);
  const changeCount = mounted.changes.length;
  resolve(); assert.equal(await pending, false);
  oldInput.value = '4'; fire(oldInput, 'input');
  assert.equal(mounted.changes.length, changeCount); assert.equal(mounted.state.result, previous);
  const document = dom(); let computations = 0;
  const remounted = mountParameterWorkbench(resolveThemeMode(theme, 'dark'), { document, state: mounted.state, produce: input => { computations++; return input; } });
  assert.equal(remounted.state.phase, 'idle'); assert.equal(remounted.state.draft.width, '12');
  assert.equal(await remounted.whenSettled(), true); assert.equal(computations, 1, 'an interrupted live draft resumes automatically');
  assert.equal(remounted.state.result.sample.width, 12);
  const accepted = remounted.state.result; remounted.destroy();
  const currentMount = mountParameterWorkbench(theme, { document: dom(), state: mounted.state, produce: input => { computations++; return input; } });
  assert.equal(computations, 1, 'a current result is reused during a normal theme remount');
  assert.equal(currentMount.state.result, accepted); currentMount.destroy();
  remounted.destroy();
});

test('invalid parameters preserve the accepted result and errors survive remount', async () => {
  let computations = 0;
  const mounted = fixture({ produce: input => { computations++; return input; } });
  mounted.edit('width', '10'); const previous = mounted.state.result;
  mounted.edit('spacing', '8');
  assert.equal(await mounted.whenSettled(), false); assert.equal(computations, 1);
  assert.equal(await mounted.calculate(), false);
  assert.equal(mounted.document.activeElement.getAttribute('id'), 'parameter-workbench-width-number');
  assert.match(mounted.state.errors.width, /mindre end/); assert.equal(mounted.state.result, previous);
  mounted.destroy();
  const remounted = fixture({ state: mounted.state });
  const invalid = remounted.element.querySelector('#parameter-workbench-width-number');
  assert.equal(invalid.getAttribute('id'), 'parameter-workbench-width-number');
  for (const id of invalid.getAttribute('aria-describedby').split(' ')) assert.ok(remounted.element.querySelector('#' + id));
  remounted.edit('width', '4'); assert.equal(await remounted.whenSettled(), true); assert.equal(remounted.element.querySelector('[aria-invalid="true"]'), null);
  remounted.destroy();
});

test('failed calculations preserve previous data and can be retried without accepting stale use', async () => {
  let fail = true;
  const mounted = fixture({ produce: input => { if (fail) throw new Error('failed producer'); return input; } });
  const previous = mounted.state.result;
  mounted.edit('angle', '45'); assert.equal(await mounted.whenSettled(), false);
  assert.equal(mounted.state.result, previous); assert.equal(mounted.action('use').disabled, true);
  fire(mounted.action('use'), 'click'); assert.equal(mounted.used.length, 0);
  assert.equal(mounted.action('calculate').hidden, false);
  fail = false; fire(mounted.action('calculate'), 'click'); assert.equal(await mounted.whenSettled(), true); assert.equal(mounted.state.result.sample.angle, 45);
  mounted.destroy();
});

test('host draft changes invalidate pending work and computation does not steal an actively edited name', async () => {
  const state = createParameterWorkbenchState(); let resolve;
  const mounted = fixture({ state, produce: input => new Promise(done => { resolve = () => done(input); }) });
  const previous = state.result;
  const first = mounted.calculate();
  state.draft.angle = '15'; state.revision++;
  resolve(); assert.equal(await first, false); assert.equal(state.result, previous);
  assert.equal(state.phase, 'idle', 'a host invalidation cannot leave the workbench permanently busy');
  assert.equal(mounted.action('calculate').hidden, false, 'a stale result has an explicit recovery action when no job is running');
  assert.equal(mounted.element.querySelector('[data-preview-state]').textContent, 'Prøven skal opdateres');
  const second = mounted.calculate();
  const name = mounted.element.querySelector('#parameter-workbench-name-control'); name.focus(); name.value = 'Mit nye navn'; fire(name, 'input');
  resolve(); assert.equal(await second, true);
  assert.equal(mounted.document.activeElement, name, 'a later completion does not move focus away from name editing');
  assert.equal(state.name, 'Mit nye navn');
  mounted.destroy();
});

test('sliders and precise numbers stay synchronized with stable focus and visible wide errors', async () => {
  const mounted = fixture(), { element, document, state } = mounted;
  assert.equal(element.querySelectorAll('.ds-range-field').length, 3);
  assert.equal(element.querySelectorAll('output').length, 0, 'the integrated precise input is the only visible value');
  assert.equal(element.querySelectorAll('label').some(label => label.textContent === 'Værdi'), false);
  const slider = element.querySelector('#parameter-workbench-spacing-control');
  const number = element.querySelector('#parameter-workbench-spacing-number');
  slider.focus(); mounted.slide('spacing', '35');
  assert.equal(number.value, '35'); assert.equal(state.result.sample.spacing, 35);
  const revision = state.revision; fire(slider, 'change'); fire(slider, 'blur');
  assert.equal(state.revision, revision, 'native commit events do not duplicate the live calculation');
  assert.equal(document.activeElement, slider); assert.equal(element.querySelector('#parameter-workbench-spacing-control'), slider);
  number.focus(); mounted.edit('spacing', '42');
  assert.equal(slider.value, '42'); assert.equal(document.activeElement, number);
  const previous = state.result; mounted.edit('spacing', '');
  assert.equal(await mounted.whenSettled(), false); assert.equal(state.result, previous);
  assert.equal(slider.value, '42', 'an invalid precise draft does not force a fabricated slider value');
  assert.equal(number.getAttribute('aria-invalid'), 'true');
  const errorId = number.getAttribute('aria-describedby').split(' ').find(id => id.endsWith('-error'));
  const error = element.querySelector('#' + errorId);
  assert.ok(error.textContent); assert.equal(error.hidden, false);
  assert.ok(error.parentNode.className.includes('ds-range-field'), 'the shared field owns the full-width error');
  assert.equal(error.parentNode.getAttribute('data-variant'), 'with-input', 'validation keeps the integrated layout');
  for (const name of ['save', 'save-copy', 'use']) { assert.equal(mounted.action(name).disabled, true); fire(mounted.action(name), 'click'); }
  assert.equal(state.records.length, 0); assert.equal(mounted.used.length, 0);
  mounted.edit('spacing', '30'); assert.equal(await mounted.whenSettled(), true);
  assert.equal(state.result.sample.spacing, 30); assert.equal(number.getAttribute('aria-invalid'), null);
  assert.equal(document.activeElement, number); assert.equal(mounted.announcements.length, 0, 'live updates never announce each tick');
  mounted.destroy();
});

test('animation-frame coalescing updates only the latest preview without remounting controls or library', () => {
  const document = dom(), frames = new Map(); let nextFrame = 0;
  document.defaultView = { requestAnimationFrame: callback => { frames.set(++nextFrame, callback); return nextFrame; }, cancelAnimationFrame: id => frames.delete(id) };
  const mounted = fixture({ document }), image = mounted.element.querySelector('img'), initial = image.getAttribute('src');
  const libraryRow = mounted.element.querySelector('.composition-parameter-library').firstChild;
  const slider = mounted.element.querySelector('#parameter-workbench-angle-control'); slider.focus();
  mounted.slide('angle', '10'); mounted.slide('angle', '20'); mounted.slide('angle', '30');
  assert.equal(frames.size, 1); assert.equal(mounted.state.result.sample.angle, 30, 'state follows the input synchronously');
  assert.equal(image.getAttribute('src'), initial, 'the visual decode is coalesced to the next frame');
  const callback = [...frames.values()][0]; frames.clear(); callback();
  assert.notEqual(image.getAttribute('src'), initial); assert.match(decodeURIComponent(image.getAttribute('src')), /rotate\(30\)/);
  assert.equal(mounted.element.querySelector('img'), image); assert.equal(document.activeElement, slider);
  assert.equal(mounted.element.querySelector('.composition-parameter-library').firstChild, libraryRow);
  assert.equal(mounted.announcements.length, 0);
  mounted.slide('angle', '40'); assert.equal(frames.size, 1); mounted.destroy(); assert.equal(frames.size, 0);
});

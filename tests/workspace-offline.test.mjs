import test from 'node:test';
import assert from 'node:assert/strict';
import { Script, createContext } from 'node:vm';
import { buildWorkspaceHTML } from '../tools/build-workspace.mjs';
import { offlineIssues } from '../tools/offline-checks.mjs';
import { PUBLIC_THEME_IDS } from '../tools/public-themes.mjs';
import { dom, fire } from './support/dom.mjs';

test('the realistic workspace is one executable offline HTML file with all public themes', async () => {
  const html = await buildWorkspaceHTML();
  assert.deepEqual(offlineIssues(html), []);
  assert.doesNotMatch(html, /<script\b[^>]*(?:src=|type="module")|<link\b[^>]*rel="stylesheet"/i);
  for (const id of PUBLIC_THEME_IDS) assert.ok(html.includes(id), id + ' is bundled');
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  assert.equal(scripts.length, 1);
  assert.doesNotThrow(() => new Script(scripts[0][1]));
  assert.match(html, /<html[^>]*lang="da"/);

  // Execute the delivered bundle in the test DOM. This checks boot wiring, not browser layout.
  const document = dom(), window = document.createElement('window');
  document.documentElement = document.createElement('html');
  for (const [tag, id] of [['style', 'theme-styles'], ['header', 'example-controls'], ['div', 'app']]) {
    const node = document.createElement(tag); node.setAttribute('id', id); document.body.append(node);
  }
  document.querySelector = selector => document.body.querySelector(selector);
  const context = createContext({ document, window, Intl, URL, Blob, atob, btoa, TextDecoder, TextEncoder, setTimeout, clearTimeout, confirm: () => true });
  // Theme and composition snapshots are JSON data; keep their prototypes in the VM realm.
  context.structuredClone = new Script('(value) => JSON.parse(JSON.stringify(value))').runInContext(context);
  new Script(scripts[0][1]).runInContext(context, { timeout: 10000 });
  const app = document.querySelector('#app');
  assert.ok(app.querySelector('[data-project="kyst"]'), 'the standalone bundle actually mounts the workspace');
  fire(app.querySelector('[data-tab="settings"]'), 'click');
  let title = app.querySelector('#workspace-title-control'); title.value = 'Bevar min kladde'; fire(title, 'input');
  for (const id of PUBLIC_THEME_IDS) {
    app.querySelector('.ds-app-content').scrollTop = 180;
    app.querySelector('.ds-app-navigation').scrollTop = 35;
    app.querySelector('.ds-panel-content').scrollTop = 90;
    app.querySelector('.ds-form-fields').scrollTop = 140;
    const picker = document.querySelector('#example-theme-control'); picker.value = id; fire(picker, 'change');
    title = app.querySelector('#workspace-title-control');
    assert.equal(title.value, 'Bevar min kladde', id + ': changing theme preserves unfinished work');
    assert.equal(document.activeElement, document.querySelector('#example-theme-control'));
    assert.equal(app.querySelector('.ds-app-content').scrollTop, 180, id + ': changing theme preserves content scroll');
    assert.equal(app.querySelector('.ds-app-navigation').scrollTop, 35, id + ': changing theme preserves navigation scroll');
    assert.equal(app.querySelector('.ds-panel-content').scrollTop, 90, id + ': changing theme preserves project-list scroll');
    assert.equal(app.querySelector('.ds-form-fields').scrollTop, 140, id + ': changing theme preserves form-field scroll');
  }
  const originalTitle = title, modePicker = document.querySelector('#example-color-mode-control');
  const themeCSS = document.querySelector('#theme-styles');
  for (const mode of ['light', 'dark', 'system']) {
    const previousCSS = themeCSS.textContent;
    modePicker.focus(); modePicker.value = mode; fire(modePicker, 'change');
    assert.equal(app.querySelector('#workspace-title-control'), originalTitle, mode + ': palette changes keep the native controls mounted');
    assert.equal(title.value, 'Bevar min kladde', mode + ': palette changes preserve the unfinished draft');
    assert.equal(document.activeElement, modePicker, mode + ': palette changes keep focus on the picker');
    assert.equal(app.querySelector('.ds-app-content').scrollTop, 180, mode + ': palette changes preserve content scroll');
    assert.equal(app.querySelector('.ds-form-fields').scrollTop, 140, mode + ': palette changes preserve form scroll');
    if (mode !== 'light') assert.notEqual(themeCSS.textContent, previousCSS, mode + ': palette changes update the generated theme');
  }
  const beforeUnload = fire(window, 'beforeunload');
  assert.equal(beforeUnload.defaultPrevented, true, 'an unfinished project draft protects against accidental closing');
});

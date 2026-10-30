import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { transformSync } from 'esbuild';
import { generatePreferenceCSS } from '../core/preferences.mjs';
import { renderComponent, createComponentFactory, mountMultiselect, mountDataGrid } from '../core/components.mjs';
import {dom,fire} from './support/dom.mjs';

const theme = JSON.parse(readFileSync(new URL('../packages/studio-light.json', import.meta.url), 'utf8'));
const css = generatePreferenceCSS('#product');
const forced = css.slice(css.indexOf('@media (forced-colors: active)'));
const gridOptions={columns:[{id:'name',label:'Navn',editable:true}],rows:[{id:'first',cells:{name:'Første'}},{id:'second',cells:{name:'Anden'}}]};

test('preference rules are scoped valid CSS and cannot introduce a global selector', () => {
  assert.deepEqual(transformSync(css, { loader: 'css' }).warnings, []);
  for (const scope of ['body', '#a, body', '.a}*{', '', null]) assert.throws(() => generatePreferenceCSS(scope), /CSS scope/);
  assert.match(css, /#product \*, #product \*::before, #product \*::after/);
  assert.doesNotMatch(css, /\.ds-scope|forced-color-adjust:\s*none|appearance:\s*none/);
});

test('reduced motion stops CSS motion without hiding controls or changing layout', () => {
  const reduced = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'), css.indexOf('@media (prefers-contrast: more)'));
  assert.match(reduced, /prefers-reduced-motion: reduce/);
  for (const declaration of ['animation: none !important', 'transition: none !important', 'scroll-behavior: auto !important']) assert.ok(reduced.includes(declaration));
  assert.doesNotMatch(reduced, /display:|visibility:|opacity:|overflow:|height:|width:/);
});

test('higher contrast strengthens the existing theme instead of substituting another palette', () => {
  const contrast = css.slice(css.indexOf('@media (prefers-contrast: more)'), css.indexOf('@media (forced-colors: active)'));
  assert.match(contrast, /and \(forced-colors: none\)/);
  assert.match(contrast, /border-color: var\(--ds-color-text-primary\)/);
  assert.match(contrast, /outline-width: max\(4px,/);
  assert.match(contrast, /\[aria-invalid="true"\][^}]*border-style: dashed/);
  assert.doesNotMatch(contrast, /background-color:|(?:^|[;{])\s*color:|#[\da-f]{3,8}\b/i);
});

test('forced colors preserve selection independently of focus in buttons, menu choices and nested tree rows', () => {
  for (const state of ['aria-pressed', 'aria-selected', 'aria-checked', 'aria-current']) assert.ok(forced.includes(state), state);
  assert.match(forced, /color: HighlightText !important; background-color: Highlight !important; border-color: Highlight !important/);
  assert.match(forced, /\.ds-tree__item[^}]* > \.ds-tree__row/);
  assert.doesNotMatch(forced, /\.ds-tree__item(?:\[[^\]]+\])?(?::is\([^)]*\))?\s+\.ds-tree__row/, 'an ancestor selection cannot repaint nested rows through a descendant selector');
  assert.match(forced, /:focus-visible[^}]*solid Highlight !important/);
  assert.match(forced, /outline-offset: max\(2px,/);
  assert.match(renderComponent(theme, 'button', { state: 'pressed' }), /aria-pressed="true"/);
  assert.match(renderComponent(theme, 'menu-item', { attrs: { role: 'menuitemcheckbox', 'aria-checked': 'true' } }), /aria-checked="true"/);
});

test('native controls, switch state and inherited SVG colors survive the system palette', () => {
  assert.match(css.slice(0, css.indexOf('@media')), /\.ds-switch > \.ds-switch__control:focus-visible[^}]*opacity: 0 !important/);
  assert.match(forced, /color: FieldText !important; background-color: Field !important/);
  assert.match(forced, /color: ButtonText !important; background-color: ButtonFace !important/);
  assert.match(forced, /\.ds-link\[href\][^}]*color: LinkText/);
  assert.match(forced, /\.ds-icon[^}]*color: inherit/);
  assert.match(forced, /\.ds-switch > \.ds-switch__control[^}]*opacity: 0 !important/);
  assert.match(forced, /\.ds-switch:has\(> \.ds-switch__control:checked\) > \.ds-switch__track[^}]*background-color: Highlight/);
  assert.match(forced, /\.ds-switch:has\(> \.ds-switch__control:checked\) > \.ds-switch__track > \.ds-switch__thumb[^}]*background-color: HighlightText/);
  assert.match(forced, /\.ds-switch:has\(> \.ds-switch__control:focus-visible\) > \.ds-switch__track[^}]*outline:/);
  assert.match(forced, /:is\(:disabled, \[aria-disabled="true"\]\)[^}]*color: GrayText/);
  assert.match(renderComponent(theme, 'switch', { checked: true }), /<input[^>]*type="checkbox"[^>]*checked/);
  assert.match(renderComponent(theme, 'checkbox'), /<input[^>]*type="checkbox"/);
  assert.match(renderComponent(theme, 'radio'), /<input[^>]*type="radio"/);
});

test('new choice/date/file controls and live grid editors have forced system field boundaries',()=>{
  const document=dom(),create=createComponentFactory(theme,{document});
  for(const role of ['combobox','multiselect','date-picker','time-picker','file-upload']){
    const root=create(role,{idPrefix:'contrast-'+role}),control=root.querySelector('input');
    assert.ok(control);assert.ok(forced.includes('.'+control.className),role+' has a shared field rule');
  }
  const grid=create('data-grid',{idPrefix:'contrast-grid',...gridOptions});document.body.append(grid);
  const controller=mountDataGrid(grid,gridOptions);assert.equal(controller.startEdit(),true);
  const editor=grid.querySelector('input');assert.equal(editor.className,'ds-data-grid__editor');
  assert.ok(forced.includes('.'+editor.className));controller.destroy();
  assert.match(forced,/\.ds-file-upload__control::file-selector-button[^}]*color: ButtonText !important; background-color: ButtonFace/);
  for(const role of ['toast','empty-state','file-upload','data-table','data-grid'])assert.ok(forced.includes('.ds-'+role),role+' retains a boundary or surface');
  assert.match(forced,/\.ds-progress__control[^}]*accent-color: auto[^}]*outline: 1px solid CanvasText/);
  assert.match(forced,/\.ds-skeleton[^}]*border: 1px solid GrayText/);
  assert.match(forced,/\.ds-spinner__indicator[^}]*border-right-style: dotted/);
});

test('selected and active options have independent high-contrast cues while DOM focus stays on input',()=>{
  const document=dom(),create=createComponentFactory(theme,{document});
  const root=create('multiselect',{idPrefix:'contrast-choices',items:[{id:'a',label:'Anna'},{id:'b',label:'Mikkel'}],values:['a']});document.body.append(root);
  const control=mountMultiselect(root),input=root.querySelector('input');input.focus();control.open();
  const option=root.querySelector('[data-active="true"]');assert.equal(option.getAttribute('aria-selected'),'true');assert.equal(document.activeElement,input);
  assert.match(forced,/:is\(\.ds-combobox__option, \.ds-multiselect__option\)\[aria-selected="true"\][^}]*color: HighlightText !important; background-color: Highlight/);
  assert.match(forced,/:is\(\.ds-combobox__option, \.ds-multiselect__option\)\[data-active="true"\][^}]*outline: 2px solid CanvasText !important/);
  assert.match(forced,/\[aria-selected="true"\]\[data-active="true"\][^}]*outline-color: HighlightText !important/);
  assert.match(forced,/\[aria-selected="true"\]\[aria-disabled="true"\][^}]*outline: 2px dashed GrayText !important/);
  control.destroy();
});

test('table row selections target direct cells and grid focus remains distinct inside a selected range',()=>{
  const table=renderComponent(theme,'data-table',{selection:'multiple',selectedIds:['collection']});
  assert.match(table,/<tr(?=[^>]*class="ds-data-table__row")(?=[^>]*data-state="selected")[^>]*>/);
  assert.match(forced,/\.ds-data-table__row\[data-state~="selected"\] > \.ds-data-table__cell[^}]*background-color: Highlight !important/);
  assert.doesNotMatch(forced,/\.ds-data-table__row\[data-state~="selected"\]\s+\.ds-data-table__cell/,'a selected row cannot repaint nested table cells');
  const document=dom(),create=createComponentFactory(theme,{document}),grid=create('data-grid',{idPrefix:'selection-grid',...gridOptions});document.body.append(grid);
  const controller=mountDataGrid(grid,gridOptions),cell=grid.querySelector('[role="gridcell"]');cell.focus();fire(cell,'keydown',{key:' '});
  assert.equal(cell.getAttribute('aria-selected'),'true');assert.equal(document.activeElement,cell);
  assert.match(forced,/\.ds-data-grid__cell:is\(\[aria-selected="true"\], \[data-state~="selected"\]\):focus-visible[^}]*solid HighlightText !important; outline-offset: -4px !important/);
  assert.match(forced,/\.ds-data-grid__editor:focus-visible[^}]*outline-color: HighlightText !important/);
  controller.destroy();
});

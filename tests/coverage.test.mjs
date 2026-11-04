import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {COMPONENT_LIBRARY,COMPONENT_COVERAGE} from '../core/library.mjs';
import * as runtime from '../core/components.mjs';
import {getComponents} from '../core/engine.mjs';
import {createCatalogState,renderComponentCatalog} from '../studio/component-catalog.mjs';

test('the agreed catalog has sixty-one delivered roles with actual runtime entry points',()=>{
 assert.equal(Object.keys(COMPONENT_LIBRARY).length,61);
 assert.deepEqual(Object.keys(COMPONENT_COVERAGE).sort(),Object.keys(COMPONENT_LIBRARY).sort());
 for(const [id,component]of Object.entries(COMPONENT_LIBRARY)){
  const delivery=COMPONENT_COVERAGE[id];assert.ok(delivery,id+' must have a delivery description');
  assert.equal(delivery.name,component.name);
  assert.equal(delivery.status,'available',id+' exists in the runtime');
  assert.ok(['static','native','controller'].includes(delivery.behavior));
  assert.equal(typeof runtime[delivery.entryPoint],'function',id+' names a real entry point');
  assert.ok(delivery.note.length>20);
 }
 assert.equal(Object.values(COMPONENT_COVERAGE).filter(item=>item.status==='planned').length,0);
 assert.equal(COMPONENT_COVERAGE.tree.entryPoint,'mountTree');
 assert.equal(COMPONENT_COVERAGE.menu.entryPoint,'mountMenuControls');
 assert.equal(COMPONENT_COVERAGE.dialog.behavior,'native');
 assert.equal(COMPONENT_COVERAGE.tooltip.status,'available');
 assert.equal(COMPONENT_COVERAGE.tooltip.entryPoint,'mountTooltip');
 assert.equal(COMPONENT_COVERAGE.tabs.status,'available');
 assert.equal(COMPONENT_COVERAGE.tabs.entryPoint,'mountTabs');
 for(const [id,entryPoint]of Object.entries({combobox:'mountCombobox',multiselect:'mountMultiselect',toast:'mountToast','file-upload':'mountFileUpload','data-table':'mountDataTable','data-grid':'mountDataGrid'})){
  assert.equal(COMPONENT_COVERAGE[id].behavior,'controller');assert.equal(COMPONENT_COVERAGE[id].entryPoint,entryPoint);
 }
 for(const id of ['date-picker','time-picker','progress'])assert.equal(COMPONENT_COVERAGE[id].behavior,'native');
 for(const id of ['spinner','skeleton','empty-state'])assert.equal(COMPONENT_COVERAGE[id].behavior,'static');
 assert.match(COMPONENT_COVERAGE.toast.note,/annoncering/);assert.doesNotMatch(COMPONENT_COVERAGE.toast.note,/leverer tastatur og fokus/);
});

test('the component catalog exposes the complete delivered catalog with honest behavior labels',()=>{
 const theme=JSON.parse(readFileSync(new URL('../packages/studio-light.json',import.meta.url),'utf8'));
 theme.tokens['color.border.field'].$value='#667085';
 const components=getComponents(theme),html=renderComponentCatalog(theme,{components,state:createCatalogState()});
 assert.match(html,/Dækning:/);assert.match(html,/Native kontrol/);assert.match(html,/Fælles controller/);
 assert.match(html,/61 roller i biblioteket · 0 planlagte/);
 for(const id of ['combobox','multiselect','date-picker','time-picker','spinner','progress','skeleton','toast','empty-state','file-upload','data-table','data-grid'])assert.match(html,new RegExp('data-catalog-card="'+id+'"'));
 assert.match(html,/data-catalog-card="tabs"/);
 assert.equal(Object.keys(components).length,Object.keys(COMPONENT_LIBRARY).length);
});

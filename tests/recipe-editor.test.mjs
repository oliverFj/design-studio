import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRecipeEditorState,mountRecipeEditor} from '../patterns/recipe-editor.mjs';
import {dom,fire} from './support/dom.mjs';

const theme=JSON.parse(readFileSync(new URL('../packages/studio-light.json',import.meta.url),'utf8'));
function fixture(state=createRecipeEditorState(),onUse=()=>{}){
 const document=dom(),create=document.createElement.bind(document);
 document.createElement=tag=>{
  const node=create(tag);
  if(tag==='dialog'){
   node.showModal=()=>node.setAttribute('open','');
   node.close=()=>{node.removeAttribute('open');fire(node,'close');};
  }
  return node;
 };
 const mounted=mountRecipeEditor(theme,{document,state,onUse,idPrefix:'recipe'});document.body.append(mounted.element);
 const control=key=>mounted.element.querySelector('#recipe-'+(key.endsWith('-slider')?key.slice(0,-7)+'-control':key==='recipe'?'recipe-control':key+'-number'));
 const action=name=>mounted.element.querySelector('[data-action="'+name+'"]');
 const input=(key,value)=>{control(key).value=value;fire(control(key),'input');};
 const select=id=>{control('recipe').value=id;control('recipe').focus();fire(control('recipe'),'change');};
 const commit=key=>fire(control(key),'change');
 return {...mounted,document,control,action,input,commit,select,get history(){return mounted.history;}};
}
const layer=(state,id)=>state.history.present.layers.find(item=>item.id===id);

test('front and section reflect the same validated layers and controls have complete labels',()=>{
 const f=fixture(),views=f.element.querySelectorAll('[data-recipe-view]');
 assert.equal(views.length,2);
 const snapshot=view=>view.querySelectorAll('[data-layer]').map(node=>[node.getAttribute('data-layer'),node.getAttribute('data-thickness'),node.getAttribute('data-inset'),node.getAttribute('data-active'),node.getAttribute('data-selected')]);
 assert.deepEqual(snapshot(views[0]),snapshot(views[1]));
 const ids=f.element.querySelectorAll('[id]').map(node=>node.getAttribute('id'));assert.equal(new Set(ids).size,ids.length);
 for(const label of f.element.querySelectorAll('label'))if(label.getAttribute('for'))assert.ok(ids.includes(label.getAttribute('for')));
 for(const view of views)assert.ok(view.querySelector('#'+view.getAttribute('aria-labelledby')));
 assert.ok(f.element.querySelectorAll('select').every(node=>node.getAttribute('data-variant')==='desktop'));
 const rangeFields=f.element.querySelectorAll('.ds-range-field');assert.equal(rangeFields.length,2);
 for(const field of rangeFields){assert.equal(field.getAttribute('data-variant'),'with-input');assert.equal(field.querySelector('.ds-range-field__number').getAttribute('type'),'number');assert.equal(field.querySelector('.ds-range-field__control').getAttribute('type'),'range');}
 assert.equal(f.element.querySelectorAll('input').filter(node=>node.getAttribute('type')==='checkbox').length,0);
 for(const view of views){
  assert.equal(view.getAttribute('role'),'group','interactive layers are not hidden behind an image role');
  for(const node of view.querySelectorAll('[data-layer]')){assert.equal(node.getAttribute('role'),'button');assert.equal(node.getAttribute('tabindex'),'0');assert.ok(node.getAttribute('aria-label'));}
 }
 f.destroy();
});

test('click, anchored range and toggle selection keep the last clicked layer active, and bulk changes are one undo step',()=>{
 const f=fixture();
 fire(f.element.querySelector('[data-active-layer="base"]'),'click');
 assert.deepEqual(f.state.selectedIds,['base']);assert.equal(f.state.activeLayer,'base');
 fire(f.element.querySelector('[data-active-layer="surface"]'),'click',{shiftKey:true});
 assert.deepEqual(f.state.selectedIds,['base','middle','surface']);assert.equal(f.state.activeLayer,'surface');assert.equal(f.state.selectionAnchor,'base');
 fire(f.element.querySelector('[data-active-layer="middle"]'),'click',{ctrlKey:true});
 assert.equal(f.state.activeLayer,'middle');assert.deepEqual(f.state.selectedIds,['base','surface']);
 fire(f.action('thicken-selection'),'click');
 assert.equal(layer(f.state,'surface').thickness,4);assert.equal(layer(f.state,'base').thickness,9);assert.equal(layer(f.state,'middle').thickness,5);
 assert.equal(f.state.history.past.length,1);
 fire(f.action('undo'),'click');assert.equal(layer(f.state,'surface').thickness,3);assert.equal(layer(f.state,'base').thickness,8);
 assert.equal(f.state.activeLayer,'middle');assert.deepEqual(f.state.selectedIds,['base','surface']);f.destroy();
});

test('invalid drafts retain the last valid value while other live edits and layer drafts are preserved',()=>{
 const f=fixture(),before=structuredClone(f.state.history.present);
 f.input('thickness','0');f.commit('thickness');fire(f.action('save-recipe'),'click');
 assert.deepEqual(f.state.history.present,before);assert.equal(f.state.history.past.length,0);
 assert.equal(f.control('thickness').value,'0');assert.equal(f.control('thickness').getAttribute('aria-invalid'),'true');assert.equal(f.document.activeElement,f.control('thickness'));
 f.input('inset','12');assert.equal(layer(f.state,'surface').inset,12);
 fire(f.element.querySelector('[data-active-layer="base"]'),'click');f.input('thickness','11');
 fire(f.element.querySelector('[data-active-layer="surface"]'),'click');assert.equal(f.control('thickness').value,'0');
 f.input('thickness','4');f.commit('thickness');
 assert.equal(f.state.message,'','a corrected live edit clears stale save-validation feedback');
 assert.equal(layer(f.state,'surface').thickness,4);assert.equal(layer(f.state,'surface').inset,12);assert.equal(layer(f.state,'base').thickness,11);
 assert.equal(f.state.drafts.base.thickness,'11');assert.equal(f.state.history.past.length,3);
 f.input('inset','');fire(f.action('cancel-drafts'),'click');assert.deepEqual(f.state.drafts,{});assert.equal(layer(f.state,'surface').inset,12);f.destroy();
});

test('library save points and placed copies stay independent through undo, redo and explicit application',()=>{
 let supplied;const f=fixture(undefined,copy=>{supplied=copy;copy.recipe.name='Only the callback copy';});
 f.input('thickness','6');fire(f.action('save-recipe'),'click');
 assert.equal(f.history.dirty,false);assert.equal(f.state.recipes[0].layers[2].thickness,6);assert.equal(f.state.placed.recipe.layers[2].thickness,3);
 f.input('thickness','7');f.commit('thickness');assert.equal(f.history.dirty,true);
 fire(f.action('undo'),'click');assert.equal(f.history.dirty,false);assert.equal(layer(f.state,'surface').thickness,6);
 fire(f.action('redo'),'click');assert.equal(f.history.dirty,true);assert.equal(layer(f.state,'surface').thickness,7);
 fire(f.action('apply-copy'),'click');assert.ok(supplied);assert.equal(f.state.placed.recipe.layers[2].thickness,7);
 assert.equal(f.state.recipes[0].layers[2].thickness,6);assert.equal(f.history.dirty,true);assert.equal(f.state.placed.recipe.name,'Lagdelte flader');f.destroy();
});

test('dirty recipe switches let the user stay, discard, or save without touching placed copies',()=>{
 const f=fixture(),originalPlaced=structuredClone(f.state.placed);
 f.input('thickness','9');f.select('stepped');assert.equal(f.state.recipeId,'layered');assert.equal(f.state.pendingRecipeId,'stepped');assert.notEqual(f.element.querySelector('dialog').getAttribute('open'),null);
 fire(f.action('stay'),'click');assert.equal(f.state.pendingRecipeId,null);assert.equal(f.control('thickness').value,'9');
 f.select('stepped');fire(f.action('discard-and-switch'),'click');assert.equal(f.state.recipeId,'stepped');assert.equal(f.state.recipes[0].layers[2].thickness,3);
 f.select('layered');fire(f.element.querySelector('[data-active-layer="surface"]'),'click');f.input('thickness','10');f.select('stepped');
 fire(f.action('save-and-switch'),'click');assert.equal(f.state.recipeId,'stepped');assert.equal(f.state.recipes[0].layers[2].thickness,10);
 assert.deepEqual(f.state.placed,originalPlaced);f.select('layered');assert.equal(layer(f.state,'surface').thickness,10);assert.equal(f.history.dirty,false);f.destroy();
});

test('saving an invalid draft during recipe switching returns to the error without changing recipes',()=>{
 const f=fixture(),parameters=f.element.querySelector('.composition-recipe-parameters'),query=parameters.querySelectorAll.bind(parameters);
 parameters.querySelectorAll=selector=>{const nodes=query(selector);if(selector==='.ds-range-field__number')nodes.find=undefined;return nodes;};
 f.input('thickness','');f.select('stepped');fire(f.action('save-and-switch'),'click');
 assert.equal(f.state.recipeId,'layered');assert.equal(f.state.pendingRecipeId,null);assert.equal(f.element.querySelector('dialog').getAttribute('open'),null);
 assert.equal(f.control('thickness').value,'');assert.equal(f.document.activeElement,f.control('thickness'));assert.equal(f.state.recipes[0].layers[2].thickness,3);f.destroy();
});

test('remount preserves drafts, validation errors and selections while native text undo stays local',()=>{
 let f=fixture();f.input('thickness','0');
 const event=fire(f.control('thickness'),'keydown',{key:'z',ctrlKey:true});assert.notEqual(event.defaultPrevented,true);
 const state=f.state;f.destroy();f=fixture(state);assert.equal(f.control('thickness').value,'0');assert.equal(f.control('thickness').getAttribute('aria-invalid'),'true');assert.equal(state.activeLayer,'surface');assert.deepEqual(state.selectedIds,['surface']);f.destroy();
});

test('an open switch decision survives remount and native dismissal preserves the recipe draft',async()=>{
 let f=fixture();f.input('thickness','11');f.select('stepped');const state=f.state;f.destroy();
 assert.equal(state.pendingRecipeId,'stepped','unmount is not a discard decision');
 f=fixture(state);await Promise.resolve();assert.notEqual(f.element.querySelector('dialog').getAttribute('open'),null);
 f.element.querySelector('dialog').close();assert.equal(state.pendingRecipeId,null);assert.equal(state.recipeId,'layered');assert.equal(f.control('thickness').value,'11');assert.equal(f.document.activeElement,f.control('recipe'));f.destroy();
});

test('rerendered selection keeps focus, and completed history or save commands move to an available action',()=>{
 const f=fixture(),row=f.element.querySelector('[data-active-layer="surface"]');row.focus();fire(row,'click',{ctrlKey:true});
 assert.equal(f.document.activeElement,f.element.querySelector('[data-active-layer="surface"]'));
 assert.notEqual(f.document.activeElement,row,'the replacement layer button owns focus');
 f.input('thickness','5');
 f.action('undo').focus();fire(f.action('undo'),'click');assert.equal(f.document.activeElement,f.action('redo'));assert.equal(f.action('undo').disabled,true);
 fire(f.action('redo'),'click');assert.equal(f.document.activeElement,f.action('undo'));assert.equal(f.action('redo').disabled,true);
 f.action('save-recipe').focus();fire(f.action('save-recipe'),'click');assert.equal(f.document.activeElement,f.action('apply-copy'));assert.equal(f.action('save-recipe').disabled,true);f.destroy();
});

test('list and both SVG views share a stable range anchor and selection never discards invalid field drafts',()=>{
 const f=fixture(),surface=f.element.querySelector('[data-active-layer="surface"]');fire(surface,'click');f.input('thickness','');
 const shape=(view,id)=>f.element.querySelector('[data-recipe-view="'+view+'"]').querySelector('[data-layer="'+id+'"]');
 fire(shape('front','base'),'click',{shiftKey:true});assert.deepEqual(f.state.selectedIds,['base','middle','surface']);assert.equal(f.state.selectionAnchor,'surface');assert.equal(f.state.activeLayer,'base');
 fire(shape('section','middle'),'keydown',{key:'Enter',shiftKey:true});assert.deepEqual(f.state.selectedIds,['middle','surface']);assert.equal(f.state.selectionAnchor,'surface');assert.equal(f.state.activeLayer,'middle');
 assert.equal(f.document.activeElement,shape('section','middle'));
 const event=fire(shape('front','surface'),'keydown',{key:' ',metaKey:true});assert.equal(event.defaultPrevented,true);assert.deepEqual(f.state.selectedIds,['middle']);assert.equal(f.state.activeLayer,'surface');
 assert.equal(f.control('thickness').value,'');assert.equal(f.state.history.past.length,0);assert.equal(layer(f.state,'surface').thickness,3);
 for(const view of ['front','section'])assert.equal(shape(view,'surface').getAttribute('aria-current'),'true');
 assert.equal(f.element.querySelector('[data-active-layer="middle"]').getAttribute('aria-pressed'),'true');f.destroy();
});

test('Shift selection keeps its anchor through remount and repeated expansion or contraction',()=>{
 let f=fixture();fire(f.element.querySelector('[data-active-layer="base"]'),'click');fire(f.element.querySelector('[data-active-layer="surface"]'),'click',{shiftKey:true});
 const state=f.state;f.destroy();f=fixture(state);
 fire(f.element.querySelector('[data-recipe-view="section"]').querySelector('[data-layer="middle"]'),'keydown',{key:' ',shiftKey:true});
 assert.equal(state.selectionAnchor,'base');assert.deepEqual(state.selectedIds,['base','middle']);assert.equal(state.activeLayer,'middle');
 fire(f.element.querySelector('[data-active-layer="surface"]'),'click',{shiftKey:true});assert.deepEqual(state.selectedIds,['base','middle','surface']);assert.equal(state.selectionAnchor,'base');f.destroy();
});

test('sliders update both previews live without replacing controls and each gesture is one undo step',()=>{
 const f=fixture(),range=key=>f.control(key+'-slider');
 assert.equal(range('thickness').getAttribute('type'),'range');
 assert.equal(f.element.querySelector('[data-action="update-layer"]'),null);
 const originalRange=range('thickness'),originalNumber=f.control('thickness');range('thickness').focus();
 for(const value of ['4','5','6','7']){range('thickness').value=value;fire(range('thickness'),'input');}
 assert.equal(f.control('thickness').value,'7');assert.equal(f.state.history.past.length,0);assert.equal(layer(f.state,'surface').thickness,7);
 for(const view of f.element.querySelectorAll('[data-recipe-view]'))assert.equal(view.querySelector('[data-layer="surface"]').getAttribute('data-thickness'),'7');
 assert.match(f.element.querySelector('[data-active-layer="surface"]').textContent,/7 enheder/);
 assert.equal(range('thickness'),originalRange);assert.equal(f.control('thickness'),originalNumber);
 assert.equal(f.document.activeElement,range('thickness'),'moving the slider does not replace its control');
 fire(range('thickness'),'change');assert.equal(f.state.history.past.length,1);
 f.input('inset','18');assert.equal(range('inset').value,'18');f.commit('inset');
 f.input('thickness','');assert.equal(range('thickness').value,'7','an invalid precise draft does not move the slider or overwrite the draft');
 range('thickness').value='8';fire(range('thickness'),'input');assert.equal(f.control('thickness').value,'8');
 fire(range('thickness'),'pointerup');assert.equal(f.state.history.past.length,3);assert.equal(layer(f.state,'surface').thickness,8);assert.equal(layer(f.state,'surface').inset,18);
 fire(range('thickness'),'change');assert.equal(f.state.history.past.length,3,'change after release cannot duplicate the gesture');
 fire(f.action('undo'),'click');assert.equal(layer(f.state,'surface').thickness,7);assert.equal(layer(f.state,'surface').inset,18);
 fire(f.action('undo'),'click');assert.equal(layer(f.state,'surface').inset,14);fire(f.action('undo'),'click');assert.equal(layer(f.state,'surface').thickness,3);f.destroy();
});

test('fractional precise drafts are preserved and rejected without moving integer sliders or the candidate',()=>{
 const f=fixture(),thicknessSlider=f.control('thickness-slider'),insetSlider=f.control('inset-slider');
 f.input('thickness','4.5');f.input('inset','4.5');
 assert.equal(f.control('thickness').value,'4.5');assert.equal(f.control('inset').value,'4.5');
 assert.equal(thicknessSlider.value,'3');assert.equal(insetSlider.value,'14');
 fire(f.action('save-recipe'),'click');fire(f.action('apply-copy'),'click');
 assert.equal(f.control('thickness').value,'4.5');assert.equal(f.control('inset').value,'4.5');
 assert.equal(f.control('thickness').getAttribute('aria-invalid'),'true');assert.equal(f.control('inset').getAttribute('aria-invalid'),'true');
 assert.match(f.state.errors.surface.thickness,/hele enheder/);assert.match(f.state.errors.surface.inset,/hele enheder/);
 assert.equal(layer(f.state,'surface').thickness,3);assert.equal(layer(f.state,'surface').inset,14);assert.equal(f.state.history.past.length,0);f.destroy();
});

test('remount flushes a live gesture once, preserves the candidate and leaves one usable undo step',()=>{
 let f=fixture(),range=f.control('thickness-slider');
 for(const value of ['4','5','6']){range.value=value;fire(range,'input');}
 assert.equal(layer(f.state,'surface').thickness,6);assert.equal(f.state.history.past.length,0);
 const state=f.state;f.destroy();assert.equal(state.history.past.length,1);assert.equal(state.gesture,null);
 f=fixture(state);assert.equal(f.control('thickness').value,'6');assert.equal(f.state.history.past.length,1);
 fire(f.action('undo'),'click');assert.equal(layer(state,'surface').thickness,3);fire(f.action('redo'),'click');assert.equal(layer(state,'surface').thickness,6);f.destroy();
});

test('invalid numeric text preserves the last valid live edit and blocks saving or applying it',()=>{
 const f=fixture(),library=structuredClone(f.state.recipes),copy=structuredClone(f.state.placed);
 f.input('thickness','4');f.input('thickness','4.5');
 assert.equal(layer(f.state,'surface').thickness,4);assert.equal(f.control('thickness').value,'4.5');
 fire(f.control('thickness'),'blur');assert.equal(f.state.history.past.length,1,'invalid blur still completes the last valid live gesture');
 fire(f.action('save-recipe'),'click');fire(f.action('apply-copy'),'click');
 assert.deepEqual(f.state.recipes,library);assert.deepEqual(f.state.placed,copy);assert.equal(f.control('thickness').value,'4.5');assert.equal(layer(f.state,'surface').thickness,4);assert.equal(f.state.history.past.length,1);
 fire(f.action('cancel-drafts'),'click');assert.equal(f.control('thickness').value,'4');
 fire(f.action('undo'),'click');assert.equal(layer(f.state,'surface').thickness,3);f.destroy();
});

test('Apply flushes an unfinished live edit and only updates the explicit placed copy',()=>{
 const f=fixture();f.input('thickness','9');assert.equal(f.state.history.past.length,0);
 fire(f.action('apply-copy'),'click');assert.equal(f.state.placed.recipe.layers[2].thickness,9);assert.equal(f.state.recipes[0].layers[2].thickness,3);assert.equal(f.state.history.past.length,1);assert.equal(f.history.dirty,true);f.destroy();
});

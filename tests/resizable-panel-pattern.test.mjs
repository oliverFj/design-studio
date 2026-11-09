import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dom,fire} from './support/dom.mjs';
import {mountComposition,createCompositionState} from '../patterns/compositions.mjs';
import {COMPOSITIONS,PATTERN_FILES} from '../patterns/catalog.mjs';
import {createCatalogPlaceholder,renderCatalogPlaceholder} from '../core/catalog-placeholder.mjs';
import {renderCatalogArtwork} from '../studio/catalog-artwork.mjs';
import {createCollaborationService} from '../collaboration/service.mjs';

const theme=JSON.parse(readFileSync(new URL('../packages/studio-light.json',import.meta.url),'utf8'));

test('panel pattern preserves a draft and panel state across disclosure and remounting',()=>{
 const document=dom(),state=createCompositionState('resizable-panel');
 let mounted=mountComposition(theme,'resizable-panel',{document,state,idPrefix:'test'});document.body.append(mounted.element);
 const input=mounted.element.querySelector('#test-name-control');input.value='Mit panel';fire(input,'input');
 mounted.controls.setWidth(380);mounted.controls.setOpen(false);
 assert.deepEqual(state,{name:'Mit panel',panel:{width:380,open:false}});
 fire(mounted.element.querySelector('[data-panel-demo-toggle]'),'click');
 assert.equal(mounted.element.querySelector('#test-name-control'),input);assert.equal(input.value,'Mit panel');
 mounted.destroy();mounted.element.remove();
 mounted=mountComposition(theme,'resizable-panel',{document,state,idPrefix:'test'});
 assert.equal(mounted.element.querySelector('#test-name-control').value,'Mit panel');
 assert.equal(state.panel.width,380);mounted.destroy();
 assert.ok(PATTERN_FILES.includes('resizable-panel.mjs'));
});

test('components and patterns share one decorative placeholder without an illustration',()=>{
 const placeholder=createCatalogPlaceholder({document:dom()});
 assert.equal(placeholder.getAttribute('aria-hidden'),'true');
 assert.match(renderCatalogPlaceholder(),/data-catalog-placeholder/);
 assert.ok(renderCatalogPlaceholder().includes(placeholder.textContent));
 assert.match(renderCatalogArtwork('missing-artwork',theme),/data-catalog-placeholder/);
 assert.equal(COMPOSITIONS['resizable-panel'].illustration,false);
});

test('agents can discover the panel controller through the shared library search',async()=>{
 const service=await createCollaborationService();
 const result=await service.searchLibrary({query:'mountPanelControls'});
 assert.ok(result.results.some(item=>item.id==='resizable-panel'&&item.kind==='pattern'&&item.usage.includes('patterns/resizable-panel.mjs')));
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createIcon,renderIcon,ICON_NAMES,TABLER_VERSION,createComponent,renderComponent,mountTree} from '../core/components.mjs';
import {dom,fire} from './support/dom.mjs';

// A readable boundary keeps these integration fixtures independent of theme tuning.
const theme=()=>{const pack=JSON.parse(readFileSync(new URL('../packages/studio-light.json',import.meta.url),'utf8'));pack.tokens['color.border.field'].$value='#555555';return pack;};

test('shared Tabler SVGs use trusted geometry, currentColor and an accessible naming policy',()=>{
 assert.equal(TABLER_VERSION,'3.50.0');assert.ok(ICON_NAMES.includes('plus'));assert.ok(ICON_NAMES.includes('eye-off'));
 for(const name of ICON_NAMES){const html=renderIcon(name);assert.match(html,/^<svg /);assert.match(html,/viewBox="0 0 24 24"/);assert.match(html,/aria-hidden="true"/);assert.match(html,/currentColor/);assert.doesNotMatch(html,/<script|href=|onload=|<image/);}
 const labelled=renderIcon('info-circle',{label:'Oplysninger om "<projektet>"',size:'small'});
 assert.match(labelled,/role="img"/);assert.match(labelled,/aria-label="Oplysninger om &quot;&lt;projektet&gt;&quot;"/);assert.doesNotMatch(labelled,/aria-hidden/);assert.match(labelled,/width="16"/);
 assert.throws(()=>renderIcon('constructor'),/Unknown shared/);
 assert.throws(()=>renderIcon('<svg onload=alert(1)>'),/Unknown shared/);
 assert.throws(()=>renderIcon('plus',{decorative:false}),/accessible label/);
 assert.throws(()=>renderIcon('plus',{size:'arbitrary'}),/Unknown shared icon size/);
});

test('native SVG construction keeps the SVG namespace without innerHTML',()=>{
 const document=dom(),calls=[];
 document.createElementNS=(namespace,tag)=>{calls.push([namespace,tag]);const node=document.createElement(tag);node.namespaceURI=namespace;return node;};
 const icon=createIcon('plus',{}, {document});assert.equal(icon.namespaceURI,'http://www.w3.org/2000/svg');assert.equal(icon.getAttribute('aria-hidden'),'true');
 assert.ok(calls.some(([,tag])=>tag==='path'));assert.ok(calls.every(([namespace])=>namespace==='http://www.w3.org/2000/svg'));
 const button=createComponent(theme(),'button',{text:'Tilføj',iconName:'plus'},{document});
 assert.equal(button.querySelector('svg').namespaceURI,'http://www.w3.org/2000/svg');
 assert.equal(button.querySelector('.ds-button__heading').textContent,'Tilføj');
});

test('button and action-button share named icons while preserving text and legacy icon support',()=>{
 const pack=theme();
 const html=renderComponent(pack,'button',{text:'Gem',iconName:'device-floppy'});
 assert.match(html,/data-has-icon="true"/);assert.match(html,/data-icon="device-floppy"/);assert.match(html,/>Gem<\/span>/);
 const iconOnly=renderComponent(pack,'button',{iconName:'x',iconOnly:true,label:'Luk panelet'});
 assert.match(iconOnly,/aria-label="Luk panelet"/);assert.match(iconOnly,/data-icon="x"/);
 assert.throws(()=>renderComponent(pack,'button',{iconName:'x',iconOnly:true}),/accessible name/);
 assert.throws(()=>renderComponent(pack,'button',{iconName:'plus',icon:'+'}),/one icon source/);
 assert.throws(()=>renderComponent(pack,'button',{iconName:'unknown'}),/Unknown shared/);
 assert.match(renderComponent(pack,'button',{text:'Ældre ikon',icon:'+'}),/>\+<\/span>/);
 const action=renderComponent(pack,'action-button',{label:'Tilføj',iconName:'plus'});
 assert.match(action,/data-icon="plus"/);assert.doesNotMatch(action,/<span[^>]*class="ds-action-button__icon"[^>]* hidden/);
 assert.match(renderComponent(pack,'action-button',{label:'Flyt',icon:'↔'}),/>↔<\/span>/);
 assert.throws(()=>renderComponent(pack,'action-button',{variant:'icon-only',iconName:'x'}),/accessible name/);
 assert.throws(()=>renderComponent(pack,'button',{slots:{icon:{tag:'svg',attrs:{onload:'unsafe()'}}}}),/Unsupported component tag/);
});

test('tree icons preserve keyed native action buttons and reject unknown icons before updates',()=>{
 const document=dom(),host=document.createElement('div'),actions=[];document.body.append(host);
 const items=[{id:'folder',label:'Samling',iconName:'folder',actions:[{id:'visibility',label:'Skjul',iconName:'eye'}],children:[{id:'file',label:'Dokument',iconName:'file-text'}]}];
 const tree=mountTree(theme(),host,{items,expandedIds:['folder'],onAction:(...args)=>actions.push(args)},{document});
 assert.ok(tree.element.querySelector('[data-icon="folder"]'));assert.ok(tree.element.querySelector('[data-icon="chevron-down"]'));
 const action=tree.element.querySelector('[data-tree-action="visibility"]');action.focus();fire(action,'click');assert.equal(actions.length,1);
 const changed=structuredClone(items);changed[0].actions[0].iconName='eye-off';tree.update({items:changed});
 assert.equal(tree.element.querySelector('[data-tree-action="visibility"]'),action);assert.ok(action.querySelector('[data-icon="eye-off"]'));
 const invalid=structuredClone(items);invalid[0].iconName='invalid';assert.throws(()=>tree.update({items:invalid}),/Unknown shared/);assert.equal(tree.element.querySelector('[data-tree-action="visibility"]'),action);
 tree.destroy();
});

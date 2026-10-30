import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createComponent,renderComponent,mountMenuControls} from '../core/components.mjs';
import {PROJECT_RUNTIME} from '../tools/doctor.mjs';
import {PUBLIC_THEME_IDS} from '../tools/public-themes.mjs';
import {dom,fire} from './support/dom.mjs';

const theme=id=>JSON.parse(readFileSync(new URL('../packages/'+id+'.json',import.meta.url),'utf8'));
function fixture(id='studio-light'){
 const document=dom(),root=document.createElement('section'),after=document.createElement('button'),calls=[];
 document.body.append(root,after);
 const create=(id,options)=>createComponent(themeValue,id,options,{document}),themeValue=theme(id);
 const trigger=(label,target)=>({tag:'button',part:'item',text:label,attrs:{role:'menuitem','aria-haspopup':'menu','aria-controls':target}});
 const item=(label,attrs={})=>({component:'menu-item',options:{slots:{label},attrs}});
 root.append(create('menubar',{slots:{root:[trigger('Filer','files'),trigger('Vis','view')]}}));
 const panel=(id,children)=>create('menu',{attrs:{id},slots:{root:children}});
 root.append(panel('files',[item('Åbn'),{tag:'hr',part:'separator'},item('Gem',{'aria-disabled':'true'}),item('Eksportér',{'aria-haspopup':'menu','aria-controls':'export'})]),panel('export',[item('Billede'),item('Tekst')]),panel('view',[item('Detaljer',{role:'menuitemcheckbox','aria-checked':'false'}),item('Standard',{role:'menuitemradio','aria-checked':'true'})]));
 const standalone=create('button',{text:'Handlinger',attrs:{'aria-haspopup':'menu','aria-controls':'standalone'}});
 root.append(standalone,panel('standalone',[]));
 for(const node of root.querySelectorAll('button'))node.click=()=>fire(node,'click');
 const controls=mountMenuControls(root,{onAction(item){calls.push(item);if(item.getAttribute('role')==='menuitemcheckbox')item.setAttribute('aria-checked',String(item.getAttribute('aria-checked')!=='true'));}});
 const keys=value=>fire(document.activeElement,'keydown',{key:value});
 const top=root.querySelector('[role="menubar"]').children;
 const menu=id=>root.querySelector('#'+id);
 return {document,root,after,calls,controls,keys,top,menu,standalone};
}

test('shared menu controller provides opening, roving focus, disabled items and typeahead in every theme',()=>{
 assert.ok(PROJECT_RUNTIME.some(([file])=>file==='core/menus.mjs'));
 for(const id of PUBLIC_THEME_IDS){
  const {document,top,menu,keys,calls,controls}=fixture(id);
  assert.equal(top[0].getAttribute('tabindex'),'0');assert.equal(top[1].getAttribute('tabindex'),'-1');assert.equal(menu('files').hidden,true);
  top[0].focus();keys('ArrowDown');assert.equal(menu('files').hidden,false);assert.equal(top[0].getAttribute('aria-expanded'),'true');
  assert.equal(document.activeElement.textContent,'Åbn');keys('ArrowDown');assert.equal(document.activeElement.textContent,'Gem');
  keys('Enter');assert.equal(calls.length,0);assert.equal(menu('files').hidden,false);
  keys('End');assert.equal(document.activeElement.textContent,'Eksportér');keys('Home');assert.equal(document.activeElement.textContent,'Åbn');
  keys('g');assert.equal(document.activeElement.textContent,'Gem');keys('Escape');assert.equal(document.activeElement,top[0]);
  keys('ArrowRight');assert.equal(document.activeElement,top[1]);assert.equal(top[1].getAttribute('tabindex'),'0');
  keys('ArrowUp');assert.equal(document.activeElement.textContent,'Standard');keys('ArrowDown');assert.equal(document.activeElement.textContent,'Detaljer');
  keys(' ');assert.equal(calls.length,1);assert.equal(calls[0].getAttribute('aria-checked'),'true');assert.equal(document.activeElement,top[1]);assert.equal(menu('view').hidden,true);
  controls.destroy();
 }
});

test('submenu Escape closes only the inner level; arrows switch top menus',()=>{
 const {document,controls,top,menu,keys}=fixture();
 controls.open(top[0]);keys('End');const parent=document.activeElement;keys('ArrowRight');assert.equal(document.activeElement.textContent,'Billede');
 keys('Escape');assert.equal(document.activeElement,parent);assert.equal(menu('export').hidden,true);assert.equal(menu('files').hidden,false);
 keys('ArrowRight');keys('ArrowLeft');assert.equal(document.activeElement,parent);
 keys('Home');keys('ArrowRight');assert.equal(document.activeElement.textContent,'Detaljer');assert.equal(menu('files').hidden,true);
 keys('ArrowLeft');assert.equal(document.activeElement.textContent,'Åbn');controls.destroy();
});

test('Tab leaves the menu chain without cancelling native traversal; outside focus and pointer dismiss without stealing focus',()=>{
 const {document,controls,top,menu,keys,after}=fixture();
 controls.open(top[0]);const tab=keys('Tab');assert.equal(Boolean(tab.defaultPrevented),false);assert.equal(document.activeElement,top[0]);assert.equal(menu('files').hidden,true);
 controls.open(top[0]);const back=fire(document.activeElement,'keydown',{key:'Tab',shiftKey:true});assert.equal(Boolean(back.defaultPrevented),false);
 controls.open(top[0]);after.focus();assert.equal(menu('files').hidden,true);assert.equal(document.activeElement,after);
 controls.open(top[0]);fire(after,'pointerdown');assert.equal(menu('files').hidden,true);after.focus();assert.equal(document.activeElement,after);
 controls.destroy();
});

test('clicks toggle triggers, block disabled commands and close before product callback moves focus',()=>{
 const {document,root,controls,top,menu,calls,after}=fixture();
 fire(top[0],'click');const disabled=menu('files').children[2];fire(disabled,'click');assert.equal(calls.length,0);assert.equal(menu('files').hidden,false);
 fire(top[0],'click');assert.equal(menu('files').hidden,true);
 controls.destroy();
 const next=mountMenuControls(root,{onAction(){after.focus();}});next.open(top[0]);fire(menu('files').children[0],'click');assert.equal(document.activeElement,after);assert.equal(menu('files').hidden,true);
 next.destroy();
});

test('empty menus, standalone triggers and destroy have usable focus and no surviving listeners',()=>{
 const {document,root,controls,standalone,menu,keys,top}=fixture();
 controls.open(standalone);assert.equal(document.activeElement,menu('standalone'));keys('Escape');assert.equal(document.activeElement,standalone);
 controls.open(top[0]);controls.destroy();assert.equal(document.activeElement,top[0]);assert.equal(menu('files').hidden,true);
 fire(top[0],'click');assert.equal(menu('files').hidden,true);assert.equal(controls.open(top[0]),false);
 controls.destroy();assert.equal(root.listeners.get('keydown').size,0);
});

test('fields retain external descriptions; textarea values survive HTML rendering and native construction',()=>{
 const pack=theme('studio-light'),document=dom();
 const options={idPrefix:'notes',label:'Noter',value:'En <kladde>\nAnden linje',hint:'Skriv kort.',error:'Kontrollér teksten.',slots:{control:{tag:'textarea',attrs:{'aria-describedby':'external external'}}}};
 const field=createComponent(pack,'field',options,{document}),control=field.querySelector('textarea');
 assert.equal(control.getAttribute('aria-describedby'),'external notes-hint notes-error');assert.equal(control.getAttribute('value'),null);assert.equal(control.textContent,options.value);
 const html=renderComponent(pack,'field',options);assert.match(html,/En &lt;kladde&gt;\nAnden linje<\/textarea>/);assert.doesNotMatch(html,/<textarea[^>]+value=/);
});

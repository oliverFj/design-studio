import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createComponentFactory,createComponentRenderer,mountCombobox,mountMultiselect} from '../core/components.mjs';
import {validatePackage,materializePackage} from '../core/engine.mjs';
import {resolveThemeMode} from '../core/theme-modes.mjs';
import {PUBLIC_THEME_IDS} from '../tools/public-themes.mjs';
import {dom,fire} from './support/dom.mjs';
const source=id=>JSON.parse(readFileSync(new URL('../packages/'+id+'.json',import.meta.url),'utf8'));
const choices=[{id:'anna',label:'Anna Larsen'},{id:'locked',label:'Låst mulighed',disabled:true},{id:'mikkel',label:'Mikkel Holm'}];
const boolean=new Set(['disabled','checked','selected','required','readonly','hidden']);
const escape=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
function html(node){if(node.tagName==='#TEXT')return escape(node.textContent);const tag=node.tagName.toLowerCase(),attrs=[...node.attributes].map(([name,value])=>' '+name+(boolean.has(name)?'':'="'+escape(value)+'"')).join('');return '<'+tag+attrs+'>'+(tag==='input'?'':node.childNodes.map(html).join('')+'</'+tag+'>');}
function fixture(multiple=false,options={},callbacks={}){
 const document=dom(),create=createComponentFactory(source('studio-light'),{document}),root=create(multiple?'multiselect':'combobox',{idPrefix:'choice',label:'Ansvarlig',items:choices,...options});document.body.append(root);
 const input=root.querySelector('input'),listbox=root.querySelector('[role="listbox"]');
 input.getBoundingClientRect=()=>({top:10,bottom:54,left:10,right:310,width:300,height:44});listbox.getBoundingClientRect=()=>({top:0,left:0,width:300,height:180});
 let shows=0,hides=0;listbox.showPopover=()=>{shows++;};listbox.hidePopover=()=>{hides++;};
 const controller=(multiple?mountMultiselect:mountCombobox)(root,callbacks);
 return {document,root,input,listbox,controller,get shows(){return shows;},get hides(){return hides;},type(query){input.value=query;fire(input,'input');},key(key,values={}){return fire(input,'keydown',{key,...values});}};
}

test('input-choice families validate and produce identical HTML/native anatomy in all theme modes',()=>{
 for(const id of PUBLIC_THEME_IDS)for(const mode of ['light','dark']){
  const pack=resolveThemeMode(source(id),mode),document=dom();assert.deepEqual(validatePackage(pack),{valid:true,errors:[]},id+'/'+mode);
  const create=createComponentFactory(pack,{document}),render=createComponentRenderer(pack);
  for(const [role,options] of [['combobox',{items:choices,value:'anna'}],['multiselect',{items:choices,values:['anna','mikkel']}],['date-picker',{value:'2028-02-29',min:'2026-01-01',max:'2030-12-31'}],['time-picker',{value:'09:30',min:'08:00',max:'18:00',step:900}]]){
   const full={idPrefix:'test-'+role,label:'En længere dansk label',hint:'Hjælp til valget.',error:'Kontrollér værdien.',...options},element=create(role,full),control=element.querySelector('input');
   assert.equal(html(element),render(role,full),id+'/'+mode+'/'+role);
   assert.equal(element.querySelector('[for="test-'+role+'-control"]').textContent,full.label);
   assert.equal(control.getAttribute('aria-invalid'),'true');for(const target of control.getAttribute('aria-describedby').split(' '))assert.ok(element.querySelector('#'+target));
  }
 }
});

test('combobox keyboard navigation keeps input focus, skips disabled options and commits an ID',()=>{
 const changed=[],f=fixture(false,{}, {onChange:(value,detail)=>changed.push([value,detail.reason])});f.input.focus();
 assert.equal(f.key('ArrowDown').defaultPrevented,true);assert.equal(f.controller.opened,true);assert.equal(f.shows,1);assert.equal(f.document.activeElement,f.input);
 const active=()=>f.listbox.querySelector('#'+f.input.getAttribute('aria-activedescendant')).getAttribute('data-choice-id');
 assert.equal(active(),'anna');f.key('ArrowDown');assert.equal(active(),'mikkel');f.key('ArrowDown');assert.equal(active(),'anna');
 f.key('End');assert.equal(active(),'mikkel');f.key('Home');assert.equal(active(),'anna');f.key('ArrowUp');assert.equal(active(),'mikkel');
 f.key('Enter');assert.equal(f.controller.value,'mikkel');assert.equal(f.input.value,'Mikkel Holm');assert.equal(f.controller.opened,false);assert.equal(f.input.getAttribute('aria-activedescendant'),null);assert.equal(f.document.activeElement,f.input);assert.deepEqual(changed,[['mikkel','select']]);
 f.controller.open();assert.equal(f.key('Tab').defaultPrevented,undefined);assert.equal(f.controller.opened,false,'Tab keeps native traversal');
});

test('filtering, no results, IME, Escape, pointer selection and clear preserve the input draft contract',()=>{
 const changed=[],queries=[],f=fixture(false,{value:'anna'},{onChange:(value,detail)=>changed.push([value,detail.reason]),onQueryChange:(query,detail)=>queries.push([query,detail.requestId])});
 f.input.focus();f.type('Mik');assert.equal(f.controller.value,null);assert.equal(f.input.value,'Mik');assert.equal(f.listbox.children.length,1);assert.equal(f.listbox.firstChild.textContent,'Mikkel Holm');
 assert.equal(f.key('Escape').defaultPrevented,true);assert.equal(f.controller.query,'Mik');assert.equal(f.controller.opened,false);
 f.type('Ingen match');assert.equal(f.listbox.children.length,0);assert.equal(f.input.getAttribute('aria-activedescendant'),null);assert.match(f.root.querySelector('[role="status"]').textContent,/Ingen/);
 fire(f.input,'compositionstart');f.input.value='Mi';fire(f.input,'input',{isComposing:true});const requests=queries.length;assert.equal(f.key('Enter',{isComposing:true}).defaultPrevented,undefined);assert.equal(queries.length,requests);
 fire(f.input,'compositionend');assert.equal(queries.at(-1)[0],'Mi');assert.equal(f.listbox.children.length,1);
 const option=f.listbox.firstChild;assert.equal(fire(option,'pointerdown').defaultPrevented,true);fire(option,'click');assert.equal(f.controller.value,'mikkel');assert.equal(f.document.activeElement,f.input);
 fire(f.root.querySelector('[data-choice-clear]'),'click');assert.equal(f.controller.value,null);assert.equal(f.input.value,'');assert.equal(f.controller.query,'');assert.equal(f.controller.opened,false);assert.ok(changed.some(([value,reason])=>value===null&&reason==='input'));assert.equal(changed.at(-1)[1],'clear');
});

test('async result revisions reject stale results and preserve the draft and selected labels',()=>{
 const f=fixture(false),input=f.input;f.type('An');const first=f.controller.requestId;f.type('Anna');const latest=f.controller.requestId;
 f.controller.update({requestId:latest,loading:true});assert.equal(f.input.getAttribute('aria-busy'),'true');
 assert.equal(f.controller.update({requestId:first,items:[{id:'old',label:'Old'}],loading:false,error:'Old failure'}),false);
 assert.equal(f.controller.query,'Anna');assert.equal(f.input.getAttribute('aria-busy'),'true');assert.equal(f.controller.update({requestId:latest,items:[{id:'new',label:'Anna Andersen'}],loading:false}),true);
 assert.equal(f.root.querySelector('input'),input);assert.equal(input.value,'Anna');assert.equal(f.listbox.firstChild.textContent,'Anna Andersen');
 const multi=fixture(true,{values:['anna']});multi.type('Mik');const request=multi.controller.requestId;
 multi.controller.update({requestId:request,items:[{id:'mikkel',label:'Mikkel Holm'}],loading:false});assert.deepEqual(multi.controller.values,['anna']);assert.equal(multi.root.querySelector('.ds-multiselect__chip-label').textContent,'Anna Larsen');assert.equal(multi.input.value,'Mik');
 multi.controller.destroy();const remounted=mountMultiselect(multi.root);assert.deepEqual(remounted.values,['anna']);assert.equal(multi.root.querySelector('.ds-multiselect__chip-label').textContent,'Anna Larsen');remounted.destroy();
 assert.equal(multi.controller.update({requestId:request,items:[]}),false,'late async results after teardown are ignored');
});

test('multiselect toggles values, supports removal and keeps filters and native focus usable',()=>{
 const changes=[],f=fixture(true,{values:['anna']},{onChange:values=>changes.push(values)});f.input.focus();f.type('Mik');f.key('ArrowDown');f.key('Enter');
 assert.deepEqual(f.controller.values,['anna','mikkel']);assert.equal(f.controller.query,'');assert.equal(f.document.activeElement,f.input);assert.equal(f.listbox.getAttribute('aria-multiselectable'),'true');
 const remove=f.root.querySelector('[data-choice-remove="anna"]');remove.focus();fire(remove,'click');assert.deepEqual(f.controller.values,['mikkel']);assert.equal(f.document.activeElement,f.input);
 f.controller.update({readOnly:true});assert.equal(f.controller.opened,false);assert.equal(f.input.getAttribute('readonly'),'');assert.equal(f.controller.clear(),false);
 f.controller.update({readOnly:false,disabled:true});assert.equal(f.input.getAttribute('disabled'),'');assert.equal(f.controller.open(),false);assert.deepEqual(f.controller.values,['mikkel']);
 f.controller.update({disabled:false});f.controller.clear();assert.deepEqual(f.controller.values,[]);assert.ok(changes.length>=3);
 const initiallyDisabled=fixture(false,{disabled:true});initiallyDisabled.controller.update({disabled:false});assert.equal(initiallyDisabled.root.getAttribute('aria-disabled'),null,'enabling a field clears its inherited ARIA disabled state');
});

test('outside focus and teardown close native layers and stop all controller behavior',()=>{
 const f=fixture(),outside=f.document.createElement('button');f.document.body.append(outside);f.input.focus();f.controller.open();outside.focus();assert.equal(f.controller.opened,false);assert.equal(f.document.activeElement,outside);
 f.controller.open();f.controller.destroy();assert.equal(f.controller.opened,false);assert.equal(f.input.getAttribute('aria-expanded'),'false');assert.equal(f.input.getAttribute('aria-activedescendant'),null);const shows=f.shows;f.key('ArrowDown');fire(f.root.querySelector('[data-choice-toggle]'),'click');assert.equal(f.shows,shows);assert.throws(()=>f.controller.update(),/destroyed/);f.controller.destroy();assert.ok(f.hides>=2);
});

test('product callbacks may unmount a choice without restarting filtering or reclaiming focus',()=>{
 let controller,queries=0;
 const f=fixture(true,{}, {onChange(){controller.destroy();},onQueryChange(){queries++;}});controller=f.controller;
 const outside=f.document.createElement('button');f.document.body.append(outside);f.input.focus();controller.open();outside.focus();
 fire(f.listbox.firstChild,'click');assert.equal(controller.opened,false);assert.equal(queries,0);assert.equal(f.document.activeElement,outside);
});

test('native date/time values retain exact formats and native limits without custom calendars',()=>{
 const document=dom(),create=createComponentFactory(source('studio-light'),{document});
 const date=create('date-picker',{value:'2028-02-29',min:'2026-01-01',max:'2030-12-31',readOnly:true,step:1}),time=create('time-picker',{value:'23:15:30',min:'22:00',max:'06:00',step:30,disabled:true});
 const a=date.querySelector('input'),b=time.querySelector('input');assert.equal(a.getAttribute('type'),'date');assert.equal(a.value,'2028-02-29');assert.equal(a.getAttribute('readonly'),'');assert.equal(b.getAttribute('type'),'time');assert.equal(b.value,'23:15:30');assert.equal(b.getAttribute('disabled'),'');assert.equal(b.getAttribute('min'),'22:00');assert.equal(b.getAttribute('max'),'06:00','native overnight ranges are preserved');
 for(const [role,value] of [['date-picker','2026-02-29'],['date-picker','30/10/2026'],['time-picker','24:01'],['time-picker','9:30']])assert.throws(()=>create(role,{value}),/must use/);
 assert.throws(()=>create('time-picker',{step:0}),/positive/);assert.throws(()=>create('date-picker',{type:'text'}),/type=date/);
});

test('custom format-1 roles retain authored anatomy; invalid item IDs are rejected before binding',()=>{
 const legacy=materializePackage(source('studio-light'));
 for(const role of ['combobox','multiselect','date-picker','time-picker'])legacy.components[role]={name:'Historical role',description:'Own content.',usage:'Keep authored markup.',composes:[],parts:{root:{selector:'.ds-old-'+role,styles:{}},control:{selector:'.ds-old-'+role+'__control',styles:{}}},variants:{},states:{},preview:{tag:'div',part:'root',children:[{tag:'button',part:'control',text:'Historical control'}]}};
 const create=createComponentFactory(legacy,{document:dom()});for(const role of ['combobox','multiselect','date-picker','time-picker'])assert.equal(create(role,{value:'not-a-date'}).querySelector('button').textContent,'Historical control');
 const standard=createComponentFactory(source('studio-light'),{document:dom()});assert.throws(()=>standard('combobox',{items:[{id:'x',label:'A'},{id:'x',label:'B'}]}),/unique/);assert.throws(()=>standard('multiselect',{values:'x'}),/Selected choices/);
});

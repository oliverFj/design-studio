import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createComponent,renderComponent,mountTooltip,mountPopover,mountDialog,mountDrawer} from '../core/components.mjs';
import {floatingPlacement} from '../core/overlays.mjs';
import {resolveThemeMode} from '../core/theme-modes.mjs';
import {materializePackage} from '../core/engine.mjs';
import {PUBLIC_THEME_IDS} from '../tools/public-themes.mjs';
import {dom,fire} from './support/dom.mjs';

const theme=id=>JSON.parse(readFileSync(new URL('../packages/'+id+'.json',import.meta.url),'utf8'));
const fixture=()=>{const document=dom(),trigger=document.createElement('button'),outside=document.createElement('button'),panel=document.createElement('section');document.body.append(trigger,panel,outside);return {document,trigger,outside,panel};};
const tick=()=>new Promise(resolve=>setTimeout(resolve,5));

test('floating panels flip at viewport edges, clamp both axes and respect visual viewport offsets',()=>{
 const anchor={left:270,right:310,top:170,bottom:200,width:40,height:30},panel={width:160,height:90};
 assert.deepEqual(floatingPlacement(anchor,panel,{width:320,height:220}),{left:152,top:72,placement:'top'});
 const result=floatingPlacement({left:0,right:10,top:0,bottom:10,width:10,height:10},{width:500,height:500},{width:320,height:220,left:15,top:20},{placement:'left'});
 assert.equal(result.left,23);assert.equal(result.top,28);
 assert.throws(()=>floatingPlacement(anchor,panel,{width:320,height:220},{placement:'invalid'}),/placement/);
});

test('floating panels align trigger edges, follow RTL, flip and stay inside the viewport',()=>{
 const anchor={left:200,right:240,top:80,bottom:100,width:40,height:20},panel={width:100,height:60},viewport={width:400,height:300};
 assert.equal(floatingPlacement(anchor,panel,viewport).left,170);
 assert.equal(floatingPlacement(anchor,panel,viewport,{align:'start'}).left,200);
 assert.equal(floatingPlacement(anchor,panel,viewport,{align:'end'}).left,140);
 assert.equal(floatingPlacement(anchor,panel,viewport,{align:'start',direction:'rtl'}).left,140);
 assert.equal(floatingPlacement(anchor,panel,viewport,{align:'end',direction:'rtl'}).left,200);
 assert.deepEqual(floatingPlacement({...anchor,top:250,bottom:270},panel,viewport,{align:'end'}),{left:140,top:182,placement:'top'});
 assert.equal(floatingPlacement({...anchor,left:10,right:50},panel,viewport,{align:'end'}).left,8);
 assert.throws(()=>floatingPlacement(anchor,panel,viewport,{align:'invalid'}),/alignment/);
});

test('popover forwards edge alignment to its shared positioner',()=>{
 const {trigger,panel}=fixture();
 trigger.getBoundingClientRect=()=>({left:200,right:240,top:80,bottom:100,width:40,height:20});
 panel.getBoundingClientRect=()=>({width:100,height:60});
 const popover=mountPopover(trigger,panel,{align:'end'});
 popover.open();assert.equal(panel.style.left,'140px');popover.destroy();
});

test('tooltip retains external descriptions, focus, hover persistence and Escape dismissal',async()=>{
 const {document,trigger,panel}=fixture();trigger.setAttribute('aria-describedby','existing');
 const tooltip=mountTooltip(trigger,panel,{delay:0,closeDelay:0});
 assert.match(trigger.getAttribute('aria-describedby'),/^existing ds-overlay-/);
 trigger.focus();assert.equal(tooltip.opened,true);assert.equal(document.activeElement,trigger);assert.equal(panel.getAttribute('role'),'tooltip');
 fire(trigger,'keydown',{key:'Escape'});assert.equal(tooltip.opened,false);assert.equal(document.activeElement,trigger);
 fire(trigger,'pointerenter');assert.equal(tooltip.opened,true);
 fire(trigger,'focusout');fire(trigger,'pointerleave');fire(panel,'pointerenter');await tick();assert.equal(tooltip.opened,true);
 fire(panel,'pointerleave');await tick();assert.equal(tooltip.opened,false);
 tooltip.destroy();assert.equal(trigger.getAttribute('aria-describedby'),'existing');assert.equal(panel.getAttribute('role'),null);
 fire(trigger,'focusin');assert.equal(tooltip.opened,false);
});

test('tooltips reject interactive content and disabled triggers cannot open overlays',()=>{
 const {trigger,panel,document}=fixture();panel.append(document.createElement('button'));
 assert.throws(()=>mountTooltip(trigger,panel),/interactive/);panel.replaceChildren();trigger.setAttribute('disabled','');
 const tooltip=mountTooltip(trigger,panel,{delay:0});tooltip.open();assert.equal(tooltip.opened,false);tooltip.destroy();
 const popover=mountPopover(trigger,panel);assert.equal(popover.open(),false);popover.destroy();
});

test('popover preserves form content, restores focus on Escape, and dismisses outside without stealing focus',()=>{
 const {document,trigger,panel,outside}=fixture(),field=document.createElement('input');field.value='Kladde';panel.append(field);
 const changes=[],popover=mountPopover(trigger,panel,{onOpenChange:value=>changes.push(value)});
 fire(trigger,'click');assert.equal(popover.opened,true);assert.equal(document.activeElement,field);assert.equal(trigger.getAttribute('aria-expanded'),'true');
 fire(field,'keydown',{key:'Escape'});assert.equal(popover.opened,false);assert.equal(document.activeElement,trigger);
 popover.open();assert.equal(field.value,'Kladde');outside.focus();assert.equal(popover.opened,false);assert.equal(document.activeElement,outside);
 popover.open();fire(outside,'pointerdown');assert.equal(popover.opened,false);assert.equal(document.activeElement,field,'pointer dismissal does not move focus before the native pointer action');
 assert.deepEqual(changes,[true,false,true,false,true,false]);popover.destroy();assert.equal(trigger.getAttribute('aria-controls'),null);
 fire(trigger,'click');assert.equal(popover.opened,false);
});

test('native dialog helpers use the requested modality and restore the opener, including cancellation',()=>{
 const {document,trigger,outside}=fixture();const dialog=document.createElement('dialog'),close=document.createElement('button');close.setAttribute('data-ds-close','');dialog.append(close);document.body.append(dialog);
 const calls=[];dialog.showModal=()=>{calls.push('modal');dialog.setAttribute('open','');close.focus();};dialog.show=()=>{calls.push('modeless');dialog.setAttribute('open','');close.focus();};dialog.close=()=>{dialog.removeAttribute('open');fire(dialog,'close');};
 const modal=mountDialog(dialog,{trigger});fire(trigger,'click');assert.deepEqual(calls,['modal']);assert.equal(document.activeElement,close);
 fire(close,'click');assert.equal(modal.opened,false);assert.equal(document.activeElement,trigger);
 modal.open();dialog.close();assert.equal(modal.opened,false);modal.destroy();
 const modeless=mountDrawer(dialog,{trigger,modal:false});modeless.open();assert.equal(calls.at(-1),'modeless');fire(close,'keydown',{key:'Escape'});assert.equal(modeless.opened,false);assert.equal(document.activeElement,trigger);
 modeless.open();outside.focus();modeless.destroy();assert.equal(document.activeElement,outside,'destroying a modeless dialog does not steal focus back from outside');
 const unsupported=mountDialog(document.createElement('dialog'));assert.throws(()=>unsupported.open(),/showModal/);unsupported.destroy();
});

test('initial popover focus skips native inherited disabled controls',()=>{
 const {document,trigger,panel}=fixture(),unavailable=document.createElement('input'),available=document.createElement('button');
 unavailable.matches=selector=>selector===':disabled';panel.append(unavailable,available);
 const popover=mountPopover(trigger,panel);popover.open();assert.equal(document.activeElement,available);popover.destroy();
});

test('Escape closes only the nested popover; closing its parent cleans up the child layer',()=>{
 const {document,trigger,panel}=fixture(),innerTrigger=document.createElement('button'),innerPanel=document.createElement('section'),field=document.createElement('input');
 panel.append(innerTrigger,innerPanel);innerPanel.append(field);
 const outer=mountPopover(trigger,panel),inner=mountPopover(innerTrigger,innerPanel);
 outer.open();inner.open();fire(field,'keydown',{key:'Escape'});
 assert.equal(inner.opened,false);assert.equal(outer.opened,true);assert.equal(document.activeElement,innerTrigger);
 inner.open();outer.close();assert.equal(outer.opened,false);assert.equal(inner.opened,false);assert.equal(innerPanel.hidden,true);assert.equal(document.activeElement,trigger);
 inner.destroy();outer.destroy();
});

test('nested panels may be DOM siblings: focus and pointer entry retain their logical parent',()=>{
 const {document,trigger,panel}=fixture(),innerTrigger=document.createElement('button'),innerPanel=document.createElement('section'),field=document.createElement('input');
 panel.append(innerTrigger);document.body.append(innerPanel);innerPanel.append(field);
 const outer=mountPopover(trigger,panel),inner=mountPopover(innerTrigger,innerPanel);
 outer.open();inner.open();assert.equal(outer.opened,true);assert.equal(inner.opened,true);assert.equal(document.activeElement,field);
 fire(field,'pointerdown');assert.equal(outer.opened,true);assert.equal(inner.opened,true);
 fire(field,'keydown',{key:'Escape'});assert.equal(inner.opened,false);assert.equal(outer.opened,true);
 inner.open();outer.close();assert.equal(inner.opened,false);assert.equal(document.activeElement,trigger);inner.destroy();outer.destroy();
});

test('dialog, drawer and popover have unique names and structural descriptions in every mode',()=>{
 for(const id of PUBLIC_THEME_IDS)for(const mode of ['light','dark']){
  const pack=resolveThemeMode(theme(id),mode),document=dom();
  for(const role of ['dialog','drawer','popover']){
   const options={idPrefix:role+'-test',title:'Et langt navn',body:'Oplysninger',attrs:{id:'unique-'+role}},node=createComponent(pack,role,options,{document}),html=renderComponent(pack,role,options);
   assert.equal(node.querySelector('#unique-'+role),null,'the host id is not duplicated inside');
   assert.equal(node.getAttribute('aria-labelledby'),role+'-test-title');assert.equal(node.getAttribute('aria-describedby'),role+'-test-body');
   assert.ok(html.includes('Et langt navn'));assert.ok(html.includes('Oplysninger'));
   if(role==='drawer')assert.equal(node.getAttribute('data-side'),'end');
   if(role!=='popover'){
    const hiddenHost=createComponent(pack,role,{...options,attrs:{hidden:true}},{document});
    assert.notEqual(hiddenHost.getAttribute('hidden'),null);assert.equal(hiddenHost.children[0].getAttribute('hidden'),null,'native dialog host visibility must not also hide its content');
   }
   const structural=createComponent(pack,role,{...options,describeBody:false},{document});assert.equal(structural.getAttribute('aria-describedby'),null);
  }
 }
});

test('format 1 keeps custom drawer and popover anatomy and root attributes',()=>{
 const legacy=materializePackage(theme('studio-light')),document=dom();
 for(const role of ['drawer','popover']){
  legacy.components[role]={name:'Historisk flade',description:'Eksisterende produktindhold.',usage:'Produktets egen anatomi.',composes:[],parts:{root:{selector:'.ds-custom-'+role,styles:{}}},variants:{},states:{},preview:{tag:'section',part:'root',text:'Bevaret indhold'}};
  const node=createComponent(legacy,role,{attrs:{id:'old-'+role}},{document});assert.equal(node.tagName,'SECTION');assert.equal(node.getAttribute('id'),'old-'+role);assert.equal(node.textContent,'Bevaret indhold');assert.equal(node.getAttribute('aria-labelledby'),null);
 }
});

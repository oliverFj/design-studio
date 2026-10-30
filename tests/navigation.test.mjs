import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createComponentFactory,createComponentRenderer,mountTabs} from '../core/components.mjs';
import {resolveThemeMode} from '../core/theme-modes.mjs';
import {validatePackage,generateCSS,materializePackage} from '../core/engine.mjs';
import {PUBLIC_THEME_IDS} from '../tools/public-themes.mjs';
import {dom,fire} from './support/dom.mjs';
const source=()=>JSON.parse(readFileSync(new URL('../packages/studio-light.json',import.meta.url),'utf8'));
function fixture(options={}){
 const document=dom(),create=createComponentFactory(resolveThemeMode(source(),'light'),{document});
 const root=create('tabs',{idPrefix:'test-tabs',label:'Produktindhold',items:[{id:'overview',label:'Overblik',content:'Velkommen'},{id:'locked',label:'Låst',disabled:true,content:'Låst indhold'},{id:'details',label:'Detaljer med en meget lang overskrift',content:[{component:'field',options:{label:'Mine noter',value:'Bevar kladden',idPrefix:'notes'}}]}],...options});
 document.body.append(root);
 const tabs=root.querySelectorAll('[role="tab"]'),panels=root.querySelectorAll('[role="tabpanel"]');
 return {document,root,tabs,panels};
}

test('navigation families validate and render using every public light/dark palette',()=>{
 for(const id of PUBLIC_THEME_IDS){
  const paired=JSON.parse(readFileSync(new URL('../packages/'+id+'.json',import.meta.url),'utf8'));
  for(const mode of ['light','dark']){
   const theme=resolveThemeMode(paired,mode);assert.deepEqual(validatePackage(theme),{valid:true,errors:[]},id+'/'+mode);
   const render=createComponentRenderer(theme);
   for(const role of ['tabs','accordion','breadcrumb','pagination'])assert.match(render(role),new RegExp('class="ds-'+role+'"'));
   const css=generateCSS(theme);assert.match(css,/\.ds-tabs__tab:is\([^\n]*aria-selected/);assert.match(css,/\.ds-pagination__link:is\([^\n]*aria-current/);assert.match(css,/\.ds-accordion__summary:is\(:focus-visible/);
  }
 }
});

test('tabs expose reciprocal unique relations and automatic keyboard navigation skips disabled items',()=>{
 const {document,root,tabs,panels}=fixture(),changes=[];
 const controller=mountTabs(root,{onChange:(id,detail)=>changes.push([id,detail.previousId])});
 assert.equal(controller.selectedId,'overview');
 for(let i=0;i<tabs.length;i++){
  assert.equal(tabs[i].getAttribute('aria-controls'),panels[i].getAttribute('id'));assert.equal(panels[i].getAttribute('aria-labelledby'),tabs[i].getAttribute('id'));
  assert.equal(tabs[i].getAttribute('aria-selected'),String(i===0));
 }
 assert.equal(new Set([...tabs,...panels].map(node=>node.getAttribute('id'))).size,6);
 tabs[0].focus();fire(tabs[0],'keydown',{key:'ArrowRight'});assert.equal(document.activeElement,tabs[2]);assert.equal(controller.selectedId,'details');
 assert.equal(panels[0].getAttribute('hidden'),'');assert.equal(panels[2].getAttribute('hidden'),null);
 fire(tabs[2],'keydown',{key:'ArrowRight'});assert.equal(document.activeElement,tabs[0],'arrow keys wrap');
 fire(tabs[0],'keydown',{key:'End'});assert.equal(document.activeElement,tabs[2]);fire(tabs[2],'keydown',{key:'Home'});assert.equal(document.activeElement,tabs[0]);
 assert.equal(fire(tabs[0],'keydown',{key:'ArrowDown'}).defaultPrevented,undefined,'horizontal tabs preserve vertical page scrolling');
 fire(tabs[1],'click');assert.equal(controller.selectedId,'overview');assert.ok(changes.every(([id])=>id!=='locked'));
 const field=panels[2].querySelector('input');field.value='Min ændrede kladde';
 fire(tabs[2],'click');fire(tabs[0],'click');fire(tabs[2],'click');assert.equal(panels[2].querySelector('input'),field);assert.equal(field.value,'Min ændrede kladde');
 field.focus();controller.update({selectedId:'details'});assert.equal(document.activeElement,field,'an unchanged external selection keeps focus inside the panel');
 controller.update({selectedId:'overview'});assert.equal(document.activeElement,tabs[0],'closing the focused panel restores a visible focus target');
 controller.destroy();controller.destroy();fire(tabs[2],'click');assert.equal(controller.selectedId,'overview');assert.throws(()=>controller.update(),/destroyed/);
});

test('manual tabs separate focus from activation, support vertical keys and restore the selected entry tabstop',()=>{
 const {document,root,tabs,panels}=fixture({orientation:'vertical'}),controller=mountTabs(root,{activation:'manual'});
 assert.equal(root.getAttribute('data-variant'),'vertical','vertical keyboard semantics and visual orientation agree');
 tabs[0].focus();fire(tabs[0],'keydown',{key:'ArrowDown'});assert.equal(document.activeElement,tabs[2]);assert.equal(controller.selectedId,'overview');assert.equal(panels[0].getAttribute('hidden'),null);
 fire(tabs[2],'keydown',{key:'Enter'});assert.equal(controller.selectedId,'details');
 fire(tabs[2],'keydown',{key:'ArrowUp'});assert.equal(document.activeElement,tabs[0]);assert.equal(controller.selectedId,'details');
 fire(tabs[0],'keydown',{key:' '});assert.equal(controller.selectedId,'overview');
 fire(tabs[0],'keydown',{key:'ArrowDown'});fire(tabs[2],'keydown',{key:'Tab'});assert.equal(tabs[0].getAttribute('tabindex'),'0');assert.equal(tabs[2].getAttribute('tabindex'),'-1');
 assert.equal(fire(tabs[2],'keydown',{key:'ArrowRight'}).defaultPrevented,undefined);
 controller.update({orientation:'horizontal'});root.querySelector('[role="tablist"]').setAttribute('dir','rtl');
 assert.equal(root.getAttribute('data-variant'),'default');
 tabs[0].focus();fire(tabs[0],'keydown',{key:'ArrowLeft'});assert.equal(document.activeElement,tabs[2]);
 tabs[2].setAttribute('disabled','');controller.update();assert.equal(document.activeElement,tabs[0],'disabling the focused tab moves focus to an available tab');
 tabs[0].setAttribute('disabled','');controller.update();assert.equal(controller.selectedId,null);assert.ok(panels.every(panel=>panel.getAttribute('hidden')!==null));
 assert.equal(document.activeElement,root.querySelector('[role="tablist"]'),'an all-disabled group retains a visible, named focus target');
 tabs[0].removeAttribute('disabled');controller.update();assert.equal(document.activeElement,tabs[0]);
 controller.destroy();
});

test('tabs reject broken associations and ignore navigation inside nested tablists',()=>{
 const {root,tabs}=fixture();tabs[0].setAttribute('aria-controls','missing-panel');assert.throws(()=>mountTabs(root),/reciprocal/);
 const missing=fixture();missing.tabs[0].removeAttribute('id');missing.panels[0].removeAttribute('aria-labelledby');assert.throws(()=>mountTabs(missing.root),/reciprocal/);
 const duplicate=fixture();duplicate.tabs[2].setAttribute('id',duplicate.tabs[0].getAttribute('id'));duplicate.panels[2].setAttribute('aria-labelledby',duplicate.tabs[0].getAttribute('id'));assert.throws(()=>mountTabs(duplicate.root),/unique IDs/);
 const outer=fixture(),inner=fixture({idPrefix:'inner-tabs'});outer.panels[0].append(inner.root);
 const outerController=mountTabs(outer.root),innerController=mountTabs(inner.root);
 inner.tabs[0].focus();fire(inner.tabs[0],'keydown',{key:'ArrowRight'});assert.equal(innerController.selectedId,'details');assert.equal(outerController.selectedId,'overview');
 outerController.destroy();innerController.destroy();
});

test('native disclosure markup retains summary and open state without synthetic keyboard behavior',()=>{
 const document=dom(),create=createComponentFactory(resolveThemeMode(source(),'light'),{document});
 const root=create('accordion',{idPrefix:'information',label:'Praktiske oplysninger',items:[{label:'En meget lang overskrift med hele ord',content:'Læs detaljerne.',open:true},{label:'Flere oplysninger',content:'Andet indhold'}]});
 const items=root.querySelectorAll('details');assert.equal(items.length,2);assert.equal(items[0].firstChild.tagName,'SUMMARY');assert.equal(items[0].getAttribute('open'),'');assert.equal(items[1].getAttribute('open'),null);
 for(const item of items){assert.equal(item.firstChild.getAttribute('role'),null);assert.equal(item.listeners.size,0);assert.equal(item.querySelector('.ds-accordion__body').getAttribute('aria-labelledby'),item.firstChild.getAttribute('id'));}
 assert.throws(()=>create('accordion',{disabled:true}),/do not support disabled/);
});

test('breadcrumbs and pagination use native destinations and remove unavailable links',()=>{
 const document=dom(),create=createComponentFactory(resolveThemeMode(source(),'light'),{document});
 for(const id of ['breadcrumb','pagination']){
  const root=create(id,{label:'Aktuel placering',items:[{label:'Tilbage',disabled:true,href:'#tilbage'},{label:'En lang destination der stadig kan læses',href:'#destination'},{label:'Aktuelt',current:true}]});
  assert.equal(root.tagName,'NAV');assert.equal(root.getAttribute('aria-label'),'Aktuel placering');assert.equal(root.querySelector('ol').children.length,3);
  const links=root.querySelectorAll('.ds-'+id+'__link');assert.equal(links[0].tagName,'SPAN');assert.equal(links[0].getAttribute('href'),null);assert.equal(links[0].getAttribute('tabindex'),null);assert.equal(links[0].getAttribute('aria-disabled'),'true');
  assert.equal(links[1].tagName,'A');assert.equal(links[1].getAttribute('href'),'#destination');assert.equal(links[2].getAttribute('aria-current'),'page');
  assert.throws(()=>create(id,{items:[{label:'Usikkert',href:'javascript:alert(1)'}]}),/Unsupported component URL/);
  assert.throws(()=>create(id,{items:[{label:'A',current:true},{label:'B',current:true}]}),/only one current/);
 }
 const root=create('breadcrumb');assert.ok(root.querySelectorAll('.ds-breadcrumb__separator').every(node=>node.getAttribute('aria-hidden')==='true'));
 assert.equal(root.querySelectorAll('[aria-current="page"]').length,1);
});

test('a historical custom format-1 role keeps its own tabs anatomy',()=>{
 const legacy=materializePackage(resolveThemeMode(source(),'light'));
 legacy.components.tabs={name:'Legacy tabs',description:'A historical custom role.',usage:'Keep its authored markup.',composes:[],parts:{root:{selector:'.ds-custom-tabs',styles:{}},control:{selector:'.ds-custom-tab',styles:{}}},variants:{},states:{disabled:{description:'Unavailable control.',styles:{}}},preview:{tag:'div',part:'root',children:[{tag:'button',part:'control',text:'Legacy tab'}]}};
 const document=dom(),create=createComponentFactory(legacy,{document}),root=create('tabs',{state:'disabled'});
 assert.equal(root.className,'ds-custom-tabs');assert.equal(root.firstChild.className,'ds-custom-tab');assert.equal(root.firstChild.getAttribute('disabled'),'');
});

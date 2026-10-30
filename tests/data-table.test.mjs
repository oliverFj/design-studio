import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createComponentFactory,createComponentRenderer,mountDataTable} from '../core/components.mjs';
import {validatePackage,generateCSS,materializePackage} from '../core/engine.mjs';
import {resolveThemeMode} from '../core/theme-modes.mjs';
import {PUBLIC_THEME_IDS} from '../tools/public-themes.mjs';
import {dom,fire} from './support/dom.mjs';
const source=id=>JSON.parse(readFileSync(new URL('../packages/'+id+'.json',import.meta.url),'utf8'));
const columns=[{id:'name',label:'Navn',sortable:true},{id:'status',label:'Status'}];
const rows=[{id:'a',label:'Anna',cells:{name:'Anna',status:'Klar'},detail:[{tag:'input',attrs:{value:'En bevaret kladde','aria-label':'Detaljenote'}}],actions:[{id:'open',label:'Åbn'}]},{id:'b',label:'Bo',cells:{name:'Bo',status:'Kladde'},detail:'Oplysninger om Bo.'},{id:'c',label:'Clara',cells:{name:'Clara',status:'Låst'},disabled:true,actions:[{id:'open',label:'Åbn'}]}];
function fixture(options={}){
 const document=dom(),create=createComponentFactory(resolveThemeMode(source('studio-light'),'light'),{document}),root=create('data-table',{idPrefix:'people',label:'Deltagere',columns,rows,selection:'multiple',...options});document.body.append(root);return {document,root,create};
}
const by=(root,attribute,value)=>root.querySelectorAll('['+attribute+']').find(node=>node.getAttribute(attribute)===value);
const setChecked=(node,value)=>{node.checked=value;fire(node,'change');};

test('native data tables validate, scope CSS and render feedback in every public color mode',()=>{
 for(const id of PUBLIC_THEME_IDS)for(const mode of ['light','dark']){
  const theme=resolveThemeMode(source(id),mode);assert.deepEqual(validatePackage(theme),{valid:true,errors:[]},id+'/'+mode);
  const render=createComponentRenderer(theme),css=generateCSS(theme);
  assert.match(css,/\.ds-data-table__table[\s\S]*?border-collapse: collapse/);assert.match(css,/\.ds-data-table__viewport[\s\S]*?overflow-x: auto/);
  for(const status of ['ready','loading','error','empty']){
   const html=render('data-table',{columns,rows,status,label:'En meget lang tabeloverskrift der skal kunne ombrydes',pagination:{items:[{label:'1',current:true}]}});
   assert.match(html,/<table class="ds-data-table__table">/);assert.match(html,/<caption/);assert.match(html,/<thead/);assert.match(html,/<th scope="col"/);assert.doesNotMatch(html,/role="grid"/);
   if(status==='loading')assert.match(html,/aria-busy="true"/);
   if(status==='error')assert.match(html,/role="alert"/);
   if(status==='empty'){assert.match(html,/ds-empty-state/);assert.doesNotMatch(html,/data-table-row=/);}
   assert.match(html,/ds-pagination/);
  }
 }
});

test('multiple selection has named native controls, mixed select-all and page-scoped eligible choices',()=>{
 const {root}=fixture({selectedIds:['a','another-page']}),changes=[],controller=mountDataTable(root,{onSelectionChange:(value,context)=>changes.push([value,context])});
 const all=root.querySelector('[data-select-all]'),a=by(root,'data-select-row','a'),b=by(root,'data-select-row','b'),c=by(root,'data-select-row','c');
 assert.equal(a.getAttribute('aria-label'),'Vælg Anna');assert.equal(all.getAttribute('aria-label'),'Vælg alle synlige rækker');assert.equal(all.indeterminate,true);assert.equal(all.getAttribute('aria-checked'),'mixed');assert.equal(c.getAttribute('disabled'),'');
 setChecked(all,true);assert.deepEqual(controller.selectedIds,['a','another-page','b']);assert.equal(all.indeterminate,false);assert.equal(all.checked,true);assert.equal(c.checked,false);assert.equal(changes.at(-1)[1].all,true);
 setChecked(a,false);assert.equal(all.indeterminate,true);assert.equal(by(root,'data-table-row','a').getAttribute('data-state'),null);assert.deepEqual(controller.selectedIds,['another-page','b']);
 setChecked(all,false);assert.deepEqual(controller.selectedIds,['another-page'],'unselecting this page preserves an off-page selection');
 const copy=controller.selectedIds;copy.push('external');assert.deepEqual(controller.selectedIds,['another-page']);
 a.setAttribute('disabled','');b.setAttribute('disabled','');controller.update();assert.equal(all.getAttribute('disabled'),'');a.removeAttribute('disabled');controller.update();assert.equal(all.getAttribute('disabled'),null);
 controller.destroy();setChecked(a,true);assert.deepEqual(controller.selectedIds,['another-page']);assert.throws(()=>controller.update(),/destroyed/);
});

test('single selection uses one radio group and does not install grid arrow-key navigation',()=>{
 const {root}=fixture({selection:'single',selectedIds:['a']}),controller=mountDataTable(root);
 assert.equal(root.querySelector('[data-select-all]'),null);
 const controls=root.querySelectorAll('[data-select-row]');assert.ok(controls.every(control=>control.getAttribute('type')==='radio'));assert.equal(new Set(controls.map(control=>control.getAttribute('name'))).size,1);
 setChecked(controls[1],true);assert.deepEqual(controller.selectedIds,['b']);assert.equal(controls[0].checked,false);
 assert.equal(fire(controls[1],'keydown',{key:'ArrowDown'}).defaultPrevented,undefined);
 assert.throws(()=>controller.update({selectedIds:['a','b']}),/at most one/);assert.deepEqual(controller.selectedIds,['b']);controller.destroy();
});

test('sort requests are controlled and updates preserve focused row controls and selected IDs during reorder',()=>{
 const {document,root}=fixture({selectedIds:['b']}),requests=[],controller=mountDataTable(root,{onSort:value=>requests.push(value)}),button=root.querySelector('[data-table-sort]'),header=by(root,'data-column-id','name');
 button.focus();fire(button,'click');assert.deepEqual(requests.at(-1),{columnId:'name',direction:'ascending'});assert.equal(header.getAttribute('aria-sort'),null,'a request does not falsely announce reordered data');
 controller.update({sort:requests.at(-1)});assert.equal(header.getAttribute('aria-sort'),'ascending');assert.equal(document.activeElement,button);
 fire(button,'click');assert.equal(requests.at(-1).direction,'descending');
 const selected=by(root,'data-select-row','b');selected.focus();root.querySelector('tbody').append(by(root,'data-table-row','b'));controller.update({sort:requests.at(-1)});
 assert.equal(document.activeElement,selected);assert.equal(selected.checked,true);assert.deepEqual(controller.selectedIds,['b']);assert.equal(header.getAttribute('aria-sort'),'descending');
 controller.update({sort:null});assert.equal(header.getAttribute('aria-sort'),null);controller.destroy();
});

test('expanded details have reciprocal controls, retain native drafts and restore focus when closed',()=>{
 const {document,root}=fixture(),calls=[],controller=mountDataTable(root,{onExpand:(value,context)=>calls.push([value,context])}),button=by(root,'data-expand-row','a'),detail=by(root,'data-table-detail','a'),input=detail.querySelector('input');
 assert.equal(button.getAttribute('aria-controls'),detail.getAttribute('id'));assert.equal(detail.firstChild.getAttribute('colspan'),'4');assert.equal(detail.getAttribute('hidden'),'');
 fire(button,'click');assert.equal(detail.getAttribute('hidden'),null);assert.equal(button.getAttribute('aria-expanded'),'true');input.value='Ændret kladde';input.focus();controller.update({expandedIds:[]});
 assert.equal(document.activeElement,button);fire(button,'click');assert.equal(detail.querySelector('input'),input);assert.equal(input.value,'Ændret kladde');assert.equal(calls.at(-1)[1].rowId,'a');
 controller.destroy();
});

test('row actions remain separate from selection and unavailable/loading controls cannot dispatch',()=>{
 const {root}=fixture(),actions=[],controller=mountDataTable(root,{onAction:(...args)=>actions.push(args)});
 fire(by(root,'data-action-row','a'),'click');assert.deepEqual(actions[0].slice(0,2),['a','open']);assert.deepEqual(controller.selectedIds,[]);
 fire(by(root,'data-action-row','c'),'click');assert.equal(actions.length,1);controller.destroy();
 const loading=fixture({status:'loading'}),blocked=[];const pending=mountDataTable(loading.root,{onAction:()=>blocked.push(1),onSort:()=>blocked.push(1),onExpand:()=>blocked.push(1)});
 for(const attribute of ['data-action-row','data-table-sort','data-expand-row'])fire(loading.root.querySelector('['+attribute+']'),'click');assert.deepEqual(blocked,[]);pending.destroy();
});

test('a table nested inside expanded content keeps its own selection and events',()=>{
 const {root}=fixture({rows:[{id:'outer',cells:{name:'Ydre'},detail:{component:'data-table',options:{idPrefix:'nested-table',columns,rows:[{id:'inner',cells:{name:'Indre'}}],selection:'multiple'}}}]}),outer=mountDataTable(root),innerRoot=root.querySelector('[data-table]'),inner=mountDataTable(innerRoot);
 setChecked(by(innerRoot,'data-select-row','inner'),true);assert.deepEqual(inner.selectedIds,['inner']);assert.deepEqual(outer.selectedIds,[]);
 assert.equal(root.querySelector('[data-select-all]').checked,false);inner.destroy();outer.destroy();
});

test('table values are escaped, unsafe nodes/URLs and duplicate identities are rejected; custom legacy anatomy survives',()=>{
 const theme=resolveThemeMode(source('studio-light'),'light'),render=createComponentRenderer(theme),unsafe='<img src=x onerror=alert(1)>';
 assert.match(render('data-table',{columns,rows:[{id:'safe',cells:{name:unsafe,status:'Klar'}}]}),/&lt;img src=x onerror=alert\(1\)&gt;/);
 assert.throws(()=>render('data-table',{columns,rows:[{id:'x'},{id:'x'}]}),/row IDs must be unique/);
 assert.throws(()=>render('data-table',{columns:[columns[0],columns[0]],rows:[]}),/column IDs must be unique/);
 assert.throws(()=>render('data-table',{columns,rows:[{id:'x',cells:{name:{html:'unsafe'}}}]}),/text or declarative/);
 assert.throws(()=>render('data-table',{columns,rows:[{id:'x',cells:{name:{tag:'a',attrs:{href:'javascript:alert(1)'},text:'Link'}}}]}),/Unsupported component URL/);
 const legacy=materializePackage(theme);legacy.components['data-table']={name:'Legacy table',description:'Historical anatomy.',usage:'Preserve authored markup.',composes:[],parts:{root:{selector:'.ds-legacy-table',styles:{}}},variants:{},states:{},preview:{tag:'div',part:'root',text:'Legacy'}};
 const document=dom(),create=createComponentFactory(legacy,{document});assert.equal(create('data-table').className,'ds-legacy-table');
});

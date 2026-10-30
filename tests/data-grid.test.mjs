import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createComponent,renderComponent,mountDataGrid,parseGridTSV,serializeGridTSV} from '../core/components.mjs';
import {materializePackage,generateCSS} from '../core/engine.mjs';
import {resolveThemeMode} from '../core/theme-modes.mjs';
import {PUBLIC_THEME_IDS} from '../tools/public-themes.mjs';
import {dom,fire} from './support/dom.mjs';

const theme=id=>resolveThemeMode(JSON.parse(readFileSync(new URL('../packages/'+id+'.json',import.meta.url),'utf8')),'light');
const columns=[{id:'name',label:'Projekt',editable:true},{id:'quantity',label:'Antal',type:'number',min:0,step:1,editable:true},{id:'status',label:'Status',type:'select',options:[{value:'Kladde',label:'Kladde'},{value:'Klar',label:'Klar'},{value:'Låst',label:'Låst',disabled:true}],editable:true}];
const rows=[{id:'a',label:'Projekt A',cells:{name:'Projekt A',quantity:4,status:'Kladde'}},{id:'b',label:'Projekt B',cells:{name:'Projekt B',quantity:2,status:'Klar'}}];
function fixture(options={}){
 const document=dom(),root=createComponent(theme('studio-light'),'data-grid',{columns,rows,...options},{document}),outside=document.createElement('button');document.body.append(root,outside);
 const commits=[],grid=mountDataGrid(root,{columns,rows,...options,onCommit(...args){commits.push(args);options.onCommit?.(...args);}});
 const cell=(row,column)=>root.querySelector('[data-grid-row="'+row+'"]').querySelector('[data-grid-column="'+column+'"]');
 const key=(key,extra={})=>fire(document.activeElement,'keydown',{key,...extra});
 return {document,root,outside,grid,cell,key,commits};
}

test('grid cell focus is independent of persistent rectangular selection and follows rows/columns',()=>{
 const {grid,cell,key,document}=fixture();cell('a','name').focus();key('ArrowRight');
 assert.equal(document.activeElement,cell('a','quantity'));assert.equal(grid.selection,null);assert.equal(grid.rows[0].cells.quantity,4);
 key('ArrowDown',{shiftKey:true});assert.equal(grid.selection.top,0);assert.equal(grid.selection.bottom,1);assert.equal(grid.copySelection(),'4\r\n2');
 key('Home',{ctrlKey:true});assert.equal(document.activeElement,cell('a','name'));assert.equal(grid.selection.left,1,'plain navigation does not change the selected range');
 key('Escape');assert.equal(grid.selection,null);key('End',{ctrlKey:true});assert.equal(document.activeElement,cell('b','status'));
 key(' ',{shiftKey:true});assert.equal(grid.selection.left,0);assert.equal(grid.selection.right,2);grid.destroy();
});

test('editing validates atomically, keeps rejected drafts, supports Escape and commits before Tab',()=>{
 const {grid,cell,key,document,commits}=fixture({validateCell(value,{columnId}){return columnId==='name'&&value==='Nej'?'Vælg et andet navn.':null;}});
 cell('a','quantity').focus();key('F2');const input=document.activeElement;input.value='-1';assert.equal(grid.commitEdit(),false);assert.equal(grid.draft.value,'-1');assert.equal(grid.rows[0].cells.quantity,4);assert.equal(input.getAttribute('aria-invalid'),'true');assert.equal(cell('a','quantity').getAttribute('tabindex'),'-1');
 key('Escape');assert.equal(document.activeElement,cell('a','quantity'));assert.equal(grid.draft,null);
 key('8');assert.equal(grid.draft.value,'8');key('Tab');assert.equal(grid.rows[0].cells.quantity,8);assert.equal(document.activeElement,cell('a','status'));assert.equal(commits.length,1);
 key('Enter');document.activeElement.value='Klar';key('Enter');assert.equal(grid.rows[0].cells.status,'Klar');
 grid.startEdit({rowId:'a',columnId:'name'});document.activeElement.value='Nej';assert.equal(grid.commitEdit(),false);assert.equal(grid.rows[0].cells.name,'Projekt A');key('Escape');grid.destroy();
});

test('numeric sign/decimal drafts and select typeahead do not erase the original value',()=>{
 const {grid,cell,key,document}=fixture({columns:columns.map(column=>column.id==='quantity'?{...column,min:-10,step:.5}:column)});
 cell('a','quantity').focus();key('-');assert.equal(grid.draft.value,'-');assert.equal(document.activeElement.getAttribute('type'),'text');document.activeElement.value='-2.5';key('Enter');assert.equal(grid.rows[0].cells.quantity,-2.5);
 cell('a','status').focus();key('z');assert.equal(grid.draft.value,'Kladde','an unmatched select prefix preserves the current value');key('Escape');key('k');assert.equal(grid.draft.value,'Kladde');key('Escape');grid.destroy();
});

test('copy/paste round-trips quoted multiline and empty cells, including an empty final row',()=>{
 const matrix=[['A\tB','Han sagde "hej"'],['linje 1\nlinje 2',''],['','']];assert.deepEqual(parseGridTSV(serializeGridTSV(matrix)),matrix);
 assert.deepEqual(parseGridTSV(serializeGridTSV([['A'],['']])),[['A'],['']]);assert.deepEqual(parseGridTSV('A\r\n""'),[['A'],['']]);
 assert.throws(()=>parseGridTSV('"ubrugt'),/afsluttet/);assert.throws(()=>parseGridTSV('A\tB\nC'),/forskelligt/);
 const {grid,cell,document}=fixture();cell('a','name').focus();assert.equal(grid.paste('Opdateret\t6\tKlar'),true);assert.equal(grid.rows[0].cells.quantity,6);assert.equal(grid.rows[0].cells.name,'Opdateret');
 const before=grid.rows;assert.equal(grid.paste('Må ikke ændres\t-1\tKlar'),false);assert.deepEqual(grid.rows,before,'one invalid cell rejects the whole batch');
 let copied='';fire(document.activeElement,'copy',{clipboardData:{setData(type,value){assert.equal(type,'text/plain');copied=value;}}});assert.equal(copied,'Opdateret\t6\tKlar');grid.destroy();
});

test('readonly cells can be navigated and copied but reject editing and mixed batch paste',()=>{
 const {grid,cell,key,document}=fixture({columns:columns.map(column=>column.id==='name'?{...column,editable:false}:column)});
 cell('a','name').focus();key('Enter');assert.equal(grid.draft,null);assert.equal(document.activeElement,cell('a','name'));assert.equal(grid.copySelection(),'Projekt A');
 assert.equal(grid.paste('Må ikke ændres\t5'),false);assert.equal(grid.rows[0].cells.quantity,4);key('ArrowRight');key('Enter');assert.ok(grid.draft);grid.cancelEdit();grid.destroy();
});

test('keyed updates preserve the editor, draft, focus and scroll, and detect concurrent changes',()=>{
 const {grid,cell,key,document,root}=fixture();cell('a','quantity').focus();key('Enter');const editor=document.activeElement;editor.value='7';const viewport=root.querySelector('[data-grid-viewport]');viewport.scrollTop=42;viewport.scrollLeft=19;
 assert.equal(grid.update({rows:[rows[1],rows[0]]}),true);assert.equal(document.activeElement,editor);assert.equal(grid.draft.value,'7');assert.equal(viewport.scrollLeft,19);assert.equal(viewport.scrollTop,42);
 const changed=[rows[1],{...rows[0],cells:{...rows[0].cells,quantity:10}}];grid.update({rows:changed});assert.equal(grid.commitEdit(),false);assert.equal(grid.rows[1].cells.quantity,10);assert.equal(grid.draft.value,'7');
 assert.equal(grid.update({rows:[rows[1]]}),false);assert.equal(grid.draft.value,'7');assert.equal(grid.rows.length,2);
 grid.cancelEdit();grid.update({rows:[]});assert.equal(grid.activeCell,null);assert.equal(document.activeElement,root.querySelector('[role="grid"]'));grid.destroy();
});

test('editor schema changes are deferred without discarding the draft; multiline cells retain line breaks',()=>{
 const {grid,cell,key,document}=fixture({rows:[{...rows[0],cells:{...rows[0].cells,name:'En\nanden linje'}}]});cell('a','name').focus();key('F2');assert.equal(document.activeElement.tagName,'TEXTAREA');assert.equal(grid.draft.value,'En\nanden linje');key('Enter');assert.equal(grid.rows[0].cells.name,'En\nanden linje');
 cell('a','quantity').focus();key('F2');document.activeElement.value='9';assert.equal(grid.update({columns:columns.map(column=>column.id==='quantity'?{...column,max:5}:column)}),false);assert.equal(grid.draft.value,'9');grid.cancelEdit();grid.destroy();
});

test('destroy blocks deferred focusout commits and callbacks may remove a subsequent edit target',async()=>{
 const first=fixture();first.cell('a','name').focus();first.key('Enter');first.document.activeElement.value='Skal bevares';fire(first.document.activeElement,'focusout');first.outside.focus();first.grid.destroy();await Promise.resolve();assert.equal(first.commits.length,0);assert.equal(first.grid.commitEdit(),false);assert.equal(first.grid.cancelEdit(),false);assert.equal(first.grid.draft.value,'Skal bevares');
 let control;const next=fixture({onCommit(){control.destroy();}});control=next.grid;next.cell('a','name').focus();next.key('Enter');next.document.activeElement.value='Ændret';assert.equal(next.grid.startEdit({rowId:'b',columnId:'name'}),false);assert.equal(next.root.querySelectorAll('input').length,0);
});

test('grid markup, CSS and legacy isolation work in every theme mode',()=>{
 for(const id of PUBLIC_THEME_IDS)for(const mode of ['light','dark']){
  const pack=resolveThemeMode(JSON.parse(readFileSync(new URL('../packages/'+id+'.json',import.meta.url),'utf8')),mode),document=dom(),options={idPrefix:'grid-'+id+'-'+mode,label:'Budget',columns,rows};
  const root=createComponent(pack,'data-grid',options,{document}),html=renderComponent(pack,'data-grid',options),css=generateCSS(pack),grid=mountDataGrid(root,options);document.body.append(root);
  assert.match(html,/role="grid"/);assert.match(html,/aria-rowcount="3"/);assert.match(html,/aria-colcount="3"/);assert.match(css,/ds-data-grid__editor/);assert.equal(root.querySelector('caption').textContent,'Budget');assert.equal(root.querySelectorAll('[tabindex="0"]').length,1);grid.destroy();
 }
 const legacy=materializePackage(theme('studio-light'));legacy.components['data-grid']={name:'Historisk grid',description:'Egen anatomi.',usage:'Bevar egen markup.',composes:[],parts:{root:{selector:'.ds-custom-grid',styles:{}}},variants:{},states:{},preview:{tag:'div',part:'root',text:'Bevaret'}};
 assert.match(renderComponent(legacy,'data-grid'),/ds-custom-grid/);assert.doesNotMatch(renderComponent(legacy,'data-grid'),/role="grid"/);
});

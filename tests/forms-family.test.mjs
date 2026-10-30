import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createComponent,createComponentFactory,createComponentRenderer,renderComponent} from '../core/components.mjs';
import {generateCSS,validatePackage,materializePackage} from '../core/engine.mjs';
import {resolveThemeMode} from '../core/theme-modes.mjs';
import {PUBLIC_THEME_IDS} from '../tools/public-themes.mjs';
import {dom} from './support/dom.mjs';

const theme=id=>JSON.parse(readFileSync(new URL('../packages/'+id+'.json',import.meta.url),'utf8'));
const pack=theme('studio-light');
test('text controls use opaque semantic placeholders instead of low-contrast browser defaults',()=>{
 const css=generateCSS(resolveThemeMode(theme('nocturne'),'dark'));
 for(const selector of ['.ds-input','.ds-textarea__control','.ds-number-input__control']){
  const rule=css.split('\n\n').find(rule=>rule.includes(selector+'::placeholder'));
  assert.ok(rule,selector+' has a placeholder rule');assert.match(rule,/color: var\(--ds-color-text-muted\)/);assert.match(rule,/opacity: 1/);
 }
});
const boolean=new Set(['disabled','checked','selected','required','readonly','hidden']);
const escape=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
function htmlFromNative(node){
 if(node.tagName==='#TEXT')return escape(node.textContent);
 const tag=node.tagName.toLowerCase(),attrs=[...node.attributes].map(([name,value])=>' '+name+(boolean.has(name)?'':'="'+escape(value)+'"')).join('');
 return '<'+tag+attrs+'>'+(tag==='input'?'':node.childNodes.map(htmlFromNative).join('')+'</'+tag+'>');
}
function create(id,options){return createComponent(pack,id,options,{document:dom()});}
function descriptionsExist(element,control){
 for(const id of (control.getAttribute('aria-describedby')??'').split(/\s+/).filter(Boolean))assert.ok(element.querySelector('#'+id),id+' exists');
}

test('form families share HTML and native DOM anatomy in every theme and both color modes',()=>{
 for(const id of PUBLIC_THEME_IDS)for(const mode of ['light','dark']){
  const current=resolveThemeMode(theme(id),mode),document=dom();
  assert.deepEqual(validatePackage(current),{valid:true,errors:[]},id+'/'+mode);
  const native=createComponentFactory(current,{document}),render=createComponentRenderer(current);
  for(const role of ['textarea','number-input','field-group','field','choice-field','checkbox','radio','switch','range-field']){
   const options={idPrefix:'form-'+role,label:'Et langt navn med danske bogstaver og en længere forklaring',hint:'En hjælp til feltet.',error:'Kontrollér feltet.'};
   assert.equal(htmlFromNative(native(role,options)),render(role,options),id+'/'+mode+'/'+role);
  }
 }
});

test('textarea preserves multiline text, native constraints, readonly alias and descriptions',()=>{
 const options={idPrefix:'notes',label:'Noter',value:'Første <linje>\nAnden & linje',rows:6,cols:40,minlength:2,maxlength:300,readonly:true,required:true,hint:'Beskriv kort.',error:'Teksten skal være mere præcis.'};
 const element=create('textarea',options),control=element.querySelector('textarea');
 assert.equal(control.getAttribute('id'),'notes-control');
 assert.equal(element.querySelector('[for="notes-control"]').textContent,'Noter');
 assert.equal(control.textContent,options.value);assert.equal(control.getAttribute('value'),null);
 for(const [name,value] of Object.entries({rows:'6',cols:'40',minlength:'2',maxlength:'300',readonly:'',required:'','aria-invalid':'true'}))assert.equal(control.getAttribute(name),value,name);
 assert.equal(control.getAttribute('disabled'),null);descriptionsExist(element,control);
 assert.match(renderComponent(pack,'textarea',options),/Første &lt;linje&gt;\nAnden &amp; linje<\/textarea>/);
 assert.throws(()=>create('textarea',{slots:{control:{tag:'input'}}}),/native textarea/);
});

test('number-input retains zero, native min/max/step and an immutable numeric control type',()=>{
 const element=create('number-input',{idPrefix:'quantity',label:'Antal',value:0,min:-2,max:10,step:0.5,state:'readOnly',hint:''});
 const control=element.querySelector('input');
 for(const [name,value] of Object.entries({type:'number',value:'0',min:'-2',max:'10',step:'0.5',readonly:''}))assert.equal(control.getAttribute(name),value,name);
 assert.equal(control.getAttribute('aria-describedby'),null,'empty help is not referenced');
 assert.throws(()=>create('number-input',{type:'text'}),/type=number/);
 assert.throws(()=>create('number-input',{slots:{control:{tag:'textarea'}}}),/native input/);
});

test('optional and external descriptions remain accurate with validation-only styling',()=>{
 const element=create('field',{idPrefix:'name',hint:'',error:'',variant:'invalid',slots:{control:{tag:'input',attrs:{'aria-describedby':'external external'}}}});
 const control=element.querySelector('input');
 assert.equal(control.getAttribute('aria-describedby'),'external');
 assert.equal(control.getAttribute('aria-invalid'),'true');
 assert.equal(element.querySelector('#name-hint').getAttribute('hidden'),'');
 assert.equal(element.querySelector('#name-error').getAttribute('hidden'),'');
 assert.equal(create('textarea',{}).querySelector('textarea').getAttribute('aria-describedby'),null,'an empty default hint is not referenced');
});

test('checkbox, radio and switch name the choice separately from help and error',()=>{
 for(const role of ['checkbox','radio','switch']){
  const element=create(role,{idPrefix:role,label:'Et langt sammensat dansk valg',hint:'En forklaring.',error:'Valget kræver opmærksomhed.',checked:false,disabled:true,readonly:true});
  const control=element.querySelector('input'),label=element.querySelector('#'+role+'-label');
  assert.equal(label.textContent,'Et langt sammensat dansk valg');
  assert.equal(control.getAttribute('aria-labelledby'),role+'-label');
  assert.equal(control.getAttribute('aria-describedby'),role+'-hint '+role+'-error');
  assert.equal(control.getAttribute('disabled'),'');assert.equal(control.getAttribute('checked'),null);
  assert.equal(control.getAttribute('readonly'),null,'native choices do not pretend to support readonly');
  descriptionsExist(element,control);
 }
 const css=generateCSS(pack);
 assert.match(css,/\.ds-checkbox > \.ds-checkbox__body > \.ds-checkbox__label/,'CSS follows the actual label anatomy');
 assert.match(css,/\.ds-switch__body \{[^}]*min-width: 0;/);
});

test('native fieldset groups keep legend and descriptions linked and scope composed field IDs',()=>{
 const options={idPrefix:'contact',label:'Kontaktoplysninger',disabled:true,hint:'Gruppens hjælp.',error:'Kontrollér gruppen.',slots:{body:[{component:'field',options:{label:'E-mail',type:'email'}},{component:'textarea',options:{label:'Besked',value:'Min kladde'}}]}};
 const before=structuredClone(options),element=create('field-group',options);
 assert.equal(element.tagName,'FIELDSET');assert.equal(element.getAttribute('disabled'),'');
 assert.equal(element.querySelector('legend').textContent,'Kontaktoplysninger');
 assert.equal(element.getAttribute('aria-labelledby'),'contact-legend');
 assert.equal(element.getAttribute('aria-describedby'),'contact-hint contact-error');
 assert.equal(element.querySelector('#contact-field-1-control').getAttribute('type'),'email');
 assert.equal(element.querySelector('#contact-field-2-control').textContent,'Min kladde');
 assert.deepEqual(options,before,'rendering never mutates product options');
 assert.equal(htmlFromNative(element),renderComponent(pack,'field-group',options),'both renderers produce the same nested IDs');
 descriptionsExist(element,element);
});

test('bare controls honor product labels; explicit select values replace stale selected options',()=>{
 assert.equal(create('input',{label:'Dit navn',readOnly:true}).getAttribute('aria-label'),'Dit navn');
 const labelled=create('input',{attrs:{'aria-labelledby':'external-label'}});
 assert.equal(labelled.getAttribute('aria-label'),null,'the illustrative label cannot override product labeling');
 assert.equal(create('select',{label:'Kategori',variant:'invalid',readonly:true}).getAttribute('aria-invalid'),'true');
 const element=create('choice-field',{idPrefix:'category',disabled:true,value:'b',slots:{control:{tag:'select',children:[{tag:'option',attrs:{value:'a',selected:true},text:'A'},{tag:'option',attrs:{value:'b'},text:'B'}]}}});
 const select=element.querySelector('select');
 assert.equal(select.querySelector('[value="a"]').getAttribute('selected'),null);
 assert.equal(select.querySelector('[value="b"]').getAttribute('selected'),'');
 assert.equal(select.getAttribute('disabled'),'');
 assert.equal(select.getAttribute('readonly'),null);
});

test('range-field connects an initial output and error without changing its native slider semantics',()=>{
 const element=create('range-field',{idPrefix:'level',label:'Niveau',value:25,min:0,max:50,step:5,error:'Niveauet kræver gennemgang.',readonly:true});
 const control=element.querySelector('input'),output=element.querySelector('output');
 assert.equal(control.getAttribute('type'),'range');assert.equal(control.getAttribute('readonly'),null);
 assert.equal(output.getAttribute('for'),'level-control');assert.equal(output.textContent,'25');
 assert.equal(output.getAttribute('aria-hidden'),'true','the native slider exposes its own value');
 assert.equal(control.getAttribute('aria-invalid'),'true');descriptionsExist(element,control);
});

test('historical custom format-1 roles keep their own form anatomy and shared copies retain the form API',()=>{
 const legacy=materializePackage(pack);
 for(const id of ['textarea','number-input','field-group'])legacy.components[id]={name:'Legacy '+id,description:'Historical authored role.',usage:'Retain authored markup.',composes:[],parts:{root:{selector:'.ds-legacy-'+id,styles:{}},control:{selector:'.ds-legacy-'+id+'__control',styles:{}}},variants:{},states:{},preview:{tag:'div',part:'root',children:[{tag:'button',part:'control',text:'Legacy control'}]}};
 const document=dom(),native=createComponentFactory(legacy,{document});
 for(const id of ['textarea','number-input','field-group']){
  const element=native(id,{idPrefix:'legacy',label:'New label',error:'New validation'});
  assert.equal(element.querySelector('button').textContent,'Legacy control');
  assert.equal(element.getAttribute('aria-labelledby'),null);
  assert.equal(element.querySelector('button').getAttribute('id'),null,'new field hooks cannot rewrite custom controls');
 }
 const shared=createComponentFactory(materializePackage(pack),{document});
 assert.equal(shared('number-input',{idPrefix:'shared',value:0}).querySelector('#shared-control').getAttribute('type'),'number');
 assert.equal(shared('field-group',{idPrefix:'shared-group'}).tagName,'FIELDSET');
});

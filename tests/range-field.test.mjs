import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createComponent, renderComponent, mountRangeField} from '../core/components.mjs';
import {COMPONENT_LIBRARY} from '../core/library.mjs';
import {generateCSS, validatePackage, resolveTokens} from '../core/engine.mjs';
import {componentBoundaryReport} from '../core/quality.mjs';
import {resolveThemeMode} from '../core/theme-modes.mjs';
import {PUBLIC_THEME_IDS} from '../tools/public-themes.mjs';
import {dom,fire} from './support/dom.mjs';
import {rangeNumberCharacters} from '../core/range-field.mjs';
const theme=id=>JSON.parse(readFileSync(new URL('../packages/'+id+'.json',import.meta.url),'utf8'));
function fixture(options={},config={}){
 const document=dom(),root=createComponent(theme('studio-light'),'range-field',{variant:'with-input',idPrefix:'amount',label:'Vinkel',value:0,min:-60,max:100,step:1,hint:'Vælg en vinkel.',...options},{document});document.body.append(root);
 return {document,root,range:root.querySelector('.ds-range-field__control'),number:root.querySelector('.ds-range-field__number'),error:root.querySelector('.ds-range-field__error'),controller:mountRangeField(root,config)};
}

test('default and precise range anatomy share names and feedback in every authored appearance',()=>{
 for(const id of PUBLIC_THEME_IDS){const pack=theme(id);for(const mode of Object.keys(pack.modes??{light:{}})){
  const current=resolveThemeMode(pack,mode),document=dom();assert.deepEqual(validatePackage(current),{valid:true,errors:[]},id+'/'+mode);
  const options={idPrefix:'precision',variant:'with-input',label:'Vinkel',value:-60,min:-60,max:100,step:1,name:'angle',error:'Kontrollér vinklen.',hint:'En fælles hjælp.'};
  const root=createComponent(current,'range-field',options,{document});
  assert.equal(root.getAttribute('data-variant'),'with-input');assert.match(root.getAttribute('data-state'),/invalid/);
  assert.equal(root.querySelector('output'),null);assert.equal(root.querySelectorAll('label').length,1);
  assert.equal(root.querySelector('label').textContent,'Vinkel');
  for(const [part,type,id]of [['control','range','precision-control'],['number','number','precision-number']]){
   const input=root.querySelector('.ds-range-field__'+part);assert.equal(input.id,id);assert.equal(input.getAttribute('type'),type);
   assert.equal(input.getAttribute('min'),'-60');assert.equal(input.getAttribute('max'),'100');assert.equal(input.getAttribute('step'),'1');assert.equal(input.getAttribute('value'),'-60');
   assert.equal(input.getAttribute('aria-labelledby'),'precision-label');assert.equal(input.getAttribute('aria-invalid'),'true');
   for(const reference of input.getAttribute('aria-describedby').split(' '))assert.ok(root.querySelector('#'+reference));
  }
  assert.equal(root.querySelector('.ds-range-field__number').getAttribute('name'),null,'one logical field is submitted once');
  assert.match(renderComponent(current,'range-field',options),/type="number"/);
  const basic=createComponent(current,'range-field',{idPrefix:'basic',value:25,min:0,max:50,step:5},{document});
  assert.equal(basic.querySelector('.ds-range-field__number'),null);assert.equal(basic.querySelector('output').textContent,'25');
  const css=generateCSS(current);assert.match(css,/\.ds-range-field > \.ds-range-field__row > \.ds-range-field__number:focus-visible/);
  assert.doesNotMatch(css,/\.ds-range-field:focus-within[^\{]*\.ds-range-field__number/);
 }}
 const numberStyles=COMPONENT_LIBRARY['range-field'].parts.number.styles;
 assert.equal(numberStyles.textAlign,'center');assert.equal(numberStyles.fontVariantNumeric,'tabular-nums');
 assert.match(numberStyles.width,/var\(--ds-range-number-chars/);
 assert.equal(numberStyles.padding,'calc({space.component.paddingCompact} / 3) {space.component.paddingCompact}');
});

test('number width reserves bounds, signs and precision without following the current draft',()=>{
 for(const [min,max,step,characters]of [[0,100,1,3],[-60,100,1,3],[-.5,.5,.05,5],[.125,1,.5,5],[-1e-3,1e-3,1e-4,7],[-1,1,'any',6],[0,1e18,1,12]])assert.equal(rangeNumberCharacters({min,max,step}),characters);
 const f=fixture({min:-.5,max:.5,step:.05,value:0}),style=f.number.getAttribute('style');
 assert.equal(style,'--ds-range-number-chars:5');
 for(const value of ['.5','-.45','','99']){f.number.value=value;fire(f.number,'input');assert.equal(f.number.getAttribute('style'),style);assert.equal(f.number.value,value);}
 assert.match(renderComponent(theme('studio-light'),'range-field',{variant:'with-input',min:-10000,max:100,step:1}),/style="--ds-range-number-chars:6"/);
 assert.throws(()=>renderComponent(theme('studio-light'),'range-field',{variant:'with-input',attrs:{style:'width:100%'}}),/Unsupported component attribute: style/);
 f.controller.destroy();
});

test('native controls synchronize valid values and preserve invalid drafts, constraints and focus',()=>{
 const events=[],f=fixture({}, {onInput:event=>events.push(event)});
 f.range.focus();f.range.value='20';fire(f.range,'input');assert.equal(f.number.value,'20');assert.equal(f.document.activeElement,f.range);
 f.number.focus();f.number.value='42';fire(f.number,'input');assert.equal(f.range.value,'42');assert.equal(f.document.activeElement,f.number);
 for(const draft of ['', '-61', '101','2.5']){
  f.number.value=draft;fire(f.number,'input');assert.equal(f.number.value,draft);assert.equal(f.range.value,'42');assert.equal(events.at(-1).valid,false);assert.equal(events.at(-1).draft,draft);
  assert.equal(f.number.getAttribute('aria-invalid'),'true');assert.equal(f.range.getAttribute('aria-invalid'),'true');assert.equal(f.error.getAttribute('hidden'),null);
 }
 for(const value of ['-60','100']){f.number.value=value;fire(f.number,'input');assert.equal(f.range.value,value);assert.equal(events.at(-1).valid,true);assert.equal(f.error.getAttribute('hidden'),'');}
 assert.equal(f.root.querySelector('.ds-range-field__number'),f.number);f.controller.destroy();
});

test('commits are deduplicated, updates are silent and cross-field errors do not destroy drafts',()=>{
 const inputs=[],commits=[],f=fixture({}, {onInput:event=>inputs.push(event),onCommit:event=>commits.push(event)});
 f.range.value='10';fire(f.range,'input');f.range.value='11';fire(f.range,'input');fire(f.range,'change');fire(f.range,'blur');assert.equal(commits.length,1);assert.equal(commits[0].value,11);
 f.number.focus();f.controller.update({value:30});assert.equal(inputs.length,2);assert.equal(commits.length,1);assert.equal(f.document.activeElement,f.number);
 f.number.value='40';fire(f.number,'input');f.controller.update({draft:'40',error:'Værdien passer ikke med nabofeltet.'});fire(f.number,'change');assert.equal(commits.length,1);assert.equal(f.controller.getState().valid,false);
 f.number.value='41';fire(f.number,'input');assert.equal(f.controller.getState().valid,true);fire(f.number,'change');assert.equal(commits.length,2);
 f.controller.update({draft:'',error:''});assert.equal(f.number.value,'');assert.equal(f.range.value,'41');assert.equal(f.controller.getState().valid,false);
 f.controller.update({value:12,error:''});assert.equal(f.number.value,'12');assert.equal(f.controller.getState().valid,true);f.controller.destroy();
});

test('readonly, disabled, default output and cleanup retain native behavior without duplicate bindings',()=>{
 const events=[],f=fixture({readOnly:true},{onInput:event=>events.push(event)});
 assert.equal(f.number.getAttribute('readonly'),'');assert.equal(f.range.getAttribute('disabled'),'');assert.equal(f.number.getAttribute('disabled'),null);
 f.number.value='30';fire(f.number,'input');assert.equal(f.controller.getState().value,0);assert.equal(events.length,0);
 f.controller.update({readOnly:false,disabled:true,value:5});assert.equal(f.number.getAttribute('disabled'),'');
 f.controller.update({disabled:false});assert.equal(f.number.getAttribute('disabled'),null);assert.equal(f.range.getAttribute('disabled'),null);
 assert.throws(()=>mountRangeField(f.root),/already mounted/);f.controller.destroy();f.controller.destroy();
 f.number.value='6';fire(f.number,'input');assert.equal(events.length,0);assert.equal(f.controller.update({value:7}),false);
 const rebound=mountRangeField(f.root);rebound.destroy();
 const document=dom(),basic=createComponent(theme('studio-light'),'range-field',{idPrefix:'basic',value:25,min:0,max:50,step:5},{document}),control=basic.querySelector('input'),controller=mountRangeField(basic);
 control.value='30';fire(control,'input');assert.equal(basic.querySelector('output').textContent,'30');controller.destroy();
 assert.throws(()=>createComponent(theme('studio-light'),'range-field',{variant:'with-input',type:'text'},{document}),/type=range/);
});

test('precise field appearance schema and binding boundary checks follow the canonical role',()=>{
 const schema=JSON.parse(readFileSync(new URL('../schema/design-package.schema.json',import.meta.url),'utf8')),definition=schema.properties.appearance.properties['range-field'],role=COMPONENT_LIBRARY['range-field'];
 for(const section of ['parts','variants','states'])assert.deepEqual(Object.keys(definition.properties[section].properties).sort(),Object.keys(role[section]).sort());
 const pack=theme('studio-light');pack.appearance['range-field']={parts:{number:{styles:{border:'0'}}}};
 const result=validatePackage(pack);assert.equal(result.valid,false);assert.ok(result.errors.some(message=>message.includes('range-field.number')&&message.includes('field boundary')));
 assert.deepEqual(componentBoundaryReport({components:{'range-field':{parts:{control:{styles:{}}},variants:{},states:{}}}},resolveTokens(theme('studio-light'))),[],'historical range roles without a numeric part retain native paint without a fabricated boundary failure');
});

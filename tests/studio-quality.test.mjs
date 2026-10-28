import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createQualityStudio} from '../studio/quality.mjs';
import {dom,fire} from './support/dom.mjs';
const theme=()=>JSON.parse(readFileSync(new URL('../packages/studio-light.json',import.meta.url),'utf8'));
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const tick=()=>new Promise(resolve=>setTimeout(resolve,0));

test('quality view separates current static results, unknown CSS and unrun patterns',()=>{
 const state={pack:theme(),view:'quality'},document=dom();let runs=0;
 const studio=createQualityStudio(state,{escape,document,validation:()=>({valid:true}),render(){},notice(){},runPatterns(){runs++;}});
 const content=studio.content();assert.match(content,/Beregnet kontrolgeometri/);assert.match(content,/Ikke kørt for denne kladde/);assert.equal(runs,0);
 state.pack.appearance={button:{variants:{desktop:{styles:{fontSize:'1vw'}}}}};studio.invalidate();
 assert.match(studio.content(),/kan ikke måles/,'unsupported geometry is not presented as passed');
 const invalid=createQualityStudio(state,{escape,document,validation:()=>({valid:false,errors:['Ugyldig <værdi>']}),render(){},notice(){}});
 assert.match(invalid.content(),/Ugyldig &lt;værdi&gt;/);assert.doesNotMatch(invalid.content(),/quality-overview/);
});

test('pattern checks run explicitly on a snapshot and discard async results after an edit',async()=>{
 const state={pack:theme(),view:'quality'},document=dom();
 const button=document.createElement('button');button.id='run-pattern-quality';button.setAttribute('id',button.id);
 const progress=document.createElement('p');progress.setAttribute('id','pattern-quality-progress');document.body.append(button,progress);
 document.querySelector=selector=>document.body.querySelector(selector);
 let finish,runs=0,renders=0,snapshot;
 const studio=createQualityStudio(state,{escape,document,validation:()=>({valid:true}),render(){renders++;},notice(){},runPatterns:async value=>{
  runs++;snapshot=value;return new Promise(resolve=>{finish=resolve;});
 }});
 studio.content();studio.bind();fire(button,'click');fire(button,'click');
 assert.equal(runs,1,'a second click cannot start a concurrent check');assert.notEqual(snapshot,state.pack);
 const original=snapshot.tokens['space.component.gap'].$value;
 state.pack.tokens['space.component.gap'].$value='7px';studio.invalidate();
 assert.equal(snapshot.tokens['space.component.gap'].$value,original,'the running sample keeps its original theme');
 finish({checks:[{status:'warning',label:'Forældet resultat'}],limitations:[]});await tick();
 assert.equal(renders,0);assert.doesNotMatch(studio.content(),/Forældet resultat/);
 fire(button,'click');finish({checks:[{status:'pass',label:'Aktuel prøve'}],limitations:['Ingen pixelkontrol.']});await tick();
 assert.equal(renders,1);assert.match(studio.content(),/Resultatet gælder den aktuelle kladde/);assert.match(studio.content(),/Ingen pixelkontrol/);assert.match(studio.content(),/Aktuel prøve/,'successful pattern checks keep their own labels and are not described as colour pairs');
});

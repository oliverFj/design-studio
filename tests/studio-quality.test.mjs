import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createQualityStudio} from '../studio/quality.mjs';
import {resolveThemeMode} from '../core/theme-modes.mjs';
import {resolveTokens} from '../core/engine.mjs';
import {controlBoundaryReport} from '../core/quality.mjs';
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

test('quality reports and explicit pattern checks use the selected mode while validation retains the source',async()=>{
 const state={pack:theme(),view:'quality'},document=dom();let mode='dark',snapshot,valid=true;
 const button=document.createElement('button');button.setAttribute('id','run-pattern-quality');document.body.append(button);
 document.querySelector=selector=>document.body.querySelector(selector);
 const studio=createQualityStudio(state,{escape,document,getTheme:()=>resolveThemeMode(state.pack,mode),validation:()=>({valid,errors:['En anden modus er ugyldig.']}),render(){},notice(){},runPatterns:async value=>{snapshot=value;return {checks:[{status:'pass',label:'Mørk prøve'}],limitations:[]};}});
 const dark=resolveThemeMode(state.pack,'dark'),ratio=controlBoundaryReport(resolveTokens(dark))[0].ratio.toFixed(2);
 assert.match(studio.content(),new RegExp(ratio.replace('.','\\.')+':1 · minimum 3:1'),'static contrast rows describe the active dark mode');
 studio.bind();fire(button,'click');await tick();
 assert.deepEqual(snapshot,dark);assert.equal(snapshot.modes,undefined);
 assert.match(studio.content(),/Mørk prøve/);
 mode='light';studio.invalidate();assert.doesNotMatch(studio.content(),/Mørk prøve/,'changing mode invalidates its pattern results');
 valid=false;assert.match(studio.content(),/En anden modus er ugyldig/,'validation may reject the full source even if the selected snapshot is valid');
});

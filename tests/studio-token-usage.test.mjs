import test from 'node:test';
import assert from 'node:assert/strict';
import {usageLabel,usageDetails} from '../studio/token-usage.mjs';

const usage={component:'button',part:'root',variant:null,state:null,property:'padding'};
const entry=overrides=>({id:'space.control',status:'reference',compatibility:false,direct:[],indirect:[],aliases:[],dependencies:[],...overrides});

test('usage labels distinguish references and compatibility without hiding active usage',()=>{
  assert.equal(usageLabel(entry()),'Reference');
  assert.equal(usageLabel(entry({status:'compatibility',compatibility:true})),'Kompatibilitet');
  assert.equal(usageLabel(entry({status:'active'})),'I brug');
  const activeCompatibility=entry({status:'compatibility',compatibility:true,indirect:[{...usage,via:['space.alias']}]});
  assert.equal(usageLabel(activeCompatibility),'I brug');
  assert.match(usageDetails(activeCompatibility),/Kompatibilitetsværdi, som stadig påvirker/);
  assert.match(usageDetails(entry()),/kan stadig bruges i produktets egen kode/);
  assert.match(usageDetails(entry({status:'compatibility'})),/ældre produktkode/);
});

test('recipe details show component navigation, locations and clickable alias dependencies',()=>{
  const report=entry({status:'active',direct:[{...usage,variant:'compact',state:'focus'}],
    indirect:[{...usage,component:'card',part:'body',via:['space.semantic','space.alias']}],dependencies:['space.base'],aliases:['space.other']});
  const html=usageDetails(report,{button:{name:'Knap'},card:{name:'Kort'}});
  assert.match(html,/data-component="button">Knap/);
  assert.match(html,/data-component="card">Kort/);
  assert.match(html,/variant <code>compact<\/code>/);
  assert.match(html,/tilstand <code>focus<\/code>/);
  assert.match(html,/<code>padding<\/code>/);
  for(const id of ['space.semantic','space.alias','space.base','space.other'])assert.ok(html.includes('data-token="'+id+'"'));
  assert.match(html,/Henvises til af/);assert.match(html,/Afhænger af/);
  assert.deepEqual(report.indirect[0].via,['space.semantic','space.alias'],'rendering does not change the alias path');
});

test('many recipe uses are collapsed and grouped by component',()=>{
  const html=usageDetails(entry({status:'active',direct:Array.from({length:5},(_,i)=>({...usage,property:'property'+i}))}),{button:{name:'Knap'}});
  assert.match(html,/<details class="code-details"><summary>Direkte brug \(5\)/);
  assert.equal([...html.matchAll(/data-component="button"/g)].length,1);
  assert.equal([...html.matchAll(/<li>/g)].length,5);
  assert.match(usageDetails(entry({direct:[usage]})),/<details class="code-details" open>/);
});

test('all dynamic text and attributes are escaped, including alias chains and unknown component names',()=>{
  const payload='bad" onclick="go()"><svg onload="go()">';
  const report=entry({id:payload,status:'active',direct:[{component:payload,part:payload,variant:payload,state:payload,property:payload}],
    indirect:[{...usage,via:[payload]}],dependencies:[payload],aliases:[payload]});
  const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const html=usageDetails(report,{[payload]:{name:'<img src=x onerror="go()">'}},escape);
  assert.doesNotMatch(html,/<svg|<img|\sonclick="|\sonload="|\sonerror="/);
  assert.ok(html.includes('&lt;svg'));
  assert.ok(html.includes('&lt;img'));
  assert.match(html,/data-component="bad&quot;/);
  assert.match(html,/data-token="bad&quot;/);
  assert.match(usageDetails(undefined),/Ingen anvendelsesdata/);
});

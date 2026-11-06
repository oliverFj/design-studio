import test from 'node:test';
import assert from 'node:assert/strict';
import {tokenUsageReport} from '../core/token-usage.mjs';

const token=$value=>({$type:'dimension',$value});

test('illustration roles and their palette aliases are active without inventing component roles',()=>{
  const model={tokens:{'color.illustration.subject':{$type:'color',$value:'{palette.pigment}'},'palette.pigment':{$type:'color',$value:'#3157cf'}},components:{}};
  const report=tokenUsageReport(model);
  assert.equal(report['color.illustration.subject'].status,'active');
  assert.equal(report['color.illustration.subject'].direct[0].domain,'graphics');
  assert.equal(report['palette.pigment'].status,'active');
  assert.deepEqual(report['palette.pigment'].indirect[0].via,['color.illustration.subject']);
});

test('token usage records exact recipe locations without counting prose or previews',()=>{
  const model={tokens:{'space.gap':token('6px'),'space.unused':token('10px')},components:{card:{
    description:'Use {space.unused} for a product-specific layout.',
    parts:{root:{styles:{gap:'{space.gap}'}}},
    variants:{compact:{styles:{padding:'{space.gap}'},parts:{header:{styles:{margin:'0 {space.gap}'}}}}},
    states:{focus:{styles:{outlineOffset:'{space.gap}'},parts:{body:{styles:{padding:'{space.gap}'}}}}},
    preview:{tag:'p',text:'{space.unused}'},
  }},brand:{sections:[{tokens:['space.unused']}]}};
  const report=tokenUsageReport(model);
  assert.equal(report['space.gap'].status,'active');
  assert.deepEqual(report['space.gap'].direct,[
    {component:'card',part:'root',variant:null,state:null,property:'gap'},
    {component:'card',part:'root',variant:'compact',state:null,property:'padding'},
    {component:'card',part:'header',variant:'compact',state:null,property:'margin'},
    {component:'card',part:'root',variant:null,state:'focus',property:'outlineOffset'},
    {component:'card',part:'body',variant:null,state:'focus',property:'padding'},
  ]);
  assert.equal(report['space.unused'].status,'reference');
  assert.deepEqual(report['space.unused'].direct,[]);
});

test('alias chains keep upstream palette and scale tokens active with a readable path',()=>{
  const model={tokens:{'space.base':token('6px'),'space.inner':token('{space.base}'),'space.control':token('{space.inner}'),'space.example':token('{space.base}')},
    components:{button:{parts:{root:{styles:{padding:'{space.control} {space.control}'}}}}}};
  const report=tokenUsageReport(model);
  assert.equal(report['space.control'].direct.length,1,'repeated references in one declaration count once');
  assert.equal(report['space.inner'].status,'active');
  assert.equal(report['space.base'].status,'active');
  assert.deepEqual(report['space.base'].indirect,[{component:'button',part:'root',variant:null,state:null,property:'padding',via:['space.control','space.inner']}]);
  assert.deepEqual(report['space.base'].aliases,['space.inner','space.example']);
  assert.equal(report['space.example'].status,'reference','an unused alias does not become active merely because its target is active');
});

test('compatibility is explicit and cannot hide active component use',()=>{
  const model={tokens:{'size.legacy':token('2px'),'size.old':token('3px'),'size.reference':token('4px')},components:{switch:{parts:{thumb:{styles:{left:'{size.old}'}}}}}};
  const report=tokenUsageReport(model,{compatibilityTokens:new Set(['size.legacy','size.old'])});
  assert.equal(report['size.legacy'].status,'compatibility');
  assert.equal(report['size.old'].status,'active');
  assert.equal(report['size.old'].compatibility,true);
  assert.equal(report['size.reference'].status,'reference');
});

test('cycles and missing dependencies terminate without mutating an invalid draft',()=>{
  const model={tokens:{'space.a':token('{space.b}'),'space.b':token('{space.a}'),'space.missing':token('{space.absent}'),'space.orphan':token('1px')},
    components:{card:{parts:{root:{styles:{padding:'{space.a}',gap:'{space.absent}'}}}}}};
  const original=structuredClone(model),report=tokenUsageReport(model);
  assert.equal(report['space.a'].status,'active');
  assert.equal(report['space.b'].status,'active');
  assert.deepEqual(report['space.b'].indirect[0].via,['space.a']);
  assert.deepEqual(report['space.a'].indirect,[],'a cycle does not manufacture indirect self-usage');
  assert.deepEqual(report['space.missing'].dependencies,['space.absent']);
  assert.equal(Object.hasOwn(report,'space.absent'),false);
  assert.deepEqual(model,original);
  assert.deepEqual(tokenUsageReport({}),{});
});

test('branching aliases retain the shortest path for each recipe',()=>{
  const model={tokens:{a:token('{b} {c}'),b:token('{d}'),c:token('{e}'),d:token('{e}'),e:token('1px')},components:{card:{parts:{root:{styles:{padding:'{a}'}}}}}};
  const report=tokenUsageReport(model);
  assert.equal(report.e.indirect.length,1);
  assert.deepEqual(report.e.indirect[0].via,['a','c']);
});

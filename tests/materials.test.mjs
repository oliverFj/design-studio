import test from 'node:test';
import assert from 'node:assert/strict';
import {generateCSS,validatePackage,resolveTokens,materializePackage} from '../core/engine.mjs';
import {MATERIAL_TREATMENTS,generateMaterialCSS} from '../core/materials.mjs';
import {renderComponent} from '../core/components.mjs';
import {renderMotionView} from '../studio/motion.mjs';
import {createCatalogState} from '../studio/component-catalog.mjs';
import {tokenUsageReport} from '../core/token-usage.mjs';
import {usageDetails} from '../studio/token-usage.mjs';
import {readFileSync} from 'node:fs';
const theme={schemaVersion:2,id:'material-test',name:'Material test',description:'Shared visual treatments.',tokens:{},history:[]};

test('materials use existing components, isolate transparency to decoration and retain fallback paints',()=>{
  const css=generateMaterialCSS('.test');
  assert.equal(MATERIAL_TREATMENTS.length,5);
  assert.match(css,/\.test \.ds-card\[data-material="rim"\]/);
  assert.match(css,/padding-box, var\(--ds-gradient-rim\) border-box/);
  assert.match(css,/data-material="frost"\]\[aria-hidden="true"\]/);
  assert.match(css,/@supports \(\(backdrop-filter:/);
  assert.match(css,/prefers-reduced-transparency: reduce/);
  assert.match(css,/forced-colors: active/);
  assert.match(css,/-webkit-text-fill-color: CanvasText !important/);
  assert.doesNotMatch(css,/animation:|requestAnimationFrame|forced-color-adjust/);
  assert.throws(()=>generateMaterialCSS('body, *'),/scope/);
  const html=renderComponent(theme,'card',{attrs:{'data-material':'rim'},slots:{body:'Native indhold'}});
  assert.match(html,/data-material="rim"/);
  assert.match(html,/Native indhold/);
  assert.match(generateCSS(theme),/data-material="frost"/);
});

test('gradient ink validates its entire range on every supported reading background',()=>{
  const invalid=structuredClone(theme);
  invalid.tokens['gradient.ink']={$type:'gradient',$value:'linear-gradient(90deg, #ffffff 0%, #333333 100%)',description:'Unreadable midpoint.'};
  const result=validatePackage(invalid);
  assert.equal(result.valid,false);
  assert.ok(result.errors.some(error=>error.includes('tokens.gradient.ink on color.background.surface')));
  const tokens=resolveTokens(theme);
  assert.ok(tokens['gradient.ink']);
  const usage=tokenUsageReport(materializePackage(theme));
  assert.equal(usage['gradient.rim'].status,'active');
  assert.equal(usage['material.frost.blur'].direct[0].domain,'materials');
  assert.equal(usage['material.frost.opacity'].direct[0].domain,'materials');
  const detail=usageDetails(usage['gradient.rim']);
  assert.match(detail,/Materialer og effekter/);
  assert.doesNotMatch(detail,/data-component="@materials"/);
});

test('the material workshop exposes all four effects without putting content on transparent layers',()=>{
  const html=renderMotionView(theme,createCatalogState());
  for(const id of ['atmosphere','frost'])assert.match(html,new RegExp('data-material="'+id+'"'));
  for(const id of ['rimmed','gradient'])assert.match(html,new RegExp('data-variant="'+id+'"'));
  assert.match(html,/Materialeværktøjskassen/);
  assert.match(html,/data-material="frost" aria-hidden="true"/);
  assert.match(html,/data-material="atmosphere" aria-hidden="true"/);
});

test('frosted cards keep reading islands opaque and expose bounded thematic frost strength',()=>{
  const css=generateMaterialCSS('.test');
  for(const part of ['header','body','footer']){
    assert.match(css,new RegExp('\\.test \\.ds-card\\[data-variant="frosted"\\] > \\.ds-card__'+part));
  }
  assert.match(css,/background: var\(--ds-color-background-surface\) !important/);
  assert.match(css,/calc\(var\(--ds-material-frost-opacity\) \* 100%\)/);
  assert.match(css,/background: Canvas !important; color: CanvasText !important/);
  assert.match(css,/prefers-reduced-transparency: reduce[\s\S]*background: var\(--ds-color-background-surface\) !important; backdrop-filter: none !important/,'the preference overrides the more specific transparency selector');
  const html=renderComponent(theme,'card',{variant:'frosted',slots:{header:'En lysende ramme',body:'En opak læseø',footer:'Handlinger'}});
  for(const part of ['header','body','footer'])assert.match(html,new RegExp('class="ds-card__'+part+'"'));
  assert.match(css,/data-variant="frosted"\]:has\(> \.ds-card__body\)/,'text-only cards keep the solid fallback');
  assert.doesNotMatch(renderComponent(theme,'card',{variant:'frosted',text:'Text-only card'}),/ds-card__body/);
  for(const value of [0,.22,1]){
    const pack=structuredClone(theme);pack.tokens['material.frost.opacity']={$type:'number',$value:value,description:'Frost strength.'};
    assert.equal(validatePackage(pack).valid,true,String(value));
  }
  for(const value of [-.1,1.1]){
    const pack=structuredClone(theme);pack.tokens['material.frost.opacity']={$type:'number',$value:value,description:'Invalid frost strength.'};
    assert.match(validatePackage(pack).errors.join('\n'),/material.frost.opacity.*0 to 1/);
  }
  const aliases=structuredClone(theme);
  aliases.tokens['material.frost.opacity']={$type:'number',$value:'{test.frost}',description:'Aliased frost strength.'};
  aliases.tokens['test.frost']={$type:'number',$value:1.2,description:'Invalid alias value.'};
  assert.match(validatePackage(aliases).errors.join('\n'),/material.frost.opacity.*0 to 1/);
});

test('material variants stay available to both the runtime and the appearance schema',()=>{
  const schema=JSON.parse(readFileSync(new URL('../schema/design-package.schema.json',import.meta.url),'utf8'));
  const appearances=schema.properties.appearance.properties;
  for(const id of ['material','rimmed','frosted','embossed','asymmetric'])assert.ok(appearances.card.properties.variants.properties[id],id);
  assert.ok(appearances.heading.properties.variants.properties.gradient);
  const pack=structuredClone(theme);pack.appearance={card:{variants:{frosted:{styles:{borderColor:'{color.border.default}'}}}}};
  assert.deepEqual(validatePackage(pack),{valid:true,errors:[]});
});

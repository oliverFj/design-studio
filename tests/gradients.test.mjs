import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validatePackage,resolveTokens,generateCSS} from '../core/engine.mjs';
import {parseGradient,gradientContrastRatio,contrastRatio} from '../core/quality.mjs';
import {resolveThemeMode} from '../core/theme-modes.mjs';
const load=id=>JSON.parse(readFileSync(new URL('../packages/'+id+'.json',import.meta.url),'utf8'));
const gradient=value=>({$type:'gradient',$value:value,description:'Gradient for a representative surface.'});

test('gradient tokens resolve color stops and whole-token aliases into portable CSS',()=>{
 const pack=load('studio-light');
 pack.tokens['gradient.test']=gradient('linear-gradient(135deg, {palette.brand.50} 0%, rgb(255, 255, 255) 100%)');
 pack.tokens['gradient.alias']=gradient('{gradient.test}');
 assert.equal(validatePackage(pack).valid,true);
 const resolved=resolveTokens(pack);
 assert.equal(resolved['gradient.test'],resolved['gradient.alias']);
 assert.match(resolved['gradient.test'],/linear-gradient\(135deg in srgb, #[a-f0-9]+ 0%, rgb\(255, 255, 255\) 100%\)/);
 assert.match(generateCSS(pack),/--ds-gradient-alias: linear-gradient/);
});

test('unsupported gradients, resource injection, missing references, wrong types and cycles are rejected',()=>{
 for(const value of ['linear-gradient(90deg, #fff 0%)','linear-gradient(90deg, #fff 60%, #000 20%)','linear-gradient(90deg, #fff 10%, #000 100%)','linear-gradient(90deg, transparent 0%, #fff 100%)','linear-gradient(90deg, #fff 0%, url(https://example.com) 100%)','linear-gradient(90deg, {missing.color} 0%, #fff 100%)','linear-gradient(90deg, {typography.size.body} 0%, #fff 100%)','{gradient.cycle}','linear-gradient(90deg, #fff 0%, #000 100%); color: red']){
  const pack=load('studio-light');pack.tokens['gradient.cycle']=gradient(value);
  assert.equal(validatePackage(pack).valid,false,value);
 }
 assert.ok(parseGradient('radial-gradient(circle at 50% 50%, #ffffff 0%, #e3e0f7 100%)'));
 assert.equal(parseGradient('radial-gradient(circle, #fff 100%, #000 0%)'),null);
 assert.equal(parseGradient('linear-gradient(90deg, oklch(.6 .1 20) 0%, #fff 100%)'),null,'unbounded color-space conversions are outside the gradient token format');
 assert.ok(parseGradient('linear-gradient(90deg in srgb, rgb(90 45 140) 0%, #fff 100%)'));
});

test('contrast covers intermediate colors and cannot be bypassed with a gradient shorthand',()=>{
 assert.ok(contrastRatio('#757575','#000000')>=4.5);
 assert.ok(contrastRatio('#757575','#ffffff')>=4.5);
 assert.equal(gradientContrastRatio('#757575','linear-gradient(90deg, #000 0%, #fff 100%)'),1);
 const pack=load('studio-light');pack.tokens['gradient.test']=gradient('linear-gradient(90deg, #000 0%, #fff 100%)');
 pack.appearance={card:{variants:{default:{styles:{background:'{gradient.test}'}}}}};
 assert.ok(validatePackage(pack).errors.some(error=>error.includes('components.card')&&error.includes('contrast')));
 pack.appearance={button:{variants:{link:{styles:{background:'{gradient.test}'}}}}};
 assert.ok(validatePackage(pack).errors.some(error=>error.includes('components.button')&&error.includes('contrast')),'a transparent base cannot hide gradient text contrast');
 pack.appearance={input:{parts:{root:{styles:{background:'{gradient.test}'}}}}};
 assert.ok(validatePackage(pack).errors.some(error=>error.includes('field boundary')));
});

test('next-generation selections stay visible against content surfaces in both modes',()=>{
 for(const id of ['kyst','vaerk','prisme'])for(const mode of ['light','dark']){
  const pack=resolveThemeMode(load(id),mode),resolved=resolveTokens(pack);
  const selected=resolved['color.action.selected.rest.surface'];
  for(const surface of ['color.background.canvas','color.background.surface']){
   assert.ok(contrastRatio(selected,resolved[surface])>=3,id+' '+mode+' '+surface);
   assert.ok(contrastRatio(resolved['color.action.primary.rest.surface'],resolved[surface])>=4.5,id+' '+mode+' freestanding accent on '+surface);
  }
  assert.ok(contrastRatio(resolved['color.action.selected.rest.text'],selected)>=4.5,id+' '+mode);
 }
});

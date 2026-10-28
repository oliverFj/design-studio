import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {getComponents,resolveTokens,generateCSS} from '../core/engine.mjs';
import {renderComponent,createComponent} from '../core/components.mjs';
import {contrastRatio} from '../core/quality.mjs';
import {PUBLIC_THEME_IDS} from '../tools/public-themes.mjs';
import {dom} from './support/dom.mjs';
const themes=PUBLIC_THEME_IDS.map(id=>JSON.parse(readFileSync(new URL('../packages/'+id+'.json',import.meta.url),'utf8')));

test('compact composite controls preserve density, labels and errors independently in every theme',()=>{
 for(const theme of themes){
  const css=generateCSS(theme),document=dom();
  for(const id of ['field','choice-field'])for(const error of ['', 'Vælg en gyldig værdi.']){
   const options={idPrefix:theme.id+'-'+id,label:'Navn',hint:'Hjælp',error,controlVariant:'desktop'};
   const element=createComponent(theme,id,options,{document}),native=element.querySelector(id==='field'?'input':'select');
   assert.equal(native.getAttribute('data-variant'),'desktop');
   assert.equal(element.getAttribute('data-variant'),error?'invalid':'default');
   assert.equal(element.querySelector('label').getAttribute('for'),native.id);
   assert.equal(native.getAttribute('aria-invalid'),error?'true':null);
   assert.match(native.getAttribute('aria-describedby'),new RegExp(options.idPrefix+'-hint'));
   if(error)assert.match(native.getAttribute('aria-describedby'),new RegExp(options.idPrefix+'-error'));
   const root=id==='field'?'.ds-field':'.ds-choice-field',control=id==='field'?'.ds-input':'.ds-choice-field__control';
   const selector='.ds-scope '+root+' > '+control+'[data-variant="desktop"]';
   const start=css.indexOf(selector);assert.ok(start>=0,'composite-specific density rule outranks its normal 44px control');
   const rule=css.slice(start,css.indexOf('}',start));assert.match(rule,/min-height: 32px/);assert.match(rule,/height: max\(32px/);
   assert.match(renderComponent(theme,id,options),/data-variant="desktop"/);
  }
  const select=createComponent(theme,'field',{controlVariant:'desktop',slots:{control:{tag:'select',children:[{tag:'option',text:'A'}]}}},{document});
  assert.equal(select.querySelector('select').getAttribute('data-variant'),'desktop','field with a native select slot also receives density');
 }
 assert.throws(()=>renderComponent(themes[0],'field',{controlVariant:'unknown'}),/Unsupported control variant/);
});

test('composed card headings keep the same valid anatomy in native and serialized rendering',()=>{
 const theme=themes[0],document=dom();
 for(const header of [{component:'heading',options:{text:'Detaljer',variant:'panel'}},[{component:'heading',options:{text:'Detaljer',variant:'panel'}}]]){
  const options={slots:{header}},node=createComponent(theme,'card',options,{document});
  const wrapper=node.querySelector('.ds-card__header');assert.equal(wrapper.tagName,'DIV');assert.equal(wrapper.children[0].tagName,'H2');
  assert.match(renderComponent(theme,'card',options),/<div class="ds-card__header"><h2/);
 }
 const plain=createComponent(theme,'card',{slots:{header:'Detaljer'}},{document});
 assert.equal(plain.querySelector('.ds-card__header').tagName,'H3','plain text keeps a native heading');
});

test('lean themes retain readable captions, separate decorative and interactive borders, and stack spacing ownership',()=>{
 for(const theme of themes){
  const r=resolveTokens(theme),c=getComponents(theme),pixels=v=>parseFloat(v)*(/rem$/.test(v)?16:1);
  assert.ok(pixels(r['typography.size.captionText'])<=16,theme.id+': supplementary caption stays subordinate');
  if(!theme.appearance?.caption?.parts?.text?.styles?.fontFamily){
   assert.equal(c.caption.parts.text.styles.fontFamily,'{typography.font.body}',theme.id);
   assert.equal(c.caption.parts.text.styles.fontWeight,'{typography.weight.body}',theme.id);
  }
  for(const bg of ['color.background.control','color.background.surface'])assert.ok(contrastRatio(r['color.border.field'],r[bg])>=3,theme.id+': identify fields on '+bg);
  assert.notEqual(r['color.border.field'],r['color.border.default'],'interactive and decorative boundaries have separate roles');
  assert.equal(c.divider.parts.root.styles.margin,'0','stack owns the separation around an ordinary divider');
  assert.ok(c.divider.variants.standalone.styles.margin,'standalone use can request spacing explicitly');
 }
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {generateCSS,resolveTokens,getComponents,validatePackage} from '../core/engine.mjs';
import {resolveThemeMode} from '../core/theme-modes.mjs';
import {renderMotionView,bindMotionStudy} from '../studio/motion.mjs';
import {dom,fire} from './support/dom.mjs';
import {createCatalogState} from '../studio/component-catalog.mjs';
import {gradientContrastRatio} from '../core/quality.mjs';

test('experimental themes ship shared variants and readable materials in every authored appearance',()=>{
 for(const id of ['riso','terminal','porcelaen','bauhaus']){
  const source=JSON.parse(readFileSync(new URL('../packages/'+id+'.json',import.meta.url),'utf8'));
  assert.equal(validatePackage(source).valid,true,id);
  for(const mode of Object.keys(source.modes)){
   const theme=resolveThemeMode(source,mode),tokens=resolveTokens(theme);
   const card=getComponents(theme).card;
   for(const variant of ['material','embossed','asymmetric'])assert.ok(card.variants[variant]);
   assert.ok(gradientContrastRatio(tokens['color.text.secondary'],tokens['gradient.material'])>=4.5,id+' '+mode);
   const css=generateCSS(theme);
   assert.match(css,/data-variant="material"/);
   assert.match(css,/forced-colors: active/);
   const state=createCatalogState();state.materialName='Bevaret kladde';
   const html=renderMotionView(theme,state);
   assert.match(html,/Bevaret kladde/);
   assert.match(html,/data-theme-motion/);
   assert.match(html,/data-variant="asymmetric"/);
  }
 }
});

test('material study preserves its draft and cancels repeated motion and cleanup',()=>{
 const document=dom(),root=document.createElement('section'),target=document.createElement('article');
 const button=document.createElement('button'),field=document.createElement('div'),input=document.createElement('input'),status=document.createElement('p');
 target.setAttribute('data-motion-study','');button.setAttribute('data-theme-motion','');field.setAttribute('data-material-name','');status.setAttribute('data-theme-motion-status','');
 field.append(input);root.append(target,button,field,status);
 let cancelled=0;target.animate=()=>({cancel(){cancelled++;}});
 const state={},controls=bindMotionStudy(root,state);
 input.value='Min bevarede kladde';fire(input,'input');
 assert.equal(state.materialName,input.value);
 fire(button,'click');fire(button,'click');assert.equal(cancelled,1);
 assert.equal(status.textContent,'Temaets bevægelse afprøves.');
 controls.destroy();assert.equal(cancelled,2);
});

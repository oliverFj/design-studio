import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {COMPONENT_LIBRARY,BUTTON_COMPATIBILITY_VARIANTS,BUTTON_SIZES} from '../core/library.mjs';
import {getComponents,generateCSS} from '../core/engine.mjs';
import {resolveThemeMode} from '../core/theme-modes.mjs';
import {createComponent,createComponentFactory,createComponentRenderer,renderComponent} from '../core/components.mjs';
import {renderComponentCatalog,createCatalogState,catalogVariants} from '../studio/component-catalog.mjs';
import {PUBLIC_THEME_IDS} from '../tools/public-themes.mjs';
import {dom} from './support/dom.mjs';
const themes=PUBLIC_THEME_IDS.map(id=>{
 const source=JSON.parse(readFileSync(new URL('../packages/'+id+'.json',import.meta.url),'utf8'));
 return resolveThemeMode(source,source.defaultMode??'light');
});

test('four public button levels coexist with historical recipes in every theme',()=>{
 assert.deepEqual(Object.keys(COMPONENT_LIBRARY.button.variants),['primary','secondary','tertiary','ghost']);
 assert.deepEqual(Object.keys(BUTTON_SIZES),['small','medium','large']);
 for(const theme of themes){
  const components=getComponents(theme),render=createComponentRenderer(theme);
  assert.deepEqual(catalogVariants(theme,'button',components.button),['primary','secondary','tertiary','ghost']);
  for(const variant of Object.keys(BUTTON_COMPATIBILITY_VARIANTS))assert.match(render('button',{variant,text:'Bevar handling'}),new RegExp('data-variant="'+variant+'"'));
  for(const variant of Object.keys(COMPONENT_LIBRARY.button.variants))for(const size of Object.keys(BUTTON_SIZES)){
   const html=render('button',{variant,size,text:'Gem ændringer'});
   assert.match(html,new RegExp('data-size="'+size+'"'));assert.match(html,new RegExp('data-variant="'+variant+'"'));
  }
  const css=generateCSS(theme);assert.match(css,/\.ds-button\[data-size="small"\]/);assert.match(css,/\.ds-button\[data-intent="danger"\]/);assert.match(css,/prefers-reduced-motion/);
 }
});

test('navigation keeps native links while disabled and loading states cannot navigate',()=>{
 for(const theme of themes){
  const document=dom(),create=createComponentFactory(theme,{document});
  for(const unavailable of [{disabled:true},{loading:true},{state:'disabled'},{state:'loading'}]){
   const anchor=create('button',{href:'#samling',text:'Åbn',...unavailable});
   assert.equal(anchor.tagName,'A');assert.equal(anchor.getAttribute('href'),null);assert.equal(anchor.getAttribute('aria-disabled'),'true');assert.equal(anchor.getAttribute('tabindex'),'-1');assert.equal(anchor.getAttribute('type'),null);
  }
  const anchor=create('button',{href:'#samling',text:'Udforsk',variant:'primary',size:'large',icon:'→'});
  assert.equal(anchor.tagName,'A');assert.equal(anchor.getAttribute('href'),'#samling');assert.equal(anchor.getAttribute('type'),null);assert.equal(anchor.querySelector('.ds-button__heading').textContent,'Udforsk');
  const busy=create('button',{text:'Gem ændringer',loading:true});
  assert.equal(busy.getAttribute('aria-busy'),'true');assert.equal(busy.getAttribute('disabled'),'');assert.equal(busy.querySelector('.ds-button__heading').textContent,'Gem ændringer');assert.equal(busy.querySelector('.ds-button__progress').getAttribute('hidden'),null);
  const icon=create('button',{icon:'×',iconOnly:true,label:'Luk panel',size:'small',variant:'ghost'});
  assert.equal(icon.getAttribute('aria-label'),'Luk panel');assert.equal(icon.getAttribute('data-icon-only'),'true');assert.equal(icon.querySelector('.ds-button__heading').getAttribute('hidden'),'');
 }
 assert.throws(()=>renderComponent(themes[0],'button',{href:'javascript:alert(1)'}),/Unsupported component URL/);
 assert.throws(()=>createComponent(themes[0],'button',{iconOnly:true,icon:'×'},{document:dom()}),/accessible name/);
 assert.throws(()=>renderComponent(themes[0],'button',{variant:'secondary',intent:'danger'}),/Danger requires/);
 assert.throws(()=>renderComponent(themes[0],'button',{size:'tiny'}),/Unknown button size/);
});

test('expanded catalog renders real component variants and state samples with unique associations',()=>{
 for(const theme of themes){
  const components=getComponents(theme),state=createCatalogState();
  for(const id of Object.keys(components))for(const view of ['variants','states']){
   state.expanded=id;state.views[id]=view;
   const html=renderComponentCatalog(theme,{components,state,selected:id});
   const ids=[...html.matchAll(/\sid="([^"]+)"/g)].map(m=>m[1]);
   assert.equal(new Set(ids).size,ids.length,theme.id+'/'+id+'/'+view);
   for(const [,target]of html.matchAll(/\b(?:for|aria-labelledby|aria-controls)="([^"]+)"/g))for(const ref of target.split(' '))assert.ok(ids.includes(ref),id+': '+ref);
   assert.equal((html.match(/class="specimen selected expanded"/g)||[]).length,1);
   assert.equal((html.match(/class="specimen-preview ds-scope"/g)||[]).length,Object.keys(components).length,'opening a panel retains every compact card');
   const articles=[...html.matchAll(/<article class="specimen[\s\S]*?<\/article>/g)].map(match=>match[0]);
   assert.ok(articles.every(article=>!article.includes('data-catalog-details=')),'details are a separate grid item rather than widening a card');
   assert.equal((html.match(/data-catalog-details=/g)||[]).length,1);
   if(id==='button')assert.doesNotMatch(html,/<h3>(?:desktop|rounded|dismiss|compact)<\/h3>/);
  }
  state.expanded='button';state.views.button='states';state.buttonIntent='danger';
  assert.match(renderComponentCatalog(theme,{components,state,selected:'button'}),/data-intent="danger"/);
 }
});

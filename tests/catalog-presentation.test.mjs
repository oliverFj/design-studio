import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {getComponents} from '../core/engine.mjs';
import {createComponentFactory} from '../core/components.mjs';
import {createCatalogState,renderComponentCatalog} from '../studio/component-catalog.mjs';
import {renderScrollExample} from '../studio/scroll-example.mjs';
import {renderFileExample} from '../studio/file-example.mjs';
import {dom} from './support/dom.mjs';

const theme=JSON.parse(readFileSync(new URL('../packages/studio-light.json',import.meta.url),'utf8'));
const components=getComponents(theme);
const detail=id=>renderComponentCatalog(theme,{components:{[id]:components[id]},state:{...createCatalogState(),expanded:id},detailOnly:true});

test('variant cards put the demonstration before explanatory text and allocate room for the actual role',()=>{
 for(const [id,size] of [['button','control'],['tree','panel'],['inspector','panel'],['scroll-area','panel'],['data-grid','wide'],['data-table','wide']]){
  const html=detail(id);
  assert.match(html,new RegExp('data-catalog-role="'+id+'" data-preview-size="'+size+'"'));
  for(const card of html.split('<section class="catalog-variant">').slice(1)){
   const title=card.indexOf('class="catalog-variant-title"'),sample=card.indexOf('class="catalog-sample ds-scope"'),description=card.indexOf('<p class="help">');
   assert.ok(title>=0&&sample>title&&description>sample,id+': title, example, explanation');
  }
 }
 const css=readFileSync(new URL('../studio/component-catalog.css',import.meta.url),'utf8');
 assert.doesNotMatch(css,/\.catalog-variant h3\s*\{/,'catalog typography must not replace headings inside the component');
 assert.match(css,/grid-template-rows:subgrid/,'cards share title, demonstration and explanation tracks');
 assert.match(css,/\.catalog-state-table td:has\(\.ds-tree\)\{min-width:26rem\}/,'the scrollable state table reserves a usable tree column');
});

test('narrow tree previews scroll in a named keyboard-accessible frame instead of crushing row labels',()=>{
 const html=detail('tree');
 const frames=[...html.matchAll(/<div class="catalog-sample ds-scope"([^>]*)>/g)];
 assert.equal(frames.length,Object.keys(components.tree.variants).length);
 for(const [,attributes] of frames){
  assert.match(attributes,/data-catalog-frame="tree"/);
  assert.match(attributes,/tabindex="0" role="region"/);
  assert.match(attributes,/aria-label="[^"]+Rul vandret/);
 }
 const css=readFileSync(new URL('../studio/component-catalog.css',import.meta.url),'utf8');
 assert.match(css,/\.catalog-sample\[data-catalog-frame="tree"\]\{align-items:stretch;overflow-x:auto;overscroll-behavior-inline:contain\}/,'overflow starts at the left edge of the local preview');
 assert.match(css,/\.catalog-sample\[data-catalog-frame="tree"\]>\.ds-tree\{min-width:26rem\}/,'a representative tree width is preserved inside the frame');
});

test('scroll demonstrations preserve the real viewport, surface ownership and a fixed card header',()=>{
 const c=createComponentFactory(theme,{document:dom()});
 for(const variant of ['default','contained','body']){
  let root;
  renderScrollExample(theme,'scroll-'+variant,(role,options)=>{root=c(role,options);return '';},variant);
  const scroll=root.matches('.ds-scroll-area')?root:root.querySelector('.ds-scroll-area');
  const viewport=scroll.querySelector('.ds-scroll-area__viewport'),content=viewport.querySelector('.ds-scroll-area__content');
  assert.equal(scroll.children[0],viewport);
  assert.equal(viewport.children[0],content);
  assert.equal(viewport.getAttribute('tabindex'),'0');
  assert.ok(viewport.getAttribute('aria-label'));
  assert.equal(content.querySelectorAll('.ds-label').length,8,'enough real content to scroll in the allocated height');
  if(variant==='contained'){
   const surface=content.querySelector('.ds-card');
   assert.ok(surface.matches('.ds-scroll-area__surface'),'the contained area owns the only outer card surface');
   assert.equal(surface.querySelector('.ds-card__footer'),null,'no empty footer adds an unexplained gap');
  }
  if(variant==='body'){
   assert.ok(root.matches('.ds-card'));
   assert.equal(root.children[0].className,'ds-card__header');
   assert.equal(viewport.contains(root.children[0]),false,'the title stays outside the scrolling viewport');
   assert.equal(root.querySelectorAll('.ds-card').length,0,'the body does not introduce a second card');
  }
 }
 const css=readFileSync(new URL('../studio/component-catalog.css',import.meta.url),'utf8');
 assert.match(css,/\[data-scroll-example\]>\.ds-scroll-area,\[data-scroll-example="body"\]>\.ds-card>\.ds-card__body>\.ds-scroll-area\{height:18rem\}/,'the host allocates a finite scroll height');
});

test('file picker variants describe and enable only the drop interaction they actually offer',()=>{
 const c=createComponentFactory(theme,{document:dom()});
 for(const variant of ['default','drop']){
  const rendered=[];
  renderFileExample(theme,'file-'+variant,(role,options)=>{rendered.push(c(role,options));return '';},variant);
  const upload=rendered[0];
  assert.equal(upload.getAttribute('data-upload-drop'),String(variant==='drop'));
  assert.equal(upload.textContent.includes('slippe dem på fladen'),variant==='drop');
  assert.equal(upload.querySelector('input').getAttribute('type'),'file');
 }
});

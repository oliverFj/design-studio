import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {COMPONENT_LIBRARY} from '../core/library.mjs';
import {CATALOG_CATEGORIES,filterCatalog,renderCatalogBrowser} from '../studio/catalog-browser.mjs';
import {createCatalogState} from '../studio/component-catalog.mjs';
import {CATALOG_ARTWORK_IDS,renderCatalogArtwork} from '../studio/catalog-artwork.mjs';

test('categories cover every role once and search combines category and words',()=>{
 const ids=CATALOG_CATEGORIES.flatMap(([, ,ids])=>ids);
 assert.equal(new Set(ids).size,ids.length);
 assert.deepEqual([...ids].sort(),Object.keys(COMPONENT_LIBRARY).sort());
 assert.deepEqual(Object.keys(filterCatalog(COMPONENT_LIBRARY,{query:'KNAP',category:'actions'})),['action-button','button']);
 assert.deepEqual(Object.keys(filterCatalog(COMPONENT_LIBRARY,{query:'knap',category:'navigation'})),[]);
 assert.deepEqual(Object.keys(filterCatalog(COMPONENT_LIBRARY,{query:'  redigerbart   datagrid '})),['data-grid']);
});

test('every shared role has decorative artwork without nested controls or duplicate identities',()=>{
 assert.deepEqual([...CATALOG_ARTWORK_IDS].sort(),Object.keys(COMPONENT_LIBRARY).sort());
 for(const id of Object.keys(COMPONENT_LIBRARY)){
  const artwork=renderCatalogArtwork(id);
  assert.match(artwork,/aria-hidden="true"/);
  assert.doesNotMatch(artwork,/undefined|\sid=|<(?:button|input|select|textarea|a)\b/);
 }
 assert.equal(renderCatalogArtwork('custom-legacy-role'),'');
 assert.equal(renderCatalogArtwork('__proto__'),'');
});

test('catalog uses Danish name order and a list expands the same component details inline',()=>{
 const components={last:{name:'Åben'},middle:{name:'Øvrige'},first:{name:'Alpha'},ae:{name:'Ændringer'}};
 assert.deepEqual(Object.keys(filterCatalog(components)),['first','ae','middle','last']);
 const theme=JSON.parse(readFileSync(new URL('../packages/studio-light.json',import.meta.url),'utf8'));
 const state={...createCatalogState(),layout:'list'};
 const html=renderCatalogBrowser(theme,{components:{button:COMPONENT_LIBRARY.button,card:COMPONENT_LIBRARY.card},state});
 assert.match(html,/class="catalog-list"/);
 assert.doesNotMatch(html,/class="specimen-preview/);
 assert.ok(html.indexOf('data-browser-open="button"')<html.indexOf('data-browser-open="card"'));
 assert.match(html,/id="catalog-button-toggle" data-browser-open="button"/);
 assert.match(html,/id="catalog-layout-list"[^>]+aria-pressed="true"/);
 state.expanded='button';
 const expanded=renderCatalogBrowser(theme,{components:{button:COMPONENT_LIBRARY.button,card:COMPONENT_LIBRARY.card},state});
 assert.match(expanded,/<li><button[^>]+data-browser-open="button"[^>]+aria-expanded="true"[\s\S]*?catalog-inline-details[\s\S]*?<\/section><\/li>/);
 assert.doesNotMatch(expanded,/Tilbage til biblioteket/);
 assert.equal((expanded.match(/data-catalog-details=/g)||[]).length,1);
 state.layout='cards';
 const grid=renderCatalogBrowser(theme,{components:COMPONENT_LIBRARY,state});
 assert.equal(expanded.match(/<section class="catalog-detail catalog-inline-detail"[\s\S]*?<\/section>/)?.[0],grid.match(/<section class="catalog-detail catalog-inline-detail"[\s\S]*?<\/section>/)?.[0]);
});

test('grid uses illustrated cards and only renders the expanded component with valid associations',()=>{
 const theme=JSON.parse(readFileSync(new URL('../packages/studio-light.json',import.meta.url),'utf8'));
 const components={button:COMPONENT_LIBRARY.button,card:COMPONENT_LIBRARY.card};
 const state=createCatalogState();
 const overview=renderCatalogBrowser(theme,{components,state});
 assert.equal((overview.match(/class="catalog-icon-card"/g)||[]).length,2);
 assert.doesNotMatch(overview,/specimen-preview|data-catalog-details|ds-card__|ds-button/);
 assert.match(overview,/data-browser-open="button"/);
 assert.doesNotMatch(overview,/Grafisk forsøg|catalog-concept-icon/);
 state.expanded='button';
 for(const view of ['variants','states']){
  state.views.button=view;
  const html=renderCatalogBrowser(theme,{components,state});
  assert.doesNotMatch(html,/data-catalog-card=/);
  assert.match(html,/Luk visning/);
  assert.match(html,/aria-expanded="true" aria-controls="catalog-inline-details"/);
  assert.equal((html.match(/data-catalog-details=/g)||[]).length,1);
  const ids=[...html.matchAll(/\sid="([^"]+)"/g)].map(match=>match[1]);
  assert.equal(new Set(ids).size,ids.length);
  for(const [,refs]of html.matchAll(/\b(?:for|aria-labelledby|aria-controls|aria-describedby)="([^"]+)"/g)){
   for(const ref of refs.split(' '))assert.ok(ids.includes(ref),ref);
  }
 }
});

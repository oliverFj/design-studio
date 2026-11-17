import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {mountScene,SCENES} from '../examples/scenes/scene.mjs';
import {buildScenePages} from '../tools/build-scenes.mjs';
import {dom,fire} from './support/dom.mjs';
import {offlineIssues} from '../tools/offline-checks.mjs';
import {generateCSS} from '../core/engine.mjs';
import {resolveThemeMode} from '../core/theme-modes.mjs';

const themes=['aureol','obsidian'].map(id=>JSON.parse(readFileSync(new URL('../packages/'+id+'.json',import.meta.url),'utf8')));
function fixture(sceneId,embedded=false){
 const document=dom(),create=document.createElement.bind(document);
 document.documentElement=create('html');
 document.createElement=tag=>{
  const node=create(tag);node.style.setProperty=(key,value)=>{node.style[key]=value;};
  if(tag==='dialog'){node.showModal=()=>{node.setAttribute('open','');};node.close=()=>{node.removeAttribute('open');fire(node,'close');};}
  return node;
 };
 const root=document.createElement('main'),style=document.createElement('style');document.body.append(root);
 return {document,root,style,controller:mountScene({root,style,themes,sceneId,document,embedded})};
}

test('both spatial scenes retain their light and selected observation when changing palettes',()=>{
 for(const id of Object.keys(SCENES)){
  const {root,style,controller}=fixture(id);
  assert.match(root.querySelector('.scene-brand-mark').innerHTML,/class="stade-mark"/,'spatial pages reuse the approved Stade graphic');
  assert.equal(root.querySelector('.scene-brand').getAttribute('href'),'../../index.html?view=scenes&package='+id);
  const range=root.querySelector('#scene-light-control');range.value='91';fire(range,'input');
  assert.equal(controller.state.intensity,91);assert.equal(root.style['--scene-light'],'0.91');
  controller.setSpace(SCENES[id].spaces[1][0]);
  assert.equal(root.getAttribute('data-space'),SCENES[id].spaces[1][0]);
  const theme=root.querySelector('#scene-theme-control');theme.value=id==='aureol'?'obsidian':'aureol';fire(theme,'change');
  assert.equal(controller.state.intensity,91);assert.equal(root.querySelector('#scene-light-control'),range,'palette changes preserve live input DOM');
  assert.equal(root.getAttribute('data-space'),SCENES[id].spaces[1][0]);assert.match(style.textContent,/--ds-gradient-atmosphere:/);
  const dialog=root.querySelector('dialog'),trigger=root.querySelector('[aria-haspopup="dialog"]');
  fire(trigger,'click');assert.equal(dialog.getAttribute('open'),'');dialog.close();
  assert.equal(dialog.getAttribute('open'),null);
  controller.destroy();assert.equal(root.children.length,0);
 }
});

test('scene outputs are independent executable offline pages with both authored themes',async()=>{
 const pages=await buildScenePages();assert.deepEqual(pages.map(page=>page.id),['aureol','obsidian']);
 for(const {id,html}of pages){assert.deepEqual(offlineIssues(html),[]);assert.ok(html.includes('data-scene="'+id+'"'));assert.doesNotMatch(html,/<script[^>]+src=|<link[^>]+stylesheet/);assert.ok(html.includes('Aureol'));assert.ok(html.includes('Obsidian'));assert.match(html,/showModal/);}
});

test('an embedded material study follows the host palette until a local choice is made',()=>{
 const {root,style,controller}=fixture('aureol',true);
 const source=JSON.parse(readFileSync(new URL('../packages/studio-light.json',import.meta.url),'utf8'));
 const active=resolveThemeMode(source,'mineralnat'), later=resolveThemeMode(source,'light');
 const select=root.querySelector('#scene-theme-control'), range=root.querySelector('#scene-light-control');
 range.value='91';fire(range,'input');
 controller.inheritTheme(active,'mineralnat');
 assert.equal(style.textContent,generateCSS(active));
 assert.equal(select.value,'');
 select.value='obsidian';fire(select,'change');
 controller.inheritTheme(later,'light');
 assert.equal(style.getAttribute('data-theme'),'obsidian');
 select.value='';fire(select,'change');
 assert.equal(style.textContent,generateCSS(later));
 assert.equal(controller.state.intensity,91);
 assert.equal(root.querySelector('#scene-light-control'),range);
 controller.destroy();
});

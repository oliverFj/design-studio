import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {mountSceneGallery,createSceneState} from '../studio/scenes.mjs';
import {resolveThemeMode} from '../core/theme-modes.mjs';
import {dom,fire} from './support/dom.mjs';
import {sendDemoTheme,receiveDemoTheme} from '../studio/demo-theme.mjs';

const theme=id=>{const source=JSON.parse(readFileSync(new URL('../packages/'+id+'.json',import.meta.url),'utf8'));return resolveThemeMode(source,source.defaultMode);};
const choose=(gallery,id)=>{const picker=gallery.element.querySelector('.use-scene-header').querySelector('select');picker.value=id;fire(picker,'change');};

test('the grouped dropdown opens live demos and material studies on the same page',()=>{
 const document=dom(),state=createSceneState(),gallery=mountSceneGallery(theme('studio-light'),{document,state});
 document.body.append(gallery.element);gallery.activate();
 const root=gallery.element;
 const picker=root.querySelector('.use-scene-header').querySelector('select');
 assert.deepEqual(picker.querySelectorAll('optgroup').map(group=>group.getAttribute('label')),['Demoer','Materialestudier']);
 assert.equal(picker.value,'blog');
 picker.focus();
 for(const id of ['blog','shop','editor','overview']){
  choose(gallery,id);
  assert.equal(state.selected,id);
  assert.equal(document.activeElement,picker);
  assert.equal(root.querySelector('[data-case-preview]').getAttribute('data-case-preview'),id);
  assert.ok(root.querySelector('.case-'+id),'the actual '+id+' interface is mounted');
 }
 for(const id of ['aureol','obsidian']){
  choose(gallery,id);
  const frame=root.querySelectorAll('iframe').find(node=>node.getAttribute('hidden')===null);
  assert.equal(frame.getAttribute('src'),'./examples/scenes/'+id+'.html?embedded=1');
 }
 gallery.destroy();assert.equal(document.body.children.length,0);
});

test('case changes and a new theme retain independent drafts while reset only clears the current case',()=>{
 const document=dom(),state=createSceneState();let gallery=mountSceneGallery(theme('studio-light'),{document,state,idPrefix:'case-test'});
 document.body.append(gallery.element);gallery.activate();
 fire(gallery.element.querySelector('[data-blog-category="Materialer"]'),'click');
 choose(gallery,'overview');
 const note=gallery.element.querySelector('textarea');note.value='Bevar min projektnote.';fire(note,'input');
 choose(gallery,'blog');
 assert.equal(state.drafts.blog.category,'Materialer');
 choose(gallery,'overview');
 assert.equal(gallery.element.querySelector('textarea').textContent,'Bevar min projektnote.');
 gallery.destroy();gallery=mountSceneGallery(theme('obsidian'),{document,state,idPrefix:'case-test'});document.body.append(gallery.element);gallery.activate();
 assert.equal(state.selected,'overview');assert.equal(gallery.element.querySelector('textarea').textContent,'Bevar min projektnote.');
 fire(gallery.element.querySelector('[data-reset-use-scene]'),'click');
 assert.notEqual(gallery.element.querySelector('textarea').textContent,'Bevar min projektnote.');
 assert.equal(state.drafts.blog.category,'Materialer');
 assert.equal(document.activeElement,gallery.element.querySelector('[data-reset-use-scene]'));
 gallery.destroy();
});

test('the packaged gallery embeds the live Overblik and keeps it mounted while browsing',()=>{
 const document=dom(),gallery=mountSceneGallery(theme('studio-light'),{document,sceneDemos:{overview:{filename:'overblik.html',name:'Overblik'}}});
 document.body.append(gallery.element);gallery.activate();
 const root=gallery.element;
 assert.equal(gallery.state.selected,'overview');
 const header=root.querySelector('.use-scene-header');
 const links=header.querySelectorAll('a');
 assert.deepEqual(links.map(link=>[link.textContent,link.getAttribute('href')]),[
  ['Åbn i Scene','./examples/stade-scene/index.html?scene=overview'],
 ]);
 const frame=root.querySelector('iframe');
 assert.equal(frame.getAttribute('src'),'./examples/stade-scene/overblik.html?embedded=1');
 assert.equal(header.querySelector('select').value,'overview');
 assert.ok(header.querySelector('[data-reset-use-scene]'));
 choose(gallery,'blog');
 assert.equal(header.querySelector('a'),null);
 assert.ok(root.querySelector('.case-blog'));
 assert.equal(root.querySelector('iframe'),frame);
 assert.equal(frame.getAttribute('hidden'),'');
 choose(gallery,'overview');
 gallery.setTheme(theme('obsidian'));
 assert.equal(root.querySelector('iframe'),frame);
 assert.equal(frame.getAttribute('hidden'),null);
 fire(root.querySelector('[data-reset-use-scene]'),'click');
 assert.notEqual(root.querySelector('iframe'),frame);
 gallery.destroy();
});

test('each packaged app opens its Scene demo and matching editor from the gallery',()=>{
 const document=dom(),sceneDemos={
  overview:{filename:'overblik.html',name:'Overblik'},
  blog:{filename:'blog.html',name:'Blog'},
  shop:{filename:'webshop.html',name:'Webshop'},
  editor:{filename:'editor.html',name:'Editor'},
  route:{filename:'ruteplan.html',name:'Ruteplan'},
 };
 const gallery=mountSceneGallery(theme('studio-light'),{document,sceneDemos});
 document.body.append(gallery.element);gallery.activate();
 const root=gallery.element, header=root.querySelector('.use-scene-header');
 const demoOptions=header.querySelectorAll('optgroup').find(group=>group.getAttribute('label')==='Demoer').querySelectorAll('option');
 assert.deepEqual(demoOptions.map(option=>[option.getAttribute('value'),option.textContent]),Object.entries(sceneDemos).map(([id,demo])=>[id,demo.name]));
 for(const [id,{filename}] of Object.entries(sceneDemos)){
  choose(gallery,id);
  const frames=root.querySelectorAll('iframe').filter(frame=>frame.getAttribute('hidden')===null);
  assert.deepEqual(frames.map(frame=>frame.getAttribute('src')),['./examples/stade-scene/'+filename+'?embedded=1'],id);
  assert.deepEqual(header.querySelectorAll('a').map(link=>[link.textContent,link.getAttribute('href')]),[
   ['Åbn i Scene','./examples/stade-scene/index.html?scene='+id],
  ],id);
  assert.equal(root.querySelector('.case-'+id),null);
 }
 gallery.destroy();
});

test('the embedded theme is received from its own host on HTTP and from the packaged file',()=>{
 for(const [protocol,origin,senderOrigin,targetOrigin] of [
  ['http:','http://127.0.0.1','http://127.0.0.1','http://127.0.0.1'],
  ['file:','null','null','*'],
 ]){
  const parent={}, location={protocol,origin};
  const listeners=new Map(), applied=[];
  const window={parent,location,addEventListener:(key,fn)=>listeners.set(key,fn),removeEventListener:key=>listeners.delete(key)};
  const stop=receiveDemoTheme(window,(theme,mode)=>applied.push([theme,mode]));
  const frame={ownerDocument:{defaultView:{location}},contentWindow:{postMessage(data,origin){
   assert.equal(origin,targetOrigin);
   const receive=listeners.get('message');
   receive({source:{},origin:senderOrigin,data});
   receive({source:parent,origin:'https://elsewhere.example',data});
   receive({source:parent,origin:senderOrigin,data});
  }}};
  const active=theme('obsidian');
  sendDemoTheme(frame,active,'dark');
  assert.deepEqual(applied,[[active,'dark']]);
  stop();
  assert.equal(listeners.size,0);
 }
});

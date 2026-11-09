import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {mountSceneGallery,createSceneState} from '../studio/scenes.mjs';
import {resolveThemeMode} from '../core/theme-modes.mjs';
import {dom,fire} from './support/dom.mjs';

const theme=id=>{const source=JSON.parse(readFileSync(new URL('../packages/'+id+'.json',import.meta.url),'utf8'));return resolveThemeMode(source,source.defaultMode);};

test('the four case choices mount real interfaces and expose both separate material studies',()=>{
 const document=dom(),state=createSceneState(),gallery=mountSceneGallery(theme('studio-light'),{document,state});
 document.body.append(gallery.element);gallery.activate();
 const root=gallery.element;
 for(const id of ['blog','shop','editor','overview']){
  const button=root.querySelector('[data-use-scene="'+id+'"]');fire(button,'click');
  assert.equal(state.selected,id);assert.equal(button.getAttribute('aria-pressed'),'true');
  assert.equal(root.querySelector('[data-case-preview]').getAttribute('data-case-preview'),id);
  assert.ok(root.querySelector('.case-'+id),'the actual '+id+' interface is mounted');
  assert.equal(root.querySelectorAll('[data-use-scene]').filter(node=>node.getAttribute('aria-pressed')==='true').length,1);
 }
 const links=root.querySelectorAll('a');
 for(const id of ['aureol','obsidian'])assert.ok(links.some(link=>link.getAttribute('href')==='./examples/scenes/'+id+'.html'&&link.getAttribute('target')==='_blank'));
 gallery.destroy();assert.equal(document.body.children.length,0);
});

test('case changes and a new theme retain independent drafts while reset only clears the current case',()=>{
 const document=dom(),state=createSceneState();let gallery=mountSceneGallery(theme('studio-light'),{document,state,idPrefix:'case-test'});
 document.body.append(gallery.element);gallery.activate();
 fire(gallery.element.querySelector('[data-blog-category="Materialer"]'),'click');
 fire(gallery.element.querySelector('[data-use-scene="overview"]'),'click');
 const note=gallery.element.querySelector('textarea');note.value='Bevar min projektnote.';fire(note,'input');
 fire(gallery.element.querySelector('[data-use-scene="blog"]'),'click');
 assert.equal(state.drafts.blog.category,'Materialer');
 fire(gallery.element.querySelector('[data-use-scene="overview"]'),'click');
 assert.equal(gallery.element.querySelector('textarea').textContent,'Bevar min projektnote.');
 gallery.destroy();gallery=mountSceneGallery(theme('obsidian'),{document,state,idPrefix:'case-test'});document.body.append(gallery.element);gallery.activate();
 assert.equal(state.selected,'overview');assert.equal(gallery.element.querySelector('textarea').textContent,'Bevar min projektnote.');
 fire(gallery.element.querySelector('[data-reset-use-scene]'),'click');
 assert.notEqual(gallery.element.querySelector('textarea').textContent,'Bevar min projektnote.');
 assert.equal(state.drafts.blog.category,'Materialer');
 assert.equal(document.activeElement,gallery.element.querySelector('[data-reset-use-scene]'));
 gallery.destroy();
});

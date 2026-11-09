import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {mountBlogScene,mountShopScene} from '../studio/scenes/editorial-commerce.mjs';
import {resolveThemeMode} from '../core/theme-modes.mjs';
import {dom,fire} from './support/dom.mjs';

const source=id=>JSON.parse(readFileSync(new URL('../packages/'+id+'.json',import.meta.url),'utf8'));
const theme=(id='studio-light',mode='light')=>resolveThemeMode(source(id),mode);

test('blog filters and article reading survive a theme remount',()=>{
 const document=dom(),state={};let scene=mountBlogScene(theme(),{document,state});document.body.append(scene.element);
 fire(scene.element.querySelector('[data-blog-category="Materialer"]'),'click');
 assert.equal(state.category,'Materialer');assert.match(scene.element.textContent,/Papiret husker hånden/);assert.doesNotMatch(scene.element.textContent,/Når et rum giver plads/);
 fire(scene.element.querySelector('[data-blog-open="papir"]'),'click');assert.equal(state.article,'papir');assert.ok(scene.element.querySelector('[data-blog-back]'));
 scene.destroy();scene.element.remove();scene=mountBlogScene(theme('terminal','dark'),{document,state});document.body.append(scene.element);
 assert.equal(state.article,'papir');assert.match(scene.element.textContent,/Papiret giver modstand/);
 fire(scene.element.querySelector('[data-blog-back]'),'click');assert.equal(state.article,null);assert.equal(state.category,'Materialer');
 scene.destroy();
});

test('shop quantity, product choice and cart totals survive theme changes without checkout effects',()=>{
 const document=dom(),state={},messages=[];let scene=mountShopScene(theme(),{document,state,announce:value=>messages.push(value)});document.body.append(scene.element);
 const quantity=scene.element.querySelector('select');quantity.value='2';fire(quantity,'change');
 fire(scene.element.querySelector('[data-shop-add="feature"]'),'click');assert.equal(state.cart.lamp,2);assert.equal(messages.length,1);
 fire(scene.element.querySelector('[data-shop-cart]'),'click');assert.equal(state.cartOpen,true);assert.match(scene.element.textContent,/1.790/);assert.match(scene.element.textContent,/ingen bestilling eller betaling/);
 scene.destroy();scene.element.remove();scene=mountShopScene(theme('obsidian','dark'),{document,state});document.body.append(scene.element);
 assert.equal(state.cart.lamp,2);assert.equal(state.quantity,'2');assert.equal(state.cartOpen,true);assert.match(scene.element.textContent,/1.790/);
 fire(scene.element.querySelector('[data-shop-product="notebook"]'),'click');assert.equal(state.product,'notebook');assert.equal(state.quantity,'1');
 fire(scene.element.querySelector('[data-shop-add="feature"]'),'click');assert.equal(state.cart.notebook,1);assert.match(scene.element.textContent,/1.935/);
 const remove=scene.element.querySelector('[aria-label="Fjern Orbit bordlampe"]');fire(remove,'click');assert.equal(state.cart.lamp,undefined);assert.match(scene.element.textContent,/145/);
 scene.destroy();
});

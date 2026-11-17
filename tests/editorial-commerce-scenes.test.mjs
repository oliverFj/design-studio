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

test('blog shares edited articles between separate list instances and the reader',()=>{
 const document=dom(),overview=document.createElement('main'),reader=document.createElement('aside');
 document.body.append(overview,reader);
 let articles=[
  {id:'have',title:'Haven',category:'Ude',summary:'Se haven',body:'Første afsnit.'},
  {id:'stue',title:'Stuen',category:'Inde',summary:'Se stuen',body:'Andet afsnit.'},
 ];
 const blog=mountBlogScene(theme(),{
  document,getArticles:()=>articles,
  renderArticleImage(article){
   const image=document.createElement('img');image.setAttribute('alt',article.title);return image;
  },
  renderParts({stories,reader:content}){overview.replaceChildren(...stories);reader.replaceChildren(content);},
 });
 const first=blog.mountList(),second=blog.mountList();
 first.update(undefined);
 first.update({count:1,layout:'list'});
 second.update({startAt:2,count:2,showImage:false});
 assert.match(first.element.textContent,/Haven/);
 assert.doesNotMatch(first.element.textContent,/Stuen/);
 assert.match(second.element.textContent,/Stuen/);
 assert.equal(second.element.querySelector('img'),null);
 fire(overview.querySelector('[data-blog-open="have"]'),'click');
 assert.match(reader.textContent,/Første afsnit/);
 articles=[{...articles[0],title:'Vinterhaven',body:'En ny tekst.'},articles[1]];
 blog.refresh();
 assert.match(first.element.textContent,/Vinterhaven/);
 assert.match(reader.textContent,/En ny tekst/);
 articles=[];
 blog.refresh();
 assert.match(first.element.textContent,/Ingen artikler/);
 assert.match(reader.textContent,/Vælg en artikel/);
 blog.destroy();
});

test('the same article-card layout is rendered for each record and repainted after an edit',()=>{
 const document=dom(),articles=[{id:'rum',title:'Huset',category:'Rum'},{id:'lys',title:'Lampen',category:'Lys'}];
 const blog=mountBlogScene(theme(),{document,getArticles:()=>articles});
 const list=blog.mountList((card,record)=>{
  const section=document.createElement('div');
  section.textContent=card.fields.map(field=>record[field]).join(' / ');
  return section;
 });
 const card={fields:['title','category']};
 list.update({count:2},card);
 assert.deepEqual(list.element.querySelectorAll('.case-blog__story').map(node=>node.textContent),['Huset / Rum','Lampen / Lys']);
 card.fields.reverse();
 list.update({count:2},card);
 assert.deepEqual(list.element.querySelectorAll('.case-blog__story').map(node=>node.textContent),['Rum / Huset','Lys / Lampen']);
 blog.destroy();
});

test('shop quantity, product choice and cart totals survive theme changes without checkout effects',()=>{
 const document=dom(),state={},messages=[];let scene=mountShopScene(theme(),{document,state,announce:value=>messages.push(value)});document.body.append(scene.element);
 const quantity=scene.element.querySelector('select');quantity.value='2';fire(quantity,'change');
 fire(scene.element.querySelector('[data-shop-add="feature"]'),'click');assert.equal(state.cart.lamp,2);assert.equal(messages.length,1);
 assert.equal(scene.element.querySelector('[data-shop-cart]').getAttribute('aria-expanded'),'false');
 fire(scene.element.querySelector('[data-shop-cart]'),'click');assert.equal(state.cartOpen,true);assert.match(scene.element.textContent,/1.790/);assert.match(scene.element.textContent,/ingen bestilling eller betaling/);
 assert.equal(scene.element.querySelector('[data-shop-cart]').getAttribute('aria-expanded'),'true');
 scene.destroy();scene.element.remove();scene=mountShopScene(theme('obsidian','dark'),{document,state});document.body.append(scene.element);
 assert.equal(state.cart.lamp,2);assert.equal(state.quantity,'2');assert.equal(state.cartOpen,true);assert.match(scene.element.textContent,/1.790/);
 fire(scene.element.querySelector('[data-shop-product="notebook"]'),'click');assert.equal(state.product,'notebook');assert.equal(state.quantity,'1');
 fire(scene.element.querySelector('[data-shop-add="feature"]'),'click');assert.equal(state.cart.notebook,1);assert.match(scene.element.textContent,/1.935/);
 const remove=scene.element.querySelector('[aria-label="Fjern Orbit bordlampe"]');fire(remove,'click');assert.equal(state.cart.lamp,undefined);assert.match(scene.element.textContent,/145/);
 scene.destroy();
});

test('catalogue, selected product and cart refresh from the same edited records',()=>{
 const document=dom(),state={};
 let products=[
  {id:'skitse',category:'Papir',title:'Hæfte',material:'Genbrugspapir',description:'Til de første streger',price:49.5,art:'paper'},
  {id:'lys',category:'Lys',title:'Lampe',description:'Ved skrivebordet',price:120,art:'lamp'},
 ];
 const shop=mountShopScene(theme(),{document,state,getProducts:()=>products});
 document.body.append(shop.element);
 assert.equal(shop.selectProduct('lys'),true);
 assert.equal(state.product,'lys');
 assert.equal(shop.selectProduct('skitse'),true);
 const quantity=shop.element.querySelector('select');quantity.value='2';fire(quantity,'change');
 fire(shop.element.querySelector('[data-shop-add="feature"]'),'click');
 fire(shop.element.querySelector('[data-shop-cart]'),'click');
 assert.match(shop.element.querySelector('.case-shop__total').textContent,/99/);
 products=[{...products[0],title:'Skitsehæfte',price:54.95},products[1]];
 shop.refresh();
 assert.match(shop.element.querySelector('.case-shop__feature').textContent,/Skitsehæfte/);
 assert.match(shop.element.querySelector('.case-shop__collection').textContent,/Skitsehæfte/);
 assert.match(shop.element.querySelector('.case-shop__total').textContent,/109,9/);
 products=[];
 shop.refresh();
 assert.match(shop.element.textContent,/Der er ingen varer endnu/);
 assert.equal(state.cart.skitse,undefined);
 shop.destroy();
});

test('shop prepares the cart and supplies the live trigger before Scene navigates',()=>{
 const document=dom(),state={};
 const storefront=document.createElement('main'),cartAct=document.createElement('section');
 document.body.append(storefront);
 const scene=mountShopScene(theme(),{
  document,state,
  renderParts({header,cart,feature}) {
   storefront.replaceChildren(header,feature);
   cartAct.replaceChildren(...(cart?[cart]:[]));
  },
  onOpenCart(trigger) {
   assert.equal(trigger,storefront.querySelector('[data-scene-action="cart"]'));
   assert.ok(cartAct.querySelector('.case-shop__cart'));
   document.body.append(cartAct);
   return true;
  },
 });
 const quantity=storefront.querySelector('select');
 quantity.value='2';fire(quantity,'change');
 fire(storefront.querySelector('[data-shop-add="feature"]'),'click');
 const originalTrigger=storefront.querySelector('[data-shop-cart]');
 fire(originalTrigger,'click');
 const liveTrigger=storefront.querySelector('[data-shop-cart]');
 assert.notEqual(liveTrigger,originalTrigger);
 assert.match(cartAct.textContent,/1.790/);
 assert.equal(document.body.contains(cartAct),true);

 fire(liveTrigger,'click');
 assert.equal(state.cartOpen,true);
 assert.equal(storefront.querySelector('[data-shop-cart]'),liveTrigger);
 fire(cartAct.querySelector('[aria-label="Fjern Orbit bordlampe"]'),'click');
 assert.match(cartAct.textContent,/Din kurv er tom/);
 assert.equal(document.activeElement,cartAct.querySelector('[data-shop-cart-focus]'));
 assert.equal(document.activeElement,cartAct.querySelector('[data-scene-target-focus]'));
 scene.destroy();
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createComponent,renderComponent} from '../core/components.mjs';
import {generateCSS,generateFontCSS,validatePackage} from '../core/engine.mjs';
import {COMPONENT_LIBRARY,COMPONENT_COVERAGE} from '../core/library.mjs';
import {resolveThemeMode} from '../core/theme-modes.mjs';
import {FJORDSIDE_SIGNATURE,SIGNATURE_LICENSE} from '../core/signature-assets.mjs';
import {PUBLIC_THEME_IDS} from '../tools/public-themes.mjs';
import {dom} from './support/dom.mjs';

const theme=id=>JSON.parse(readFileSync(new URL('../packages/'+id+'.json',import.meta.url),'utf8'));

test('signature keeps the approved identity, native navigation and local font in every theme and mode',()=>{
 for(const id of PUBLIC_THEME_IDS)for(const mode of ['light','dark']){
  const pack=resolveThemeMode(theme(id),mode),before=JSON.stringify(pack);
  assert.equal(validatePackage(pack).valid,true,id+'/'+mode);
  const document=dom();
  for(const variant of Object.keys(COMPONENT_LIBRARY.signature.variants)){
   const node=createComponent(pack,'signature',{identity:'fjordside',variant},{document});
   assert.equal(node.tagName,'A');
   assert.equal(node.getAttribute('href'),'https://oliver.fjordside.dk/');
   assert.equal(node.querySelector('.ds-signature__name').textContent,'Oliver Fjordside');
   const logo=node.querySelector('img');
   assert.equal(logo.getAttribute('alt'),'');
   assert.ok(Object.values(FJORDSIDE_SIGNATURE.logos).includes(logo.getAttribute('src')));
   assert.equal(node.getAttribute('data-variant'),variant);
  }
  const css=generateCSS(pack);
  assert.match(css,/\.ds-signature/);
  assert.match(css,/DS Signature Platypi/);
  assert.match(generateFontCSS(pack),/src: url\(data:font\/woff2;base64,/);
  assert.equal(JSON.stringify(pack),before,'rendering does not modify the product theme');
 }
 assert.equal(COMPONENT_COVERAGE.signature.behavior,'native');
});

test('signature assets preserve the approved original bytes and font license',()=>{
 const pack=theme('fjordside');
 for(const tone of ['ink','paper','terracotta'])assert.equal(FJORDSIDE_SIGNATURE.logos[tone],'data:image/svg+xml;base64,'+pack.brand.assets.find(asset=>asset.id==='logo-'+tone).data);
 assert.match(SIGNATURE_LICENSE,/SIL OPEN FONT LICENSE/);
});

test('signature supports other authors, safe URLs and a disabled non-navigating state',()=>{
 const pack=theme('studio-light'),document=dom();
 const node=createComponent(pack,'signature',{name:'En afsender',href:'https://example.com/',logoSrc:FJORDSIDE_SIGNATURE.logos.ink},{document});
 assert.equal(node.querySelector('.ds-signature__name').textContent,'En afsender');
 assert.equal(node.getAttribute('href'),'https://example.com/');
 for(const state of [{disabled:true},{state:'disabled'}]){
  const disabled=createComponent(pack,'signature',{identity:'fjordside',...state},{document});
  assert.equal(disabled.tagName,'SPAN');assert.equal(disabled.getAttribute('href'),null);
  assert.equal(disabled.getAttribute('aria-disabled'),'true');assert.equal(disabled.getAttribute('tabindex'),'-1');
 }
 assert.throws(()=>renderComponent(pack,'signature',{href:'javascript:alert(1)'}),/URL/);
 assert.throws(()=>renderComponent(pack,'signature',{identity:'fjordside',logoTone:'other'}),/logo tone/);
 assert.throws(()=>renderComponent(pack,'signature',{identity:'other'}),/identity/);
 assert.throws(()=>renderComponent(pack,'signature',{name:''}),/non-empty name/);
});

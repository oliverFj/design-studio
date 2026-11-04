import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {generateCSS,generateFontCSS} from '../core/engine.mjs';
import {SIGNATURE_FONT_CSS} from '../core/signature-assets.mjs';

const theme=()=>JSON.parse(readFileSync(new URL('../packages/fjordside.json',import.meta.url),'utf8'));

test('font-only CSS preserves local faces without adopting component or theme rules',()=>{
 const pack=theme(),before=JSON.stringify(pack),fonts=pack.brand.assets.filter(asset=>asset.font);
 const css=generateFontCSS(pack),full=generateCSS(pack);
 assert.equal((css.match(/@font-face/g)??[]).length,fonts.length+1);
 assert.ok(css.includes(SIGNATURE_FONT_CSS));
 for(const asset of fonts){assert.ok(css.includes('data:'+asset.mimeType+';base64,'+asset.data));assert.ok(full.includes(asset.data));}
 assert.doesNotMatch(css,/\.ds-|--ds-|https?:|file:/);
 assert.equal(JSON.stringify(pack),before);
 const noFonts=structuredClone(pack);delete noFonts.brand;
 assert.equal(generateFontCSS(noFonts),SIGNATURE_FONT_CSS,'the shared signature font remains available independently of the theme brand');
});

test('font-only exports use the same package validation as ordinary CSS',()=>{
 const invalid=theme();invalid.brand.assets.find(asset=>asset.font).font.family='Unsafe"; color:red';
 assert.throws(()=>generateFontCSS(invalid));
 const invalidBytes=theme();invalidBytes.brand.assets.find(asset=>asset.font).data='bm90LWEtZm9udA==';
 assert.throws(()=>generateFontCSS(invalidBytes));
});

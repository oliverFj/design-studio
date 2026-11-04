import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {generateCSS,resolveTokens,validatePackage} from '../core/engine.mjs';
import {resolveThemeMode} from '../core/theme-modes.mjs';
import {PUBLIC_THEME_IDS} from '../tools/public-themes.mjs';

const root=new URL('../',import.meta.url),fonts=new URL('assets/fonts/',root);
const read=url=>readFileSync(url),hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const manifest=JSON.parse(read(new URL('manifest.json',fonts)));
const theme=id=>JSON.parse(read(new URL('packages/'+id+'.json',root)));
const family=stack=>stack.split(',')[0].trim().replace(/^["']|["']$/g,'');

test('reviewed local webfonts retain their pinned bytes, licenses and original sources',()=>{
 for(const entry of Object.values(manifest.families)){
  assert.equal(entry.license,'OFL-1.1');
  const license=read(new URL(entry.licenseFile,fonts));
  assert.match(license.toString(),/SIL OPEN FONT LICENSE/);
  assert.equal(license.length,entry.licenseBytes);
  assert.equal(hash(license),entry.licenseSha256);
  assert.match(entry.source,/^https:\/\//);
  for(const face of entry.files){
   const bytes=read(new URL(face.file,fonts));
   assert.equal(bytes.subarray(0,4).toString(),'wOF2',face.file);
   assert.equal(bytes.readUInt32BE(8),bytes.length,face.file+' WOFF2 length');
   assert.equal(bytes.length,face.bytes,face.file+' reviewed size');
   assert.equal(hash(bytes),face.sha256,face.file+' reviewed content');
   if(face.original)assert.equal(hash(read(new URL(face.original,fonts))),face.originalSha256,'The original TTF stays unchanged.');
  }
 }
});

test('every public theme delivers all four primary font roles with embedded WOFF2 and licenses',()=>{
 for(const id of PUBLIC_THEME_IDS)for(const mode of ['light','dark']){
  const pack=resolveThemeMode(theme(id),mode),tokens=resolveTokens(pack),assets=pack.brand.assets;
  assert.deepEqual(validatePackage(pack),{valid:true,errors:[]});
  for(const role of ['body','heading','expressive','mono']){
   const primary=family(tokens['typography.font.'+role]);
   const faces=assets.filter(asset=>asset.font?.family===primary);
   assert.ok(faces.length,id+'/'+mode+'/'+role+' has its primary font, '+primary);
   for(const face of faces){
    assert.equal(face.mimeType,'font/woff2');
    const reviewed=Object.values(manifest.families).find(item=>item.family===primary);
    assert.ok(reviewed,'Family has provenance.');
    assert.ok(reviewed.files.some(item=>item.sha256===hash(Buffer.from(face.data,'base64'))),'Embedded font equals the reviewed local webfont.');
    assert.ok(assets.some(asset=>asset.mimeType==='text/plain'&&Buffer.from(asset.data,'base64').equals(read(new URL(reviewed.licenseFile,fonts)))),'The unchanged font license travels with its theme.');
   }
  }
 }
});

test('actual Castle expressive italics and intermediate control weights have real font faces',()=>{
 for(const id of ['castle-studio','castle-studio-v2']){
  const pack=theme(id),assets=pack.brand.assets;
  const sans=assets.find(asset=>asset.font?.family==='Nunito'&&asset.font.style==='normal');
  assert.equal(sans.font.weight,'200 900');
  const expressive=assets.find(asset=>asset.font?.family==='Alegreya'&&asset.font.style==='italic');
  assert.equal(expressive.font.weight,'500');
  for(const variant of ['expressive','expressive-large'])assert.equal(pack.appearance.heading.variants[variant].styles.fontStyle,'italic');
 }
});

test('Platypi keeps full original coverage and variable axes while reducing its delivery size',()=>{
 const entry=manifest.families.platypi;
 assert.equal(entry.conversion.subset,false);
 for(const face of entry.files){
  const original=statSync(new URL(face.original,fonts)).size;
  assert.ok(face.bytes<original*.45,'WOFF2 saves more than half without subsetting.');
  assert.equal(face.glyphCount,707);
  assert.deepEqual(face.axes,[{tag:'wght',min:300,default:300,max:800}]);
  assert.equal(face.weight,'300 800');
 }
 assert.match(read(new URL('assets/fjordside/fonts.css',root)).toString(),/format\("woff2"\)/);
 assert.doesNotMatch(read(new URL('assets/fjordside/fonts.css',root)).toString(),/\.ttf/);
});

test('theme font CSS is offline and uses WOFF2; decorative system names remain fallbacks only',()=>{
 for(const id of PUBLIC_THEME_IDS){
  const pack=resolveThemeMode(theme(id),'light'),css=generateCSS(pack);
  const rules=css.match(/@font-face\s*\{[^}]+\}/g)??[];
  assert.equal(rules.length,pack.brand.assets.filter(asset=>asset.font).length+1);
  for(const rule of rules){assert.match(rule,/data:font\/woff2;base64,/);assert.match(rule,/format\("woff2"\)/);assert.doesNotMatch(rule,/https?:\/\//);}
 }
});

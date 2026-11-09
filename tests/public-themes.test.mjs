import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir,mkdtemp,writeFile,rm} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {readFileSync} from 'node:fs';
import {discoverThemeIds,PUBLIC_THEME_IDS,LEGACY_THEME_IDS} from '../tools/public-themes.mjs';
import {DEFAULT_TOKENS} from '../core/library.mjs';
import {resolveTokens} from '../core/engine.mjs';
import {resolveThemeMode} from '../core/theme-modes.mjs';

test('theme discovery includes newly added files without a registry change',async t=>{
 const parent=fileURLToPath(new URL('../artifacts/theme-discovery/',import.meta.url));
 await mkdir(parent,{recursive:true});
 const directory=await mkdtemp(path.join(parent,'themes-'));
 t.after(async()=>{assert.ok(directory.startsWith(parent));await rm(directory,{recursive:true,force:true});});
 for(const name of ['existing.json','studio-light.json','README.md'])await writeFile(path.join(directory,name),'{}');
 await mkdir(path.join(directory,'directory.json'));
 assert.deepEqual(discoverThemeIds(directory),['studio-light','existing']);
 await writeFile(path.join(directory,'new-product.json'),'{}');
 assert.deepEqual(discoverThemeIds(directory),['studio-light','existing','new-product']);
 await writeFile(path.join(directory,'bad name.json'),'{}');
 assert.throws(()=>discoverThemeIds(directory),/Ugyldigt temafilnavn/);
});

test('the public collection comes from the canonical packages directory',()=>{
 assert.ok(PUBLIC_THEME_IDS.length>0);
 assert.deepEqual(PUBLIC_THEME_IDS,discoverThemeIds());
 assert.ok(Object.isFrozen(PUBLIC_THEME_IDS));
});

test('retired themes remain available as source files without duplicating public identities',()=>{
 for(const id of LEGACY_THEME_IDS){
  assert.ok(!PUBLIC_THEME_IDS.includes(id),id);
  const source=JSON.parse(readFileSync(new URL('../packages/'+id+'.json',import.meta.url),'utf8'));
  assert.equal(source.id,id);
 }
 assert.ok(PUBLIC_THEME_IDS.includes('nordlys'));
});

test('curated themes share one measurement scale in every colour',()=>{
 const measurement=id=>/^typography\.(size|lineHeight)\.|^space\.|^size\./.test(id);
 const defaults=resolveTokens({schemaVersion:2,id:'measures',name:'Measures',description:'Shared measurements',tokens:{},appearance:{},history:[]});
 const ids=Object.keys(DEFAULT_TOKENS).filter(measurement);
 for(const id of PUBLIC_THEME_IDS){
  const source=JSON.parse(readFileSync(new URL('../packages/'+id+'.json',import.meta.url),'utf8'));
  assert.deepEqual(Object.keys(source.tokens).filter(measurement),[],id+' does not redefine measurements');
  assert.ok(Object.values(source.modes).some(mode=>mode.colorScheme==='light'),id+' light');
  assert.ok(Object.values(source.modes).some(mode=>mode.colorScheme==='dark'),id+' dark');
  for(const [modeId,mode]of Object.entries(source.modes)){
   const actual=resolveTokens(resolveThemeMode(source,modeId));
   for(const tokenId of ids)assert.equal(actual[tokenId],defaults[tokenId],id+'/'+modeId+' '+tokenId);
   assert.ok(Object.values(mode.tokens).every(token=>['color','gradient','shadow'].includes(token.$type)),id+'/'+modeId+' colours only');
  }
 }
});

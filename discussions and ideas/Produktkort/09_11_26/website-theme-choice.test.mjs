import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {colorChoice,restoreThemeChoice} from '../src/theme-choice.mjs';

const site=JSON.parse(await readFile(new URL('../content/site.json',import.meta.url),'utf8'));
const themes=await Promise.all(site.themeIds.map(async id=>{
 const pack=JSON.parse(await readFile(new URL(id==='fjordside'?'../design/design.json':`../design/themes/${id}.json`,import.meta.url),'utf8'));
 return {id:pack.id,defaultMode:pack.defaultMode,modes:pack.modes};
}));
test('retired themes restore the corresponding curated colour',()=>{
 for(const [old,id,light,dark] of [['atelier','prisme','solsten','gloed'],['kyst','studio-light','mineral','mineralnat'],['midnight-editorial','vaerk','kobber','kobbernat'],['nocturne','studio-light','blomme','blommenat'],['castle-studio-v2','castle-studio','light','dark']]){
  assert.ok(!site.themeIds.includes(old));
  for(const [mode,expected] of [['light',light],['dark',dark]]){const restored=restoreThemeChoice(themes,old,mode);assert.equal(restored.theme.id,id);assert.equal(restored.colors[id],expected);}
 }
});
test('named themes use authored defaults rather than invented light/dark modes',()=>{
 assert.equal(colorChoice(themes.find(t=>t.id==='bauhaus'),'dark'),'solgul');
 assert.equal(colorChoice(themes.find(t=>t.id==='terminal'),undefined),'dark');
 assert.equal(colorChoice(themes.find(t=>t.id==='obsidian'),'missing'),'dark');
 assert.equal(restoreThemeChoice(themes,'missing').theme.id,'fjordside');
});
test('remembered colours stay separate for each theme and stale values are discarded',()=>{
 const restored=restoreThemeChoice(themes,'riso','light',{'riso':'fuchsia','studio-light':'mineralnat','terminal':'missing','unknown':'light'});
 assert.equal(restored.colors.riso,'fuchsia');assert.equal(restored.colors['studio-light'],'mineralnat');
 assert.ok(!Object.hasOwn(restored.colors,'terminal'));assert.ok(!Object.hasOwn(restored.colors,'unknown'));
 assert.doesNotThrow(()=>restoreThemeChoice(themes,'riso','light',null));
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir,mkdtemp,writeFile,rm} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {discoverThemeIds,PUBLIC_THEME_IDS} from '../tools/public-themes.mjs';

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
